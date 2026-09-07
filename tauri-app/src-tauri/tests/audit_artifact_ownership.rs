use std::sync::{Arc, Barrier, Mutex};
use std::thread;

use tauri_app::artifact_ownership::{
    AccountingBucket, ArtifactAccounting, ArtifactClass, ArtifactRegistry, CapabilityKind, GroupId,
    GroupMetadata, OwnershipError, ReclaimCandidate, ReclaimCompletion, ReclaimOutcome,
    RegisteredGroup, ReleaseOutcome,
};

fn registry() -> ArtifactRegistry {
    ArtifactRegistry::new().expect("native registry")
}

fn register(registry: &mut ArtifactRegistry, class: ArtifactClass, bytes: u64) -> RegisteredGroup {
    registry
        .register_group(GroupMetadata {
            class,
            resident_bytes: bytes,
        })
        .expect("register group")
}

fn release_initial(registry: &mut ArtifactRegistry, group: RegisteredGroup) {
    assert_eq!(
        registry.release(group.group, group.initial_lease),
        Ok(ReleaseOutcome::Released)
    );
}

fn candidate_for(
    registry: &ArtifactRegistry,
    class: ArtifactClass,
    group: GroupId,
) -> ReclaimCandidate {
    registry
        .reclaim_candidates(class)
        .into_iter()
        .find(|candidate| candidate.group_id() == group)
        .expect("eligible group")
}

fn bucket(groups: u64, bytes: u128) -> AccountingBucket {
    AccountingBucket { groups, bytes }
}

#[test]
fn imp_193_group_bytes_are_charged_once_across_exact_leases_and_reclaim() {
    let mut registry = registry();
    let group = register(&mut registry, ArtifactClass::TransientOutput, 48_000);
    let second_lease = registry.acquire(group.group).expect("second lease");

    assert_eq!(
        registry.accounting(),
        ArtifactAccounting {
            resident: bucket(1, 48_000),
            live_owned: bucket(1, 48_000),
            active_leases: 2,
            ..ArtifactAccounting::default()
        }
    );
    assert_eq!(
        registry.release(group.group, group.initial_lease),
        Ok(ReleaseOutcome::Released)
    );
    assert!(registry
        .reclaim_candidates(ArtifactClass::TransientOutput)
        .is_empty());
    assert_eq!(registry.accounting().resident.bytes, 48_000);
    assert_eq!(registry.accounting().active_leases, 1);

    assert_eq!(
        registry.release(group.group, second_lease),
        Ok(ReleaseOutcome::Released)
    );
    let candidate = candidate_for(&registry, ArtifactClass::TransientOutput, group.group);
    let ticket = registry.claim_reclaim(candidate).expect("claim");
    assert_eq!(registry.accounting().claimed, bucket(1, 48_000));
    assert_eq!(registry.accounting().resident, bucket(1, 48_000));
    assert_eq!(
        registry.finish_reclaim(group.group, ticket, ReclaimOutcome::Removed),
        Ok(ReclaimCompletion::Removed)
    );
    assert_eq!(registry.accounting(), ArtifactAccounting::default());
}

