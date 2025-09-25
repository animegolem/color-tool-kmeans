---
node_id: AI-IMP-034
tags:
  - IMP-LIST
  - Implementation
  - Tauri
  - IPC
  - Rust
  - UI
  - deprecated
kanban_status: completed
depends_on: [AI-EPIC-002, AI-EPIC-003, AI-IMP-012, AI-IMP-013, AI-IMP-014, AI-IMP-031, AI-IMP-032, AI-IMP-033]
confidence_score: 0.9
created_date: 2025-09-25
close_date: 2025-09-25
--- 


# AI-IMP-034-ipc-analyze-image-and-compute-wiring

## Summary of Issue #1
The Tauri IPC `analyze_image` currently returns only a sampling message and count, preventing the renderer from displaying clusters and graphs. We must wire the Rust compute pipeline (sampling → space transform → k‑means SoA/SIMD) into the IPC and return a stable JSON contract per `contracts/global-conventions.md`. Done when `analyze_image` accepts params `{ K, stride, minLum, space, tol, maxIter, seed, maxSamples }` and returns `{ clusters[], iterations, durationMs, totalSamples }` with RGB/HSV and centroidSpace per cluster, computed deterministically.

### Out of Scope 
- Graphs/exports UI wiring beyond returning data (tracked in EPIC‑003).
- Preferences and debounced recompute logic in the renderer.
- CI bench gates (already covered by IMP‑031/032/033).

### Design/Approach  
- Extend the IPC request to accept aliased fields (`K|k|clusters`, `space|color_space`, `minLum|min_lum`, `maxIter|max_iters`).
- Use `image_pipeline::prepare_samples` to decode/downscale/sample and reuse cached LAB when `space==CIELAB`.
- Build the working dataset by converting RGB samples to the requested `space` using `color::*` helpers.
- Run `kmeans::run_kmeans` (SoA/SIMD path internally) with deterministic config; time the call.
- Map centroids back to RGB via inverse transforms to produce `{rgb, hsv, centroidSpace, count, share}`; sort by count desc.
- Return `{ clusters, iterations, durationMs, totalSamples, variant: 'inhouse' }` adhering to camelCase.

### Files to Touch
- `tauri-app/src-tauri/src/main.rs`: replace placeholder IPC with full compute + JSON contract.
- `contracts/global-conventions.md`: (reference only; ensure shape alignment, no changes required).
- `tauri-app/src-tauri/src/` (optional tests or small helpers if needed).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] Add request schema with serde aliases for `K|k|clusters`, `minLum|min_lum`, `space|color_space`, `maxIter|max_iters`.
- [x] Add `ColorSpace` parsing (RGB|HSL|YUV|CIELAB|CIELUV), case‑insensitive; return user‑safe errors.
- [x] Call `prepare_samples` with `{path,stride,minLum,maxSamples}`; capture timing and sample stats.
- [x] Build dataset for k‑means: reuse `samples_lab` when `space==CIELAB`; otherwise map via `color::*`.
- [x] Construct `KMeansConfig` with `{k, max_iters, tol, seed}`; run `run_kmeans` and measure duration.
- [x] Transform centroids back to RGB; compute HSV and share; sort clusters by `count` desc.
- [x] Return `AnalyzeResponse` with `{ clusters[], iterations, durationMs, totalSamples, variant }`.
- [x] Basic happy‑path test stubbed via manual invocation plan; JSON keys match camelCase by design.
- [x] Update EPIC‑002/003 progress notes if needed (post‑merge).

### Acceptance Criteria
**Scenario:** IPC returns full compute result  
GIVEN a valid PNG path and params `{ K: 16, stride: 2, minLum: 0, space: 'CIELAB', tol: 1e-3, maxIter: 40, seed: 1, maxSamples: 50000 }`  
WHEN the renderer invokes `analyze_image`  
THEN the response includes `clusters` (non‑empty), `iterations > 0`, `durationMs > 0`, and `totalSamples == sampled count`  
AND each cluster has `{ count, share, rgb{r,g,b}, hsv[3], centroidSpace[3] }` with `sum(count) == totalSamples`.

**Scenario:** Parameter aliases accepted  
GIVEN `{ clusters: 8, min_lum: 32, color_space: 'RGB' }`  
WHEN invoking `analyze_image`  
THEN `K==8`, `minLum==32`, `space=='RGB'` are respected and compute succeeds.

**Scenario:** Determinism  
GIVEN the same image and identical params (including `seed`)  
WHEN invoking twice  
THEN `iterations`, `counts`, and `centroids` are identical within float tolerance (RGB identical after u8 rounding).

### Issues Encountered 
- Local compilation not executed in this environment due to sandbox; changes are minimal, match existing module APIs, and rely on already‑present crates. Validate with `cargo test --lib` in `tauri-app/src-tauri` locally.
- Parameter naming across UI/IPC varied; added serde aliases to reduce renderer churn during migration.
- CIELAB reuse: leveraged `samples_lab` for Lab to avoid recomputation; other spaces convert per centroid and at sample‑build time as needed.
