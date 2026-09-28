# Correctness wave 06 — native artifact source delta review

Code Lead -> Review Lead, 2026-09-06. Review-only input for AI-IMP-193; no implementation or policy selection.

## Exact observed state and evidence boundary

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Observed HEAD: `933d888880ee5507aa0ce4ee2b81bcdc3756e3ff` (`fix(video): retain requested frame intent across view handoff [AI-IMP-183] [SWEEP-023] [loc-bypass]`)
- Candidate status was empty before and after inspection. No source, test, dependency, lock, ticket, index, Git, app, artifact, or runtime state was changed.
- Planning carrier remains based at `2cc2000bce04ce2e6bda11a2853dd42595946980` with its existing uncommitted review/design record. This new file is the only write from this review.
- For each source SHA below, `git merge-base --is-ancestor <source> 933d888...` returned false and `git cherry 933d888... <source>` returned `+ <source>`. The six commits are neither ancestors nor patch-equivalent commits on the candidate.
- Current-path probes also find none of the distinguishing implementations or regressions: no `sweep_019`, `sweep_021`, `prune_startup_cache`, media `IpcResponseError`, `run_blocking`/`spawn_blocking`, or `canonical_artifact_id`. Conversely, the 60-second runtime-prune loop remains present.
- I inspected the six historical patches and the current writer/release paths. I did not run tests or builds for this read-only delta. Wave05's accepted 434-renderer/72-native receipt establishes a green `933d888` source tip, not the missing native lifetime behaviors below.

## Exact SWEEP prerequisite disposition on `933d888`

All six named source commits are absent. Some neighboring infrastructure exists, but none is enough to relabel the named patch present.

| Source identity | Current-tip evidence | Disposition and retained limit |
| --- | --- | --- |
| `84c8f88b85752303cfb3a4dce6f1670920bf7168` — SWEEP-019 | `compose_grid.rs:96-101` still writes every request directly to `batch-grid.png`; the historical unique-tempfile writer and concurrent red/blue immutability regression are absent. | **Absent.** Adopt the collision-prevention behavior and regression. It prevents concurrent overwrite but does not publish, lease, or retire a Batch generation; IMP-186 remains required. |
| `0f15c8e5697613586cabc6d8f1e203fa92f3615b` — SWEEP-021 | `value_analysis.rs:116-126` still chooses `value-analysis/{sanitize(imageId)}/k{levels}-{mode}` and writes the three finals directly at `:164-282`; no source-generation directory or concurrent-generation regression exists. | **Absent.** The historical generation directory is only an interim different-generation collision barrier. Same-generation writers, direct finals, incomplete groups, and publication remain IMP-185. Its path/mtime/length tuple must not be promoted to byte identity under C3. |
| `dd73c6ba370de1d14d527b85bfecda1387004ce2` — SWEEP-022 | The inverse behavior is live: `cache.rs:7,130-141` defines runtime pruning, `main.rs:89-92` runs it every 60 seconds, `ffmpeg.rs:167,262,266-301` prunes sibling strip/frame PNGs after completion, and `value_analysis.rs:304` prunes after generation. | **Absent and still safety-critical.** Remove blind session-time pruning before introducing owners. This is only the safe interim; startup import/recovery and owner-aware reclamation remain IMP-193/186. |
| `3640300831162cf530e61b9cfe6f0b82edf49c23` — SWEEP-027 | `bridges/video.ts:34-50` casts unknown frame/probe/strip replies; `bridges/compose.ts:11-17` returns an unchecked reply; `ipc-contracts.ts` and its spec do not exist. Zod and separate compute/Values validators already exist. | **Absent on the named media surfaces; adjacent parser capability present.** Adopt the four-file validator seam, then extend that same contract for artifact/group/escrow fields. Hand-authored JS fixtures still do not prove Rust serialization parity. |
| `489c3627d264b67e9789f0bb25ac5d41a525f5df` — SWEEP-029 | `commands.rs:13-42,44-103,105-132,253-272` performs image analysis, Values work, file IO, and grid composition inline in async Tauri commands. No blocking-worker helper or worker tests exist. | **Absent.** Adapt around current `color_core::analyze` and current profiling state; never restore the historical inline engine. Executor placement supplies a safe place for synchronous work but is not native cancellation or ownership. |
| `e383b8812a68326fd7a0b0a7d4bbcc4edae4e59f` — SWEEP-030 | There is no `artifact_id.rs` module. `commands.rs:158-167,205-232` and `value_analysis.rs:118,665-680` still use lossy ASCII sanitizers. Current callers usually generate UUID-like IDs, but no producer-backed shared-identity proof exists; Values can reuse an entry ID while its frame command used a fresh extraction ID. | **Absent.** Adopt collision-safe canonical IDs and real producer parity tests. Preserve C3: a canonical logical identifier is authority/naming, not proof of immutable source bytes. |

