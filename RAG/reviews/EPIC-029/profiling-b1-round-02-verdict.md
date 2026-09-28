# B1 Round 02 — focused AMEND before test build

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.28.
**AMEND D1–D4 below. Preserve the corrected C1–C8 work; no new general audit, app build, launch or capture in this sitting.**

## Carrier and independent review receipt

Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
Branch codex/correctness-wave-01-2026-09-05; HEAD 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2, uncommitted.
Round 02 report SHA-256 fccd7e5183c23853ea3cf128749c0ffcdea2c3f424f8a23557aa8cd2047f9967.

Lead independently verified all 37 submitted file hashes, all sixteen accepted A1 files, and the exact 53-path worktree status. Source snapshot:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/b1-review-round02.3JhAyB/source.tar
SHA-256 ef544ed597bb5daf110d7cc9f0f2083140ea293daeef28c9e2cde290fbda362f.
This archive contains all 37 B1 paths relative to the candidate root. Preserve it and both prior submissions/verdicts.

Lead reran: Node 72/72 including production Rust writer→Node importer; Vitest 276/26 files; Svelte 0 errors/two accepted warnings; lint/format; Rust fmt/offline clippy; workspace 64 passed/one intentionally ignored native emitter, explicitly exercised by Node; scalar snapshot 1/1. All pass.

Canonical optional-arm serialization, raw result identity, Home-owned post-store cancellation, SVG-root checks, stronger stage validation, explicit seals, nested-event charging and disabled clock gates are present. Cohesive C8 extractions are retained; remaining LOC exceptions do not justify minification or another split round. This is not aggregate B1 acceptance: four concrete integration/admission defects remain. Node20/Windows and real mounted-app, symbols, parity/overhead and performance gates remain unrun.

## D1 [P1] Permit actual same-action repeats after admission

trace-integrity.mjs:129–137 constrains every schedule observation to the resolved-to-admitted window. That contradicts original brief V2: Home status pending/ready legitimately reruns scheduling for the already bound/admitted action.

Lead independently bundled the actual RendererProfileTrace in memory with installed esbuild. resolve→bound→admit→resolve→observeSchedule(same-key,true) emits disposition repeated. Transferring that actual emitted event to an otherwise valid trace, with recomputed close byte/count, seal and binding, changes importer output from completed/exclusion null to unverified/result-association-unverified. There is no duplicate input_resolved; that guard is already correct.

Require exactly one initial bound schedule after resolution and before admission. Genuine repeated observations may occur after that binding throughout the still-open action, including pending, store/ready and render phases before its terminal outcome. Preserve primary-stage order, strict identity/config checks, immutable terminals and rejection of a second bound schedule or a repeat before binding/after terminal. Do not suppress legitimate runtime evidence or alter production scheduling merely to fit the importer.

Add runtime-faithful positive collector→importer coverage for pending/ready repeats, not just a hand-authored theoretical order. Replace the current blanket negative repeat-after-admission test with those positives and precise invalid-order negatives.

## D2 [P1] Make successful sealing irreversible

Native reviewer executed unchanged production ProfileState/Writer/validation with cached dependencies; lead inspected the implicated paths. profiling_writer.rs:78–92 accepts existing actions before its admission guard. A cancelled renderer-only action may close, the session seals, then its first native invocation reserves and writes receive/return records after the final seal. Repeated finalize returns the cached old receipt.

Executed values: first_sealed=true, native_admitted=true, artifact bytes 2560→3192, repeated sealed=true with artifactByteCount still 2560.

No record, reservation, sequence/counter or loss mutation may alter an already successfully sealed session. Reject/no-op post-seal observer operations safely even for previously known IDs, without refusing or changing ordinary analysis. Preserve the distinct supported case: a native span admitted before finalization can return late, and finalization must wait for that reservation before sealing. Also test delayed first receive for a previously closed action, post-seal batch/loss paths, unchanged exact bytes/counters and idempotent truthful receipts.

## D3 [P1] Account pre-finalization admission refusal as loss

profiling.rs:210 propagates reserve_action failure before durable loss accounting. Native reviewer submitted 128 valid closed renderer-only actions, then a valid action 129 with the next batch sequence BEFORE finalization.

Executed values: refusal=profiling-action-capacity, sealed=true, dropped=0, loss_records=0.

A valid in-session observation refused before the explicit finalization boundary must produce safe session-level loss, or make the session unsealable if that loss cannot be persisted. Apply this to action/closure/event/record/byte-capacity and conflicting-observation admission failures as appropriate. Do not invent an admitted action or sequence receipt for refused evidence. Keep deliberate new-action rejection after finalization distinct from a silently lost pre-finalization observation. Importing the retained session must not yield any eligible action after such loss.

Test exact real native capacity/refusal/finalization behavior and native→importer taint or unavailable outcome, not only direct writer counters.

## D4 [P2] Do not persist rejected identifiers

validate_batch detects malformed action/clock/image IDs, but deferred error handling in profiling.rs:199–210 still reserves the action and includes its unvalidated ID in the rejected ActionCloseRecord at :276–281.

A synthetic actionId shaped as /private/source-name-secret.mov produced outcome_accepted=false, closed=true and the literal invalid value in the private native artifact. This is a synthetic invalid-input counterexample, not a discovered owner-data disclosure or network leak.

Validate bounded allowlisted identity fields before reservation or identity-bearing persistence/receipts. Retain loss evidence using safe session-level constants/codes; never echo rejected arbitrary strings or allocate unbounded invalid identities. Preserve the accepted distinction that an otherwise valid identified action with an invalid batch payload may close as tainted diagnostic evidence. Cover malformed and oversized identity fields plus valid-ID invalid-payload behavior.

## Exact correction fence and submission

Only these existing B1 paths may change, all relative to the candidate root:

- tauri-app/scripts/profiling/trace-integrity.mjs
- tauri-app/scripts/profiling/trace-fixtures.mjs
- tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs
- tauri-app/scripts/profiling/profiling-native-wire.test.mjs
- tauri-app/src-tauri/src/profiling.rs
- tauri-app/src-tauri/src/profiling_writer.rs
- tauri-app/src-tauri/src/profiling_validation.rs
- tauri-app/src-tauri/src/profiling_tests.rs

These are permissions, not a requirement to touch all eight. Other 29 B1 files and all sixteen accepted A1 files stay byte-identical. If an actual interface/test seam requires another path, stop and request a specific addition. No new modules/dependencies/configuration, core/cache/video/other-view/IMP-178 changes, optimization, app build/launch/capture, owner-media interaction, Git mutation or issue completion.

Original profiling-b1-implementation-brief.md V1–V7 and Round 01 C1–C8 remain governing except the correction above. Keep all original acceptance tests; do not weaken valid negative integrity cases to obtain green counts. Add focused regressions first, fix, and rerun all full Node/Vitest/Svelte/lint/format/Rust/scalar gates from the original brief using installed dependencies. Bounded subagents may handle disjoint native/adapter work; integrate and self-review once.

Write only a new planning submission here: profiling-b1-round-03-submission.md. Include each D disposition, exact changed-file hashes and preservation checks, gate counts, actual producer→consumer proofs, truthful lifecycle/finalization contract and candid failed approaches. Preserve previous records. Notify this lead and stop at review without polling. No owner decision or attention bell is needed.

