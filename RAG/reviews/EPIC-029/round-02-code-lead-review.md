---
submission: epic-029-code-lead-review
round: 2
planning_branch: codex/remediation-planning-2026-09-04
planning_head: 2cc2000bce04ce2e6bda11a2853dd42595946980
live_main: 5baa20e021855fbc57aebf48fa0f9b3374ded281
live_origin_main: 5baa20e021855fbc57aebf48fa0f9b3374ded281
source_sweep: f427ff40bf6efa2e332c9705830048e1b5cfe8bd
input_verdict: RAG/reviews/EPIC-029/round-01-verdict.md
input_verdict_sha256: 8f776faf6512d749397dd5be20ef7293e45de5d42de3015731ef4004eadd2523
document_basis: uncommitted planning carrier at PROJECT-RECORD rev 0.3
implementation_authorized: false
---

# EPIC-029 Round 02 Code Lead addendum

## Response to the AMEND verdict

The Round 01 corrections are accepted, including these two factual changes:

- SEP-01 is a renderer-only fixture-path defect. `color-core/tests/color_goldens.rs` already resolves its existing fixture correctly; no Rust golden-reader repair belongs in IMP-179.
- SWEEP-006 and SWEEP-008 are Values changes, not Batch changes.

Source citations prefixed `M` refer to the live main SHA recorded in frontmatter; the planning documents themselves remain uncommitted on the older planning head.

This addendum supersedes Round 01 only where the verdict says so. It does not repeat the repository sweep. The synchronized ticket fences are sufficient for the protocol below if client-session behavior stays in IMP-193's existing native registry/command files and its fenced bridge, `main.ts`, `App.svelte`, cleanup, snapshot, image, and video surfaces. No further file allowance is requested in Round 02.

The proposed protocol is ready for a second Review Lead ruling except for the owner's cache-pressure choice and numerical admission limits, which remain explicitly pending. No production code, ticket, source, test, build, install, git, performance-worktree, or sweep-branch mutation was performed.

## 1. Identity and authority model — Amendment 3

The implementation should carry five distinct identities. Combining any pair recreates one of the reviewed races.

| Identity | Issuer / lifetime | Meaning | Must not be used for |
| --- | --- | --- | --- |
| `ClientSessionId` | Native; one active generation per Tauri window and backend instance | Which renderer incarnation can acknowledge or own a response | Stable media equality |
| `SelectionEpoch` | Renderer store; scoped to one client session | Latest active UI-selection intent | Independent export/Batch cancellation or byte equality |
| `ContentRevision` | Renderer store; monotonic for a logical entry within one client session | Which accepted source bytes an analysis describes | Cross-reload uniqueness or native tombstone identity |
| `SourceGenerationId` | Native; opaque and unique for each admitted source generation | Native revocation/admission key, safe across same-ID remove/re-add and renderer reload | Human naming or content-hash equality |
| Request/job token | Native for jobs; renderer for local request ordering | Transient authority to complete one execution | Cached frame equality |

Every native capability also carries the random `BackendInstanceId` created at native process startup. A token from a prior backend instance is rejected rather than accidentally resolving in a new registry.

### Stable content and frame equality

- A renderer `ContentRevision` never resets within its `ClientSessionId`. A same-ID replacement increments it. Remove/re-add receives a new native `SourceGenerationId`, so an old completion cannot become valid even if the reconstructed renderer starts its local counter from zero.
- Cross-renderer reuse is conservative. A new session receives a new source generation unless it explicitly attaches to an immutable managed `ArtifactId` or a validated persistent cache manifest. Path, mtime, size, or a repeated logical ID alone do not prove equality.
- Stable frame identity is `{ sourceGenerationId or immutable sourceArtifactId, actual settled sample/timestamp, extraction-settings digest }`. It excludes decode/request token and view owner.
- `RestoreIntent` binds that stable frame key to fresh execution authority: `{ clientSessionId, selectionEpoch, contentRevision, stableFrameKey, paramsKey, requestToken, viewOwner }`. A new request token can positively restore the same proven frame. Seek, step, source replacement, newer selection, view disposal, or session retirement revokes the authority without changing the cached frame's equality key.
- Requested playhead and settled frame remain separate store fields. A successor view compares requested identity to settled identity and reacquires under its own request/view token when they differ.

### Active views versus independent jobs

