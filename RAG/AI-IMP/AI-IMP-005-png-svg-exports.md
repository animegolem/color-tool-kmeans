---
node_id: AI-IMP-005
tags:
  - IMP-LIST
  - Implementation
  - Export
  - Renderer
  - PNG
  - SVG
kanban_status: completed
depends_on: [AI-IMP-001, AI-IMP-002, AI-IMP-003]
confidence_score: 0.8
created_date: 2025-09-20
close_date:
---

# AI-IMP-005-png-svg-exports

## Summary of Issue #1
Charts render on screen, but we still need reliable PNG/SVG exports for the polar graph and palette bar to satisfy FR-9/FR-10. We must provide deterministic, DPI-aware exports with embedded Fira Sans so outputs match the design. Success = both components expose a unified `exportAs({format, scale})` API returning SVG strings or PNG blobs with automated tests verifying geometry and fallback behaviour.

### Out of Scope 
- Overview composite export (AI-IMP-006).
- File dialog wiring (handled in Electron shell ticket).
- CSV generation (AI-IMP-004).

### Design/Approach  
- Polar chart: reuse layout from `PolarChart`; surface `exportAs({format, scale})` that returns SVG synchronously or defers to a helper for PNG. Keep existing `toSVG()` to share layout logic.
- Palette bar: mirror the same API; ensure output remains background-free.
- Abstraction: add `exporters.js` with `svgToPngBlob` that detects `OffscreenCanvas` availability and throws descriptive errors when unsupported.
- Tests: under Node, emulate `OffscreenCanvas`/`createImageBitmap` to exercise the PNG path and assert dimensions/types; retain rejection tests when the feature is unavailable.

### Files to Touch
- `electron-app/src/renderer/views/polar-chart.js`: add export methods, font embedding tweaks.
- `electron-app/src/renderer/views/palette-bar.js`: add export methods.
- `electron-app/src/renderer/views/exporters.js`: new helper utilities for SVG→PNG conversion (with feature detection).
- `electron-app/tests/polar-chart.test.js`: extend to verify SVG structure and mocked PNG call.
- `electron-app/tests/palette-bar.test.js`: same as above.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] Add `exporters.js` with `svgToPngBlob(svg, width, height, scale)` that checks `OffscreenCanvas` support and throws when unavailable.
- [x] Update `PolarChart` to expose `exportAs({format, scale})`, delegating to `toSVG()` or `svgToPngBlob` and preserving layout logic.
- [x] Update `PaletteBar` with the same export API and helper usage.
- [x] Ensure both classes still share `toSVG()` rendering to avoid duplication.
- [x] Extend unit tests to verify SVG structure, simulate OffscreenCanvas for PNG, and confirm unsupported environments reject.
- [x] Document export usage in `README-dev.md` (chart + palette) for future integration.

### Acceptance Criteria
**Scenario: Export circle graph SVG**
GIVEN a PolarChart with clusters
WHEN `exportAs({format: 'svg'})` is called
THEN the returned string contains `<svg>` with correct dimensions, axis text, and circle count matching the layout.

**Scenario: Export palette bar PNG**
GIVEN a PaletteBar with rows and OffscreenCanvas available (mocked in tests)
WHEN `exportAs({format: 'png', scale: 2})` is invoked
THEN a Blob is produced with type `image/png` and the renderer scales drawing commands for the 2× dimensions.

### Issues Encountered 
- Node lacks `OffscreenCanvas`; unit tests emulate the API to exercise PNG exports while preserving rejection behaviour when the helper is unavailable.
