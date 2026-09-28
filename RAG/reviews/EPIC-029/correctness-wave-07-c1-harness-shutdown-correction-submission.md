# Wave07 C1 harness shutdown correction submission

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.78 and binding C1-H14. This is the one-file event-consumer/finalizer lifetime correction after failed C1-RUN-01. **No harness executable, Tauri App, AppKit event loop, or WKWebView was launched. C1-RUN-01 was not rerun, reused, altered, or relabeled.**

## Result and exact fence

Changed only the existing harness file:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/src/driver.rs`

- Frozen Round03 driver SHA256: `12464052c290afb3a1d0388ab9beb474e49a9d4c171035d74fae8ff2735d656d`.
- Corrected driver SHA256: `fd8e8099943113b207575113b7d360b9588134327c2cc890dff52a10fcd3476e`.

Comparison against `color-tool-c1-harness-review-r3.SEO7C2` reports only `src/driver.rs` different after excluding generated Cargo/Tauri material, the frozen binaries, and the preserved runtime output directory. No protocol, trace, main, JS, HTML, README, config, manifest, lock, icon, build file, dependency, candidate file, prior report, source snapshot, or runtime output changed. This submission is the only write outside the harness.

The failed run remains immutable:

- `run-20260907-first-reviewed/ledger.jsonl`: SHA256 `bf09f57400e64a4bf39f1995a209db5d6507d3a40dc2cd6795ca779facd1bec5`.
- C1-RUN-01 review: SHA256 `2cf27c316a2f794c8bea7f0a58268c4b88ddd1d284e1dc52c131bee188be703a`.
- C1-H14 verdict: SHA256 `0b351cde1d07730da478cbeffa43ae2641c97d59f6da43f3eaed5eabe42016b2`.

Candidate verification after all work:

- `git status --short`: empty.
- HEAD: `6e12a73783c7119dae9b6add947e1b5085abe003`.
- workspace `Cargo.toml`: `22964484ab47857c253186fa250eb7a314c581bebdf8e8081852a27fa6ddd444`.
- workspace `Cargo.lock`: `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`.
- candidate native `Cargo.toml`: `dae7699f97f24acfd077ef7e85c1bb790e6463f821ae7c21d69b518219cd319e`.
- accepted 193-A `artifact_ownership.rs`: `a4bbdf1194920abde1ed9f1def8422a130630b384326aa0d324a575a7fbdd7c0`.

## Compiling causal before-fix regression

The callback body was first extracted without semantic change into `HarnessState::process_eval_callback`, which is now the actual production callback validation/logging/event-delivery helper. The regression then used the real `HarnessState`, `EventInbox`, seven ordered `record_case_completed` calls, an actually issued eval job, a valid serialized callback receipt, `process_eval_callback`, and `finalize_success`. It dropped the actual `EventInbox` at the same scope boundary as the Round03 `execute_cases` implementation. It did not write a fabricated completion counter or test only a raw disconnected channel.

The fully qualified test selected exactly one compiling test and exited 101:

```text
running 1 test

thread 'driver::tests::late_valid_callback_after_cases_does_not_poison_terminal_finalization' panicked at src/driver.rs:3287:9:
assertion `left == right` failed
  left: Err("trace failure prevents clean harness acceptance")
 right: Ok(())
test driver::tests::late_valid_callback_after_cases_does_not_poison_terminal_finalization ... FAILED

test result: FAILED. 0 passed; 1 failed; 0 ignored; 0 measured; 26 filtered out; finished in 0.00s

