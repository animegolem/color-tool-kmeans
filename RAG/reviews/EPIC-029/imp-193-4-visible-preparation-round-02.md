# IMP-193-4 visible replacement preparation — round 02

Code Lead -> Review Lead, 2026-09-08. PROJECT-RECORD rev0.94. Corrected under round01 AMEND verdict SHA256 `faf2cad22db16721d5557251e18ed9be5b78a347b405db3aed2679756f03c786`; original round01 report SHA256 `47aba2e3223f64f6336563e3d5a7dbfefeb41ed338745c862044eefd3c21b411` remains immutable.

## Result and fence

**ROUND02 PREPARATION CORRECTIONS MET FOR 193-4-P7..P12.** The exact eight authorized existing files changed, the other seven authored artifact files remain byte-identical to the lead-frozen round01 source, the actual validator/renderer VM self-test passed, 55 Rust tests passed, and every required locked/offline preparation gate passed. This is corrected source/build/pure-test evidence only. No App, Window or WebView was launched; `--run` was not invoked; the reserved owner run path remains absent. Review, source freeze, launch permission, visible behavior, actual process-loss coverage, owner feel, production adoption and IMP-193-5 remain outside this submission.

- Source root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N`.
- Lead-frozen round01 root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-review-r1.pjWpcM`; read only throughout this amendment.
- Exactly eight changed files: `README.md`, `audit-visible-run.cjs`, `assets/harness.js`, `assets/interface.html`, `src/main.rs`, `src/driver.rs`, `src/session.rs`, `src/trace.rs`.
- Exactly seven byte-identical files: `Cargo.toml`, `Cargo.lock`, `build.rs`, `tauri.conf.json`, `assets/icon.png`, `src/lib.rs`, `src/protocol.rs`.
- No sixteenth authored file, dependency/feature/resolution change, install, task/subagent, commit/ref operation or cleanup.
- Generated output remains confined to pre-existing allowed `target-visible/` and `gen/schemas/`.

## P7 — watchdog failure and shell outcome: met in preparation

- `src/session.rs:93-99` provides the one shared `exit_code_for_process_outcome`: Complete/Incomplete -> 0, Failed -> 1.
- `src/session.rs:341-345,373-378` gives `OwnerSessionTimeout` an explicit infrastructure failure and Failed outcome regardless of disposition count. Ordinary early close/quit retains Incomplete without an infrastructure failure.
- `src/driver.rs:890-1151,2172-2186` returns the reconciled terminal `ProcessOutcome`; `src/main.rs:76-84,89-96` maps that returned outcome to the real shell code. A structurally coherent Failed event loop remains valid evidence but now yields shell exit1 rather than main returning success.
- Permanent actual-library tests: `owner_watchdog_expiry_is_failed_before_and_after_all_dispositions`, `actual_outcome_mapping_keeps_ordinary_complete_and_incomplete_at_zero`, existing early/ordinary incomplete and complete disposition tests, `coherent_failed_process_is_structurally_reconciled_at_exit_one`, and binary `coherent_failed_runtime_outcome_maps_to_shell_exit_one`.

No 30-minute wait or runtime process was executed. The result is shared state/entry-path source plus pure regression evidence.

## P8 — failure-safe finalization and independent supervision: met in preparation

- `src/trace.rs:13-137` defines the runtime-used `MachineSupervisor`, injected-clock state transition, self-process-only exit directive and finalization-ACK classifier. Its failure wording explicitly identifies partial/unsealed evidence.
- `src/driver.rs:858-888` is the independent thread. Its last resort calls `std::process::exit(1)` on this test process only; it does not use the ledger, child close, Tauri event loop or terminal ACK.
- Supervision begins before Builder construction at `src/driver.rs:890-918`. Setup completes the initial-construction phase only after the parent/first-child dispatch returns; coordinator phases bound initial admission/show, recovery, geometry, queued snapshot and finalization at `src/driver.rs:1532-1650,2087-2186`.
- The coordinator is wrapped in `catch_unwind` at `src/driver.rs:1009-1029`; Err/panic sends `WorkerFailed`. The 30-minute owner watchdog receives only the coherent coordinator completion, not an unconditional worker-return signal. Final supervision receives `CoherentExit` only after a successful finalizer ACK and watchdog-gate acknowledgement/release.
- `prepare_exit` records/attempts child close without short-circuiting, converts close/dispatch failure into an infrastructure-failed terminal when the ledger is usable, sets terminal/exit intent, dispatches exit, and requires the bounded ACK. A writer/seal/ACK failure leaves the existing partial JSONL unsealed and reaches the independent nonzero fallback.
- Runtime-used pure regressions: injected terminal writer failure stays unsealed; missing/failed ACK rejects coherence; injected clock expires the actual supervisor state; injected exit closure receives code1; worker failure selects code1; close and dispatch failures accumulate without short-circuiting. No App is constructed by tests and no runtime fault-injection surface was added.

