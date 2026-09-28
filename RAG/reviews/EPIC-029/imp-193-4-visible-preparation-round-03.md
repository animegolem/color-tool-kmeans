# IMP-193-4 visible replacement preparation — round 03

Code Lead -> Review Lead, 2026-09-08. PROJECT-RECORD rev0.95. Corrected only 193-4-P13..P15 under round02 AMEND verdict SHA256 `10069d87b0b758be3eeb99aafde6ea4b5e63061183d849671a1a53d68809f828`; round02 report SHA256 `fc8e599603bbcde0c222e969f590254ca7f5ad9ecb121303bf5b6cf9ac6d0cb5` remains immutable.

## Result and fence

**ROUND03 PREPARATION CORRECTIONS MET FOR 193-4-P13..P15.** Three of the four writable existing files changed: `src/driver.rs`, `audit-visible-run.cjs` and wording-only `README.md`. `src/session.rs` was not needed and remains byte-identical to frozen R2. The other eleven authored files are also byte-identical to R2, leaving exactly twelve unchanged. The actual validator/projection self-test passed, 62 Rust tests passed, and every required locked/offline preparation gate passed.

This remains source/build/pure-test evidence only. No App, Window or WebView was constructed or launched; `--run` was not invoked; no browser/desktop manipulation or process loss occurred; the reserved owner run path remains absent. Independent review/freeze, launch permission, visible behavior, actual process-loss coverage, owner feel, production adoption and IMP-193-5 remain outside this submission.

- Source root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N`.
- Frozen R2 review root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-review-r2.Z5s0Og`; read only throughout this correction.
- Changed existing files: `README.md`, `audit-visible-run.cjs`, `src/driver.rs`.
- Byte-identical existing files: `Cargo.toml`, `Cargo.lock`, `build.rs`, `tauri.conf.json`, `assets/icon.png`, `assets/interface.html`, `assets/harness.js`, `src/main.rs`, `src/lib.rs`, `src/protocol.rs`, `src/session.rs`, `src/trace.rs`.
- No sixteenth authored file, dependency/feature/resolution change, install, task/subagent, commit/ref operation or cleanup.
- Generated output remains confined to pre-existing allowed `target-visible/` and `gen/schemas/`.

## P13 — protocol-current receipt admission separated from session-current controls

- `src/driver.rs:134-174` classifies a native-labelled renderer receipt against both frozen snapshots. Only the non-retired/non-poisoned protocol-current child can be an admitted current, initial construction candidate or owned-recovery candidate. A session-current owner already in recovery is not treated as a candidate; a protocol-retired or non-current child is rejected before observation.
- `renderer_receipt` now delegates to the pure/runtime-used `route_renderer_receipt` at `src/driver.rs:569-704`. The helper uses the actual captured native webview label, takes the protocol snapshot and observation under the same protocol guard, and observes the frozen protocol fields without installing session identity or minting authority.
- An authentic initial or recovery candidate may therefore submit document receipts before session admission. `authorize_control` is unchanged and still requires the session-current child with no owned recovery, so neither candidate gains owner controls early.
- A candidate contradiction is recorded, then sent as `CoordinatorAction::AdmissionFailed` to the exact admission waiter. `Coordinator::wait_for_admission` consumes a matching failure immediately at `src/driver.rs:1517-1523`: initial construction reaches its existing infrastructure-failed exit path, while a successor reaches `fail_recovery_and_request_exit` for the already-owned attempt. Neither path recursively requests another recovery.
- An admitted-current contradiction still uses `DetectedContradiction`, retires that current child and starts the approved single recovery. A second delayed receipt is stale and cannot create another attempt. A retired A receipt after B is protocol-current is rejected before observation; B's protocol/session snapshots remain unchanged.
- README contract wording now distinguishes receipt observation from admitted owner-control authority and states the bounded candidate-contradiction result.

Permanent runtime-helper regressions added in `src/driver.rs`:

