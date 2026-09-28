# C1 harness preparation Round01 — AMEND before launch

Review Lead -> Code Lead,2026-09-07. PROJECT-RECORD rev0.75. Binding numbered amendments C1-H7..H12 below. **No harness launch or193-B authority.**

## Review receipt and preserved evidence

Submission correctness-wave-07-c1-harness-preparation-submission.md SHA256 **9588c34136fb84bd614852c4308bc94c857790caf34862a30928352e52f0fe00** fully read. Lead reviewed all authored Rust/JS/config and the seven cases, verified distinct identifier/hidden incognito builder/no production setup and actual installed WK nonPersistentDataStore mapping, and compared lock package sets: only harness root added, the11 reported unreachable packages removed, no shared package version/checksum changes.

All source/config/lock/icon/binary hashes match except the report's truncated src/lib.rs hash: actual **77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3**. Correct that transcription in the next submission, not by rewriting this original. Lead reproduced fmt, clippy and all12 pure tests with TAURI_CONFIG explicitly unset. No App/WebView/compiled main binary launched. Candidate remains clean6e12a73 with all four reported preservation hashes matched.

Lead preserved the14 source/config/fixture files and the original arm64 executable in **/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness-review-r1.A54v6z**. Original driver54d825da and executable970b51d1 verified in that copy. Do not modify this snapshot or the Round01 report. The first build's temporary production-icon override was a compile-only fence deviation, not an app launch or retained asset mutation; acknowledge it without treating the final distinct icon as erasing the earlier reuse. Do not use another override.

The green tests do not cover the issues below. This is a harness evidence/mechanism AMEND, not a newly observed Color Tool production defect.

## C1-H7 — No authority in ordinary bootstrap replies; real duplicate recovery

Observed driver.rs:652-662 returns BootstrapAck.decision=Some(BootstrapDecision), whose Activated/Duplicate variants contain ActiveSession including its token/challenge. That sends the grant through the ordinary invoke response despite the promised guarded-only delivery. Keep replies strictly non-authorizing boundary/status/error summaries; only the guarded current-document delivery may carry the grant.

ProtocolState::validate_bootstrap currently returns ChallengeConsumed when the exact original successful request is retried with known_session=None (protocol.rs:163-191). The existing duplicate test instead adds the already-known session token, so it does not test the lost-grant/duplicate-original boundary. Require the same current captured request/document/challenge to recover the same session through guarded delivery without a new allocation, even when the prior grant was lost. A different document nonce/descriptor, retired generation/session or stale incarnation must still reject and cannot replace the current session. Equality is tied to a native-established challenge, not an ordering decision from the nonce.

Permanent regression-first tests: serialize each actual IPC reply variant and prove it contains no session/challenge/grant secret; retry the exact original request before knowledge of the first grant and assert same session plus unchanged actual-registry counts; conflicting and retired requests reject. Test the real reply projection, not an independent sanitizer.

## C1-H8 — Diagnostics must not allocate authority

Observed eval_report at driver.rs:685-704 constructs a BootstrapRequest from a rejected renderer report, substitutes page_slot=expected generation, and calls the mutating process_bootstrap. Counterexample: a current-generation challenge is already installed in the page but its original bootstrap is held; a duplicate challenge is rejected as nonmonotone; the diagnostic report can then activate that held operation and allocate a group through the measurement path. It also labels a native-fabricated request as actual renderer rejection evidence.

Make diagnostic report processing observational only: no generation/session/group/lease mutation, and no synthesized page-slot correction. If case4 needs to force an old request into the actual bootstrap path, dispatch that explicit captured request through its separately named test control, mark the forcing synthetic, and validate it as a real request. Do not smuggle it through telemetry. Rejected-current/stale/malformed/duplicate diagnostic reports must leave protocol AND actual-registry state byte-for-byte/equality unchanged. Add a regression with the current-generation pending-bootstrap counterexample before fixing it.

## C1-H9 — Observe real destruction and keep replacement tests alive

build_window has no window-event handler; case6 releases an old bootstrap request, not the promised captured lifecycle callback. Add per-incarnation CloseRequested/Destroyed observation and terminal retirement only for matching native incarnation. A late old destruction/Started/Finished callback cannot retire or advance its successor. Preserve the distinction between interceptable close request and actual destruction; don't retire on a merely canceled close.

