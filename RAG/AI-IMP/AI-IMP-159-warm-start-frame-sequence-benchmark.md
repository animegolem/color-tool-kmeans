---
node_id: AI-IMP-159
tags:
  - IMP-LIST
  - Implementation
  - performance
  - benchmark
  - spike
kanban_status: planned
depends_on:
parent_epic: [[AI-EPIC-025-live-analysis-performance-spike]]
confidence_score: 0.85
date_created: 2026-07-09
date_completed:
---

# AI-IMP-159-warm-start-frame-sequence-benchmark

## Summary of Issue #1

`KMeansConfig.warm_start` exists (`src-tauri/src/kmeans.rs:12`) but nothing measures its effect across a video-like frame sequence. Cold-start numbers on the M1 (release, 120k samples): k=64 ≈ 66 ms / 13–17 iters, k=128 ≈ 156 ms / 25–30 iters, k=300 ≈ 424 ms / 34–40 iters. Hypothesis: seeding each frame from the previous frame's centroids drops iteration count to ~1–4 on animation-like content, bringing per-frame cost inside the 41.7 ms budget (EPIC-025 FR-1).

**Done state:** a new bench binary prints a per-configuration table (k × scenario × cold/warm) of mean iterations/frame and mean ms/frame over a simulated frame sequence, deterministic across runs, with results recorded in the ticket.

### Out of Scope

- Any change to `run_kmeans`, `analyze_image`, or shipping behavior — this ticket only *calls* the existing API.
- Real video decode (IMP-160) and end-to-end integration (IMP-161).
- Mini-batch experiments (note as a follow-on if warm start alone misses budget).

### Design/Approach

New bench binary `src-tauri/src/bin/kmeans_framesim.rs` (keep `kmeans_baseline` untouched as the cold-start reference). Simulate a 120-frame sequence at ~57,600 points/frame (320×180 analysis resolution) in three scenarios:

1. **held** — frame N+1 = frame N + per-point Gaussian jitter σ≈0.005 (held cel / grain).
2. **motion** — jitter + 20% of points resampled from a slowly drifting cluster mixture (character movement).
3. **cut** — scenario "motion" with a hard scene change (fully new mixture) every 48 frames, to measure warm-start recovery cost after a cut.

For each scenario × k ∈ {64, 128, 300}: run once cold per frame (baseline) and once warm (frame N seeded with frame N−1's centroids via `warm_start`). Fixed seeds throughout (`SmallRng::seed_from_u64`). Report per-frame mean/p95 iterations and wall-clock ms, plus the max single-frame ms (the cut frames matter). Print as a plain aligned table to stdout.

### Files to Touch

- `src-tauri/src/bin/kmeans_framesim.rs`: new bench binary (~200 LOC).
- `src-tauri/Cargo.toml`: only if a `[[bin]]` entry is required (auto-discovery via `src/bin/` should suffice — verify, don't add speculatively).

**Do NOT touch:** `src/kmeans.rs`, `src/commands.rs`, `src/image_pipeline.rs`, any frontend file, `src/bin/kmeans_baseline.rs`.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `kmeans_framesim.rs` with deterministic generators for the three scenarios (held / motion / cut), 120 frames × 57,600 points.
- [ ] Implement cold-vs-warm harness: identical frame data for both arms; warm arm passes previous centroids as `warm_start` (first frame cold in both arms).
- [ ] Report per scenario × k: mean and p95 iterations/frame, mean and p95 ms/frame, max frame ms; total run uses `--release` timings.
- [ ] Verify determinism: two consecutive runs produce identical iteration counts (timings may vary).
- [ ] `cargo fmt --all -- --check` and `cargo clippy --workspace -- -D warnings` pass.
- [ ] Run on the M1 in release; paste the full output table into **Issues Encountered / Results** below.

### Acceptance Criteria

**Scenario:** Measuring warm-start benefit on animation-like sequences.
**GIVEN** the repo builds with `cargo build --release --bin kmeans_framesim`.
**WHEN** `cargo run --release --bin kmeans_framesim` is executed twice.
**THEN** both runs print the full table (3 scenarios × 3 k values × cold/warm) with identical iteration counts.
**AND** the warm arm's mean iterations/frame for the *held* scenario at every k is reported (hypothesis: ≤4; record actual regardless).
**AND** clippy and fmt gates pass with zero warnings.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
