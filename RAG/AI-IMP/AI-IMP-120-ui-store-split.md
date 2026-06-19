---
node_id: AI-IMP-120
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - stores
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.75
date_created: 2026-02-25
date_completed: 2026-03-12
---

# AI-IMP-120-ui-store-split

## Summary
Split `lib/stores/ui.ts` (646 LOC) into 8 focused modules with a barrel re-export for backward compatibility:
- `navigation.ts` (~15 LOC)
- `image.ts` (~180 LOC)
- `analysis.ts` (~140 LOC)
- `value-analysis.ts` (~85 LOC)
- `video.ts` (~55 LOC)
- `exports.ts` (~30 LOC)
- `zoom.ts` (~17 LOC)
- `preferences.ts` (~105 LOC)

`ui.ts` becomes a ~20 LOC barrel re-export file.

Done means: `npm run check` passes with zero consumer import changes, each new module is under 200 LOC, and `ui.ts` is a barrel file under 30 LOC.

### Out of Scope
- Updating consumer import paths (barrel handles backward compat).
- Changing any store logic or behavior.

### Design/Approach
Extract each logical group of stores into its own module file. The key dependency constraint is that `image.ts` imports from `analysis.ts` (`resetAnalysis`) and `video.ts` (`setVideoState`). These are one-directional and do not create cycles.

Convert `ui.ts` into a barrel that re-exports everything from the 8 new modules, so all existing `import { ... } from '$lib/stores/ui'` statements continue to work without modification.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`: refactor to barrel re-export (~20 LOC)
- `tauri-app/src/lib/stores/navigation.ts`: new -- currentView, libraryDrawerOpen, navCollapsed
- `tauri-app/src/lib/stores/image.ts`: new -- images, activeImageId, selectedFile, hasFile, addImage, removeImage, etc.
- `tauri-app/src/lib/stores/analysis.ts`: new -- analysisState, analysisById, analysisResult, analysisError
- `tauri-app/src/lib/stores/value-analysis.ts`: new -- valueAnalysisLevels, valueAnalysisNotanMode, valueAnalysisByKey, derived state
- `tauri-app/src/lib/stores/video.ts`: new -- videoState, setVideoState
- `tauri-app/src/lib/stores/exports.ts`: new -- export-related stores
- `tauri-app/src/lib/stores/zoom.ts`: new -- zoomOverlay, openZoomOverlay, closeZoomOverlay
- `tauri-app/src/lib/stores/preferences.ts`: new -- params, chart options, user preferences

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create `stores/navigation.ts` extracting navigation-related stores
- [ ] Create `stores/image.ts` extracting image management stores and functions
- [ ] Create `stores/analysis.ts` extracting color analysis stores
- [ ] Create `stores/value-analysis.ts` extracting value analysis stores
- [ ] Create `stores/video.ts` extracting video state stores
- [ ] Create `stores/exports.ts` extracting export-related stores
- [ ] Create `stores/zoom.ts` extracting zoom overlay stores
- [ ] Create `stores/preferences.ts` extracting params and preferences
- [ ] Verify no circular dependencies exist (image -> analysis, image -> video are one-directional)
- [ ] Convert `ui.ts` into a barrel re-export that re-exports everything from all 8 modules
- [ ] Verify all existing consumer imports still resolve
- [ ] Confirm each new module is under 200 LOC
- [ ] Confirm `ui.ts` barrel is under 30 LOC
- [ ] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: Zero consumer changes**
**GIVEN** the store split is complete with barrel re-export.
**WHEN** `npm run check` is run.
**THEN** it passes with no import resolution errors and no consumer files were modified.

**Scenario: Module size targets**
**GIVEN** the extraction is complete.
**WHEN** each new module is measured.
**THEN** every module is under 200 LOC.
**AND** `ui.ts` is under 30 LOC.

**Scenario: No circular dependencies**
**GIVEN** the modules are created.
**WHEN** the dependency graph is analyzed.
**THEN** `image.ts` imports from `analysis.ts` and `video.ts` only (one-directional).
**AND** no other circular imports exist.

**Scenario: Runtime behavior unchanged**
**GIVEN** the refactor is complete.
**WHEN** the application is launched and image analysis is performed.
**THEN** all store-driven behavior (navigation, analysis, video, zoom, preferences) works identically to before.

### Issues Encountered
<!-- Post-implementation notes go here -->
