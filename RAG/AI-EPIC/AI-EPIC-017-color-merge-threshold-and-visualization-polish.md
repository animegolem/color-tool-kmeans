# AI-EPIC
---
node_id: AI-EPIC-017
tags:
  - EPIC
  - AI
  - ui
  - colors
  - video
  - oklab
  - polar
  - gamut
  - kmeans
date_created: 2026-01-31
date_completed: 2026-02-01
kanban_status: completed
AI_IMP_spawned: AI-IMP-086, AI-IMP-087, AI-IMP-088, AI-IMP-089
---

# AI-EPIC-017-color-merge-threshold-and-visualization-polish

## Problem Statement/Feature Scope
Artists need a way to collapse overly granular k-means results into fewer perceptually distinct colors without constantly changing K. Video scrubbing currently causes a layout jump that disrupts analysis. The OKLCH polar view uses a normalized circle that can mislead users about the actual sRGB gamut, and the current HSL polar uses legacy HSL where HSV/HSB is more aligned with artist expectations. We need clearer polar graph semantics and optional gamut overlays to set visual expectations for all color-space plots.

## Proposed Solution(s)
- Add a post-processing “Color Merge Threshold (ΔE Oklab)” slider to merge close k-means centroids into weighted clusters without changing the K setting.
- Preserve scroll position during video scrubbing so the page no longer jumps when the frame updates.
- Update polar visualizations: replace the OKLCH circle with a gamut-bounded shape derived from RGB cube edges in OKLab a/b, add an OKHSV-based polar option, and switch the existing HSL polar to HSV. Ensure axis labels are correct per mode, the polar circle fills the card more effectively, and bubble scaling does not resize the chart radius.
- Add a global “Show Gamut” toggle to overlay low-opacity gamut extents on all polar graphs and the Hue × Lightness plot, with the Hue × Lightness label clarifying OKLCH.

## Path(s) Not Taken
- Replacing k-means with threshold-first clustering (order-dependent and less stable).
- Forcing OKHSV everywhere (Hue × Lightness remains OKLCH for continuity).

## Success Metrics
1. A test image with K=12 and a merge threshold of ~0.04 collapses to ≤5 clusters without manual K changes.
2. Video scrubbing no longer resets scroll position on the Colors tab during repeated frame updates.
3. Polar graph modes show correct axis labels and visual gamut boundaries match the chosen mode.
4. Gamut overlay toggle renders across all 4 visualizations without noticeable frame-time regressions.

## Requirements

### Functional Requirements
- [x] FR-1: The system shall expose a Color Merge Threshold slider on the Colors tab.
- [x] FR-2: The analysis pipeline shall merge centroids within the threshold using Oklab distance and weighted averages.
- [x] FR-3: The UI shall reflect merged clusters in all graphs and exports.
- [x] FR-4: Video scrubbing shall preserve current scroll position during frame refresh.
- [x] FR-5: The OKLCH polar view shall render a gamut-bounded shape derived from RGB cube edges.
- [x] FR-6: The HSL polar mode shall be replaced with HSV, and a separate OKHSV polar option added.
- [x] FR-7: Axis labels shall update correctly for each polar mode; the polar circle shall fill the card more effectively without changing data mapping; bubble scaling shall not resize the chart radius.
- [x] FR-8: A global gamut overlay toggle shall apply to all polar charts and Hue × Lightness.

### Non-Functional Requirements
- [x] NFR-1: Merge threshold computation must be deterministic for identical inputs.
- [x] NFR-2: Merge and overlay rendering must keep UI responsive for K up to 2000.
- [x] NFR-3: Gamut overlays must be low-opacity and not occlude cluster data.
- [x] NFR-4: All changes must remain fully offline and compatible with current export pipeline.

## Implementation Breakdown

### Planned Tickets
- AI-IMP-086: Color merge threshold (Oklab) post-process
- AI-IMP-087: Video scrub scroll-jump fix
- AI-IMP-088: Polar graph model updates (OKLCH gamut shape + OKHSV + HSV swap)
- AI-IMP-089: Global gamut overlay toggle for polar + Hue × Lightness

### Completed Tickets
- AI-IMP-086: Color merge threshold (Oklab) post-process
- AI-IMP-087: Video scrub scroll-jump fix
- AI-IMP-088: Polar graph model updates (OKLCH gamut shape + OKHSV + HSV swap)
- AI-IMP-089: Global gamut overlay toggle for polar + Hue × Lightness
