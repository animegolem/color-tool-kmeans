---
node_id: AI-IMP-089
tags:
  - IMP-LIST
  - Implementation
  - ui
  - gamut
  - oklab
kanban_status: completed
depends_on: AI-EPIC-017
parent_epic: [[AI-EPIC-017-color-merge-threshold-and-visualization-polish]]
confidence_score: 0.55
date_created: 2026-01-31
date_completed: 2026-02-01
---

# AI-IMP-089-gamut-overlay-toggle

## Add global gamut overlay toggle for polar + Hue × Lightness
Introduce a global toggle that overlays the valid gamut boundary for all polar charts and the Hue × Lightness plot. Done when the toggle is present, consistent across views, and uses low‑opacity rendering.

### Out of Scope
- Changing the underlying color space for Hue × Lightness (stays OKLCH).
- Per‑chart independent toggles (single global toggle only).

### Design/Approach
- Add a global boolean in UI state and expose a single toggle in the Colors tab.
- For polar charts, render the computed gamut outline with low opacity beneath data points.
- For Hue × Lightness, render an OKLCH‑based boundary overlay and label the subtitle as “rendered in OKLCH.”

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`: add `showGamutOverlay` flag.
- `tauri-app/src/lib/views/HomeView.svelte`: add toggle UI and bind to state.
- `tauri-app/src/lib/exports/polar-chart.ts`: draw optional gamut overlay.
- `tauri-app/src/lib/exports/hue-lightness.ts`: draw optional gamut overlay + label tweak.
- `tauri-app/src/lib/views/GraphsView.svelte`: ensure overlay respects mode/labels.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add global `showGamutOverlay` state and UI toggle.
- [x] Render gamut overlay in polar charts when enabled.
- [x] Render OKLCH gamut overlay in Hue × Lightness when enabled.
- [x] Update Hue × Lightness subtitle to “rendered in OKLCH.”
- [x] Validate overlay visibility at typical opacity (e.g., 10–20%).

### Acceptance Criteria
**Scenario:** User wants to see the valid gamut area.
**GIVEN** a loaded image and the Colors tab open.
**WHEN** the user enables the “Show Gamut” toggle.
**THEN** all polar charts and Hue × Lightness show a low‑opacity gamut overlay.

### Issues Encountered
- Overlay sampled from RGB cube edges to keep cost low; if we need fuller coverage, expand sampling density later.
