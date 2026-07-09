---
node_id: ADR-003
tags:
  - architecture
  - performance
  - video
  - kmeans
status: accepted
depends_on:
  - AI-EPIC-025
created_date: 2026-07-09
last_modified: 2026-07-09
related_files:
  - tauri-app/src-tauri/src/bin/kmeans_framesim.rs
  - tauri-app/src-tauri/src/bin/live_pipe_probe.rs
  - tauri-app/src-tauri/src/bin/live_loop_probe.rs
---

# ADR-003-live-analysis-architecture

## Objective

Decide whether live per-frame color analysis during video playback (EPIC-026) is feasible at 24 fps on the M1 target, and fix the architecture it should use.

## Context

EPIC-025 ran three probes (IMP-159/160/161). Cold-start k-means per frame costs 66–424 ms (k=64–300) before frame-extraction overhead — far outside the 41.7 ms/frame budget. The shipping video path additionally spawns ffmpeg + PNG round-trips per frame.

## Decision

**GO for EPIC-026.** Live mode is built as follows:

1. **Ingestion**: one persistent ffmpeg child per playing clip, `-f rawvideo -pix_fmt rgb24 -vf "fps=24,scale=320:180:flags=area" pipe:1`. Measured: ~1000 fps sustained delivery, ~0.1–1 ms/frame reads (IMP-160). No per-frame process spawn, PNG, or disk.
2. **Conversion**: 256-entry sRGB→linear LUT + rayon-parallel OKLab. Measured: 0.3–0.9 ms/frame vs 2.86 ms for the shipping sequential path (IMP-160). Promote the LUT into `color.rs` during EPIC-026 with a parity test (bench binaries already carry one).
3. **Clustering**: warm start from the previous frame's centroids with a **fixed iteration budget** (tol=0), NOT convergence-to-tol. IMP-159 showed tol-convergence is statistically unreachable on per-frame-noisy data (centroid sampling jitter exceeds the tol threshold); a budget both caps latency and keeps clusters temporally stable. **Default budget: 4 iterations; k ceiling: none needed** (even k=300 fits).
4. **Loop ownership**: a dedicated Rust task owning ffmpeg child + clustering state, emitting one Tauri event per analyzed frame; commands: start/stop/seek/reconfigure. Frame-drop policy: if the loop falls behind the clip clock, skip to the newest decoded frame (never queue). Frontend subscribes; charts render from events.
5. **Pipelining: none.** Two-stage (reader thread + bounded channel) bought ≤5% in measurements — reads are ~0.1 ms because ffmpeg decodes ahead behind the pipe. Single-stage loop; simpler lifecycle.
6. **Scene cuts**: budget-2/4 quality briefly degrades at hard cuts (q_max up to 2.46 on a cut-heavy 1986 TV opening). Detect via inertia jump (ratio vs previous frame above a threshold) and respond with extra iterations (or a one-frame budget raise) on that frame. Cold k-means++ re-init is NOT needed.
7. **First frame**: cold k-means++ at production parity (one-time 90–270 ms, hidden behind play-start).

## Evidence (M1, release, 320×180, first 60 s of each clip, 1440 frames/run)

Real clips: Maison Ikkoku OP01 (1986 TV, 960×720, cut-heavy) and "I Am Your Tears" (1998, 640×480). `q_*` = inertia ratio of budgeted vs converged-from-same-seed reference, sampled every 24 frames (1.0 = identical quality).

| clip | k | budget | fps (single) | frame p95 ms | q_mean | q_max |
|---|---|---|---|---|---|---|
| Ikkoku OP | 64 | 2 | 239.0 | 3.9 | 1.092 | 1.704 |
| Ikkoku OP | 64 | 4 | 166.9 | 7.7 | 1.044 | 1.424 |
| Ikkoku OP | 128 | 4 | 74.9 | 17.1 | 1.051 | 1.524 |
| Ikkoku OP | 300 | 2 | 48.5 | 22.2 | 1.120 | 2.456 |
| Ikkoku OP | 300 | 4 | 34.8 | 33.1 | 1.060 | 1.815 |
| Tears | 64 | 4 | 168.3 | 6.0 | 1.015 | 1.075 |
| Tears | 128 | 4 | 78.6 | 14.9 | 1.026 | 1.334 |
| Tears | 300 | 4 | 33.9 | 42.2 | 1.028 | 1.094 |

Every configuration sustains >24 fps — worst case k=300/budget-4 at 32–36 fps with mean quality within 3–6% of converged. k≤128 runs at 3–10× real time, leaving ample headroom for the UI thread and chart rendering. Per-frame cost breakdown at k=128/budget-4: read 0.1 ms + convert 0.8 ms + cluster ~10 ms.

Full tables: `AI-IMP-159` (iteration behavior, synthetic), `AI-IMP-160` (ingestion/conversion), `AI-IMP-161` (end-to-end, real clips).

## Alternatives considered

- **Hamerly/Elkan bounds, GPU/Metal, mini-batch**: unnecessary — budget already met with margin. Documented as future levers.
- **Convergence-to-tol per frame**: rejected; statistically unreachable on streaming data and 3–8× slower for invisible quality gains.
- **Two-stage pipelining**: rejected; ≤5% gain, added lifecycle complexity.
- **Analyzing at display resolution**: rejected; 320×180 (57.6k samples) matches the app's existing quality-preset sample counts and is where the budget math works.

## Consequences

- EPIC-026 FRs firm up: fixed-budget warm loop, single-stage, cut detection via inertia jump, event-per-frame contract. Provisional "k ceiling" language can drop — all k are live-capable.
- The LUT conversion path should be promoted into `color.rs` (shipping win for stills too: ~2.5 ms saved per analysis).
- Sub-real-time headroom means battery/thermal budget, not throughput, will bound the feature in practice.
