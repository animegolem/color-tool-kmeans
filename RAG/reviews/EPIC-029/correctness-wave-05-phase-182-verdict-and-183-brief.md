# Phase182 accepted locally; phase183 requested/settled handoff assignment

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.60 §§3–8,11. **Accept182 test-only reconciliation. Implement183 with adaptedSWEEP023 now; stop at combined-wave review before any next ticket.**

## Accepted evidence and base

Submission159c92aaf8df738165b8e39a1e1a003914a463a9f18c28910f96a5d93da7c90d fully read; lead matched both prepared hashes and exact two-test fence. Four controller timing/queue cases and five actual controller -> image store -> analysis runner cases retain all existing assertions. The real-store matrix proves stale A consumes no admission revision, B invalidates cached A, and one dispatch publishes a distinct ready B result. No-step cached playhead still extracts afresh; unchanged stored-entry remount remains a different positive. No production defect surfaced or source change occurred. Tests passing on their first run is honest reconciliation, not fabricated pre-fix evidence.

Lead independently reproduced full413tests/34files, expanded132/12, profiling Node88, event guard10, check0errors/2accepted warnings, lint/format/diff. Lead commit **8a8e13381410841674015ae27da9310c3c659fbe**, parent2853040d6e7847eaa9aeab0d665179bb35a9dc2f: two tests391 additions plus generatedINDEX,3paths393ins/1del. Candidate clean. Candidate-local hooks passed including Rust fmt/clippy; command-local hooksPath left shared config untouched. Explicit LOC review accepts480-line focused controller suite and1220-line cohesive audit matrix for this bounded work, no unrelated extraction. Main/app/build/profiling evidence unchanged. Native full/scalar required at183 tip.

## Exact183 scope and design

Candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at clean8a8e133. Planning ticket `RAG/AI-IMP/AI-IMP-183-reacquire-pending-frame-across-views.md`; original wave05 preflight and R1–R7 remain context. HistoricalSWEEP0231546b79c6d75e5dfd6949ae8ce2763c06a8669c9 is provenance only: adapt, do not cherry-pick. The ticket's statement that Home already disposes decoding is historical and false on this base; add real disposal.

Six production paths only:

- `tauri-app/src/lib/stores/video.ts`: structured settled identity and narrowly shared pure matching predicate if useful.
- `tauri-app/src/lib/views/HomeView.svelte`: wire local disposal and actual store/entry access needed by handoff; retain profiling/runner behavior.
- `tauri-app/src/lib/views/ValuesView.svelte`: requested/settled state, successor acquisition and disposal wiring.
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: owned teardown, requested/settled publication, successor restore/probe/frame convergence, settled-only snapshot gate.
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`: immediate requested-time publication, accepting settled callback, successor matching, snapshot eligibility and existing owned teardown.
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`: own probe disposal/reacquisition under retained epoch; metadata completion preserves current request/settlement.

Five test paths only:

- NEW `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts`.
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` (approved183 fixture amendment; retain182 regressions).
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`.
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts`.
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`.

No other source/test/fixture/Git/ticket/INDEX edits. No VideoPanel, frame-snapshot service, image store, Home still-ingestion, analysis/Values/Batch/export runner, profiling schema/coordinator, native bridge/core/output registry, dependencies/hooks, EPIC026 playback or timer/numeric policy. If an interface needs another exact fixture/path, stop and request the amendment before editing it. No minification or generic coordination framework to hide LOC.

### H1 — requested versus accepted settlement

Keep VideoState.currentTime as requested playhead. Add required `settledFrame: SettledVideoFrame | null`, with accepted imageId, store-assigned contentRevision, output path, requested timestamp and maxDimension. This is renderer-session admission evidence, not decoded PTS, native lease, immutable bytes or cross-reload validity. Preserve immutable selection epoch from192. Metadata/cache poster hints never manufacture settlement. A new selection epoch clears settled proof even for the same path/ID.

Both views publish requested playhead promptly on existing step/scrub/strip interactions, before debounce/IPC, retaining the last accepted settlement separately. During actual drag, do not imply new-frame settlement or snapshots merely because a decode has not begun; retain existing gesture scheduling policy. Frame completion must pass local owner/token + epoch and successful setFile before constructing settlement from the normalized entry/revision and publishing state/cache/analysis. No stale callback cancels newer work. Probe completion merges metadata into still-owned current state; it must not reset a newer requested playhead or discard an already accepted settlement with hard-coded0/null.

