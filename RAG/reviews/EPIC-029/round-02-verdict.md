---
submission: epic-029-code-lead-review
verdict: accepted
acceptance_scope: design-basis-with-binding-lead-clarifications
branch: codex/remediation-planning-2026-09-04
commit: 2cc2000bce04ce2e6bda11a2853dd42595946980
round: 2
reviewed: 2026-09-04
submission_sha256: 6837a7ab18a6100b6aa2cc7ba8ff5bde101920d213eb58fcd987aa8e6d345890
implementation_authorized: false
capacity_policy_approved: false
---

# EPIC-029 Round 02 Review Lead verdict

**Accepted as the design basis, with C1–C3 below binding on implementation.** This accepts a review document, not code, a merge, a release, or an unmeasured quota. No third general review round is requested.

## Review basis and evidence limits

Read the full 222-line addendum and compared it to Round 01's numbered amendments and PROJECT-RECORD rev 0.3. Its input verdict hash matches `8f776faf6512d749397dd5be20ef7293e45de5d42de3015731ef4004eadd2523`; preserve both reports unchanged.

Rechecked main, origin tracking and remote main at `5baa20e021855fbc57aebf48fa0f9b3374ded281`, with **4 / 33** divergence from the sweep. Main is clean. Planning remains an uncommitted documentation carrier based at `2cc2000`. No source edits, new application tests, builds or benchmarks were performed in this review. The counterexamples below concern the proposed protocol, not newly observed production failures.

## Accepted decisions

- Native backend/client/source-generation identities are distinct from renderer selection/content counters and transient request tokens.
- Stable frame equality excludes request/decode tokens. Exact restore can receive new request authority without changing the proven content key.
- A retained export/Batch job admitted before source removal can continue from immutable job inputs; a new root admission after removal fails. Active-view publication remains revocable independently.
- Async all-or-none admission acquires managed inputs and establishes owned external snapshots before dependent work. Subanalysis derives from the retained job input, not from mutable selection or a new root admission.
- Private staging, immutable group publication, response escrow, idempotent ACK, explicit release, and backend-root confinement are the chosen ownership model.
- View disposal, renderer replacement, window destruction and backend restart are different transitions. Preserve the proposed legacy retention matrix; no blanket deletion of persistent snapshot/clipboard files.
- Account groups once rather than per lease; distinguish published bytes, staging bytes and remaining reservation. No blocking wait for capacity held by the job's own inputs.
- Existing cleanup limits remain retention targets, not newly approved admission caps. No cross-class eviction policy or admission numbers are implied by this acceptance.
- Existing file allowances suffice as design boundaries. A later implementation finding a necessary new file still needs a scoped amendment, not a silent expansion.
- Keep the strict shared-file ordering, at most two disjoint writers, and optional189/190/194 outside required acceptance.

## Binding lead clarifications

### C1 — Bootstrap cannot roll a newer document back to an older caller

Do not implement the proposed “delayed older bootstrap wins, displaced client retries” behavior. Arrival order of a random JS nonce does not prove renderer-document recency. Repeated bootstrap on `SessionRetired` can let an obsolete client displace its successor.

Bind client activation to a **native-established window/document lifetime** or another demonstrated ordering mechanism. Activation is idempotent for the same live document, and requests from superseded lifetimes cannot retire the current session. A retired client is terminal unless the caller proves a new current document lifetime; do not treat retirement as permission for an unlimited bootstrap loop.

The exact Tauri hook/wiring is an implementation detail to verify in the accepted native/frontend session fences, not an assumed API. If the supported runtime cannot establish this ordering, stop only the session-lifecycle slice and request a narrow ruling.

Required tests: duplicate bootstrap from one document; newer document activates then an older delayed bootstrap arrives; simultaneous/reordered calls; retired client retries; stale window generation after replacement. In every case the successor stays authoritative and older calls acquire no owners.

### C2 — Lost admission/response recovery must work while the renderer remains alive

Escrow makes bytes safe, but waiting for reload/window close to reclaim every lost response leaves an avoidable session-long accumulation path. A response can be lost before the caller learns its JobId or ResponseId.

