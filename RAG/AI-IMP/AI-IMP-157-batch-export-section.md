---
node_id: AI-IMP-157
tags:
  - IMP-LIST
  - Implementation
  - exports
  - batch
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.8
date_created: 2026-06-10
date_completed: 2026-06-10
---

# AI-IMP-157-batch-export-section

## Batch export section in Exports view

Batch analysis results (composite grid, polar chart, histogram, hue x lightness, palette) currently have no export path — the Exports view only operates on the active single image. Users who run a batch analysis cannot save any of its outputs. A "Batch" builder section should be added to the Exports view, mirroring the Colors section for the parts relevant to batch — no video handlers (no video barcode, no frame-timestamp naming), with the batch composite grid taking the source-image slot.

Placement decision (user-confirmed 2026-06-10): a third builder section in ExportsView alongside Colors and Values, not a dialog in BatchView. This keeps exports on one surface and reuses the existing save/status infrastructure and PNG scale control.

### Out of Scope

- Right-click context menus on charts (IMP-153).
- Per-pinned-image exports (exporting each pinned image's individual analysis).
- Video-related export items (barcode, frame labels) — batch has no video.
- New export formats.

### Design/Approach

Mirror the values-runner reuse pattern: a new lean `views/exports/batch-export-runner.svelte.ts` factory that borrows `performSave`/`setStatus` from the colors runner (shared save mutex and status bar) and provides its own `baseName()` (`batch-{pinCount}-images`, no video suffixing). Sources: `multiAnalysisResult` (same `AnalysisResult` shape as single-image), `multiCompositePath` (composite grid PNG already on disk — exported via `saveFromPath`, used as the source-image tile in the composite study via `toDataUrl` + `imageToTile`), and `batchParams` for chart options. Chart generators (`generateCircleGraphSvg`, `generateHistogramSvg`, `generateHueLightnessSvg`, `generatePaletteSvg`) are reused as-is; composite study via `composeColorStudy`.

New `ExportChecks` keys (`batchCompositeGrid`, `batchPolarChart`, `batchHistogram`, `batchHistogramAll`, `batchHueLightness`, `batchPaletteStrip`) added to `stores/exports.ts` and `stores/prefs.ts` DEFAULTS — prefs merge iterates defaults keys, so persistence picks them up with graceful fallback.

ExportsView template restructured so the Batch section renders whenever a batch result exists, even with no active single image (currently the whole body is gated on `file && result`). Batch section includes its own palette data rows (CSV/.ase/JSON from batch clusters). The PNG scale control moves to a shared footer visible when anything is exportable. Empty-state copy updated to mention batch.

### Files to Touch

- `src/lib/views/exports/batch-export-runner.svelte.ts` (NEW): batch export factory
- `src/lib/views/ExportsView.svelte`: Batch section, conditional restructure, scale-control footer
- `src/lib/stores/exports.ts`: new ExportChecks keys
- `src/lib/stores/prefs.ts`: defaults for new keys

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add batch keys to ExportChecks interface and prefs DEFAULTS
- [x] Create batch-export-runner with generators, individual saves, composite-grid save, palette data saves
- [x] Implement batch composite study export (grid as source tile + selected charts)
- [x] Add Batch section to ExportsView with checkboxes, per-item download buttons, composite button
- [x] Restructure ExportsView conditionals so batch exports work without an active image
- [x] Respect graphExportFormat (PNG/SVG) for individual chart saves
- [x] `npm run check && npm run lint && npm run test` — 155 tests pass
- [x] Manual smoke: batch analyze → Exports view → save individual chart, composite study, and CSV — user smoke passed (2026-06-10)

### Acceptance Criteria

**Scenario:** Export batch outputs
**GIVEN** a batch analysis has completed.
**WHEN** the user opens the Exports view.
**THEN** a Batch section lists Composite Grid, Polar Chart, Cluster Histogram, Hue x Lightness, and Palette Strip with per-item save buttons and a composite study export.
**AND** palette CSV/.ase/JSON export the batch clusters.

**Scenario:** Batch exports without active image
**GIVEN** a batch result exists but no single image is selected.
**WHEN** the user opens the Exports view.
**THEN** the Batch section is available and functional.

**Scenario:** No video items
**GIVEN** the Batch section is displayed.
**THEN** no video barcode or video-related options appear.

### Issues Encountered

Straightforward port of the colors export surface. One drive-by fix: the Exports empty-state hint contained a literal `…` escape rendering as raw text — replaced with a real ellipsis. ExportsView grew to 520 LOC (over the 400 advisory threshold); flagged for the end-of-push LOC review — the three builder sections are natural extraction candidates if a split is wanted.
