# EPIC-029 Round 01 Code Lead review

Date: 2026-09-04  
Reviewer: Code Lead task `01a06e5c-ac00-7761-884c-7ecca850de94`  
Disposition: **conditionally ready for a Review Lead verdict; not ready for implementation assignment as written**

## Review basis and limits

- `P`: planning worktree `codex/remediation-planning-2026-09-04` at `2cc2000bce04ce2e6bda11a2853dd42595946980`.
- `M`: live `main` and `origin/main` at review time, both `5baa20e021855fbc57aebf48fa0f9b3374ded281`.
- `S`: historical sweep `codex/control-flow-sweep-2026-07-19` at `f427ff40bf6efa2e332c9705830048e1b5cfe8bd`.
- Common ancestor of `M` and `S`: `28d9e8415736cc82154fbcc2dfb90b70157ac6cf`.
- Current divergence is `4 / 33`, not the carrier's recorded `3 / 33`.
- This was a read-only source/ref review. I ran no application tests, builds, formatters, installs, probes, or permanent repros. “Executed” below means evidence executed and recorded by the September reconciliation or July sweep, not rerun by this review.
- No source or ticket was edited. This review is the sole output.

## Executive verdict

The epic has the right defect inventory, and all twelve SEP findings are credible. The July sweep is valuable evidence and contains many adoptable fixes, but it cannot be merged as a stack and several of its “fixed” conclusions are only partial when the patches are composed.

Implementation should wait for a Review Lead verdict on five points:

1. **Refresh the implementation base.** `main` advanced after dispatch with `5baa20e fix(core): merge diagnostics to stderr — stdout belongs to consumers [AI-IMP-002]`. It does not invalidate an EPIC-029 diagnosis, but every candidate must start from `5baa20e` or newer and preserve that stdout/stderr correction. The project record, epic, brief, and manifest must stop presenting `2cc2000` and `3 / 33` as current.
2. **Resolve IMP-179 versus IMP-178 before assignment.** The separate IMP-178 working tree already changes `tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts` to the same corrected fixture path and marks its ticket completed, but it is uncommitted/unaccepted and still based on `2cc2000`. Either accept/rebase IMP-178 first and mark IMP-179 satisfied by that integration, or remove the overlap from IMP-178 before assigning IMP-179. Do not create two commits for the same line.
3. **Amend file fences.** Several mandatory fixes cannot be completed inside their current Files-to-Touch lists. Exact corrections are listed below.
4. **Approve one canonical selection/frame contract.** `selectionEpoch` and `contentRevision` must remain separate identities. A broad `preserveColorAnalysis` boolean cannot be the restore authority.
5. **Approve the native artifact lease policy, including cache-pressure behavior.** The correctness invariant is clear—owned bytes are never silently evicted—but the product response when all bytes are owned requires an explicit decision.

## SEP finding dispositions

