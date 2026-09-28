# IMP-193-4 visible replacement preparation — round 01

Code Lead -> Review Lead, 2026-09-08. PROJECT-RECORD rev0.93. Prepared under accepted verdict SHA256 `bf55d439e1d73a35a47f37c41f4a19839b4c010881ae18a63e8d2b970db9b035` and plan SHA256 `d9c016009ed2e19123bb823ff6bf304486166e2a4f030fad431e22ea8e6fd5c8`.

## Result and fence

**PREPARATION MET.** The exact fifteen-file isolated source was prepared in the lead-reserved writable root, the validator self-test passed, 43 current Rust tests passed, every locked/offline formatting/check/test/Clippy/build gate passed, and the non-runtime binary paths behaved as inspected. This is source/build evidence only. No App, Window or WebView was launched; `--run` was not invoked; the reserved owner run path remains absent. Visible behavior, owner feel, actual process-loss coverage, launch permission, source freeze/review, owner acceptance, production adoption and IMP-193-5 remain untested or unaccepted.

- Writable source root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N`.
- Namespace: `p8xk8n`; package/binary `color-tool-c1-visible-replacement`; title `Color Tool — Visible Replacement Test [p8xk8n]`; identifier `com.color.tool.c1visible.p8xk8n`; parent `c1-visible-parent-p8xk8n`; child prefix `c1-visible-p8xk8n-child-`.
- Lead-only review root `color-tool-c1-visible-review-r1.pjWpcM` remains empty. Code Lead made no write there.
- Reserved later run path `run-20260908-visible-owner-01` does not exist.
- Only `target-visible/` and Tauri `gen/schemas/` were generated beneath the source root. No source candidate, main checkout, frozen root or prior evidence was changed.

## Authored file manifest

| Authorized file | SHA256 | Lines | Preparation role |
| --- | --- | ---: | --- |
| `README.md` | `f43747c71cd5e52642bdb13a0e20ba879811e25bf05e994694e0f15d5b810c61` | 49 | Run fence, six owner cases, evidence semantics and preparation commands. |
| `Cargo.toml` | `052a41135693e206ddb00a59e53d89f96870885bd02fbbfc143bf8115381edd3` | 16 | New root identity; frozen dependency/features only. |
| `Cargo.lock` | `92fccac801e029997d7330bb23e2b6b84e2fa40f55772004b7cc08621e235033` | 5,139 | Frozen graph with only root package name changed. |
| `build.rs` | `487059eaf8a947b80f20a9aacac038a5047b2ad69d2401b827376c67d6fe847f` | 3 | Byte-identical frozen build entry. |
| `tauri.conf.json` | `f64eb71cc1cd93a3a11abb32232570e9ef69e703f74f9493bce3639481d181db` | 19 | Empty windows, local assets, bundle disabled, p8xk8n identity. |
| `audit-visible-run.cjs` | `682aea2f61126d2ee9286642ac9a992741571d9505d36c4259f514561b3b8392` | 233 | Bounded JSONL structural/behavior validator and in-memory self-test. |
| `assets/interface.html` | `a1a613c2997b53f441582bc18a36b11784797b22fd6efd8b18cd72222f979a45` | 111 | Six-case owner interface and visibly isolated identity. |
| `assets/harness.js` | `dc14108147c6728a5d072bb999372500020331dae9d1b65d63a7638f7061b687` | 206 | Frozen report-before-bootstrap core plus focus/selection/paint and exact-original controls. |
| `assets/icon.png` | `2b8403d093bef802bb809e5d4ea5fc9364fac777a124dab01320ca3ea4b80156` | binary | Byte-identical frozen compile-only RGBA icon. |
| `src/main.rs` | `a0f1c90c415d550c045ee3ce060fc0cc16372dcf0dfbdc8ace60e5d4aced5c9d` | 121 | Default/help/config-only CLI; explicit `--run` is the sole Tauri entry. |
| `src/lib.rs` | `14e0735ca62ea86bef3955a54208c0a21cb261c3c72c26b44cc8158e529f1586` | 4 | Exports driver, protocol, session and trace. |
| `src/driver.rs` | `f2a2ab4fc5fca03369847065c0e414f00d49b2b5e0891d66430bb099371e894b` | 1,966 | Visible parent/child lifecycle, exact commands, serialized recovery, geometry, shutdown and ACK path. |
| `src/protocol.rs` | `f13eeac3707c8a73c5dcaf807fde70a13638ff1ce59f9621dbee60d58a8dc7bd` | 1,423 | Frozen protocol plus p8xk8n namespace and pure exact-active-original query. |
| `src/session.rs` | `bf1db1584f7f2d6e6e216b1df6723cecd659a8cbaccb30fad06b586e1b10d608` | 559 | Tauri-free dispositions, recovery ownership, background pending and terminal state. |
| `src/trace.rs` | `e448128dc3edd189c8e40afe47ba672586074b355255d3e50ab24ccd81fa40b2` | 499 | Append-only provenance, complete/incomplete/failed terminal and outcome reconciliation. |

The manifest is exactly fifteen authored files. Generated output and planning evidence are not counted as artifact source.

## Implemented preparation behavior

### Exact-current authority and recovery

- `NativeProtocol` preserves frozen pre-mint, first-navigation, `Started`, report-before-bootstrap, context poison, exact-original `NotReady` retry, active idempotence and permanent retirement transitions. Its only semantic protocol addition is `authorize_exact_original`: actual native invoking label, current active state, exact expected href and all six original tuple fields; it takes `&self`, allocates nothing and cannot activate or renew.
- Every renderer control carries that exact original. Runtime authorization additionally requires the same child to be the session's admitted current child with no recovery owned.
- The macOS `on_web_content_process_terminate` hook is installed on the Builder before `setup` can construct a child. It retires the callback's exact native label before recording/queuing. A stale callback can retire only its captured old record; it cannot change the current successor. A callback delivered during an already owned transition is recorded as stale/conflicting and preserves the owned attempt.
- One `VisibleSession` recovery slot serializes explicit replacement, denied reload, forced simulated loss and actual termination. Duplicate same triggers coalesce; conflicts reject; neither cancels the attempt. The reload command only authorizes `window.location.reload()`; the denying navigation-policy callback alone owns scheduling, avoiding request/policy double scheduling.
- Background actual termination becomes `pending-owner-reactivation`; only a real parent `Focused(true)` event moves it in flight. There is no window/WebView `set_focus`, focus restoration, timer retry, same-child reload or recovery loop.
- The coordinator samples current geometry, closes the retired child if available, constructs one fresh monotonic label, and waits at most 20 seconds for admission. Child absence is explicit and does not block recovery or quit. Protocol/session locks are dropped before close, child construction, window operations, JS evaluation, channel waits and exit.
- The one native exact-original bootstrap retry requires both an actual `Started` callback and the preceding renderer's completed document-start receipt (a `NotReady` reply can only be requested after that receipt). It is issued at most once and carries no successor credential.

### Visible interface and geometry

- The UI exposes a synthetic text field, pointer-down-preserving Replace button/`Command-R`, local A/B toggle/`Command-L`, current child/incarnation/admission, native registry marker, separate window/DOM focus, reload, forced loss, native snapshot, exact geometry, six ordered dispositions and Finish.
- Renderer receipts store only text length, selection indices/direction, active-element role, document focus/visibility, the two named modifier/key codes and renderer timing. Typed test content is never sent. Owner notes remain explicit owner-reported evidence.
- Renderer text, selection, active element, A/B choice and marker intentionally reset. Native registry state, parent identity and live window geometry are never reconstructed from renderer state.
- Geometry samples the current outer position, inner size and scale, requests logical `811 x 613` and physical `(+32,+24)`, waits for post-boundary matching move/resize events when required, then samples parent getters and child bounds until the same 20-second machine bound. A mismatch is retained as `exact-geometry-target-not-reached`; validator behavior cannot become accepted even if all owner dispositions say met. Manual move/resize/scale events do not touch protocol authority.

### Shutdown and evidence

- Red-close and Command-Q are observed and temporarily prevented while native control admission closes. Finish uses the same path. An owned in-flight recovery finishes or fails; a background-pending attempt can settle coherently for ordinary quit. Finalization never waits for a response from the renderer it closes.
- All paths converge on one `VisibleSession::terminal_snapshot`, one terminal JSONL record, an observed matching `RunEvent::ExitRequested`, one finalization ACK consumed by the coordinator, watchdog release and returning-loop reconciliation. Complete/incomplete exit 0; infrastructure/trace failure exits 1. Complete means all six dispositions exist, not that behavior passed.
- Expected teardown callbacks after the terminal cut are ignored and cannot taint a sealed ledger; real pre-seal errors remain recorded. Close-return and label absence are not described as proof of native destruction. Ledger flush is explicitly process-visible buffer flush, not `fsync` durability.
- The owner watchdog is 30 minutes, distinct from 20-second startup, recovery, geometry and finalization waits. No 20-second interaction inactivity timer exists.

## Validator self-test

`node audit-visible-run.cjs --self-test` exercised the actual in-memory parser/validator and exited 0. Positive fixtures were structurally valid complete, structurally valid incomplete with background-pending recovery settled for quit, and structurally valid complete with all owner reports met but a contradictory native geometry failure; the last correctly returned `behaviorAccepted: false`.

Nine negative fixtures were rejected: missing sequence, duplicate sequence, missing terminal, duplicate terminal, fabricated evidence/actuality mapping, simulated loss falsely labelled actual, same-child recovery renewal, malformed disposition and a complete outcome without six dispositions. Runtime validation also checks newline termination, contiguous safe sequences, one last terminal, evidence-kind mapping, unique admitted labels, started/settled recovery pairing, ordered six-case IDs, notes for failed/untested, and process-outcome/infrastructure consistency. Output fields separate `structurallyValid`, `processOutcome`, `behaviorAccepted`, native behavior failures, actual termination observed and simulated loss observed.

## Current test inventory

`cargo test --offline --locked` ran 43 current tests: 41 library and 2 binary tests; 0 failed, ignored, measured or filtered, plus 0 doc tests.

- Protocol: 22 tests. Nineteen frozen protocol regressions were carried/adapted to the exact local interface URL; three new tests cover exact-original query purity, mutation of every one of its six fields, and retired-original rejection against a successor.
- Visible session: 9 new pure tests covering ordered met/failed/untested dispositions, malformed notes/order, duplicate/conflicting attempt preservation, stale termination versus successor, background pending/resume, in-flight shutdown, pending ordinary-quit settlement, recovery timeout failure and exactly-once incomplete quit.
- Driver: 4 new pure tests covering fresh direct run paths, exact target/full child geometry, actual-versus-forced loss provenance and expected post-terminal callback immunity.
- Trace: 6 adapted/new tests covering sequence/newline/seal, write taint, provenance mapping, watchdog ACK discipline, structurally clean complete-with-failed-behavior and missing outcome evidence.
- CLI: 2 adapted tests proving default/help/config parsing and sole explicit runtime selection.

No current test is claimed byte-identical as a suite because test modules were adapted or replaced; no historical `44` count is reused. The nineteen carried protocol regressions are called out separately rather than mislabelled as newly invented coverage.

## Gate transcript summary

Host toolchain: Darwin `25.6.0` arm64; Node `v26.8.1`; Cargo `1.90.0`; rustc `1.90.0`. Node 20 was not installed or invoked in this preparation; the validator uses APIs available before Node 20, but an actual Node 20 run remains for independent reproduction if required.

All commands ran from the visible source root. Rust commands used `env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible"`; resolution was `--offline --locked`. No failure was masked.