error: test failed, to rerun pass `--lib`
```

This reproduces the C1-RUN-01 causal suffix in pure production helpers: the validated callback row writes, delivery to the prematurely disconnected required-event consumer taints `trace_failed`, and terminal finalization rejects. It is not a runtime reproduction or a retroactive success claim.

## C1-H14 correction

- `execute_cases` now borrows its real `EventInbox`; it no longer creates and drops the required-event receiver when case 7 returns.
- `DriverCompletionGuard` owns that inbox plus a bounded finalization-acknowledgement receiver. The driver retains the guard while all seven cases run, requests explicit exit 0 only after they complete, and then waits while still owning the event receiver.
- The main-loop explicit-zero handler records the exit request, runs the existing seven-case/untainted durable finalizer, and sends its exact `Result<(), String>` back to the guard. Only after a successful acknowledgement may the driver drop the inbox.
- The correction does not ignore a send failure. `HarnessState::send_event` is unchanged: an unexpected receiver disconnect while required delivery is live still sets `trace_failed` and blocks completion/finalization.
- Callback parsing, attribution, trace logging, and event delivery are unchanged in behavior; their existing body now lives in `process_eval_callback` so the causal path is directly pure-testable. Invalid callback receipts still trace failure and return error.
- No taint is cleared, `success_finalized` is not set early, case assertions are unchanged, no receipt requirement is removed, and no grace delay or sleep defines success.
- The watchdog remains active across the handoff. The driver no longer sends its done signal before `exit(0)`; it sends done only after a successful finalization acknowledgement. If the acknowledgement never arrives, the original total-runtime watchdog can still request explicit exit 124. The guard's own receive also has a bounded failure result.
- Failure/panic paths retain nonzero exit behavior. A failed finalization result or missing/disconnected acknowledgement cannot be converted to success.

## Permanent source-to-test evidence

1. `late_valid_callback_after_cases_does_not_poison_terminal_finalization` now owns the production `EventInbox` through `DriverCompletionGuard`, writes seven ordered completion records, validates/logs/delivers the late callback, finalizes, and receives the explicit acknowledgement. It asserts success without taint.
2. The same test uses a shared actual ledger writer to assert exactly one serialized `harness-completed` event, asserts that it is the final row, attempts a post-terminal record, and proves a second success finalization rejects without another row.
3. `unexpected_event_consumer_disconnect_before_completion_taints_run` drops the actual guard before required completion, sends a required driver event through unchanged `send_event`, and proves `trace_failed`, case completion rejection, and finalization rejection.
4. Existing `success_finalization_requires_all_seven_ordered_cases` retains the incomplete-case rejection and exact-seven positive path.
5. Existing `terminal_write_failure_prevents_successful_finalization` retains genuine terminal-ledger failure coverage. All prior callback validation, exact receipt, case, watchdog-bound, exit-policy, protocol nonmutation, and provenance tests remain present.

The permanent tests instantiate no Tauri builder, App, event loop, window, or WebView.

## Unchanged 13-file manifest

All hashes match frozen Round03 source:

| Relative path | SHA256 |
| --- | --- |
| `Cargo.toml` | `50dfd50c3b392f4a31845303fee28490e31bd8e4872a75e01ae9791717efb9ee` |
| `Cargo.lock` | `69c54a9046ee95e04eda5f2db478964c6cddc2e756e96e149725a6fe68e0fd72` |
| `README.md` | `b96d006a117b686505901dd9f2f784a21b3e712763e4212efb40376974ec37fe` |
| `build.rs` | `75cc0cc5d9904756f0836fde89236725c2f41fd962e27cff8cfccbd881e4deb8` |
| `tauri.conf.json` | `fea26088343061857e031fa68b4d716b17dea4f3ba65b224223fd1dcb8124b7f` |
| `src/main.rs` | `f6c81c97d4ee4be953438f6853c56572e272257cce36c9ddb99af51ed03bcbd5` |
| `src/lib.rs` | `77d19e2579ab5999108a62f6c0da700ca0f5a1beba1a50167c4f1f31e714efc3` |
| `src/protocol.rs` | `ea1bef009df6a3e9cc13d0777defcff7ba70c331a015896e24149a92d1314ce0` |
| `src/trace.rs` | `4c5c6b1d392ecc9147301b3e5f968b0b2f206ef8b142baaf5c854c98bffcdc66` |
| `assets/a.html` | `d99bf3129e919b3ff61804a21093d4a2f240f61d790968b74e2650d8a0db880d` |
| `assets/b.html` | `ada968a270bb36bf868a5de2749542189fa8a71d9631bff16cf1c2d67fd62911` |
| `assets/harness.js` | `4a06a1bbf8efd24981ea798c14bfcaf7d7f227ea2d8fb79232ba7339df26b111` |
| `assets/icon.png` | `08c9a2e7e6afe1867b9111784a0c54daf897a5076bcf02af41bfed54fb93e9e1` |

Frozen binary identities remain distinct and untouched: submitted Round03 `0610dfc964e1e96feee34f443ffae256f38dcf2c1d2965eabe9c5022b45d655f`; Review Lead C1-RUN-01 build `3f0fc8eeee85252c83bbe1f96442f85f5cd9c7a8c15a3983c999f5e31bb6cd0c`.

## Final offline preparation gates

All commands ran from the harness root with `TAURI_CONFIG` explicitly removed and Cargo output confined to `target-harness`.

- `cargo fmt --all -- --check`: PASS, empty output.
- `env -u TAURI_CONFIG cargo check --offline --target-dir target-harness`: PASS, `Finished dev profile ... in 0.95s`.
- `env -u TAURI_CONFIG cargo clippy --offline --all-targets --target-dir target-harness -- -D warnings`: PASS, `Finished dev profile ... in 1.01s`.
- `env -u TAURI_CONFIG cargo test --offline --target-dir target-harness`: PASS. Library `28 passed; 0 failed; 0 ignored`; binary config `1 passed; 0 failed; 0 ignored`; doc tests `0`. Total: 29 pure tests, retaining all 27 Round03 tests.
- `env -u TAURI_CONFIG cargo build --offline --target-dir target-harness`: PASS, `Finished dev profile ... in 1.39s`.
- Frozen-source comparison: only `src/driver.rs` differs.
- Candidate status: clean at `6e12a73783c7119dae9b6add947e1b5085abe003`.

The newly compiled and deliberately unexecuted corrected binary is `target-harness/debug/color-tool-c1-harness`: Mach-O 64-bit arm64, 25,958,728 bytes, SHA256 `ac5a275f1b2ed5c0f42e5801f7522d12aad1da375346b909aa6d9e9902527688`.

This is a fresh build identity. It is not claimed byte-identical to any submitted or independently rebuilt predecessor.

## Remaining limits and stop state

The pure tests establish the causal receiver-lifetime correction and durable handoff invariants. They do not establish the outcome of a second macOS run. C1-RUN-01 remains FAILED, exit 1, with no terminal success row; its authorization is spent. No runtime ledger, WKWebView scheduling result beyond that preserved failed run, cross-platform behavior, production integration, whole-protocol result, C1-C3 acceptance, or 193-B authorization is newly claimed.

Review Lead inspection remains the next gate before any distinct C1-RUN-02 authorization. No owner decision is requested. Stop after sending this report path/hash; do not poll.
