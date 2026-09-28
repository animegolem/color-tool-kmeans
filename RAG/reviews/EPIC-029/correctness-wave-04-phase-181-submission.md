# Correctness wave 04 phase181 — revision-aware runner submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.55 §§3–8,11 and `correctness-wave-04-phase-017-verdict-and-181-brief.md`. Review state: **SUBMITTED; uncommitted; not accepted.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains the assigned clean base `dbfad2600b2d5395a61966c9913c12b56650993d`.
- Candidate status is exactly the three permitted phase181 paths: two tracked modifications and one new test. Status-list SHA-256 is `d3aa8807aa293a9aac7cb9ef330f17bae4aab0b809f11fadb7a150797fd819f1`.
- The combined binary diff stream (`git diff --binary`, then the new file as a `/dev/null` no-index diff) has SHA-256 `178296e72e5c1330a99a20639b03d4d85384ffc6927b04091130abd8450c638c`.
- Prepared payload: **368 additions, 25 deletions**. Every changed file is below 400 lines; no LOC bypass is needed.
- No Git mutation, commit, staging, rebase, merge, branch/config/hook change, install, package change, app/browser/owner control, launch, capture, benchmark, ticket/INDEX/design edit, native/core edit, wire/schema/fixture edit, next-wave work, or cleanup was performed.

## Exact files and hashes

| File | Before SHA-256 | Prepared SHA-256 | LOC |
|---|---|---|---:|
| `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` | `bf181e03d86ec58113a7e2b19ff8ff5241a7c5cd503c56cf3af25591b215e5cd` | `a99cf4de38ed6d041e00a73449455674a0c822e4ce05e2daba6cd0a9f88d8870` | 399 |
| `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts` | absent | `8711237178d0980a063f7d9a337642a3b485da2e2d906f2fb8511291f15f9061` | 271 |
| `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` | `f4f13bec0cb0acb48de2e04a2ec826ac4d84fc667cfb9852b76002e793834c9d` | `173134a57c2d16001b6390589c565bc2cf863a46bb92308d6824f37717b24ba4` | 396 |

## Implementation summary

- `analysis-runner.svelte.ts` now has one local `analysisRequestKey` constructor shared by live scheduling and ready-result remount seeding.
- The opaque key includes the supplied `SelectedImage.contentRevision` beside the retained runtime ID and existing analysis identity. A known normalized store revision is therefore preserved exactly; optional legacy entries still serialize compatibly because JSON omits an absent optional property.
- All existing key parameters and native request values remain unchanged: clusters, quality, ignoreTopN, mergeThreshold, snapToReal, tolerance `1e-3`, max iterations `40`, seed `1`, and max samples `300_000`.
- The 400 ms debounce, 150 ms spinner threshold, status-aware error retry, renderer token/store-token ownership, cancellation behavior, scroll restoration, profiling action authority, native request, result receipt, DOM coordination contract, and wire/schema remain unchanged.

## Regression proof and test delta

Permanent test delta: **+5 tests, +1 test file**.

- The new four-case runner suite uses real `createFileIngestion`, image stores, analysis stores, and `createAnalysisRunner`; only native/IO dependencies and Svelte runes are mocked/shimmed.
- Ready A is stored and cached, then B is ingested at the same path, ID, and settings. The store-normalized revision advances and invalidates A. Ingestion's explicit schedule plus a clearly labeled direct equivalent of Home's selected-file reactive schedule produces no native call at 399 ms and exactly one at 400 ms.
- Deferred A success and deferred A rejection are separate cases. In each, B is ingested and completes first; late A cannot replace B's result or claim the analysis error/state.
- A new runner seeded from the actual selected stored A deduplicates the same revision/settings and preserves the cache. A subsequent real `setFile` admission at the same ID/path advances the revision and invokes exactly once.
- The profiling contract uses the real trace collector/harness. Observed A/B opaque keys differ only by content revision, repeated B has the same key, the production dedup booleans are `[false, false, true]`, and one B action reaches one native call and one accepted-store callback. The exact native request remains `{...PARAMS, tol: 1e-3, maxIter: 40, seed: 1, maxSamples: 300_000}` with no revision field.
- No test is skipped or marked expected-failure.

Initial pre-production run over the new runner suite plus profiling contract: **5 failed, 7 passed across 12 tests**. The two ready/remount cases made zero B calls, both deferred-race cases had no B result, and profiling observed no content revision in its key. The profiling negative path also logged a caught test-mock `TypeError`: pre-fix B was deduplicated and the still-running unprofiled A had no observer. Observer calls in that mock were made optional before final validation, matching the optional production observer contract; no production behavior was changed for that fixture correction.

## Final validation receipts

All commands used installed dependencies. The final candidate tip produced:

1. Required eight-file focused Vitest command:
   - `Test Files  8 passed (8)`
   - `Tests  65 passed (65)`
2. `npm run test -- --run`:
   - `Test Files  31 passed (31)`
   - `Tests  356 passed (356)`
3. `npm run check`:
   - `svelte-check found 0 errors and 2 warnings in 2 files`
   - The warnings are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
4. `npm run lint`: exit 0; no diagnostics.
5. `npm run format:check`: `All matched files use Prettier code style!`
6. `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**. The production Rust emitter interoperability test ran in this suite.
7. Root `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
8. `git diff --check`: exit 0; no diagnostics.
9. Native `cargo fmt --all -- --check`: exit 0; no diagnostics.
10. Native `cargo clippy --workspace -- -D warnings`: exit 0; no diagnostics.
11. Native `cargo test --workspace`: **72 passed, 0 failed, 1 intentionally ignored** across library, binary, integration, and doc-test targets. The ignored `profiling_tests::emit_native_interop_fixture` is invoked with test-owned output by the passing profiling Node suite.
12. Root `cargo test -p color-core --no-default-features --test kmeans_snapshots`: **1 passed, 0 failed, 0 ignored**.
13. Root `cargo tree -p color-core --edges normal`: exit 0; the normal dependency tree contains image/rand/rayon/serde/thiserror/wide and transitive dependencies, with **no Tauri dependency**.

Expected console output: profiling-contract's invalid-response and invoke-failed cases emit their deliberate `[home] analysis failed TauriComputeError` stacks. Both tests pass. The concurrently started final scalar/tree commands briefly reported waiting for Cargo's package-cache lock, then both passed. No unexpected final-run error output occurred.

## Deviations, friction, and remaining boundary

- Behavioral and file-fence deviations: none. Live source inspection confirmed that no outside-fence adapter is required: ingestion cancels first, `setFile` normalizes retained ID/revision onto the supplied entry before scheduling, and Home remount seeds the actual selected stored entry.
- The negative-only observer fixture adjustment described above was the sole test friction. It stayed inside the authorized profiling test and reflects the optional observer interface.
- The suite proves the renderer replacement path through real ingestion/store/runner composition. Its second schedule is explicitly a test-local equivalent of Home's reactive selected-file effect; it does **not** claim a mounted browser/Svelte effect run.
- The profiling case proves real collector binding, production dedup parity, native request identity, and store acceptance. It does not add revision to profiling wire/schema or historical traces.
- Cancellation remains renderer/store token revocation, not native preemption or immutable source ownership.
- No live app, mounted UI, app/native build, Windows/Linux CI, owner interaction, or broader final-wave acceptance is performed or implied. Those remain Review Lead/CI/owner gates as applicable.

Stop point: phase181 review gate. Candidate changes remain uncommitted. Review Lead owns review, final-wave verdict, the atomic AI-IMP-181 commit, and any later integration or acceptance action.
