# Wave04 phase010 accepted; phase017 implementation brief

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.54 §§3–8,11. This is the next bounded implementation assignment; no new general review or owner decision is required.

## Phase010 verdict

Accept submission SHA2565aa5e75da9cfcc684ec3960f7493873c9924f2775d5e348b8e85a64202f9853c. Lead verified the exact six-file boundary and all prepared file hashes, inspected replacement publication, Values token revocation, Home cancellation ordering and unchanged stored-entry remount seeding. Independently reproduced full frontend340/28files, focused49/5files, profiling Node88, event guard10, Svelte check0errors/2accepted warnings, lint/format/diff-check. Expected profiling error-path stacks are not failures. Submitted negative2fail/2pass is Code Lead evidence, not a separate lead negative rerun.

Lead committed **44d7f57cc9e09a66295a91544a2dffa04542b00f**, parent921571131939fbb7a9771e558bfbd4f54ab9f789. Six source/test files315 additions/56 deletions plus normal generatedINDEX yield7 files319 additions/60 deletions. Actual candidate-local hooks ran via per-command core.hooksPath=.githooks with shared configuration unchanged; formatting, lint, Rust fmt/clippy and index generation pass. LOC-bypass is explicit for the already-cohesive Home/controller/audit files, not a hook bypass. Candidate clean after commit. Main integration, native/owner interaction and complete replacement dispatch remain unaccepted; no app/build/evidence was changed.

## Exact phase017 base and fence

Use `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` on the existing branch at44d7f57cc9e09a66295a91544a2dffa04542b00f. Recheck clean base before edits. Preserve all prerequisite source including profiling. Do not apply historical017 verbatim.

Only these five source/test files may change:

- `tauri-app/src/lib/stores/image.ts`: optional public contentRevision field normalized by store admission; session-local safe-integer allocation before content publication. Preserve010 Colors/Values invalidation and dedup/resource behavior.
- `tauri-app/src/lib/stores/multi-analysis.ts`: pinned ID/revision snapshots and aggregate invalidation on pinned content change; preserve membership pruning, pin ordering and existing explicit reset behavior.
- `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts`: revision and non-recycling admission regressions, retaining all010 tests.
- `tauri-app/src/lib/stores/multi-analysis-lifecycle.spec.ts` (new): ready pinned replacement, unpinned change, preview-only update and unchanged stored-entry selection positive controls, removal/pruning behavior.
- `tauri-app/src/lib/views/batch/batch-runner-revision.spec.ts` (new): real store plus real Batch runner, native bridges mocked; explicit Analyze before and after pinned replacement invokes compose/analyze twice and returns the new result.

No runner key, ingestion, Home/controller, Batch production, Values production, analysis token store, profiling coordinator/schema, native/core, export, configuration/dependency/hook, ticket/INDEX, UI or timing changes. If a genuine adapter or fixture requirement escapes this fence, report exact path and reason before editing. Phase181 follows only after lead review/commit at a newly named base.

## Binding semantics

1. Store owns revision. Ignore absent, forged, fractional, negative or oversized caller values. Each accepted content admission receives a fresh session-local revision, including first admission and same-ID return after remove/clear. No per-ID unbounded retention map, clear reset, wraparound or unsafe integer. A monotonic allocator is sufficient; no hash/native/source-generation protocol belongs here. Fail safely before content publication if allocation is exhausted; do not add a production test-only counter setter.
2. `setFile`/same-ID append conservatively mean content admission, even with equal path. An unchanged stored-entry selection or preview-only update is not admission and retains revision. Distinct-ID duplicate-path append rejects before registering resources or replacing accepted identity; caller revision must never alter that decision.
3. Explicit scheduling callers use the entry they just supplied to setFile. Preserve API normalization so that entry and the actually stored/selected entry carry the same revision, as they already do for retained ID. Do not silently normalize only a detached copy and leave the explicit scheduling snapshot unnormalized. No dispatch/key changes in this phase.
4. Snapshot pinned revisions as primitive values so object mutation cannot rewrite the previous observation. On a pinned content change invalidate aggregate state/result/error/composite. Preserve pin IDs/order. Unpinned replacement, preview metadata and unchanged stored selection must not invalidate a ready pinned aggregate.
5. Current Batch policy returns to selection; only the next explicit Analyze recomposes. Test actual production runner calls and the new result identity, not just mocked reset invocation. Do not introduce automatic rerun, claim native work cancellation, or absorb independent in-flight Batch/export source ownership.

## Validation, report and stop

Use installed dependencies. From tauri-app run the five-file phase010 focus plus image/multi lifecycle and Batch revision suites (deduplicating image lifecycle); run full `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, `node --test scripts/profiling/*.test.mjs`. From root run `node --test scripts/svelte-event-guard.test.mjs` and `git diff --check`. Format only touched source. Native source remains unchanged; native/scalar final-wave tests remain required and are not claimed by historical counts. Reproduce meaningful negative regression failures before production edits where practical; no skipped or expected-failure tests.

Write only the planning report `RAG/reviews/EPIC-029/correctness-wave-04-phase-017-submission.md`, with exact before/prepared hashes, base/head/status, file/test counts, verbatim gates, honest negative proof and remaining gaps. Candidate source remains uncommitted. Send its path/hash to Review Lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 immediately, then stop without polling. No Git mutation, app/browser/owner controls, capture, launch, packaging, install, cleanup, owner bell or automation. Lead owns prompt017 review/commit and181 dispatch.
