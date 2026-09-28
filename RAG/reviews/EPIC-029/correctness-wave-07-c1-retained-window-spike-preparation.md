# Wave07 C1 retained-window spike preparation

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.84 and C1-H17..H20. This is the bounded standalone source/compile/pure-test result authorized by `correctness-wave-07-c1-retained-window-preparation-verdict.md`. **The spike binary was not executed; no Tauri App, Window or WebView was constructed; no runtime output exists.** This does not authorize193-B, production `tauri/unstable`, candidate mutation or a visible-app experiment.

## Receipt and conclusion

- Governing retained-window brief SHA256: `f5d8d45644523b8926e965d8ff99f4c4489227635fb997f2a20d64f66aacd1d4`.
- Accepted preparation verdict SHA256: `e9504fa00670e312fbaaa61312fa6fd38917e08bfd244f4f6df72f2bcadcc1f2`.
- Accepted Round01 report SHA256: `1b58945c555bae93a7d14d1e3d1185cb96d553cd07b3c20c390a5b23c17cc8e9`.
- PROJECT-RECORD rev0.84 SHA256: `8eca82c48a9684234cbf08e54f1503309de42015987b6ce61ef024d36d1cc7b5`.
- Candidate rechecked clean on `codex/correctness-wave-01-2026-09-05` at exact HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`; candidate `Cargo.lock` remains SHA256 `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- Accepted Run02 / preserved failed Run01 ledgers remain SHA256 `0ef15c196b95ff523b32c62e600e1fd3f4f6389ff1b7e3702c0baf0bc481ad4f` / `bf09f57400e64a4bf39f1995a209db5d6507d3a40dc2cd6795ca779facd1bec5` at their original read-only paths.

**Preparation result:** all fourteen accepted paths are present under the isolated PEEpxt root, the exact locked graph compiles, 20 pure tests pass, all-target clippy passes with warnings denied and the arm64 binary was built and hashed without execution. Source encodes the six accepted cases and H14 terminal ordering. Runtime/native callback behavior remains wholly unobserved and requires the separate lead gate.

## Frozen source and binary identities

Root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt`, mode `0700`.

| Accepted path | SHA256 |
| --- | --- |
| `Cargo.toml` | `7aaabee76589c0790bad36def31593735d60e94f8a203824220bc4bc26f58bd2` |
| `Cargo.lock` | `18c2cad32ac27297f4f2bc3dc3e1d1e5718dd21d4ef28e4b72fd32c3adc9368c` |
| `build.rs` | `487059eaf8a947b80f20a9aacac038a5047b2ad69d2401b827376c67d6fe847f` |
| `tauri.conf.json` | `5e6450e1597ef05c00425fbb533f91e412d6ccc1247f952fb2ef26c87b29bb0a` |
| `README.md` | `45b2420f91b0b44a3b7e658baa43eb41364ba72ed920351c9624277fef52954b` |
| `src/main.rs` | `b82ef9fc3b5f746880e1cb79684f2082576cc32e1a3f3e3791d6314c00d8d412` |
| `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3` |
| `src/protocol.rs` | `ad35d8c82d5a6f0125e5a48759672c878b7fc569ca4299ab03b4e4fbeb479d2e` |
| `src/driver.rs` | `5c8dc3c42a611b38656ed2e4d0c0c1a279f864f9c800d44326bc51f30a5c3aba` |
| `src/trace.rs` | `353fec283603d64fed7d267be2698db678e4cdc41c290c9ca584fa0dc7a83806` |
| `assets/a.html` | `32449644907ffbe698fc9d9f07d5f2550ba49659df3034f154e65e776be8a02e` |
| `assets/b.html` | `b2c8d06b78a831d7da40382f7a1e27c43eafa615492f7178b86e4b37e9092460` |
| `assets/harness.js` | `f687332599c737476954fec0bfc937abe2bc9ac9752f52740738eaa59b53afbb` |
| `assets/icon.png` | `2b8403d093bef802bb809e5d4ea5fc9364fac777a124dab01320ca3ea4b80156` |

The icon is a self-generated 32x32, 8-bit/color RGBA, non-interlaced PNG. Two identical generation passes produced the same hash. It contains no timestamp metadata.

Frozen unexecuted binary:

- Path: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/target-spike/debug/color-tool-c1-retained-window`
- SHA256: `a7e0a01d8e527b3e803e7795b23086945f5fe952d2194a78b4fc6bbe25f28ed2`
- Identity: Mach-O 64-bit executable arm64; `26,147,568` bytes.

