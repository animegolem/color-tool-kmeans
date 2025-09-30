---
node_id: AI-IMP-033
tags:
  - IMP-LIST
  - Implementation
  - Performance
  - Fidelity
  - Benchmark
  - Rust
  - Tauri
kanban_status: completed
depends_on: [AI-IMP-031, AI-IMP-032, AI-EPIC-002, AI-EPIC-003]
confidence_score: 0.88
created_date: 2025-09-23
close_date: 2025-09-24
---  


# AI-IMP-033-fidelity-tails-explain-and-interactive-budget

## Summary of Issue #1
Rust SIMD SoA path is now 8–20× faster than the JS baseline with mean ΔE within target; however, some images show tail spikes in ΔE (DE76/DE2000) up to ~20–30. We also need to consistently meet the ≤300 ms interactive mini-batch budget and formalize acceptance gates in the harness. This ticket delivers: richer tail diagnostics (quantiles, thresholds, share-weighted metrics), an optional weighted Hungarian matching, an “explain” mode (confusion/Jaccard, nearest-neighbor context), conversion parity checks, interactive tuning to ≤300 ms, and harness acceptance gating/report polish.

### Out of Scope 
- Algorithm swaps (DBSCAN/Mean-Shift) and GPU rewrites.
- UI redesign; only minimal wiring to expose interactive-first + refine if needed.
- Cross-OS determinism matrix (covered by CI configuration tasks).

### Design/Approach  
- Tail metrics: compute ΔE quantiles (P90/P95/P99), counts above 10/15/20, and share-weighted mean; show in JSON and Markdown.
- Weighted matching: optional cost = ΔE · (1 + α·|Δshare|), α≈1; compare vs unweighted, keep both in report.
- Explain mode: rebuild assignments on a common dataset to produce K×K confusion matrix, Jaccard per pair, and top-3 alternative matches; dump `explain.json` per image.
- Neighborhood context: list nearest neighbors per centroid (within JS and Rust), distance deltas, and a split/merge hint.
- Conversion parity: JS vs Rust LAB transform A/B on random RGB u8 set; emit max/mean deltas and histograms (bins) to file.
- Interactive budget: time-capped mini-batch (target 280 ms) with early-exit on centroid shift; warm-start use; expose knobs via CLI.
- Harness acceptance: speed gate already added; extend with optional tails gate (≤3 clusters per image with ΔE>20) when metrics exist; markdown badges.

### Files to Touch
- `tauri-app/src-tauri/src/bin/bench_runner.rs`: metrics, weighted matching switch (`--weighted` with α), explain mode (`--explain`), neighbor listing, parity check subcommand.
- `tauri-app/src-tauri/src/color.rs`: helper for ΔE (reuse), small utilities if needed.
- `scripts/bench/index.mjs`: forward new flags.
- `bench-reports/README.md`: document new outputs and interpretation.
- Tests under `tauri-app/src-tauri/src/`: unit tests for explain metrics and matching variants.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] Metrics: add ΔE quantiles (P90/P95/P99) and counts >10/15/20; share-weighted mean ΔE in JSON/MD.
- [x] Weighted Hungarian: `--weighted[=alpha]` to apply cost = ΔE · (1 + α·|Δshare|); record both metrics for comparison.
- [x] Explain mode: `--explain` outputs per-image `explain.json` with confusion matrix, Jaccard per pair, and alt matches.
- [x] Neighbor context: list nearest centroid distances within JS and Rust; flag likely split/merge cases.
- [x] Conversion parity: JS vs Rust LAB A/B on 10k random RGB; emit summary and histogram bins.
- [x] Interactive tuning: add time-capped mini-batch (≈280 ms) and centroid-shift early-exit; expose via CLI; validate ≤300 ms.
- [x] Harness acceptance: optional tails gate (`--tails-gate`) enforces ≤6 clusters/image with ΔE>20; markdown shows PASS/FAIL.
- [x] Docs: update `bench-reports/README.md` with new fields/flags and examples.
- [x] Tests: add unit tests for weighted matching / explain helpers / parity sampling.

### Acceptance Criteria
**Scenario:** Tail metrics visible and actionable  
GIVEN `npm run bench:compare -- --delta de2000 --weighted --explain`  
THEN `comparison.json` includes ΔE quantiles and thresholds counts  
AND `latest.md` shows these metrics  
AND `bench-reports/explain/*.json` contain confusion/Jaccard and neighbor context.

**Scenario:** Interactive ≤300 ms  
GIVEN interactive time cap enabled  
WHEN running the harness  
THEN `interactiveDurationMs` ≤ 300 on all images  
AND final full pass converges within 2 s.

**Scenario:** Acceptance gates  
GIVEN inhouse variant  
WHEN speed gate evaluated  
THEN PASS if Rust ≤ +20% vs JS per image  
AND optional tails gate PASS with ≤3 clusters/image having ΔE>20.

### Issues Encountered 
- To be filled during implementation.
