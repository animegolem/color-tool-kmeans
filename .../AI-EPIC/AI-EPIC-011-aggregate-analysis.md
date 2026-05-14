# AI-EPIC
---
node_id: AI-EPIC-011
tags:
  - EPIC
  - AI
  - analysis
  - multi-image
  - batch
date_created: 2026-01-22
date_completed:
kanban_status: planned
depends_on:
  - AI-EPIC-010
AI_IMP_spawned:
  - AI-IMP-133
  - AI-IMP-134
  - AI-IMP-135
  - AI-IMP-136
  - AI-IMP-137
  - AI-IMP-139
  - AI-IMP-141
  - AI-IMP-142
  - AI-IMP-143
---

# AI-EPIC-011-aggregate-analysis

## Problem Statement/Feature Scope

When analyzing color across multiple reference images (e.g., frames from an episode, paintings by the same artist, scene references), users need to see the combined palette. Currently each image is analyzed independently with no cross-image view. Users working with color scripts, art direction references, or comparative studies must mentally combine separate analyses.

## Proposed Solution(s)

Add a **"Batch"** view accessible from the left nav that enables multi-image color analysis:

1. **Pin toggle in media bucket** — Users pin images from the sidebar across any view to build a batch analysis set (max 16). Pin state persists across view switches.
2. **Transparent-canvas grid composite** — A new Rust `compose_grid` command stitches pinned images into a single RGBA PNG with transparent padding. The existing `analyze_image` backend (which already skips α=0 pixels) analyzes the composite with zero changes to the k-means pipeline.
3. **Batch results view** — Three-panel layout matching reference designs: source grid | polar chart | palette strip, with histogram and hue×lightness scatter below.
4. **Export** — Reuses the existing `composeColorStudy` compositor with the grid composite as the source-image tile.
5. **Right-click context menus** on media bucket items for frame capture (video → image) and direct export.

## Path(s) Not Taken

- **Centroid meta-clustering** (original EPIC-011 concept: k-means on combined centroids). Loses pixel-level distribution, introduces two-stage artifacts. May revisit as a complementary "common threads" toggle.
- **Multi-path backend command** (analyze_images accepting Vec\<path\>). Provides fairer per-image weighting but requires more backend work for equivalent visual result. Deferred as enhancement if resolution-mixing becomes an issue.
- **Auto-analyze on pin change**. Manual "Analyze" button chosen — compositing + analysis may take 2-5s for large sets.
- **Values analysis** (range finder, histogram, notan) for batch composites. Notan/neutral preview are spatially meaningless for grid composites. Deferred.
- **Comparison mode** (two-image differential). Different UX paradigm — separate future EPIC.

## Success Metrics

1. User can pin 2-16 images from the media bucket and produce a combined color analysis in the Batch view.
2. Analysis results (polar chart, histogram, hue×lightness) correctly reflect the combined pixel data from all pinned images, with no white-space contamination from grid gaps.
3. Export produces a composite PNG matching the reference image format (grid + charts).
4. Pin toggle is accessible from all views without disrupting existing single-image workflows.

## Requirements

### Functional Requirements

- [ ] FR-1: "Batch" tab visible in left nav at all times, rendering a BatchView component.
- [ ] FR-2: Media bucket items display a pin toggle icon; clicking toggles inclusion in the batch set.
- [ ] FR-3: Pinned items show visual indicator (star badge + accent border) across all views.
- [ ] FR-4: Pin count displayed at bottom of media bucket with "Clear pins" action.
- [ ] FR-5: Raw video entries (no frame extraction) are excluded from pinning (dimmed pin icon).
- [ ] FR-6: BatchView shows empty state when < 2 images pinned, with guidance text.
- [ ] FR-7: BatchView shows live CSS grid preview of pinned images before analysis.
- [ ] FR-8: "Analyze" button triggers Rust grid composition followed by k-means analysis.
- [ ] FR-9: Results display in three-panel layout: grid | polar chart | palette strip, with histogram + hue×lightness below.
- [ ] FR-10: All result charts are zoomable via existing ZoomOverlay.
- [ ] FR-11: "Export Composite" produces PNG via existing composeColorStudy pipeline.
- [ ] FR-12: Changing pins after analysis clears results and shows updated selection state.
- [ ] FR-13: Right-click context menu on bucket items with "Export..." option.
- [ ] FR-14: Right-click on video entries includes "Add frame to media bucket" option.
- [ ] FR-15: Spinner with >150ms fade-in threshold during compositing + analysis (match HomeView pattern).

### Non-Functional Requirements

- [ ] NFR-1: Grid composition + analysis completes within 5s for 16 images at quality=2.
- [ ] NFR-2: Composite PNG uses transparent background — no pixel contamination from grid gaps.
- [ ] NFR-3: Pin state survives view switches within a session (not required to persist across app restart in MVP).
- [ ] NFR-4: New files stay under 600 LOC target per the project's SIZE WATCH conventions.

## Implementation Breakdown

### Planned Tickets

- [[AI-IMP-133]] — Rust `compose_grid` command + frontend bridge
- [[AI-IMP-134]] — Multi-analysis store (pins, composite, result state)
- [[AI-IMP-135]] — MediaBucket pin toggle UI + right-click context menus
- [[AI-IMP-136]] — BatchView (empty/selection/results states, three-panel layout)
- [[AI-IMP-137]] — Batch export + deferred scene detection ticket (IMP scope only)
- [[AI-IMP-139]] — BatchView cleanup: layout restructure, lifecycle fixes, UI polish
- [[AI-IMP-141]] — BatchView chart controls, auto-pin, column alignment
- [[AI-IMP-142]] — MediaBucket pin UX: shift-select range pinning, pushpin icon
- [[AI-IMP-143]] — Remove vestigial header bar file label, Clear, Upload buttons

### Completed Tickets

- [[AI-IMP-133]] — Rust `compose_grid` command + frontend bridge
- [[AI-IMP-134]] — Multi-analysis store (pins, composite, result state)
- [[AI-IMP-135]] — MediaBucket pin toggle UI + right-click context menus
- [[AI-IMP-136]] — BatchView (empty/selection/results states, three-panel layout)
- [[AI-IMP-139]] — BatchView cleanup: layout, lifecycle, context menu removal, pin icon

## Notes

**Key architectural insight:** `image_pipeline.rs:161` already skips pixels with `α == 0`. Compositing images onto a transparent RGBA canvas means grid gaps are automatically excluded from sampling — no backend analysis changes required.

**Design document:** Full design discussion with ASCII layouts, trade-off analysis, and video workflow exploration is preserved in the plan file at `.claude/plans/cozy-churning-cherny.md`.