The emergency `std::process::exit(1)` path was not executed; only its runtime-used decision/dispatch helper was exercised with an injected exit closure. This is deliberate preparation evidence, not a claim that macOS process termination was observed.

## P9 — callback disposition and current contradiction routing: met in preparation

- `src/session.rs:101-124` provides one shared callback-boundary classification: stale child, conflict with the exact owned attempt, or genuine current failure.
- `src/driver.rs:426-464` is the actual shared disposition handler used by termination and navigation callbacks at `src/driver.rs:924-949,1282-1327`. A delayed reload denial during an already-owned explicit transition records a rejected conflict without cancelling or poisoning that attempt; a late retired child remains isolated from its successor; only a genuine current callback failure records infrastructure failure.
- `renderer_receipt` now checks session-current identity before mutating protocol. At `src/driver.rs:521-594`, a current `observe_context` contradiction is recorded and routed to the same one-attempt state using `DetectedContradiction`; failure to admit that recovery reaches the genuine-current failure path. A stale-A receipt is rejected before protocol observation and cannot affect B.
- Regressions: `callback_failure_classification_preserves_owned_and_stale_transitions` covers all three classifications; `actual_callback_boundary_preserves_owned_attempt_and_isolates_stale_child` exercises the runtime handler with owned, stale and genuine-current inputs. Existing protocol poison/exact-original tests remain unchanged and green.

These are source/pure integration findings. No platform callback schedule was induced or observed.

## P10 — main-thread snapshots and live preservation comparison: met in preparation

- Setup records the actual Tauri setup thread identity. `src/driver.rs:1956-1984` refuses main-thread self-wait, drops the identity lock before dispatch, uses `Window::run_on_main_thread`, and bounds the response to 20 seconds. The raw `ns_window`/NSView-to-NSWindow call exists only in `sample_window_on_main_thread` at `src/driver.rs:1986-2039`. Setup's initial pointer call remains directly on the setup/main thread.
- All later sampling callers are coordinator paths. Renderer capture is now an async command that queues `CaptureSnapshot`; the coordinator samples on the main thread and answers through a bounded response channel. No protocol/session/trace lock is held across main-thread dispatch or wait.
- `recovery_geometry_preserved` and `child_covers_parent` at `src/driver.rs:1919-1941` compare the immediately sampled current inner/outer geometry, position, scale and successor coverage. Recovery emits `recovery-live-parent-preserved` only when both checks pass; otherwise it emits `recovery-parent-geometry-changed` with both snapshots and `nativeBehaviorInvariantMet:false`.
- Manual owner movement/scale during replacement is evidence mismatch, not protocol corruption and not a request to restore the old initial geometry.
- Regressions: `recovery_preservation_compares_live_geometry_and_successor_coverage` and existing exact-target/full-coverage test.

No native pointer/getter call was executed in preparation; main-thread compliance and comparison behavior are source/pure-test evidence pending the separate launch gate.

## P11 — authoritative case progress and focus labeling: met in preparation

- `assets/harness.js:53-83` implements the actual exported `projectCaseProgress`. It rehydrates each recorded value/note from `session.dispositions`, permanently disables completed rows, enables only the next ordered row while controls are open, disables future rows, and disables all controls after admission closes.
- Every generated case control has explicit case index/field metadata. A successful disposition requests a fresh authoritative snapshot before enabling the next row. A successor document begins with disabled blank rows and rehydrates from native status; scratch text, selection, element focus and A/B view still deliberately reset.
- `updateDomFocusSample` refreshes `documentHasFocus / activeRole` whenever focus/input/selection/visibility receipts are collected. `assets/interface.html:82-85` labels native window focus separately and states that frontmost application and owner feel remain owner observations.
- `audit-visible-run.cjs:239-295` executes the actual bundled harness in a DOM-free VM and verifies completed-row values/notes/disable, exactly-next enable and future-row disable on a fresh in-memory document. `caseProjection:passed` was observed in the final self-test.

