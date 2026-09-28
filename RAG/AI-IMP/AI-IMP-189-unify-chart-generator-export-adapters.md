---
node_id: AI-IMP-189
tags:
  - IMP-LIST
  - Implementation
  - remediation
  - optional
kanban_status: backlog
depends_on:
  - AI-IMP-184
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-189-unify-chart-generator-export-adapters

## Unify chart generator and dimension adapters

Generator/dimension forks remain after shared chart-save and Notan mapping were extracted. Success is one small explicit adapter per chart contract with byte-identical outputs.

Trace: **XC-08 remaining chart-generator slice**; priority **P4 optional**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

New charts or aesthetics; absorbing unrelated generators into a generic framework.

### Design/Approach

Compare generator options and dimension naming before extracting. Reuse existing chart-save; pass captured job inputs, not mutable getters. Keep genuinely distinct rendering policies distinct.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/values-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/batch-export-runner.svelte.ts`
- `tauri-app/src/lib/exports/chart-save.ts`
- `tauri-app/src/lib/exports/chart-export-adapters.ts (new)`
- `tauri-app/src/lib/exports/__tests__/chart-export-adapters.spec.ts (new)`
- `tauri-app/src/lib/exports/__tests__/determinism.spec.ts`
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Compare existing and unified SVG/PNG options and dimensions across all supported chart variants.
- [ ] Preserve deterministic payloads, filename suffixes, scale clamping and cancel semantics.
- [ ] Show removed duplicate blocks and why each retained variant is intentionally distinct.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** identical captured chart inputs, **WHEN** any runner uses the shared adapter, **THEN** exported bytes/options/name match its approved pre-refactor contract.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
