---
node_id: AI-IMP-160
tags:
  - IMP-LIST
  - Implementation
  - performance
  - video
  - spike
kanban_status: planned
depends_on:
parent_epic: [[AI-EPIC-025-live-analysis-performance-spike]]
confidence_score: 0.7
date_created: 2026-07-09
date_completed:
---

# AI-IMP-160-rawvideo-pipe-and-conversion-fast-path

## Summary of Issue #1

Per-frame video analysis currently spawns ffmpeg, seeks, Lanczos-scales, PNG-encodes to disk, and re-decodes the PNG (`src-tauri/src/ffmpeg.rs:199`, `image_pipeline.rs:102`) — plausibly 100–300 ms/frame of pure overhead before clustering. EPIC-025 FR-2/FR-3 ask: how fast can we (a) stream decoded frames from one persistent ffmpeg process into memory, and (b) convert them sRGB→OKLab?

**Done state:** a bench binary that streams a clip through a persistent ffmpeg rawvideo pipe at analysis resolution and prints sustained delivery fps + per-frame read cost, plus a conversion benchmark comparing the current sequential `powf` OKLab path against a 256-entry sRGB→linear LUT with rayon-parallel conversion; both sets of numbers recorded in the ticket.

### Out of Scope

- k-means integration and pipelining (IMP-161).
- Changing `ffmpeg.rs`, `color.rs`, or any shipping code path — the LUT lives in the bench binary for now; promotion into `color.rs` is an IMP-161/EPIC-026 decision.
- Audio, seeking within the stream, variable frame rates beyond what `-vf fps=` normalizes.

### Design/Approach

New bench binary `src-tauri/src/bin/live_pipe_probe.rs` (~300 LOC), two subcommands (simple `std::env::args` parsing, no new deps):

**`pipe <clip> [--ffmpeg <path>] [--width 320] [--height 180]`** — spawn one persistent child:
`ffmpeg -i <clip> -f rawvideo -pix_fmt rgb24 -vf "fps=24,scale=320:180:flags=area" -v error pipe:1`
via `std::process::Command` with piped stdout. Read exact `w*h*3`-byte frames in a loop (`read_exact` into a reusable buffer). Measure: total frames, wall time, sustained fps, mean/p95 per-frame read latency. Drain stderr on a thread to avoid pipe deadlock. Kill child on drop.

**`convert`** — generate a deterministic 57,600-pixel RGB frame; benchmark (1) the current path `crate::color::rgb8_to_oklab` sequentially, (2) LUT sRGB→linear (256-entry f32 table) + scalar oklab, (3) LUT + rayon `par_chunks`. Report ms/frame each, 100 reps after warmup.

Test clip: generate locally with ffmpeg (e.g. `ffmpeg -f lavfi -i testsrc2=duration=10:size=1920x1080:rate=24 <scratch>/testclip.mp4`) — do not commit clips to the repo. ffmpeg binary: default to `ffmpeg` on PATH, overridable via `--ffmpeg` (the app's vendored-binary resolution in `ffmpeg.rs` is Tauri-coupled; do not reuse it).

Correctness check for the LUT: max component error vs the `powf` path over all 16.7M RGB values — assert < 1e-3 in a unit test (LUT is 256 entries per channel, so exact enumeration over 256 values per channel suffices; document the reasoning in the test).

### Files to Touch

- `src-tauri/src/bin/live_pipe_probe.rs`: new bench binary (~300 LOC incl. LUT + tests).
- `src-tauri/Cargo.toml`: nothing expected (rayon, image already present; bin auto-discovered) — verify.

**Do NOT touch:** `src/ffmpeg.rs`, `src/color.rs`, `src/kmeans.rs`, `src/commands.rs`, any frontend file.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] `pipe` subcommand: persistent ffmpeg child, rawvideo rgb24 at fps=24 scale=WxH flags=area, `read_exact` frame loop with reusable buffer, stderr drained, child killed on exit/drop.
- [ ] `pipe` reports: frame count, wall time, sustained fps, mean/p95/max per-frame read latency; errors are surfaced with actionable messages (bad path, ffmpeg missing, short read at EOF handled cleanly).
- [ ] `convert` subcommand: three arms (current sequential / LUT sequential / LUT + rayon), deterministic input, 100 reps after warmup, ms/frame reported per arm.
- [ ] Unit test: LUT sRGB→linear matches `color::srgb8_to_linear` within 1e-3 for all 256 channel values.
- [ ] Generate a `testsrc2` clip in the scratch dir and run `pipe` against it in release; run `convert` in release; paste both output blocks into **Issues Encountered / Results**.
- [ ] `cargo fmt --all -- --check`, `cargo clippy --workspace -- -D warnings`, and `cargo test --bin live_pipe_probe` (or workspace test run) pass.

### Acceptance Criteria

**Scenario:** Measuring streamed ingestion and conversion cost on the M1.
**GIVEN** ffmpeg is available and a 10 s 1080p24 test clip exists.
**WHEN** `cargo run --release --bin live_pipe_probe -- pipe <clip>` runs.
**THEN** it reports ~240 frames delivered with sustained fps and per-frame latency stats, and exits 0 with no zombie ffmpeg process.
**WHEN** `cargo run --release --bin live_pipe_probe -- convert` runs.
**THEN** it reports ms/frame for all three conversion arms on a 57,600-px frame.
**AND** the LUT accuracy unit test passes.
**AND** clippy and fmt gates pass with zero warnings.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
