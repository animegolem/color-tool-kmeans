---
node_id: AI-IMP-085
tags:
  - IMP-LIST
  - Implementation
  - video
  - analysis
  - tauri
kanban_status: in-progress
depends_on:
  - AI-EPIC-016
  - AI-IMP-083
confidence_score: 0.5
date_created: 2026-01-30
date_completed:
---

# AI-IMP-085-frame-decode-and-analysis-integration

## Decode frames on scrub stop and run analysis
Wire the video scrub interaction to decode the current frame and feed it into the existing color/values pipelines. Done means: scrubbing (debounced) triggers analysis updates for the current frame with proper cancellation and UI feedback.

### Out of Scope
- Playback performance tuning beyond debounce/cancel.
- Advanced caching or keyframe index optimizations.
- Exporting video analysis sequences.

### Design/Approach
- On scrub stop, call a Tauri command that returns a frame at the requested timestamp.
- Downscale to analysis field size before computation (reuse existing downscale path).
- Use a debounce timer (e.g., 200–300ms) and ignore stale responses.
- Update analysis stores the same way as still images to avoid code duplication.

### Files to Touch
- `tauri-app/src/lib/bridges/`: add a video decode bridge.
- `tauri-app/src/lib/stores/`: add decoded frame state + request versioning.
- `tauri-app/src/lib/views/HomeView.svelte`: trigger decode on scrub idle.
- `tauri-app/src-tauri/src/main.rs`: add Tauri command for frame extraction.
- `tauri-app/src-tauri/src/ffmpeg.rs`: leverage sidecar decode helper.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add Tauri command to request a frame at timestamp + size and return RGBA/PNG.
- [x] Add renderer bridge to call the command and handle errors.
- [x] Debounce scrub events and ignore stale decode responses.
- [x] Feed decoded frames into existing analysis pipeline and update UI.
- [x] Add minimal logging for decode timing and analysis update.

### Acceptance Criteria
- **GIVEN** a video is loaded **WHEN** the user scrubs and stops **THEN** analysis updates to the new frame within the debounce window.
- **GIVEN** rapid scrubbing **WHEN** multiple decode requests overlap **THEN** only the latest result is applied.
- **GIVEN** decode fails **WHEN** a frame is requested **THEN** the UI shows a non-blocking error state and remains responsive.

### Issues Encountered
- Pending manual validation: user to confirm scrub/stop updates analysis on macOS/Windows/Linux.
