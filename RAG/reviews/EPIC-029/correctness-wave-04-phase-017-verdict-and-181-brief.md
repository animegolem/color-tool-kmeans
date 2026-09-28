# Wave04 phase017 accepted; phase181 implementation brief

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.55 §§3–8,11. Governs AI-IMP-181 and the final wave04 source/test gate. No further general preflight is requested.

## Phase017 verdict and exact base

Accept submission SHA256faaa77c233d9ca58986f378ec45d701f9d3f5da18a3fda8a778d6c9eb6edb868. Lead independently checked the five-file fence and every prepared hash; allocation before publication, caller normalization, duplicate rejection before allocation, non-recycling remove/clear behavior, primitive pinned snapshots and explicit Batch recomposition are correct within scope. Prepared473 additions/0deletions, all five files below400 lines.

Independent lead gates: frontend351/30files, focus60/7files, profiling Node88, event guard10, check0errors/2accepted warnings, lint/format/diff-check pass. Sol's negative7fail/8pass and corrected teardown mock omission are submission evidence, not separately replayed by lead. Lead full Vitest used --silent; deliberate profiling error logs remain documented by Sol's unsuppressed run. No native full/scalar run is claimed here.

Lead commit **dbfad2600b2d5395a61966c9913c12b56650993d**, parent44d7f57cc9e09a66295a91544a2dffa04542b00f, includes exactly the five source/test paths plus normal generatedINDEX:6files475 additions/1deletion. Candidate-local commit hooks pass format/lint/fmt/clippy/index with command-local core.hooksPath=.githooks and shared configuration unchanged. No LOC bypass required. Candidate clean after commit; no main, app/build/evidence or release change.

Use the existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at exact cleandbfad2600b2d5395a61966c9913c12b56650993d. Preserve010/017 and profiling prerequisites. Recheck base/status before edits; no Git mutation.

## Exact phase181 three-file fence

- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`: include actual normalized contentRevision consistently in scheduled and seeded request-key construction. A small shared local key helper is allowed if useful; do not alter parameter values, scheduling, token ownership or profiling authority.
- `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts` (new): real createFileIngestion, image store, analysis store and createAnalysisRunner integration with native/IO dependencies mocked and proper rune shims/cleanup.
- `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts`: revision-aware opaque key/production-dedup parity regression, retaining existing profiling cases.

No image/multi store, ingestion/controller/Home production, Batch, Values, exports, analysis token store, profiling coordinator/trace/schema/fixtures, native/core, timing, config/dependency/hook, ticket/INDEX or design edits. The lead has inspected ingestion: cancellation precedes admission, setFile normalizes the supplied entry, and explicit scheduling copies it after normalization. Home remount seeds actual selectedFile; no ID-only adapter remains. If current executable proof identifies a genuine outside-fence requirement, return exact path/reason before editing rather than masking it in tests.

## Required behavior and regressions

1. Seed actual ready A at retained ID/path/settings from the image store. Ingest B through real createFileIngestion with unchanged path/settings. Revision must advance, A cache must invalidate, and explicit plus reactive-equivalent scheduling of the actual selected B must dispatch exactly once after the existing400ms. Assert no premature dispatch at399ms. Prefer a selectedFile subscription or an explicit labeled equivalent of Home's effect; do not claim mounted/browser scheduling from a test-local equivalent.
2. Begin deferred A, then ingest B and complete B before resolving A. Assert B's distinct result remains in analysisById and stale success cannot overwrite it. Include a stale rejection/error case or equivalent token-owned error assertion; no unhandled rejection or skipped regression.
3. Seed an actual stored selected revision/settings into a new runner as Home remount does. Repeated same-revision/settings scheduling must invoke nothing and preserve cached result. A newly store-admitted revision at the same ID/path/settings must invoke once. Do not invent revision+1 manually as the sole proof of admission integration. Keep existing error-retry and cancellation behavior unchanged.
4. With profiling enabled, A/B keys observed by observeSchedule differ only as required by revision/config identity; B is not production-deduped, repeated B is. Retain real collector/harness coverage where needed to prove one delivered/bound action and one native call per B, not merely mocked boolean expectations. No revision field is added to accepted wire/schema or historical traces. Opaque request-key changes must not change native numerical request, source matching, store receipt or existing DOM contract.
5. Use actual normalized revision in both key paths. Optional legacy fixture values may remain compatible, but never substitute a default for a known store revision or synthesize an ID-only seed. Preserve400ms debounce,150ms spinner threshold and all tolerance/iteration/sample/seed/quality parameters. Cancellation is renderer token revocation, not native preemption or immutable source ownership.

## Full final-wave validation

Use installed dependencies; no install/build/package/launch. Run the seven-file017 focus plus the new analysis-runner-revision suite, then full frontend `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, profiling `node --test scripts/profiling/*.test.mjs`, root `node --test scripts/svelte-event-guard.test.mjs`, and `git diff --check`.

At this final tip also run from the candidate native directory `cargo fmt --all -- --check`, `cargo clippy --workspace -- -D warnings`, `cargo test --workspace` (offline/locked allowed with installed dependencies), and root `cargo test -p color-core --no-default-features --test kmeans_snapshots` plus `cargo tree -p color-core --edges normal` to verify no Tauri dependency. Report actual counts and intentional ignored test separately; profiling Node's production-emitter invocation remains its own proof. No app/native build acceptance or Windows/Linux gate is inferred from these tests.

Add regressions before the production fix where practical and report actual negatives. Keep no skipped/it.fails cases. Respect truthful test boundaries, hashes and logs; if source/test size grows above400, flag cohesion for lead review, do not minify to satisfy LOC.

## Submission and stop

Write only the planning report `RAG/reviews/EPIC-029/correctness-wave-04-phase-181-submission.md` with exact base/head/status, before/prepared hashes, changed paths, permanent test delta, negative and final gate counts, expected warnings/errors and candid residuals. Distinguish complete renderer replacement proof from pending mounted/native/owner and broader ownership acceptance. Candidate source remains uncommitted. Notify Review Lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 immediately with report path/hash, then stop without polling. Lead owns review, final-wave verdict and atomic181 commit. No next-wave scheduling/UI/native work, Git mutation, app/browser action, owner bell, watcher or cleanup is assigned.
