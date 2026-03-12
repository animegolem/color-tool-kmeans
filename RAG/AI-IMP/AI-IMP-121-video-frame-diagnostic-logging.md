---
node_id: AI-IMP-121
tags:
  - IMP-LIST
  - Implementation
  - video
  - diagnostics
  - logging
kanban_status: backlog
depends_on: []
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.95
date_created: 2026-03-11
date_completed:
---

# AI-IMP-121-video-frame-diagnostic-logging

## Video Frame Offset Diagnostic Logging

HomeView and ValuesView independently call `extractVideoFrame()` for the same video. An observed issue shows ValuesView rendering a frame ~1 frame later than HomeView at the same scrub position. Root cause: dual extraction pipelines with floating-point timestamp divergence amplified by ffmpeg's keyframe-based seeking (`-ss` before `-i`).

This ticket adds `timestampUsed` to `VideoFrameResponse` so JS event logs reveal the exact 3-decimal timestamp ffmpeg received, enabling diagnosis when the offset recurs. The actual pipeline unification fix is tracked under EPIC-022.

### Out of Scope

- Unifying the dual extraction pipelines (EPIC-022 scope)
- Changing ffmpeg seeking strategy (`-ss` placement)
- Frame caching or deduplication between views

### Design/Approach

Pass the formatted timestamp string (`{:.3}`) from `extract_frame_png` back through the Tauri command response. The JS log lines in both HomeView and ValuesView now include `t_req` (the JS-side requested timestamp at 4 decimal places) and `t_ffmpeg` (the Rust-formatted 3-decimal timestamp actually sent to ffmpeg). Comparing these two values across Colors and Values views at the same scrub position reveals whether timestamp divergence is the source of frame offset.

Future fix direction: share the extracted frame path via `videoState` store so only one extraction occurs per scrub position.

### Files to Touch

- `tauri-app/src-tauri/src/commands_types.rs`: add `timestamp_used: String` to `VideoFrameResponse`
- `tauri-app/src-tauri/src/ffmpeg.rs`: return formatted timestamp from `extract_frame_png`
- `tauri-app/src-tauri/src/commands.rs`: pass through `timestamp_used` in response
- `tauri-app/src/lib/bridges/video.ts`: add `timestampUsed?` to TS interface
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: log `t_req` + `t_ffmpeg`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`: log `t_req` + `t_ffmpeg`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `timestamp_used: String` field to `VideoFrameResponse` in `commands_types.rs`
- [x] Change `extract_frame_png` return type from `Result<(), String>` to `Result<String, String>` and return the formatted timestamp
- [x] Capture returned timestamp in `extract_video_frame` command and populate `timestamp_used`
- [x] Add `timestampUsed?: string` to TypeScript `VideoFrameResponse` interface
- [x] Update HomeView log to `video:frame:done t_req=... t_ffmpeg=...`
- [x] Update ValuesView log to `values:video:frame:done t_req=... t_ffmpeg=...`
- [ ] Verify `cargo clippy --workspace -- -D warnings` passes
- [ ] Verify `npm run check && npm run lint` passes
- [ ] Manual test: load video, scrub, confirm event logs show both `t_req` and `t_ffmpeg`

### Acceptance Criteria

**Scenario:** Developer scrubs a video and checks event logs for timestamp diagnostics.
**GIVEN** a video is loaded in the app.
**WHEN** the user scrubs to a specific position in either Colors or Values view.
**THEN** the event log shows `t_req` (JS-requested timestamp) and `t_ffmpeg` (Rust-formatted timestamp sent to ffmpeg).
**AND** both values are present and comparable across views for the same scrub position.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
