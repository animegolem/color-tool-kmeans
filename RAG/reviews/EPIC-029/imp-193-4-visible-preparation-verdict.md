# IMP-193-4 plan accepted; isolated preparation authorized

Review Lead -> Sol / Code Lead, 2026-09-08. PROJECT-RECORD rev0.93. **ACCEPT the plan with193-4-P1..P6 below. Prepare the isolated artifact only; do not launch an App, Window or WebView.**

Reviewed plan SHA256 `d9c016009ed2e19123bb823ff6bf304486166e2a4f030fad431e22ea8e6fd5c8`; submitted ticket `91b84d6f79019ef638c43209b4899960ac75d8f1f5552925744e815e639650bd`. Preserve both plan prose and earlier reports.193-4-D1 owner contract remains binding; this verdict supersedes the plan-only write fence for the exact preparation scope below, not production authority.

## Review basis

Lead independently verified runtime-wry2.11.4 `lib.rs:5119-5135` defaults to same-WebView reload without a termination handler; Tauri2.11.5 `app.rs:1791-1806` exposes the macOS hook and `manager/webview.rs:313-333` resolves its captured label through the manager. Wry0.55.1 `wkwebview/mod.rs:662-700` activates NSApplication when inserting the view; its child branch does not set first responder, whereas `:1036-1042` explicitly does so in focus(). These are source findings, not runtime observations.

Reread frozen CLI/output reservation, parent/child construction, authorization, close, main-thread geometry and finalization seams cited by the plan. The hidden driver's fixed initial-geometry assertion and success-only teardown cannot simply be reused unchanged for manual movement and ordinary owner quit. Candidate remains independently clean6e12a73/rootlock05e43199, main clean5baa20e; prior verdict697cc31e/run-result7fce8fac unchanged. No application tests/build/runtime were performed during this review.

## 193-4-P1 — Exact root, namespace and files

Lead created and verified two fresh empty sibling directories:

- Writable preparation root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N`.
- Lead-only review/freeze root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-review-r1.pjWpcM`. Code Lead must not write it.

Namespace suffix `p8xk8n`; package/default binary `color-tool-c1-visible-replacement`; product and window title `Color Tool — Visible Replacement Test [p8xk8n]`; identifier `com.color.tool.c1visible.p8xk8n`; parent label `c1-visible-parent-p8xk8n`; child prefix `c1-visible-p8xk8n-child-` with never-reused monotonic suffixes. Existing candidate path dependency resolves from this new direct sibling.

Exactly fifteen authored files are allowed under the preparation root:

`README.md`, `Cargo.toml`, `Cargo.lock`, `build.rs`, `tauri.conf.json`, `audit-visible-run.cjs`, `assets/interface.html`, `assets/harness.js`, `assets/icon.png`, `src/main.rs`, `src/lib.rs`, `src/driver.rs`, `src/protocol.rs`, `src/session.rs`, `src/trace.rs`.

Copy the frozen fourteen-file source baseline selectively; do not copy its outputs, extra lead audit files, binaries or old a.html/b.html. Preserve build.rs/icon bytes. Same dependency/features as frozen Cargo.toml; seed the exact frozen lock and change only root package identity. No unlocked resolution, network install or feature increase. Generated build/cache/transcript outputs may exist only in this root's `target-visible/` and standard Tauri `gen/schemas/`; these are not extra authored source. Locked tauri-build2.6.3/tauri-utils2.9.3 generate schemas there. No generated candidate/source changes are allowed.

