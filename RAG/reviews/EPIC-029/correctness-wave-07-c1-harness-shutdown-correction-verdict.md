# C1-H14 accepted as preparation; C1-RUN-02 authorized

Review Lead, 2026-09-07. PROJECT-RECORD rev0.79. **No production/C1 acceptance.** This authorizes Review Lead to execute one separately identified isolated second run, not an unbounded retry.

## Review receipt

Submission SHA256 **202eaaee4f890f14e775fe5ce1a63dde5327a109a89c921761d06eda5d743c5b** fully read and hashed. Lead inspected the complete driver-only diff from12464052 to **fd8e8099943113b207575113b7d360b9588134327c2cc890dff52a10fcd3476e**. Other13 manifest paths compare byte-identical to frozen Round03. Candidate reverified clean6e12a73783c7119dae9b6add947e1b5085abe003 and all four preservation hashes match.

The real eval callback body is now a pure-testable helper. execute_cases borrows EventInbox; DriverCompletionGuard owns it until the explicit main-loop finalizer result is acknowledged. Late callbacks retain a receiver during that interval. Unchanged send_event still taints unexpected disconnection. No case/receipt/trace failure rule is weakened or taint cleared. Watchdog done now follows the finalization acknowledgement, and the acknowledgement wait is failure-bounded. Failure to send the finalizer result remains nonzero.

The reported compiling causal before-fix assertion reproduces trace-failure finalization rejection after seven real ordered completion calls, real inbox drop and validated callback processing. It remains attributed historical evidence, not a newly rerun platform test. Lead independently reproduced **28 library +1 binary configuration =29 pure tests passed;0 failed/ignored;doc tests0**, fmt/check/all-target clippy/build offline with TAURI_CONFIG unset. The permanent late-callback test checks terminal uniqueness/last-row; the unexpected early-disconnect test retains failure. Existing incomplete/terminal-write/receipt/provenance/exit tests remain.

Fourteen sources and submitted binary **ac5a275f1b2ed5c0f42e5801f7522d12aad1da375346b909aa6d9e9902527688** are preserved in **/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness-review-h14.Be7eFm** as h14-submitted. Independent rebuilt binary **2a08c1c56a8e2564ba4fe0852d11253b648ab44f7cac23f5e6f84f64280a2d52** is preserved there as color-tool-c1-harness-h14-lead-build. Both are unexecuted at authorization and distinct build identities.

First run's ledgerbf09f574 and failed exit1 status remain unchanged. H14 is accepted as a preparation correction, not a retroactive run success.

## C1-RUN-02 exact assignment

Executor: Review Lead. Host rechecked macOS26.6.2 build25G83 arm64, no existing harness process. Execute exactly once from the standalone harness root after rechecking binary2a08c1c5 and absence of the fresh output path:

```sh
env -u TAURI_CONFIG /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/target-harness/debug/color-tool-c1-harness --run /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/run-20260907-second-reviewed
```

Incorporate the full C1-RUN-01 isolation and bounded-execution rules in preparation-verdict-round-03: only hidden/incognito/accessory test-owned WKWebViews and embedded local pages; no production app/setup/cache/data/media/network/plugins, source/config changes, external app control, retries or193-B. The binary itself creates the fresh directory and exclusive ledger. The original five-minute watchdog/per-case bounds stay; if still running after watchdog plus30 seconds, verify exact process identity and terminate only that harness PID, never a name-wide kill or another app. Preserve all output and report incomplete state.

Keep the first run immutable. Do not reuse either output directory. Record exact command/source/binary/config/host/time interval/exit and process output. Parse/hash the entire second ledger, verify sequence/order, all seven case completions, terminal row and actual exit0 before any finite-run pass. Distinguish actual versus injected callbacks, native dispatch versus JS execution, missing observations versus proven cancellation. Independently reconcile all case controls; zero exit alone is insufficient.

Write planning **RAG/reviews/EPIC-029/correctness-wave-07-c1-harness-run-02-review.md**. No automatic third run or source correction. Code Lead remains idle until a new bounded assignment.

Even a successful complete run remains selected-schedule macOS evidence. Windows/Linux, universal C1 ordering, actual production C1-C3/IO/consumer integration and193-B remain open; retention-only R and native/quick-switch ownership unchanged.