## Smallest dependency-ordered prerequisite adoption fences

These are proposed issue-sized fences for a later lead assignment, not permission to edit them now. Adapt each source patch to `933d888`; do not cherry-pick its obsolete parent stack or RAG/INDEX changes.

1. **Safety floor — SWEEP-022 first.** Source: `tauri-app/src-tauri/src/cache.rs`, `ffmpeg.rs`, `main.rs`, and `value_analysis.rs`. Retain their existing in-file tests and add/adjust only a direct no-session-prune regression if the lead requires executable proof. This order intentionally prevents later collision fixes from spending even one accepted tip under blind runtime deletion.
2. **Independent collision/validation lanes after the safety floor.**
   - SWEEP-019: `compose_grid.rs` plus its in-module concurrency regression. The historical tempfile strategy additionally needs `tauri-app/src-tauri/Cargo.toml` and dependency-only `Cargo.lock` reconciliation because `tempfile` is currently dev-only. A registry-chosen unique staging path may replace that mechanism only if the lead explicitly folds the proof into IMP-193/186.
   - SWEEP-021: `value_analysis.rs` and `tauri-app/src-tauri/tests/audit_value_cache.rs`. Apply only generation isolation and its regression; do not reintroduce the generation-time prune removed in step 1 and do not claim atomic publication.
   - SWEEP-027: `tauri-app/src/lib/bridges/video.ts`, `compose.ts`, new `ipc-contracts.ts`, and new `ipc-contracts.spec.ts`. `zod` is already a direct npm dependency, so no package/lock edit is needed.
   - SWEEP-029: `tauri-app/src-tauri/src/commands.rs`, including its in-module off-thread/result/panic regressions. Preserve `color_core::analyze`, core IPC re-exports, profiling begin/end attribution, and current FFmpeg async process calls.
3. **Shared ID adaptation — SWEEP-030 after SWEEP-021 and SWEEP-029.** Source: `tauri-app/src-tauri/Cargo.toml`, dependency-only `Cargo.lock`, new `src/artifact_id.rs`, `src/lib.rs`, `src/commands.rs`, and `src/value_analysis.rs`; tests stay in the helper/current producer suites. `sha2` exists transitively in the lock but is not a direct native dependency. This step must add producer-backed frame/strip/Values cases rather than relying only on three calls to one helper.
4. **Only then start the IMP-193 base protocol.** Native registry/session/admission and the bridge/session handshake precede active-view transfer/release hookup. Values publication remains IMP-185, export retention IMP-184, and Batch lifecycle IMP-186 in the already accepted `193 -> 185 -> 184 -> 186` shared-hook order.

SWEEP-019, 021, 027, and 029 are otherwise disjoint enough to prepare independently, but `Cargo.toml`/`Cargo.lock`, `commands.rs`, and `value_analysis.rs` are serialized integration seams. One dependency reconciliation after both manifest consumers is the smallest integration delta even if issue provenance remains separate.

## Current writer, owner, and release topology

### Video frames

- Native writer: `commands.rs:147-178` derives `video-frame-{sanitized frameId}.png`; `ffmpeg.rs:213-263` invokes FFmpeg with `-y` directly against that final path and then prunes siblings. A repeated ID therefore names writable bytes, not an immutable artifact.
- Home owner: `views/home/video-controller.svelte.ts:498-569` reuses one `videoFrameId`, serializes only its own same-ID requests, and `:419-472` publishes an accepted path into the image store, `SettledVideoFrame`, global `videoState`, active path, and `videoStateCache`. A stale completion at `:425-430` is ignored but its native output is not released.
- Values owner: `views/values/video-scrubber.svelte.ts:162-279` allocates a fresh request ID, then `ValuesView.svelte:61-141` may normalize publication back onto an existing logical image entry. It publishes the settled path into the same global video/image/cache state. A stale completion is likewise ignored without native release.
- Wave05 handoff: `stores/video.ts:4-49` now distinguishes requested playhead from a settled `{selectionEpoch,imageId,contentRevision,outputPath,videoPath,requestedTime,maxDimension}`. Home and Values dispose their local request authority (`video-controller.svelte.ts:960-979`; `ValuesView.svelte:225-251`; `video-scrubber.svelte.ts:319-327`), while the global selected entry/state/cache intentionally survives for the successor view. That is correct renderer authority, but it is not a native lease transfer.
- Deletion: `stores/image.ts:369-412,486-507` fire-and-forgets `cleanupMediaArtifacts` on remove/clear. `artifact-cleanup.ts:4-18` sends only `{imageId, artifactPath}`; `main.rs:36-55` deletes the Values directory and the one allowlisted frame path. This can race a surviving display/cache/export owner. Independent startup/60-second/sibling pruning can also delete the path.

