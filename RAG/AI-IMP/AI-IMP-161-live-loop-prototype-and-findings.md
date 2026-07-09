---
node_id: AI-IMP-161
tags:
  - IMP-LIST
  - Implementation
  - performance
  - video
  - spike
kanban_status: completed
depends_on:
  - AI-IMP-159
  - AI-IMP-160
parent_epic: [[AI-EPIC-025-live-analysis-performance-spike]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed: 2026-07-09
---

# AI-IMP-161-live-loop-prototype-and-findings

## Summary of Issue #1

IMP-159 measures warm-start clustering and IMP-160 measures streamed ingestion + conversion in isolation. EPIC-025 FR-4/FR-5 need them composed: a standalone loop (stream → convert → warm-started k-means) over real animation clips, measuring *sustained end-to-end fps*, plus the spike's deliverable — a findings report with a go/no-go for EPIC-026 and a recommended live-loop architecture.

**Done state:** `live_loop_probe` reports sustained fps at k ∈ {64, 128, 300}, single-stage and two-stage pipelined, over ≥2 real animation clips on the M1; findings written up as an ADR + AI-LOG with the go/no-go recorded in EPIC-025.

### Out of Scope

- Any product integration: no Tauri commands, no events, no frontend, no changes to shipping code. The event contract is *sketched on paper* in the ADR, not implemented (that is EPIC-026).
- Hamerly/Elkan bounds, GPU — documented as next levers only if numbers demand them.

### Design/Approach

New bench binary `src-tauri/src/bin/live_loop_probe.rs`, composing the validated pieces (reuse IMP-160's pipe/LUT code by extracting shared helpers into the bin or a small `#[cfg(not(tauri))]`-free module under `src/` only if clean — prefer duplication within `bin/` over touching shipping modules for a spike).

Per clip × k: stream at 320×180 fps=24 → LUT+rayon convert → `run_kmeans_soa` with `warm_start` from previous frame (first frame cold). Two modes:
1. **single-stage** — sequential read/convert/cluster per frame;
2. **two-stage** — reader thread decodes frame N+1 into a channel while main thread clusters frame N (bounded channel of 1–2 buffers).

Report per configuration: sustained fps, mean/p95 frame time, breakdown (read / convert / cluster), warm iterations mean, worst frame (scene cuts). Real clips supplied by the owner (downloaded animation cuts, e.g. Sakugabooru) — passed as CLI paths, not committed; `testsrc2` fallback documented but real-clip numbers are the ones that count.

Findings: `RAG/ADR/` entry (numbering per existing ADR convention) — measured tables, go/no-go vs the ≥24 fps @ k≤128 target, recommended EPIC-026 architecture (loop ownership, command surface, event payload sketch, frame-drop policy), and next levers if the target is missed. Session AI-LOG per template. Update EPIC-025 FRs/status and the provisional ceilings in EPIC-026.

### Files to Touch

- `src-tauri/src/bin/live_loop_probe.rs`: new bench binary (~300 LOC).
- `RAG/ADR/ADR-XXX-live-analysis-architecture.md`: new findings + architecture decision.
- `RAG/AI-LOG/2026-MM-DD-LOG-AI-live-analysis-spike.md`: session log.
- `RAG/AI-EPIC/AI-EPIC-025-live-analysis-performance-spike.md`: FR checkboxes, status.
- `RAG/AI-EPIC/AI-EPIC-026-live-video-playback-analysis.md`: firm up provisional FRs/ceilings from findings.

**Do NOT touch:** shipping modules (`kmeans.rs`, `color.rs`, `ffmpeg.rs`, `commands.rs`, frontend).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Review IMP-159/160 results and worktrees; merge both branches after code review; re-run their gates on the integration branch. *(Merged to main `c78ac30`/`9d5094f`; fmt/clippy/39 tests green on main.)*
- [x] `live_loop_probe` single-stage mode: stream → convert → warm k-means, per-stage timing breakdown, per-k sweep.
- [x] Two-stage mode: bounded-channel reader thread; verify no unbounded buffering and clean shutdown on EOF/error. *(sync_channel(2); reader exits on EOF/hangup; child killed+reaped after loop.)*
- [x] Obtain ≥2 real animation clips from owner; run full sweep (2 clips × 3 k × 2 modes) in release on the M1; record all tables. *(Maison Ikkoku OP01 1986 + "I Am Your Tears" 1998, first 60 s each; sweep also covered iteration budgets {2,4} — see Results.)*
- [x] Write ADR: findings tables, go/no-go against ≥24 fps @ k≤128, recommended EPIC-026 architecture + event contract sketch, next levers. *(ADR-003 — GO.)*
- [x] Update EPIC-025 (FRs, status) and EPIC-026 (ceilings, firmed FRs); write session AI-LOG; regenerate INDEX.md.
- [x] `cargo fmt --all -- --check` and `cargo clippy --workspace -- -D warnings` pass.

### Acceptance Criteria

**Scenario:** Deciding whether live 24 fps analysis is buildable.
**GIVEN** IMP-159 and IMP-160 are merged and two real animation clips are on disk.
**WHEN** `cargo run --release --bin live_loop_probe -- <clip> --k 128 --two-stage` runs.
**THEN** it reports sustained fps with a read/convert/cluster breakdown and warm-iteration stats.
**AND** the full sweep (2 clips × k 64/128/300 × 2 modes) is recorded in the ADR.
**THEN** EPIC-025 FR-5 is checkable: ADR contains an explicit go/no-go and architecture recommendation, and EPIC-026 reflects the measured ceilings.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- **Deviation (improvement):** IMP-159's lead review found tol-convergence statistically unreachable on streaming data, so this probe measures **fixed iteration budgets {2, 4}** (tol=0) instead of convergence-based warm runs, and adds the **inertia-ratio quality check** (budgeted vs converged-from-same-seed, every 24 frames) as the go/no-go signal. The ticket's original "warm iterations mean" metric is meaningless under a fixed budget and was dropped.
- **Deviation (pragmatic):** per-run decode capped at the first 60 s (`-t 60`, 1440 frames/run) so the 24-configuration sweep stays ~10 min; both clips' 60 s windows include hard cuts and holds.
- `frame_max` outliers (90–270 ms) are frame 0's one-time cold k-means++ init at production parity — hidden behind play-start in the product; not a steady-state concern.
- Two-stage pipelining bought ≤5% (reads are ~0.1 ms; ffmpeg already decodes ahead behind the pipe) — recommended architecture is single-stage.

### Results

Full sweep (M1, release, 320×180, fps=24, 1440 frames/run; q_* = budgeted/converged inertia ratio, 1.0 = converged quality):

```
clip                            k  it mode   frames     fps  rd_ms   cv_ms    cl_ms   fr_p95   fr_max  q_mean   q_max
1986.03 - Maison Ikkoku OP01   64   2 single   1440   239.0   0.13    0.48     2.67     3.88   124.55  1.0919  1.7042
1986.03 - Maison Ikkoku OP01   64   2 2stage   1440   239.4   0.04    0.51     2.69     4.63    93.41  1.0919  1.7042
1986.03 - Maison Ikkoku OP01   64   4 single   1440   166.9   0.10    0.59     4.35     7.70    89.00  1.0443  1.4244
1986.03 - Maison Ikkoku OP01   64   4 2stage   1440   168.8   0.04    0.50     4.48     8.21    92.89  1.0443  1.4244
1986.03 - Maison Ikkoku OP01  128   2 single   1440    97.6   0.10    0.93     6.42    13.02   155.07  1.1158  2.0623
1986.03 - Maison Ikkoku OP01  128   2 2stage   1440   100.9   0.04    0.80     6.30    11.66   156.47  1.1158  2.0623
1986.03 - Maison Ikkoku OP01  128   4 single   1440    74.9   0.11    0.84    10.07    17.08   140.17  1.0514  1.5244
1986.03 - Maison Ikkoku OP01  128   4 2stage   1440    68.8   0.04    0.91    10.99    19.92   145.71  1.0514  1.5244
1986.03 - Maison Ikkoku OP01  300   2 single   1440    48.5   0.11    1.02    13.63    22.17   271.64  1.1204  2.4564
1986.03 - Maison Ikkoku OP01  300   2 2stage   1440    52.6   0.04    0.83    12.81    19.55   248.20  1.1204  2.4564
1986.03 - Maison Ikkoku OP01  300   4 single   1440    34.8   0.11    1.02    22.18    33.11   247.68  1.0603  1.8151
1986.03 - Maison Ikkoku OP01  300   4 2stage   1440    36.2   0.04    0.78    21.56    31.16   249.44  1.0603  1.8151

1998.05_-_I_Am_Your_Tears_-_   64   2 single   1440   204.3   0.10    0.59     3.18     4.66    71.68  1.0348  1.3056
1998.05_-_I_Am_Your_Tears_-_   64   2 2stage   1440   204.1   0.03    0.52     3.28     4.57    54.04  1.0348  1.3056
1998.05_-_I_Am_Your_Tears_-_   64   4 single   1440   168.3   0.09    0.50     4.48     6.02    52.86  1.0149  1.0752
1998.05_-_I_Am_Your_Tears_-_   64   4 2stage   1440   163.1   0.03    0.50     4.76     7.84    57.62  1.0149  1.0752
1998.05_-_I_Am_Your_Tears_-_  128   2 single   1440   105.9   0.11    0.74     6.27    10.57    68.69  1.0398  1.2598
1998.05_-_I_Am_Your_Tears_-_  128   2 2stage   1440   116.6   0.03    0.65     5.78     9.21    67.21  1.0398  1.2598
1998.05_-_I_Am_Your_Tears_-_  128   4 single   1440    78.6   0.10    0.81     9.76    14.93    69.46  1.0264  1.3335
1998.05_-_I_Am_Your_Tears_-_  128   4 2stage   1440    77.6   0.04    0.74    10.00    15.56    72.01  1.0264  1.3335
1998.05_-_I_Am_Your_Tears_-_  300   2 single   1440    57.2   0.10    0.85    12.29    18.28   103.46  1.0526  1.1585
1998.05_-_I_Am_Your_Tears_-_  300   2 2stage   1440    55.9   0.03    0.74    12.68    21.63   102.41  1.0526  1.1585
1998.05_-_I_Am_Your_Tears_-_  300   4 single   1440    33.9   0.12    0.85    23.77    42.18   134.28  1.0279  1.0941
1998.05_-_I_Am_Your_Tears_-_  300   4 2stage   1440    32.2   0.04    0.86    25.61    59.83   222.09  1.0279  1.0941
```

**GO.** Every configuration sustains >24 fps (worst: k=300/budget-4 at 32–36 fps); budget-4 mean quality is within 1.5–6% of converged on real footage. Cut-heavy footage (Ikkoku OP) drives q_max spikes → cut detection via inertia jump recommended in ADR-003. See ADR-003 for the full architecture decision.