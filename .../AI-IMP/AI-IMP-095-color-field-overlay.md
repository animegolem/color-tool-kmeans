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
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-019-polar-field-and-merge-stability]]
confidence_score: 0.52
date_created: 2026-02-02
date_completed: 2026-02-02
---

# AI-IMP-095-color-field-overlay

## Replace gamut overlay with a color field slice and rename toggle
The current "gamut overlay" is a neutral gray mask that does not communicate the intended color-space context. We explored a low-opacity color field behind points derived from a chosen lightness slice, but the result was misleading and not useful. The feature has been removed entirely.

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

- [x] Add color-field background renderer for OKLCH/OKHSV/HSV. (Removed after review)
- [x] Compute image-weighted mean lightness from clusters for OKLCH/OKHSV slice. (Removed after review)
- [x] Rename toggle label and store flag to "Color field" (or agreed text). (Removed after review)
- [x] Ensure exports honor the same field/overlay setting. (Removed after review)
- [x] Validate performance on large cluster sets. (Removed after review)

### Acceptance Criteria
**Scenario:** Color field proved misleading.
**GIVEN** small cluster sets.
**WHEN** the color field overlay is enabled.
**THEN** the field reads as misleading and is removed from the product.

### Issues Encountered
- Color field based on fixed/weighted OKLCH lightness produced sparse, misleading overlays; feature removed by decision.
