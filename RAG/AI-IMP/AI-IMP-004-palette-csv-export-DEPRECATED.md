---
node_id: AI-IMP-004
tags:
  - IMP-LIST
  - Implementation
  - Export
  - CSV
  - Clipboard
kanban_status: planned
depends_on: [AI-IMP-001]
confidence_score: 0.85
created_date: 2025-09-20
close_date:
---

# AI-IMP-004-palette-csv-export

## Summary of Issue #1
Analysts need a simple, portable list of detected colors. We will generate a deterministic CSV and provide one‑click copy helpers for HEX/RGB/row values. Done when CSV exports contain the agreed columns and round‑trip correctly in Excel/Numbers and programmatic tools.

### Out of Scope 
- Image/graph PNG/SVG exports (handled elsewhere).
- Palette editing or tagging.

### Design/Approach  
- Schema (one row per cluster): `rank,space,c1,c2,c3,r,g,b,hex,pixels,share` where `space` is the active compute space and `c1..c3` are that space’s centroid components; `share = pixels / totalPixels` (0–1, 6 decimals).
- Sorting: default by `pixels` desc; accepts overrides from UI (hue/asc/desc) but the CSV reflects the currently visible order.
- Encoding: UTF‑8 with header row and `\n` line endings.
- Copy helpers: `copyHex`, `copyRgb`, `copyRow` using `navigator.clipboard` with Electron fallback (`ipcRenderer.invoke('clipboard:write', text)`).

### Files to Touch
- `electron-app/src/renderer/export/csv.ts`: CSV building + copy helpers.
- `electron-app/src/main/ipc/clipboard.ts`: secure clipboard bridge.
- `electron-app/src/renderer/state.ts`: integrate export with current palette order.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Implement CSV builder with header and fixed column order; format shares to 6 decimals.
- [ ] Implement HEX formatting `#RRGGBB` and RGB `[r:g:b]` helpers.
- [ ] Implement `copyHex`, `copyRgb`, `copyRow` with browser and Electron fallbacks.
- [ ] Validate CSV in Excel/Numbers and via `node:fs` read to ensure newlines/quotes are correct.
- [ ] Add unit tests for CSV generation given a mock palette.
- [ ] Wire export button in UI and ensure file dialog uses last saved directory (pref).

### Acceptance Criteria
**Scenario: Export CSV with active order**
GIVEN the palette is sorted by decreasing share
WHEN the user clicks Export CSV
THEN a CSV is written with rows in the same order
AND each row includes rank, space triplet, RGB, HEX, pixel count, and share to 6 decimals.

**Scenario: Copy helpers**
GIVEN a selected palette row
WHEN the user clicks Copy HEX and Copy RGB
THEN the clipboard contains `#RRGGBB` and `[r:g:b]` respectively.

### Issues Encountered 
To be filled during implementation.

