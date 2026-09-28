# B1 Round 01 — AMEND before live acquisition

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.27.
**AMEND C1–C8 below. One consolidated correction pass; no app build/launch/capture or owner decision.**

Submission SHA-256 fb177145309b51fb411110550092ae2d248d9787481bde317de2c32a876768a8.
Candidate HEAD remains 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. All eighteen submitted hashes independently match; all sixteen A1 files independently remain byte-identical to their accepted versions.

Lead froze the eighteen B1 source files at:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/b1-review-round01.TxexcE/source.tar
Archive SHA-256 48c05031e2f6733efa96205071a573f172a3fac5a0047ec16852f31fcaf9affd. Line references below refer to this submission. Preserve it and every prior report.

## Gates reproduced, not sufficient for acceptance

Node 68/68; Vitest 24 files / 262 tests; Svelte 0 errors / two accepted warnings; lint/format; Rust fmt/offline clippy; workspace 59/59 and scalar snapshot 1/1 all pass independently. No app run or performance proof follows. Read-only native/importer reviewers and lead found the following missing integration/lifecycle cases.

## C1 [P1] Use the actual native wire format end to end

profiling.rs:185–192 serializes both optional target arms without omission attributes. A numeric input writes targetBoolean:null; the importer at import-trace-run.mjs:511–534 requires the inactive arm absent and equal to the delivered-input data. Boolean and invalid inputs have the symmetric problem.

Lead reproduced the adapter rejection INVALID_INPUT_OBSERVATION using the native serde-shaped numeric input. This is source-confirmed native serialization plus an executed importer probe, not a captured app artifact. Choose one canonical shape across renderer, native and schema/adapter. Require a production-native-writer/serializer→real Node importer interoperability test covering numeric, boolean and invalid input plus float spelling/byte-count receipts. Hand-authored JS-only fixtures do not establish the cross-language contract.

## C2 [P1] Preserve result association through real Svelte proxies

HomeView.svelte:125–129 stores displayResult and acceptedProfileResult in deep $state. The accepted context is Object.freeze'd in trace.ts, retaining its raw nested result; displayResult becomes a reactive proxy. The equality guards at HomeView:296 and :664 therefore fail even for the same successful response.

Lead compiled and executed a minimal equivalent with the installed Svelte 5.39.6 client compiler/runtime, not rune shims: displayIsRaw=false, acceptedIsRaw=true, renderGuard=false. The result never reaches figure/DOM coordination through this path.

Repair observational identity without mutating the response/cache or substituting a digest for actual association. Explicitly justify any raw-state or observer-owned association adaptation and prove existing display behavior unchanged. Add a real compiled-Svelte/client-runtime regression; the current identity-function rune shim cannot cover this. No installed runtime/dependency change.

## C3 [P1] Keep observation ownership through DOM/RAF completion

analysis-runner.svelte.ts:257–258 clears runningProfileAction after native/store completion. Home onDestroy only calls runner.cancelPending. Once the DOM/RAF phase starts, that cancellation no longer owns the action.

Lead exercised the actual transpiled runner and collector with injected compute/store/timer seams: after accepted store result, start DOM coordination, then runner.cancelPending('view-unmounted'); getOutcome remained null, and the two subsequent frame callbacks produced completed. This is an executed deterministic lifecycle counterexample, not a real window close.

Home/coordinator must revoke its active observation on unmount and source/settings/result replacement throughout the post-store phase, cancel pending RAFs/listeners and prohibit late completion. Do not rely solely on running compute ownership. Recheck mounted-root/actual expected SVG presence at the appropriate endpoint; current DOM callback counts tagged containers only (Home:693–704), not their SVG roots. Tests must cover unmount after store, after tick and between RAFs, plus empty tagged containers and replacement. Native late return stays span evidence, not a reopened action.

## C4 [P1] Validate underlying stage evidence, not only asserted flags

import-trace-run.mjs:896–927 trusts all-true outcome association checks and a subset of endpoint pairs. Lead independently repeated the adapter reviewer's mutation of a valid bound trace: remove every figure_generated, renderer_response_parsed and raf1 event, set renderer_native_issue.data.pathMatches=false, preserve outcome flags, and recompute actual byte/event counts and binding digest. Import still returns completed with exclusionReason:null and numeric endpoints.

Validate selected-action event order/multiplicity, native success, parse/store evidence, resolved/admitted request, enabled figure set, DOM/RAF chain and consistency with outcome flags/measurements. Missing or contradictory evidence rejects eligible import or becomes explicit unverified diagnostic output. This is evidence coherence, not a claim to independently prove pixels or numerical correctness. Add true contradiction and omitted-stage vectors, not only a false outcome flag fixture.

## C5 [P1] Require positive whole-session completion and derive all loss

Native profiling.rs:794–799 drops the file handle after write_all failure; record_loss at :815 cannot then persist its marker. A clean action A prefix followed by a zero-byte first write failure for action B leaves no on-disk witness of session loss. Current importer does not require a final session seal, so the prefix can look complete. This sequence is source-confirmed; add an injected zero-byte-after-success writer regression.

Require explicit finalization: stop accepting new observational actions, resolve/refuse finalization while admitted native/actions remain open, and append one final session seal with consistent sequence/event/byte/drop totals. Eligible import requires that seal as the last complete record and validates it against all records. Missing/failed seal means unverified; per-action close alone is not whole-session completeness. Explicit profile-session finalization commands/API may be added within the already authorized profiling bridge/module/main files; they manage observation only, never simulate study input. Actual live use remains later.

