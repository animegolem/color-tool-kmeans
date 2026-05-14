---
node_id: AI-IMP-128
tags:
  - IMP-LIST
  - Implementation
  - video
  - ux
  - P3
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.9
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-128-expand-video-container-support

## Expand Video Container Support (.mov, .webm)

Currently hardcoded to `.mp4` in 3 places: `fs.ts` (dialog filter + `isVideoFile()`), `MediaBucket.svelte` (`isVideoName()`). Add `.mov` and `.webm` support. The ffmpeg backend already handles these formats.

**Cleanup**: `MediaBucket.svelte` infers video from filename suffix instead of using shared metadata — fix alongside by using `isVideoFile()` or checking `entry.videoPath`.

### Out of Scope

- Animated GIF support (deferred to separate ticket — requires animation detection + video pipeline routing)
- Adding new video codecs

### Design/Approach

1. Update `isVideoFile()` in `fs.ts` to include `.mov` and `.webm` extensions.
2. Update the file dialog filter in `fs.ts` to include `.mov` and `.webm`.
3. Replace `isVideoName()` in `MediaBucket.svelte` with `entry.videoPath` check or shared `isVideoFile()`.

### Files to Touch

- `tauri-app/src/lib/bridges/fs.ts`: extend video extension list in `isVideoFile` and dialog filter
- `tauri-app/src/lib/components/MediaBucket.svelte`: use shared video detection instead of local suffix check

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `.mov` and `.webm` to `isVideoFile()` extension check in `fs.ts`
- [x] Add `.mov` and `.webm` to file dialog filter in `fs.ts`
- [x] Replace `isVideoName()` in MediaBucket with `entry.videoPath` or shared detection
- [x] Fix hardcoded `type="video/mp4"` in 3 locations — now uses `inferMimeType()` for correct MIME
- [x] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** User loads a .mov video file.
**GIVEN** the user has a `.mov` video file.
**WHEN** the user opens the file dialog and selects the `.mov` file.
**THEN** the file is recognized as a video and processed through the video pipeline.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
