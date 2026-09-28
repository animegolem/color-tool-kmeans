# Wave07 C1 retained-window spike preparation Round02

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.85 and C1-H21..H24 in `correctness-wave-07-c1-retained-window-review-round-01.md`. This is the bounded five-file correction, locked compile, pure-test and unexecuted-build handoff. **The spike binary was not executed; no Tauri App, Window or WebView was constructed; no `run-*` output directory exists.** This does not authorize a runtime gate, production `tauri/unstable`, candidate mutation, 193-B or a visible-app experiment.

## Receipt and result

- Governing Round01 review SHA256: `174de57590e0adf7050e68713d75041a48d8dcc48e8543904b6da648a6f2f335`.
- Preserved original preparation report SHA256: `edcb8286b3cb68c374a75af880faccbd5ee7a7c17fbc5943b69852b9e92e2e5c`.
- PROJECT-RECORD rev0.85 SHA256: `32380616d00a15dd1ae01064a514ad69a6a7f9ab7065effe2756fe04899e101e`.
- Candidate rechecked clean at exact HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`; candidate root `Cargo.lock` remains SHA256 `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- Main checkout rechecked clean at exact HEAD `5baa20e021855fbc57aebf48fa0f9b3374ded281`.

**Preparation result:** H21-H24 are encoded in the standalone source and 35 pure tests pass. All locked offline format/check/test/all-target clippy/build gates pass. Exactly the five authorized existing spike files changed. The manifest, lock, build/config, entrypoints, pages and icon retain their reviewed hashes. Runtime/native callback behavior remains wholly unobserved and requires a separate Review Lead gate.

## Exact correction fence and identities

Standalone root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt`.

Changed, and only changed, existing authored files:

| Path | Round02 SHA256 |
| --- | --- |
| `README.md` | `f4441d8d33a1c3193525584f70578b3b3a006bafe44a5af3f459e5633a5a96bc` |
| `src/driver.rs` | `7fdf51715b8cdb2142c80735966cdba8c5d28c354e115ea3903fc4150ec3f1d1` |
| `src/protocol.rs` | `612ec9fb3a6786fa9474680534671cbc15a9ff3afd02b2f06c119ac1cd96c603` |
| `src/trace.rs` | `29b2465930a6f9004b920e89fd6dde2fa1e393409be36342a2e425a5a4feee70` |
| `assets/harness.js` | `1158d2c7725a4283c3e02ef92b6ab6d1993120d3ac8fa0a6e2976bf49fbebb1c` |

Reviewed hashes preserved exactly:

| Path | Preserved SHA256 |
| --- | --- |
| `Cargo.toml` | `7aaabee76589c0790bad36def31593735d60e94f8a203824220bc4bc26f58bd2` |
| `Cargo.lock` | `18c2cad32ac27297f4f2bc3dc3e1d1e5718dd21d4ef28e4b72fd32c3adc9368c` |
| `build.rs` | `487059eaf8a947b80f20a9aacac038a5047b2ad69d2401b827376c67d6fe847f` |
| `tauri.conf.json` | `5e6450e1597ef05c00425fbb533f91e412d6ccc1247f952fb2ef26c87b29bb0a` |
| `src/main.rs` | `b82ef9fc3b5f746880e1cb79684f2082576cc32e1a3f3e3791d6314c00d8d412` |
| `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3` |
| `assets/a.html` | `32449644907ffbe698fc9d9f07d5f2550ba49659df3034f154e65e776be8a02e` |
| `assets/b.html` | `b2c8d06b78a831d7da40382f7a1e27c43eafa615492f7178b86e4b37e9092460` |
| `assets/icon.png` | `2b8403d093bef802bb809e5d4ea5fc9364fac777a124dab01320ca3ea4b80156` |

The normalized locked feature tree matches the preserved lead review clone byte-for-byte after replacing only each standalone root path: both SHA256 `8412187e5b64ee21740632af3d46f845f340cee108b0c6a58eef2a4d94a13496`. No resolution, dependency, feature or checksum changed; no unlocked Cargo command was run in Round02.

Final unexecuted Round02 binary:

- path: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/target-spike/debug/color-tool-c1-retained-window`
- SHA256: `98e0cc736b96ea5ed589d22b1b200389cb19cc0e3882fda1f43504f0be87fec1`
- identity: Mach-O 64-bit executable arm64; `26,311,072` bytes; mode `-rwxr-xr-x`.

The Round01 submitted and independently rebuilt binaries remain preserved in the lead review root at SHA256 `a7e0a01d8e527b3e803e7795b23086945f5fe952d2194a78b4fc6bbe25f28ed2` and `3f1f5428f9da5e00d8f20ae0b02107b3065b7d46f5b6fd3c9bd27b68f69993c6`. The lead-owned probe source/binary remain `0242a3540288cf8e50fcb7b1f6d59419687c9b3d49bf2036ce9bef603319cc16` / `4f5ce0543e0fcdff9721142f07dbf911ff3cf107c1b4411976593b93135e7576`. None was executed in this correction.

