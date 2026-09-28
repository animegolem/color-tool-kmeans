# C1 harness Round03 — preparation accepted; one first macOS run

Review Lead, 2026-09-07. PROJECT-RECORD rev0.77. **Preparation accepted, not C1 or production acceptance.** This record authorizes the exact single first run below by Review Lead; it grants no Code Lead source work,193-B, app integration, or repeat run.

## Verified preparation receipt

Submission **d6cfe265629d15164c490e04d27bc94a0d505919ea2d10be31ef0fe62dd55c71** fully read and hashed. Only driver.rs differs from frozen Round02; all other13 files compare byte-identical. Driver is **12464052c290afb3a1d0388ab9beb474e49a9d4c171035d74fae8ff2735d656d**. Lead read the complete diff: explicit PageLoadProvenance enters the real builder callback and both injected case6 calls; Started/Finished use one actual record constructor; the exceptional randomness-failure row also retains origin. Actual platform and synthetic control rows have separate evidence/source/actuality fields. Both permanent serialized-record tests cover Started and Finished through that same constructor. C1-H13 is satisfied.

The report retains the compiling before-fix assertion: platform source tauri-on-page-load versus required native-driver-injected-page-load;1 failed/25 filtered, exit101. This is Code Lead-attributed historical evidence. Lead independently reproduced final **26 library +1 binary configuration =27 pure tests passed;0 failed/ignored;doc tests0**, fmt, offline check, all-target clippy with warnings denied, and offline build, all with TAURI_CONFIG unset. No runtime was initialized by these checks.

Source14 and submitted binary **0610dfc964e1e96feee34f443ffae256f38dcf2c1d2965eabe9c5022b45d655f** were preserved before rebuilding in **/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness-review-r3.SEO7C2** (submitted executable suffix r3-submitted). Independent rebuilt arm64 executable is **3f0fc8eeee85252c83bbe1f96442f85f5cd9c7a8c15a3983c999f5e31bb6cd0c**, preserved there as color-tool-c1-harness-r3-lead-build. These are distinct build identities, not a reproducible-binary claim.

Candidate remains clean **6e12a73783c7119dae9b6add947e1b5085abe003**, and workspace manifest/lock, native manifest and artifact_ownership hashes match the report. Config/lock/identifier/embedded-page/incognito/hidden-accessory isolation remains as reviewed. No production setup, media, filesystem artifact registry, plugin, network, cache or normal app logger is invoked. Current host is macOS26.6.2 build25G83 arm64. No existing harness process was found.

## C1-RUN-01 — exact bounded authorization

Executor: Review Lead in the existing task. Run exactly once, from the standalone harness root, with TAURI_CONFIG removed:

```sh
env -u TAURI_CONFIG /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/target-harness/debug/color-tool-c1-harness --run /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/run-20260907-first-reviewed
```

Immediately before launch recheck the executable is3f0fc8ee and output path does not exist. The program itself creates that fresh direct child and ledger exclusively before App creation. Do not precreate or reuse the runtime directory. This authorization covers the hidden test-owned WKWebView, its local embedded pages, actual same-label close/replacement controls, seven prepared cases and eight case5 observations, and the native in-memory test metadata only.

Keep the current five-minute process watchdog and existing per-case limits. Inspect output using bounded tool waits; if the process fails to terminate after the watchdog plus30 seconds, verify the exact harness PID/command and terminate only that process, recording incomplete evidence. Never use a name-wide kill or affect Color Tool, other apps or system workloads. No broad app control, production data cleanup, build/source change, debug setting, dependency update, runtime fix or automatic retry.

Preserve the entire output directory on success or failure. Record start/end, executable/source/config identities, host, exact exit outcome and verbatim tool output; hash and parse every JSONL row, verify contiguous sequence and terminal status, reconcile cases and actual/synthetic events, and retain missing observations or failure. A zero exit alone is insufficient: require all seven ordered case-completed rows and a final successfully written harness-completed row. A failure/timeout/missing callback is a failed or inconclusive first experiment, not repaired silently or relabeled a pass.

Write an append-only first-run review report in planning RAG/reviews/EPIC-029/correctness-wave-07-c1-harness-run-01-review.md. A concrete runtime finding may support a later narrow assignment after review; it does not authorize editing/rerunning here. Code Lead remains idle until a subsequent explicit assignment.

## Remaining acceptance limits

Even complete seven-case success is finite selected-schedule evidence on this macOS build. Case5 missing timer reports stay unknown/canceled/undelivered, not proof of cancellation or guards. Injected late lifecycle controls remain synthetic; actual callbacks are not made correlated by callback names or JS nonces. Windows/Linux, universal C1 ordering and production activation remain open.193-A alone is accepted;193-B/C1-C3 IO and consumer integration remain unassigned. Retention-only R and normal quick-switch/native ownership remain unchanged.
