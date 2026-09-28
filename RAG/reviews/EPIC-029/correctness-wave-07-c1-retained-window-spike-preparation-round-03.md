# Wave07 C1 retained-window spike preparation Round03

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.86 and C1-H25 in `correctness-wave-07-c1-retained-window-review-round-02.md`. This is the bounded three-file detected-context correction, locked compile, pure-test and unexecuted-build handoff. **The spike binary was not executed; no Tauri App, Window or WebView was constructed; no `run-*` output directory exists.** This does not authorize a runtime gate, production `tauri/unstable`, candidate mutation, 193-B or a visible-app experiment.

## Receipt and result

- Governing Round02 review SHA256: `9ff8b45f9e81ce1dde920ce15d78b6cde407df3bdea016416034165759da4d2e`.
- Preserved Round02 preparation report SHA256: `78096871038f2f7b6e9dfaa380a5d985a891c9d180b8be9bcf5e324cb94d7f8c`.
- PROJECT-RECORD rev0.86 SHA256: `f8e85bca48b62588926b218706dc0fb635764d8e69b1870c09815bd580cc81cd`.
- Candidate rechecked clean at exact HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`; candidate root `Cargo.lock` remains outside this spike and untouched.
- Main checkout rechecked clean at exact HEAD `5baa20e021855fbc57aebf48fa0f9b3374ded281`.

**Preparation result:** H25 is encoded at the actual renderer-receipt and Finished-load boundaries. Detected context contradictions poison the native-invoking child and fail experiment completion before ordinary receipt backlog or later ownership work. Unknown native sources fail without choosing a child from renderer data. Delayed wrong-A observations leave active B and its independent owners/accounting intact. All 44 pure tests and every locked offline gate pass. Runtime/native callback behavior remains wholly unobserved and requires a separate Review Lead gate.

## Exact correction fence and identities

Standalone root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt`.

Changed, and only changed relative to the preserved Round02 authored snapshot, existing authored files:

| Path | Round03 SHA256 |
| --- | --- |
| `README.md` | `941778330f0b8d4633d6ea24c32e8d9801922bc019ad55d0d5c128b76d2e4bd5` |
| `src/driver.rs` | `45b6daa37703799cf72c346ea06c1303333a78301d6db9d9c04d5ea8ec029d7d` |
| `src/protocol.rs` | `a956b7655fc8af4f50deb87979aa3b46ce13625e1a6c458266190d56c248c994` |

Reviewed hashes preserved exactly:

| Path | Preserved SHA256 |
| --- | --- |
| `Cargo.toml` | `7aaabee76589c0790bad36def31593735d60e94f8a203824220bc4bc26f58bd2` |
| `Cargo.lock` | `18c2cad32ac27297f4f2bc3dc3e1d1e5718dd21d4ef28e4b72fd32c3adc9368c` |
| `build.rs` | `487059eaf8a947b80f20a9aacac038a5047b2ad69d2401b827376c67d6fe847f` |
| `tauri.conf.json` | `5e6450e1597ef05c00425fbb533f91e412d6ccc1247f952fb2ef26c87b29bb0a` |
| `src/main.rs` | `b82ef9fc3b5f746880e1cb79684f2082576cc32e1a3f3e3791d6314c00d8d412` |
| `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3` |
| `src/trace.rs` | `29b2465930a6f9004b920e89fd6dde2fa1e393409be36342a2e425a5a4feee70` |
| `assets/a.html` | `32449644907ffbe698fc9d9f07d5f2550ba49659df3034f154e65e776be8a02e` |
| `assets/b.html` | `b2c8d06b78a831d7da40382f7a1e27c43eafa615492f7178b86e4b37e9092460` |
| `assets/harness.js` | `1158d2c7725a4283c3e02ef92b6ab6d1993120d3ac8fa0a6e2976bf49fbebb1c` |
| `assets/icon.png` | `2b8403d093bef802bb809e5d4ea5fc9364fac777a124dab01320ca3ea4b80156` |

The comparison used all fourteen authored paths from the preserved lead Round02 snapshot and reported exactly the three authorized differences above. Existing Cargo/codegen outputs were not treated as authored paths and were neither cleaned nor reused as runtime output. No manifest, lock, config, build, entrypoint, page, icon, trace, JavaScript, dependency, feature or checksum changed; no unlocked Cargo command was run.

Final unexecuted Round03 binary:

