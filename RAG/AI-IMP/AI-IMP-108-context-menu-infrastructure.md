---
node_id: AI-IMP-108
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Exports
  - Context-Menu
  - Epic-013
kanban_status: planned
depends_on: [AI-EPIC-013]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.75
date_created: 2026-02-14
date_completed:
---


# AI-IMP-108-context-menu-infrastructure

## Summary of Issue #1
Charts and images in the app have no right-click context menu for quick export. Users must navigate to the Exports view to save individual charts. This stretch ticket adds native context menu infrastructure via Tauri's menu plugin, allowing right-click on chart elements to "Save as PNG" or "Save as SVG" directly. Done means right-clicking any chart in the Colors or Values view shows a native context menu with save options.

### Out of Scope
- Custom styled (non-native) context menus.
- Context menu items beyond save (e.g., copy to clipboard, open in new window).
- Context menus for non-chart elements (e.g., parameter controls, navigation).

### Design/Approach
- Add `tauri-plugin-menu` dependency to `src-tauri/Cargo.toml`.
- Add menu permission to `src-tauri/capabilities/main.json`.
- Implement a Rust command that constructs a popup menu with "Save as PNG" and "Save as SVG" items, returns the selected action.
- On the JS side, intercept `oncontextmenu` on chart container elements, invoke the Tauri menu command, and dispatch the appropriate export action based on the user's selection.
- Works well on macOS and Windows; Linux/Wayland has some GTK quirks which are acceptable for a stretch feature.

### Files to Touch
- `tauri-app/src-tauri/Cargo.toml`: add `tauri-plugin-menu` dependency.
- `tauri-app/src-tauri/capabilities/main.json`: add menu permission.
- `tauri-app/src-tauri/src/commands.rs`: add popup menu command (~40-50 LOC Rust).
- `tauri-app/src-tauri/src/main.rs`: register new command.
- `tauri-app/src/lib/bridges/tauri.ts`: add menu invocation helper (~20 LOC JS).
- `tauri-app/src/lib/views/HomeView.svelte`: attach context menu handler to chart containers.
- `tauri-app/src/lib/views/ValuesView.svelte`: attach context menu handler to value analysis images.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `tauri-plugin-menu` to Cargo.toml and verify it builds.
- [ ] Add menu permission to capabilities/main.json.
- [ ] Implement Rust command: construct popup menu with "Save as PNG" and "Save as SVG" items, return selected action.
- [ ] Register command in main.rs.
- [ ] Add JS bridge helper to invoke popup menu and return selected action.
- [ ] Attach `oncontextmenu` handler to chart containers in HomeView that shows native menu and triggers export.
- [ ] Attach `oncontextmenu` handler to value analysis images in ValuesView.
- [ ] Test on macOS: native menu appears, items trigger correct exports.
- [ ] Test on Linux: verify menu appears (may have Wayland quirks, document any issues).
- [ ] Run `cargo fmt --check`, `cargo clippy`, `npm run lint`, `npm run check` successfully.

### Acceptance Criteria
**Scenario: Right-click chart to save**
GIVEN color analysis results are displayed in HomeView
WHEN the user right-clicks on the polar chart
THEN a native context menu appears with "Save as PNG" and "Save as SVG" options.

**Scenario: Context menu triggers export**
GIVEN the context menu is shown on a chart
WHEN the user selects "Save as PNG"
THEN a native save dialog appears and the chart is saved as PNG.

**Scenario: Graceful fallback**
GIVEN the app is running without Tauri (dev/preview mode)
WHEN the user right-clicks on a chart
THEN the default browser context menu appears (no errors thrown).

### Issues Encountered
{LOC|20}