#[test]
fn imp_193_release_and_reclaim_capabilities_are_exact_and_idempotent() {
    let mut registry = registry();
    let first = register(&mut registry, ArtifactClass::TransientOutput, 10);
    let second = register(&mut registry, ArtifactClass::Staging, 20);

    assert_eq!(
        registry.release(second.group, first.initial_lease),
        Err(OwnershipError::LeaseGroupMismatch)
    );
    assert_eq!(registry.accounting().active_leases, 2);
    release_initial(&mut registry, first);
    assert_eq!(
        registry.release(first.group, first.initial_lease),
        Ok(ReleaseOutcome::AlreadyReleased)
    );
    assert_eq!(registry.accounting().eligible, bucket(1, 10));
    assert_eq!(registry.accounting().live_owned, bucket(1, 20));

    let stale_candidate = candidate_for(&registry, ArtifactClass::TransientOutput, first.group);
    let temporary = registry.acquire(first.group).expect("reacquire");
    assert_eq!(
        registry.claim_reclaim(stale_candidate),
        Err(OwnershipError::GroupOwned)
    );
    registry.release(first.group, temporary).expect("release");
    assert_eq!(
        registry.claim_reclaim(stale_candidate),
        Err(OwnershipError::StaleReclaimCandidate)
    );

    let ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::TransientOutput,
            first.group,
        ))
        .expect("claim");
    registry
        .finish_reclaim(first.group, ticket, ReclaimOutcome::Removed)
        .expect("remove");
    assert_eq!(
        registry.finish_reclaim(first.group, ticket, ReclaimOutcome::Removed),
        Err(OwnershipError::RetiredReclaimTicket)
    );
    assert_eq!(
        registry.acquire(first.group),
        Err(OwnershipError::UnknownGroup)
    );
    assert_eq!(
        registry.release(first.group, first.initial_lease),
        Ok(ReleaseOutcome::AlreadyReleased)
    );
    assert_eq!(
        registry.claim_reclaim(stale_candidate),
        Err(OwnershipError::UnknownGroup)
    );
    assert_eq!(registry.accounting().resident, bucket(1, 20));
}

#[test]
fn imp_193_acquire_winning_before_claim_protects_resident_bytes() {
    let mut initial = registry();
    let group = register(&mut initial, ArtifactClass::TransientOutput, 31);
    release_initial(&mut initial, group);
    let candidate = candidate_for(&initial, ArtifactClass::TransientOutput, group.group);
    let shared = Arc::new(Mutex::new(initial));
    let acquired = Arc::new(Barrier::new(2));

    let acquire_thread = {
        let shared = Arc::clone(&shared);
        let acquired = Arc::clone(&acquired);
        thread::spawn(move || {
            let result = shared.lock().expect("registry lock").acquire(group.group);
            acquired.wait();
            result
        })
    };
    let claim_thread = {
        let shared = Arc::clone(&shared);
        thread::spawn(move || {
            acquired.wait();
            shared
                .lock()
                .expect("registry lock")
                .claim_reclaim(candidate)
        })
    };

    assert!(acquire_thread.join().expect("acquire thread").is_ok());
    assert_eq!(
        claim_thread.join().expect("claim thread"),
        Err(OwnershipError::GroupOwned)
    );
    let accounting = shared.lock().expect("registry lock").accounting();
    assert_eq!(accounting.live_owned, bucket(1, 31));
    assert_eq!(accounting.resident, bucket(1, 31));
}

#[test]
fn imp_193_claim_winning_blocks_acquire_until_failed_reclaim_rolls_back() {
    let mut initial = registry();
    let group = register(&mut initial, ArtifactClass::TransientOutput, 37);
    release_initial(&mut initial, group);
    let candidate = candidate_for(&initial, ArtifactClass::TransientOutput, group.group);
    let shared = Arc::new(Mutex::new(initial));
    let claimed = Arc::new(Barrier::new(2));
    let blocked = Arc::new(Barrier::new(2));
    let restored = Arc::new(Barrier::new(2));

    let claim_thread = {
        let shared = Arc::clone(&shared);
        let claimed = Arc::clone(&claimed);
        let blocked = Arc::clone(&blocked);
        let restored = Arc::clone(&restored);
        thread::spawn(move || {
            let ticket = shared
                .lock()
                .expect("registry lock")
                .claim_reclaim(candidate);
            claimed.wait();
            blocked.wait();
            let completion = ticket.and_then(|ticket| {
                shared.lock().expect("registry lock").finish_reclaim(
                    group.group,
                    ticket,
                    ReclaimOutcome::Failed,
                )
            });
            restored.wait();
            completion
        })
    };
    let acquire_thread = {
        let shared = Arc::clone(&shared);
        thread::spawn(move || {
            claimed.wait();
            let first = shared.lock().expect("registry lock").acquire(group.group);
            blocked.wait();
            restored.wait();
            let second = shared.lock().expect("registry lock").acquire(group.group);
            (first, second)
        })
    };

    assert_eq!(
        claim_thread.join().expect("claim thread"),
        Ok(ReclaimCompletion::Restored)
    );
    let (blocked_result, restored_result) = acquire_thread.join().expect("acquire thread");
    assert_eq!(blocked_result, Err(OwnershipError::ReclaimInProgress));
    assert!(restored_result.is_ok());
    assert_eq!(
        shared
            .lock()
            .expect("registry lock")
            .accounting()
            .live_owned,
        bucket(1, 37)
    );
}

