# AI-IMP-202 B9 invalid-input persistence implementation

Review Lead -> existing Code Lead, 2026-09-06. PROJECT-RECORD rev0.37 §10.16.

## Assignment and binding authority

Implement B8 verdict G1-G7, including its corrections to the proposal. This is bounded source/test implementation, not another review-only round. B8's report remains the source diagnosis; the verdict and this brief outrank it at conflicts.

Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
Branch codex/correctness-wave-01-2026-09-05; HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus56 prepared paths.
Plan: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan

Read AGENTS.md, CLAUDE.md, PROJECT-RECORD §§4/6/10.3/10.8/10.12/10.15/10.16 and profiling-b8-invalid-input-repair-verdict.md. Preserve all prior accepted behavior, numerical contracts and immutable evidence.

Baseline: sibling color-tool-profile-b6.fnWyNO/attempt-01/source-hashes.after.sha256 and accepted-b5-dirty56-source.tar SHA2566ef4ad8b22384f3a4735fac981def4f2c975914318ac6da0ad1c352220ee8e1f. Verify56 before; report exact changed subset, new files and unchanged remainder after.

## Exact files to touch

Production (12):

1. tauri-app/src/lib/bridges/profiling.ts
2. tauri-app/src/lib/profiling/trace-types.ts
3. tauri-app/src/lib/profiling/trace.ts
4. tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts
5. tauri-app/src-tauri/src/profiling_wire.rs
6. tauri-app/src-tauri/src/profiling_validation.rs
7. tauri-app/src-tauri/src/profiling.rs — unavailable evidence versus existing native action history guard only
8. tauri-app/scripts/profiling/trace-wire.mjs
9. tauri-app/scripts/profiling/trace-integrity.mjs
10. tauri-app/scripts/profiling/import-trace-run.mjs
11. tauri-app/scripts/profiling/trace-to-run.mjs — G4 diagnostic invalid reason and unavailable measurements only
12. tauri-app/scripts/profiling/schema/trace-record.v2.schema.json — new

Tests (8):

13. tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts
14. tauri-app/src/lib/profiling/trace.spec.ts
15. tauri-app/src/lib/bridges/profiling.spec.ts
16. tauri-app/src-tauri/src/profiling_tests.rs
17. tauri-app/scripts/profiling/trace-fixtures.mjs
18. tauri-app/scripts/profiling/profiling-trace.test.mjs
19. tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs
20. tauri-app/scripts/profiling/profiling-native-wire.test.mjs

Plus one new immutable submission:
PLAN/RAG/reviews/EPIC-029/profiling-b9-invalid-input-implementation-submission.md.

No other authored files. Lead owns record/ticket/log/index. If an essential fenced dependency is discovered, report exact symbol/path and reason; do not silently expand or perform opportunistic splits.

Explicitly unchanged: internal trace-config.ts and trace-dom.ts; ProfileResolvedSnapshot and internal action.analysisConfig stay resolved-only/optional. Use separate unavailable evidence metadata and wrap into the v2 union at the wire boundary. This is a binding implementation choice to avoid a gratuitous DOM/config ripple. Existing trace-fixtures.ts does not need a flat wire conversion; preserve it unless a concrete dependency is reported.

Also fenced: ParameterControls.svelte, HomeView.svelte, analysis-runner.svelte.ts, stores, compute bridge, App/ProfileCaptureControl, native profiling_writer.rs, core/math/video/cache/retention, commands/main, old v1 schema, case/run/binding schemas, summary/redaction tools, exported fixtures, all configs/locks/dependencies and independent IMP178/EPIC026 worktrees.

## Required implementation