This is the identity of the final produced binary, not a cross-link reproducibility claim. An earlier same-source development link had SHA256 `3f44bc2d718e3b83ac0ea6680af1e8201586d0148e1421e4a19ceb577817d970`; the final gate relink changed the Mach-O bytes. Only the current `a7e0...` binary is handed off for independent review.

Tauri codegen also produced four generated schema files under the authorized root at `gen/schemas/`; Cargo outputs remain under `target-spike/`. They are generated outputs, not additional authored fixture paths. No `run-*` child exists.

## Lock reconciliation and exact graph

- Seed lock: older standalone `Cargo.lock`, SHA256 `69c54a9046ee95e04eda5f2db478964c6cddc2e756e96e149725a6fe68e0fd72`.
- Final lock differs from that seed by exactly one package-name replacement: `color-tool-c1-harness` -> `color-tool-c1-retained-window` (11 unified-diff lines, one changed value). Package versions and checksums are otherwise byte-identical.
- Toolchain: `cargo 1.90.0 (840b83a10 2025-07-30)`; `rustc 1.90.0 (1159e78c4 2025-09-14)`.
- Locked framework: `tauri 2.11.5`, `tauri-build 2.6.3`, `tauri-runtime 2.11.3`, `tauri-runtime-wry 2.11.4`, `wry 0.55.1`.
- Root adds `tauri/unstable` and directly requests `wry`. The same locked Tauri package also has default features plus candidate-existing `devtools` and `protocol-asset`; `unstable` propagates to `tauri-runtime-wry/unstable`. No `macos-private-api`, nightly, fork, version upgrade or hashing dependency was added.
- The read-only `candidate-tauri-app` dependency brings its already-locked plugin crates and candidate feature union into the compile graph. The spike registers no plugin, capability or filesystem grant at runtime; this report does not call the compiled graph “plugin-free.”

Exact graph command completed successfully:

```text
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo tree --offline --locked -e features -p color-tool-c1-retained-window
```

The focused inverse-tree check showed `tauri/unstable` owned only by the new root, `tauri/devtools` and `tauri/protocol-asset` owned by `tauri-app`, and `tauri/wry` shared by the root feature request.

### Reconciliation friction

The sole unlocked command was initially issued while the new root had no lock instead of after mechanically seeding the old standalone lock:

```text
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo check --offline
```

Cargo resolved 490 packages from the offline cache and wrote an unintended 285-line lock diff containing multiple cached-version downgrades. That lock had SHA256 `3c0056fbcee485359df2fdafb0f9ea7e5f67c789d4983189ecd31f94769a1324`; it was never used to run the binary and is not retained. The approved old lock was then restored mechanically, and only the root package-name line was changed with `apply_patch`. No second unlocked Cargo resolution occurred. A subsequent `cargo check --offline --locked` accepted the final one-line semantic delta. This corrects the final artifact but is a disclosed sequencing deviation from H20.

## Implemented H17-H20 boundary

### H17 retained parent

- `WindowBuilder` creates exactly one hidden, unfocused, non-focusable parent labelled `c1-retained-peepxt`; the App uses macOS accessory activation.
- `Window::ns_window` is sampled as an opaque non-null integer in setup and again through `run_on_main_thread`; source never dereferences it or imports raw/private Cocoa APIs. Case6 requires exact within-process pointer equality.
- Parent `Destroyed` and unexpected `ExitRequested` are tracked independently and fail the driver during the six cases.
- Each child is created by `Window::add_child` from a fresh `WebviewBuilder`, incognito, unfocused, auto-resizing and uniquely labelled by native monotonic allocation `c1-peepxt-N`.
- Every replacement retires native authority before `Webview::close`. Generic trace rows separately record `child-close-requested`, `child-close-returned` and `child-label-absent`; no row or assertion calls this native child destruction. Old handles are not reused or closed twice.
- Case6 waits for actual parent `Resized`, samples actual parent inner size and child bounds in physical pixels, prints both per-dimension deltas and permits at most one physical pixel. It does not claim visual/focus/Space/fullscreen continuity.

