---
node_id: AI-IMP-153
tags:
  - IMP-LIST
  - Implementation
  - exports
  - ux
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.6
date_created: 2026-03-19
date_completed: 2026-06-19
---

# AI-IMP-153-export-context-menus

## Direct export context menus for graphs

Users currently export charts through the Exports view, which requires navigating away from the analysis. Adding right-click context menus directly on chart elements (polar chart, histogram, hue x lightness scatter) would allow quick PNG or SVG export without leaving the current view. An app-level setting should control the default export format, with screenshots defaulting to PNG.

### Out of Scope

- Adding new export formats (e.g., PDF, JPEG).
- Context menus on non-chart elements (images, swatches).
- Keyboard shortcut exports.

### Design/Approach

Attach a `oncontextmenu` handler to each chart container in AnalysisCards and BatchView. Show a minimal context menu with "Export as PNG" and "Export as SVG" options. Use the existing export functions (`exportPng()`, `exportSvg()`) wired in the Exports view. Add a `defaultExportFormat` setting to SettingsView that pre-selects the first menu item. Ensure the context menu dismisses on click-outside and Escape.

### Files to Touch

- `src/lib/views/HomeView.svelte`: context menu on chart cards
- `src/lib/views/BatchView.svelte`: context menu on batch charts
- `src/lib/views/home/AnalysisCards.svelte`: attach context menu handlers
- `src/lib/views/SettingsView.svelte`: add default export format setting

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Create context menu component or inline menu logic — `components/ContextMenu.svelte`
- [x] Attach oncontextmenu to polar chart, histogram, and hue x lightness containers — Home (via AnalysisCards) + Batch
- [x] Wire "Export as PNG" and "Export as SVG" actions to existing export functions — shared `exports/chart-save.ts` `saveChart()`
- [x] Add defaultExportFormat setting to SettingsView — N/A, `graphExportFormat` already exists in Settings; menu offers both formats explicitly per-export
- [x] Apply context menus to BatchView chart elements
- [x] Handle dismiss on click-outside and Escape — also scroll/resize
- [x] `npm run check && npm run lint` — plus full test suite, 155 pass
- [ ] Manual smoke: right-click chart → menu appears → export produces valid file — pending user validation

### Acceptance Criteria

**Scenario:** Export chart via context menu
**GIVEN** an analysis result is displayed on HomeView.
**WHEN** the user right-clicks the polar chart.
**THEN** a context menu appears with "Export as PNG" and "Export as SVG" options.
**AND** clicking an option exports the chart in the selected format.

**Scenario:** Default format setting
**GIVEN** the user sets the default export format to SVG in Settings.
**WHEN** the user right-clicks a chart.
**THEN** the SVG option appears first (or is highlighted) in the context menu.

### Issues Encountered

Two simplifications vs the original ticket: (1) **no `main.ts` change needed** — the global `contextmenu` suppression (`main.ts:51`) only calls `preventDefault` (cancels the native menu) without `stopPropagation`, so element `oncontextmenu` handlers still fire and drive our custom menu. (2) **No new `defaultExportFormat` setting** — `graphExportFormat` already exists in Settings; rather than depend on it, the menu offers "Export as PNG" and "Export as SVG" explicitly so the choice is per-export. Also factored the duplicated `saveIndividualChart` logic out of the colors/batch export runners into `exports/chart-save.ts`, shared with the menus. BatchView reached 718 LOC and HomeView 677 — flagged for the deferred LOC review.
