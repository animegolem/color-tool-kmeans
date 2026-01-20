# AI-EPIC 
---
node_id: AI-EPIC-008
tags: 
  - EPIC
  - AI
  - compute
  - oklab
  - pipeline
date_created: 2026-01-19
date_completed: 
kanban-status: backlog
AI_IMP_spawned: 
---

# AI-EPIC-008-oklab-golden-path-compute-pipeline

## Problem Statement/Feature Scope 
The current pipeline exposes multiple color spaces and tuning knobs that are confusing for non-technical users and yield inconsistent perceptual results. Clustering and plotting use mixed spaces (LAB/HSV/HSL), so outputs are harder to interpret and less faithful to how the image "felt."

## Proposed Solution(s) 
- Standardize clustering on OKLab for perceptual distances, with OKLCH derived for plotting and ordering.
- Convert centroids to display sRGB via chroma compression (keep L and h fixed, reduce C until in-gamut).
- Replace discrete sampling knobs with a single quality control that maps to stride, max samples, and max dimension.
- Add an "ignore top N clusters" post-filter to handle dominant backgrounds (letterbox, flat fills).
- Run a final full assignment after k-means convergence to stabilize counts/shares.
- Simplify the compute contract to emit OKLab/OKLCH and display RGB only, removing multi-space toggles.

## Path(s) Not Taken 
- Keep multiple color-space toggles (RGB/HSL/YUV/LAB/LUV) in the user-facing flow.
- Adopt heavier color models (CAM16-UCS/JzAzBz) for the first pass.
- Clamp RGB channels directly instead of chroma compression.

## Success Metrics 
1. Users can run analysis with only 4 controls (clusters, quality, ignore-top-N, symbol size) and no color-space toggle.
2. Cluster colors remain in-gamut with minimal hue shift compared to RGB clamping.
3. Deterministic results across runs for identical inputs and parameters.
4. Performance: K up to 300 completes within current native baseline on 2k images.

## Requirements

### Functional Requirements
- [ ] FR-1: Decode pixels to linear sRGB and build OKLab samples for clustering.
- [ ] FR-2: Apply sampling quality settings (stride/max samples/max dimension) through a unified control.
- [ ] FR-3: Run k-means in OKLab and perform a final full assignment pass for stable counts.
- [ ] FR-4: Convert centroids OKLab -> OKLCH (h, C, L) for plotting/order metadata.
- [ ] FR-5: Convert centroids to display sRGB via chroma compression; clamp only as a fallback.
- [ ] FR-6: Sort clusters by count, compute share, and return OKLab/OKLCH + display RGB in the response.
- [ ] FR-7: Support ignore-top-N filtering on cluster outputs for visualization/export use.
- [ ] FR-8: Remove multi-space compute toggles and legacy conversion paths from the analysis contract.
- [ ] FR-9: Update compute CLI/bench paths to the same OKLab pipeline or mark them deprecated.

### Non-Functional Requirements 
- [ ] NFR-1: Maintain or improve current native performance at default quality settings.
- [ ] NFR-2: Output determinism for the same input and parameters.
- [ ] NFR-3: Offline-only operation; no runtime network calls.
- [ ] NFR-4: Memory use remains bounded for large images (downscale + sampling caps).

## Implementation Breakdown 

### Planned Tickets
- AI-IMP-070: OKLab/OKLCH + chroma compression utilities in `tauri-app/src-tauri/src/color.rs`. (completed)
- AI-IMP-071: Sampling pipeline updates (quality mapping, OKLab sampling, final assignment). (completed)
- AI-IMP-072: Compute contract update + response schema changes for OKLab/OKLCH fields. (in progress)
- AI-IMP-073: Bench/CLI alignment or deprecation of multi-space modes. (planned)

### Completed Tickets
