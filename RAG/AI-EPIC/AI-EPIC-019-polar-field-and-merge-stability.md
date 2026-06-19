# AI-EPIC
---
node_id: AI-EPIC-019
tags:
  - EPIC
  - AI
  - color-science
  - kmeans
  - oklch
  - visualization
  - ui
  - merge
  - gamut
  - axis
  - polish
date_created: 2026-02-02
date_completed: 2026-02-02
kanban_status: completed
AI_IMP_spawned: AI-IMP-093, AI-IMP-094, AI-IMP-095
---

# AI-EPIC-019-polar-field-and-merge-stability

## Problem Statement/Feature Scope
Artists are seeing unstable merge behavior (threshold chaining that collapses many clusters into one), clipped/awkward axis labels in the polar charts, and a confusing "gamut" overlay that reads as a gray mask instead of a helpful reference field. The current UI makes it hard to interpret small cluster sets and results can be misleading when merge threshold is applied.

## Proposed Solution(s)
1) Replace the current merge logic with a stability-preserving approach (e.g., complete-linkage with radius guards) to prevent chain-merging while preserving expected cluster count reductions. 2) Move axis labels inside the polar ring to avoid clipping on all chart sizes. 3) Replace the "gamut" overlay with a low-opacity **color field** background based on OKLCH/OKHSV/HSV, using an image-weighted mean lightness as the default slice. Rename the toggle to match the visual intent (e.g., "Color field" or "Color space guide").

## Path(s) Not Taken
- Keep single-linkage union-find merging (causes chaining collapse).
- Keep the current gray mask overlay (not representative of the underlying color space).
- Move axis labels further out (still clips on smaller panels).

## Success Metrics
- Merge threshold no longer collapses large cluster sets at small thresholds (verified on 2k cluster test image).
- Polar axis labels are consistently readable and do not clip in standard panel sizes.
- Color field overlay improves interpretability for small cluster counts (qualitative validation by artist).

## Requirements

### Functional Requirements
- [x] FR-1: Implement a merge strategy that prevents transitive "chaining" collapse (e.g., complete-linkage with radius guards).
- [x] FR-2: Preserve cluster counts and centroid weighting when merges occur.
- [x] FR-3: Move polar axis labels inside the ring so they never clip.
- [x] FR-4: Replace the "gamut" overlay with a color field slice per mode (OKLCH/OKHSV/HSV). (Removed after review)
- [x] FR-5: Use image-weighted mean lightness as the default slice for OKLCH/OKHSV color field. (Removed after review)
- [x] FR-6: Rename the toggle to reflect the color field intent. (Removed after review)

### Non-Functional Requirements
- [x] NFR-1: Color field rendering must not add noticeable UI lag at common cluster sizes. (Removed after review)
- [x] NFR-2: Merge behavior remains deterministic for identical inputs.
- [x] NFR-3: All features operate offline with no external dependencies.

## Implementation Breakdown
Completed: AI-IMP-093, AI-IMP-094, AI-IMP-095.