No browser, screenshot, App or WebView was used.

## P12 — validator contradictions and claim boundary: met in preparation

- `audit-visible-run.cjs:48-55,67-101` accepts only nonnegative integer monotonic values and requires nondecreasing order.
- `audit-visible-run.cjs:119-161` requires recovery completion labels to have an actual preceding unique admission, exact terminal-to-owner-row count/order/value/note reconciliation, an admitted terminal child when non-null, and consistent Complete/Incomplete/Failed exit code and infrastructure fields.
- The terminal and validator no longer expose a computed `behaviorAccepted`. Terminal source records `independentlyVerifiedBehavior:false` and `ownerAdoption:not-evaluated`; validator returns separate `ownerReportedAllMet`, `nativeEvidenceCoherent`, `independentlyVerifiedBehavior:false`, and `ownerAdoption:not-evaluated` fields.
- Native geometry failures remain independent of owner all-met reports. Validator tracks both `exact-geometry-target-not-reached` and `recovery-parent-geometry-changed`.
- Final actual-validator self-test positives: coherent Complete, Incomplete with background-pending recovery settled for quit, Failed, Complete with admitted fresh-child recovery, and Complete/all-owner-met with contradictory native geometry. The projection VM is a sixth positive check.
- Sixteen permanent negative fixtures reject missing/duplicate sequence, missing/duplicate terminal, fabricated provenance, simulated loss labelled actual, same-child renewal, malformed disposition, inconsistent Complete, Complete/exit7, negative timestamp, backwards timestamp, missing owner row, contradictory owner row, Failed without infrastructure failure, and recovery completion without admitted successor.

Validator success establishes structural/native evidence coherence only. It does not independently verify visible composition, focus feel, Spaces/fullscreen behavior or adoption.

## Authored file manifest

| Authorized file | SHA256 | Lines | Round01 relation |
| --- | --- | ---: | --- |
| `README.md` | `f9d3b4f9dd72b3cc82337fa0fcd64191d9b3c33eb988bd07e840c796ff12640f` | 53 | Changed, P8/P10/P11/P12 contract. |
| `Cargo.toml` | `052a41135693e206ddb00a59e53d89f96870885bd02fbbfc143bf8115381edd3` | 16 | Byte-identical. |
| `Cargo.lock` | `92fccac801e029997d7330bb23e2b6b84e2fa40f55772004b7cc08621e235033` | 5,139 | Byte-identical. |
| `build.rs` | `487059eaf8a947b80f20a9aacac038a5047b2ad69d2401b827376c67d6fe847f` | 3 | Byte-identical. |
| `tauri.conf.json` | `f64eb71cc1cd93a3a11abb32232570e9ef69e703f74f9493bce3639481d181db` | 19 | Byte-identical. |
| `audit-visible-run.cjs` | `31320a14e6f79a7d8f7b39d0b8915020e46203a63b8497e1e7fe0d105169c212` | 383 | Changed, P11/P12. |
| `assets/interface.html` | `74834ebe3db20a8243bc2b65005b693be07efb2d0d60566fe3fb97bb5f6f7869` | 112 | Changed, P11 labels. |
| `assets/harness.js` | `ca588f4907d898e47231187fa39a38e86d4b2a4c6d4bac36d34c10afac8b6608` | 251 | Changed, P11 projection/focus. |
| `assets/icon.png` | `2b8403d093bef802bb809e5d4ea5fc9364fac777a124dab01320ca3ea4b80156` | binary | Byte-identical. |
| `src/main.rs` | `a482cdc0c98ccb7bf53a3cb358cfe9760731de31e251ed9812268412a823866e` | 133 | Changed, P7 shell result. |
| `src/lib.rs` | `14e0735ca62ea86bef3955a54208c0a21cb261c3c72c26b44cc8158e529f1586` | 4 | Byte-identical. |
| `src/driver.rs` | `75492998a8ffc7f48ffab8dffde536b396bb38f073fc2350ffd74732637a7df3` | 2,405 | Changed, P7-P10 and tests. |
| `src/protocol.rs` | `f13eeac3707c8a73c5dcaf807fde70a13638ff1ce59f9621dbee60d58a8dc7bd` | 1,423 | Byte-identical. |
| `src/session.rs` | `0559304672715966e05de8c4268d8ecaf9475ba1f5cd2c8ce8a04f60b5328b76` | 654 | Changed, P7/P9. |
| `src/trace.rs` | `e8d4c6571f3d602a043fcddd5502b3704228167b19dd737a402764471e72545c` | 709 | Changed, P7/P8/P12. |

