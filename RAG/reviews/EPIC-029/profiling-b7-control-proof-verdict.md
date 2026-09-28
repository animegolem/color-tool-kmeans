# AI-IMP-202 B7 control-proof verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev 0.36 §10.15.
Verdict: **bounded UI evidence accepted; trace/finalization proof FAILED; B8 focused repair review assigned.**

## Evidence and correction

Original submission profiling-b7-control-proof-submission.md remains immutable (SHA256 22c6abb2529a5fa07f38d31d009a52faac14e750a48e833de050ac944622c). Lead rechecked all30 final-artifact index payloads. The748-byte raw copy and exact native cache file still hash037e79faafcb58844fbcf463f8ba78d1e91e4bad51c124db47f75fae2c626770: one header and two batch-sequence losses, cumulative4 then8. No batches, action IDs, native action spans or seal exist. This is unusable for latency, correlation or performance acceptance.

Accept the retained bounded UI observations: exact still; K45 ->46 ->45 completed visibly; study retained into Values; profiling-only header persisted; one Finish reported renderer-persistence-failed and disabled itself. Geometry and usable capture remain unrun/failed respectively. Do not infer native correlation from visible analysis success.

The report's “No empty-field action was observed” describes sampled UI visibility only. Saved b6-event-log.final.txt lines42 and47 explicitly contain clusters=null immediately before each numeric replacement. Preserve the original report; this addendum corrects the interpretation, not its bytes.

At this review's read-only process check, ps -p43210 returned no row (exit1). Its former PID/start is historical, not currently verified alive. Cause/time of disappearance are unknown. Do not restart, reattach to a substitute, resume the session or change any runtime namespace. No lead process-control action occurred. Exact live trace bytes remain identical to retained evidence.

## Source-confirmed defect and limits

- ParameterControls.svelte binds numeric value into the shared store and observes delivered input separately.
- Current installed Svelte5.39.6 input binding writes empty input as null (bindings/input.js:28-31,278). An earlier delegated in-memory probe used undefined; both are nonfinite/non-number configurations, but undefined is NOT the currently inspected helper's literal behavior. Reproduce null with exact installed binding before asserting mounted ordering.
- profiling-coordinator.svelte.ts:81-83 returns current params unchanged for a null target. trace-config.ts copies clusters without validating its runtime type.
- trace.ts resolves/terminalizes invalid input but flush assigns ++batchSequence before production appendProfileBatch locally validates analysisConfig. The bridge rejects a null/undefined cluster before native IPC. Failure is sticky, but later batches have higher sequences while native still expects1.
- A read-only reviewer executed actual compiled coordinator/collector and production bridge validation using undefined invalid states: batches1/3 failed pre-IPC; with an explicitly injected already-scheduled production key, batches2/4 were four-event request-key-unchanged outcomes reaching IPC. That reproduces a mechanism consistent with losses4->8, NOT the actual rejected IDs/outcomes or mounted scheduling order.
- Native gap rejection and Finish's refusal to seal after renderer failure are correct fail-closed behavior. Do not weaken either.

The sequence-gap defect is established at the source boundary. The precise B7 action mapping and why its valid analyses yielded no native spans remain unresolved runtime attribution, not grounds to invent missing records.

## Binding repair direction

1. Invalid/empty input is an observation that must survive serialization as explicitly unavailable/unverified. Never invent finite config, silently drop the action, substitute a last-good config labelled current, or coerce empty input into zero.
2. A proposed schema arm must be narrow and explicit across producer, native validation, raw parser and importer. Completed/admitted actions still require a fully valid resolved configuration. Unsupported/contradictory arms must fail closed. Old immutable artifacts remain unchanged and their version semantics explicit.
3. Preserve monotonic sequence, sticky persistence failure, per-action accounting, quiesce and single-renderer-lifetime rules. No skip/rebase/reset/retry to hide rejected observations.
4. Preserve safe specific local failure reasons from an allowlist; never expose arbitrary exception strings/private values.
5. Regression must exercise actual installed numeric binding/order through coordinator and collector into the real bridge validator, not merely pass null target alongside valid fixture params. Investigate valid scheduling/correlation separately; production debounce/dedup/cache/request authority cannot be changed to make the trace appear complete.

B8 is a focused source/reproduction/schema review under profiling-b8-invalid-input-repair-brief.md, not another broad audit. No owner decision is pending. Lead owns the next implementation ruling immediately upon submission; source implementation and a fresh build/runtime proof remain explicit later steps.

