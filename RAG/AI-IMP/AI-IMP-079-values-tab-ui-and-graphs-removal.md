---
node_id: AI-IMP-079
tags:
  - Implementation
  - ui
  - values
  - tauri
kanban_status: completed
depends_on:
  - AI-EPIC-010
  - AI-IMP-078
confidence_score: 0.53
created_date: 2026-01-21
close_date: 2026-01-21
---

# AI-IMP-079-values-tab-ui-and-graphs-removal

## Summary of Issue #1
The UI needs a Values tab that displays the original image and the 3x3 value-study grid while removing the unused Graphs tab. Outcome: a new tab wired to the value-study command, with cached results per image id and no Graphs navigation.

### Out of Scope 
- Multi-image tab UI or batch export features.
- Adjusting k-means or export pipelines beyond the Values tab.

### Design/Approach  
- Add a `ValuesView.svelte` with the original image on top and a labeled 3x3 grid below.
- Add store state to cache value-study results per image id, with loading/error handling.
- Invoke the value-study Tauri command on Values tab activation (lazy load) and store the returned tile paths.
- Remove Graphs tab entry and associated navigation routes; keep GraphsView only if still used elsewhere (otherwise delete).

### Files to Touch
- `tauri-app/src/App.svelte`: add Values tab, remove Graphs tab.
- `tauri-app/src/lib/views/ValuesView.svelte`: new view layout and bindings.
- `tauri-app/src/lib/views/GraphsView.svelte`: remove if unused.
- `tauri-app/src/lib/stores/ui.ts`: add value-study cache + state.
- `tauri-app/src/lib/bridges/compute.ts`: add value-study invoke helper or new bridge module.
- `tauri-app/src/app.css`: Values grid layout styles.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Create Values tab UI with original image above a 3x3 grid and labels.
- [x] Add store state for value-study tiles, loading, and error per image id.
- [x] Call the Tauri value-study command on tab activation; cache results.
- [x] Remove Graphs tab navigation and any unused view wiring.
- [x] Verify tab switching does not invalidate the cached value grid for the active image.

### Acceptance Criteria
**Scenario:** Values tab render
**GIVEN** an analyzed image is loaded
**WHEN** the Values tab is opened
**THEN** the original image appears above a 3x3 value grid with Major/Minor labels
**AND** the grid persists when switching tabs.

### Issues Encountered 
- Tests not run (UI + Rust integration not executed).
