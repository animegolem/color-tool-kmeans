---
node_id: AI-IMP-145
tags:
  - IMP-LIST
  - Implementation
  - video
  - media-bucket
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.7
date_created: 2026-03-19
date_completed:
---

# AI-IMP-145-video-frame-snapshot

## Video frame snapshot to media bucket

Users working with video input need a way to capture the current frame as a still image and add it to the media bucket for independent analysis or batch inclusion. The current workflow requires external screenshot tools. A camera icon overlay on the video preview (low opacity, raised on hover) should snapshot the displayed frame and add it as a new media bucket entry.

### Out of Scope

- Batch frame extraction (extracting many frames at once).
- Video timeline scrubbing improvements.
- Frame export to disk (uses existing media bucket → export flow).

### Design/Approach

Add a camera SVG icon overlay positioned at the upper-right corner of the video preview in HomeView and ValuesView. On click, extract the current frame via the existing `ffmpeg` bridge (or canvas capture if the frame is already rendered), save to a temp file, and call `appendFile()` to add it to the media bucket. The icon should be semi-transparent (e.g., 30% opacity) and raise to full on hover.

**Scope reduction (2026-06-09 code review):** no new extraction work is needed. `video-controller.svelte.ts` already extracts the current frame to disk on every scrub and registers it as the active `ImageEntry` (with `frameTimestamp`). Snapshot is essentially "persist the current frame entry as a standalone bucket entry": new stable ID, descriptive name (e.g., `video.mp4 @ 12.4s`), `appendFile()`. The one real design point: the extracted frame lives in the prunable cache dir (`cache.rs` pruning), so the snapshot must copy the file to a non-pruned location to survive cache cleanup.

### Files to Touch

- `src/lib/views/home/VideoPanel.svelte`: add camera overlay
- `src/lib/views/ValuesView.svelte`: add camera overlay on video preview
- `src/lib/bridges/video.ts` or canvas capture utility: frame extraction
- `src/lib/assets/`: camera SVG icon

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Source or create camera SVG icon (check existing icon set licenses)
- [ ] Add overlay component to VideoPanel
- [ ] Implement frame capture (ffmpeg extract or canvas toBlob)
- [ ] Save captured frame to temp file
- [ ] Call appendFile() to add to media bucket
- [ ] Add overlay to ValuesView video preview
- [ ] Manual smoke: capture frame → appears in sidebar → can be analyzed

### Acceptance Criteria

**Scenario:** Capture video frame
**GIVEN** a video is loaded and playing/paused on HomeView.
**WHEN** the user clicks the camera icon overlay.
**THEN** the current frame is added to the media bucket as a new image entry.
**AND** the entry has a preview thumbnail visible in the sidebar.

### Issues Encountered

<!--
This section is filled out post work.
-->
