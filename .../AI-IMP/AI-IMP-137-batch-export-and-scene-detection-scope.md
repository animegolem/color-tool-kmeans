---
node_id: AI-IMP-137
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - export
kanban_status: planned
depends_on:
  - AI-IMP-136
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.85
date_created: 2026-03-18
date_completed:
---

# AI-IMP-137-batch-export-and-scene-detection-scope

## Batch export via composeColorStudy + deferred scene detection ticket

Two deliverables: (1) wire the "Export Composite" button in BatchView to produce a PNG using the existing `composeColorStudy` pipeline, and (2) write a thin deferred IMP ticket scoping the ffmpeg scene detection feature for future implementation.

### Out of Scope

- Implementing scene detection (deferred — this ticket only writes the scoping document).
- New export formats beyond the existing composite PNG.
- Values analysis export tiles.
- Per-image provenance overlays on charts.

### Design/Approach

**Batch export:**

The existing `composeColorStudy` compositor accepts a `ColorStudyInput` with optional tiles (source image, polar chart, histogram, hue-lightness, palette strip). For batch export:

1. Load the composite grid PNG (from `multiCompositePath`) as a data URL → `imageToTile()`.
2. Generate chart SVGs from `multiAnalysisResult` → `svgToTile()`.
3. Feed into `composeColorStudy()` — grid goes in the `sourceImage` slot.
4. Rasterize via `svgToPngBlob()` at configured export scale.
5. Save via file dialog.

This reuses the entire existing export pipeline. The runner can share the `performSave` / `setStatus` pattern from `colors-export-runner.svelte.ts`.

**Scene detection scoping ticket:**

Write `AI-IMP-138-ffmpeg-scene-detection.md` as a deferred IMP ticket documenting:
- Rust command `detect_scenes(path, threshold, max_frames)` using ffmpeg scene detection filter
- Frontend review panel for selecting detected frames
- Integration with pin system (auto-pin selected frames)
- Estimated scope: ~200 LOC Rust, ~300 LOC frontend

### Files to Touch

- `src/lib/views/BatchView.svelte`: add "Export Composite" button handler
- `src/lib/views/batch/batch-runner.svelte.ts`: add `exportComposite()` method using `composeColorStudy` pipeline
- `RAG/AI-IMP/AI-IMP-138-ffmpeg-scene-detection.md`: new deferred IMP ticket

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `exportComposite()` to batch runner
  - [ ] Load composite grid PNG as data URL via `toDataUrl(convertFileSrc(compositePath))`
  - [ ] Build `ColorStudyInput` with grid as `sourceImage` tile
  - [ ] Generate polar chart, histogram, hue-lightness, palette strip tiles from result
  - [ ] Call `composeColorStudy(input)` → `svgToPngBlob(svg, width, height, scale)` → save dialog
  - [ ] Status messages: "Batch composite PNG saved." / "Export canceled."
- [ ] Wire "Export Composite" button in BatchView results state
  - [ ] Disabled when `isSaving` or no result
  - [ ] Uses `performSave` wrapper for error handling
- [ ] Add save state UI (saving spinner, status message) to BatchView
- [ ] Write `AI-IMP-138-ffmpeg-scene-detection.md` as deferred ticket
  - [ ] Rust command scope: `detect_scenes` using `select='gt(scene,threshold)',showinfo`
  - [ ] Frontend review panel scope: grid of frame thumbnails with checkboxes
  - [ ] Integration scope: auto-pin selected frames
  - [ ] Estimated LOC and dependencies
- [ ] Validate: `npm run check && npm run lint`
- [ ] Manual smoke: pin 4 images → Analyze → Export Composite → verify PNG output

### Acceptance Criteria

**Scenario:** Exporting batch composite
**GIVEN** batch analysis has completed with 4 pinned images.
**WHEN** the user clicks "Export Composite".
**THEN** a save dialog appears with default filename `batch-colors.png`.
**AND** the saved PNG contains the grid composite + polar chart + histogram + palette strip in the standard color study layout.
**AND** a status message "Batch composite PNG saved." appears and auto-dismisses.

**Scenario:** Export canceled
**GIVEN** batch analysis has completed.
**WHEN** the user clicks "Export Composite" then cancels the save dialog.
**THEN** status message shows "Export canceled." and auto-dismisses.

**Scenario:** Scene detection ticket exists
**GIVEN** this IMP is complete.
**THEN** `RAG/AI-IMP/AI-IMP-138-ffmpeg-scene-detection.md` exists as a deferred ticket with scope, dependencies, and estimated LOC.

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
