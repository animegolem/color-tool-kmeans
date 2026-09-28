# IMP-193-4 visible replacement — bounded preparation and run plan

Code Lead -> Review Lead, 2026-09-08. Governed by PROJECT-RECORD rev0.92, owner ruling 193-4-D1 and `imp-193-4-visible-replacement-brief.md`. This is the required pre-implementation plan only. No root, source, build, binary, output directory, App, Window or WebView was created or run.

## Plan result

**The six-case visible test is technically prepareable as a fresh, isolated macOS artifact with no dependency or feature increase beyond the already isolated Tauri `unstable` child-WebView experiment.** It should adapt the frozen authority/protocol/ledger machinery into an owner-controlled session, not extend the finite hidden driver or modify its preserved root.

The plan retains native pre-mint, unique child labels, report-before-bootstrap, detected-context poison, exact-original `NotReady` retry and permanent same-child retirement. It adds only the UI, owner-driven case state, focus/geometry/process-loss observations and graceful interactive shutdown needed by the brief. It does not claim production readiness, complete process-loss detection, startup liveness, pending ordinary-response behavior or owner acceptance.

Two locked-stack details must be designed around rather than inferred away:

1. Wry installs a default content-process-termination action that reloads the same WebView when no handler is registered (`tauri-runtime-wry-2.11.4/src/lib.rs:5119-5135`). The artifact **must** register Tauri's macOS `Builder::on_web_content_process_terminate` hook (`tauri-2.11.5/src/app.rs:1791-1806`) so an observed termination retires the actual labelled child and never takes the default same-child reload. The wrapper resolves the label through the manager (`tauri-2.11.5/src/manager/webview.rs:313-333`), so this is useful evidence but not complete detection coverage.
2. Locked Wry unconditionally activates `NSApplication` after inserting a WebView (`wry-0.55.1/src/wkwebview/mod.rs:662-700`), while its child branch does not call `makeFirstResponder`; explicit `Webview::set_focus` would do so (`:1036-1042`; Tauri wrapper `tauri-2.11.5/src/webview/mod.rs:1535-1538`). The artifact must not call window/webview `set_focus` during startup or replacement. Explicit owner-triggered replacements occur while the test app is already in use. A detected background process loss records pending recovery and waits for the owner to reactivate the retained parent before constructing one fresh child, avoiding a background self-replacement focus grab. Actual application/window/DOM focus changes remain test results, not guaranteed behavior.

## Smallest adaptation from the frozen baseline

The fresh artifact copies the exact locked manifest graph and the reusable protocol/trace foundations from `color-tool-c1-retained-review-r3.iuWPrw`; it does not edit that root. The relevant existing seams are:

- explicit non-runtime CLI and runtime gate: `src/main.rs:5-20,24-80,94-118`;
- canonical fresh output reservation and append-only ledger: `src/driver.rs:711-751`, `src/trace.rs:154-230`;
- parent construction, child creation and builder-local callbacks: `src/driver.rs:766-830,1145-1275`;
- fixed renderer report-before-bootstrap: `assets/harness.js:1-26,141-154`;
- actual-native-label receipt/bootstrap routing and context poison: `src/driver.rs:487-555`, `src/protocol.rs:342-492`;
- permanent retirement and close-before-successor path: `src/driver.rs:2404-2436`, `src/protocol.rs:285-421`;
- parent event and getter/bounds instrumentation: `src/driver.rs:1277-1318,2581-2699`;
- final trace/ACK/watchdog/outcome reconciliation: `src/driver.rs:918-997,1376-1424`, `src/trace.rs:239-494`.

The finite `run_six_cases` controller is replaced, not layered beneath the visible session. A pure `VisibleSession` state machine accepts owner commands one at a time, records the six lead-defined cases in order, and permits each case to end as `met`, `failed` or `untested` with a short owner note. `session-complete` means all six have an honest disposition and the ledger closed coherently; it never means the owner accepted adoption. Early close/Command-Q produces `session-incomplete-owner-quit`, not manufactured failure or acceptance.

Every authority-bearing renderer control includes the child's exact original tuple. A narrow non-mutating `NativeProtocol::authorize_exact_original` reuses the existing private authorization conditions (`src/protocol.rs:612-643`) and additionally matches the active original request/nonce; it cannot activate, renew or allocate. The Tauri command obtains the actual `Webview` label before this check. Bootstrap remains the only activation transition.

