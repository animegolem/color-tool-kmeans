use std::fmt;
use std::num::NonZeroU64;

use thiserror::Error;

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct BackendInstanceId(pub(super) [u8; 32]);

impl fmt::Debug for BackendInstanceId {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("BackendInstanceId(..)")
    }
}

impl BackendInstanceId {
    pub(super) fn require(
        self,
        capability_backend: Self,
        capability: CapabilityKind,
    ) -> Result<(), OwnershipError> {
        if capability_backend == self {
            Ok(())
        } else {
            Err(OwnershipError::ForeignBackend { capability })
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct GroupId {
    pub(super) backend: BackendInstanceId,
    pub(super) sequence: NonZeroU64,
}

impl fmt::Debug for GroupId {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("GroupId(..)")
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct LeaseId {
    pub(super) backend: BackendInstanceId,
    pub(super) sequence: NonZeroU64,
}

impl fmt::Debug for LeaseId {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("LeaseId(..)")
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct ReclaimCandidate {
    pub(super) backend: BackendInstanceId,
    pub(super) group_sequence: NonZeroU64,
    pub(super) eligibility_revision: u128,
    pub(super) class: ArtifactClass,
}

impl ReclaimCandidate {
    pub fn group_id(self) -> GroupId {
        GroupId {
            backend: self.backend,
            sequence: self.group_sequence,
        }
    }

    pub fn class(self) -> ArtifactClass {
        self.class
    }
}

impl fmt::Debug for ReclaimCandidate {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("ReclaimCandidate(..)")
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct ReclaimTicket {
    pub(super) backend: BackendInstanceId,
    pub(super) group_sequence: NonZeroU64,
    pub(super) sequence: NonZeroU64,
}

impl fmt::Debug for ReclaimTicket {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("ReclaimTicket(..)")
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ArtifactClass {
    TransientOutput,
    Staging,
    Clipboard,
    Snapshot,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct GroupMetadata {
    pub class: ArtifactClass,
    pub resident_bytes: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RegisteredGroup {
    pub group: GroupId,
    pub initial_lease: LeaseId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReleaseOutcome {
    Released,
    AlreadyReleased,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReclaimOutcome {
    Removed,
    Failed,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReclaimCompletion {
    Removed,
    Restored,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct AccountingBucket {
    pub groups: u64,
    pub bytes: u128,
}

impl AccountingBucket {
    pub(super) fn add(&mut self, bytes: u64) {
        self.groups = self
            .groups
            .checked_add(1)
            .expect("resident group count cannot exceed issued group identities");
        self.bytes += u128::from(bytes);
    }
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq)]
pub struct ArtifactAccounting {
    pub resident: AccountingBucket,
    pub live_owned: AccountingBucket,
    pub eligible: AccountingBucket,
    pub claimed: AccountingBucket,
    pub active_leases: u64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CapabilityKind {
    Group,
    Lease,
    ReclaimCandidate,
    ReclaimTicket,
}

#[derive(Debug, Clone, PartialEq, Eq, Error)]
pub enum OwnershipError {
    #[error("operating-system randomness could not issue a backend identity")]
    BackendIdentityUnavailable,
    #[error("foreign-backend {capability:?} capability")]
    ForeignBackend { capability: CapabilityKind },
    #[error("unknown artifact group")]
    UnknownGroup,
    #[error("unknown artifact lease")]
    UnknownLease,
    #[error("unknown reclaim ticket")]
    UnknownReclaimTicket,
    #[error("lease belongs to a different artifact group")]
    LeaseGroupMismatch,
    #[error("reclaim ticket belongs to a different artifact group")]
    ReclaimTicketGroupMismatch,
    #[error("artifact group has active leases")]
    GroupOwned,
    #[error("artifact group is being reclaimed")]
    ReclaimInProgress,
    #[error("reclaim candidate is stale")]
    StaleReclaimCandidate,
    #[error("reclaim ticket has already been retired")]
    RetiredReclaimTicket,
    #[error("{capability:?} identity space is exhausted")]
    IdExhausted { capability: CapabilityKind },
}

#[derive(Debug, Clone, Copy)]
pub(super) struct IdAllocator {
    pub(super) next: Option<NonZeroU64>,
}

impl IdAllocator {
    pub(super) fn new() -> Self {
        Self {
            next: NonZeroU64::new(1),
        }
    }

    pub(super) fn peek(self, capability: CapabilityKind) -> Result<NonZeroU64, OwnershipError> {
        self.next.ok_or(OwnershipError::IdExhausted { capability })
    }

    pub(super) fn commit(&mut self) {
        let current = self.next.expect("only a preflighted identity is committed");
        self.next = current.get().checked_add(1).and_then(NonZeroU64::new);
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum GroupState {
    Resident { active_leases: u64 },
    Reclaiming { ticket_sequence: NonZeroU64 },
}

#[derive(Debug, Clone, Copy)]
pub(super) struct GroupRecord {
    pub(super) metadata: GroupMetadata,
    pub(super) state: GroupState,
    pub(super) eligibility_revision: u128,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum LeaseState {
    Active,
    Released,
}

#[derive(Debug, Clone, Copy)]
pub(super) struct LeaseRecord {
    pub(super) group_sequence: NonZeroU64,
    pub(super) state: LeaseState,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum TicketState {
    Active,
    Restored,
    Removed,
}

#[derive(Debug, Clone, Copy)]
pub(super) struct TicketRecord {
    pub(super) group_sequence: NonZeroU64,
    pub(super) state: TicketState,
}
