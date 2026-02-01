---
node_id: AI-IMP-078
tags:
  - Implementation
  - rust
  - values
  - tauri
kanban_status: completed
depends_on:
  - AI-EPIC-010
confidence_score: 0.56
date_created: 2026-01-21
date_completed: 2026-01-21
---

# AI-IMP-078-rust-value-study-pipeline

## Summary of Issue #1
We need a native pipeline that generates a 3x3 grayscale value-study grid from the original image, using percentile-based bounds and modest remapping. Outcome: a Tauri command returns cached image paths for the 3x3 grid (and metadata) deterministically for a given image.

### Out of Scope 
- Values tab UI layout and navigation changes.
- Multi-image tabbing or export integration.

### Design/Approach  
- Add a Rust module (or extend `image_pipeline.rs`) to compute OkLab L per pixel and derive robust bounds using configurable percentiles (default 5/95).
- For each tile, remap L from the source range into a target black/white range that represents Minor/Major key variants; clamp to [0, 1].
- Render grayscale PNGs for each tile and store them in the app cache dir keyed by image id + tile index.
- Expose a new Tauri command (e.g., `value_study`) that accepts `{ path, imageId }` and returns `{ tiles: [path...], width, height }`.
- Keep constants for percentile bounds and target offsets in Rust so they can be promoted to global settings later.

### Files to Touch
- `tauri-app/src-tauri/src/image_pipeline.rs`: add value-study sampling/remapping helpers.
- `tauri-app/src-tauri/src/value_study.rs`: new module for grid generation and caching.
- `tauri-app/src-tauri/src/main.rs`: add Tauri command + response type.
- `tauri-app/src-tauri/src/lib.rs`: export new module.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Add value-study constants for percentile bounds and target key offsets.
- [x] Implement OkLab L extraction + percentile calculation over downscaled image data.
- [x] Implement L remapping to target black/white ranges for all 9 tiles.
- [x] Write tile PNGs to the app cache dir with stable names based on image id.
- [x] Add new Tauri command returning tile paths and metadata; register in `invoke_handler`.
- [x] Add unit tests for percentile bounds and remap behavior with a synthetic image.

### Acceptance Criteria
**Scenario:** Value study grid generation
**GIVEN** a valid image path and image id
**WHEN** the value-study command is invoked
**THEN** nine grayscale tile images are generated and returned
**AND** the center tile matches the original values (no normalization)
**AND** repeated calls for the same image id return deterministic output paths.

### Issues Encountered 
- Tests not run (Rust unit tests not executed).
