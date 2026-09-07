mod types;

use std::collections::BTreeMap;
use std::num::NonZeroU64;

use rand::{rngs::OsRng, RngCore};
use types::{
    GroupRecord, GroupState, IdAllocator, LeaseRecord, LeaseState, TicketRecord, TicketState,
};

pub use types::{
    AccountingBucket, ArtifactAccounting, ArtifactClass, BackendInstanceId, CapabilityKind,
    GroupId, GroupMetadata, LeaseId, OwnershipError, ReclaimCandidate, ReclaimCompletion,
    ReclaimOutcome, ReclaimTicket, RegisteredGroup, ReleaseOutcome,
};

/// In-memory authority for resident artifact groups and their exact owners.
///
/// This registry performs no filesystem or lifecycle work. Callers serialize
/// mutation and keep any future I/O outside the registry lock.
pub struct ArtifactRegistry {
    backend: BackendInstanceId,
    next_group: IdAllocator,
    next_lease: IdAllocator,
    next_ticket: IdAllocator,
    groups: BTreeMap<NonZeroU64, GroupRecord>,
    leases: BTreeMap<NonZeroU64, LeaseRecord>,
    tickets: BTreeMap<NonZeroU64, TicketRecord>,
}

impl ArtifactRegistry {
    pub fn new() -> Result<Self, OwnershipError> {
        let mut backend = [0_u8; 32];
        OsRng
            .try_fill_bytes(&mut backend)
            .map_err(|_| OwnershipError::BackendIdentityUnavailable)?;

        Ok(Self {
            backend: BackendInstanceId(backend),
            next_group: IdAllocator::new(),
            next_lease: IdAllocator::new(),
            next_ticket: IdAllocator::new(),
            groups: BTreeMap::new(),
            leases: BTreeMap::new(),
            tickets: BTreeMap::new(),
        })
    }

    pub fn backend_id(&self) -> BackendInstanceId {
        self.backend
    }

    /// Registers trusted-native complete-group metadata and its first owner as
    /// one atomic state transition.
    pub fn register_group(
        &mut self,
        metadata: GroupMetadata,
    ) -> Result<RegisteredGroup, OwnershipError> {
        let group_sequence = self.next_group.peek(CapabilityKind::Group)?;
        let lease_sequence = self.next_lease.peek(CapabilityKind::Lease)?;

        self.next_group.commit();
        self.next_lease.commit();
        self.groups.insert(
            group_sequence,
            GroupRecord {
                metadata,
                state: GroupState::Resident { active_leases: 1 },
                eligibility_revision: 0,
            },
        );
        self.leases.insert(
            lease_sequence,
            LeaseRecord {
                group_sequence,
                state: LeaseState::Active,
            },
        );

        Ok(RegisteredGroup {
            group: GroupId {
                backend: self.backend,
                sequence: group_sequence,
            },
            initial_lease: LeaseId {
                backend: self.backend,
                sequence: lease_sequence,
            },
        })
    }

    pub fn acquire(&mut self, group: GroupId) -> Result<LeaseId, OwnershipError> {
        self.backend.require(group.backend, CapabilityKind::Group)?;
        let state = self
            .groups
            .get(&group.sequence)
            .ok_or(OwnershipError::UnknownGroup)?
            .state;
        let active_leases = match state {
            GroupState::Resident { active_leases } => active_leases,
            GroupState::Reclaiming { .. } => return Err(OwnershipError::ReclaimInProgress),
        };
        let lease_sequence = self.next_lease.peek(CapabilityKind::Lease)?;
        let next_active = active_leases
            .checked_add(1)
            .expect("active leases cannot exceed all issued lease identities");

        self.next_lease.commit();
        self.leases.insert(
            lease_sequence,
            LeaseRecord {
                group_sequence: group.sequence,
                state: LeaseState::Active,
            },
        );
        self.groups
            .get_mut(&group.sequence)
            .expect("group was validated before lease allocation")
            .state = GroupState::Resident {
            active_leases: next_active,
        };

        Ok(LeaseId {
            backend: self.backend,
            sequence: lease_sequence,
        })
    }

    pub fn release(
        &mut self,
        group: GroupId,
        lease: LeaseId,
    ) -> Result<ReleaseOutcome, OwnershipError> {
        self.backend.require(group.backend, CapabilityKind::Group)?;
        self.backend.require(lease.backend, CapabilityKind::Lease)?;

        let lease_record = self
            .leases
            .get(&lease.sequence)
            .ok_or(OwnershipError::UnknownLease)?;
        if lease_record.group_sequence != group.sequence {
            return Err(OwnershipError::LeaseGroupMismatch);
        }
        if lease_record.state == LeaseState::Released {
            return Ok(ReleaseOutcome::AlreadyReleased);
        }

        let group_record = self
            .groups
            .get_mut(&group.sequence)
            .ok_or(OwnershipError::UnknownGroup)?;
        let active_leases = match group_record.state {
            GroupState::Resident { active_leases } => active_leases,
            GroupState::Reclaiming { .. } => {
                unreachable!("a reclaiming group cannot have an active lease")
            }
        };
        let next_active = active_leases
            .checked_sub(1)
            .expect("an active lease implies a positive group lease count");

        self.leases
            .get_mut(&lease.sequence)
            .expect("lease was validated above")
            .state = LeaseState::Released;
        if next_active == 0 {
            group_record.eligibility_revision = group_record
                .eligibility_revision
                .checked_add(1)
                .expect("lease and ticket identity bounds keep revisions below u128::MAX");
        }
        group_record.state = GroupState::Resident {
            active_leases: next_active,
        };

        Ok(ReleaseOutcome::Released)
    }

