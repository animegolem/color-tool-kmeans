# EPIC-029 correctness wave 01 — implementation authorized

Review Lead → existing Code Lead (Sol), 2026-09-05. The owner explicitly authorized correctness work to continue while design discussion stays with the Review Lead. **This is a coding assignment**, not another general review.

## Candidate and authority

- Work only in `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`.
- Branch: `codex/correctness-wave-01-2026-09-05`; starting HEAD `5baa20e021855fbc57aebf48fa0f9b3374ded281`.
- Origin was fetched by the lead; main/origin main still match that base. Worktree was created by the lead and is clean before your source edits.
- Private local copies of current node_modules and FFmpeg sidecars are provisioned; do not npm install/ci or modify dependencies. Normal tool-generated caches/build outputs in this candidate are allowed.
- Normative record remains `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/PROJECT-RECORD.md`, rev 0.8. Its older review-only statements are historical; §5's rev 0.8 and this brief authorize only the slice below.
- Read candidate AGENTS.md/CLAUDE.md, the two tickets below, sweep manifest and EPIC-029 Round 01/02 verdicts. The accepted protocol C1–C3 remains unchanged. No new whole-epic review is requested.
- Preserve `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan` as the dirty planning carrier, and preserve main, the sweep, performance and live-video worktrees.

## Two issues, in order

### 1. AI-IMP-179 — restore the canonical renderer golden fixture path

Read `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/AI-IMP/AI-IMP-179-restore-color-golden-fixture-path.md`.

Reuse exactly the already prepared IMP-178 renderer path correction, without depending on or changing its numeric optimizations. Source provenance: `/Users/golem/.codex/visualizations/2026/09/04/01a06e41-5fbc-7d80-a106-606e924ac497/color-tool-kmeans-perf`, uncommitted diff in color-goldens.spec.ts. Lead reverified that its only change in this file replaces the old native fixture URL with `../../../../../color-core/tests/fixtures/color_golden.json`.

Reproduce the original fixture failure before repair, preserve numerical assertions and fixture bytes, then run focused/full tests. Do not copy the fixture back, regenerate goldens, change Rust math or modify the performance checkout.

### 2. AI-IMP-180, partial adoption — SWEEP-004 only

Read `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/AI-IMP/AI-IMP-180-adopt-reviewed-control-flow-stack.md` and the immutable manifest.

Adopt the already-reviewed listener setup/teardown repair from source commit `362b4a4a9327040682944e89ddbb8fd3d138932c`. EPIC-029 Round 01 classified this self-contained repair as Adopt. Inspect its exact patch, then adapt it to the current candidate. Do not wholesale copy a later sweep file containing other issues; do not import its RAG/INDEX delta.

Scope: failure-atomic listener registration, explicit rejection reporting and one shared async-listener helper used by Home/Values/Batch. Previously acquired listeners are released after a later registration fails; late registration after disposal is released; repeated normal disposal does not leak or double-release. Preserve Batch's separate selection/pinning semantics and all normal UI layout.

Retain the existing AUD regressions; add focused SWEEP-004 failure-path tests. Cover registration rejection, synchronous registration throw, unmount before registration resolves, normal disposal and rollback even if a cleanup callback throws. Keep any needed test cases inside the two fenced spec files below. Do not expand into unrelated cleanup or cancellation architecture.

No other SWEEP patch, IMP-188, native publication/leases, quotas, numeric optimization, UI foundations or redesign is authorized in this wave. This partial submission cannot complete IMP-180.

## Exact source file fence

