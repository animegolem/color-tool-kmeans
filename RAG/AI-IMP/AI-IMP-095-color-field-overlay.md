---
node_id: AI-IMP-095
tags:
  - IMP-LIST
  - Implementation
  - ui
  - polar
  - gamut
  - overlay
  - oklch
kanban_status: planned
depends_on:
parent_epic: [[AI-EPIC-019-polar-field-and-merge-stability]]
confidence_score: 0.52
date_created: 2026-02-02
date_completed:
---

# AI-IMP-095-color-field-overlay

## Replace gamut overlay with a color field slice and rename toggle
The current "gamut overlay" is a neutral gray mask that does not communicate the intended color-space context. We need a low-opacity color field behind points, derived from a chosen lightness slice, and rename the toggle to match the intent. Done when the overlay resembles a filled color space guide like the reference examples.

### Out of Scope
- Full 3D gamut visualization.
- Per-pixel dynamic lighting or value-based overlays beyond a single L slice.

### Design/Approach
- Compute a default lightness slice from image-weighted mean L (OKLCH/OKHSV).
- Render a low-density grid of background dots colored by the selected mode.
- For HSV, use V=1 (or image-weighted mean V if justified).
- Rename UI toggle from "Gamut overlay" to "Color field" (or similar).
- Cache computed field per mode + L slice to avoid performance regressions.

### Files to Touch
- `tauri-app/src/lib/exports/polar-chart.ts`: generate color field background.
- `tauri-app/src/lib/views/HomeView.svelte`: rename toggle + UI copy.
- `tauri-app/src/lib/stores/ui.ts`: rename/store flag if needed.
- `tauri-app/src/lib/views/ExportsView.svelte`: match export behavior.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add color-field background renderer for OKLCH/OKHSV/HSV.
- [ ] Compute image-weighted mean lightness from clusters for OKLCH/OKHSV slice.
- [ ] Rename toggle label and store flag to "Color field" (or agreed text).
- [ ] Ensure exports honor the same field/overlay setting.
- [ ] Validate performance on large cluster sets.

### Acceptance Criteria
**Scenario:** Color field improves readability.
**GIVEN** a small number of clusters.
**WHEN** the color field toggle is enabled.
**THEN** a low-opacity filled color space guide appears behind points, matching the selected mode.

### Issues Encountered
{LOC|20}