Reserved for later, not to be created now: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N/run-20260908-visible-owner-01`. Lead will select/freeze submitted and independently rebuilt binaries in the review root and issue the actual run gate later.

## 193-4-P2 — Lifecycle and exact-current control

Preserve frozen bootstrap transitions, report-before-bootstrap, poison and exact-original NotReady/idempotence behavior. Protocol changes are limited to namespace substitutions and the non-mutating exact-active-original authorization query plus regressions. That query must require actual native-invoking current child, active state and the full original key; it cannot activate, renew or allocate.

Install the explicit termination hook before constructing any child, suppressing the default same-child reload route. Retire the callback's captured native child immediately; a stale/retired child's late callback must not retire or replace the current successor. Enqueue serialized follow-up work; do not block the main callback waiting for work that needs the same event loop, and do not hold protocol/session locks across close/add-child/main-thread dispatch or IPC completion.

One accepted trigger gets one recovery attempt. A duplicate/conflicting trigger is rejected or coalesced without starting another attempt and without cancelling the already-owned attempt or disturbing its successor. Real reload policy may deny navigation and signal that one attempt; avoid scheduling it twice from request and policy paths. Background delivered process loss leaves pending recovery until owner reactivation, with no explicit focus call. Preserve actual versus forced simulated loss labels; no induced crash or complete detection claim.

## 193-4-P3 — Visible behavior and failure access

Implement the plan's six-case interface and deliberate no-transient-restoration policy. Keep native retained state, native window focus, DOM focus/selection, owner-reported app/frontmost/feel and renderer paint timing distinct. No typed text content, global keyboard monitoring, owner files or unrelated-window manipulation.

No window/webview set_focus or automatic restoration. Wry's insertion activation must remain disclosed; show-after-admission does not guarantee the application stayed background during initial construction. No hidden activation workaround.

During replacement, preserve current parent identity and the immediately sampled current geometry, not the hidden experiment's initial640x480 forever. Resize/move controls must test actual target values and post-request observations. Manual move/scale changes must not be misclassified as protocol corruption.

If startup or recovery cannot admit a child, never hang waiting indefinitely for a control inside that unavailable child. Keep ordinary native quit possible and take the bounded failure/exit path with terminal evidence where the trace is usable; no automatic recovery loop. Retain a20-second bound for machine startup/recovery/finalization waits, separate from the30-minute owner-session watchdog. Do not apply a20-second inactivity deadline to owner interaction.

## 193-4-P4 — Honest disposition and teardown

Separate behavioral disposition from evidence-integrity/process outcome. Owner-reported met/failed/untested cannot overwrite a contradictory native invariant failure. A structurally complete ledger with a failed or untested behavior is not an adoption pass. Ordinary early quit may close coherently as incomplete; infrastructure/trace failure remains failure.

Close/Command-Q/Finish paths must close admission to new controls, reconcile queued accepted work and finalize exactly once. Do not wait for a renderer response after destroying its page. Record actual close/exit observations where available; a button's intention is not evidence that close happened. An unavailable final observation stays explicit, not manufactured. Expected teardown notifications must not retroactively poison a sealed successful/incomplete trace, and real pre-seal errors must not be discarded.

The session state machine and runtime must share the tested functions for in-flight ownership, stale callbacks, background pending recovery, dispositions, timeouts and close/finalization. Reuse the returning event-loop/result/ACK discipline with coherent complete and incomplete outcomes, not the hidden driver's assumption that every unsolicited quit is a failure.

## 193-4-P5 — Preparation gates and evidence

Run the plan's exact Node syntax and locked/offline cargo fmt/check/test/clippy/build commands, always from the new root with `env -u TAURI_CONFIG` and `CARGO_TARGET_DIR="$PWD/target-visible"`. No source or artifact runtime entry is allowed. Default/help/config-validation execution is allowed only after source inspection confirms it cannot initialize Tauri; report those separately from runtime.

Add `node audit-visible-run.cjs --self-test`: embedded in-memory fixtures must exercise the actual validator with a valid complete and incomplete trace plus rejection of missing/duplicate sequence or terminal, fabricated actual-versus-forced provenance, same-child renewal and malformed/inconsistent dispositions. No filesystem fixture corpus or App is needed. Validator output must distinguish structurally valid from behavior accepted.

Include the plan's pure regression inventory and especially stale termination versus current successor, duplicate recovery preserving the owned attempt, exact-original authorization purity, background recovery and close races. Run actual tests; do not claim historical44 as current counts. A failing preparation gate is a reportable result; never mark an expected failure passing with it.fails.

Report all fifteen source hashes, generated-output inventory, exact lock comparison, candidate/main cleanliness and prior preservation hashes; actual test counts/outcomes, CLI checks and binary path/SHA256/file type; source delta against the frozen baseline; candid LOC/friction and residuals. Report stdout/stderr/exit codes without masking failures. No new source file or dependency may be added merely to resolve a gate without a ruling.

## 193-4-P6 — Handoff and remaining fence

Allowed planning writes: fresh `RAG/reviews/EPIC-029/imp-193-4-visible-preparation-round-01.md` and193-4 ticket's validated evidence/issues only. Do not edit the original plan, brief, verdicts, PROJECT, epic, parent/other tickets, generated INDEX, source candidate/main, frozen roots, or lead review root. Do not complete the ticket or check owner/runtime acceptance.

No App/Window/WebView execution, `--run`, run-output creation, browser/desktop manipulation, OS process loss, installation, new task/subagent, polling, commit/merge/ref operation or cleanup. This external artifact is handed off by source/binary hashes, not a fictitious production commit. Future assigned repository implementation retains atomic per-IMP commits.

Submit preparation report/path/hash and stop. Review Lead independently reviews, reproduces gates, freezes exact artifacts and decides the separate launch gate. Owner feel,193-5 and all production adoption remain unaccepted.