| Command | Exit | Actual outcome |
| --- | ---: | --- |
| `node --check assets/harness.js` | 0 | No stdout/stderr. |
| `node --check audit-visible-run.cjs` | 0 | No stdout/stderr. |
| `node audit-visible-run.cjs --self-test` | 0 | `selfTest: passed`; complete accepted, incomplete not accepted, contradictory-native complete not accepted. |
| `cargo fmt --all -- --check` | 0 | No stdout/stderr. |
| `cargo check --offline --locked` | 0 | Finished dev profile. |
| `cargo test --offline --locked` | 0 | 41 lib + 2 bin = 43 passed; 0 failed/ignored; 0 doc tests. |
| `cargo clippy --offline --locked --all-targets -- -D warnings` | 0 | Finished dev profile with no warning. |
| `cargo build --offline --locked` | 0 | Finished dev profile. |

Source inspection confirmed `main` parses the command before reaching `driver::run`; default, help and config validation contain no Builder call. These separately allowed non-runtime executions followed the inspection:

| Binary invocation | Exit | Actual stdout |
| --- | ---: | --- |
| default | 0 | Printed the p8xk8n title/usage and stated that runtime requires `--run` and a separate verdict. |
| `--help` | 0 | Same non-runtime title/usage. |
| `--validate-config` | 0 | `configuration valid; Tauri runtime not initialized` |

