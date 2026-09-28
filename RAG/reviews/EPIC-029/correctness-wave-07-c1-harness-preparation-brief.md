# Wave07 C1-H1 — isolated macOS runtime harness preparation

Review Lead -> Code Lead,2026-09-07. PROJECT-RECORD rev0.73 and C1-H1..H5 in correctness-wave-07-c1-runtime-seam-verdict.md govern. Build the smallest real Tauri/WKWebView experiment for the previously identified C1 ordering gap. **Prepare and compile only; do not launch it in this assignment.**

## Exact source, artifact and write fence

Read accepted seam report559ee81e and new verdict. Candidate stays clean at **6e12a73783c7119dae9b6add947e1b5085abe003** in /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01.

Lead reserved this empty harness root:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz

Authored files allowed only within that exact root:
Cargo.toml, Cargo.lock, build.rs, tauri.conf.json, src/main.rs, src/lib.rs, src/protocol.rs, src/driver.rs, src/trace.rs, assets/a.html, assets/b.html, assets/harness.js, README.md. Use fewer files if cohesive. All authored edits via apply_patch. Generated compilation target/material may live under this same root; no source copied/modified in candidate. The only outside write is planning RAG/reviews/EPIC-029/correctness-wave-07-c1-harness-preparation-submission.md. If another authored file is genuinely required, request its exact path first.

Make a standalone crate outside the workspace, not a new candidate binary. Use exact installed tauri2.11.5/tauri-build2.6.3 and retain runtime-wry2.11.4/wry0.55.1. A read-only path dependency on candidate tauri-app is allowed to execute the actual193-A registry in harness tests; never call its main/setup/cache helpers. Reuse the candidate lock as the baseline mechanically and reconcile only the harness root-package graph offline. Existing serde/serde_json/rand may be direct dependencies if needed; no new fetched packages, upgrades, npm install or dependency runtime alterations. Report exact resolution deltas. Use a separate harness target directory; compilation may read the warm Cargo cache.

## Isolation is a required acceptance gate

- Distinct product name Color Tool C1 Harness and identifier com.color.tool.c1harness.zvfthz. No bundled production app, production identifier, normal app cache/local-data resolution, event logger, startup prune, FFmpeg, clipboard, media inputs, user dialogs, global shortcuts or app-control tools.
- No automatically created configured window. Construct only test-owned webviews manually with captured native incarnation, hidden/nonfocused and macOS accessory activation. Use supported incognito/ephemeral WebKit data mode; prove that setting from installed source. Do not assume data_directory isolates WKWebView, since its supported behavior differs.
- Embedded local test pages only; no runtime network or local server. Restrict navigation to harness pages; no asset protocol broad filesystem scope and no shell/dialog/fs plugins. No remote page, user file path or production cache command can reach this program.
- Runtime must require an explicit --run flag plus a fresh output directory strictly under this harness root before any App/WebView creation. Default invocation/help/config validation must not launch. No launch during preparation, including through cargo test; pure protocol/trace tests must instantiate no App/runtime.
- Future trace output uses only test-generated values beneath that fresh output root. No destructive cleanup command; preserve all generated evidence. Exit/watchdog is a bounded test failure condition, not a correctness timeout that retires a live consumer's ownership. Plan a maximum five-minute runtime, with per-case timeouts and nonzero failure/inconclusive status.
- All driver operations stay on its own handles. Any future same-label replacement uses only a harness-specific label. Do not close a retained old public handle after successor creation just to demonstrate Tauri's map-removal hazard; trace that hazard separately from testing our incarnation filter.

## Real mechanism and experiment ledger

Implement a small inspectable native protocol/driver, not a mock replacement for Tauri lifecycle. Capture a native random window incarnation in each builder closure and static init script; record a JS diagnostic document nonce at every document start (including same-URL reload). The nonce is observation, never authority. Native state is authoritative; only current-incarnation Started can advance checked generation/create challenge. Finished, requests and retries may not advance it. Guarded challenge eval checks expected incarnation and monotonically increases the page's generation slot. Only native validation of the current challenge activates a session. Challenge re-delivery goes via guarded current-document eval, never the requesting old promise.