Replacement is serialized by one native in-flight flag. One accepted owner request or one delivered process-termination callback may schedule exactly one retire -> close -> fresh pre-mint -> add-child -> admission attempt. There is no timer retry, backoff, fallback reload or replacement loop. A second trigger while replacement is in flight records a conflict and stops that recovery. Failed creation/admission leaves the child retired and the session visibly failed; it does not reuse credentials.

## Proposed future root, namespaces and exact files

Review Lead must reserve a new, initially nonexistent root that is a direct sibling of the candidate and frozen experiment. The plan uses `<LEAD_RESERVED_VISIBLE_ROOT>` until that verdict supplies the absolute path and a short namespace suffix. No path below is authorized by this report.

| Proposed future path | Purpose and relationship to frozen baseline |
| --- | --- |
| `README.md` | Exact preparation/run fence, six-case instructions, evidence labels and residuals. |
| `Cargo.toml` | Fresh package/default binary name `color-tool-c1-visible-replacement`; same dependency set and exact versions as the frozen crate, including already-isolated `tauri = 2.11.5` with `wry,unstable` and the same read-only candidate path dependency. |
| `Cargo.lock` | Copy the frozen lock and change only the root package identity; all resolved versions/checksums must remain byte-equivalent otherwise. |
| `build.rs` | Byte-identical frozen `tauri_build::build()` entry. |
| `tauri.conf.json` | Fresh product/identifier, empty configured windows, local `assets`, bundle disabled, same offline CSP. |
| `audit-visible-run.cjs` | One bounded Node 20 ledger validator: sequence/newline/schema integrity, child-label uniqueness, no same-child renewal, six dispositions, evidence-kind separation and one terminal record. It does not judge owner feel. |
| `assets/interface.html` | One local editable interface: test banner, text input, local view toggle, current child/incarnation, native-retained-state indicator, case panel and explicit replacement/reload/simulated-loss/geometry/finish controls. No external assets. |
| `assets/harness.js` | Frozen seed/report/bootstrap core plus DOM focus/selection/visibility/shortcut/paint receipts and owner controls. No text contents are logged, only length and selection indices. |
| `assets/icon.png` | Byte-identical frozen compile-only RGBA icon; test identity comes from product/window title and in-content banner, not icon inference. |
| `src/main.rs` | Same help/validate/explicit-`--run` gate with the fresh root, product and binary names. Default invocation never initializes Tauri. |
| `src/lib.rs` | Exports `driver`, `protocol`, `session` and `trace`. |
| `src/driver.rs` | Visible Tauri parent/child lifecycle, actual-label commands, serialized replacement, process hook, window/geometry callbacks, interactive finalization and watchdog. Reuses rather than reimplements frozen bootstrap/context code. |
| `src/protocol.rs` | Frozen state machine plus only the non-mutating exact-active-original authorization query and its pure regressions. No bootstrap/lifecycle transition change. |
| `src/session.rs` | New small Tauri-free six-case/disposition/in-flight/terminal state machine with pure tests. It is artifact-specific, not a general test framework. |
| `src/trace.rs` | Frozen append-only ledger/outcome machinery adapted to owner-driven dispositions; adds `owner-reported` as a distinct evidence kind and supports coherent complete or incomplete ordinary quit. |

The fresh namespace proposal is:

- package/binary: `color-tool-c1-visible-replacement`;
- product/window title: `Color Tool — Visible Replacement Test [<LEAD_SUFFIX>]`;
- bundle identifier: `com.color.tool.c1visible.<LEAD_SUFFIX>`;
- parent label: `c1-visible-parent-<LEAD_SUFFIX>`;
- never-reused child labels: `c1-visible-<LEAD_SUFFIX>-child-0001`, monotonically increasing within the process;
- preparation target: `<LEAD_RESERVED_VISIBLE_ROOT>/target-visible`;
- submitted/lead-frozen binaries: `color-tool-c1-visible-<ROUND>-submitted` and `color-tool-c1-visible-<ROUND>-lead-build` in a separately lead-reserved review root;
- run output: `<LEAD_RESERVED_VISIBLE_ROOT>/run-<LEAD_RESERVED_SESSION>/ledger.jsonl`, a previously nonexistent direct child created atomically once.

The old `assets/a.html` and `assets/b.html` are not copied into the new source set; their frozen originals are neither deleted nor changed. No screenshot, media, owner file, preference, cache or production artifact path is created by the test.

## Owner-controlled interface and transient-state policy

