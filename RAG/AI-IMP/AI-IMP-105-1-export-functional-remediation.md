---
node_id: AI-IMP-105-1
tags:
  - IMP-LIST
  - Implementation
  - exports
  - compositor
  - values
kanban_status: completed
depends_on:
  - AI-IMP-105
parent_epic: AI-EPIC-013
confidence_score: 0.85
date_created: 2026-02-15
date_completed: 2026-02-15
---

# AI-IMP-105-1 — Export Functional Remediation

## Summary

Fixes functional gaps between the app UI and export output discovered after IMP-105 (ExportsView builder + compositor). Addresses scroll persistence, image rendering in composites, palette strip sizing, missing video barcode option, and values export visual defects (missing histogram, discrete gradient, misplaced bucket strip).

### Out of Scope

- Template-based semantic layouts (deferred to IMP-105.2)
- Card-based section styling and typography polish
- Palette strip right-column layout mode
- Export preview panel

### Design/Approach

Seven targeted fixes applied to existing files:

1. **Scroll reset** — `$effect` on `$currentView` resets `.view-container` scrollTop
2. **SVG image compat** — `xlink:href` added alongside `href` in compositor `imageToTile()`
3. **Palette limit** — `maxClusters` option in `PaletteOptions`; composite uses top 15
4. **Video barcode** — New checkbox in ExportsView Colors section, disabled when no strip
5. **Values histogram** — 16-bin bar chart rendered between range finder and simplified tones
6. **Smooth gradient** — `<linearGradient>` replaces 10 discrete `stepColors` segments
7. **Section reorg** — "Range finder" / histogram / "Simplified tones" with bucket strip directly above notan preview

### Files to Touch

- `src/App.svelte`: scroll reset `$effect`
- `src/lib/exports/compositor.ts`: `xlink:href` in `imageToTile`
- `src/lib/exports/palette.ts`: `maxClusters` option
- `src/lib/exports/value-analysis.ts`: histogram, gradient, section reorganization
- `src/lib/views/ExportsView.svelte`: video barcode, palette label, `histogramBins` pass-through

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `$effect` in `App.svelte` to reset scroll on `$currentView` change
- [x] Add `xlink:href` alongside `href` in `compositor.ts` `imageToTile()`
- [x] Add `maxClusters` to `PaletteOptions` interface and `generatePaletteSvg()`
- [x] Update ExportsView palette label to "Palette Strip (top 15)" and pass `{ maxClusters: 15 }`
- [x] Add `colorsVideoBarcode` checkbox state and `videoStrip` derived in ExportsView
- [x] Add Video Barcode checkbox UI with disabled state when no strip
- [x] Add `saveVideoBarcodeImage()` individual save function
- [x] Wire video barcode tile into `buildColorsTiles()` composite builder
- [x] Update `colorsAnyChecked` to include `colorsVideoBarcode`
- [x] Add `histogramBins: number[]` to `ValueAnalysisExportInput`
- [x] Replace stepColors discrete segments with `<linearGradient>` in range finder
- [x] Add 16-bin histogram bar chart section in `generateValueAnalysisSvg()`
- [x] Rename sections: "Range finder", "Simplified tones"
- [x] Move bucket strip directly above notan preview image (no gap)
- [x] Pass `histogramBins` from ExportsView to `generateValueAnalysisSvg()`
- [x] Manual smoke test: scroll reset, image rendering, palette limit, video barcode, values export

#### Round 3 additions (IMP-105.1c)

- [x] Fix "All sorts" sub-toggle: `stopPropagation()` instead of `preventDefault()` on nested checkbox
- [x] Palette text color: fixed dark `rgba(33,33,32,0.85)` instead of luminance-based `contrastStroke()`
- [x] Remove "ORIGINAL" / "NEUTRAL VALUES" labels from value analysis export
- [x] Bucket strip: width matches notan image (`previewDisplayWidth`), clipPath for rounded container with hard-edged segments
- [x] Expand Values export toggles: Neutral Values (+ Include Original sub-toggle), Range Finder, Values Histogram, Simplified Values
- [x] Conditional section rendering with cursor-based Y layout in `generateValueAnalysisSvg()`

### Acceptance Criteria

**Scenario:** User exports Colors composite with all options
**GIVEN** an image is loaded and analysis is complete
**WHEN** user checks Source Image, charts, Palette Strip (top 15), and Video Barcode
**THEN** composite PNG renders source image correctly (xlink:href fix)
**AND** palette strip contains at most 15 rows
**AND** video barcode appears when strip is available

**Scenario:** User switches between views
**GIVEN** user has scrolled down in Colors view
**WHEN** user switches to Exports view
**THEN** scroll position resets to top

**Scenario:** User exports Values composite
**GIVEN** value analysis has been computed
**WHEN** user exports Values composite
**THEN** range finder shows smooth gradient (not discrete steps)
**AND** 16-bin histogram bar chart appears between range finder and simplified tones
**AND** bucket strip sits directly above the notan preview image

### Issues Encountered

- Round 2 revealed nested `<label>` click propagation issue with "All sorts" toggle — outer label toggled `colorsHistogram` on every inner click
- Palette `contrastStroke()` picked white text for dark swatches, but labels sit on cream background — fixed to always-dark
- Bucket strip was 2× too wide (used `topPairWidth` instead of `previewDisplayWidth`) and had rounded segments instead of a single rounded container
- Values export needed individual section toggles to match Colors tab granularity — refactored to cursor-based conditional layout
