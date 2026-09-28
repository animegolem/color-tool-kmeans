# B0 verdict / B1 implementation — one observed Colors interaction

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.26.
**Accept B0 as the implementation basis with the binding rulings below. Implement the 18-file vertical slice; do not build or launch an app yet.**

Preserved B0 report SHA-256: 904b00925231b5c466779f38199725bdab2c540cf55885303e0c571e51625ab0.
Read it with this brief; where they differ, this brief governs. No further general review is requested.

## Carrier and exact file fence

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01; branch codex/correctness-wave-01-2026-09-05; HEAD 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2.
The sixteen accepted untracked A1 files already exist. Preserve their exact bytes; do not reset or stage them. Capture their initial hashes and recheck at submission.

Only these eighteen files are authorized:

1. tauri-app/scripts/profiling/schema/trace-record.schema.json (new)
2. tauri-app/scripts/profiling/import-trace-run.mjs (new)
3. tauri-app/scripts/profiling/profiling-trace.test.mjs (new)
4. tauri-app/src/lib/profiling/trace.ts (new)
5. tauri-app/src/lib/profiling/trace.spec.ts (new)
6. tauri-app/src/lib/bridges/profiling.ts (new)
7. tauri-app/src-tauri/src/profiling.rs (new, including native unit tests)
8. tauri-app/src-tauri/src/main.rs
9. tauri-app/src-tauri/src/commands.rs
10. tauri-app/src/lib/bridges/compute.ts
11. tauri-app/src/lib/compute/bridge.ts
12. tauri-app/src/lib/stores/analysis.ts
13. tauri-app/src/lib/stores/analysis.spec.ts (new)
14. tauri-app/src/lib/views/home/analysis-runner.svelte.ts
15. tauri-app/src/lib/views/home/ParameterControls.svelte
16. tauri-app/src/lib/views/HomeView.svelte
17. tauri-app/src/lib/views/home/AnalysisCards.svelte
18. tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts (new)

One planning output: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b1-submission.md.

No color-core, numeric request/response types, chart generators, video/FFmpeg controllers, image/cache policy, other views, App.svelte, configuration, manifests, dependencies, lockfiles, fixtures, CI, A1 files or independent performance/live-video changes. No installs, app control, app bundles, traces, media/preferences inspection, owner-workload control, Git mutations, commit, merge or issue completion. Test compilation and the gates below are authorized; native launch/capture and symbols remain a later assignment. Stop on a genuine file/interface conflict rather than widening scope.

## V1 — Scope and honest endpoints

Observe real analysis-affecting Colors parameter input, beginning with the clusters numeric control, through the existing debounce/request path, one native aggregate, actual store acceptance, enabled figure generation, checked DOM and visible RAF2.

Use associated_result_dom_raf2_approx, not ready_correct or presented_correct. This establishes fresh response association and an observed DOM/RAF sequence, not physical presentation, exact decoded-frame identity or a numerical oracle. Keep run_kmeans_ms separate from native_analyze_aggregate_ms and renderer durations. No core substage instrumentation.

Source-verified by lead: the 400 ms debounce, two token guards, setter's current void return, global active-path read after compute/bridge's await, cache-by-image-ID restore and separate lazy chart derivations. Installed Tauri 2.11.5 command deserializer explicitly maps a missing JSON Option argument to None (ipc/command.rs:134–143); exercise missing optional context rather than assuming a numeric request change is needed.

## V2 — Delivered action is not a reactive scheduling call

An input handler timestamps browser delivery and records the allowlisted control's actual target value. Do not assume the Svelte-bound params store is already updated inside that handler: preserve bind:value/bind:checked semantics, then match the resolved scheduled snapshot to the observed target. Invalid/empty transient numeric input becomes explicit unverified/superseded evidence; never invent a finite replacement or change validation policy.

Only a new delivered action creates an action. Home's status updates can rerun scheduleAnalysisWith for the same action/key during pending/ready. That internal duplicate call must not terminalize the already admitted action as deduped. Distinguish an unadmitted same-key user action from repeated scheduling of the active action; test both. A changed input supersedes the older observation, without changing when existing compute cancellation actually happens.