| Finding | Verdict | Evidence class | Diagnosis, counterevidence, and required correction |
| --- | --- | --- | --- |
| SEP-01 | Agree | Executed in reconciliation; source confirmed | `M:color-core/tests/color_goldens.rs:28` and `M:tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts:27` point at a missing native fixture while the canonical fixture is under `color-core/tests/fixtures/`. The historical full Vitest run reached this failure. IMP-178 currently duplicates the proposed repair, so ownership must be settled first. |
| SEP-02 | Agree | Executed | In `S:tauri-app/src/lib/views/home/analysis-runner.svelte.ts:58-94`, cancellation leaves `lastRequestKey`, and the key omits `contentRevision`; seeding at `:168-183` has the same omission. `S:tauri-app/src/lib/views/HomeView.svelte:229-233` passes an id-only cast into seed logic, so adding a field in the runner alone would seed `undefined`. IMP-181 must cover the wiring and tests. |
| SEP-03 | Agree | Executed | `S:tauri-app/src/lib/views/home/video-controller.svelte.ts:357-367` consumes a controller-wide restore boolean; cached load arms it at `:550-551`, while a later step dispatches another decode at `:625-636` without revoking it. `S:tauri-app/src/lib/stores/image.ts:197-218` also increments the revision and then optionally preserves older analysis, relabeling old provenance. Replace the boolean with an exact, revocable restore intent. |
| SEP-04 | Agree | Source-confirmed | The Home controller publishes the requested time before decode settles (`S:.../home/video-controller.svelte.ts:625-636`). Values only reacquires when there is no file or the video path differs (`S:tauri-app/src/lib/views/ValuesView.svelte:179-199`). A same-video successor can therefore display/analyze the old frame. Store requested and settled frame identities separately and compare them on successor mount. |
| SEP-05 | Agree | Executed | `S:tauri-app/src/lib/views/exports/values-export-runner.svelte.ts:55-86`, `:166-171`, and `:216` reread mutable file/name/options across awaits; Colors and Batch have the same pattern. Capture an immutable export job before the first await, snapshot external source bytes once, acquire all managed-artifact leases, and release in `finally`. |
| SEP-06 | Agree | Source-confirmed | `S:tauri-app/src-tauri/src/value_analysis.rs:127-198` gives same-generation writers the same final paths and decodes the source twice; final PNGs are written directly. Metadata errors are discarded at `:261-295` and `:696-700`. Cache identity, writer identity, and publication identity need separation. The all-transparent test at `:873-880` inspects the parent rather than the generated child directory, so its artifact assertion is vacuous. |
| SEP-07 | Agree | Source-confirmed | `S:tauri-app/src-tauri/src/compose_grid.rs:97-113` creates unique Batch output but never reclaims it. Startup pruning in `cache.rs` covers other classes, not Batch, and frontend entry cleanup does not own exports. Add lease-aware generation retirement after the shared native ownership contract exists. |
| SEP-08 | Agree | Source-confirmed | `M:color-core/src/kmeans.rs:165-187` can report convergence after an empty-cluster reseed because it only observes assignment changes. `S` avoids that false success, but its unconditional `reseeded = true` forces max iterations even when the reseed is byte-for-byte unchanged. Apply a material-change rule on top of the accepted IMP-178 k-means shape. |
| SEP-09 | Agree | Executed | `S:tauri-app/src/lib/services/analysis-scroll-lock.ts:48-56` clears ownership before queuing the restore. `clear()` or a new capture cannot revoke the queued microtask/RAF. Existing tests at `analysis-scroll-lock.spec.ts:16-65` cover revocation before enqueue, not after. Capture the container and an execution generation; validate again inside the queued callback. |
| SEP-10 | Agree | Executed | Sweep cancellation clears debounce/listener state, but `file-ingestion-values.svelte.ts` owns only a local generation. A bucket still selection does not invalidate an already-dispatched Values video probe. Use a store-level epoch advanced by every selection-changing intent and checked by every completion. |
| SEP-11 | Agree | Source-confirmed | `S:tauri-app/src-tauri/src/main.rs:27-47` and removal commands delete paths without native job ownership. Frontend tokens suppress publication but do not stop queued/running native work from recreating bytes. `S:tauri-app/src/lib/stores/image.ts:411` can drop the last JS reference without releasing a native artifact. IMP-193 must precede complete Values/Batch lifecycle claims. |
| SEP-12 | Agree, low priority | Executed/source confirmed | `S:tauri-app/src/lib/services/frame-snapshot.ts:55-59` deliberately creates a display label containing ` @ timestamp`; the Colors export basename logic strips a last dot suffix and loses dotted source provenance. This is naming fidelity, not byte loss. Keep IMP-194 optional after required remediation. |

## July sweep disposition

“Adopt” means semantic transplant onto the accepted live base with the current ticket tests; it does not mean cherry-pick the historical commit unchanged.