The parent is a regular, decorated, focusable window. It is constructed hidden and unfocused, the first child is admitted, then the parent is shown **without** `set_focus`; the owner clicks or switches to it. The interface permanently displays the experimental title, parent namespace, current child label/incarnation/admission serial and the frozen registry's native-owned marker/accounting. This native status is read-only and survives child replacement.

The text input begins with a clearly synthetic prompt. The ledger stores input length, selection start/end/direction, `document.hasFocus()`, `document.activeElement` role, visibility, modifier/key code for only the named test shortcuts, and monotonic receipt times; it never stores typed text. A pointer-down-preserving replacement control and one named keyboard shortcut allow the owner to trigger replacement while the field remains selected without a button click first moving DOM focus.

Transient renderer state is deliberately **not restored**:

- typed text, selection, active element, local view toggle and renderer-only marker reset to fresh defaults after replacement;
- native run identity, native registry marker/accounting, parent identity and parent window geometry remain;
- the artifact makes no automatic webview/window focus call after adding the child;
- the owner may click the fresh field and report whether recovery feels acceptable, but there is no hidden restoration branch.

Initial paint is split honestly. Native timestamps cover close request/return, child add return, page `Started`, document-start receipt and bootstrap activation. Renderer receipts cover DOM ready, first `requestAnimationFrame`, second frame and any supported buffered `paint` entry. Only the owner can report visible blanking, flash, z-order or composited first-paint quality.

## Six-case matrix

| Case | Owner action | Expected behavior | Observable failure | Evidence source |
| --- | --- | --- | --- | --- |
| 1. Initial appearance and input focus | Launch only under the gate; bring the test window forward; click the field; type synthetic text, select a range, Tab through controls and use the named local shortcut. | One admitted child; application activation, parent focus and DOM focus are recorded separately; typing, selection, Tab and shortcut receipts arrive without replacement. | Missing/duplicate admission, unexpected child change, keystrokes not reaching the field, Tab order failure, shortcut failure, or focus evidence that cannot be distinguished. | Native `WindowEvent::Focused` plus `Window::is_focused`; renderer `focusin/out`, `document.hasFocus`, active element, selection and key receipts; owner reports whether the app became frontmost and whether first-responder behavior felt correct. Tauri window events expose focus but no public Cocoa first-responder getter (`tauri-runtime-2.11.3/src/window.rs:28-57`). |
| 2. Ordinary local view interaction | Toggle the local A/B panel repeatedly and edit/select text without reload. | Child label/incarnation/admission serial stay exactly unchanged; DOM-only view changes and repaint do not retire authority; native indicator stays equal. | Any new lifecycle/policy call, child identity change, loss of active authority, or native state change attributable to the local toggle. | Renderer toggle receipts joined to native status snapshots before/after; native protocol snapshot. Owner confirms the UI behaved normally. |
| 3. Explicit fresh-child replacement | Leave a selection active, trigger **Replace child** by the selection-preserving control/shortcut, watch the transition, then click/type in the fresh child. | Exactly one retire/close/new pre-mint/add/admit sequence; same OS-window pointer and native state; new unique child; no credential reuse or automatic focus restoration. Renderer transient state resets per policy. | Same child/tuple renews, more than one successor is created, parent/native state changes, stale child mutates after retirement, replacement retries, or focus/paint behavior is unacceptable. | Native lifecycle/protocol/parent snapshots and timing; renderer old request and fresh document/DOM/paint receipts; owner judges application activation, window focus, first responder, selection loss and visible flash. Wry's unconditional app activation is explicitly recorded, not called continuity. |
| 4. Reload and invalidation recovery | First press **Request reload**; then, in the fresh child, press **Simulate process loss**. Do not kill OS processes. | Real reload navigation is denied/retired and followed by one fresh child; the forced loss is separately tagged `forced-simulated-process-loss` and also creates one fresh child. Neither path renews. If a real spontaneous termination callback occurs, it is tagged actual; background recovery waits for owner reactivation. | Reload proceeds in the same child, any old authority remains active, simulated loss is reported as a crash, default runtime-wry same-child reload occurs, or recovery loops/retries. | Actual navigation policy/PageLoad/protocol records; forced native invalidation record; optional actual Tauri process-termination callback. No induced process-loss result is claimed. |
| 5. Resize and move | Record baseline; owner triggers exact `811 x 613` logical resize and a recorded `(+32,+24)` physical move from the sampled outer position, then manually resizes/moves and requests another snapshot; repeat around one replacement. | Actual events and getters reach each recorded target within one physical pixel; child bounds reach `(0,0)` and cover parent inner size; parent pointer persists; manual movement remains usable. | Comparing only old/new equality, missing post-boundary event, getter/target mismatch, child gap/overlap, parent pointer change, or unusable visible coverage. | `WindowEvent::Resized/Moved`, parent inner/outer position/size/scale and child `bounds/position/size`. Locked getters/setters exist at Tauri `window/mod.rs:1470-1519,1826-1876` and child bounds at `webview/mod.rs:1508-1538`; owner reports visual coverage. |
| 6. Fullscreen, Spaces, minimize/restore and close | Owner uses ordinary macOS controls to minimize/restore, enter/exit fullscreen, move to another Space and back if relevant, then closes the window. Capture before/after snapshots from the interface where available. | Same parent/child identities survive ordinary mode changes; close is observed once, ledger finalizes and the app exits without reopen. Spaces are never manipulated programmatically. | Identity/replacement on mode change, lost/unrecoverable controls, unwanted window resurrection, missing/duplicate close, trace not finalized, or owner-visible unacceptable behavior. | Native focus/move/resize/close/destroy events plus `is_fullscreen`, `is_minimized`, `is_visible`, position/size getters (`tauri window/mod.rs:1501-1519,1576-1584`); renderer visibility/focus receipts; owner-only Space/fullscreen transition and feel notes. |