The manifest remains exactly fifteen authored files. Planning evidence and generated output are not artifact source.

## Round01 delta

Comparison against lead-frozen `pjWpcM/source` changes only the eight authorized files, total `+1,160/-204`:

| File | Added | Removed |
| --- | ---: | ---: |
| `README.md` | 6 | 2 |
| `assets/harness.js` | 50 | 5 |
| `assets/interface.html` | 3 | 2 |
| `audit-visible-run.cjs` | 186 | 36 |
| `src/driver.rs` | 580 | 141 |
| `src/main.rs` | 17 | 5 |
| `src/session.rs` | 96 | 1 |
| `src/trace.rs` | 222 | 12 |

The seven immutable file hashes exactly match round01. No generated file is included in this source delta.

## Current test inventory

`cargo test --offline --locked` ran **55 current tests: 52 library + 3 binary**, with 0 failed, ignored, measured or filtered and 0 doc tests.

- Protocol: 22 unchanged tests.
- Visible session: 12 tests; three added for watchdog/outcome mapping and callback-boundary classification.
- Driver: 7 tests; three added for recovery geometry/coverage, close/dispatch failure collection and actual callback handler integration.
- Trace: 11 tests; five added for coherent Failed reconciliation, terminal writer failure/unsealed state, clock/exit supervisor, worker fallback and missing/failed ACK.
- CLI: 3 tests; one added for Failed/Incomplete/Complete shell mapping.

No test uses `it.fails`, weakens an expected assertion, creates an App, or claims a native result.

## Final gate outcomes

Host toolchain: Darwin `25.6.0` arm64; Node `v26.8.1`; Cargo `1.90.0`; rustc `1.90.0`. Node20 remains uninstalled/unrun; no installation was authorized.

All commands ran from the source root. Rust commands used exact `env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible"` with locked/offline resolution where specified.

| Command | Exit | Actual outcome |
| --- | ---: | --- |
| `node --check assets/harness.js` | 0 | No stdout/stderr. |
| `node --check audit-visible-run.cjs` | 0 | No stdout/stderr. |
| `node audit-visible-run.cjs --self-test` | 0 | `selfTest:passed`, `caseProjection:passed`; five ledger positives plus sixteen rejected contradictions. |
| `cargo fmt --all -- --check` | 0 | No stdout/stderr. |
| `cargo check --offline --locked` | 0 | Finished dev profile. |
| `cargo test --offline --locked` | 0 | 52 library + 3 binary = 55 passed; 0 failed/ignored; 0 doc tests. |
| `cargo clippy --offline --locked --all-targets -- -D warnings` | 0 | Finished dev profile, no warnings. |
| `cargo build --offline --locked` | 0 | Finished dev profile. |

Source inspection confirmed argument parsing and static validation complete before the sole call to `driver::run`; default/help/config paths contain no Builder call. The following allowed non-runtime executions followed that inspection:

| Binary invocation | Exit | Actual stdout |
| --- | ---: | --- |
| default | 0 | p8xk8n title/usage and explicit statement that runtime requires `--run` plus a separate verdict. |
| `--help` | 0 | Same title/usage. |
| `--validate-config` | 0 | `configuration valid; Tauri runtime not initialized`. |