### H18 conditional admission and owners

- Native pre-mints exactly four per-child fields: incarnation, bootstrap proof, session candidate and request ID. The static per-child initialization script adds one stable per-JS-instance diagnostic nonce. The five-field key is pinned as one unit.
- Early exact bootstrap pins but returns non-authorizing `NotReady`; the first eligible captured-current native `Started` enables one activation. Exact-original recovery returns `ConfirmedExisting` without new pre-mint, admission or registry acquisition. Conflicts, poisoned children and retired children reject before registry mutation.
- Wire `BootstrapReply` contains only status and the request's already-held request ID. It returns no proof, session candidate, successor identity or digest. Renderer `href` and nonce are labelled diagnostics; renderer receipt labels are cross-checked against the native invoking WebView label.
- Navigation is exact-local and one-shot. Repeated/ambiguous policy calls deny and retire; wrong/noncurrent `Started` poisons; a second `Started` cannot renew. `Finished` and renderer receipts never create authority.
- `NativeProtocol` uses the candidate's actual `ArtifactRegistry`. It registers one native-owned `Snapshot` group of 4096 resident bytes and retains the native initial lease. The exact baseline is resident/live-owned `1 group/4096 bytes`, eligible/claimed `0/0`, active leases `1`, reclaim candidates `0`.
- Current-session acquire raises active leases to `2`; current release and exact idempotent release restore the one-active-lease baseline before case2. The known-A case retains one A lease, rejects held stale bootstrap/acquire plus successor foreign release without changing the two-lease snapshot, and retirement never flushes the registry or independent native owner.
- The acknowledgement-loss case distinguishes committed native success from renderer delivery deliberately ignored at application level. If the first request was `NotReady`, the activation retry is also deliberately ignored; the case requires an ignored `activated` receipt before retirement. A held exact-original retry then rejects as retired after successor activation and returns no successor credential.

### H19 six-case and terminal guard

The completion gate contains exactly six ordered case names and the following required receipts:

| Case | Required receipts |
| --- | --- |
| 1 initial admission | parent-created; child-created; navigation-policy-observed; started-observed; document-start-observed; admission-observed; exact-confirmation-observed; conflict-rejected; current-owner-control-restored |
| 2 known A -> B | a-acquire-observed; a-retired; a-close-returned; a-label-absent; b-admission-observed; stale-controls-rejected; accounting-preserved |
| 3 unacknowledged A -> B | a-admission-committed; ack-ignored-observed; exact-retry-held; a-retired; b-admission-observed; held-retry-retired; accounting-preserved |
| 4 no same-child renewal | child-admission-observed; reload-requested; reload-policy-observed; reload-denied-retired; old-page-authority-rejected; successor-admission-observed |
| 5 old completion | old-acquire-held; successor-admission-observed; old-completion-rejected; accounting-preserved; guarded-delivery-rejected |
| 6 retained parent/resize | parent-identity-preserved; no-unexpected-parent-exit; resize-event-observed; bounds-reconciled; all-old-labels-absent; final-owner-snapshot |

Raw policy/PageLoad/renderer rows for successor admissions remain actual trace evidence but do not reuse case1's required-receipt names. Required JS effects wait for native callback or renderer IPC evidence; eval return is only a labelled forced dispatch and cannot replace the later required effect receipt. Missing required receipts, case/order errors, trace errors and timeouts fail closed.

After all six completions, the driver requests controlled exit0 while retaining its event inbox and an armed watchdog. Main-loop `ExitRequested(Some(0))` verifies the gate, appends the observed exit row, appends and flushes terminal success, sets success-finalized and sends the one-shot ACK. The driver receives that ACK before releasing the watchdog and publishing its result. A separate result channel prevents App-loop return from racing the driver's post-ACK result. Buffer flush is explicitly labelled process-visible, not fsync/power-loss durability; final process status remains a runtime-review item.

### H20 isolation and CLI

