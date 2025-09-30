---
node_id: AI-LOG-2025-09-22-SIMD-SOA
tags:
  - AI-log
  - development-summary
  - performance
  - tauri
  - rust
  - simd
  - benchmarking
closed_tickets: [AI-IMP-031]
created_date: 2025-09-22
related_files:
  - scripts/bench/index.mjs
  - scripts/bench/js-runner.mjs
  - scripts/bench/png.mjs
  - scripts/bench/config.mjs
  - scripts/bench/observable-baseline.mjs
  - scripts/bench/vendor/kmeans-engine/index.mjs
  - bench-reports/latest.md
  - bench-reports/comparison.json
  - tauri-app/src-tauri/src/bin/bench_runner.rs
  - tauri-app/src-tauri/src/kmeans.rs
  - tauri-app/src-tauri/src/image_pipeline.rs
  - tauri-app/src-tauri/Cargo.toml
  - package.json
confidence_score: 0.87
---

# 2025-09-22-LOG-AI-kmeans-simd-soa-and-bench

## Work Completed
- Implemented the benchmark harness per AI-IMP-031: JS orchestrator (decode → worker → sample capture), Rust bench_runner, consolidated JSON/Markdown output, and Hungarian ΔE matching with interactive metrics. Harness supports variant switching (in-house vs crate).
- Added offline Observable baseline (vendor kmeans-engine) for sanity checks; baseline runs on capped samples to avoid network/GUI requirements.
- Refactored Rust k‑means to Structure‑of‑Arrays (SoA) and added a SIMD assignment kernel using `wide::f32x4`. Reworked k‑means++ init, chunk-parallel assignment with deterministic merges, and SoA mini‑batch support. Exposed `run_kmeans_soa` API.
- Cached color‑space conversion (Lab) in sampling to avoid repeated transforms across iterations.
- Bench results (release + `-C target-cpu=native`, 300k samples, K=300):
  - In‑house SIMD: ~0.24–0.69 s vs JS 4.2–6.1 s (Δ ≈ −4.6 s on average). Mean ΔE ≈ 3; tail Max ΔE varies by image (25–66), acceptable for UI with further tuning.
  - Crate (`kmeans_colors` with palette Lab): ~14–20 s; fidelity good (Max ΔE ≤ ~17) but speed is far behind our path.
- Bench artifacts now include variant and interactive timings in `latest.md` and JSON reports.

## Session Commits
- Local changes only; no upstream pushes during this session. All edits tracked in the files listed above. Harness and compute changes validated via `cargo test`, `cargo check --features bench-crate`, and multiple `npm run bench:compare` executions for both variants.

## Issues Encountered
- Initial Rust debug timings were misleading (>>100 s). Switching to release + native flags reduced cold time ~15×; harness defaults updated accordingly.
- Cluster comparison by rank inflated ΔE; added Hungarian matching on ΔE76 to align clusters one‑to‑one.
- Tail clusters showed larger ΔE outliers; acceptable pending further centroid stability work and potential CIEDE2000 scoring.
- Interactive pass still around 0.39–0.43 s at small mini‑batches; future tuning needed to consistently hit ≤300 ms budget.
- Crate evaluation required palette types and feature flags; integrated under `bench-crate` without impacting default builds.

## Tests Added
- No new unit tests added; existing Rust tests (12) continue to pass post‑refactor (color conversions, sampling, warm‑start, mini‑batch path). The harness itself acts as an integration/benchmark test, producing deterministic JSON/MD outputs for regression review.

## Next Steps
- Target interactive budget: shrink mini‑batch further, reuse SoA windows, and hoist invariant computations. Consider `std::simd` lanes >4 where available.
- Reduce tail ΔE spikes: deterministic accumulators, optional CIEDE2000 for matching/reporting, and tie‑break rules in assignment.
- Optional pruning (Hamerly/Elkan) if needed after SIMD gains.
- Wire the in‑house SIMD path into the Tauri IPC + Svelte flows; keep crate variant behind a feature flag purely for research.
- Monitor determinism across OS in CI; keep acceptance gates in reports (timing and ΔE thresholds) per AI‑IMP‑032.