- Active Home/Values publication validates both its request/view token and the current `SelectionEpoch`. Selection of B prevents an older active-view completion for A from publishing.
- An explicitly started export or Batch computation receives a native retained-job capability for its captured A inputs. Selection of B does not retarget or cancel it.
- Removing A prevents new root admissions for A. A retained job that linearized admission first continues from its immutable managed inputs or job snapshot. A view job does not: revocation makes its result ineligible for ACK/transfer.
- Explicit job cancellation, client-session retirement, or backend restart is separate from selection. Current frontend-orchestrated exports are not resumable across renderer replacement; they are abandoned safely rather than silently reattached.

Required identity regressions:

1. Positive cached-frame restore succeeds under a fresh decode token when stable frame/source/settings identity matches.
2. Remove A, re-add the same logical ID, then resolve old A; the new source generation cannot accept it.
3. Start export A, select B, and complete A from its retained descriptor/snapshot; every panel and basename remains A.
4. Start an active-view A request, select B, and resolve A; publication and ACK fail without disturbing B.

## 2. Async admission, publication, and ACK — Amendment 4

### Exact public IPC boundaries

Names are proposals; semantics are required.

1. `begin_client_session({ clientNonce }) -> ClientSessionGrant`
   - Native generates `{ backendInstanceId, clientSessionId, windowGeneration }` and atomically retires the prior active client for that Tauri window.
   - App actions remain disabled until bootstrap succeeds. If a delayed older bootstrap wins the delivery race, the displaced client receives `SessionRetired` on its next call and repeats bootstrap; it never retains valid ownership silently.
2. `admit_source_generation({ session, logicalMediaId, contentRevision, sourceDescriptor }) -> SourceGrant`
   - Returns an opaque `SourceGenerationId`. Native never derives it from the renderer counter.
   - Reattachment to a persistent managed artifact is allowed only by validated immutable `ArtifactId`/manifest; otherwise admission creates a fresh generation.
3. `admit_job({ session, requestNonce, kind, ownershipMode, sources, managedInputs, externalInputs, outputReservations }) -> JobGrant`
   - This is the first awaited operation after the renderer synchronously captures the immutable job descriptor.
   - Under one registry transaction it validates the session and source generations, acquires every managed input lease, creates the job, and reserves proposed output capacity. Failure acquires nothing.
   - It then opens each external source once and copies that byte stream into private job staging. All dependent operations use the resulting `JobInputRef`; they never reread current selection or the external path. If any snapshot fails, all staged inputs, leases, and reservations are released before an error returns.
   - From the caller's perspective admission is all-or-none: no decode/render/save phase starts until every input snapshot/lease is ready.
4. Existing producing commands accept either a one-shot view admission descriptor or a `JobGrant` plus `JobInputRef`. Export subanalysis uses the parent job input capability; it is not a new root admission against the removed source.
5. Internal registry methods `allocate_staging`, `try_grow_reservation`, and `publish_group` are not general renderer file APIs. Producers write only registry-selected private staging. Publication verifies completeness, converts reserved bytes to actual group accounting, atomically renames, and creates a `ResponseEscrow` before command-response serialization.
6. `ack_artifact_response({ session, responseId, ackNonce, disposition }) -> AckResult`
   - `accept(ownerKind, ownerId)` atomically transfers the whole response group from escrow to a session semantic owner; `release` drops it.
   - `ackNonce` is idempotent. If the IPC reply is lost after native acceptance, retry returns the same result rather than transferring twice. The renderer does not expose/store the result until ACK acceptance is confirmed.
7. `finish_job`, `cancel_job`, `release_owner`, and `revoke_source_generation` are idempotent. No API accepts arbitrary external paths for deletion.

`OwnerKind` is explicit: `Job`, `ResponseEscrow`, `ClientSemantic` (ImageEntry, VideoCache, Values result, Batch result, display or pin), and native cache retention. Retention classification is metadata, not a lease that makes an artifact permanently unevictable.

### Race linearization

- **Acquire versus remove:** the registry lock decides the order. If revocation wins, admission returns `SourceRevoked` with zero leases, snapshots, or reservations. If admission wins, a retained job owns its inputs; removal drops media/view owners and blocks later root jobs but does not tear down that admitted snapshot.
- **Publication versus revoke:** a view publication/ACK rechecks source state. Revoke-before-publish deletes staging; publish-before-revoke leaves response escrow, but a later view ACK fails and releases it. A retained export/Batch job publishes against its job input capability, so post-admission source removal does not invalidate derived work.
- **Removal after export retention:** export A admits and receives `JobInputRef(A)`, then A is removed. A later Values subanalysis inside that export uses `JobInputRef(A)` and succeeds. A new independent export or view admission using A's revoked `SourceGenerationId` fails. This is the boundary that avoids both retargeting and tombstone overreach.
- **Atomic multi-input admission:** acquire `[A, B, C]` and all output reservations under one transaction. If B is absent/revoked or capacity fails, no input remains leased. External snapshot failure after reservation rolls the entire job back before dependent work.
- **Response/ACK loss:** publication itself creates escrow. If response delivery, renderer validation, or ACK fails, bytes remain owned only by escrow until explicit release, session replacement/window destruction, or backend restart recovery. No dead renderer `finally` is required for correctness.