Also fix independent importer global-taint gap at :758–791/:887–895. In a two-action trace with the first selected, lead set the nonselected action's close.droppedEventCount=1 while sessionTainted=false; import still returned eligible completed. Inspect every batch/close/loss/seal for loss and contradictory receipts, not only selected actions or caller flags. Session loss taints all selected actions per V4. Preserve immutable observed outcomes, separate persistence and late-native-span semantics.

## C6 [P2] Enforce the advertised native event budget

Native MAX_ARTIFACT_EVENTS=8192 is charged once per JSONL record (profiling.rs:754–762/:801), while a renderer batch contains up to128 events. Sixty-five permitted 128-event batches contain8320 renderer events but only131 header/batch/close records, below the present counters. Current collector's tighter limits mask this; the exposed native hard budget is still false.

Define and enforce actual nested event accounting, alongside record/action/byte limits and per-admitted-action closure reservations. Test batches at/over the exact limit, including cancellation/native return/seal capacity. No arithmetic overflow or event acceptance followed by missing reserved closure.

## C7 [P2] Make the disabled application path match its claim

Home always passes onAnalysisInput, so ParameterControls:45–59 still allocates the delivery object and calls performance.now while tracing is disabled. Home's three chart generators at :382/:395/:414 also call performance.now unconditionally, then check the trace afterward. The current disabled collector test does not exercise these real call sites.

Gate actual input/timing/figure observation before clocks and per-action objects, preserving normal bindings and chart laziness. Do not add persistent profiling listeners/buffers to disabled behavior. The one cached status bootstrap and additive store receipt remain the previously disclosed exceptions. Add call-site integration evidence rather than claiming the null collector alone proves disabled behavior. Observer exceptions must not escape into otherwise valid production input/results.

## C8 — Approved structural seams, not a blanket LOC waiver

The eighteen-file boundary was a control boundary, not a requirement to keep wire validation, persistence, state orchestration, projection and tests in single files. The submitted 1214-line importer, 1577-line native module and 899-line renderer collector contain independently owned domains; authorize these exact additional paths:

Native, under tauri-app/src-tauri/src/:

- profiling_wire.rs — DTOs/enums/constants.
- profiling_validation.rs — strict batch/event/config/outcome validation.
- profiling_writer.rs — private bounded persistence/reservations/seal.
- profiling_tests.rs — native lifecycle/writer/interop regression tests.

Renderer, under tauri-app/src/lib/profiling/:

- trace-types.ts — observational contexts/state interfaces, sharing bridge wire types.
- trace-config.ts — pure resolved config/request construction.
- trace-dom.ts — render association/DOM/RAF lifecycle.
- trace-fixtures.ts — test-only synthetic fixtures/harness.
- trace-dom.spec.ts — DOM/RAF and result-association tests.

Home:

- tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts — observer-owned Home integration/lifecycle, leaving shipping view wiring thin.
- tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts — real compiled-Svelte identity/lifecycle regression.

Node, under tauri-app/scripts/profiling/:

- trace-wire.mjs — raw-record/config/event structural validation.
- trace-binding.mjs — acquisition binding and manifest/config/frame identities.
- trace-integrity.mjs — whole-session/action event/persistence integrity.
- trace-to-run.mjs — pure validated-evidence to A1 projection.
- trace-fixtures.mjs — test-only shared synthetic fixtures.
- profiling-trace-binding.test.mjs — binding/selection/accounting vectors.
- profiling-trace-integrity.test.mjs — lifecycle/receipt/loss vectors.
- profiling-native-wire.test.mjs — production-native serialization/import proof.

These nineteen additions are permissions, not mandatory empty scaffolding. Use existing B1 facades for stable imports/CLIs; do not move production rules into test modules, duplicate them, or import test fixtures from production. Standard formatted JSON schema length is not itself a design defect; retain it coherent and report its actual gate treatment. Do not minify or automatically apply a LOC bypass. Report remaining substantive size exceptions and reasons.

## Correction fence, gates and submission

The original eighteen B1 paths plus the nineteen named additions above are the entire source fence. Sixteen A1 files and every other existing file remain unchanged. Native interop tests may generate synthetic files in exact test-owned temporary directories and clean only those paths. No permanent owner media or unapproved runtime/dependency/tool configuration.

Add regressions first for C1–C7, then implement and split by the named seams. Run all B1/full Node/Vitest/Svelte/lint/format/Rust/scalar gates; preserve A1 hashes and deterministic app/chart results. Record cross-language and real-Svelte proof separately from still-unrun live app/DOM/platform gates. Node20 and Windows remain unrun unless already installed; no downloads.

Write only the new planning report profiling-b1-round-02-submission.md in this review directory. Include per-C dispositions, exact files/hashes, gate counts, schema/CLI/finalization protocol changes, truthful size exceptions and candid friction. Correct the previous report's phrase roughly four-second interaction: historical ~4000 ms was displayed kernel time, not a measured full interaction. Preserve the original report unchanged.

Candidate remains uncommitted; no app build/launch/capture, optimization, core/video/other-view/cache policy, Git operations or ticket completion. Notify lead and stop without polling. This is a technical correction assignment, not an owner blocker.
