# AI-IMP-202 B4 finalization review verdict

Review Lead -> Code Lead, 2026-09-05. PROJECT-RECORD rev 0.33 §10.12.

**ACCEPT the source-review basis with binding F1–F5 below.** Implementation is authorized only by profiling-b5-finalization-implementation-brief.md. This is not implemented/operator/runtime acceptance.

Report SHA-256: 3a12aa163b1b7c9c06cc8fcae8ac860ac79444f5bc603fb380f87fcbfb3267dc. Lead rechecked HEAD8bf3187, branch,53 status paths and53/53 accepted source hashes. Read-only review made no app/runtime/source changes or test claims.

Lead independently inspected bridge status/append, collector terminal/flush/singleton, coordinator input supersession, native writer admission/seal and wire receipts, persistent App header and existing test harness. The proposed native command shape is correct; no native/capability change is presently justified. Existing receipt semantics do not establish numerical correctness, physical presentation or cross-renderer completeness.

## F1 — Local drain is exact, sticky and ordered

Quiesce before the collector's supersession loop, counters, clock/ID allocation or new observation. Existing actions keep their ordinary lifecycle; subsequent production inputs may legitimately supersede them through existing coordinator/runner behavior. Do not alter that production behavior or fabricate terminal outcomes.

Serialize actual append IPC in assigned batch order. Retain each immutable action outcome and its own persistence result. Queue progress after an error cannot erase failure. Before native finalize, check all known actions terminal, all persistence promises present and successful, and collector sessionDroppedEvents zero. Recheck after asynchronous drain. Empty queue alone is not proof.

Read-only reviewer found no additional current-lifetime capacity counterexample: the existing64th-action loss sentinel should already taint native receipts. The explicit session counter guard prevents dependence on that indirect witness and protects no-action refusals. Post-quiesce intentional non-admission is not evidence loss.

## F2 — Native sealing and usable measurement are distinct

Validate exact session, safe integral counts, boolean sealed and coherent error/open-count combinations. Only coherent renderer-open or native profiling-actions-open states allow manual retry; failures stay terminal and double-clicks share one in-flight operation.

A native file can seal with droppedEventCount>0. Preserve that receipt but present loss/failure, not a clean local finish. For a clean local finish require zero drops, no open actions, no error and lastBatchSequence equal to the locally drained sequence. An unexpected existing-session sequence is continuity-unverified, not a reason to renumber/rebase batches.

Even a clean local seal is not importer eligibility. UI success wording is **Trace sealed · validation pending**, never “complete measurement”, “correct”, or “eligible”. A sealed receipt with loss may say **Trace sealed with loss · not usable**. No importer or schema changes in this slice.

## F3 — Single renderer lifetime only; no reload recovery

Narrow the report's reload/idempotence statement. Source-confirmed counterexample: renderer-only append failure before native admission is lost on renderer reload; a replacement collector can have an empty drain while native still has an apparently clean prefix. Cached enabled status alone proves no continuity.

First acquisition requires independently established uninterrupted renderer ownership within one newly identified native process/session. Any renderer reload/crash/replacement or unknown continuity invalidates that run, regardless of a positive native seal; preserve the partial evidence and use a separately authorized new process/session rather than resume. This is an explicit acquisition exclusion, not a claim that B5 automatically detects every renderer replacement.

No reload-resumption mechanism, durable renderer marker, native claim/status extension or recovery claim is authorized here. Same-instance repeated Finish may reuse its cached receipt. A native idempotent receipt after replacement is at most a native artifact fact, never proof of complete lost renderer history. Future eligible acquisition must carry independent continuity evidence; B5 alone does not close that gate.

## F4 — Profiling-only persistent header control

Approve the App header outside the view switch. Use a small dedicated component, hidden after disabled/rejected initialization, sharing the existing single cached bootstrap. Default text **Profiling launch enabled**; action **Finish capture**. Pending states disclose renderer versus native count and **Retry finish**; no automatic polling. Keep status accessible and compact, preserve navigation/library access, and contain styles within the component/App integration. No ordinary-launch layout slot or new setting.

Safe fixed error codes only; do not render arbitrary exception strings that may contain paths. A compact disclosure may expose validated session/count/receipt fields, never a guessed output path. Packaged invocation and visual reflow remain later real-build gates, not source-confirmed tests.

## F5 — Narrow implementation and preservation

Approve the report's four production files plus existing trace-types.ts for typed state/dependency injection, and five tests plus existing trace-fixtures.ts for queue-aware test plumbing: eleven exact permitted paths, two new. No cohesion-unrelated refactoring. Existing synchronous assertion timing may need explicit awaits, not weakened expectations.

Preserve all other A1/B1 files and the immutable B2 source archive/bundle/runtime carrier. No native, numeric, runner, coordinator, config/dependency, importer, build/app/capture or Git mutation. B5 brief carries exact files/gates and the stop point.