Required protocol tests use barriers around each transition:

1. Remove wins before admission; admission wins before remove; assert the two exact outcomes and zero partial lease state.
2. Revoke before publish, publish before revoke/before ACK, and retained-job publish after source removal.
3. Publish, lose response; publish, receive then lose ACK reply; retry same ACK; retire session before ACK. Assert idempotent ownership and exactly-once deletion.
4. Multi-input admission with the middle input revoked and with snapshot copy failure after earlier inputs staged; assert complete rollback.
5. Retain A for export, remove A, run a later export subanalysis from its `JobInputRef`, then prove a new A root admission is rejected.

## 3. Client replacement, backend restart, and retention — Amendment 5

### Three different lifecycle transitions

| Transition | Native behavior | What survives |
| --- | --- | --- |
| View unmount | Revoke that view's request owners and release view-only semantic leases; do not retire the renderer session | Other views, accepted session caches, and independent admitted export/Batch jobs |
| Renderer replacement/reload | A successful `begin_client_session` atomically retires the prior session for the same window; release its `ClientSemantic` and `ResponseEscrow` leases and abandon frontend-orchestrated jobs | Backend instance, persistent retention candidates, and any explicitly native-detached job class (none proposed for current exports) |
| Window destruction | Native window event retires its active client even if JS cleanup never ran | Other windows/backend work only |
| Backend restart | New `BackendInstanceId`; all old capabilities are invalid. Recover only known on-disk classes under managed roots | Complete artifacts allowed by the compatibility/retention matrix below |

A renderer-retired native worker may finish CPU/FFmpeg work, but it can only publish into an escrow addressed to the retired session; that escrow is immediately releasable and cannot become a semantic owner. Frontend-orchestrated export jobs cannot progress to later phases after retirement and are canceled/rolled back. This favors bounded orphan retention over timeouts or unsafe automatic job reattachment.

There is no correctness timeout. An orphaned response escrow remains safe until explicit ACK/release, atomic client replacement, window destruction, or backend exit. A renderer crash that neither destroys nor reloads the window may temporarily retain bytes, but cannot expose or delete another owner's bytes. That temporary leak is preferable to a timer guessing that a slow client is dead.

### Backend-restart compatibility matrix

| Class | Existing policy on `M` | Restart/import rule after registry introduction |
| --- | --- | --- |
| Video frames | Keep newest 80 (`cache.rs:11,76-116`) | Import recognized complete legacy/new single files as unowned retention candidates; apply count policy only when no live lease exists |
| Video strips | Keep newest 10 (`cache.rs:12,76-125`) | Same as frames; no blanket deletion |
| Clipboard images | 512 MiB and 30 days (`cache.rs:13-15,128-139`) | Preserve recognized `clipboard/paste-*` files and current retention class; import on source use. Do not require a new manifest for a valid legacy single file |
| Snapshots | 1 GiB and 30 days under app local data (`cache.rs:13-15,128-139`; `frame-snapshot.ts:23-31`) | Preserve their intentional persistent-copy role and current retention class; import on use. Do not blanket-delete at startup |
| Values | 512 MiB and 30 days (`value_analysis.rs:32-35,323-365`) | Legacy group is reusable only when existing metadata parses and every expected file is present; import it on hit. IMP-185 groups require their complete publication manifest. Incomplete legacy data is a cache miss, not automatic evidence of user-disposable content |
| Batch grids | No existing lifecycle/budget | Only the new versioned managed Batch namespace is session-only. IMP-186 may reclaim its unowned generation/orphan after backend restart; unknown paths remain untouched |
| Job snapshots/staging | New, no legacy class | Remove only the registry's versioned staging namespace and incomplete manifests on restart |
| User export destinations | External, user-owned | Never registry-delete or include in managed-cache accounting |

SWEEP-022 remains the safe interim: do not run blind count/age deletion while ownership is unknown. Once IMP-193 can enumerate owners, periodic or startup retention may reclaim only unowned eligible candidates. Existing age/size/count values remain retention targets, not admission quotas.

Required lifecycle tests:

