---
node_id: AI-EPIC-025
tags:
  - EPIC
  - AI
  - performance
  - video
  - spike
date_created: 2026-07-09
date_completed: 2026-07-09
kanban_status: completed
AI_IMP_spawned:
  - AI-IMP-159
  - AI-IMP-160
  - AI-IMP-161
---

# AI-EPIC-025-live-analysis-performance-spike

## Problem Statement/Feature Scope

We want to play a video clip with full color analysis updating live at the clip's native frame rate (24 fps for our animation-centric audience). Today's per-frame path cannot do this: each frame spawns an ffmpeg process, seeks, Lanczos-scales, PNG-encodes to disk, then `analyze_image` re-decodes the PNG and cold-starts k-means from k-means++ every time. Measured on the M1 target (release, 120k samples, cold start): k=64 ≈ 66 ms, k=128 ≈ 156 ms, k=300 ≈ 424 ms — before any frame-extraction overhead, against a 41.7 ms/frame budget.

Per-iteration cost is small (~4.4–11.5 ms); the totals are dominated by iteration count from cold-starting and by the PNG round trip. Whether 24 fps is reachable is an evidence question, not a build question — this epic is the spike that answers it before we commit to a live-playback feature (EPIC-026).

## Proposed Solution(s)

A time-boxed performance spike producing benchmarks and a prototype loop, not product UI. Four probes, each isolating one hypothesis:

1. **Warm start across frames** — `KMeansConfig.warm_start` exists but `analyze_image` never uses it (`commands.rs` hardcodes `None`). Extend `kmeans_baseline` with a frame-sequence scenario (perturbed synthetic frames + real extracted frames) seeding each run from the previous centroids; measure iterations-to-converge and wall time at k=64/128/300. Hypothesis: 1–4 iterations/frame on typical animation (held cels should converge in ~1).

2. **Streaming frame ingestion** — prototype a persistent ffmpeg child streaming `-f rawvideo -pix_fmt rgb24` at a fixed analysis resolution (~320×180, `flags=area`) into memory. No per-frame spawn, seek, PNG encode/decode, or disk. Measure sustained frame delivery rate and per-frame read cost.

3. **Conversion fast path** — benchmark sRGB→OKLab with a 256-entry sRGB→linear LUT plus rayon-parallel conversion, versus the current sequential `powf` path (`image_pipeline.rs`).

4. **End-to-end prototype** — wire 1–3 into a standalone loop (decode → convert → warm-started cluster) over real Sakugabooru-style clips; measure sustained fps at k=64/128/300, single-stage and with a two-stage pipeline (decode frame N+1 while clustering frame N).

Deliverable: a findings report (AI-LOG + ADR) with measured sustained fps per configuration, a go/no-go for EPIC-026, and a recommended architecture (expected shape: a dedicated Rust live-analysis loop pushing cluster results as Tauri events, rather than request/response `analyze_image` per frame).

## Path(s) Not Taken

- **GPU/Metal compute for assignment** — CPU headroom projections suggest it is unnecessary; revisit only if the spike misses 24 fps with all CPU levers pulled.
- **Hamerly/Elkan triangle-inequality bounds** — real complexity; only worth it if k=300 at 24 fps becomes a hard requirement. Documented as a known next lever, not built in the spike.
- **Replacing the ffmpeg CLI with a linked decoder library** — the persistent-pipe approach keeps the existing vendored-binary model; a library dependency is a larger licensing/packaging decision than a spike should make.
- **Touching the shipping stills path** — `analyze_image` behavior, determinism, and outputs stay untouched.

## Success Metrics

- Measured, reproducible numbers (M1, release build) for: iterations/frame with warm start; per-frame ingestion cost via rawvideo pipe; conversion cost with LUT+parallel; end-to-end sustained fps at k=64/128/300 at ~320×180.
- Primary target: **sustained ≥24 fps at k≤128** on a real animation clip; stretch: k=300.
- If the target is missed: a quantified account of where the budget goes and which next lever (Hamerly, GPU, lower k/resolution) closes the gap.
- Go/no-go decision recorded for EPIC-026 with a recommended architecture sketch.
- Spike completes without changes to shipping behavior (all existing tests pass; `cargo clippy`/`fmt` clean).

## Requirements

### Functional Requirements

- [x] FR-1: Extend `kmeans_baseline` (or add a sibling bench binary) with a warm-start frame-sequence scenario; report iterations and ms/frame at k=64/128/300. **(IMP-159 — warm start ~halves iterations; key finding: tol-convergence is statistically unreachable on streaming data, so live mode = warm start + fixed iteration budget at ~1.3/2.0/5.1 ms per iteration for k=64/128/300. IMP-161 must measure capped-vs-converged inertia on real clips.)**
- [x] FR-2: Prototype persistent-ffmpeg rawvideo streaming into memory at analysis resolution; measure sustained delivery and read cost per frame. **(IMP-160 — ~1000 fps sustained at 320×180, ~1 ms/frame reads.)**
- [x] FR-3: Benchmark LUT-based + rayon-parallel sRGB→OKLab conversion against the current path. **(IMP-160 — 2.86 → 0.30–0.38 ms/frame; ingestion + conversion together ≈1.3 ms of the 41.7 ms budget.)**
- [x] FR-4: End-to-end prototype loop over ≥2 real animation clips; report sustained fps per k, with and without 2-stage pipelining. **(IMP-161 — every configuration >24 fps on real 1986/1998 anime; worst case k=300/budget-4 at 32–36 fps; budget-4 quality within 1.5–6% of converged. Two-stage pipelining unnecessary.)**
- [x] FR-5: Findings report (AI-LOG + ADR): numbers, go/no-go for EPIC-026, recommended live-loop architecture and event contract sketch. **(ADR-003 — GO. Architecture: persistent rawvideo pipe, LUT+rayon conversion, warm start + fixed 4-iteration budget, single-stage loop, cut detection via inertia jump, event per analyzed frame.)**

### Non-Functional Requirements

- All spike code lives in `src-tauri/src/bin/` (bench binaries) or a clearly-fenced module; no behavior change to `analyze_image` or `value_analysis`.
- Benchmarks deterministic where possible (fixed seeds, fixed clips checked into `RAG/assets/` or referenced by path).
- Rust gates: `cargo fmt --check`, `cargo clippy -- -D warnings`.

## Implementation Breakdown

Cut 2026-07-09. IMP-159 and IMP-160 are independent and run in parallel (delegated: Sonnet and Codex respectively, isolated worktrees); IMP-161 is lead-implemented and depends on both.

- **AI-IMP-159** — warm-start frame-sequence benchmark (`kmeans_framesim`): FR-1. Assigned: Sonnet.
- **AI-IMP-160** — persistent rawvideo pipe + conversion fast-path bench (`live_pipe_probe`): FR-2, FR-3. Assigned: Codex 5.6 Terra xhigh.
- **AI-IMP-161** — end-to-end loop over real clips + ADR findings, go/no-go (`live_loop_probe`): FR-4, FR-5. Assigned: lead. Blocked on 159, 160, and owner-supplied animation clips.
