# Correctness wave 04 phase010 — replacement invalidation submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.53 §11 and `correctness-wave-04-implementation-verdict.md`. Review state: **SUBMITTED; uncommitted; not accepted; phase017 not started.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains the assigned clean base `921571131939fbb7a9771e558bfbd4f54ab9f789`.
- Candidate status is exactly the six permitted phase010 paths: five tracked modifications and one new test. Status-list SHA-256 is `424e8dccb77832f715203268bfc4cc6584af3ec9af8b7fdec584e47c789f3679`.
- The combined binary diff stream (`git diff --binary`, then the new file as a `/dev/null` no-index diff) has SHA-256 `58d7aa18ddda5977a3b47572309a7a05e00023ddf83841345f681c911bbad2ea`.
- No Git mutation, commit, staging, rebase, merge, branch/config/hook change, install, native edit/gate, app/browser control, launch, capture, benchmark, ticket/INDEX edit, owner notification, or phase017/181 edit was performed.

## Exact files and hashes

| File | Before SHA-256 | Prepared SHA-256 | LOC |
|---|---|---|---:|
| `tauri-app/src/lib/stores/image.ts` | `296c21b09bd9c9dc93b2c9dc6f2198984ad92ad78adfc9cf719311554c1beb6b` | `a4b6c69ef41312c37b2347a9740ac9a887cbf8f9dbe4448202296224c31de658` | 388 |
| `tauri-app/src/lib/views/home/video-controller.svelte.ts` | `956472180e58feb327bedb222de20e98f6ea8651bcd0dab2fd79756cd7a27a5c` | `4942f9192dff4c76b4b6f17fa53eaee13140bbad74aacc8abf01e57c42591445` | 835 |
| `tauri-app/src/lib/views/HomeView.svelte` | `c08fa3661a73e3a806b4399e28271c621908f6fcdd2d151bdd855dae900afc7a` | `3578674e0a3dc4b63d154ecf53add0acb824c9804204f0e873c31b71c355a5f2` | 868 |
| `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts` | absent | `3f123b2be9bc8bcc2d4b8ebc5142e82130e6f49fa953754bbaa2fe53967ef3bd` | 218 |
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | `ff6e62ff997c9ee38bbfe7321737d92b432c613fe7a6944cddc65eb25094ce6f` | `f860e26ef1eb402361b2de13b331655f48252c829359b98bef4cab5d1cc3bb4d` | 244 |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | `26b56fe577b0c069f2b488a6caa47be6c13983d70413eaaa0569948fcb2e3758` | `bef0dc50964c98e354ca8cb4bf86aaf471ef8485fa7a793835f74b4267ae7b4d` | 685 |

Tracked numstat is 97 additions and 56 deletions; the new test is 218 lines. Total prepared source/test payload is 315 additions and 56 deletions. The pre-existing large controller, Home view, and audit suite remain cohesive; phase010 adds no new file over 400 lines and applies no LOC bypass.

## Implementation summary

- `image.ts` now resolves path/ID matches before mutation and invalidates the matched logical entry before dataset, preview, image-list, or active-selection publication. Colors cache is removed, active readiness is reset, and Values invalidation goes through `invalidateValueAnalysisForImage`, preserving pending-token revocation as well as result/state/error deletion.
- Same-ID `appendFile` replacements use the same Colors/Values invalidation before list publication. A distinct-ID duplicate path still exits before dataset/object-URL registration or cache invalidation; its rejected blob URL is released without disturbing the accepted entry.
- Accepted video-frame decode now cancels current Home runner work and clears the old request key before active-path/store publication, then always schedules the freshly extracted frame. Cached duration, strip, poster, frame ID, and exact seek restoration remain; the unproven cached-result/ID-only seed branch and its dependencies are removed.
- `HomeView.svelte` wires the existing runner cancellation authority into the controller. Its separate actual stored-entry remount seed remains unchanged, as does all profiling observation.
- No debounce, numeric analysis parameter, wire schema, profiling coordinator/schema, content revision, selection epoch, multi-analysis, Batch, Values production, export, or native behavior changed.

## Regression proof and test delta

The new lifecycle file adds four real-store regressions:

1. Path-matched `setFile` removes Colors/Values and resets readiness synchronously before replacement publication, including when another image had been active.
2. Same-ID `appendFile` removes Colors/Values and resets the active replacement.
3. Distinct-ID duplicate-path rejection preserves accepted datasets/object URLs and releases only the rejected blob URL.
4. Replacement revokes two real pending Values tokens, so late success and late error cannot land.

The cache-reset suite converts one old cached-analysis-reuse expectation to the rev0.53 ruling: exact seek is retained, but mutable-path re-extraction cancels, clears, publishes, and recomputes in that order. The audit suite strengthens its serialized-decode test with cancel-before-publication ordering and adds one real runner/controller/store integration regression proving a pre-replacement Colors completion is rejected while the replacement request succeeds.

Test delta: **+5 tests, +1 test file**. One existing expectation was converted and one existing audit was strengthened; no test was skipped or marked expected-failure.

Before the production fix, the new lifecycle suite reproduced **2 failures / 2 passes**:

- matched `setFile` still exposed the old Colors result during synchronous replacement publication;
- same-ID `appendFile` retained the old Colors result;
- duplicate-path resource preservation and the already-canonical `setFile` Values-token case passed, bounding the defect.

## Final validation receipts

All commands used installed dependencies.

1. Focused Vitest command over image lifecycle, video cache reset, audit races, profiling contract, and profiling-Svelte suites:
   - `Test Files  5 passed (5)`
   - `Tests  49 passed (49)`
2. `npm run test -- --run`
   - `Test Files  28 passed (28)`
   - `Tests  340 passed (340)`
3. `npm run check`
   - `svelte-check found 0 errors and 2 warnings in 2 files`
   - The warnings are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
4. `npm run lint`
   - exit 0; no diagnostics.
5. `npm run format:check`
   - `All matched files use Prettier code style!`
6. `node --test scripts/profiling/*.test.mjs`
   - `tests 88`, `pass 88`, `fail 0`, `skipped 0`
7. From repository root, `node --test scripts/svelte-event-guard.test.mjs`
   - `tests 10`, `pass 10`, `fail 0`, `skipped 0`
8. `git diff --check`
   - exit 0; no diagnostics.

Expected console output: the profiling-contract invalid-response and invoke-failed tests emit their deliberate `[home] analysis failed TauriComputeError` stacks. Both tests pass; no unexpected error output occurred.

## Deviations, friction, and remaining boundary

- Behavioral and file-fence deviations: none. The added runner/controller/store regression is within the explicitly allowed audit fixture/token-race surface.
- The new negative test run intentionally failed before the production edit and is reported above; every final validation run passed.
- No fixture outside the six-file fence was required. No generated planning file was touched in the candidate.
- Native/scalar gates were not rerun because native source is unchanged and the verdict explicitly retains them for final-wave validation; their prerequisite baseline result is not claimed as a phase010 run.
- Cached video restoration now recomputes extracted mutable-path content by design. Exact already-stored-entry remount reuse remains, but content revision and revision-aware runner keys are phase017 and phase181 work respectively.
- Ready-pin invalidation, explicit Batch recomposition, independent in-flight Batch/export source ownership, and closure of the full replacement-dispatch defect remain unimplemented. This submission makes no claim beyond phase010.
- No live app or owner-interaction acceptance was performed or implied.

Stop point: phase010 review gate. Candidate changes remain uncommitted. Review Lead owns review/commit and the exact-base dispatch for phase017.