#[test]
fn imp_193_failed_reclaim_retries_with_a_new_ticket_and_rejects_stale_completion() {
    let mut registry = registry();
    let group = register(&mut registry, ArtifactClass::Staging, 41);
    release_initial(&mut registry, group);
    let first_ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::Staging,
            group.group,
        ))
        .expect("first claim");
    assert_eq!(
        registry.finish_reclaim(group.group, first_ticket, ReclaimOutcome::Failed),
        Ok(ReclaimCompletion::Restored)
    );
    assert_eq!(registry.accounting().eligible, bucket(1, 41));

    let second_ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::Staging,
            group.group,
        ))
        .expect("second claim");
    assert_ne!(first_ticket, second_ticket);
    assert_eq!(
        registry.finish_reclaim(group.group, first_ticket, ReclaimOutcome::Removed),
        Err(OwnershipError::RetiredReclaimTicket)
    );
    assert_eq!(registry.accounting().claimed, bucket(1, 41));
    registry
        .finish_reclaim(group.group, second_ticket, ReclaimOutcome::Failed)
        .expect("second rollback");
    let lease = registry.acquire(group.group).expect("reacquire");
    assert_eq!(
        registry.finish_reclaim(group.group, second_ticket, ReclaimOutcome::Removed),
        Err(OwnershipError::RetiredReclaimTicket)
    );
    assert_eq!(registry.accounting().live_owned, bucket(1, 41));
    registry.release(group.group, lease).expect("final release");
}

#[test]
fn imp_193_backend_instances_reject_every_foreign_capability_kind() {
    let mut first_registry = registry();
    let mut second_registry = registry();
    assert_ne!(first_registry.backend_id(), second_registry.backend_id());
    let first = register(&mut first_registry, ArtifactClass::TransientOutput, 13);
    let second = register(&mut second_registry, ArtifactClass::TransientOutput, 13);
    release_initial(&mut first_registry, first);
    release_initial(&mut second_registry, second);
    let first_candidate =
        candidate_for(&first_registry, ArtifactClass::TransientOutput, first.group);
    let second_candidate = candidate_for(
        &second_registry,
        ArtifactClass::TransientOutput,
        second.group,
    );
    let first_ticket = first_registry
        .claim_reclaim(first_candidate)
        .expect("claim");
    let second_ticket = second_registry
        .claim_reclaim(second_candidate)
        .expect("claim");
    let expected = first_registry.accounting();

    assert_eq!(
        first_registry.acquire(second.group),
        Err(OwnershipError::ForeignBackend {
            capability: CapabilityKind::Group,
        })
    );
    assert_eq!(
        first_registry.release(first.group, second.initial_lease),
        Err(OwnershipError::ForeignBackend {
            capability: CapabilityKind::Lease,
        })
    );
    assert_eq!(
        first_registry.claim_reclaim(second_candidate),
        Err(OwnershipError::ForeignBackend {
            capability: CapabilityKind::ReclaimCandidate,
        })
    );
    assert_eq!(
        first_registry.finish_reclaim(first.group, second_ticket, ReclaimOutcome::Removed),
        Err(OwnershipError::ForeignBackend {
            capability: CapabilityKind::ReclaimTicket,
        })
    );
    assert_eq!(first_registry.accounting(), expected);
    first_registry
        .finish_reclaim(first.group, first_ticket, ReclaimOutcome::Failed)
        .expect("restore own group");
}
