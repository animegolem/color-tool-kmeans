# AI-EPIC
---
node_id: AI-EPIC-016
tags:
  - EPIC
  - AI
  - video
  - tauri
  - ffmpeg
  - ui
date_created: 2026-01-30
date_completed:
kanban_status: in-progress
AI_IMP_spawned:
---

# AI-EPIC-016-video-input-and-frame-analysis

## Problem Statement/Feature Scope
Users want to analyze short animation clips (e.g., sakugabooru MP4s) the same way they analyze stills. The current pipeline only accepts images, so there is no way to scrub a clip, pause on a frame, and run k-means / values analysis on that frame.

## Proposed Solution(s)
- Add a video loader that accepts local MP4 (H.264/H.265) and displays a scrub timeline with play/pause.
- On scrub stop (debounced), decode the current frame, downscale to the analysis field size, and run existing color/values pipelines on that frame.
- Bundle FFmpeg as a sidecar for consistent cross-platform decode and deterministic frame access.
- Surface the current timestamp/frame in the UI so users can orient their analysis.

## Path(s) Not Taken
- HTML video decode via WebView due to Linux codec/plugin variability and less deterministic frame access.

## Success Metrics
1. User can load a 100MB MP4 and scrub to any time, triggering analysis within 500ms after a 250ms idle.
2. Same video yields consistent analysis results on macOS, Windows, and Linux.
3. App packaging still produces AppImage/.dmg/.msi with FFmpeg bundled.

## Requirements

### Functional Requirements
- [ ] FR-1: The system shall accept local MP4 files for analysis.
- [ ] FR-2: The UI shall provide play/pause controls and a scrub timeline.
- [ ] FR-3: Scrubbing shall debounce analysis until the user stops interacting.
- [ ] FR-4: The current frame shall be decoded via FFmpeg and fed into existing pipelines.
- [ ] FR-5: The UI shall display the current timestamp (and optionally frame number).
- [ ] FR-6: The analysis view shall update to reflect the currently sampled frame.

### Non-Functional Requirements
- [ ] NFR-1: Decoding must be deterministic across macOS/Windows/Linux.
- [ ] NFR-2: Analysis should remain responsive for 2–400s clips up to 100MB.
- [ ] NFR-3: The app must remain fully offline; FFmpeg is bundled locally.
- [ ] NFR-4: Sidecar binaries must be included in AppImage/.dmg/.msi builds.

## Implementation Breakdown

### Planned Tickets
- AI-IMP-083: FFmpeg sidecar bundling + CLI decode contract
- AI-IMP-084: Video loader UI + timeline controls
- AI-IMP-085: Frame decode + analysis integration

### Completed Tickets