| Sweep ID | Disposition | Counterevidence or integration condition |
| --- | --- | --- |
| SWEEP-001 | Adopt, then extend in IMP-184 | Token-aware export completions are sound, but no immutable source/result/settings job exists. |
| SWEEP-002 | Adopt | Same-file/hard-link/overwrite handling is the right RT-01 repair. Add symlink-destination and injected copy/persist failure tests that prove the old destination survives. |
| SWEEP-003 | Adopt | Resetting pending seek/restore state fixes the demonstrated A-to-B leak, but does not solve the same-video step race in SEP-03. |
| SWEEP-004 | Adopt | Listener setup rollback and rejection handling are self-contained. Preserve its focused failure-path tests. |
| SWEEP-005 | Adopt | Retained media identifiers are compatible with the current store contract. Recheck against the canonical epoch work. |
| SWEEP-006 | Adopt | Token invalidation on Batch removal/clear is correct. Add both late-success and late-error regressions at the export caller. |
| SWEEP-007 | Adopt | The cap/epsilon correction and exact boundary tests are self-contained. |
| SWEEP-008 | Adopt | Marking Batch inputs as extracting at scheduling time and settling with the actual file timestamp closes the found race. |
| SWEEP-009 | Adopt, P4 | `.tif` registry parity is low risk and independently testable. |
| SWEEP-010 | Adopt only with IMP-181 | `contentRevision` is necessary, but the runner and seed keys omit it and the boolean preservation path can assign old analysis to a new revision. |
| SWEEP-011 | Adopt | MIME-derived clipboard extensions and cleanup across supported `paste-*` formats are correct; retain the format table and cleanup tests. |
| SWEEP-012 | Adapt, do not adopt verbatim | It prevents false convergence but treats every reseed attempt as material. Land only after accepted IMP-178 and pair it immediately with IMP-187's actual-center-change check. |
| SWEEP-013 | Adopt only with IMP-192 | Canceling debounce/events on non-video actions helps, but does not revoke an already-dispatched probe. |
| SWEEP-014 | Adopt, repair test | RGBA/premultiplied-alpha handling and the sentinel are sound. Fix the all-transparent artifact assertion's directory depth under IMP-185. |
| SWEEP-015 | Adopt, then extend in IMP-184 | Retry/token logic for export-owned analysis is useful; source and option provenance remain mutable across awaits. |
| SWEEP-016 | Adopt | Pre-mount preference hydration plus serialized writes is the right shape. Retain delayed-hydration and failed-write recovery tests in the current harness. |
| SWEEP-017 | Adopt only with canonical revision rules | Multi-analysis revision tracking is sound if restored content keeps a proven original revision and new bytes always receive a new one. |
| SWEEP-018 | Adopt | Checking video path, content revision, and raw result before deferred publication is correct. Preserve positive and negative deferred-completion tests. |
| SWEEP-019 | Adopt as collision prevention | Unique Batch paths stop overwrite, but do not provide retirement. IMP-186 remains required. |
| SWEEP-020 | Adopt | Retaining last-good output while surfacing error/retry state is a coherent UI policy. |
| SWEEP-021 | Partial; replace publication mechanism in IMP-185 | Generation directories prevent different-generation overwrite, not concurrent same-generation writers. Direct finals, duplicate decode, and swallowed metadata errors remain. |
| SWEEP-022 | Partial only | Removing opportunistic pruning prevents one deletion path; it is not ownership, release, startup recovery, or Batch cleanup. |
| SWEEP-023 | Adopt only with IMP-183 | Disposing controllers prevents disposed-view publication, but the successor still does not reacquire a same-path pending frame. |
| SWEEP-024 | Adopt | Central FFmpeg error formatting is self-contained and improves typed failure evidence. |
| SWEEP-025 | Adopt | The typed `analyzePath` bridge removes duplicate raw invocation and has the right default/error boundary. |
| SWEEP-026 | Adopt | The formatting helper is self-contained. The historical log's missing candidate completion note is a documentation discrepancy, not code counterevidence. |
| SWEEP-027 | Adopt, strengthen parity proof | Zod schemas match the inspected Rust shapes, but hand-authored TypeScript objects do not prove Rust serialization parity. Add producer-backed fixtures or native serialization tests. |
| SWEEP-028 | Adopt only with IMP-188 | Request-token ownership is useful, but the queued restore no longer has a revocation check. |
| SWEEP-029 | Adapt | Move blocking work off async command threads, but wrap the current `color_core::analyze` API; do not restore the sweep's obsolete inline pipeline or claim cancellation. |
| SWEEP-030 | Adopt, strengthen producer proof | Canonical hashed IDs are sound. `artifact_id.rs:43-50` calls the same helper three times; it does not prove that frame, strip, and Values producers actually pass the same logical identity. |
| SWEEP-031 | Adopt | The Values chart-save adapter is an exact XC-08 repair. |
| SWEEP-032 | Adopt | The Notan adapter is an exact XC-08 repair. Remaining generator/palette consolidation belongs to optional IMP-189/190. |
| SWEEP-AUDIT | Import as immutable historical evidence only | Do not replay its generated `RAG/INDEX.md`, stale statuses, or old branch topology as current truth. |

## Required compositional contract: selection, content, and frame identity

One counter cannot safely represent both user intent and byte identity.

