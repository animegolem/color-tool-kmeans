# AI-EPIC 
---
node_id: AI-EPIC-009
tags: 
  - EPIC
  - AI
  - ui
  - exports
  - visualization
date_created: 2026-01-19
date_completed: 2026-01-21
kanban_status: completed
AI_IMP_spawned: 
---

# AI-EPIC-009-ui-simplification-and-oklch-visuals

## Problem Statement/Feature Scope 
The current UI exposes advanced options (color space, axis modes) that do not map to the intended audience and are inconsistent with the underlying math. Graphs/exports still assume HSV/HSL semantics, and the UI contains legacy knobs from earlier architecture pivots.

## Proposed Solution(s) 
- Replace advanced parameters with a minimal control set (clusters, quality slider, ignore-top-N, symbol size).
- Update graphs and exports to use OKLCH mapping (h as angle, C as radius, L as vertical/legend).
- Align labels/copy to the perceptual pipeline and remove axis/color-space toggles.
- Keep analysis debounce for sliders and avoid reruns on tiny slider changes (map to discrete quality steps).
- Audit and remove legacy UI/bridge paths that are no longer required by the native-only flow.

## Path(s) Not Taken 
- Preserve HSV/HSL axis toggles and color-space selection in the main UI.
- Add a full "advanced" panel in the first pass.
- Provide web/WASM-only compute paths in the primary UX.

## Success Metrics 
1. Users can run an analysis without understanding color-space terminology.
2. Graphs and exports reflect OKLCH semantics and match design expectations.
3. Slider interaction remains responsive with no visible thrash or UI lockup.

## Requirements

### Functional Requirements
- [ ] FR-1: Parameter panel shows only clusters, quality, ignore-top-N, and symbol size.
- [ ] FR-2: Graphs view uses OKLCH-based polar layout; labels indicate Hue/Chroma/Lightness.
- [ ] FR-3: Palette/histogram and top-cluster preview respect ignore-top-N filtering.
- [ ] FR-4: Export pipeline emits SVG/PNG/CSV based on OKLCH mapping with embedded Fira Sans.
- [ ] FR-5: Update store/bridge types to remove color-space/axis fields and reflect new params.
- [ ] FR-6: Map quality slider to idempotent discrete steps to minimize re-analysis churn.
- [ ] FR-7: Remove unused UI/bridge artifacts that are no longer referenced in native mode.

### Non-Functional Requirements 
- [ ] NFR-1: Debounce/thresholding prevents spinner flicker and excessive compute calls.
- [ ] NFR-2: Graph/exports remain deterministic for identical inputs.
- [ ] NFR-3: UI remains offline-only; no CDN fonts or remote assets.
- [ ] NFR-4: Figma exports are refreshed to match new controls/labels before UI work.

## Implementation Breakdown 

### Planned Tickets
- AI-IMP-074: UI parameter simplification + quality slider mapping + ignore-top-N wiring. (in progress)
- AI-IMP-075: OKLCH polar chart + labels update; palette/preview sync with filter. (in progress)
- AI-IMP-076: Export pipeline updates for OKLCH + metadata fields. (in progress)
- AI-IMP-077: Remove legacy UI/bridge code paths after migration. (planned)

### Completed Tickets
