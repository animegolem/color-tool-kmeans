---
node_id: AI-IMP-088
tags:
  - IMP-LIST
  - Implementation
  - ui
  - polar
  - oklab
  - okhsv
kanban_status: in_progress
depends_on: AI-EPIC-017
confidence_score: 0.58
created_date: 2026-01-31
close_date:
---

# AI-IMP-088-polar-graph-model-updates

## Update polar graph models to reduce gamut misread
Replace the OKLCH “full circle” with a gamut-bounded shape, add OKHSV polar mode, and convert the HSL polar to HSV. Also expand the polar chart circle to better fill its frame without changing data mapping. Done when the graph modes render with correct labels, the legacy misleading circle is removed, and the circle fills the card more effectively.

### Out of Scope
- Full Okhsl/Okhsv color picker UI.
- Replacing Hue × Lightness model (remains OKLCH).

### Design/Approach
- Build an OKLCH gamut boundary by sampling the RGB cube edges and mapping to Oklab a/b.
- Use moderate subdivision (approx 15–20 steps per edge) to capture perceptual curvature without hull artifacts.
- Add OKHSV polar mapping based on the Bottosson reference (hue angle + perceptual saturation).
- Replace HSL polar calculations with HSV to align with artist expectations; update axis labels accordingly.
- Increase effective chart radius and reduce padding so the polar circle fills the card while keeping data normalization intact.
- Decouple symbolScale from the chart radius so the slider only affects bubble sizes.

### Files to Touch
- `tauri-app/src/lib/exports/polar-chart.ts`: add model types + updated mapping + gamut outline + sizing changes.
- `tauri-app/src/lib/views/HomeView.svelte`: UI toggle options/labels for polar modes.
- `tauri-app/src/lib/views/GraphsView.svelte`: ensure labels and data attributes align.
- `tauri-app/src/lib/stores/ui.ts`: store selected polar mode.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Define a polar mode enum (OKLCH gamut, OKHSV, HSV) and update UI toggles.
- [x] Implement OKLCH gamut outline from RGB cube edge samples (15–20 steps per edge).
- [x] Implement OKHSV mapping for polar points (per Bottosson).
- [x] Replace HSL polar with HSV mapping and update labels.
- [x] Expand effective radius and adjust padding so the circle fills the frame without changing mapping.
- [x] Ensure symbolScale only changes bubble size (no radius growth/shrink).
- [x] Update SVG data attributes for clarity (`data-color-model`).
- [ ] Validate with a color wheel image and compare expected distribution.

### Acceptance Criteria
**Scenario:** User switches polar modes on the Colors tab.
**GIVEN** a loaded image.
**WHEN** the user selects OKHSV or HSV modes.
**THEN** the points render in the correct polar mapping with proper axis labels.
**AND** the OKLCH mode displays a gamut‑bounded outline instead of a full circle.
**AND** the polar circle visibly fills the card more than the prior version without distorting data placement.
**AND** changing symbol scale only affects bubble size, not chart radius.

### Issues Encountered
- OKHSV mode currently normalizes OKLCH chroma by per‑hue gamut outline; revisit if we want a full OKHSV formula.
