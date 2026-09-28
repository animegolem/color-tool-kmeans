# Wave04 implementation verdict — adapted replacement identity

Review Lead -> Code Lead, 2026-09-06; PROJECT-RECORD rev0.53 §11. Review SHAa7d897ee16991c9d954b896029737e838628313e6003583d5821c9cf550eb76a accepted with the binding clarifications below. No further general review is required.

## Exact base and prerequisite disposition

Use existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at **921571131939fbb7a9771e558bfbd4f54ab9f789**, clean. No branch reset, rebase, clone or main integration is assigned.

Lead created two separate commits:856fc987f12ca78753205a67b960e5383144319a fixes the hook's CSS false positives [IMP203];9215711 preserves all57 reviewed profiling source files unchanged [IMP202]. Each includes only its normal generated INDEX metadata in addition to source. First commit attempt was blocked by the old hook matching button:disabled/not; no bypass used. Corrected candidate-local hooks passed using per-command core.hooksPath=.githooks, without changing shared config. Three negative cases failed before correction; all10 now pass and run inside the hook.

Lead independently reran frontend335/27files, profiling Node88 (including native ignored-emitter interoperability), native72 plus scalar1, Svelte check0errors/2knownwarnings, lint/format/fmt/clippy. Focused review count44/4files also reproduced. Rehashed all586 B20 payloads and57 source baseline before commit; old B14/B20 manifests and raw evidence retain historical identities. These commits are local source preparation, not closure of IMP202, release or benchmark acceptance.

## Binding design rulings

1. Accept rejecting preserveColorAnalysis. Fresh extraction from a mutable video path recomputes, even on cached seek restore. Remove ID-only seed adapters; unchanged stored-entry/cache remount remains the positive reuse case. Preserve saved seek behavior. This deliberately reverses the old mocked cache-reuse expectation, not the source-equality invariant.
2. Matched setFile and same-ID append must invalidate old Colors and Values before the new entry can be observed as ready. **Retain Values pending-token invalidation:** existing invalidateAnalysisForImage manually deletes caches but does not call invalidateValueAnalysisForImage. Reuse the canonical Values helper inside the allowed image-store surface, and test late Values completion after replacement. Do not replace a token-aware invalidation with cache deletion alone.
3. Video-frame replacement revokes current Home runner work before publication, using existing cancellation authority. No native preemption, selection epoch or independent export/Batch job cancellation is implied.
4. In phase017, contentRevision is store-owned admission identity, not trusted caller data or a content hash. Preserve revision for preview-only updates and reuse of the already stored entry. New content admissions get a fresh revision; remove/clear followed by same-ID re-admission must not recycle an old valid identity. Prefer a session-local monotonic allocator without a per-ID retention map; do not reset it on clearFile. Keep it a safe integer with no wraparound. Include caller-forged/absent revision and same-ID re-admission regressions. This is content admission ordering, not selection epoch.
5. Phase181 scheduled/seeded keys must consume the actual normalized entry revision, preserving profiling's opaque-key observation and unchanged wire schema. Explicit ingestion and reactive scheduling must converge to one dispatch. No changes to400ms delay or numeric request parameters.
6. Ready-pin invalidation is phase017; the next explicit Batch Analyze recomposes. Do not add automatic recompute or claim independent in-flight job/source ownership is solved.

## Phase execution and commits

Order remains010 ->017 ->181. Lead owns one atomic commit per issue. **Implement phase010 now, then submit and notify the lead before phase017 edits.** This makes each issue reviewable without partial staging of overlapping image-store changes. No owner decision is needed between phases. Subsequent phase start will name the new exact base. The entire replacement dispatch defect closes only at the181 tip.

Phase010 source fence (six files only):

- `tauri-app/src/lib/stores/image.ts`: matched Colors/Values invalidation for set and same-ID append; preserve canonical Values token invalidation. Revision allocator belongs to next phase, so010 tests do not yet assert it.
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: cancel current Home analysis before frame publication; remove unproven cached-result/ID-only seed reuse, retain cached seek and schedule replacement.
- `tauri-app/src/lib/views/HomeView.svelte`: wire cancellation and remove obsolete ID-only seed/dependencies; preserve actual stored-entry remount seed and profiling.
- `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts` (new): ready replacement, same-ID append, duplicate-path rejection/resource preservation, synchronous publication ordering, stale Values success/error rejection after replacement.
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`: cached seek retained but re-extraction cancels/recomputes; new source reset still correct.
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`: dependency fixtures and token-race regressions only.

If removing unused controller interface fields requires a fixture outside this fence, report its exact path for a narrow amendment rather than changing it silently. No runner key/revision/multi-analysis/Batch production/profiling schema/coordinator/native/Values production/exports/deps/config/hooks/build/design changes in phase010. No ticket/INDEX edits by Sol; lead owns planning records.

## Validation and report

Use installed dependencies; no install. From tauri-app run focused image lifecycle, cache-reset, audit races, profiling-contract and profiling-svelte suites; then full npm run test -- --run, check, lint, format:check and node --test scripts/profiling/*.test.mjs. From repository root run node --test scripts/svelte-event-guard.test.mjs. Run git diff --check. Native source is unchanged; final-wave native/scalar gates remain required and are not waived by current baseline results.

Reproduce negative tests before the fix where practical, keep positive cached-entry and token ownership cases. Test real store/runner/dependency behavior; do not rely only on a mocked hasAnalysisForImage boolean. No it.fails or skipped regressions. Report the exact diff and counts, expected console errors, untouched files and honest remaining gaps.

Write `RAG/reviews/EPIC-029/correctness-wave-04-phase-010-submission.md` in the planning worktree only. Candidate changes remain uncommitted for lead review. Send the report path/hash to lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 when ready, then stop without polling. No app/browser control, capture, owner notification, commits, merge or cleanup. Lead is responsible for promptly reviewing and committing010 before dispatching017.