Observe existing semantic keys; do not introduce a second controlling key or modify debounce, spinner, scrolling, scheduling, cache or numerical policy. Call sites without observation context remain behaviorally equivalent. Cache restoration cannot prove current parameters and remains cache/unverified.

## V3 — Acceptance and render joins

Return a small additive acceptance/rejection receipt from success/error store setters after their existing token checks. Preserve every state/cache write and ordering, optional-token legacy behavior and runner side effects. The observation advances only on an accepted receipt; a legacy callback with no receipt cannot be treated as proof.

Capture the compute bridge's actual path once; compare against expected source privately but do not replace it with the observation's expected path. Compare normalized native request fields to the admitted snapshot. Path equality is not content-hash verification.

Keep result-object/action association in observational storage. Do not mutate AnalysisResult, SVG content, export bytes or cache entries. Avoid reactive writes from chart $derived callbacks that alter dependency tracking or force previously lazy/disabled figures to generate. Timing hooks must observe existing work.

Join the currently enabled figure set using action/result tags on the actual chart containers. Home uses two AnalysisCards instances; the DOM predicate must be scoped to this mounted study, not global selectors or old zoom overlays. Recheck source, settings, result reference, generation and visibility after tick and at both RAF callbacks. Settings/source/result changes revoke the observation without new production cancellation. Test all eight figure enablement combinations. With zero enabled figures, record unavailable/unverified no-enabled-figures, not a vacuous successful visible-result endpoint.

## V4 — One outcome, separate persistence receipt

Separate an immutable observed action outcome/endpoint from evidence persistence. A batch-write failure discovered after RAF2 must not append a second contradictory action terminal.

Use a native batch/close receipt identifying the session, batch sequence and accepted/dropped counts. A successful receipt means complete bytes written to the artifact, not power-loss durability; no fsync claim. The importer derives one A1 terminal from the observed outcome plus complete receive/return, drop and persistence evidence. Missing/failed/truncated close evidence makes the run unverified, never eligible completed.

Reserve event AND byte closure capacity for every admitted observational action, not one slot for the whole session. Bound active actions, total actions/events, individual event/batch bytes and artifact bytes using explicit documented constants and tests. Refuse further observation with drop counts at capacity, never refuse ordinary analysis. For v1, any session-level loss/failed write taints all imported actions from that session; conservative taint is preferable to an unsupported per-action loss attribution.

Late native return after cancellation remains span evidence; it never reopens the action. Missing exits/abrupt process termination stay partial. Do not claim that terminal-only renderer flushing recovers inputs lost in a crash before delivery to native. Observation failure must not throw through or change a valid production result, application startup or normal controls.

## V5 — Explicit provenance binding and multi-case import

Runtime path equality and ephemeral IDs do not bind a trace to arbitrary externally supplied build/source manifests. The adapter requires an explicit private acquisition/binding record, represented as a strict definition within trace-record.schema.json and validated in import-trace-run.mjs. It binds:

- exact raw trace-file SHA-256 and native session ID;
- exact build-manifest file SHA-256 and its executable digest;
- exact case-manifest file SHA-256, source digest, frame claims and canonical config digest;
- explicitly selected action IDs and acquisition verification/evidence status.

This binding is produced/verified during a later controlled acquisition, not fabricated by the runtime or adapter. Preserve caller-asserted/unverified status; structural validation and matching digests do not independently prove the operator's executable/source assertion. Missing/mismatched binding rejects eligible import; an explicitly requested diagnostic import may retain it as unverified/excluded. No raw media hashing in the measured interval or invented native SHA implementation/dependency.

One A1 run has one caseRef. Default import requires every selected action to match that exact resolved case configuration. Mixed-config traces require explicit per-case action selection with an accounting receipt identifying selected/nonselected counts and namespace-redacted IDs; retain the full raw trace and reference it. Do not stamp K81 and K82 actions with the same case, silently discard others, or infer cases from nearby timestamps. Repeated explicit imports with different supplied cases may cover one retained trace.

Native session identity, trace-file bytes, manifest-file bytes and canonical configuration digests are distinct fields. Reject wrong-trace, wrong-build, wrong-case, mismatched settings/frame and duplicate/unknown action selection vectors. This protocol is external acquisition evidence, not new production source authority.