Use the synchronously captured `(ClientSessionId, requestNonce)` as a durable-in-session operation key. Admission and terminal cancellation are idempotent under that key. Reuse with a different captured descriptor is rejected, not interpreted as another job. Provide status/result recovery and cancellation/release by that key, or an equivalent protocol, so the caller can reconcile after a lost grant or response without knowing the lost native IDs.

A cancellation recorded before delayed admission is a tombstone: the delayed request must not recreate the job. A live caller reconciles an uncertain operation before retrying it as new work; no duplicate snapshots, reservations or output groups arise from retries. ACK idempotency remains separate and equally required.

Apply recovery/idempotency to allocating source/session grants as appropriate to C1's native document lifetime, not only the final job response. Cancellation immediately revokes completion authority but does not delete bytes still leased by a running worker. Zero-leak assertions apply after those workers/readers quiesce and release; CPU/process preemption is not assumed.

If communication remains unavailable, preserve safety and retire ownership through the established native client/window lifecycle; do not invent a timeout that deletes a slow consumer's bytes. A true crashed-but-not-retired renderer may retain bytes temporarily. This is distinct from an ordinary lost response that a healthy renderer can recover.

Required tests: lose the admission reply; lose publication delivery; retry same nonce; nonce with different descriptor; cancel-before-delayed-admission; lose cancellation/ACK replies; repeated lost responses recovered in a live session. Assert one operation/group, no duplicate charge, terminal cancellation, and zero remaining leases/reservations after reconciliation without requiring a restart.

### C3 — Opaque identity alone does not prove cached results match retained bytes

`SourceGenerationId` is an authority identity, not a content hash. Reopening a mutable external pathname for a later export can capture different bytes while a cached result still describes an older snapshot under the same logical entry.

Cached analysis may be reused only when it is bound to the **same immutable input identity or verified content digest** as the job's retained snapshot, with matching parameters/algorithm contract. A path, mtime/size pair or opaque generation label alone is insufficient. If equality cannot be proven, invalidate/recompute all dependent panels from the one captured job snapshot or fail explicitly; never mix old cached analysis with a freshly copied original.

All producer outputs carry the input identity that actually produced them. Source generations and result keys must not be silently rebound to a later snapshot. Snapshot bytes are validated once and shared by dependent analysis/rendering; this does not promise an atomic external-filesystem snapshot under arbitrary concurrent third-party writes.

Required tests: analyze A, change the external file at the same path, then export without a new UI selection; include equal-length/preserved-mtime mutation. Output must use one verified retained input or explicitly reject, never combine old analysis with new original pixels. Also retain a positive cache-hit case proving no redundant recomputation when immutable identity matches.

## Capacity policy and coding readiness

The owner has not yet chosen fail-closed versus bounded overflow. The retention-only alternative R is **not** silently selected. Native admission policy and numeric limits remain unapproved; parameters must be recorded before enabling new exhaustion behavior.

This does not create a global prerequisite for the renderer fixture repair or disjoint low-risk sweep adoption. Correct the Round 02 wave wording accordingly: those slices can receive a separate coding assignment without waiting for cache quotas. Likewise IMP-180's aggregate status must not prevent working on already-adopted frontend pieces while only the coordinated RT-07 math patch remains outstanding.

Approve the remaining serialization proposal: identity181→192→182→183; native/frontend session integration after identity; then Values185 → export184 → Batch186 for shared frontend hooks; scroll188 can be isolated. The next assignment must identify concrete prerequisites already present, not rely solely on an epic-wide “complete” flag.

## Channel state

Code Lead should preserve both reports and this verdict, then wait for an **explicit bounded implementation assignment**. No third general review, source edits, commits, installs, builds, polling or autonomous expansion is requested now. The owner explicitly permits a break between assignments.

The Review Lead will select the first coding range, exact live base, worktree/clone, tests and commit permissions separately. C1–C3 are implementation requirements with regression gates; raise only a concrete incompatibility requiring a new decision.
