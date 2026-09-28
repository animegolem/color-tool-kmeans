# C1-H14 — repair shutdown receiver lifetime, no rerun

Review Lead -> Code Lead, 2026-09-07. PROJECT-RECORD rev0.78. Read correctness-wave-07-c1-harness-run-01-review.md fully. **One driver-only implementation correction with pure tests/build is authorized; no App/WebView launch or second runtime invocation.**

## Concrete starting point and finding

Candidate remains clean6e12a73783c7119dae9b6add947e1b5085abe003. Harness root remains color-tool-c1-harness.zvftHz. Current driver12464052 and all other13 preparation paths are frozen in color-tool-c1-harness-review-r3.SEO7C2, together with submitted0610dfc9 and actually executed lead-build3f0fc8ee binaries. Do not touch those copies or run-20260907-first-reviewed (ledgerbf09f574,481 rows).

The first authorized macOS run reached all seven case completions but exited1. Rows479/480/481 show case7 completion, a valid final eval callback, then exit0 request. stderr: successful exit finalization failed: trace failure prevents clean harness acceptance. No terminal row. Source drops execute_cases' local EventInbox before the explicit exit is serviced, while send_event treats every pre-finalization receiver disconnect as trace failure.

Establish this causal teardown sequence with a compiling pure regression against the actual state/event/finalization helpers before repairing it. A fabricated success counter or disconnected mock is not evidence. Record the failed assertion and exact selected-test count; no runtime reproduction is needed or authorized.

## Required bounded correction

Keep the required event consumer alive through the explicit successful finalization boundary, or introduce an equally narrow explicit consumer-completion handoff that correctly distinguishes required running delivery from normal teardown. Preserve logging and validation of callbacks that arrive before the terminal boundary. A legitimate callback in the after-seven-cases/before-terminal interval must not falsely poison an otherwise complete ledger.

Unexpected receiver loss while required cases remain must still fail. A missing required receipt, actual trace/serialization/flush error, invalid callback, panic, incomplete case set or watchdog failure must still prevent success. Do not fix this by clearing trace_failed, globally ignoring send errors, setting success_finalized early, dropping callback validation, inventing a grace-time success rule, weakening case assertions, or silently accepting this old run.

Use a bounded, explicit lifecycle boundary rather than sleeps. If the correction waits for main-loop finalization, keep the failure watchdog effective until that boundary; never stop the watchdog and then depend on an unbounded acknowledgement. Existing timeouts remain failure bounds, not ownership expiry or success evidence.

Permanent actual-helper tests must cover: the late valid callback after all seven cases but before terminal finalization; unexpected disconnect before required completion; incomplete or genuinely tainted finalization rejection; and terminal success recorded exactly once with no subsequent rows. Keep all27 existing tests. Tests must instantiate no Tauri App/WebView/event loop.

## Exact fence and deliverable

Only existing harness **src/driver.rs** may change, including its tests and an in-file lifecycle helper if necessary. If a different file is genuinely required, stop and name it; do not self-expand. No changes to protocol, trace, main, JS, HTML, README, config, manifest, lock, icon, build.rs, dependencies, candidate, prior reports, source snapshots or runtime output. No file split or runtime launch.

Run offline fmt/check/all-target clippy/pure tests/build with TAURI_CONFIG unset and target-harness. Report exact old/new driver hash, unchanged13 manifest comparisons, unexecuted final binary hash, counts and verbatim causal regression output. Verify clean candidate6e12a73 and preservation hashes.

The only new outside-harness write is planning **RAG/reviews/EPIC-029/correctness-wave-07-c1-harness-shutdown-correction-submission.md**. Send its path/hash and stop without polling. Review Lead will inspect before issuing a distinct C1-RUN-02 authorization; the old run directory must never be reused or overwritten.

No general protocol review,193-B, platform fork, new pressure policy, source integration, production app/data action or owner decision is requested.