### Video strips

- Home is the only producer: `video-controller.svelte.ts:297-375` sends its retained/random `stripId`, then stores the returned path in global `videoState` and `videoStateCache`; regeneration at `:377-385` abandons the old pointer without a release. Values consumes/preserves the shared strip fields but does not produce a strip (`file-ingestion-values.svelte.ts:53-70,128-140`).
- Native `commands.rs:193-245` and `ffmpeg.rs:130-168` write a sanitized-ID final path with `-y`; stale Home results are ignored without release.
- `remove_managed_artifact` does not admit strip paths (`cache.rs:144-172` recognizes clipboard, frame, and snapshot only). Strip retirement is therefore only incidental sibling/startup/periodic count pruning. View disposal clears local pointers/tokens, not the cached/global strip owner.

### Clipboard images

- Topology changed since the accepted protocol: `App.svelte:230-254` now only handles the paste event and delegates. The actual writer/selection boundary is extracted to `services/clipboard-ingestion.ts:53-101`, with its regression seam in `clipboard-ingestion.spec.ts`.
- The helper begins renderer selection before awaits, reads concrete Blob bytes, and passes those bytes to `save_file` at a timestamp-derived `cache/clipboard/paste-*` path (`clipboard-ingestion.ts:64-93`; native `commands.rs:105-117`). On success it converts that path into an `ImageEntry`; there is no native source generation, response escrow, digest, or lease.
- If selection becomes stale after `save_file`, the helper returns stale without deleting or adopting the written file (`clipboard-ingestion.ts:78-81`). On accepted remove/clear, image cleanup deletes the allowlisted path; the 60-second/startup size/age pruner can independently delete even a live entry (`cache.rs:130-141,175-205`).

### Snapshots

- Both active view owners reach the same writer: Home's `views/home/VideoPanel.svelte:19-26` and Values' `ValuesView.svelte:161-169,210-213` call `services/frame-snapshot.ts` only through their settled-frame eligibility seams.
- `frame-snapshot.ts:33-67` chooses a UUID destination under app-local-data `snapshots`, asks native `copy_file` to reread the frame **by path**, and then appends a plain image entry. The copy is a useful persistent byte copy, but the request does not lease or digest the source path and the response exposes only the destination path.
- Removal/clear uses the same fire-and-forget cleanup path and native allowlist; startup/periodic size/age pruning also covers snapshots. View unmount has no snapshot lease semantics, and an in-flight copy has no response escrow or idempotent operation recovery.

## Path identity versus immutable-byte capability

Current production exposes several path/logical identities but no end-to-end immutable managed-source capability:

- Renderer `SelectionAuthority`, `contentRevision`, `SettledVideoFrame`, image IDs, frame/strip IDs, active path, and cache keys prove current logical intent or matching renderer state. They do not prove current bytes at an external or writable managed path.
- Frame, strip, Values, compose, copy, and analysis IPC requests identify sources by strings; their responses return paths (plus dimensions/timestamp/data) without an input digest, immutable artifact/source ID, group manifest, escrow, or lease. Existing Values/compute Zod parsers prove response shape only.
- Clipboard ingestion and native `save_file` do carry a concrete encoded byte array across one call. After that call, every consumer refers to the resulting mutable/prunable path; no digest or capability binds later analysis/export to those bytes.
- `frame-snapshot` creates a uniquely named copy, but its source is still reopened by path and its destination has no native immutable identity. Uniqueness by convention is not a lease or verified-byte equality.
- `color-core::analyze::ImageSource::Bytes(&[u8])` at `color-core/src/analyze.rs:99-165` is a real exact-byte analysis capability, with path/byte parity tests in `color-core/tests/analyze_bytes.rs`. The Tauri command uses only `ImageSource::Path` (`commands.rs:21-26`), so that library API is not currently a renderer/native admission capability.
- `ImageEntry.source` is only `{kind:'path',path}` or `{kind:'blob'}` (`stores/image.ts:30-42`); the blob variant does not retain the encoded bytes. The native file picker also represents a selected local file primarily by path.

