# C1-RUN-01 — seven cases reached; finalization failed

Review Lead, 2026-09-07. Executed once under preparation verdict-round-03 SHA256 **29f67b2d62d036007b52db27ef54444ebaceb20fa50caffc0d56f6faff372128**. **Overall outcome: FAILED, exit1; no terminal success row.** The partial observations below are retained, not promoted to a completed accepted run.

## Exact execution and preserved identities

- Host: macOS26.6.2, build25G83, arm64.
- Executable: harness target-harness/debug/color-tool-c1-harness, SHA256 **3f0fc8eeee85252c83bbe1f96442f85f5cd9c7a8c15a3983c999f5e31bb6cd0c**, verified immediately before and after the one invocation.
- Driver: **12464052c290afb3a1d0388ab9beb474e49a9d4c171035d74fae8ff2735d656d**, unchanged; full14-file manifest remains preparation Round03. Source and exact executed binary are preserved in color-tool-c1-harness-review-r3.SEO7C2 (binary suffix r3-lead-build); distinct submitted0610dfc9 also preserved.
- Command: the exact env -u TAURI_CONFIG command in verdict-round-03, using the nonexistent direct child **/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness.zvftHz/run-20260907-first-reviewed**. The binary created the output directory/ledger; no reuse or precreation.
- Prelaunch UTC timestamp:2026-09-07T13:22:08Z. The next timestamped post-exit check was13:22:48Z; this is an observation interval, not a claimed40-second runtime. Ledger's final monotonic offset is7,499,445,333ns (about7.499s).
- Exact process tool outcome: exit code1. Only emitted stderr/stdout text:

```text
successful exit finalization failed: trace failure prevents clean harness acceptance
```

No external kill, app control, retry, runtime patch, source edit or production launch occurred. Post-exit process check found no harness process; candidate remains clean6e12a73. Production app/data were not placed in scope.

## Ledger integrity and bounded observations

Preserved ledger: **run-20260907-first-reviewed/ledger.jsonl**, SHA256 **bf09f57400e64a4bf39f1995a209db5d6507d3a40dc2cd6795ca779facd1bec5**. All481 JSONL rows parse; sequence is exactly1..481, timestamps monotonic. There are7 case-started and7 ordered case-completed rows but **0 harness-completed rows**. No ledger invalid/failure event is present; finalization failure is in process stderr.

| Case | Completion row | Bounded observed evidence |
| --- | --- | --- |
| 1 |37| Initial native generation1, exact-original duplicate recovery, same-URL reload generation2; old request rejected. |
| 2 |65| A held at actual native receipt, B admitted, then explicitly released A rejected with unchanged registry counts; B survives. |
| 3 |133| Negative marker executed in the exact B at99 and changed null to from-A. Guarded marker at132 reports generation-rejected in the exact second B, leaving marker null and successor session intact. Both scripts were deliberately held before native dispatch. |
| 4 |160| Held challenge9 delivered after current10; page reports nonmonotone-generation-rejected. Separate synthetic old-request control rejected with unchanged ownership. |
| 5 |427|8 correlated timer-scheduled eval callbacks observed in their respective A documents;0 page-timer reports,8 missing after750ms bounds. These remain unknown/canceled/undelivered, not cancellation proof or guard success. |
| 6 |452| Actual CloseRequested430, Destroyed431, expected code-less exit prevented432; same-label successor established. Synthetic late Destroyed446 and Started448/Finished449 reject without changing successor. Injected page rows now carry forced/native-driver-injected-page-load/synthetic-injected-callback. |
| 7 |479| Actual CloseRequested455, Destroyed456, expected exit prevented457; another successor established. Old async native return rejects StaleIncarnation; ordinary callback not observed within750ms; explicit guarded page receipt477 rejects old session and preserves successor. |

Totals:3 native incarnations;28 actual Started and28 actual Finished plus one synthetic of each;28 diagnostic starts/readiness;66 native eval dispatch requests/acceptances;58 explicit JS execution reports;63 eval callback receipts. The3 absent eval callbacks are the first challenge of each incarnation (dispatch rows4,435,460); corresponding explicit JS execution/activation evidence exists. This is an observed callback-frequency limitation, not an inferred reason or universal delivery rule.

All4 rejected bootstrap rows35/63/158/450 retain equal before/after registry accounting. Three reject stale-generation, one stale-incarnation. There are26 admitted groups/442 test bytes/52 active leases at the end;27 validated bootstrap records include the one duplicate and create no duplicate ownership. This is intentionally retained in-memory test metadata, not disk reclamation.

## Finalization failure diagnosis

The decisive suffix is:

1. Row479: case7 completes.
2. Row480: the final explicit-receipt eval callback arrives and is logged.
3. Row481: explicit exit0 is requested with successFinalized=false.
4. Process prints the trace-failure rejection and actually exits1; no terminal success record.

Source at driver.rs:2668 onward owns EventInbox locally inside execute_cases and drops it when the seven cases return. The driver then queues exit0. The eval callback logs its receipt and calls send_event; driver.rs:327-333 sets trace_failed when the already-dropped receiver rejects that send. Finalization checks trace_failed before attempting the terminal append. No earlier invalid receipt, ledger-write error, panic, or timeout is logged, and case7 checked trace_failed before completion.

**Inference from exact suffix and source:** normal teardown disconnects the event receiver before the finalizer runs; the late, valid row480 callback then poisons success. This is a harness shutdown-lifetime defect, not an observed Color Tool ownership failure. A deterministic production-helper regression should establish the causal sequence before a fix. The failure gate worked honestly: this run must not be retroactively labeled successful.

## Disposition

Preserve this run and all previous artifacts unchanged. Preparation's27 pure tests remain valid bounded evidence but did not cover this shutdown interval. C1-RUN-01 authorization is spent; no second run is authorized by it.

Next narrow assignment is C1-H14 in correctness-wave-07-c1-harness-run-01-verdict.md: repair and pure-test only the consumer/finalization lifetime, then submit for a separate reviewed run. No changed protocol, cases, data retention, platform fork, production integration, universal C1 claim or owner decision.