## C1-H21 returning and authoritative final outcome

- Replaced non-returning `App::run` with public `App::run_return`. The outer result reconciles the framework loop code, intended and first observed exit, stored finalizer result, ACK-send fact, driver post-ACK result, trace/late-failure/parent-destruction/unexpected-exit flags, success-sealed fact, watchdog ACK/release state and watchdog-thread settlement. A zero loop code cannot hide an absent or failed driver result.
- Driver and event-loop bodies have panic boundaries. Driver panics become concrete driver errors; event-loop panics become a synthetic nonzero loop result. Uncaught driver-housekeeping panic still disconnects the watchdog sender, causing the armed watchdog path to request nonzero exit; Rust's panic hook provides stderr detail.
- The driver retains `EventInbox` through terminal acknowledgement. `consume_finalization_ack` receives a successful finalizer result, verifies `success_finalized`, then and only then acknowledges and releases the watchdog. Sender success alone is insufficient. The outer path separately waits for watchdog-thread settlement before it can accept success.
- Every error path publishes its concrete reason to the trace while writable or stderr after seal/trace loss. Native callback/event send loss calls the same failure publisher and sets the trace-failure flag. The blanket success-after-finalized shortcut is gone: unexpected post-seal traces and authority mutations set `late_failure` and reject. Only the known parent `Destroyed` teardown callback is explicitly ignored after the sealed success cut.
- Finalization checks failure flags before observing the controlled exit, again before terminal append, and the outer reconciliation checks them after loop return. A trace/write/flush/ACK fault or a racing failure cannot be accepted as success. Flush remains process-visible buffer flush, not fsync or power-loss durability.
- Runtime-used pure regressions cover a post-case callback recorded before finalization and rejected after seal, dropped event receiver, dropped finalization receiver, consumed ACK before watchdog release, a failure flag at the finalization recheck, loop-code-zero with failed/absent driver result, failure flags/unsettled watchdog, and write/flush failures.

## C1-H22 detected context, native endpoint binding and authority observation

- Native `premint_child` persists the exact selected embedded document, currently `tauri://localhost/{a|b}.html`. Navigation and page-start callbacks accept only byte-exact equality with that selected URL. HTTP/HTTPS aliases, wrong path, query, fragment and `about:blank` are not eligible.
- Bootstrap compares observed renderer `href` with that exact native-selected document before pinning or activation. A detected wrong/malformed document poisons the native invoking child. A permanent regression converts the lead's `about:blank` counterexample; another proves wrong context on retired A poisons A without changing active successor B.
- Bootstrap/acquire/release/held-control boundaries obtain the actual invoking `Webview` label. Protocol authorization binds that label to the pre-minted incarnation before registry mutation. The valid-other-child regression rejects the mismatched native invoker with an unchanged real `ArtifactRegistry` snapshot.
- `ProtocolSnapshot` now includes exact expected document, current admission state, activation serial, and a non-authorizing discriminator made from the already-held request ID and diagnostic document nonce. It distinguishes awaiting unpinned/pinned, eligible unpinned/pinned, active, retired and poisoned. The active-to-retired regression proves changed authority with identical counters and registry accounting; the early-pin regression proves its discriminator survives activation.
- Exact-original active recovery remains idempotent and returns only status plus the request ID already held by the renderer. Changed incarnation/proof/session/request/document-nonce fields conflict without mutation. No proof, session or successor credential is added to ordinary replies.

## C1-H23 complete and correlated stale-work controls

- Case2 obtains A's lease from the real registry, then actual A submits a held release containing that exact handle before retirement. The native receipt records A label/name/kind/handle. After B admission, releasing held A rejects at retired authority before lease lookup/release. A separate B-current/A-foreign-handle control reaches the owner-session check and rejects as another session. Both errors are recorded distinctly and the exact two-active-lease successor snapshot is unchanged.
- Known A is established through exact renderer observations of its activated initial reply and its `ConfirmedExisting` reply, each joined to native label/incarnation, expected document, observed document nonce, request ID and status. Current acquire/release/idempotent-release renderer replies are also joined and their returned handle must equal the requested native-issued handle.
- The ignored-ACK branch never writes the ignored native success into `state.lastBootstrap`; its renderer receipt proves `lastBootstrapIsNull=true`. While A remains active, the same original is invoked again through the ignored branch, must return `ConfirmedExisting`, and must preserve the full admission/registry snapshot before the separately held retry is retired.
- Required renderer matching is centralized on native child label, incarnation, exact document, observed document nonce, and relevant request/status or operation identity. Case5 first applies a valid B operation to seed `current-marker-preserved`. The exact stale A operation/request/payload nonce must then report `accepted=false` from B while retaining that marker; the native B/accounting snapshot is compared again after the receipt.
- Pure runtime-used matcher/control regressions reject wrong operation, stale request, wrong current-document nonce and marker mutation despite `accepted=false`; reject a mismatched release reply handle; and prove held old-A release differs from successor foreign release.
- The held/guarded paths acknowledge their hold immediately. They do **not** test delivery of an already-pending ordinary Tauri command response after a swap. That arm remains explicitly untested; forced guarded delivery is not its substitute.

