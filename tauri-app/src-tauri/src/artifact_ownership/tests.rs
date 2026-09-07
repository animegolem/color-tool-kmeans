use std::num::NonZeroU64;

use super::*;

fn metadata(bytes: u64) -> GroupMetadata {
    GroupMetadata {
        class: ArtifactClass::TransientOutput,
        resident_bytes: bytes,
    }
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
    registry
        .release(group.group, group.initial_lease)
        .expect("release initial lease");
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
fn imp_193_identity_exhaustion_is_checked_and_registration_is_transactional() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    let maximum = NonZeroU64::new(u64::MAX).expect("nonzero maximum");
    registry.next_group.next = Some(maximum);
    registry.next_lease.next = None;

    assert_eq!(
        registry.register_group(metadata(1)),
        Err(OwnershipError::IdExhausted {
            capability: CapabilityKind::Lease,
        })
    );
    assert_eq!(registry.next_group.next, Some(maximum));

    registry.next_lease.next = Some(maximum);
    registry.register_group(metadata(1)).expect("last IDs");
    assert_eq!(registry.next_group.next, None);
    assert_eq!(registry.next_lease.next, None);
    assert_eq!(
        registry.register_group(metadata(1)),
        Err(OwnershipError::IdExhausted {
            capability: CapabilityKind::Group,
        })
    );
}

#[test]
fn imp_193_acquire_and_claim_exhaustion_leave_eligible_state_unchanged() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    let registered = registry.register_group(metadata(7)).expect("group");
    registry
        .release(registered.group, registered.initial_lease)
        .expect("release");
    let expected = registry.accounting();

    registry.next_lease.next = None;
    assert_eq!(
        registry.acquire(registered.group),
        Err(OwnershipError::IdExhausted {
            capability: CapabilityKind::Lease,
        })
    );
    assert_eq!(registry.accounting(), expected);

    let candidate = registry.reclaim_candidates(ArtifactClass::TransientOutput)[0];
    registry.next_ticket.next = None;
    assert_eq!(
        registry.claim_reclaim(candidate),
        Err(OwnershipError::IdExhausted {
            capability: CapabilityKind::ReclaimTicket,
        })
    );
    assert_eq!(registry.accounting(), expected);
    assert_eq!(
        registry.reclaim_candidates(ArtifactClass::TransientOutput),
        vec![candidate]
    );
}

#[test]
fn imp_193_never_issued_same_backend_capabilities_are_rejected() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    let registered = registry.register_group(metadata(3)).expect("group");
    let unknown = NonZeroU64::new(99).expect("nonzero");
    let unknown_group = GroupId {
        backend: registry.backend,
        sequence: unknown,
    };
    let unknown_lease = LeaseId {
        backend: registry.backend,
        sequence: unknown,
    };
    let unknown_ticket = ReclaimTicket {
        backend: registry.backend,
        group_sequence: registered.group.sequence,
        sequence: unknown,
    };

    assert_eq!(
        registry.acquire(unknown_group),
        Err(OwnershipError::UnknownGroup)
    );
    assert_eq!(
        registry.release(registered.group, unknown_lease),
        Err(OwnershipError::UnknownLease)
    );
    assert_eq!(
        registry.finish_reclaim(registered.group, unknown_ticket, ReclaimOutcome::Removed),
        Err(OwnershipError::UnknownReclaimTicket)
    );
}

#[test]
fn imp_193_wrong_ticket_and_independent_groups_do_not_cross_mutate() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    let first = register(&mut registry, ArtifactClass::TransientOutput, 11);
    let second = register(&mut registry, ArtifactClass::Staging, 23);
    release_initial(&mut registry, first);
    release_initial(&mut registry, second);
    let first_ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::TransientOutput,
            first.group,
        ))
        .expect("first claim");
    let second_ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::Staging,
            second.group,
        ))
        .expect("second claim");

    assert_eq!(
        registry.finish_reclaim(first.group, second_ticket, ReclaimOutcome::Removed),
        Err(OwnershipError::ReclaimTicketGroupMismatch)
    );
    assert_eq!(registry.accounting().claimed, bucket(2, 34));
    registry
        .finish_reclaim(first.group, first_ticket, ReclaimOutcome::Removed)
        .expect("remove first");
    assert_eq!(registry.accounting().claimed, bucket(1, 23));
    registry
        .finish_reclaim(second.group, second_ticket, ReclaimOutcome::Failed)
        .expect("restore second");
    assert_eq!(registry.accounting().eligible, bucket(1, 23));
}

