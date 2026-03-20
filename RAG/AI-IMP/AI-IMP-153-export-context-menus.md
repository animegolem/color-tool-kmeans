---
node_id: AI-IMP-153
tags:
  - IMP-LIST
  - Implementation
  - exports
  - ux
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.6
date_created: 2026-03-19
date_completed:
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

- [ ] Create context menu component or inline menu logic
- [ ] Attach oncontextmenu to polar chart, histogram, and hue x lightness containers
- [ ] Wire "Export as PNG" and "Export as SVG" actions to existing export functions
- [ ] Add defaultExportFormat setting to SettingsView
- [ ] Apply context menus to BatchView chart elements
- [ ] Handle dismiss on click-outside and Escape
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: right-click chart → menu appears → export produces valid file

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

<!--
This section is filled out post work.
-->