1. `initial_protocol_candidate_receipt_precedes_bootstrap_and_session_admission`: real protocol premint/policy/observation -> page-started -> exact bootstrap Activated -> session install.
2. `recovery_protocol_candidate_receipt_precedes_owned_recovery_completion`: real A admission/retirement/owned recovery -> B receipt -> exact bootstrap Activated -> `finish_recovery`.
3. `retired_receipt_is_rejected_without_changing_current_recovery_candidate`: A is rejected before observation and B plus the owned session attempt remain exactly unchanged; B is then accepted.
4. `candidate_contradictions_are_returned_to_the_bounded_admission_owner`: both initial and replacement candidate contradictions emit the matching `AdmissionFailed`; the replacement keeps the exact owned attempt until its coordinator consumes the failure.
5. `owner_controls_remain_rejected_until_candidate_session_admission`: both an activated initial candidate and an activated replacement candidate fail the unchanged session-current control gate.
6. `admitted_current_contradiction_starts_only_the_approved_recovery_attempt`: the admitted current starts one `DetectedContradiction` attempt; the delayed second receipt is stale and emits no second recovery.

The existing callback-boundary and protocol poison/exact-original regressions remain green. No Tauri App is constructed by any test.

## P14 — snapshots owned before main-thread sampling

- Runtime `sample_status` now calls `sample_status_with` at `src/driver.rs:2015-2044`.
- The helper completes the protocol snapshot statement and session snapshot statement before invoking its sampler closure, so both temporary MutexGuards are dropped before `sample_window` dispatches to and waits for the main thread.
- `runtime_status_sampling_releases_protocol_and_session_guards_before_sampler` invokes this exact runtime-used helper with a pure injected sampler and successfully `try_lock`s both mutexes at the seam.
- The existing main-thread identity check, `run_on_main_thread`, `ns_window` sampling, 20-second response bound and current-geometry comparison are unchanged.
- An adjacent-call scan found no other snapshot expression feeding `sample_window` or `run_on_main_thread`; all direct `sample_window` callers enter without a protocol/session/trace guard.

No native pointer/getter or dispatch was executed. The result is source and pure injected-seam evidence pending the separate launch gate.

## P15 — duplicate-terminal fixture restored

- `audit-visible-run.cjs:337-347` now takes the actual final `terminal-session` record, asserts that source identity, clones it, resequences the complete fixture, and asserts exactly two terminal rows before calling the validator.
- The validator's original exactly-one-terminal check is unchanged. The negative now rejects for the advertised duplicate terminal rather than for a copied owner row or sequence gap.
- Actual `node audit-visible-run.cjs --self-test` passed with `selfTest:passed`, `caseProjection:passed`, five positive ledger cases and the full negative set.

## Authored file manifest

| Authorized file | SHA256 | Lines | Frozen R2 relation |
| --- | --- | ---: | --- |
| `README.md` | `b959a1576e465b7dd2aa57bc380f49db7f3ccd1fe9e3dc13ca64d000eb350a50` | 53 | Changed, P13 wording only. |
| `Cargo.toml` | `052a41135693e206ddb00a59e53d89f96870885bd02fbbfc143bf8115381edd3` | 16 | Byte-identical. |
| `Cargo.lock` | `92fccac801e029997d7330bb23e2b6b84e2fa40f55772004b7cc08621e235033` | 5,139 | Byte-identical. |
| `build.rs` | `487059eaf8a947b80f20a9aacac038a5047b2ad69d2401b827376c67d6fe847f` | 3 | Byte-identical. |
| `tauri.conf.json` | `f64eb71cc1cd93a3a11abb32232570e9ef69e703f74f9493bce3639481d181db` | 19 | Byte-identical. |
| `audit-visible-run.cjs` | `0df1145b9b9c5cb8a1aac1ab2006053f980c24402371f1c08f29096cbb4db0e6` | 392 | Changed, P15 only. |
| `assets/interface.html` | `74834ebe3db20a8243bc2b65005b693be07efb2d0d60566fe3fb97bb5f6f7869` | 112 | Byte-identical. |
| `assets/harness.js` | `ca588f4907d898e47231187fa39a38e86d4b2a4c6d4bac36d34c10afac8b6608` | 251 | Byte-identical. |
| `assets/icon.png` | `2b8403d093bef802bb809e5d4ea5fc9364fac777a124dab01320ca3ea4b80156` | binary | Byte-identical. |
| `src/main.rs` | `a482cdc0c98ccb7bf53a3cb358cfe9760731de31e251ed9812268412a823866e` | 133 | Byte-identical. |
| `src/lib.rs` | `14e0735ca62ea86bef3955a54208c0a21cb261c3c72c26b44cc8158e529f1586` | 4 | Byte-identical. |
| `src/driver.rs` | `fe1d9b7cef8c9db0cd093eea8e24649b80f57e23b9374721eb5ff854bc0758a0` | 2,885 | Changed, P13/P14 and pure integration tests. |
| `src/protocol.rs` | `f13eeac3707c8a73c5dcaf807fde70a13638ff1ce59f9621dbee60d58a8dc7bd` | 1,423 | Byte-identical. |
| `src/session.rs` | `0559304672715966e05de8c4268d8ecaf9475ba1f5cd2c8ce8a04f60b5328b76` | 654 | Byte-identical; optional P13 scope not needed. |
| `src/trace.rs` | `e8d4c6571f3d602a043fcddd5502b3704228167b19dd737a402764471e72545c` | 709 | Byte-identical. |

