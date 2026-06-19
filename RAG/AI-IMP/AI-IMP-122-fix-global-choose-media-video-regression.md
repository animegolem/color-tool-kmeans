---
node_id: AI-IMP-122
tags:
  - IMP-LIST
  - Implementation
  - bug
  - P1
  - video
  - media-ingestion
kanban_status: completed
depends_on: []
parent_epic:
confidence_score: 0.9
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-122-fix-global-choose-media-video-regression

## Fix globalChooseMedia video-as-image regression

`globalChooseMedia()` in `App.svelte:65-89` activates the first selected file unconditionally via `setActivePath` + `setFile`, regardless of type. When uploading from Exports or Settings view, a video file becomes the "active image" and downstream views auto-run `analyzeImage` on it through the image decoder pipeline, which fails or produces garbage output.

**Fix**: Check `entry.videoPath` before activation. If video, skip `setActivePath` (append-only to library) or route to a video-capable view.

**Cleanup**: `handleUpload` (line 91) and `handleMediaAdd` (line 100) are identical — consolidate into one function.

### Out of Scope

- Changing how HomeView or ValuesView handle video entries (those paths work correctly)
- Auto-switching view when a video is loaded from non-video views

### Design/Approach

1. In `globalChooseMedia()`, after `ingestFileAsEntry()`, check `entry.videoPath`:
   - If video: `appendFile` only (no activation) — avoids image pipeline. Video can be activated from Home/Values view.
   - If image: existing behavior (setActivePath + setFile)
2. Consolidated `handleUpload` into `handleMediaAdd` (identical logic, single function).

### Files to Touch

- `tauri-app/src/App.svelte`: fix `globalChooseMedia`, consolidate handlers

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Read `App.svelte` and confirm the bug path (video file → `setActivePath` → image analysis)
- [x] Add video detection check in `globalChooseMedia()` using `entry.videoPath`
- [x] For video files: append-only to library (skip `setActivePath`/`setFile`)
- [x] For image files: keep existing `setActivePath` + `setFile` behavior
- [x] Consolidate `handleUpload` and `handleMediaAdd` into `handleMediaAdd`
- [x] Verify `npm run check && npm run lint` passes
- [ ] Manual test: upload video from Exports view — should not trigger image analysis

### Acceptance Criteria

**Scenario:** User uploads a video file while on ExportsView.
**GIVEN** the user is on the Exports view.
**WHEN** the user clicks Upload and selects a `.mp4` video file.
**THEN** the video is added to the media library without triggering image analysis.
**AND** no error or garbage output is produced.

**Scenario:** User uploads an image file while on ExportsView.
**GIVEN** the user is on the Exports view.
**WHEN** the user clicks Upload and selects a `.png` image file.
**THEN** the image is activated and set as the selected file (existing behavior preserved).

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
