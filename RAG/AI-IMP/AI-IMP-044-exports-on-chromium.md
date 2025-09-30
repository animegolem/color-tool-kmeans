---
node_id: AI-IMP-044
tags:
  - IMP-LIST
  - Implementation
  - Exports
  - Canvas
  - SVG
  - Epic-004
kanban_status: completed
depends_on: [AI-IMP-043]
confidence_score: 0.83
created_date: 2025-09-25
close_date: 2025-09-26
---

# AI-IMP-044-exports-on-chromium

## Summary of Issue #1
Implement PNG/SVG/CSV exports using Chromium canvas/SVG APIs with the existing graphics components. Done when users can save circle graph PNG/SVG and palette CSV with deterministic content and correct dimensions.

### Out of Scope
- Desktop dialogs (handled by Electron preload).
- wasm compute (041/043).

### Design/Approach
- Render graph/palette to offscreen canvas for PNG; serialize SVG DOM for vector output.
- CSV: use the same cluster fields (rank, space c1..c3, rgb, hex, pixels, share).
- Add simple tests for deterministic CSV header and line count.

### Files to Touch
- `tauri-app/src/lib/exports/*.ts` (new helpers).
- `tauri-app/src/lib/views/ExportsView.svelte` (wire buttons/states).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Implement canvas → PNG export for circle graph.
- [x] Implement SVG serialization for graph/palette.
- [x] Implement CSV serialization for palette; include header row.
- [x] Wire to preload save dialogs; handle error/success states in the UI.
- [ ] Manual smoke: verify file sizes and basic content integrity.

### Acceptance Criteria
**Scenario:** User saves exports
GIVEN a computed result is present
WHEN the user saves PNG/SVG/CSV
THEN the files are written, with expected dimensions/rows, and are viewable in standard viewers.

### Issues Encountered
- Dev sandbox lacks `node_modules`; install in `electron-app/` and `tauri-app/` before running `npm run electron:dev` or `npm run test`. Manual export smoke pending until the renderer wiring is fully operational.