#[test]
fn imp_193_retention_selection_is_class_explicit_for_persistent_groups() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    let transient = register(&mut registry, ArtifactClass::TransientOutput, 5);
    let staging = register(&mut registry, ArtifactClass::Staging, 7);
    let clipboard = register(&mut registry, ArtifactClass::Clipboard, 11);
    let snapshot = register(&mut registry, ArtifactClass::Snapshot, 13);
    for group in [transient, staging, clipboard, snapshot] {
        release_initial(&mut registry, group);
    }

    assert_eq!(
        registry.reclaim_candidates(ArtifactClass::TransientOutput),
        vec![candidate_for(
            &registry,
            ArtifactClass::TransientOutput,
            transient.group
        )]
    );
    assert_eq!(
        registry.reclaim_candidates(ArtifactClass::Clipboard)[0].group_id(),
        clipboard.group
    );
    assert_eq!(
        registry.reclaim_candidates(ArtifactClass::Snapshot)[0].group_id(),
        snapshot.group
    );
    let transient_ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::TransientOutput,
            transient.group,
        ))
        .expect("claim transient");
    registry
        .finish_reclaim(transient.group, transient_ticket, ReclaimOutcome::Removed)
        .expect("remove transient");
    assert_eq!(
        registry.accounting_for(ArtifactClass::Clipboard).resident,
        bucket(1, 11)
    );
    assert_eq!(
        registry.accounting_for(ArtifactClass::Snapshot).resident,
        bucket(1, 13)
    );
    assert_eq!(
        registry.accounting_for(ArtifactClass::Staging).resident,
        bucket(1, 7)
    );
}

#[test]
fn imp_193_accounting_is_exact_for_overflow_sized_and_zero_byte_groups() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    let maximum_one = register(&mut registry, ArtifactClass::TransientOutput, u64::MAX);
    let maximum_two = register(&mut registry, ArtifactClass::TransientOutput, u64::MAX);
    let nine = register(&mut registry, ArtifactClass::TransientOutput, 9);
    let zero = register(&mut registry, ArtifactClass::Snapshot, 0);
    let twice_max_plus_nine = 2 * u128::from(u64::MAX) + 9;

    assert_eq!(
        registry.accounting().resident,
        bucket(4, twice_max_plus_nine)
    );
    for group in [maximum_one, maximum_two, nine, zero] {
        release_initial(&mut registry, group);
    }
    assert_eq!(
        registry.accounting().eligible,
        bucket(4, twice_max_plus_nine)
    );
    for (group, expected_groups, expected_bytes) in [
        (maximum_one, 3, u128::from(u64::MAX) + 9),
        (maximum_two, 2, 9),
    ] {
        let ticket = registry
            .claim_reclaim(candidate_for(
                &registry,
                ArtifactClass::TransientOutput,
                group.group,
            ))
            .expect("claim maximum");
        registry
            .finish_reclaim(group.group, ticket, ReclaimOutcome::Removed)
            .expect("remove maximum");
        assert_eq!(
            registry.accounting().resident,
            bucket(expected_groups, expected_bytes)
        );
    }
    assert_eq!(
        registry.accounting_for(ArtifactClass::Snapshot).eligible,
        bucket(1, 0)
    );
    let zero_lease = registry
        .acquire(zero.group)
        .expect("acquire zero-byte group");
    assert_eq!(
        registry.accounting_for(ArtifactClass::Snapshot).live_owned,
        bucket(1, 0)
    );
    registry
        .release(zero.group, zero_lease)
        .expect("release zero-byte group");
}

#[test]
fn imp_193_mixed_accounting_separates_owned_eligible_and_claimed_bytes() {
    let mut registry = ArtifactRegistry::new().expect("registry");
    register(&mut registry, ArtifactClass::TransientOutput, 60);
    let eligible = register(&mut registry, ArtifactClass::Staging, 20);
    let claimed = register(&mut registry, ArtifactClass::Staging, 10);
    let clipboard = register(&mut registry, ArtifactClass::Clipboard, 30);
    for group in [eligible, claimed, clipboard] {
        release_initial(&mut registry, group);
    }
    let ticket = registry
        .claim_reclaim(candidate_for(
            &registry,
            ArtifactClass::Staging,
            claimed.group,
        ))
        .expect("claim staging");

    assert_eq!(
        registry.accounting(),
        ArtifactAccounting {
            resident: bucket(4, 120),
            live_owned: bucket(1, 60),
            eligible: bucket(2, 50),
            claimed: bucket(1, 10),
            active_leases: 1,
        }
    );
    assert_eq!(
        registry.accounting_for(ArtifactClass::Staging),
        ArtifactAccounting {
            resident: bucket(2, 30),
            eligible: bucket(1, 20),
            claimed: bucket(1, 10),
            ..ArtifactAccounting::default()
        }
    );
    registry
        .finish_reclaim(claimed.group, ticket, ReclaimOutcome::Failed)
        .expect("restore claimed group");
    assert_eq!(registry.accounting().eligible, bucket(3, 60));
}