- Unmount one view while export A and another view remain; only the unmounted view authority is released.
- Publish a response without ACK, reload renderer, begin the replacement session, and assert old escrow/session owners release while persistent snapshot/clipboard candidates remain.
- Remove/re-add the same logical ID across renderer sessions while the backend tombstone exists; old generation and old response cannot attach.
- Restart backend with invalid staging, complete legacy clipboard/snapshot, complete/incomplete Values, recognized video files, and a versioned Batch orphan; recover each exactly according to the matrix.
- Pass a token carrying the old `BackendInstanceId` after restart and receive a typed stale-backend error.

## 4. Accounting and pressure alternatives — Amendment 6

No new numeric admission limit is proposed as approved. Current values describe retention cleanup, while admission limits decide whether new work may start; converting one into the other would be a product change.

### Accounting model common to either owner choice

- Account once per canonical `ArtifactId` or `ArtifactGroupId`, not once per lease. A Values group is the sum of its unique files. Input leases do not re-charge already published input bytes.
- Track by class: `publishedActualBytes`, `stagingActualBytes`, and `reservedRemainingBytes`. Total pressure is their saturating sum; group membership and multiple owners never double-count.
- Reject symlinks and hard-link aliasing in newly managed outputs. Legacy imports resolve only within the existing managed allowlist and count each imported artifact once.
- Admission acquires all inputs and output reservations atomically. Publication converts reservation to measured file lengths; unused reservation is released.
- Known source snapshots reserve the opened file length. Image/PNG producers use decoded dimensions and a conservative class-specific bound where available. If a safe bound is unavailable, the writer must call `try_grow_reservation(delta)` before extending staging beyond its reservation.
- Reservation growth never waits. If it fails, cancel the new job, delete its staging, release its acquired inputs/reservation, and preserve all accepted jobs/results. This avoids waiting for capacity held by the waiting job's own inputs.
- An oversized single job is rejected before dependent work when its initial reservation already exceeds the approved hard headroom. Under unknown growth, it fails at the first denied growth boundary without publication.
- Disk-full, write, verification, and publication failures follow the same rollback and produce no retained partial group.

### Retention classes versus admission pools

Recommended topology if the owner chooses either fail-closed or bounded overflow:

1. Keep the current independent retention classes and values for video, clipboard, snapshots, and Values. Persistent snapshot/clipboard candidates cannot be cross-evicted merely because a transient Batch job wants space.
2. Use a separate transient accounting pool for job snapshots, staging, and Batch generations. It needs owner-approved admission parameters because none exist today.
3. Keep Values in its regenerable class; its 512 MiB value remains the unowned-reclamation target unless separately promoted to an admission ceiling.
4. Do not use one global cache number as the sole policy. A global filesystem safety guard may complement per-class policy later, but it must not authorize cross-class deletion.

### Owner alternatives

| Alternative | Admission behavior after unowned reclamation | Required unresolved parameters | Tradeoff |
| --- | --- | --- | --- |
| F — fail closed for new work (lead recommendation) | If the all-or-none reservation exceeds approved headroom, return `ManagedCapacityExceeded`; existing jobs/results remain owned | Per-class/transient hard ceilings; treatment of an oversized single job | Smallest predictable contract; may reject work even when other classes have unused capacity |
| O — bounded temporary overflow | Existing retention values act only as soft reclamation targets; admit until a separately approved hard ceiling | Per-class or transient overflow bytes/ratio and hard ceilings | Fewer interruptions; deliberately permits bounded disk growth |
| R — retention-only compatibility interim | Protect owners and attempt work until filesystem/write failure; no new admission rejection | No new quota, but explicit acceptance of unbounded concurrent staging risk | Avoids guessing policy but does not provide proactive exhaustion control |

No option is selected here. If F is chosen, this review recommends hybrid per-class retention plus a separately bounded transient pool—not reusing the sum of `512 MiB + 1 GiB + 512 MiB` as a universal cap and not translating the 80/10 video counts into invented bytes. If O is chosen, both soft and hard numbers must be recorded before implementation. R is a truthful fallback only if the owner deliberately defers admission control.

### Retry contract

`ManagedCapacityExceeded` reports class, requested/reserved bytes, protected bytes, reclaimable bytes attempted, and whether the job was oversized; it does not expose user paths. The UI preserves the current accepted result and offers an explicit retry after the user finishes/cancels exports or removes unused media. Retry captures a new immutable descriptor and request nonce. There is no automatic retry loop and no wait-for-capacity deadlock.

Budget tests must cover two leases on one group (one charge), a multi-file Values group, failed external snapshot rollback, reservation growth denial, oversized first reservation, concurrent reservations, last-owner reclamation, persistent-class isolation, and success after an explicit retry.

## 5. Corrected fence and serialization map