Use a real193-A ArtifactRegistry behind an admitted harness session to demonstrate rejected callers allocate/acquire zero groups/leases; register only trusted test metadata, no disk artifacts. Do not turn this into C2 jobs/source/publication implementation. If an observed initialization-order gap leaves no established native generation, report inconclusive/failure rather than granting from a caller nonce.

Prepare these reproducible cases for later run:

1. Initial creation and same-URL reload: record native Started/Finished, diagnostic doc-start/ready and challenge-delivery/validation order. Duplicate bootstrap in a live document is idempotent; old-session retries are terminal. An absent initial callback/receiver is visible, not silently repaired by inventing recency.
2. A-to-B transition with A bootstrap held at a named native receipt/processing boundary, B activated, then release A. B must remain current; A acquires zero actual-registry ownership. Hold/release and callback events are logged separately.
3. Delayed eval negative/positive control: capture an unguarded A-targeted marker script before actual native submission; after B readiness release it, requiring its report identify B and marker mutation. Repeat with expected-incarnation/generation guard; B reports rejection and unchanged marker/session. If negative control does not execute, the case is inconclusive, never a vacuous pass.
4. Reverse-order challenge delivery: hold generation N and deliver N+1 first, then N. Page slot never decreases and native rejects old challenges. Separately test a challenge scheduled from B Started and record the diagnostic document that actually executes it; do not label a held-before-submission test as an already-submitted WebKit race.
5. Submit eval then trigger rapid A/B navigation or reload; record observed execution doc and native boundary. This is a scheduling observation with disclosed repetitions, not deterministic exhaustive proof. Rapid/canceled navigation and old Finished events cannot advance authority. Do not artificially manufacture a native event and call it platform evidence.
6. Same-label test-owned window replacement: old builder's captured incarnation must fail before native mutation when late already-captured work is released. New incarnation/session survives. Synthetic release of a captured callback is labeled synthetic; actual OS lifecycle events are labeled actual.
7. Old async response after replacement: payload's old session is rejected on the current page; ordinary Tauri callback routing and explicit page receipt are recorded separately. Numeric callback IDs alone never authorize an ownership transfer.

Two small pages may share a JS file; diagnostic labels/query values can distinguish rapid C visits. Keep initial protocol/state tests deterministic. A native monotonically sequenced JSONL ledger records actual event order, separate monotonic timestamps, intended and observed diagnostic document, incarnation/generation/session, eval queued/submitted/executed/returned, held-request release and registry accounting before/after. Distinguish planned/forced/observed/inferred events in records. Missing callbacks, parse failures, trace errors or case timeouts prevent clean acceptance. No run success based solely on native enqueue or an empty test list.

## Preparation verification and handoff

Run only offline build, cargo fmt/check/clippy and pure non-UI unit tests for this standalone harness; check exact dependency tree. No full candidate gates are needed because it remains byte-identical; verify its HEAD/status/hashes. No cargo run, opening binary/app, App/WebView instantiation, browser/CUA invocation, runtime launch or generated ledger claim.

Submit exact harness paths and authored SHA256 manifest, lock/version reconciliation, binary hash/architecture if built, command outcomes/counts, isolation proof from actual source/config, case-to-production-hook map, expected output schema and a precise prospective run command (not executed). State that platform ordering is still untested. Include any compile friction, unsupported setting or missing capability; do not paper over it with a protocol-only model.

Send report path/hash to existing lead task019f7c75-2b8b-7882-9df7-0cdc1e494671, then stop without polling. Lead reviews before authorizing a separate first macOS run. No Windows/Linux environment setup, dependency fork,193-B source or product-policy change.

