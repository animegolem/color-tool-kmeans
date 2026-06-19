---
node_id: AI-IMP-148
tags:
  - IMP-LIST
  - Implementation
  - architecture
  - drag-drop
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.6
date_created: 2026-03-19
date_completed: 2026-06-09
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

- [x] Audit drag-drop handlers in HomeView, ValuesView, BatchView
- [x] Document commonalities and view-specific differences
- [x] Decide: shared utility, shared component, or keep bespoke (with justification)
- [x] If extracting: implement shared utility/component — N/A, decision is keep bespoke (see Issues Encountered)
- [x] If extracting: refactor existing views to use shared implementation — N/A
- [x] `npm run check && npm run lint && npm run test` — N/A, documentation-only ticket
- [x] Manual smoke: drag-drop works identically on all views — Home and Values verified; Batch lands in IMP-149

### Acceptance Criteria

**Scenario:** Consistent drag-and-drop behavior
**GIVEN** files are dragged onto HomeView, ValuesView, or BatchView.
**WHEN** the files are dropped.
**THEN** each view handles the drop with consistent validation, error messages, and visual feedback.

**Scenario:** Evaluation documented
**GIVEN** the audit is complete.
**THEN** a clear recommendation exists (extract or keep bespoke) with reasoning.

### Issues Encountered

**Audit conclusion (2026-06-09): keep bespoke.** The shared service layer already exists and is in use: both HomeView (`views/home/file-ingestion.svelte.ts`) and ValuesView (`views/values/file-ingestion-values.svelte.ts`) route drops through `services/drag-drop.ts` (`setupTauriDragDrop`, the `tauri://drag-drop` listener + path-to-FileSelection mapping) and `services/media-ingestion.ts` (`ingestFileAsEntry`). That covers the ~30% of drop handling that is genuinely common: event plumbing, MIME inference, entry construction, video thumbnail extraction.

The remaining ~70% differs by view intent and should stay bespoke:
- **HomeView**: activates the first image and schedules color analysis.
- **ValuesView**: routes videos into probe/scrub state; images activate for value analysis.
- **BatchView** (IMP-149): appends without activating and auto-pins under the pin cap.

A `createDropHandler(options)` factory would just re-encode those differences as configuration, adding indirection without removing real duplication. Views are destroyed on switch (`App.svelte` renders views via `{#if currentView}`), so per-view listeners cannot double-fire — no correctness pressure to centralize.

**One real unification win identified**: drag-over visual feedback cannot use HTML5 `dragover` (Tauri suppresses HTML5 drag events when its native drag-drop handling is enabled), so `setupTauriDragDrop` gains optional `tauri://drag-enter` / `tauri://drag-leave` callbacks. This lands once in the shared service as part of IMP-149 and is available to all views.