- Implement exact resolved/value versus unavailable/input-target-invalid wire evidence. Never make an unavailable config into a computed current numeric value.
- Branch before createProfileAnalysisConfig for all invalid numeric deliveries, including invalid quality (its current table lookup can throw before observation). Preserve valid render snapshot and exact source identity, then synchronously create/resolve/terminalize ordinary invalid input with G2's three events and sourceMatches true.
- Invalid target plus capacity sentinel/refusal keeps existing explicit sticky loss/failure and cannot seal cleanly. Do not widen unavailable semantics to other statuses or fabricate missing events. Unexpected malformed config outside the narrow arm remains a known failure.
- Keep internal resolved state plain/optional; no unavailable config can admit a native profiling context or reach accepted-result/DOM comparisons. Valid actions retain ordinary resolved behavior and production lifecycle, including legitimate cancellation/dedup.
- Match strict renderer/native/parser validation for union keys, exact invalid outcome/checks/events/no measurements, valid render config and existing identity/clock/count/byte rules. New native emitted records all use2; IPC does not grow serialized-record metadata keys.
- In profiling.rs reject unavailable batch conflicting with preexisting native action history using existing receipt/loss accounting. Do not weaken check_batch_sequence or rewrite writer reservation/finalization logic.
- Parser supports exact old v1 flat config and new v2 arm separately. Organizer rejects mixed record versions and any native/receipt contradiction on unavailable evidence, including nonselected actions. Strict unresolved failures stay failures.
- Normal selection of unavailable evidence fails ACTION_CASE_CONFIG_UNAVAILABLE. Diagnostic output can preserve unverified/input-target-invalid only when evidence is otherwise intact; all measurements unavailable, no fresh-execution proof. Binding mismatch/trace loss keeps higher-priority unverified failure semantics. Nonselected intact unavailable actions do not taint an otherwise valid selected resolved trace.
- Preserve safe bridge-authored error code via fixed allowlist, fallback trace-flush-failed. Finish remains first-failure sticky/nonretryable, generic UI, no native finalize after loss. No sequence skips/rebases/retries/reloads.

## Regression acceptance

Implement B8 matrix plus G1-G7 refinements, with executable permanent proof:

- Actual installed bind_value empty->null, writable propagation, observer-before-effect ordering, actual coordinator/runner/collector/production bridge validator. Native transport stub explicitly labelled; do not fake successful validation. Rapid45->empty->46->empty->45 must persist contiguous1-4 truthful outcomes.
- A settled valid action must traverse admission and existing accepted-result endpoint, not merely prove all rapid actions cancelled. Empty left beyond debounce remains invalid observation/no native profiling context; production behavior unchanged.
- Every numeric control invalid/empty, especially quality; null versus undefined/NaN/infinity hostile states; boolean/resolved controls; capacity boundary, disabled/quiesced input, terminal immutability.
- Renderer and native strict rejection of every contradictory unavailable arm. Native existing receive/return + unavailable, late native after close, sequence2 when expected1, loss/byte/capacity behavior, unchanged sticky failure after later success.
- Native test emitter -> actual Node parser/import fixture includes unavailable then resolved measured evidence and coherent v2 seal. All action IDs accounted, nonselected contradiction rejection, selected diagnostic reason correctness. Never infer measured eligibility from native seal alone.
- Old sealed v1 compatibility remains, old corrupt/unsealed v1 remains ineligible, mixed/unknown versions reject, v1/v2 shapes cannot cross versions. No rewriting historical fixtures to remove v1 coverage.
- Correct v2 schema document with distinct id; finite/exact-key/conditional guards match runtime as far as JSON Schema can express. Cross-record state guards stay explicitly in integrity/native tests; don't imply JSON Schema alone verifies them.
- Raw arbitrary thrown messages stay out of artifacts/UI/receipts; allowlisted code and sticky Finish result verified.

## Validation and safety

Use installed dependencies; no npm install/ci or setup. Format only touched files with installed Prettier. Normal test-generated artifacts allowed only in existing ignored/private test locations.

From tauri-app:

    node --test scripts/profiling/*.test.mjs
    npm run test -- --run
    npm run check
    npm run lint
    npm run format:check

From tauri-app/src-tauri:

    cargo fmt --all -- --check
    cargo clippy --workspace --offline -- -D warnings
    cargo test --workspace --offline
    cargo test -p color-core --no-default-features --test kmeans_snapshots --offline

Run focused new regressions first then complete gates. Baseline Node73, Vitest309/27 files, native68 plus intentional ignored emitter explicitly exercised by Node, scalar1, two old Svelte warnings. Record actual counts, command exits and errors; do not assume baseline count suffices. If piping, set pipefail. Use Cargo for tests only, never execute guessed target/deps app binaries.

No app packaging/build, new launch/attach/control, capture, runtime namespace/log/preference changes, media/owner workload operations, source maps, installs, Git mutation/commit, cleanup, ordinary/B2/B6/A0 app control or failed-session recovery. No native release build. B6 historical PID is absent and its existing namespace/evidence remains immutable to this assignment.

## Submission

One report: G1-G7 mapping; exact20-path fence accounting (untouched allowed paths identified), per-file SHA256 and preservation receipt; source/probe/test versus unrun app evidence; full self-contained focused regression command, positive/negative counts, full verbatim gate outcomes, failures/friction/deviations and cohesive LOC growth. No weakening/skipping old assertions or minification to satisfy counts.

Leave source prepared/uncommitted. Send report and external SHA to this lead immediately. Stop at source acceptance gate; lead owns review and separately identified build/runtime assignment. No owner question, new task, watcher or polling loop.

