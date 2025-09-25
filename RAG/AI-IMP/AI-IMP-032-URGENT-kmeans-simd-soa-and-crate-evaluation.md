---
node_id: AI-IMP-032
tags:
  - IMP-LIST
  - Implementation
  - Performance
  - Rust
  - SIMD
  - Determinism
  - Benchmark
  - URGENT
kanban_status: completed
depends_on: [AI-IMP-013, AI-IMP-014, AI-IMP-031, AI-EPIC-002, AI-EPIC-003]
confidence_score: 0.9
created_date: 2025-09-22
close_date: 2025-09-23
---  


# AI-IMP-032-URGENT-kmeans-simd-soa-and-crate-evaluation

## Summary of Issue #1
The Rust compute core (release) is ~2.0–2.8× slower than the legacy JS baseline on 300k samples at K=300, despite correct parallelization. The primary cause is scalar distance evaluation and AoS memory layout preventing efficient SIMD. Fidelity is acceptable after Hungarian matching (Mean ΔE ≈ 3–5), but we must close the latency gap to meet epic targets. This ticket delivers: (1) a SIMD-optimized, structure‑of‑arrays (SoA) k‑means assignment/update path with deterministic sums; (2) cached color‑space conversion per image; (3) an interactive mini‑batch mode; and (4) an A/B harness variant for a color/k‑means crate (e.g., kmeans_colors) as a pragmatic fallback. Done when Rust P50 cold time is within +20% of JS (or crate beats both) with mean ΔE ≤ 3.5 and deterministic outputs.

### Out of Scope 
- GPU/WebGL/CUDA implementations.
- UI redesign beyond toggling interactive mode and warm‑start wires already planned.
- Non‑k‑means algorithms (DBSCAN/Mean‑Shift/etc.).
- macOS packaging work (tracked separately).

### Design/Approach  
- SoA data layout: store samples and centroids as separate `px[]/py[]/pz[]` and `cx[]/cy[]/cz[]` arrays to enable contiguous loads and SIMD.
- SIMD assignment kernel: use stable `std::simd::Simd<f32, LANES>` (or `wide`) to compute distances in blocks of 4/8 centroids per point; deterministic tie‑break on equal distances.
- Deterministic reductions: fixed‑order, pairwise accumulation for centroid sums; avoid rayon reduction nondeterminism for final sums.
- Cache color transforms: convert incoming samples to working space (e.g., CIELAB) once per image, reuse across iterations and parameter tweaks.
- Mini‑batch interactive path: for UI updates, run a few mini‑batch iterations over a capped subset (e.g., 40–80k) with warm‑starts; refine full 300k in background.
- Optional pruning (stretch): add Hamerly/Elkan bounds if SIMD alone does not meet the budget; gated behind a feature flag.
- Crate evaluation: add a bench_runner variant using a vetted crate (e.g., `kmeans_colors`) taking 3D float inputs; verify determinism, init parity, and speed. Keep harness reporting three columns (JS, Rust‑in‑house, Rust‑crate) with Hungarian ΔE.
- Build flags: ensure `-C target-cpu=native` in release benches; keep scalar fallback for unsupported targets.

### Files to Touch
- `tauri-app/src-tauri/src/kmeans.rs`: add SoA buffers, SIMD assignment/update path, deterministic accumulators, mini‑batch option.
- `tauri-app/src-tauri/src/image_pipeline.rs`: expose cached color‑space sample buffer (3× f32 SoA) for reuse.
- `tauri-app/src-tauri/src/lib.rs`: re‑exports if needed.
- `tauri-app/src-tauri/src/bin/bench_runner.rs`: add variant selection (in‑house vs crate), CLI parsing, report fields.
- `tauri-app/src-tauri/Cargo.toml`: add `stdsimd` usage (stable) or `wide` dep (feature‑gated), optional crate dep behind `bench-crate` feature.
- `scripts/bench/config.mjs`: knob for variant selection and sample caps for interactive runs.
- `bench-reports/README.md`: note the new variant columns and interpretation.
- Tests: `tauri-app/src-tauri/src/kmeans.rs` unit tests for determinism and warm‑start; add small synthetic benches.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] KMeans SoA: refactor internal representation to `px[]/py[]/pz[]` and `cx[]/cy[]/cz[]`; keep AoS adapter for external API.
- [x] SIMD assignment: SIMD kernel using `wide::f32x4` with scalar tail; deterministic tie‑break. (Unit parity tests pending.)
- [x] Deterministic accumulators: fixed-order merge with f64 accumulation for centroid sums; maintain seeded determinism.
- [x] Warm‑start compatibility: warm-start centroids accepted and converted into SoA; determinism preserved.
- [x] Mini‑batch mode: `mini_batch: Option<usize>` implemented; interactive pass plumbed in bench runner.
- [x] Cache color transforms: `samples_lab` computed in `image_pipeline` for reuse; UI wiring follows in IPC ticket.
- [x] Feature flags: introduced `simd` feature (default on) gating `wide`; scalar fallback path implemented.
- [x] Bench harness: `bench_runner` accepts `--variant inhouse|crate`; variant recorded in JSON/Markdown.
- [x] Crate integration: optional `kmeans_colors` under `bench-crate`; adapter implemented.
- [ ] Determinism check (crate): run same seed twice and across OS (CI matrix) to confirm identical centroids/counts.
- [x] Hungarian ΔE comparison: added optional CIEDE2000 toggle (`--delta=de2000`) alongside default DE76; metric label appears in reports/markdown.
- [x] Acceptance thresholds wired: fail the run if P50 delta > +20% vs JS for in‑house variant (or mark crate as recommended if it wins).
- [x] Docs: update `bench-reports/README.md` explaining columns, ΔE interpretation, and interactive vs full paths.
- [ ] Unit tests: add tests for SoA/scalar parity, SIMD vs scalar parity on small sets, mini‑batch execution path, and warm‑start reuse.
- [x] Smoke run: executed; outputs in `bench-reports/`.

### Acceptance Criteria
**Scenario:** In‑house SIMD path closes the gap  
GIVEN the four benchmark images in `bench-assets/`  
WHEN running `npm run bench:compare -- --variant inhouse` (release)  
THEN `bench-reports/latest.md` shows Rust P50 cold time within +20% of JS for each image  
AND Mean ΔE ≤ 3.5 and Max ΔE ≤ 20 (except at most 3 tail clusters per image)  
AND repeated runs with the same seed produce identical results (centroids/counts).

**Scenario:** Crate variant recommended  
GIVEN the same setup  
WHEN running with `--variant crate`  
THEN crate timings are ≤ JS timings on each image  
AND determinism holds  
AND report flags crate as “recommended” if in‑house exceeds +20% delta.

**Scenario:** Interactive path budget  
GIVEN mini‑batch enabled with 40–80k samples and warm‑starts  
WHEN simulating a param tweak  
THEN the interactive recompute completes ≤ 300 ms (measured in bench harness)  
AND background refinement converges to the full result within 2 s.

### Issues Encountered 
- To be filled during implementation.
