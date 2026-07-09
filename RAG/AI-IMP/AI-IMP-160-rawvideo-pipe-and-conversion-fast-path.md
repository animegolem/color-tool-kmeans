---
node_id: AI-IMP-160
tags:
  - IMP-LIST
  - Implementation
  - performance
  - video
  - spike
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-025-live-analysis-performance-spike]]
confidence_score: 0.7
date_created: 2026-07-09
date_completed: 2026-07-09
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

- [x] `pipe` subcommand: persistent ffmpeg child, rawvideo rgb24 at fps=24 scale=WxH flags=area, `read_exact` frame loop with reusable buffer, stderr drained, child killed on exit/drop.
- [x] `pipe` reports: frame count, wall time, sustained fps, mean/p95/max per-frame read latency; errors are surfaced with actionable messages (bad path, ffmpeg missing, short read at EOF handled cleanly).
- [x] `convert` subcommand: three arms (current sequential / LUT sequential / LUT + rayon), deterministic input, 100 reps after warmup, ms/frame reported per arm.
- [x] Unit test: LUT sRGB→linear matches `color::srgb8_to_linear` within 1e-3 for all 256 channel values.
- [x] Generate a `testsrc2` clip in the scratch dir and run `pipe` against it in release; run `convert` in release; paste both output blocks into **Issues Encountered / Results**.
- [x] `cargo fmt --all -- --check`, `cargo clippy --workspace -- -D warnings`, and `cargo test --bin live_pipe_probe` (or workspace test run) pass. *(Completed by lead outside the Codex sandbox — see lead review note below.)*

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

### Results

Release `pipe` run against the generated 10 s, 1920×1080, 24 fps `testsrc2` clip (ffmpeg 8.1.2):

```text
Rawvideo pipe probe
  clip: /var/folders/2z/dqrvv7553gd31klj_931ph2h0000gn/T/imp160-testclip.mp4
  frame: 320x180 rgb24
  frames: 240
  wall time: 0.228 s
  sustained fps: 1052.37
  read latency mean: 0.938 ms
  read latency p95: 1.778 ms
  read latency max: 69.322 ms
```

Release `convert` run:

```text
OKLab conversion probe
  frame: 57600 pixels; 100 reps after 10 warmup
  current sequential rgb8_to_oklab: 2.858 ms/frame
  LUT sequential: 0.917 ms/frame
  LUT + rayon par_chunks: 0.381 ms/frame
```

### Issues Encountered

- The standalone clone does not include the Tauri-configured vendored ffmpeg/ffprobe sidecars. Cargo validation used a transient `TAURI_CONFIG='{"bundle":{"externalBin":[]}}'` override; the release pipe run used `/opt/homebrew/bin/ffmpeg` explicitly. No repository configuration was changed.
- The clone has no checked-in `Cargo.lock`, and the sandbox cannot reach `crates.io`. `cargo test --workspace` stops before test compilation while trying to download existing dev-dependency archives (first terminal error: `quick-error 1.2.3`; the offline attempt also identified `proptest` as unavailable). The LUT test itself was compiled as a Rust test harness through Cargo and passed (1 passed, 0 failed). `cargo fmt --all -- --check` and `cargo clippy --workspace -- -D warnings` pass. The combined gate checklist item remains open because the literal workspace test command could not complete.
- The successful pipe run waits on and reaps its ffmpeg child. Independent zombie verification could not be performed because this sandbox rejects both `pgrep` (`Cannot get process list`) and `ps` (`operation not permitted`).
- Negative-path release checks returned exit 1 with actionable diagnostics for both a missing clip and a missing ffmpeg executable. No implementation deviations or shipping-code changes were made.

### Lead review (2026-07-09)

- Closed the sandbox-blocked gates outside the sandbox: vendored ffmpeg/ffprobe sidecars copied into the clone (gitignored), then `cargo fmt --all -- --check` ✓, `cargo clippy --workspace -- -D warnings` ✓, `cargo test --workspace` ✓ (39 passed, 0 failed, including both LUT tests). Zombie check ✓ (`pgrep ffmpeg` empty after release pipe run).
- Review addition: `lut_pipeline_matches_shipping_rgb8_to_oklab` test — the bin duplicates the OKLab matrix from `color.rs` (per the don't-touch rule), so the full LUT pipeline is now pinned to the shipping conversion (17³ RGB sweep, 1e-3 tolerance) to fail loudly on drift.
- Lead reproduction of release runs (under mild CPU contention from a concurrent bench): pipe 884.47 fps sustained, read mean 1.118 ms / p95 2.017 ms; convert 2.814 / 0.918 / 0.303 ms per frame (current / LUT / LUT+rayon). Consistent with Codex's quieter-machine numbers above.
- Conclusion for EPIC-025 FR-2/FR-3: ingestion + conversion together cost ~1.3 ms of the 41.7 ms frame budget; neither is a bottleneck. Commit made by lead because the Codex sandbox cannot write `.git` even in a standalone clone.