Application focus, parent-window focus and first responder are never collapsed into one Boolean. Application-frontmost state and subjective first-responder continuity are owner-reported; native window focus is event/getter evidence; DOM active element/selection/typing are renderer evidence. Wry's child insertion behavior is a source fact, not observation of the future artifact.

## Process-loss boundary

The artifact registers the macOS termination hook before any child is built. On a delivered callback it uses the actual `Webview` label, retires that native record immediately and records an actual termination receipt. If the parent is focused, it performs one fresh-child recovery; if unfocused, it closes/retires and sets `pending-owner-reactivation`, constructing only after a later actual `Focused(true)` event. It never calls `reload` or reuses the child.

There is no public test hook in this locked surface to deliberately terminate only the WebContent process. Killing a process through Activity Monitor, private WebKit API, debugger attachment or signal discovery is outside the plan. Therefore case 4's required controlled coverage is actual reload plus clearly simulated native invalidation. A spontaneous termination callback may be recorded if it happens, but **induced actual process-loss detection remains deferred/untested** unless the Review Lead issues new authority and a public mechanism is identified. The macOS/iOS-only hook also establishes nothing for Windows/Linux.

## Future preparation gates — not authorized now

After the Review Lead reserves the exact root and issues an implementation fence, preparation should use only that root and the existing offline cache. No command below launches the binary except `--help`/`--validate-config`.

```text
node --check assets/harness.js
node --check audit-visible-run.cjs

env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible" cargo fmt --all -- --check
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible" cargo check --offline --locked
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible" cargo test --offline --locked
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible" cargo clippy --offline --locked --all-targets -- -D warnings
env -u TAURI_CONFIG CARGO_TARGET_DIR="$PWD/target-visible" cargo build --offline --locked

env -u TAURI_CONFIG "$PWD/target-visible/debug/color-tool-c1-visible-replacement" --help
env -u TAURI_CONFIG "$PWD/target-visible/debug/color-tool-c1-visible-replacement" --validate-config
file "$PWD/target-visible/debug/color-tool-c1-visible-replacement"
shasum -a 256 "$PWD/target-visible/debug/color-tool-c1-visible-replacement"
```

The preparation report must include:

- exact hashes for all fifteen proposed files and the built binary;
- a lock comparison proving only the root package identity changed and Tauri `2.11.5`, tauri-runtime `2.11.3`, runtime-wry `2.11.4`, Wry `0.55.1` remain;
- actual pure-test inventory/counts, separating byte-preserved tests, adapted tests and new visible-session regressions rather than reusing historical `44`;
- regressions for non-mutating exact-current authorization, stale/retired control rejection, unique labels, one in-flight replacement, real versus simulated loss labels, no same-child recovery, geometry target comparison, all three case dispositions, incomplete owner quit, complete finalization, trace failure and watchdog settlement;
- proof default/help/config validation do not initialize Tauri and that config has no auto-created windows, remote content, plugins, production cache/media/preferences or bundle target;
- source diff against the frozen fourteen-file baseline, explicitly accounting for excluded `a.html`/`b.html` and new `interface.html`, `session.rs`, and audit script;
- candid LOC/review friction and no claim that a built artifact was launched.