The rev 0.3 amendments resolve the Round 01 file gaps. The remaining constraint is exclusive scheduling, not more paths.

| Boundary | Required scheduling rule |
| --- | --- |
| IMP-179 / IMP-178 | Reuse the prepared TS fixture hunk once with provenance. Do not touch the performance worktree or wait for its whole package. Rust golden reader is out of scope. |
| IMP-180 / IMP-187 | Non-math SWEEP adoption can proceed. The RT-07 result is one semantically corrected SWEEP-012 patch carrying IMP-187 provenance on the coordinated accepted math shape; no deficient intermediate commit and no duplicate `kmeans_tests.rs`. |
| IMP-181 →192 →182 →183 | Strictly serialize shared image/video stores, Home/Values wiring, and controllers. Decode tokens remain authority only, not stable frame identity. |
| IMP-193 / identity lane | Native-only registry/session preparation may overlap disjoint frontend identity work. IMP-193's image/video/App/bridge integration waits for IMP-183 and uses one writer. |
| IMP-193 / IMP-185 / IMP-186 | Serialize native registry hooks: base protocol first, then Values publication, then Batch reclamation. |
| IMP-185 / IMP-184 | Serialize shared ownership bridge, IPC contracts, Values store, and lifecycle tests. Recommended order is IMP-185 then IMP-184 so export code consumes the actual accepted Values `ArtifactGroup`/ACK contract. |
| IMP-184 / IMP-186 | IMP-186 follows both 184 and 185; Batch export ownership tests must not be edited concurrently. |
| IMP-188 | Isolated service/spec pair after SWEEP-028 adoption; safe alongside native-only work. |
| IMP-191 | Review Lead-only record/index/status work after an independently submitted candidate; no production fixes hidden in acceptance. |

## 6. Corrected seven-wave proposal

At most two implementation writers are proposed, and only where the fence table declares disjoint subsets. This remains a proposal, not coding authorization.

1. **Wave 0 — protocol/owner ruling (review only).** Review this addendum; settle pressure option and numeric admission parameters; issue exact implementation authority and live integration tip.
2. **Wave 1 — renderer gate repair (small).** IMP-179 adopts the already prepared one-line TS path hunk with provenance on fresh main and reruns the focused/full renderer tests. It neither edits Rust nor waits for all IMP-178 work.
3. **Wave 2 — issue-granular adoption plus coordinated RT-07 (large).** IMP-180 applies non-math SWEEP work one issue per commit, putting source-copy protection early and preserving Values attribution for SWEEP-006/008. In a disjoint math lane, IMP-187 may produce the single corrected SWEEP-012/IMP-187 patch after its accepted math shape is known. IMP-180 does not close until its manifest maps that exact result; no other adoption waits merely for performance acceptance.
4. **Wave 3 — isolated queued-work correction (small).** IMP-188 follows adopted SWEEP-028 and can run beside review/integration of native-only work because it owns only the scroll service/spec.
5. **Wave 4 — identity lane plus native-only preparation (large).** One writer performs IMP-181 →192 →182 →183. A second may prepare only IMP-193 native registry/session code in explicitly disjoint files. No IMP-193 renderer/store/App integration occurs until IMP-183 lands.
6. **Wave 5 — ownership consumers (extra large, serialized integration).** Finish IMP-193 frontend/session hookup and protocol tests; then IMP-185 Values publication/ACK; then IMP-184 immutable export job/admission; then IMP-186 Batch lifecycle. Native-only preparatory work may overlap, but shared bridge/store/export hooks never do.
7. **Wave 6 — independent acceptance (medium).** IMP-191 runs exact-tip focused race/lifecycle tests, all renderer/Rust gates, Tauri-free core check, current platform evidence, source-to-result provenance, and deterministic index generation. Optional IMP-189/190/194 remain outside this candidate.

The implementation candidate must report planning/source/integration bases separately. Tests historically executed at `2cc2000` or on `f427ff4` remain historical; none is relabeled as a pass on `5baa20e` or a later assigned tip.

## Requested Round 02 rulings

1. Accept or amend the opaque native `SourceGenerationId`, stable frame key, and separate view-versus-retained-job authority.
2. Accept or amend the `admit_job` all-or-none transaction, `JobInputRef` derivation rule, response escrow, and idempotent ACK sequence.
3. Accept or amend client-session replacement and the backend-restart compatibility matrix.
4. Record the owner's F/O/R pressure choice and the required numeric parameters; until then, keep capacity behavior blocked rather than inferred.
5. Confirm no additional file-fence changes are needed and approve the seven-wave/serialization map before any coding assignment.
