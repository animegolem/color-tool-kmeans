# AI-EPIC
---
node_id: AI-EPIC-015
tags:
  - EPIC
  - AI
  - values
  - tauri
  - ui
date_created: 2026-01-22
date_completed: 2026-01-22
kanban_status: completed
depends_on:
  - AI-EPIC-010
AI_IMP_spawned:
  - AI-IMP-080
  - AI-IMP-081
  - AI-IMP-082
---

# AI-EPIC-015-values-analysis-squint-and-range

## Problem Statement/Feature Scope
The current values grid is deterministic but does not deliver the clarity artists want for compositional value reading. We need a focused Values analysis view that exposes absolute dynamic range at a glance and a squinted, posterized value-massing preview that reflects how the values are used in the image.

## Proposed Solution(s)
- Replace the values grid with a "Values Analysis" layout: Original + Neutral Values, an absolute range bar, and a notan-style preview driven by 1D clustering on OkLab L.
- Compute analysis in Rust on a squinted buffer (downscaled + optional blur) for stable, fast results.
- Provide an interactive "Levels" slider (2–5) to adjust the number of value masses.
- Add a new export that captures the Values Analysis view (no title/subtitle, just labels and visuals).

## Path(s) Not Taken
- Keep the 3x3 major/minor key grid as the primary view.
- Derive values from k-means chroma clusters (not the goal).

## Success Metrics
1. Users can interpret dynamic range (low/high key, contrast) at a glance from the range bar.
2. Notan preview clearly communicates value masses for k=2–5 with predictable behavior.
3. Values Analysis export matches the on-screen layout and stays offline-safe.

## Requirements

### Functional Requirements
- [ ] FR-1: Values tab shows Original + Neutral Values (OkLab L grayscale) for the selected image.
- [ ] FR-2: Range bar uses p10–p90 bounds from the squinted buffer and renders a fixed 5-step scale with labels.
- [ ] FR-3: Levels slider (2–5) recomputes centroids, boundaries, counts, and the notan preview.
- [ ] FR-4: Notan preview snaps pixels to nearest centroid from 1D k-means on OkLab L.
- [ ] FR-5: Values analysis results are cached per image id and per level count.
- [ ] FR-6: Remove or hide the legacy values grid UI and export entry.
- [ ] FR-7: Add a Values Analysis export that matches the tab layout (tan background).

### Non-Functional Requirements
- [ ] NFR-1: Analysis is deterministic for identical inputs and settings.
- [ ] NFR-2: Analysis completes quickly on typical images (downscaled buffer).
- [ ] NFR-3: No network access or external services at runtime.

## Implementation Breakdown

### Planned Tickets

### Completed Tickets
- AI-IMP-080: Rust values analysis pipeline (p10/p90, 1D k-means, notan buffer).
- AI-IMP-081: Values Analysis UI (range bar, slider, ruler, preview) + caching.
- AI-IMP-082: Values Analysis export layout.

## Notes
- This epic supersedes AI-EPIC-010's grid-focused Values view, but keeps the Original + Neutral comparison.
