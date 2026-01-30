---
node_id: AI-IMP-083
tags:
  - IMP-LIST
  - Implementation
  - video
  - ffmpeg
  - tauri
kanban_status: completed
depends_on: AI-EPIC-016
confidence_score: 0.55
created_date: 2026-01-30
close_date: 2026-01-30
---

# AI-IMP-083-ffmpeg-sidecar-bundling-and-cli-contract

## Bundle FFmpeg sidecar + define decode contract
Provide FFmpeg as a per-OS sidecar binary and define a minimal decode command/API for extracting a single frame at a timestamp (with downscale). Done means: sidecar binaries are bundled for macOS/Windows/Linux, a Rust command can invoke them, and a stable CLI contract is documented in code.

### Out of Scope
- UI changes for video controls.
- Wiring decoded frames into analysis pipelines.
- Optimizations like keyframe indexing or caching.

### Design/Approach
- Use Tauri sidecar execution for FFmpeg/ffprobe.
- Define a single "extract frame" CLI: input path + timestamp + output size + format (PNG or raw RGBA).
- Store per-OS sidecars under a consistent path and load via `Command::new_sidecar`.
- Add minimal validation + error reporting for missing binaries.

### Files to Touch
- `tauri-app/src-tauri/tauri.conf.json`: register sidecar binaries.
- `tauri-app/src-tauri/src/main.rs`: sidecar setup + command wiring.
- `tauri-app/src-tauri/src/ffmpeg.rs`: new helper to build/execute ffmpeg commands.
- `scripts/` or `tauri-app/scripts/`: fetch/place ffmpeg binaries for CI/local.
- `README.md` or `ATTRIBUTIONS.md`: update ffmpeg attribution guidance.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add per-OS ffmpeg/ffprobe binaries to the repo or download in CI and place where Tauri expects sidecars.
- [x] Register the sidecar binaries in `tauri-app/src-tauri/tauri.conf.json`.
- [x] Add a Rust helper to invoke ffmpeg and return a frame (PNG or raw RGBA) at a timestamp.
- [x] Add error handling/logs for missing sidecar or decode failure.
- [x] Document the CLI contract and expected output size/format in code comments.

### Acceptance Criteria
- **GIVEN** ffmpeg sidecars are present **WHEN** a decode command is invoked **THEN** a single frame is extracted at the requested timestamp and size.
- **GIVEN** ffmpeg sidecar is missing **WHEN** a decode command is invoked **THEN** a clear error is returned and logged.
- **GIVEN** the app is packaged **WHEN** the bundle is inspected **THEN** ffmpeg sidecar is included on all supported OSes.

### Issues Encountered
{LOC|20}
