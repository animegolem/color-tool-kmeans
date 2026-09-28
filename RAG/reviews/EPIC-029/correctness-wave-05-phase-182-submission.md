# Correctness wave 05 phase182 — cached-frame race reconciliation submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.59 §§3–8,11 and `correctness-wave-05-phase-192-verdict-and-182-brief.md`. Review state: **SUBMITTED; tests only; uncommitted; not accepted; phase183 not started.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base and HEAD remain the exact accepted phase192 commit `2853040d6e7847eaa9aeab0d665179bb35a9dc2f`.
- Candidate status is exactly the two authorized tracked test modifications and no new file. Status-list SHA-256 is `13cf44a7b9887fa7f055f23282e040a40d5575fbcfad33a5de4255532976169c`.
- `git diff --binary` SHA-256 is `d6938109bd35ebca4eb869a046cdd1b52f06a6761e1a0327ac9d9be55d7f22f8`.
- Payload is **391 additions, 0 deletions**. No production source, other test, fixture, dependency, hook, profiling artifact/schema, native/core source, generated INDEX, ticket, app, build, Git state, cleanup target, or phase183 path changed.

## Exact files and hashes

| File | Before SHA-256 | Prepared SHA-256 | Before -> prepared LOC |
|---|---|---|---:|
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | `0bf6913198baadbddcbc9569914457b0757f22b8ef475c8209650ae772d123bd` | `c68ab09cd03d1350b4413034a04c00976d3df16c321bcbdc8474fa37334a6047` | 269 -> 480 |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | `75e4ae8f1dd86de4b66d96b13d19431df8e635c1c5228ed4d5424c65c7262013` | `913f18f76fc121a7914884ce79b1208b026ef24752cc87f07226709bbdf9c713` | 1,040 -> 1,220 |

## Test implementation and evidence level

Permanent delta is **+9 logical tests**, with all 27 pre-existing tests in the two suites retained: `video-controller-cache-reset.spec.ts` grows from 3 to 7 tests and `audit-control-flow-races.spec.ts` from 24 to 29.

### Controller-only timing and ownership proofs

`video-controller-cache-reset.spec.ts` uses the production `createVideoController` with mocked native frame extraction and spy dependencies:

- A seek and a one-frame step during the 250 ms cached-restore debounce each replace the t=7 timer. Exactly one native extraction is issued, at the final requested timestamp; it admits one frame and schedules one analysis.
- A seek and step after the t=7 native IPC starts preserve the production same-frame-ID queue. The new extraction is not issued until the old native promise finishes. The old completion cannot call `setFile`, cancel/clear analysis ownership, schedule analysis, publish video state, or write cache; `frameDecoding` remains true for the current request. The serialized final extraction then admits and schedules exactly once at the requested timestamp.
- The existing no-step SWEEP-010 positive is strengthened to assert one extraction of t=7, one admission of the returned fresh frame, and the existing cancel -> clear key -> admit -> schedule ordering.
- The existing cached-A -> fresh-video-B seek/poster reset test and repeated-reset test are unchanged and pass.

These controller cases prove timing, queueing, and side-effect calls. Their schedule spy is not presented as proof that an analysis result reached the real store.

### Actual image-store and analysis-runner proofs

`audit-control-flow-races.spec.ts` adds a five-case production-boundary matrix: no step, seek during debounce, step during debounce, seek during active IPC, and step during active IPC. Native extraction and analysis IO are mocked, but the controller, `setFile`, content-revision allocator, analysis store, pending-token handling, and `createAnalysisRunner` are real.

Each case starts with admitted frame A at t=7 and an actual cached A result. It proves:

- debounce races dispatch only final B; active-IPC races keep B queued until A's native completion;
- an old active-IPC A completion leaves the stored A path, revision, result, ready state, and runner ownership unchanged;
- accepted B has the exact final requested timestamp/path and receives `cachedRevision + 1`, demonstrating that stale A did not consume an admission revision;
- B admission removes A's cached result and returns analysis to idle before analysis dispatch;
- exactly one real runner dispatch reaches ready with a distinct B result stored under the logical frame ID.

The no-step row proves conservative cached t=7 behavior: even with cached poster/result metadata, the controller freshly extracts, admits a new revision, invalidates A, and analyzes exactly once. This does not restore or emulate the historical unsafe preservation branch.

The unchanged `analysis-runner-revision.spec.ts` runs in the expanded gate. Its `SWEEP-181: remount seed deduplicates its stored revision but not a new admission` positive remains separate: the same actual admitted revision/settings can avoid dispatch on remount, while every newly extracted frame in the phase182 matrix receives a new revision and cannot inherit that claim.

## Validation receipts

All commands used installed dependencies. Host evidence: macOS 26.6.2, Node v26.8.1, npm 11.19.0; Node 20 and other platforms were not run.

1. First focused run after formatting, both modified suites: **2 files passed, 36 tests passed**.
2. Original phase192 expanded set, including both modified suites and unchanged Home remount positive: **12 files passed, 132 tests passed**.
3. `npm run test -- --run`: **34 files passed, 413 tests passed**.
4. `npm run check`: `svelte-check found 0 errors and 2 warnings in 2 files`. Both are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
5. `npm run lint`: exit 0; no diagnostics.
6. `npm run format:check`: `All matched files use Prettier code style!`
7. From `tauri-app/`, `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**; production Rust writer interoperability ran.
8. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
9. `git diff --check`: exit 0; no diagnostics.

No test is skipped, marked expected-failure, or backed by a fabricated pre-fix mutation. Phase182 is reconciliation against already-repaired production; the new tests passed on their first focused execution, so no production defect or amendment request emerged.

## Deviations, friction, and remaining boundary

- File-fence deviation: none. Only the two assigned existing tests changed. The planning worktree receives only this submission report.
- No failed implementation approach occurred. The main testing judgment was to duplicate the four timing races at two evidence levels: compact controller spies establish exact timer/IPC side effects, while the audit matrix independently establishes real store revision and analysis-result behavior. The report does not collapse those levels.
- The controller cache-reset suite newly crosses 400 LOC at 480; the already cohesive audit suite grows to 1,220 LOC. Both expansions are the exact assigned matrices rather than production refactoring or hidden helper files. Lead-owned commit handling will require deliberate LOC review and likely `[loc-bypass]`.
- `extractVideoFrame` finishing does not prove native cancellation or on-disk byte immutability. The tests prove renderer admission/publication ownership only.
- Disposal, requested-versus-settled frame handoff, successor reacquisition, exact stored-frame successor reuse, and mounted old-view behavior remain phase183. Native source/output ownership remains phase193.
- Native workspace/scalar gates remain reserved for the final phase183 tip as assigned. No app build/run, mounted Svelte/browser interaction, Windows/Linux/Node20 CI, owner interaction, merge, release, or final-wave acceptance was performed or implied.

Stop point: phase182 review gate. Tests remain uncommitted on `2853040`. Review Lead owns review, the phase182 commit, and any named phase183 assignment.