## V6 — A1 mapping and clocks

Finalize fresh execution only from correlated native receive/return evidence, never from a renderer promise alone. IDs include session/process-clock identity; same action ID does not permit renderer-minus-native subtraction.

RAF2 and every instrumented endpoint map to method instrument-span / evidenceLevel instrumentation with actual instrumentation references. Successful A1 terminal reasonCode is null; the approximate endpoint label remains endpoint/raw evidence. Noncompleted/stale/cancelled/failed/unverified outcomes carry unavailable numeric measurements under the existing A1 rules; retain partial numeric spans only in raw evidence. Use existing A1 exclusion/unavailable enums; do not weaken its schema or promote RAF2 to presented-observation.

The eight endpoint meanings in B0 are accepted, each measured within its own clock. Clock anchors/handshake uncertainty may be recorded, never used to invent a cross-clock duration. Missing stages are unavailable, not zero.

## V7 — Opt-in, output safety and overhead boundaries

Use explicit launch-time opt-in with a strictly validated session identifier, never a caller-controlled output path. One cached native status handshake per renderer lifetime is an explicit exception to disabled zero-IPC wording. Before/after that bootstrap, disabled per-action instrumentation creates no IDs, buffers, listeners, timers, RAFs or batches; disabled native startup creates no artifact/writer. Record the handshake as startup cost, not zero overhead.

Native output is a unique exclusive file under a private profile-specific subdirectory of the isolated app cache, not media roots. Use restrictive permissions where supported, no traversal/symlink overwrite, explicit hard event/byte bounds and stable errors. Do not prune user files or older captures. Validate renderer input batch structure/count/byte limits before admitting it. Session context is observational and cannot choose arbitrary file destinations.

Capture native aggregate end timestamp before observer write/flush work, and label any outside-span overhead as unmeasured rather than calling it free. Batch renderer flush after the observed endpoint. An optional post-endpoint fingerprint must exclude durationMs and other explicitly volatile observation fields, preserve actual numeric output, and never delay the measured endpoint. No numerical shortcuts.

No performance improvement or overhead verdict follows from synthetic tests. Later live on/off pairs use the same identified executable and case, output parity first; release build, actual UI/DOM proof, process attribution, symbols, exact video control and hardware presentation remain open.

## Validation and submission

Implement dependency-first within this sitting; bounded subagents may own disjoint authorized files if useful. No delegate commits. Report initial/final boundaries and any friction promptly; do not silently change decisions.

Required targeted tests: V2 binding target/resolved snapshot and repeated reactive schedule; same-key user dedup; rapid supersession; accepted/stale store receipt and legacy callers; wrong actual path/settings; invoke/parse errors; hidden/unmount/replacement between tick/RAFs; all figure combinations; dropped/truncated/failed persistence; late native events; optional missing context; disabled behavior; strict adapter binding/multi-case selection and exact A1 mapping. Keep existing audit and deterministic chart fixtures unchanged. Use current rune shims; pure tests do not establish a live mounted DOM pass.

From tauri-app:

- node --test scripts/profiling/*.test.mjs (all accepted A1 tests plus the new trace tests)
- npm run test -- --run
- npm run check
- npm run lint
- npm run format:check

From tauri-app/src-tauri:

- cargo fmt --all -- --check
- cargo clippy --workspace --offline -- -D warnings
- cargo test --workspace --offline
- cargo test -p color-core --no-default-features --test kmeans_snapshots --offline

Use installed tools/dependencies only; Node 20/Windows remain explicit unrun gates unless already available. Do not alter existing tests merely to erase a failure. No automatic LOC bypass or minification; report genuine cohesion/fence concerns.

Submit profiling-b1-submission.md with exact changed/new files and hashes, gate counts, contract examples, opt-in/CLI usage, known incomplete live/platform proofs and candid failed approaches. A1 baseline is 54 Node, 222 Vitest across 21 files, 50 Rust workspace and 1 scalar snapshot. Notify lead and stop at review without polling. No owner attention bell is warranted for routine review.
