---
node_id: AI-IMP-130
tags:
  - IMP-LIST
  - Implementation
  - cleanup
  - P4
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.95
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-130-deduplicate-values-view-utilities

## Deduplicate ValuesView Utility Functions

`ValuesView.svelte:130-147` duplicates `formatPercent`, `keyLabel`, `contrastLabel`, `bucketTextColor` that already exist in `lib/exports/value-analysis.ts:329+`. Extract to shared location or import from exports module.

### Out of Scope

- Refactoring the exports module itself
- Changing function signatures or behavior

### Design/Approach

Import the existing utility functions from `lib/exports/value-analysis.ts` into `ValuesView.svelte` and remove the duplicated local definitions. If the exports module functions have slightly different signatures, adapt the call sites.

### Files to Touch

- `tauri-app/src/lib/views/ValuesView.svelte`: remove duplicate functions, add imports
- `tauri-app/src/lib/exports/value-analysis.ts`: verify functions are exported

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Verify `formatPercent`, `keyLabel`, `contrastLabel`, `bucketTextColor` are exported from `value-analysis.ts`
- [x] Import them in `ValuesView.svelte`
- [x] Remove duplicate definitions from ValuesView
- [x] Verify behavior is identical (check call sites for any differences)
- [x] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** ValuesView uses shared utility functions.
**GIVEN** ValuesView renders value analysis results.
**WHEN** the view displays formatted percentages, labels, and text colors.
**THEN** the output is identical to before the refactor.
**AND** no duplicate function definitions exist in ValuesView.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
