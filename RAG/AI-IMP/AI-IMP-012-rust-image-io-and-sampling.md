---
node_id: AI-IMP-012
tags:
  - IMP-LIST
  - Implementation
  - Rust
  - Image-IO
  - Sampling
kanban_status: planned
depends_on: [AI-EPIC-002-tauri_rust_compute_pivot, AI-IMP-011]
confidence_score: 0.85
created_date: 2025-09-21
close_date:
--- 

# AI-IMP-012-rust-image-io-and-sampling

## Summary of Issue #1
The compute core needs a fast, deterministic pipeline to decode images and produce sampled RGB buffers for clustering. Scope: Rust crate with image decode (PNG/JPEG/WebP), optional resize, stride + reservoir sampling, and luma filtering (minLum). Outcome: function `prepare_samples(path, params) -> Vec<[u8;3]>` with counts and timing.

### Out of Scope 
- Color‑space transforms and k‑means; IPC wiring; UI preview scaling.

### Design/Approach  
- Use `image` crate for decode; guard large images with `fast_image_resize` for optional downscale before sampling.
- Implement luma (BT.709) filter; stride sampling; reservoir cap `max_samples` with seeded RNG (SmallRng) for determinism.
- Return compact `Vec<[u8;3]>` and metadata {width,height,total_pixels,sampled,ms}.

### Files to Touch
- `tauri-app/src-tauri/crates/core/src/lib.rs` (new crate or module).
- `src-tauri/Cargo.toml` dependencies: image, fast_image_resize, rand, anyhow, thiserror.
- `tests/image_sampling.rs` (Rust tests with small fixtures).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Add core crate/module; set up Cargo with release profile (LTO=thin).
- [ ] Implement decode supporting PNG/JPEG/WebP; reject unsupported types with clear error.
- [ ] Implement optional downscale by long edge limit (config param).
- [ ] Implement stride sampling (≥1) and BT.709 minLum filter.
- [ ] Implement reservoir sampling with seeded RNG and `max_samples`.
- [ ] Return sampled `Vec<[u8;3]>` + metadata struct.
- [ ] Unit tests: tiny fixtures, deterministic sample counts with fixed seed.
- [ ] Bench (criterion) optional: time decode+sample for a test image.

### Acceptance Criteria
**Scenario: Deterministic sampling**
GIVEN a fixed image and seed
WHEN sampling with stride=2, max_samples=100k, minLum=20
THEN the function returns identical sample counts and first N RGB triplets across runs.

### Issues Encountered 
To be filled during implementation.

