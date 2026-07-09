---
node_id: 2026-07-09-LOG-AI-live-analysis-spike
tags:
  - AI-log
  - development-summary
  - performance
  - video
  - spike
closed_tickets:
  - AI-IMP-159
  - AI-IMP-160
  - AI-IMP-161
created_date: 2026-07-09
related_files:
  - tauri-app/src-tauri/src/bin/kmeans_framesim.rs
  - tauri-app/src-tauri/src/bin/live_pipe_probe.rs
  - tauri-app/src-tauri/src/bin/live_loop_probe.rs
  - RAG/ADR/ADR-003-live-analysis-architecture.md
confidence_score: 0.9
---

# 2026-07-09-LOG-AI-live-analysis-spike

## Work Completed

Planned and executed EPIC-025 (live-analysis performance spike) end to end in one session. Cut EPIC-025/026/027 and tickets IMP-159/160/161; delegated 159 (Sonnet, worktree) and 160 (GPT via codex plugin, standalone clone), lead-implemented 161. All three tickets closed; EPIC-025 completed with a **GO** verdict for EPIC-026, recorded in ADR-003.

Headline findings (M1, release):
- Warm-started k-means with a **fixed 4-iteration budget** replaces convergence-to-tol (which is statistically unreachable on per-frame-noisy streaming data — IMP-159 lead review).
- Persistent ffmpeg rawvideo pipe at 320×180: ~1000 fps delivery, ~0.1–1 ms/frame reads; LUT+rayon OKLab conversion 0.3–0.9 ms/frame (IMP-160).
- End-to-end on real anime (Maison Ikkoku OP 1986, "I Am Your Tears" 1998): **every k ∈ {64,128,300} sustains >24 fps** (34–239 fps), budget-4 quality within 1.5–6% of converged inertia (IMP-161).
- Two-stage pipelining unnecessary (≤5%); scene cuts need inertia-jump detection with extra iterations that frame.

Also this session: EPIC-027 (notebook UI redesign) drafted from the Claude Design bundle in RAG/; not yet ticketed.

## Session Commits

- `68c059a` docs(rag): cut EPIC-025/026/027 and spike tickets IMP-159..161
- `990feb0` feat(bench): add kmeans_framesim warm-start frame-sequence benchmark [AI-IMP-159] (Sonnet, on agent branch)
- `e3fcc2c` fix(bench): stationary base+grain noise model for kmeans_framesim [AI-IMP-159] (lead review fix)
- `df303dd` feat(bench): add live_pipe_probe rawvideo pipe + conversion benchmark [AI-IMP-160] (Codex work, lead commit)
- `c78ac30` / `9d5094f` merges of both ticket branches into main; gates re-run on main (fmt, clippy, 39/39 tests)
- `0a5f5fe` docs(rag): check off EPIC-025 FR-1..FR-3 with spike findings
- (this commit) live_loop_probe + ADR-003 + ticket/epic closures [AI-IMP-161]

## Issues Encountered

- **IMP-159 spec bug (lead's own):** the ticket's literal noise recurrence was a non-stationary random walk; blobs smeared ~10x by frame 119 and cold arms pinned the 40-iteration cap. Sonnet implemented faithfully and flagged it honestly. Lead revised to a base+fresh-grain model and re-ran. Lesson: specify noise models by intent (stationary grain) not formula.
- **Codex delegation infrastructure (two rounds):** (1) Codex's sandbox cannot write the parent `.git` of a Claude agent worktree — provision a standalone clone instead; (2) even in a clone the sandbox cannot commit — lead commits after review. Job registry is keyed to launch cwd (`status` from elsewhere reports "No job found"). Both memorized.
- **Benchmark contention:** concurrent agent builds/benches on the same machine inflated wall-clock numbers in early runs (max_ms outliers up to 1.4 s). Iteration counts were deterministic throughout; final tables re-run on a quiet machine.
- **Missing vendored sidecars in worktrees/clones:** `src-tauri/bin/ffmpeg-*` are gitignored, so fresh worktrees/clones fail the Tauri build script for every bin. Fix: copy from the main checkout (both agents hit this).
- **tol-vs-noise interaction (key technical finding):** with fresh per-frame noise, per-centroid sampling jitter (~σ/√n) exceeds what `tol 1e-3` requires; Lloyd tracks noise to the iteration cap instead of converging. Fixed budgets are the correct live-mode primitive, and the quality metric is budgeted-vs-converged inertia ratio.

## Tests Added

- `live_pipe_probe`: LUT sRGB→linear vs `color::srgb8_to_linear` (all 256 channel values); LUT-pipeline vs shipping `rgb8_to_oklab` parity (17³ RGB sweep) — added in lead review to pin the duplicated OKLab matrix.
- `live_loop_probe`: same OKLab parity test for its own duplicated conversion.
- `kmeans_framesim`: no unit tests (bench binary); determinism verified operationally (byte-identical iteration columns across runs).

## Next Steps

- **EPIC-026 is unblocked and spec'd** — read ADR-003 first; the epic's FRs are firmed. Implementation order suggestion: promote the LUT conversion into `color.rs` (parity tests exist), then the Rust live loop + event contract, then frontend transport wiring.
- **EPIC-027 (notebook UI redesign) needs its IMP breakdown** — design bundle in `RAG/Color Tool Design System.zip` (to be vendored per FR-1); 12 decided code changes in its `design-docs/Code Change Notes.md`. Sequencing note in the epic: live-mode UI should land against the redesigned shell.
- Housekeeping candidates: `bin/` now has four bench binaries (baseline, framesim, pipe, loop) — consider consolidating after EPIC-026 ships; CLAUDE.md refresh is EPIC-027 FR-1.
- Real-clip paths used (not committed): `~/Desktop/1986.03 - Maison Ikkoku OP01 .mp4`, `~/Desktop/1998.05_-_I_Am_Your_Tears_-_.mp4`.