### H2 — exact successor reuse and reacquisition

Compare current epoch, video path, requested time, extraction maxDimension and settled identity against the actual selected stored entry (ID/revision/path/videoPath/frameTimestamp). Missing/mismatched proof reacquires under successor ownership even on the same path with a poster. Exact same-epoch, same-size admitted settlement reuses that entry/revision without redundant extraction; an analysis missing for the destination mode can still run normally. Do not claim zero analysis across Colors and Values when only extraction reuse was proved.

Handle requested != settled, missing/removed/replaced entries and changed extraction size. Do not allocate a content revision just to relabel a cached entry. Preserve182 new-selection conservative fresh extraction; same-epoch navigation is a different operation from new selection. At own state publication/subscriber reentry, dedupe the current local request tuple so immediate synchronous store subscribers neither recursively dispatch nor revoke/duplicate their own request. Own settlement must converge once, not trigger another decode loop.

### H3 — local lifetime, not global selection reset

Home controller and Values ingestion gain idempotent terminal disposal; existing Values scrubber teardown remains terminal. Invalidate local probe/frame/strip/timer/load/event ownership, cancel pending local timers, detach element/resource references as appropriate. Success, rejection and finally from the disposed owner cannot mutate global requested/settled state, active path/cache/analysis/errors or the successor's pending state. Global selection epoch and durable requested state survive navigation. Disposal is not clearVideoSelection/clearFile and must not erase the successor's handoff.

Wire disposal in real Home/Values lifecycle cleanup before successor callbacks can publish; preserve existing profiling cancellation, runner cleanup and listener unsubscription. Do not resurrect a disposed factory via a later restore method. Missing metadata at navigation triggers one successor-owned probe under the same epoch, not a consumed one-shot event retry with a new epoch. Preserve latest requested time if probe and frame activity overlap. Native promises may continue; existing frame queue and renderer ownership do not prove cross-owner native-output safety (193 remains open).

### H4 — snapshot eligibility

Snapshots require current epoch and exact requested/settled/actual-entry match, with no pending mismatch. Null during debounce, IPC, handoff or failed requested decode; only one accepted settled path/timestamp pair may be captured after success. Existing helper/controller getter seams may change within the fence; Home can withhold snapshot-eligible videoPosterPath while retaining visual poster hints internally, without changing VideoPanel. A request returning to an already exact admitted frame may be reused only after the H2 match, not merely because extracting=false.

## Executable proof and final-wave gates

Use real image/video stores, both real controller factories and Values ingestion, accepting setFile and deferred mocked bridge IO. The new handoff suite explicitly simulates ordered disposal/creation/subscription through those real seams; label it factory integration, not mounted Svelte proof. Prove Home -> Values and Values -> Home at debounce and active IPC, old completion before and after successor completion, stale rejection/finally, same path/ID, pending probe handoff, one successor settlement/revision and correct destination analysis. Include same-epoch exact settled reuse with no redundant extraction, mismatch/removed/replaced/size controls, snapshot transitions and current decode failure. Preserve independent job,192 epoch,182 cached races and wave04 revision/profiling positives. Where practical add a meaningful pre-edit counterexample on this source; do not archive/mutate Git or fabricate negatives. No skipped/it.fails cases.

Run original expanded12-file set plus new handoff suite, then full frontend tests/check/lint/format and profiling Node88 suite. Root event guard and git diff --check. Final native gates now REQUIRED from tauri-app/src-tauri: cargo fmt --all -- --check; cargo clippy --workspace -- -D warnings; cargo test --workspace; cargo test -p color-core --no-default-features --test kmeans_snapshots; cargo tree -p color-core --edges normal (verify no Tauri dependency). Offline flag allowed; installed dependencies only. Record actual counts, including intentional ignored emitter test separately from the Node interop execution. No app build/launch/capture, native input policy or platform acceptance inferred.

Write new planning report `RAG/reviews/EPIC-029/correctness-wave-05-phase-183-submission.md` with exact base/head/status, all11-path hashes/fence, implementation/test evidence levels, actual negative/final receipts, deviations and explicit mounted/native-output/platform/owner gaps. Keep source uncommitted. Notify lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 immediately, then stop without polling. Lead reviews and commits183 only after combined-wave acceptance; no193/next-wave work, cleanup, Git, owner bell, app/browser controls or release. No owner blocker.