C3 therefore remains fully live: immutable equality must come from the registry's retained input `ArtifactId`/verified digest and shared job snapshot. No current renderer revision, canonicalized filename, path/mtime/length tuple, or native source-generation authority may stand in for it.

## Minimal IMP-193 fence correction for the current topology

The ticket's native/bridge/store/session files remain the right base, but its current exact fence predates the extracted clipboard writer and post-183 dual-view ownership seams. Before coding, the lead should issue a numbered scope amendment for only these additional current paths:

- `tauri-app/src/lib/services/clipboard-ingestion.ts`
- `tauri-app/src/lib/services/clipboard-ingestion.spec.ts`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`
- `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-resource-integrity.spec.ts`
- `tauri-app/src/lib/views/home/VideoPanel.svelte` and `tauri-app/src/lib/views/ValuesView.svelte` only for passing a managed frame capability into the two existing snapshot call sites
- a focused `tauri-app/src/lib/services/frame-snapshot.spec.ts` (new) if snapshot acquire/copy/ACK/release is not completely covered through the ownership-bridge and view suites

`App.svelte` remains appropriate for C1 client-document/session lifetime and paste-listener hookup, but it is no longer the clipboard byte writer. `stores/video.ts` is already fenced and should carry the accepted frame/strip artifact reference needed across Home/Values handoff. `artifact-cleanup.ts` and `stores/image.ts` are already fenced and remain the remove/clear integration seams. `HomeView.svelte` and `file-ingestion-values.svelte.ts` need no source edit merely to release native artifact ownership: their current child-controller disposal/probe roles can stay unchanged unless an executable implementation proves a new adapter is necessary.

The minimum implementation serialization remains:

1. native registry/session/operation-key core and recovery tests;
2. IPC validation plus C1 document bootstrap and C2 status/cancel/ACK recovery;
3. store/cache semantic-owner transfer and exact remove/clear release;
4. Home frame/strip and Values frame response acceptance/stale release across the existing handoff suite;
5. clipboard and snapshot managed-input/output hookup;
6. later IMP-185 Values publication, IMP-184 retained exports, and IMP-186 Batch lifecycle.

## Preserved accepted decisions

- **C1:** client activation must be ordered by a native-established window/document lifetime (or another demonstrated recency mechanism). An obsolete/delayed bootstrap cannot displace the successor; retirement is terminal absent proof of a new current document.
- **C2:** `(ClientSessionId, requestNonce)` is the durable-in-session operation key. Admission, status/result recovery, cancellation/release, and ACK are separately idempotent; cancel-before-delayed-admission is a tombstone. Lost replies cannot create duplicate jobs, snapshots, reservations, groups, or charges.
- **C3:** cached work may be reused only against the same immutable retained input identity or verified content digest and matching parameters/algorithm contract. Source-generation authority, renderer revision, path, mtime/size, and logical IDs are not byte equality.
- View unmount, renderer replacement, window destruction, and backend restart remain distinct. Release only the departing view's authority while retaining independent jobs and surviving semantic owners.
- Private staging, atomic complete-group publication, response escrow, explicit/idempotent transfer and release, backend-root confinement, and the legacy restart/retention matrix remain binding. There is no correctness timeout and no JS-only refcount substitute.

## One genuinely open pressure ruling

The remaining product/policy choice is still **F versus O after unowned reclamation**, with actual admission numbers:

- **F — fail closed** remains the lead recommendation: reject the new all-or-none reservation with recoverable `ManagedCapacityExceeded` while preserving every accepted owner/job/result.
- **O — bounded overflow** is valid only if the owner records the soft-overflow allowance and separate hard ceiling.
- **R — retention-only** is not selected by silence; it is available only as an explicit decision to accept no proactive admission bound.

For F, record at minimum the hard ceiling/headroom for the separate transient pool (job snapshots, staging, and Batch generations), any class-specific admission ceilings, and the oversized-single-job rule. For O, record the overflow bytes/ratio and hard ceilings. Existing `80` frame / `10` strip counts and `512 MiB` clipboard / `1 GiB` snapshot / `512 MiB` Values cleanup values are retention targets, not admission quotas and not a global pool. No cross-class eviction or numeric conversion is authorized by this review.

No other general protocol question needs reopening. After the lead/owner records that pressure choice and numbers, and after the six prerequisite adaptations are accepted at a named clean tip, the lead can issue the bounded IMP-193 implementation fence.
