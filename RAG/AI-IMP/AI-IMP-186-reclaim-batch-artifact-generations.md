---
node_id: AI-IMP-186
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: planned
depends_on:
  - AI-IMP-185
  - AI-IMP-184
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-186-reclaim-batch-artifact-generations

## Give unique Batch generations a complete release lifecycle

Unique Batch grid files survive supersession, failure and restart because no cleanup path recognizes them. Success is reclaimed abandoned generations without deletion of accepted or in-flight artifacts.

Trace: **SEP-07 / RT-02 and RT-04**; priority **P3**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Deleting user source files or adopting a pressure policy not approved by the review lead.

### Design/Approach

Round 01 ruling: verify export-held input readability before accepting reclamation. Newly fenced export/contract hooks overlap IMP-184/185 and require exclusive scheduling. Keep existing snapshot/clipboard persistence rules separate from Batch orphan recovery.

Use IMP-193 ownership/release machinery. Track composite acquisition through compose, analysis, publication and export; release on stale/failure/supersession/clear/unmount when last owner leaves. Add startup orphan collection for Batch paths; never blindly prune live paths.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src-tauri/src/compose_grid.rs`
- `tauri-app/src-tauri/src/cache.rs`
- `tauri-app/src-tauri/src/artifact_ownership.rs`
- `tauri-app/src-tauri/src/main.rs`
- `tauri-app/src-tauri/tests/audit_artifact_ownership.rs`
- `tauri-app/src/lib/services/artifact-cleanup.ts`
- `tauri-app/src/lib/bridges/fs.ts`
- `tauri-app/src/lib/views/batch/batch-runner.svelte.ts`
- `tauri-app/src/lib/stores/multi-analysis.ts`
- `tauri-app/src/lib/stores/multi-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/views/__tests__/batch-reanalysis.spec.ts`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/bridges/compose.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.spec.ts`
- `tauri-app/src/lib/views/exports/batch-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/batch-export-ownership.spec.ts` (new)

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Compose A then B and verify superseded A is released only after all consumers finish.
- [ ] Cover compose success followed by analysis failure, stale completion, clear and unmount.
- [ ] Simulate startup with abandoned Batch generations and assert reclamation; active session output stays readable.
- [ ] Pause an export reading grid A, supersede or clear A, and verify its bytes stay readable until the export releases its final lease.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** a unique grid whose last owner has released it, **WHEN** cleanup or startup recovery runs, **THEN** its bytes are reclaimed while any still-owned grid remains intact.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
