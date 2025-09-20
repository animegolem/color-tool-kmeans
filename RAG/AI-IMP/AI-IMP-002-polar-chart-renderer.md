---
node_id: AI-IMP-002
tags:
  - IMP-LIST
  - Implementation
  - Renderer
  - Canvas2D
  - Charting
kanban_status: planned
depends_on: [AI-IMP-001]
confidence_score: 0.82
created_date: 2025-09-20
close_date:
---

# AI-IMP-002-polar-chart-renderer

## Summary of Issue #1
We need a performant 2D polar symbols visualization that mirrors the Figma “Graphs View”: outer circle, cross‑axes, optional labels, and per‑cluster circles sized by share and colored by centroid. Intended remediation: a Canvas 2D renderer with axis mode HLS/HSL, axis label toggle, stroke toggle, and symbol size scaling. Done when the chart renders ≥60 FPS for typical K and produces pixel‑identical PNG/SVG exports when invoked.

### Out of Scope 
- Palette bar graph, CSV generation, and composite export.
- D3/Observable dependencies (pure canvas implementation).

### Design/Approach  
- Implement `PolarChart` class: `render(ctx, model, options)`.
- Input model: `clusters[]` with { rgb, spaceTriplet, count, share } from worker, plus controls: { axisType: 'HLS'|'HSL', axisLabels: bool, stroke: bool, symbolScale }.
- Position mapping: convert centroid to HSV (via shared conversions) and map
  - `HSL`: angle=h, radius=s, size ∝ v
  - `HLS`: angle=h, radius=v, size ∝ s
  using same math as the notebook to ensure continuity.
- Size mapping: `r = sqrt(share * zScale)` with configurable zScale.
- Stroke color: dynamic contrast (white on dark, dark on light) if enabled.
- Accessibility: ensure clear antialiasing; label font sizes per Figma.

### Files to Touch
- `electron-app/src/renderer/views/polar-chart.ts`: chart implementation.
- `electron-app/src/renderer/views/canvas-utils.ts`: helpers for DPR scaling, text, and circle drawing.
- `electron-app/src/renderer/state.ts`: wire controls and data model.
- `electron-app/src/shared/types.ts`: chart option types (reuse worker’s color conversions from shared module).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Create `canvas-utils.ts` with DPR‑aware `createHiDPICanvas`, `withScale`, and text measurement helpers.
- [ ] Implement `PolarChart` with configurable size; draw outer circle and cross‑axes.
- [ ] Implement axis label toggle and HLS/HSL label text per Figma.
- [ ] Implement circle plotting from clusters with radius/angle mapping and area‑proportional symbol sizing.
- [ ] Implement stroke toggle with contrast color based on HSV value threshold.
- [ ] Provide `toPNG(scale)` and `toSVG()` methods that reuse layout logic for export fidelity.
- [ ] Add simple interaction test: render with synthetic clusters (K=30/100/300) at 600×600; verify frame time under 16 ms in dev.
- [ ] Verify visual parity with Figma screenshots in `figma/graphs-view.png`.

### Acceptance Criteria
**Scenario: Render chart at K=300**
GIVEN clusters from the worker and axisType=HSL
WHEN the chart renders at 600×600
THEN all circles are placed and sized correctly within 1 px tolerance
AND average frame time ≤16 ms on reference hardware.

**Scenario: Export fidelity**
GIVEN a rendered chart
WHEN exporting PNG (1× and 2×) and SVG
THEN visual output matches on‑screen layout (positions/sizes/labels) within 1 px/1%.

### Issues Encountered 
To be filled during implementation.

