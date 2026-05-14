---
node_id: AI-IMP-148
tags:
  - IMP-LIST
  - Implementation
  - architecture
  - drag-drop
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.6
date_created: 2026-03-19
date_completed:
---

# AI-IMP-148-drag-drop-unification

## Evaluate and unify drag-and-drop pathways

Drag-and-drop file handling is implemented independently in HomeView, ValuesView, and potentially BatchView, each with its own event handlers, validation logic, and ingestion calls. This ticket evaluates whether these implementations are sufficiently similar to warrant extraction into a shared utility or composable, reducing duplication and ensuring consistent behavior (accepted formats, error handling, visual feedback) across all views.

### Out of Scope

- Implementing new drag-and-drop targets (see IMP-149 for batch).
- Changing accepted file formats.
- Adding drag-and-drop to the media bucket sidebar.

### Design/Approach

Audit all `ondragover`, `ondrop`, and related handlers across views. Document the differences (e.g., HomeView may auto-analyze, BatchView should auto-pin). Determine if a shared `createDropHandler(options)` factory or a `DropZone.svelte` wrapper component would reduce duplication without over-abstracting view-specific behavior. Deliver a recommendation document or implement the extraction if the win is clear.

### Files to Touch

- `src/lib/views/HomeView.svelte`: existing drag-drop handlers
- `src/lib/views/ValuesView.svelte`: existing drag-drop handlers
- `src/lib/views/BatchView.svelte`: existing or planned drag-drop handlers
- Potentially new: `src/lib/utils/drop-handler.ts` or `src/lib/components/DropZone.svelte`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Audit drag-drop handlers in HomeView, ValuesView, BatchView
- [ ] Document commonalities and view-specific differences
- [ ] Decide: shared utility, shared component, or keep bespoke (with justification)
- [ ] If extracting: implement shared utility/component
- [ ] If extracting: refactor existing views to use shared implementation
- [ ] `npm run check && npm run lint && npm run test`
- [ ] Manual smoke: drag-drop works identically on all views

### Acceptance Criteria

**Scenario:** Consistent drag-and-drop behavior
**GIVEN** files are dragged onto HomeView, ValuesView, or BatchView.
**WHEN** the files are dropped.
**THEN** each view handles the drop with consistent validation, error messages, and visual feedback.

**Scenario:** Evaluation documented
**GIVEN** the audit is complete.
**THEN** a clear recommendation exists (extract or keep bespoke) with reasoning.

### Issues Encountered

<!--
This section is filled out post work.
-->