Current Builder::run installs an empty run callback (tauri2.11.5/app.rs:2449-2451). runtime-wry2.11.4/lib.rs:4311-4323 requests exit when the last window is destroyed unless prevented. The test closes its only window in case6 and7; a runtime exit can terminate the suite before the new window is built. Use an explicit supported run-event policy with a narrowly scoped test-replacement flag: prevent only the expected code-less last-window exit during controlled replacement, never explicit success/failure/watchdog exit. Log the actual ExitRequested/Destroyed events. Unexpected early closure/exit must not produce a successful outcome.

Case6 must cover actual current-window destruction and a distinctly labeled synthetic release of old captured lifecycle work, in addition to stale bootstrap. Pure production-helper tests cover matching retirement, stale callback nonmutation and exit-policy discrimination. Actual platform behavior remains for the later run.

## C1-H10 — Exact event joins and honest evaluation boundaries

wait_active_document at driver.rs:1196-1230 accepts any queued Activated session above a minimum generation. It does not bind expected incarnation/visit/document, and generation restarts at window replacement. An old backlog event or extra initial navigation can satisfy the wrong case. Bind each expected activation and delivery to the intended visit, native incarnation and diagnostic document instance, require matching readiness as appropriate, and reject stale/unrelated backlog events. Negative/positive page assertions must identify the exact successor, not merely not-A or a generic minimum.

Operation IDs such as challenge-N/session-N are reused across incarnations. Issue unique operation identities including incarnation/generation/attempt and capture origin case in queued callbacks; do not label a late callback as its newly current case. Keep callback arrival observation distinct from original operation attribution.

A successful Webview::eval_with_callback API return is native-dispatch acceptance, not proof the script has been submitted to/evaluated by WebKit. Label it accordingly. A parsed eval callback or explicit JS receipt supplies execution evidence; correlate those by the actual operation. Case5 must not describe a queued Tauri call as proven already-submitted-to-WebKit. A missing timer receipt is unknown/canceled/undelivered observation, not proof of cancellation or successful guard operation. Malformed required receipt/callback data cannot be silently accepted.

Add tests on the real matcher/operation/receipt helpers: stale same-generation foreign-incarnation events, wrong visits/nonces, reordered prior-case events, mismatched execution receipts and malformed payloads do not complete the case; the exact positive sequence does. No fabricated native callback is platform evidence.

## C1-H11 — A durable complete ledger is required for success

The current driver checks trace_failed before the final harness-completed append, then ignores failure of that append and calls exit(0). An unexpected native exit can likewise bypass the seven-case completion gate. Make success contingent on all seven required cases and successful final trace flush. A failing/partial terminal write, panic/driver failure, early exit or missing required evidence must produce nonzero failure/inconclusive and may not emit/claim a clean accepted receipt.

Use a fail-injectable actual ledger/finalization helper in pure tests: write failure specifically on the terminal record must fail the outcome. Check completion count and no previously tainted state, not just a final boolean. Open the fresh ledger exclusively rather than relying on File::create truncation semantics. Keep timeouts as test-failure limits, never as authority retirement. The watchdog's exit request must not be prevented by the replacement policy.

## C1-H12 — Exact correction fence and handoff

Only these six existing harness files may change: src/driver.rs, src/protocol.rs, src/trace.rs, src/main.rs, assets/harness.js and README.md. Tests remain in these files. No new dependency, file split, config/icon/lock/manifest/build change, candidate modification or launch. The long driver is reviewable and not by itself the defect; don't split solely for LOC during this correction.

Run the relevant compiling before-fix regression cases and preserve honest failing assertion output; compiler/missing-module failure is not regression evidence. Then rerun offline fmt/check/clippy/pure tests/build and verify all out-of-fence hashes, candidate clean6e12a73 and exact locked runtime versions. Use the actual target-harness path in README prospective commands.

Write only planning correctness-wave-07-c1-harness-preparation-submission-round-02.md with exact old/new hashes, regression evidence, full counts, corrected manifest, source-to-case map and remaining runtime limits. Preserve original report and snapshot. Send path/hash then stop without polling. Lead reviews again before any launch; no owner policy decision or new whole-protocol review.