## C1-H24 requested resize and retained geometry

- The initial parent snapshot records opaque public `Window::ns_window`, physical inner size and scale factor in setup on the main thread. Each replacement records and validates main-thread snapshots before close, after close and after successor add. Until the deliberate resize, identity/scale must match exactly and both physical dimensions may differ from the initial snapshot by at most one pixel.
- Case6 takes a fresh main-thread pre-resize snapshot, verifies retained identity/geometry, records the current resize sequence as a request boundary, converts the distinct `811 x 613` logical target through the observed scale factor, and requests that exact logical size.
- Selection requires an actual `WindowEvent::Resized` with sequence greater than the request boundary and physical dimensions within the one-pixel target tolerance. Backlogged/startup events cannot satisfy it. A coherent post-event main-thread parent snapshot and current child bounds must independently reach the same physical target within one pixel, with child position exactly `(0,0)`.
- The runtime-used regression rejects a pre-boundary event, rejects a post-boundary event with old dimensions, accepts only the matching post-boundary target, and proves equal old parent/child sizes still fail target validation. No sleep or corrective manual child resize can mask `auto_resize` failure.

## Corrected failure reproduction and friction

The first locked compile attempt was intentionally taken while the partial H21-H24 edit was still incomplete. It failed with five source errors, exit 101:

1. one old `NativeProtocol::release` call after the endpoint-binding rename to `release_for`;
2. one removed `sample_parent_pointer_on_main_thread` call;
3. one removed `RuntimeState.parent_pointer` field access;
4. stale `SequencedResize.width` access; and
5. stale `SequencedResize.height` access.

Those were the expected causal leftovers in case2/case6, not dependency or platform failures. After correction, locked check passed. The first pure suite then produced **23 passed, 1 failed, 0 ignored** because the old driver URL regression still passed `"/a.html"` and expected broad `http://tauri.localhost`; the corrected runtime helper requires exact `tauri://localhost/a.html`. Updating that regression to the ruled exact origin/path produced the final green suite.

`src/driver.rs` is 3,016 lines, `src/protocol.rs` 1,104 and `src/trace.rs` 751. This is material review friction and not a production LOC precedent. The five-path fence prohibited a module split. Rust source changes and the new report were made with `apply_patch`; `cargo fmt` performed only mechanical formatting. No manifest/lock/config/main/lib/page/icon/candidate/production edit, install, commit, cleanup or runtime reservation occurred.

## Pure tests and final gates

Inventory: protocol 14, trace 9, driver 10, main 2; total **35 passed, 0 failed, 0 ignored, 0 measured, 0 filtered out**. Driver/lib tests construct only protocol/ledger/channels/runtime state; no App or event loop is constructed. JavaScript syntax also passed `node --check assets/harness.js` with no output.

Final commands, all with `TAURI_CONFIG` removed and the existing `target-spike` output root:

```text
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo fmt --all -- --check
# exit 0; no output

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo check --offline --locked
# exit 0; Finished dev profile

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo test --offline --locked
# exit 0; lib 33 passed; bin 2 passed; doc 0; total 35 passed

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo clippy --offline --locked --all-targets -- -D warnings
# exit 0; Finished dev profile; no warnings

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-spike" cargo build --offline --locked
# exit 0; Finished dev profile
```

The final build relinked the authorized binary path but was not invoked. The standalone root still contains exactly the original fourteen authored paths plus existing Cargo/codegen outputs; no direct `run-*` child exists.

## Remaining boundary and next gate

This preparation cannot prove actual callback ordering, the unobserved initial-empty-document premise, WebKit/native child construction, close/removal, resize/autoresize, retained parent identity, process exit code, ledger contents, visual continuity, focus/first responder, z-order, Spaces/Stage Manager, fullscreen/restoration, another platform, fsync durability, production ownership or 193-B. It intentionally adds no ordinary pending-response experiment.

The precise future `--run` command remains only documentary. Review Lead must independently review/freeze this Round02 source and binary before any separate runtime assignment. Code Lead stops at this report without launching or polling.