- Default, `--help` and `--validate-config` are resolved by pure argument/config functions before the only call site of `driver::run`; only exact `--run <path>` reaches Tauri construction.
- Output must be an absolute, nonexistent direct `run-*` child of the exact PEEpxt root. The root must be a real nonsymlink directory at its canonical identity, and `create_dir` atomically reserves the child. No cleanup/reuse path exists.
- `tauri.conf.json` has empty configured windows, local `assets` frontend, bundle false and no capability/plugin grants. Source has no server/fetch/remote page. Runtime children use the embedded pages and script only.
- Pure tests use in-memory trace writers. The path test generates a unique uncreated test name and does not create/delete a fixture. No old target/run tree was copied. Candidate, main, installed/running app and production storage were untouched.
- All authored text was added/changed with `apply_patch`; the old lock was mechanically restored before its one-line `apply_patch` rename. The binary icon was generated only at the accepted path. The planning carrier's sole new write from this assignment is this report; its pre-existing dirty/untracked review state was left untouched.

## Pure tests and gates

Test inventory: `src/protocol.rs` 8, `src/trace.rs` 8, `src/driver.rs` 2, `src/main.rs` 2; total **20 passed, 0 failed, 0 ignored, 0 measured, 0 filtered out**. No `test.fails` or ignored failure suppression exists.

Coverage includes early full-key pin/NotReady then one activation; exact-existing recovery/no allocation; changed diagnostic instance conflict/no mutation; known/unacknowledged retirement; actual-registry 4096-byte baseline/acquire/release/idempotence; stale acquire/release and successor foreign-release rejection; monotonic labels; exact local URL/`about:blank` rejection; output path shape; six-case missing/duplicate/out-of-order receipt failure; actual-versus-forced JSONL; late pre-finalization callback; success-before-exit rejection; write/flush failure; finalizer receiver loss; duplicate/wrong exit; and watchdog armed through its post-ACK release.

Final commands, all with `TAURI_CONFIG` removed and one shared target directory:

```text
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo fmt --all -- --check
# exit 0; no output

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo check --offline --locked
# exit 0; Finished dev profile

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo test --offline --locked
# exit 0; lib 18 passed; bin 2 passed; doc 0; total 20 passed

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo clippy --offline --locked --all-targets -- -D warnings
# exit 0; Finished dev profile; no warnings

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo build --offline --locked
# exit 0; Finished dev profile
```

Compile friction before the final green gates: the first check exposed the non-exhaustive `RunEvent::ExitRequested` pattern, then the first locked retry exposed a tail-expression mutex-guard lifetime. Both were corrected with `apply_patch`. A later source pass found and corrected successor admissions incorrectly trying to register case1-only required receipt names, application-level lost-ACK retry handling, generic close/label evidence, renderer/native label cross-checking and a possible App-return/driver-result race. Final gates above ran after those corrections.

The exact 14-path fence forces `src/driver.rs` (1702 lines), `src/protocol.rs` (761) and `src/trace.rs` (629) above the repository's normal 400-line warning threshold. This crate is outside the production workspace and no additional path was authorized, so no module split was made. Review Lead should treat size as explicit review friction, not as a production LOC precedent.

## Unexecuted future runtime command and open limits

Precise future command, recorded only and **not executed**:

```text
env -u TAURI_CONFIG /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/target-spike/debug/color-tool-c1-retained-window --run /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/run-LEAD-RESERVED
```

No default/help/config binary invocation, `cargo run`, direct binary launch, App construction, window opening or runtime reservation occurred. Therefore there is no claim about actual initial callback order, pre-attachment callback loss, `about:blank`, native parent/child behavior, close/removal, bounds, storage, process exit status or ledger contents.

Passing source/pure gates cannot close the initial-empty-document/document-authority premise: URL-only policy, lifecycle URL and renderer nonce remain insufficient native document identity. It also cannot prove native child destruction, missing-callback cancellation, visual continuity, focus/first-responder behavior, z-order, Spaces/Stage Manager, fullscreen/restoration, all WebKit side effects, another platform, fsync durability, production admission/ownership or193-B. Those boundaries remain explicit for independent source/pure/binary review and the separately authorized first runtime gate.
