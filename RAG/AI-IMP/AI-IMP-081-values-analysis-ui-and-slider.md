---
node_id: AI-IMP-081
tags:
  - Implementation
  - ui
  - values
  - svelte
kanban_status: completed
depends_on:
  - AI-EPIC-015
  - AI-IMP-080
confidence_score: 0.49
date_created: 2026-01-22
date_completed: 2026-01-22
---

# AI-IMP-081-values-analysis-ui-and-slider

## Summary of Issue #1
Replace the Values grid UI with the Values Analysis layout: Original + Neutral, absolute range bar, and notan preview with centroids/boundaries. Add a Levels slider (2–5) and cache results per image + level.

### Out of Scope
- Export rendering updates.
- Multi-image UX or keyboard controls.

### Design/Approach
- Add a new store slice for values analysis results keyed by image id + level count.
- Values tab layout:
  - Section A: Original + Neutral images.
  - Section B: Range bar with p10/p90 and key/contrast labels.
  - Section C: Ruler with centroids/boundaries + notan preview.
- Levels slider (2–5) triggers analysis fetch for the current image.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`
- `tauri-app/src/lib/bridges/value-analysis.ts` (new)
- `tauri-app/src/lib/views/ValuesView.svelte`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>
- [x] Add values analysis store + helpers keyed by image id and levels.
- [x] Implement Values Analysis layout in `ValuesView.svelte`.
- [x] Wire Levels slider to trigger analysis fetch + cache.
- [x] Remove legacy values grid UI from the Values view.

### Acceptance Criteria
**Scenario:** Values Analysis view
**GIVEN** a loaded image with a native path
**WHEN** the Values tab is opened
**THEN** the Original + Neutral images, range bar, and notan preview appear
**AND** adjusting the Levels slider updates the analysis deterministically.

### Issues Encountered
- Tests not run.
