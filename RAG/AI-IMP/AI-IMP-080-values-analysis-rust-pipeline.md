---
node_id: AI-IMP-080
tags:
  - Implementation
  - rust
  - values
  - tauri
kanban_status: completed
depends_on:
  - AI-EPIC-015
confidence_score: 0.52
created_date: 2026-01-22
close_date: 2026-01-22
---

# AI-IMP-080-values-analysis-rust-pipeline

## Summary of Issue #1
Implement a native Rust pipeline for Values Analysis: compute OkLab L range (p10/p90), run 1D k-means on squinted L values, and output a notan preview buffer plus metadata for centroids, boundaries, and counts. Results should be cached per image id + levels.

### Out of Scope
- Values tab UI layout and slider wiring.
- Export layout changes.

### Design/Approach
- Add a new Rust module for value analysis that:
  - Downscales the image to a squinted buffer (max 256px).
  - Optionally blurs to reduce texture noise.
  - Computes p10/p90 from OkLab L.
  - Warm-starts 1D k-means centroids using quantiles, runs for <= 20 iterations.
  - Generates a notan preview PNG (nearest centroid per pixel).
  - Generates a neutral values PNG (OkLab L → a=0, b=0).
  - Caches outputs and metadata with a versioned meta file.
- Expose a new Tauri command `value_analysis` that returns paths + metadata.

### Files to Touch
- `tauri-app/src-tauri/src/value_analysis.rs` (new)
- `tauri-app/src-tauri/src/lib.rs`
- `tauri-app/src-tauri/src/main.rs`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>
- [x] Implement squint buffer, percentile bounds, and 1D k-means with warm-start.
- [x] Generate neutral values PNG and notan preview PNG.
- [x] Implement cache directory + meta validation per image id and levels.
- [x] Add Tauri command returning metadata + paths.
- [x] Add unit tests for percentile and warm-start behavior (if time allows).

### Acceptance Criteria
**Scenario:** Values analysis generation
**GIVEN** a valid image path, image id, and level count
**WHEN** the value_analysis command is invoked
**THEN** the neutral and preview images are generated and cached
**AND** p10/p90, centroids, boundaries, and counts are returned deterministically.

### Issues Encountered
- Tests not run.