- path: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/target-spike/debug/color-tool-c1-retained-window`
- SHA256: `e1ed6376fa4ddc72f94f38b03f2d9223bac7f825198ffc325165a1aa28c917e6`
- identity: Mach-O 64-bit executable arm64; `26,332,720` bytes; mode `-rwxr-xr-x`.

The preserved Round02 submitted and independent lead-build binaries remain untouched at SHA256 `98e0cc736b96ea5ed589d22b1b200389cb19cc0e3882fda1f43504f0be87fec1` and `683366c88f0d431a7ca835fe678a7c89ff9030caee53ce793fdf995a01bb4c9a`. None of the three binaries was executed.

## C1-H25 detected-context guard

- `NativeProtocol::observe_context` first resolves the record by the actual native-invoking child label. It then compares renderer-reported child label and incarnation, the observed exact href, and any reported document-instance nonce against that native-selected record. A contradiction poisons that record only. An unknown invoking label returns failure before any record is selected from payload data.
- The first consistent observed document-instance nonce is retained diagnostically. Bootstrap rejects and poisons an inconsistent pre-admission nonce before an unpinned admission. Existing changed-key behavior for a pinned or active original remains a nonmutating conflict rather than being broadened into poisoning.
- Poison is preserved through later navigation-policy and page-start observations, so a wrong document-start/receipt before bootstrap cannot be followed by activation.
- `RuntimeState::observe_detected_context` snapshots the protocol before and after the check, appends an Actual accepted/rejected context record, and publishes rejection through the existing failure path. Rejection therefore sets the completion failure flag and sends `DriverEvent::Failure` instead of letting the receipt enter ordinary backlog.
- `renderer_receipt` calls that helper before its ordinary trace append or event delivery and supplies `Webview::label()` as the native source. A valid payload cannot nominate a different child or incarnation.
- The Finished-load callback calls the same helper before its ordinary diagnostic record and event. It supplies the callback's actual `Webview::label()`, the captured pre-minted label/incarnation, no renderer nonce, and the callback URL. Expected late Finished remains a diagnostic; a wrong URL fails before backlog.
- A delayed wrong observation from retired A may change only A from retired to poisoned. The current snapshot for B, two active registry leases, native owner and session owners remain unchanged.

Matching label/incarnation/href/nonce values remain diagnostic consistency only. They do not authenticate a native frame, establish a WebKit schedule, or close the unobserved initial-empty-document premise. No credential, callback, IPC schema, ordinary pending-response arm, runtime case, dependency or production logic was added.

## Permanent regression evidence

Nine pure tests were added inline: five protocol tests and four runtime-helper tests. The behavior-preserving first extraction checked only the already-existing label mismatch. With all five protocol invariants present before the guard implementation, the locked targeted run produced the requested causal red baseline: **14 passed, 5 failed, 0 ignored, 0 measured, 19 filtered; exit 101**. The failures were:

1. wrong document before bootstrap did not reject;
2. wrong receipt nonce after activation did not revoke ownership;
3. contradictory reported child/incarnation left the child active;
4. wrong Finished URL did not reject; and
5. delayed wrong-A context remained accepted.

The first guard implementation produced **17 passed, 2 failed**. It exposed two over-broad lifecycle effects: a poisoned child could be overwritten by a later eligible navigation, and a previously observed nonce made every changed bootstrap key poison instead of preserving the existing active/pinned conflict rule. Preserving poison across navigation/page-start and restricting observed-nonce bootstrap poisoning to unpinned admission produced the final targeted result: **19 passed, 0 failed, 0 ignored, 0 measured, 19 filtered**.

The runtime-used regressions then prove:

- a wrong pre-bootstrap document taints completion, produces a failure event and remains unactivatable;
- a wrong active nonce poisons before a later current ownership mutation and leaves the real registry unchanged;
- contradictory child/incarnation and unknown native-source observations reject, with the unknown source leaving the known active snapshot unchanged; and
- expected late Finished is accepted, while delayed wrong Finished for retired A fails completion and preserves active B plus both independent owner leases.

The original 35 tests remain. Final inventory: protocol 19, trace 9, driver 14, main 2; total **44 passed, 0 failed, 0 ignored, 0 measured, 0 filtered out; doc 0**. Driver/lib tests construct only protocol, ledger, channels and runtime state; no App or event loop is constructed.

## Full locked pure gates and friction

Final commands all removed `TAURI_CONFIG`, used the existing `target-spike` output root, and were offline and locked where Cargo resolves or builds:

```text
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo fmt --all -- --check
# exit 0; no output

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo check --offline --locked
# exit 0; Finished dev profile

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo test --offline --locked
# exit 0; lib 42 passed; bin 2 passed; doc 0; total 44 passed

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo clippy --offline --locked --all-targets -- -D warnings
# exit 0; Finished dev profile; no warnings

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo build --offline --locked
# exit 0; Finished dev profile

node --check assets/harness.js
# exit 0; no output
```

One pre-final strict-clippy run failed with `clippy::collapsible-if` in the new poison-preservation branch. Collapsing the nested condition was mechanical; the complete final sequence above was rerun green. The two intermediate red targeted runs are the intended behavioral evidence described above, not dependency, compile or platform failures.

`src/driver.rs` is 3,281 lines, `src/protocol.rs` 1,335 and unchanged `src/trace.rs` 751. This is material review friction and not a production LOC precedent. The three-path fence prohibited a module split. Rust/README changes and this new report were made with `apply_patch`; `cargo fmt` performed only mechanical Rust formatting. No candidate/main/193-B edit, install, commit, cleanup, runtime reservation or binary invocation occurred.

## Remaining boundary and next gate

This preparation cannot prove actual callback ordering, initial-empty-document observation, native frame identity, WebKit/native child construction, close/removal, resize/autoresize, retained parent identity, process exit code, ledger contents, visual continuity, focus/first responder, z-order, Spaces/Stage Manager, fullscreen/restoration, another platform, fsync durability, production ownership or 193-B. It intentionally adds no ordinary pending-response experiment.

The precise future `--run` command remains documentary only. Review Lead must independently review/freeze this Round03 source and binary and issue an explicit runtime verdict before any first retained-window run. Code Lead stops at this report without launching or polling.