    /// Returns capabilities only for zero-owner groups in the requested class.
    pub fn reclaim_candidates(&self, class: ArtifactClass) -> Vec<ReclaimCandidate> {
        self.groups
            .iter()
            .filter_map(|(sequence, record)| match record.state {
                GroupState::Resident { active_leases: 0 } if record.metadata.class == class => {
                    Some(ReclaimCandidate {
                        backend: self.backend,
                        group_sequence: *sequence,
                        eligibility_revision: record.eligibility_revision,
                        class,
                    })
                }
                _ => None,
            })
            .collect()
    }

    /// Atomically excludes acquisition and returns a ticket for future I/O.
    pub fn claim_reclaim(
        &mut self,
        candidate: ReclaimCandidate,
    ) -> Result<ReclaimTicket, OwnershipError> {
        self.backend
            .require(candidate.backend, CapabilityKind::ReclaimCandidate)?;
        let record = self
            .groups
            .get(&candidate.group_sequence)
            .ok_or(OwnershipError::UnknownGroup)?;
        match record.state {
            GroupState::Resident { active_leases: 0 }
                if record.metadata.class == candidate.class
                    && record.eligibility_revision == candidate.eligibility_revision => {}
            GroupState::Resident { active_leases: 0 } => {
                return Err(OwnershipError::StaleReclaimCandidate)
            }
            GroupState::Resident { .. } => return Err(OwnershipError::GroupOwned),
            GroupState::Reclaiming { .. } => return Err(OwnershipError::ReclaimInProgress),
        }
        let ticket_sequence = self.next_ticket.peek(CapabilityKind::ReclaimTicket)?;

        self.next_ticket.commit();
        self.tickets.insert(
            ticket_sequence,
            TicketRecord {
                group_sequence: candidate.group_sequence,
                state: TicketState::Active,
            },
        );
        self.groups
            .get_mut(&candidate.group_sequence)
            .expect("candidate group was validated above")
            .state = GroupState::Reclaiming { ticket_sequence };

        Ok(ReclaimTicket {
            backend: self.backend,
            group_sequence: candidate.group_sequence,
            sequence: ticket_sequence,
        })
    }

    /// Completes future out-of-lock I/O. Only `Removed` retires accounting;
    /// `Failed` restores a newly versioned eligible state.
    pub fn finish_reclaim(
        &mut self,
        group: GroupId,
        ticket: ReclaimTicket,
        outcome: ReclaimOutcome,
    ) -> Result<ReclaimCompletion, OwnershipError> {
        self.backend.require(group.backend, CapabilityKind::Group)?;
        self.backend
            .require(ticket.backend, CapabilityKind::ReclaimTicket)?;

        let ticket_record = self
            .tickets
            .get(&ticket.sequence)
            .ok_or(OwnershipError::UnknownReclaimTicket)?;
        if ticket_record.group_sequence != group.sequence || ticket.group_sequence != group.sequence
        {
            return Err(OwnershipError::ReclaimTicketGroupMismatch);
        }
        if ticket_record.state != TicketState::Active {
            return Err(OwnershipError::RetiredReclaimTicket);
        }

        let group_record = self
            .groups
            .get(&group.sequence)
            .ok_or(OwnershipError::UnknownGroup)?;
        if group_record.state
            != (GroupState::Reclaiming {
                ticket_sequence: ticket.sequence,
            })
        {
            return Err(OwnershipError::RetiredReclaimTicket);
        }

        match outcome {
            ReclaimOutcome::Removed => {
                self.tickets
                    .get_mut(&ticket.sequence)
                    .expect("ticket was validated above")
                    .state = TicketState::Removed;
                self.groups
                    .remove(&group.sequence)
                    .expect("group was validated above");
                Ok(ReclaimCompletion::Removed)
            }
            ReclaimOutcome::Failed => {
                self.tickets
                    .get_mut(&ticket.sequence)
                    .expect("ticket was validated above")
                    .state = TicketState::Restored;
                let group_record = self
                    .groups
                    .get_mut(&group.sequence)
                    .expect("group was validated above");
                group_record.eligibility_revision = group_record
                    .eligibility_revision
                    .checked_add(1)
                    .expect("lease and ticket identity bounds keep revisions below u128::MAX");
                group_record.state = GroupState::Resident { active_leases: 0 };
                Ok(ReclaimCompletion::Restored)
            }
        }
    }

    pub fn accounting(&self) -> ArtifactAccounting {
        self.accounting_matching(|_| true)
    }

    pub fn accounting_for(&self, class: ArtifactClass) -> ArtifactAccounting {
        self.accounting_matching(|metadata| metadata.class == class)
    }

    fn accounting_matching(&self, include: impl Fn(&GroupMetadata) -> bool) -> ArtifactAccounting {
        let mut accounting = ArtifactAccounting::default();
        for record in self
            .groups
            .values()
            .filter(|record| include(&record.metadata))
        {
            accounting.resident.add(record.metadata.resident_bytes);
            match record.state {
                GroupState::Resident { active_leases: 0 } => {
                    accounting.eligible.add(record.metadata.resident_bytes);
                }
                GroupState::Resident { active_leases } => {
                    accounting.live_owned.add(record.metadata.resident_bytes);
                    accounting.active_leases = accounting
                        .active_leases
                        .checked_add(active_leases)
                        .expect("active leases cannot exceed all issued lease identities");
                }
                GroupState::Reclaiming { .. } => {
                    accounting.claimed.add(record.metadata.resident_bytes);
                }
            }
        }
        accounting
    }
}

#[cfg(test)]
mod tests;
