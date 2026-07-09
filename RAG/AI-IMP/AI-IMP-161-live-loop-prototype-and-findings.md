---
node_id: AI-IMP-161
tags:
  - IMP-LIST
  - Implementation
  - performance
  - video
  - spike
kanban_status: planned
depends_on:
  - AI-IMP-159
  - AI-IMP-160
parent_epic: [[AI-EPIC-025-live-analysis-performance-spike]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed:
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

- [ ] Review IMP-159/160 results and worktrees; merge both branches after code review; re-run their gates on the integration branch.
- [ ] `live_loop_probe` single-stage mode: stream → convert → warm k-means, per-stage timing breakdown, per-k sweep.
- [ ] Two-stage mode: bounded-channel reader thread; verify no unbounded buffering and clean shutdown on EOF/error.
- [ ] Obtain ≥2 real animation clips from owner; run full sweep (2 clips × 3 k × 2 modes) in release on the M1; record all tables.
- [ ] Write ADR: findings tables, go/no-go against ≥24 fps @ k≤128, recommended EPIC-026 architecture + event contract sketch, next levers.
- [ ] Update EPIC-025 (FRs, status) and EPIC-026 (ceilings, firmed FRs); write session AI-LOG; regenerate INDEX.md.
- [ ] `cargo fmt --all -- --check` and `cargo clippy --workspace -- -D warnings` pass.

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