The manifest remains exactly fifteen authored files. Planning evidence and generated output are not artifact source.

## Frozen R2 delta

Comparison against `color-tool-c1-visible-review-r2.Z5s0Og/source` changes only the three files above, total `+535/-46`:

| File | Added | Removed |
| --- | ---: | ---: |
| `README.md` | 1 | 1 |
| `audit-visible-run.cjs` | 10 | 1 |
| `src/driver.rs` | 524 | 44 |

The twelve immutable authored file hashes exactly match R2. No generated file is included in this delta.

## Current test inventory

`cargo test --offline --locked` ran **62 current tests: 59 library + 3 binary**, with 0 failed, ignored, measured or filtered and 0 doc tests.

- Protocol: 22 unchanged tests.
- Visible session: 12 unchanged tests.
- Driver: 14 tests; seven added for P13/P14 and the seven prior tests remain green.
- Trace: 11 unchanged tests.
- CLI: 3 unchanged tests.

No test uses `it.fails`, weakens an expected assertion, constructs an App, or claims a native result.

## Final gate outcomes

Host toolchain: Darwin `25.6.0` arm64; Node `v26.8.1`; Cargo `1.90.0`; rustc `1.90.0`. Node20 remains uninstalled/unrun; no installation was authorized.

All commands ran from the source root. Rust commands used exact `env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible"` with locked/offline resolution where specified.

| Command | Exit | Actual outcome |
| --- | ---: | --- |
| `node --check assets/harness.js` | 0 | No stdout/stderr. |
| `node --check audit-visible-run.cjs` | 0 | No stdout/stderr. |
| `node audit-visible-run.cjs --self-test` | 0 | `selfTest:passed`, `caseProjection:passed`; five ledger positives and the full rejected-contradiction set, including a prevalidated two-terminal fixture. |
| `cargo fmt --all -- --check` | 0 | No stdout/stderr. |
| `cargo check --offline --locked` | 0 | Finished dev profile. |
| `cargo test --offline --locked` | 0 | 59 library + 3 binary = 62 passed; 0 failed/ignored; 0 doc tests. |
| `cargo clippy --offline --locked --all-targets -- -D warnings` | 0 | Finished dev profile, no warnings. |
| `cargo build --offline --locked` | 0 | Finished dev profile. |

Source inspection confirmed argument parsing and static validation complete before the sole call to `driver::run`. Default/help/config contain no Builder call. The following allowed non-runtime executions followed that inspection:

| Binary invocation | Exit | Actual stdout |
| --- | ---: | --- |
| default | 0 | p8xk8n title/usage and explicit statement that runtime requires `--run` plus a separate verdict. |
| `--help` | 0 | Same title/usage. |
| `--validate-config` | 0 | `configuration valid; Tauri runtime not initialized`. |