Binary: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N/target-visible/debug/color-tool-c1-visible-replacement`

- `file`: `Mach-O 64-bit executable arm64`
- SHA256: `eb9515c35a310d22c97261ecc2878a3aa0b46b187e2fee446cbad5c627d95841`
- Approximate size: 25 MiB.
- It was built and invoked only on the three inspected non-runtime paths. It was never invoked with `--run`.

## Lock and generated-output inventory

`diff -u` against frozen `color-tool-c1-retained-review-r3.iuWPrw/Cargo.lock` contains exactly one changed line: root package name `color-tool-c1-retained-window` -> `color-tool-c1-visible-replacement`. The graph retains Tauri `2.11.5`, tauri-runtime `2.11.3`, tauri-runtime-wry `2.11.4` and Wry `0.55.1`. `Cargo.toml` retains the same five dependency entries, exact Tauri features `wry,unstable`, exact tauri-build entry and the same read-only candidate path; only package/default-run identity changed.

Generated `gen/schemas/` contains exactly four regular files:

| File | SHA256 |
| --- | --- |
| `acl-manifests.json` | `b8665c2471bd4c59d570c77e226f37410ce396da52525383a15b5cbbff9d786e` |
| `capabilities.json` | `44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a` |
| `desktop-schema.json` | `f68a9c570ecff07ac6826145d33b966d6fc02f7d680967f44437268b08a6ba78` |
| `macOS-schema.json` | `f68a9c570ecff07ac6826145d33b966d6fc02f7d680967f44437268b08a6ba78` |

Generated `target-visible/` contains 9,111 regular files, 1,070 directories, no symlinks and occupies approximately 2.5 GiB: two Cargo root metadata files plus 9,109 entries under `debug/`. Its top-level debug artifacts are the submitted binary and `.d`, library `.rlib` and `.d`, Cargo lock marker, and candidate build-script-copied `ffmpeg`/`ffprobe` sidecars. The sidecars are generated build output in the authorized target, not authored source. No output exists elsewhere.

## Frozen-source delta and preservation

The frozen fourteen-file source shape was copied selectively, not recursively. Frozen `build.rs` and `assets/icon.png` are byte-identical. Lock delta is the single root identity line above. Manifest, config and CLI have only fresh identity/path and visible-entry adaptations. `src/lib.rs` adds the new session module. `src/protocol.rs` changes the namespace/local page, adds the non-mutating query and three regressions: diff `+96/-8`. The finite 3,281-line hidden driver is replaced by a 1,966-line owner coordinator: diff `+1,502/-2,817`. Trace is narrowed for owner-driven complete/incomplete/failed outcomes: diff `+174/-426`. Harness becomes the visible control/focus/paint adapter: diff `+175/-124`. Frozen `assets/a.html` and `assets/b.html` are excluded; new `assets/interface.html`, `src/session.rs` and `audit-visible-run.cjs` replace that surface. Frozen audit scripts, outputs and binaries were not copied.

Preservation rechecks at handoff:

- Candidate HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`, empty porcelain status, root lock `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- Main HEAD `5baa20e021855fbc57aebf48fa0f9b3374ded281`, empty porcelain status; root lock observed `fc69255a02bb05664a4cd1e7fe9e69115034445584a3526e04dcdda76065b82e`.
- 193-3 startup authority verdict remains `697cc31e2ba22700aa88da96202a515c0ecb69b9041a3bd234a5f07dc203d05b`.
- Accepted hidden run result remains `7fce8facd661d0be5fd01c7ee682e85ab5f6c47131c3cc2ed534eeeae030ccdf`.
- Accepted plan remains `d9c016009ed2e19123bb823ff6bf304486166e2a4f030fad431e22ea8e6fd5c8`; preparation verdict remains `bf55d439e1d73a35a47f37c41f4a19839b4c010881ae18a63e8d2b970db9b035`.

## Candid friction and residuals

- `src/driver.rs` is 1,966 lines and exceeds the repository's 400-line advisory. The fifteen-file fence prevented extracting more files; the driver is still 1,315 lines smaller than the frozen driver. Review friction is real and should be weighed by the lead. No dependency or extra file was added to hide it.
- The generated Cargo target is approximately 2.5 GiB/9,111 files because the read-only candidate path dependency compiles the full desktop graph and copies its sidecars. It is confined to the authorized target and was not cleaned.
- Local Node was v26.8.1, not the CI-stated Node 20. Syntax and self-test passed and used no post-20 API, but this is not an actual Node 20 result.
- Compilation cannot establish visible composition, blanking, z-order, application-frontmost state, Cocoa first responder, typing/shortcut usability, fullscreen/Spaces/minimize behavior, ordinary response delivery after a page-destroying command, or owner acceptance. All six cases remain unrun.
- Wry's insertion activation and the public Tauri termination hook remain source facts, not observations of this artifact. No actual or induced WebContent process loss occurred. Forced loss remains explicitly synthetic.
- The public termination callback does not establish complete loss detection, and early startup/label-attachment liveness remains runtime-unknown. Windows/Linux remain outside this macOS artifact.
- Renderer `requestAnimationFrame`/paint receipts cannot prove composited first paint or no flash. DOM focus/selection and native window focus do not identify the Cocoa first responder.
- Close return/manager absence do not prove native destruction. Parent identity is process-local. Ledger flush is not `fsync` durability. These limitations are preserved in source and UI rather than inferred away.

## Handoff

Review Lead should review this exact source manifest, independently reproduce the validator/tests/build, build a distinct review binary in the lead-only root, compare hashes and decide whether to issue the separate one-session launch verdict. Preparation success is not launch authority. No checklist item for visible runtime, Spaces/fullscreen/close or owner acceptance is checked by this submission.