Binary: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N/target-visible/debug/color-tool-c1-visible-replacement`

- `file`: `Mach-O 64-bit executable arm64`.
- SHA256: `bc4c0aee09987184fff1b7f80c2c22b5ac3a303cfc564e531b9c23c3822a42f0`.
- Size: `26,420,016` bytes.
- Executed only on default/help/config paths. Never executed with `--run`.

## Generated inventory and preservation

- `gen/schemas/`: 4 regular files, 0 symlinks. Hashes remain `acl-manifests.json b8665c2471bd4c59d570c77e226f37410ce396da52525383a15b5cbbff9d786e`, `capabilities.json 44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`, `desktop-schema.json f68a9c570ecff07ac6826145d33b966d6fc02f7d680967f44437268b08a6ba78`, `macOS-schema.json f68a9c570ecff07ac6826145d33b966d6fc02f7d680967f44437268b08a6ba78`.
- `target-visible/`: 10,571 regular files, 1,070 directories, 0 symlinks, approximately 2.6 GiB. Top-level debug artifacts remain binary/`.d`, library/`.d`, Cargo marker and generated `ffmpeg`/`ffprobe` sidecars.
- Candidate: HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`, empty porcelain status, root lock `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- Main: HEAD `5baa20e021855fbc57aebf48fa0f9b3374ded281`, empty porcelain status, root lock `fc69255a02bb05664a4cd1e7fe9e69115034445584a3526e04dcdda76065b82e`.
- Lead freeze: `source/` still contains exactly 15 regular files and no symlinks; submitted binary remains `eb9515c35a310d22c97261ecc2878a3aa0b46b187e2fee446cbad5c627d95841`; lead-built binary remains `bccae9dd414bcf39b69a94d0ca79da05a41d408574caa3b7b4a6d575833ecd6a`; lead gate transcript/probes remain hash-stable (`0fb43050`, `bddff9fa`, `1d03d4d8` prefixes respectively).
- Original report/verdict/plan hashes remain `47aba2e3`, `faf2cad2`, `bf55d439`, `d9c01600` as listed above. No earlier report or verdict changed.
- `run-20260908-visible-owner-01` remains absent. No run output exists.
- Cargo manifest/lock/features/path dependency, build entry, config, icon, library exports and protocol are byte-identical to round01; dependency resolution remains frozen.

## Candid friction and residuals

- `src/driver.rs` grew from 1,966 to 2,405 lines and remains far above the repository's 400-line advisory. `src/session.rs` is 654 lines and `src/trace.rs` 709. The exact eight-existing-file fence prohibited extraction; this is material review/LOC friction and will require the lead's commit-time `[loc-bypass]` if ever committed.
- The independent fallback deliberately uses `std::process::exit(1)`, so it cannot emit a valid terminal or run in destructors when the coherent path is broken. That is the point of the last resort: preserve already-flushed partial bytes, identify them as unsealed on stderr/helper errors, and guarantee that only this process terminates. Preparation tests inject the exit callback; they do not kill a process.
- The supervisor bounds operations that the runtime explicitly starts. It cannot make an underlying main-thread/OS call cancellable; at expiry it terminates the test process. There is no platform-run evidence yet that all Tauri callbacks arrive, that native close returns, or that a blocked native call reaches the fallback on this host.
- Rust/VM tests establish state transitions and projection/validator behavior, not visible UI composition, first responder, text/shortcut feel, blanking/z-order, fullscreen/Spaces/minimize, owner-frontmost state or owner acceptance. All six owner cases remain unrun.
- Main-thread snapshot compliance is established from call graph/API use and a self-wait guard, not an instrumented native runtime observation. Manual motion/scale during the short before/after interval will be reported as an honest preservation mismatch.
- A WebContent termination callback still establishes only that the callback was delivered; it does not prove complete process-loss detection coverage. No real or induced process loss occurred. Simulated loss remains explicitly forced.
- Local Node was v26.8.1 rather than Node20. The script uses Node20-supported APIs, but no actual Node20 reproduction is claimed.
- Generated target growth from 9,111 round01 files to 10,571 files reflects added test/build artifacts in the same allowed target; it was not cleaned.
- Ledger flush remains process-visible buffer flush rather than `fsync`. Parent identity remains process-local. Manager absence/close return remain non-destruction claims. Renderer paint receipts remain non-composition evidence.

## Handoff

Review Lead should independently review and reproduce this exact round02 manifest, preserve a fresh reviewed source/binary identity, and decide the separate launch gate. This report does not check any remaining 193-4 acceptance box. Do not infer runtime success or owner adoption from the green preparation gates.