### Canonical identities

- `selectionEpoch`: monotonically advances for every intent that changes the selected source, including bucket still/video choice, file-dialog acceptance, replacement, current-entry removal, and clear. It answers “is this completion still wanted?”
- `contentRevision`: changes only when the accepted pixels/source bytes change. It answers “does this cached analysis describe these bytes?”
- `frameIdentity`: `{ videoId, videoContentRevision, timestamp/frameId, decodeToken }`. It answers “which decoded frame settled?”
- `paramsKey`: remains part of analysis identity, but never substitutes for source revision.

### Required flow

1. `beginSelection()` advances and returns the epoch before dispatching work.
2. Every probe/decode/load/analysis captures the epoch and the appropriate content/frame identity.
3. `settleSelection(epoch, value)` validates without advancing the epoch. A stale completion cannot call `setFile`, publish a frame, clear newer pending state, or change view state.
4. New bytes get a new `contentRevision`. Exact cache restoration proves the original file/frame/params identity and retains that proven revision; it must not increment the revision and then preserve old analysis under the new number.
5. Replace `preserveColorAnalysis: boolean` with a `RestoreIntent` containing at least `{ selectionEpoch, contentRevision, frameIdentity, paramsKey, decodeToken }`. Step, seek, selection, replacement, and dispose revoke it.
6. `VideoState` stores requested playhead/pending identity separately from settled frame identity. A successor view compares both even when `videoPath` is unchanged and reacquires when they differ.

## IMP-193 native artifact admission, lease, and release contract

The smallest adequate mechanism is one process-local Tauri `ArtifactRegistry`, plus crash-recovery manifests for artifacts intentionally persistent across a process. It should own only canonical app cache/local-data roots; external user sources and export destinations are never deletable registry artifacts.

### State and identities

- Opaque `JobId`, `ArtifactId`, `ArtifactGroupId`, and unique `LeaseId` values. Releases are idempotent by `LeaseId`, not integer refcount decrements.
- `SourceKey { mediaId, contentRevision }` and a persistent-in-process `revokedThrough[mediaId]` tombstone.
- Artifact lifecycle: `Staging -> Published -> DeletePending -> Deleted`.
- Provenance on every artifact/group: source key, class, immutable paths, producing job, semantic owners, active leases, and persistence class.

### API/ownership sequence

1. `admitJob(sourceKey, class)` executes synchronously in the command before `spawn_blocking`, FFmpeg, or any await. Admission fails when the source revision is revoked and creates a job lease otherwise.
2. `allocateStaging(jobId)` returns a registry-chosen private path/dir. No two writers share a writable final path.
3. The producer snapshots/decodes its input once, writes and verifies staging, fsyncs where required, then calls `publish(jobId, manifest)`. Publication atomically renames and rechecks the source tombstone under the registry transition. Failure or revocation removes staging and returns a typed stale/canceled error.
4. The command response returns an artifact/group reference plus its job lease. On an accepted frontend token, `transferLease(jobLease, semanticOwner)` moves ownership to the matching ImageEntry revision, VideoCache entry, Values result key, or Batch generation. On a stale completion, the caller releases the job lease. Transfer itself rechecks revocation.
5. Display, pin, cache, and export consumers call `acquireLease(artifact/group, owner)` and always release in `finally`/dispose. An export acquires every dependency before its first await. Use the same registry for frames, strips, snapshots, Values groups, and Batch grids; do not create a second JS-only reference-count system.
6. `revokeSource(sourceKey)` records the tombstone even when a native job has not admitted yet, removes logical cache/media owners, and marks their artifacts delete-pending. Running/read/export leases keep immutable bytes alive. Late admission and late publication fail. Last release deletes exactly once.

For Values, the three PNGs and metadata are one group with one completion manifest. Cache lookup identity may remain deterministic, but writer staging identity must be unique. A cache hit is imported into the registry before its paths are returned. For Batch, each export generation is one group. Native cancellation can later save CPU; it is not the correctness boundary.

### Startup recovery

- Delete abandoned staging and session-only published frame/strip/Batch/snapshot/clipboard artifacts, because no lease survives a renderer/process restart.
- Retain only fully committed persistent Values groups with a valid completion manifest, then apply the approved unowned-retention budget.
- A path without a valid manifest is not a cache hit.
- A full SQLite ownership database is unnecessary for this first contract; atomic manifests plus the live registry are sufficient and smaller.