Within the candidate, only:
1. tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts — IMP-179 only.
2. tauri-app/src/lib/services/async-listener.ts — new shared SWEEP-004 helper.
3. tauri-app/src/lib/services/drag-drop.ts.
4. tauri-app/src/lib/services/drag-drop.spec.ts — new.
5. tauri-app/src/lib/views/HomeView.svelte — listener import/setup/cleanup only, no layout.
6. tauri-app/src/lib/views/ValuesView.svelte — listener import/setup/cleanup only, no layout.
7. tauri-app/src/lib/views/BatchView.svelte — listener setup/cleanup only, no layout/pinning.
8. tauri-app/src/lib/views/batch/batch-drop.svelte.ts — move/remove duplicated listener lifecycle only; preserve batch processing.
9. tauri-app/src/lib/views/__tests__/audit-resource-integrity.spec.ts — helper import/adaptation and lifecycle regression tests only.

Sole additional durable output: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/correctness-wave-01-submission.md`.

You may fill validated checklist items and Issues Encountered in planning IMP-179, and partial-adoption evidence in IMP-180's Issues Encountered only. Do not mark whole IMP-180 checklist items or either ticket status completed; lead owns acceptance/status/index. Do not copy planning records into the candidate during this assignment; lead carries reviewed records at commit/integration.

Everything else is fenced, including package/lock/config, current vitest.config.ts (the UI SSR seam is NOT needed here), native/color-core, App/main entry, design artifacts, siblings, prior reports, PROJECT-RECORD, INDEX and other worktrees. If a necessary source edit falls outside the list, stop and request a numbered scope amendment.

## Execution and commit boundary

Implement and self-review the two issues sequentially. They have disjoint source file sets, so the lead can create two clean commits after reviewing the uncommitted submission. **Do not git add/commit/cherry-pick/apply/reset/rebase/push**, change branches/refs, delete worktrees or modify shared Git configuration. Read-only git show/diff/status/log are allowed; use apply_patch for manual source edits.

No new agents/tasks are necessary, but bounded implementation subagents are allowed under your leadership with at most two disjoint writers and the same file fences. Do not assign design decisions to them. You remain responsible for the combined review and tests.

## Validation and evidence

Run commands in the assigned candidate, never by editing main. Record exit codes and counts, not only prose summaries; no it.fails, skips, fixture regeneration or unrelated gate repair.

From candidate tauri-app:
```text
npm run test -- --run src/lib/exports/__tests__/color-goldens.spec.ts
npm run test -- --run src/lib/services/drag-drop.spec.ts src/lib/views/__tests__/audit-resource-integrity.spec.ts src/lib/views/__tests__/audit-control-flow-races.spec.ts
npm run test -- --run
npm run check
npm run lint
npm run format:check
```

From candidate tauri-app/src-tauri:
```text
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
cargo test -p color-core --no-default-features --test kmeans_snapshots
cargo tree -p color-core --edges normal
```

Record the expected pre-fix golden failure separately from post-fix results. Use local Prettier only on touched source files. Run focused checks after each issue, full gates at the combined tip. Rust --offline is allowed; no dependency updates. Missing tooling or unrelated baseline failures remain reported, not silently fixed. State actual Node/runtime; Node 20 and Windows/Linux evidence remain gaps unless executed. No need to launch the full app or invent native drag/drop smoke results; record that human acceptance is outstanding.

The repository has no validate-tickets.sh; do not claim it ran. Lead regenerates INDEX. Run git diff --check and compare the actual touched file list to this fence.

## Submission and next step

Report:
- exact base/branch/candidate and uncommitted state;
- source issue SHA/provenance → changed files → tests; distinguish IMP-179 repair from SWEEP-004 / IMP-180 partial adoption;
- before/after gate outcomes and exact counts, toolchain/platform;
- failure-atomicity/late-disposal proof, remaining risks and deviations;
- proposed two conventional commit subjects with [AI-IMP-179] and [SWEEP-004] [AI-IMP-180] respectively; no made-up resulting SHAs;
- all temporary/build artifacts, scope friction and unrun acceptance checks.

Send the report path to this Review Lead task when ready and stop. No polling or autonomous next-wave expansion. I will independently reproduce gates, create one commit per accepted issue, and issue the next correctness assignment. No merge/PR/release is implied by this wave.
