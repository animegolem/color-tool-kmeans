---
node_id: AI-IMP-003
tags:
  - IMP-LIST
  - Implementation
  - Renderer
  - SVG
  - Palette
kanban_status: planned
depends_on: [AI-IMP-001]
confidence_score: 0.76
created_date: 2025-09-20
close_date:
---

# AI-IMP-003-palette-bar-graph

## Summary of Issue #1
Users need a “barcode”/bar palette that lists cluster colors with counts and supports live sorting (by hue and by share asc/desc). The view must match Figma, be crisp at any scale, and be exportable without background fill (native element). Done when the palette renders from worker clusters, sorts correctly, and can be exported as standalone SVG/PNG.

### Out of Scope 
- CSV generation (separate ticket) and polar chart.
- Palette editing/locking (future idea).

### Design/Approach  
- Implement an SVG‑based `PaletteBar` component for crisp text and easy export.
- Data: `[{rgb, hex, count, share, hue}]` where hue derived from HSV.
- Sorting: controls accept `mode: 'hue'|'share-asc'|'share-desc'`.
- Layout: color swatch rectangles (fixed height), text on right `[r:g:b] : count` using contrast color; container has no background.
- Export: `toSVG()` returns minimal SVG; `toPNG(scale)` rasterizes via canvas.

### Files to Touch
- `electron-app/src/renderer/views/palette-bar.ts`.
- `electron-app/src/renderer/views/svg-utils.ts` (serialize SVG, set viewBox, fonts).
- `electron-app/src/shared/types.ts` (palette item type).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Implement hue computation (HSV.h) and attach to each cluster for sorting.
- [ ] Implement `PaletteBar.render(container, items, options)` producing a background‑free SVG.
- [ ] Implement sort modes and verify stable sorting.
- [ ] Implement text formatting `[r:g:b] : {count}` with monospaced alignment.
- [ ] Add contrast logic for white/black label colors per swatch luminance.
- [ ] Provide `toSVG()` and `toPNG(scale)` exports.
- [ ] Validate visuals against `figma/graphs-view.png` right rail design.

### Acceptance Criteria
**Scenario: Sort by hue**
GIVEN a list of clusters
WHEN the user selects Hue sorting
THEN swatches reorder by increasing hue angle (0–360) deterministically.

**Scenario: Export SVG**
GIVEN the palette is rendered
WHEN exporting SVG
THEN the output has no background rect, correct viewBox, and opens in common viewers without rasterization.

### Issues Encountered 
To be filled during implementation.