### Cache-pressure decision required

Invariant: **never silently evict an artifact with a semantic owner or active lease.** The Review Lead/owner must choose the behavior after unowned LRU reclamation is exhausted:

- **A — fail closed (recommended for the first implementation):** reject new admission with a recoverable “managed cache full” error and actionable retry guidance. Smallest and most predictable; an export can be delayed until an owner releases.
- **B — bounded soft overflow:** permit growth to a separate hard ceiling, then fail closed. Better continuity, but adds two-budget policy and worst-case disk growth.
- **C — explicit user management:** require a cleanup/storage action. Most product work; unsuitable as the first correctness patch unless already designed.

Path allowlists alone, frontend refcounts alone, and open OS handles alone are insufficient: none closes the queued native admission/recreation race across all platforms and process restarts.

## Ticket fence corrections required before coding

Because ticket fences are normative, these are amendment requests, not implied authorization:

| Ticket | Required correction |
| --- | --- |
| IMP-179 | Resolve ownership with IMP-178. If IMP-178 is accepted with the fixture edit, mark 179 satisfied-by rather than assigning a duplicate edit. |
| IMP-180 | Pin semantic adoption to `5baa20e` or newer and the accepted IMP-178 tip. Allow the accepted k-means test module (`color-core/src/kmeans_tests.rs` if IMP-178's extraction lands). Keep `RAG/INDEX.md` regeneration Review-Lead-owned, not part of a code adoption commit. |
| IMP-181 | Add `tauri-app/src/lib/views/HomeView.svelte`; its id-only seed adapter must pass the accepted content revision. |
| IMP-182 | Add `tauri-app/src/lib/stores/video.ts` if the exact restore identity is stored with cache entries, and add `HomeView.svelte` if the restore/seed handoff changes there. Decide this before assignment rather than crossing the fence mid-sitting. |
| IMP-184 | Permit the new ownership bridge/API and source-snapshot helper needed to acquire dependencies before the first await. Export-owned store setters should report accepted/rejected publication so rejected artifact results can be released. |
| IMP-185 | Add the TypeScript bridge/contracts and Values store/runner integration needed to transfer or release the native artifact group; a native-only atomic publisher does not close lifecycle ownership. |
| IMP-186 | Add `bridges/compose.ts`, IPC contracts, and the Batch export runner/spec if the managed grid response and lease retirement are wired here rather than IMP-184. |
| IMP-187 | Pin its test file to the accepted IMP-178 structure; likely `color-core/src/kmeans_tests.rs`, not only the current snapshot suite. |
| IMP-192 | Add `tauri-app/src/lib/views/values/video-scrubber.svelte.ts` and `tauri-app/src/lib/views/ValuesView.svelte`, or explicitly narrow 192 to probes and move all frame epoch enforcement to 183. Its current acceptance language says a stale request cannot acquire a frame, so adding both is cleaner. |
| IMP-193 | Add `tauri-app/src/lib/bridges/ipc-contracts.ts` and a dedicated ownership bridge/spec. Managed artifact/group and lease fields in command responses require runtime validation. |
| IMP-191 | Treat project record, historical-log import, generated index, and final status edits as Review Lead integration work after independent validation. |

## Recommended coding waves

Effort is expressed as focused implementation sittings, not calendar estimates. No coding wave begins until the Review Lead records the contract and fence decisions.

1. **Wave 0 — reconcile the base and collision (small, blocking).** Integrate/rebase and review IMP-178 against `5baa20e` or newer. Resolve IMP-179. Update planning facts. Do not let EPIC-029 touch k-means or the golden TS spec until this is settled.
2. **Wave 1 — semantic sweep adoption (large, serialized by shared files).** Recreate the approved SWEEP commits one issue per commit on the accepted base. Independent low-risk items may be prepared concurrently only when their exact file sets are disjoint. Do not claim SWEEP-021/022/028 or the revision fixes complete at this stage. Land SWEEP-012 only together with/immediately followed by IMP-187 so the integration tip never knowingly has the degenerate max-iteration regression.
3. **Wave 2 — canonical frontend identity (large).** IMP-181 -> IMP-192 -> IMP-182 -> IMP-183. These share `image.ts`, `video.ts`, `HomeView`, and controller paths and should be one serialized lane. End with cross-view positive/negative frame provenance tests.
4. **Wave 3 — native ownership core (large).** IMP-193 may begin in parallel with the native-disjoint portion of Wave 2 after its API is frozen, but its bridge/store hookup must serialize with Wave 2. Review the state machine and pressure behavior before downstream work.
5. **Wave 4 — artifact and export consumers (large).** Native Values atomic publication in IMP-185 and immutable export jobs in IMP-184 can be prepared in parallel only after IMP-193, with explicit division between native publication and frontend leases. Integrate ownership-transfer tests before either is called complete.
6. **Wave 5 — reclamation and queued UI work (medium).** IMP-186 after 184+185; IMP-188 can run alongside native-only work because its service/spec files are disjoint. Test paused exports, last-owner release, startup cleanup, and queued restore revocation.
7. **Wave 6 — independent acceptance (medium).** IMP-191 on a clean candidate. Run the full prescribed JS/Rust gates, targeted race/ownership suites, Windows-sensitive copy/rename cases where available, source-to-ticket fence audit, commit-count reconciliation, and generated-index update. Review Lead decides acceptance and integration.

Recommended concurrency limit: at most **two implementation writers** inside this epic, and only on declared disjoint file sets. Until IMP-178 is integrated, treat k-means/golden-fixture files as an externally owned lane. The selection lane and export/artifact frontend lane overlap too heavily for speculative parallel edits.

## Test/evidence requirements by boundary

- **Selection/revision:** same params + new bytes; id-only seed cannot match; stale success and stale error; file dialog, bucket still, bucket video, replacement, removal, and clear all advance one epoch.
- **Restore/frame:** cached A -> fresh B; cached frame -> step before completion; same-video view switch while decode pending; dispose and successor; exact positive restore retains analysis only when frame/revision/params/token all match.
- **Export:** pause after every await boundary while selection, name, checkboxes, scale, format, result, and frame change; output remains from one captured job or fails explicitly. Verify every acquired lease releases on success, stale completion, error, and cancellation.
- **Values publication:** two same-key writers; injected PNG/meta/fsync/rename failures; source mutation between would-be decodes; transparent input; cache hit never rewrites published bytes; no incomplete generation becomes visible.
- **Ownership:** revoke before admission, during work, before publish, after publish/before frontend ACK, and during export; stale output never resurrects; final release deletes once; active lease survives cleanup; restart removes abandoned staging and keeps only valid persistent manifests.
- **Batch:** unique concurrent generations, paused export lease, success/error cleanup, startup orphan cleanup, and budget-pressure behavior chosen above.
- **K-means:** empty-cluster material reseed forbids convergence; unchanged reseed may converge; deterministic output and fixed iteration bound on degenerate inputs; preserve IMP-178 SIMD/scalar parity.
- **Scroll:** clear/new capture after callback enqueue but before microtask and before RAF; replacement container; unmount/dispose.
- **Schema parity:** test actual Rust serialization or checked shared fixtures for frame, strip, Values, and artifact-lease responses—not three direct calls to one helper.

Historical tests in `S` are useful regression seeds, not current-base validation. The uncommitted IMP-178 gate report is likewise evidence for its own review, not proof that EPIC-029 passes. Final acceptance must be rerun from the clean integrated candidate under Node 20/npm-10-compatible lockfile and the repository's full JS and Rust gates.

## Optional ticket recommendation

- Keep **IMP-189** and **IMP-190** in backlog. SWEEP-031/032 close the exact known chart-save inconsistencies; broader generator/palette consolidation is architectural cleanup and adds shared export-surface risk during remediation.
- Keep **IMP-194** in backlog. Preserve its reproducer and naming requirement, but schedule it after artifact/export correctness unless the owner elevates display-name fidelity for the release.
- Do not include 189/190/194 in EPIC-029's required acceptance or first integration candidate.

## Requested Review Lead rulings

1. Confirm live base `5baa20e` or newer and revise the recorded divergence.
2. Choose IMP-178/179 ownership and the accepted k-means test-file shape.
3. Approve the `selectionEpoch` / `contentRevision` / requested-vs-settled frame model.
4. Approve the native registry/lease contract and cache-pressure option A, B, or C.
5. Amend the listed ticket fences and dependencies.
6. Confirm required scope excludes optional IMP-189/190/194.
7. Only then issue the implementation verdict and first coding wave.