The Review Lead then independently reviews source, reproduces counts, builds a distinct binary, verifies hashes and freezes the exact source/binary. Green preparation is not launch authority.

## Separate bounded launch and quit gate

A later launch verdict must name the exact lead-reviewed binary path and SHA256, one previously nonexistent `run-<LEAD_RESERVED_SESSION>` directory, host/macOS version, maximum session duration and the six-case instructions. The only runtime command is:

```text
env -u TAURI_CONFIG <LEAD_FROZEN_BINARY> --run <LEAD_RESERVED_VISIBLE_ROOT>/run-<LEAD_RESERVED_SESSION>
```

The owner launches it manually. Nothing is installed, scheduled, started at login or opened automatically. There is no server, network, owner-file picker, media import, production cache, preference store or unrelated-window control. The initial hidden parent is shown only after the first child admits, without an explicit focus call. Replacements occur only from an accepted owner control, an actual denied reload request, or one delivered process callback; each trigger gets one attempt.

A 30-minute overall watchdog records `session-timeout`, flushes the ledger, requests nonzero exit and never retries. Trace/command failure similarly records once and exits nonzero. Normal red-close, Command-Q and **Finish and quit** remain available: completed six-case disposition finalizes `session-complete`; an earlier ordinary quit finalizes `session-incomplete-owner-quit`. The trace outcome describes evidence integrity, not behavioral success.

After exit, and without rerunning the artifact, the Review Lead may authorize:

```text
node audit-visible-run.cjs <LEAD_RESERVED_VISIBLE_ROOT>/run-<LEAD_RESERVED_SESSION>/ledger.jsonl
shasum -a 256 <LEAD_RESERVED_VISIBLE_ROOT>/run-<LEAD_RESERVED_SESSION>/ledger.jsonl
```

The immutable ledger, validator output and owner's explicit acceptable/unacceptable notes feed the lead-owned `imp-193-4-owner-acceptance.md`. A failed, incomplete or untested case is preserved as such. No result automatically enables production `tauri/unstable`, starts IMP-193-5 or edits candidate/main.

## Residuals and stop conditions

- Content-process termination coverage is not complete. The public macOS callback exists, but early label attachment, callback coverage and an induced public loss mechanism remain unproved.
- Wry activates the application when constructing a child. The plan avoids explicit focus APIs and background self-recovery, but only the owner session can determine actual app/window/first-responder behavior.
- DOM focus/selection and native window focus do not identify the Cocoa first responder. No new AppKit/Objective-C dependency is proposed merely to manufacture that proof.
- Renderer paint/rAF timing is not proof of visible composition, no-flash behavior or Space/fullscreen continuity.
- Real navigation denial/recovery does not test a renderer crash. Simulated invalidation must stay labelled forced.
- Ordinary pending command-response delivery remains untested. A replacement request is accepted at native receipt and may destroy its invoking page before a JS response; the test does not call that lost response delivered.
- Close return and label-map absence do not prove native child destruction. Parent identity is process-local and cannot establish restoration across app restart.
- Windows/Linux, production session/IO/consumer integration, native lifecycle completeness, transient restoration and IMP-193-5 remain outside scope.

Any future need for a dependency/feature beyond the frozen manifest, private API, process manipulation, production source, repeat run, automatic restoration, cross-platform runtime or broader artifact set stops for a new Review Lead ruling. An unacceptable visible result is a complete test result, not permission to refine until it passes.

## Plan validation and candid friction

Candidate, main, prior verdict/run-result identities and cited frozen/installed source are rechecked at handoff. The proposed source delta is intentionally larger in interaction surface than the hidden driver, but narrower in protocol: `protocol.rs` gains only a non-mutating query, while owner session policy is isolated in `session.rs`. This avoids adding more case/UI state to the existing 3,281-line `driver.rs` and keeps the trace semantics independently reviewable.

No source/build/test/runtime action was taken. Planning `git diff --check` and an explicit no-index whitespace check for this new untracked report are the only gates run now. Existing planning-tree dirt prevents a Git-only whole-tree provenance claim; the captured ticket/PROJECT/brief/verdict/result hashes and the two allowed authored paths are reported explicitly.