Binary: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N/target-visible/debug/color-tool-c1-visible-replacement`

- `file`: `Mach-O 64-bit executable arm64`.
- SHA256: `08e5a757ecfc229fde0a8db1d85aee516190db715c1fb11521173e8251898db8`.
- Size: `26,422,160` bytes.
- Executed only on default/help/config paths. Never executed with `--run`.

## Generated inventory and preservation

- `gen/schemas/`: 4 regular files, 0 symlinks. Hashes remain `acl-manifests.json b8665c2471bd4c59d570c77e226f37410ce396da52525383a15b5cbbff9d786e`, `capabilities.json 44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a`, `desktop-schema.json f68a9c570ecff07ac6826145d33b966d6fc02f7d680967f44437268b08a6ba78`, `macOS-schema.json f68a9c570ecff07ac6826145d33b966d6fc02f7d680967f44437268b08a6ba78`.
- `target-visible/`: 11,478 regular files, 1,070 directories, 0 symlinks, approximately 2.6 GiB. Top level remains Cargo marker, Rust metadata and `debug/`; debug contains the binary/library metadata and build-generated sidecars.
- Candidate `color-tool-kmeans-correctness-wave-01`: HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`, empty porcelain status, root lock `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- Main `/Users/golem/git/color-tool-kmeans`: HEAD `5baa20e021855fbc57aebf48fa0f9b3374ded281`, empty porcelain status, root lock `fc69255a02bb05664a4cd1e7fe9e69115034445584a3526e04dcdda76065b82e`.
- Frozen R2 `source/` still contains exactly 15 regular files and 0 symlinks. Submitted binary remains `bc4c0aee09987184fff1b7f80c2c22b5ac3a303cfc564e531b9c23c3822a42f0`; lead build `88f7ba26239521c05951dd7b01be39abfaa568ab4c3d414cc0fd23a92ea79bb0`; gate transcript `f0e449013ef6135058ed62874faab5ade3b934ecbcfe0378b019c3fe6c646d4b`; boundary source/transcript `d15963e2486461f230c1d8d93d4815c9981afd30a22b204c1a9e5d13c8f3354a` / `95096305a2108c0eecd821fe60965212ed71092c432b0da629be57afb391d0e8`; validator probe/transcript `2ffa5e645147dc2aabb4ae68479297f4095b6fe31416f6a68812aa33d861d5f6` / `818e1798b3e859c7b323e7eb30b185d837e78e309abfc0494b1eea745e9a4b7d`.
- Frozen R1 `source/` still contains exactly 15 regular files and 0 symlinks. Submitted/lead binaries remain `eb9515c35a310d22c97261ecc2878a3aa0b46b187e2fee446cbad5c627d95841` / `bccae9dd414bcf39b69a94d0ca79da05a41d408574caa3b7b4a6d575833ecd6a`; its gate and probe artifacts retain their reported hashes.
- Prior report/verdict hashes remain round01 report `47aba2e3223f64f6336563e3d5a7dbfefeb41ed338745c862044eefd3c21b411`, round01 AMEND `faf2cad22db16721d5557251e18ed9be5b78a347b405db3aed2679756f03c786`, round02 report `fc8e599603bbcde0c222e969f590254ca7f5ad9ecb121303bf5b6cf9ac6d0cb5`, and round02 AMEND `10069d87b0b758be3eeb99aafde6ea4b5e63061183d849671a1a53d68809f828`.
- `run-20260908-visible-owner-01` remains absent in both source and R2 review roots. No run output exists.

## Candid friction and residuals

- `src/driver.rs` is now 2,885 lines, with an R2 delta of `+524/-44`; most of that growth is seven explicit, real protocol/session integration regressions required by P13/P14. It remains far above the repository's 400-line advisory. The fixed existing-file fence prohibited extraction, so a future commit still requires lead-owned `[loc-bypass]` handling.
- Candidate receipt classification relies on the frozen public `ProtocolSnapshot` admission state and real `observe_context`; no new protocol mutation or credential exists. The pure regressions cover the exact state boundaries, but no native callback schedule has been observed.
- Candidate contradiction failure is immediate at the coordinator admission-action boundary, but native process exit/finalization behavior remains only the already-green bounded source/pure evidence from R2. No native deadlock was attempted; P14 proves the two guards are absent at the injected sampling seam.
- The independent fallback, OS callback arrival, native close, WebKit lifecycle, actual process termination, focus/selection feel, visual flash, Spaces/fullscreen behavior and recovery geometry still require separately authorized runtime/owner evidence.
- Local Node is v26.8.1 rather than CI Node20. The actual syntax/self-test passed, but Node20 was not installed or run.

## Stop boundary

193-4-P13..P15 are submitted for independent Review Lead inspection and reproduction. The four ticket acceptance boxes remain open. No launch, owner session, production work, 193-5, commit, merge, ref update, polling or follow-on correction is authorized by this report.
