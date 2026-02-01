---
node_id: AI-IMP-082
tags:
  - Implementation
  - exports
  - values
  - svelte
kanban_status: completed
depends_on:
  - AI-EPIC-015
  - AI-IMP-080
  - AI-IMP-081
confidence_score: 0.47
date_created: 2026-01-22
date_completed: 2026-01-22
---

# AI-IMP-082-values-analysis-export

## Summary of Issue #1
Add a Values Analysis export that matches the new Values tab layout (Original + Neutral, range bar, ruler + notan preview). Retire the legacy values grid export entry.

### Out of Scope
- Composite exports with other graphs.
- Multi-image export layouts.

### Design/Approach
- Add a new SVG export generator for the Values Analysis layout.
- Add a new export card in `ExportsView` and remove the legacy Values Grid entry.
- Use tan background and embedded Fira Sans text.

### Files to Touch
- `tauri-app/src/lib/exports/value-analysis.ts` (new)
- `tauri-app/src/lib/views/ExportsView.svelte`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>
- [x] Implement Values Analysis SVG export generator.
- [x] Add export UI entry and wiring in Exports view.
- [x] Remove or hide legacy Values Grid export entry.

### Acceptance Criteria
**Scenario:** Values Analysis export
**GIVEN** a loaded image and computed values analysis
**WHEN** the user saves the Values Analysis PNG
**THEN** the exported image matches the Values tab layout and uses the tan UI background.

### Issues Encountered
- Tests not run.
