---
node_id: AI-IMP-031
tags:
  - IMP-LIST
  - Implementation
  - Benchmark
  - Rust
  - JS
  - Performance
kanban_status: completed
depends_on: [AI-IMP-012, AI-IMP-013, AI-IMP-014]
confidence_score: 0.72
created_date: 2025-09-22
close_date: 2025-09-22
---

# AI-IMP-031-urgent-benchmark-harness

## Summary of Issue #1
We must measure the real-world performance gap between the legacy Electron worker and the new Rust core using the four benchmark images (1.5 MB, 4 MB, 11 MB, 24 MB). Build a repeatable harness that runs JS vs Rust on identical sampled datasets, records timing + iteration data, and writes a report (JSON/Markdown). Done when a single command produces side-by-side metrics for all assets, ready to inform further optimization.

### Out of Scope 
- Any optimization of the compute kernels themselves.
- Packaging changes or UI integration.
- Long-term storage of raw images in the repo (assets remain gitignored).

### Design/Approach  
- Add the `bench-assets/` directory to `.gitignore` (already applied) and expect users to stage the four images locally.
- Implement a CLI harness (TypeScript + Node, or Rust) that:
  1. Runs the existing Electron worker (`electron-app/src/worker/color-worker.js`) to sample + cluster each image, capturing timing, sample count, and iterations.
  2. Reuses the sampled data to run the Rust pipeline (via a new `cargo run --bin bench_runner`), leveraging warm-starts if desired.
  3. Persists results per image (JSON + Markdown summary) under `bench-reports/`.
- Ensure harness verifies asset presence and reports if an image is missing.

### Files to Touch
- `.gitignore`: ensure `bench-assets/` (done) and `bench-reports/` (to add) are ignored.
- `scripts/bench/` (new) for Node/TS orchestrator.
- `electron-app/src/worker/bench-entry.ts` (or similar) to expose timed entry point.
- `tauri-app/src-tauri/src/bin/bench_runner.rs` for Rust-side timing using `run_kmeans` + sampling.
- `bench-reports/README.md` documenting usage.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] Add `bench-reports/` to `.gitignore` and create README scaffold.
- [x] Create JS harness that invokes the Electron worker on each benchmark image, measures sample count + time, and saves raw samples to disk.
- [x] Implement Rust bench runner that consumes saved samples, runs `run_kmeans`, and logs timing/iterations.
- [x] Build orchestration script (`npm run bench:compare`) that executes JS then Rust and writes consolidated JSON/Markdown in `bench-reports/`.
- [x] Document setup instructions (place images in `bench-assets/`, required Node version, commands).
- [x] Run harness locally; attach latest results to `bench-reports/latest.md`.

### Acceptance Criteria
**Scenario:** Generate comparison report
GIVEN the four benchmark images exist in `bench-assets/`
WHEN executing `npm run bench:compare`
THEN the script produces JSON + Markdown summaries in `bench-reports/` containing per-image timings for JS and Rust, sample counts, iterations, and notes missing assets if any.

### Issues Encountered 
To be filled during implementation.
