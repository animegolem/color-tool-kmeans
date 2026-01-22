# AI-EPIC 
---
node_id: AI-EPIC-010
tags: 
  - EPIC
  - AI
  - ui
  - values
  - tauri
date_created: 2026-01-21
date_completed: 2026-01-21
kanban-status: completed
AI_IMP_spawned: AI-IMP-078, AI-IMP-079
---

# AI-EPIC-010-values-tab-and-value-study-grid

## Problem Statement/Feature Scope 
Artists need a fast, reliable way to read value structure without the cognitive overhead of chroma or clustering. The current UI has a vestigial Graphs tab, but no dedicated value study. Users want a dedicated values panel that shows the original image and a grid of value-key variants to compare major/minor key relationships.

## Proposed Solution(s) 
- Add a new Values tab that shows the original image above a 3x3 value-study grid.
- Generate the value grid from the original image only (no k-means), using OkLab L converted to grayscale.
- Compute the grid on demand when the Values tab is opened, then cache results per image id for quick toggling.
- Use percentile-based bounds for robust value range estimation with modest lift/contrast adjustments per tile.
- Remove the unused Graphs tab to keep navigation focused.

## Path(s) Not Taken 
- Using k-means cluster centers to drive the value grid.
- Posterized or toon-shaded value studies.
- Rendering the grid solely in the renderer without a Rust pipeline.

## Success Metrics 
1. Within one tab switch, users can view the original image plus a 3x3 values grid for the current image.
2. Values output is deterministic for a given image and settings.
3. Graphs tab is removed with no navigation regressions or dead links.


## Requirements

### Functional Requirements
- [ ] FR-1: Add a Values tab that displays the original image above a 3x3 value-study grid.
- [ ] FR-2: Value grid is derived from the original image only and rendered as grayscale.
- [ ] FR-3: Center tile shows the original values (no normalization).
- [ ] FR-4: Value grid is computed on demand when the Values tab is selected.
- [ ] FR-5: Cache value grids per image id to avoid recompute on tab switching.
- [ ] FR-6: Remove the unused Graphs tab from the UI navigation.

### Non-Functional Requirements 
- [ ] NFR-1: Value grid computation remains deterministic for identical inputs.
- [ ] NFR-2: No network access or external services used at runtime.
- [ ] NFR-3: UI labels for Major/Minor key are rendered in the UI, not baked into exported images.

## Implementation Breakdown 

### Planned Tickets

### Completed Tickets
- AI-IMP-078: Rust value-study pipeline + Tauri command returning cached grid paths. (completed)
- AI-IMP-079: Values tab UI + wiring + Graphs tab removal. (completed)
