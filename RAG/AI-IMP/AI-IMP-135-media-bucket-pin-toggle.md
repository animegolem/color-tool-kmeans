---
node_id: AI-IMP-135
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - ui
  - media-bucket
kanban_status: planned
depends_on:
  - AI-IMP-134
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.8
date_created: 2026-03-18
date_completed:
---

# AI-IMP-135-media-bucket-pin-toggle

## MediaBucket pin toggle UI + right-click context menus

The media bucket sidebar needs two new affordances for the batch analysis workflow: (1) a pin/star toggle on each item for building the batch set, and (2) right-click context menus for frame capture and export. These are active across all views — users can pin images while working in Colors or Values and switch to Batch later.

### Out of Scope

- BatchView itself (IMP-136).
- Persisting pin state to preferences (Phase 2 enhancement).
- Scene detection workflow (deferred IMP-137).
- Changes to existing click-to-activate or drag-drop behavior.

### Design/Approach

**Pin toggle:**
- Small star icon (★/☆) rendered top-left corner of each media bucket item.
- Clicking the star calls `togglePin(id)` from multi-analysis store.
- Pinned items get accent left-border + filled star. Unpinned items get subtle outline star.
- Raw video entries (items where the entry itself is a video file without `frameTimestamp`) show the star as disabled/dimmed with `pointer-events: none`.
- Pin count footer at bottom of bucket: `"N pinned"` with `[Clear pins]` button (calls `clearPins()`). Only visible when N > 0.

**Right-click context menu:**
- Use a custom context menu component (positioned absolutely, dismissed on outside click or Escape).
- Image items: "Export image..." (delegates to existing export save-from-path flow).
- Video items (with active video state): "Add frame to media bucket" (extracts current frame via existing `extract_video_frame` command, adds to bucket auto-pinned) + "Export...".
- Non-active video items: "Export..." only.

**Captured-frame entry semantics:**
"Add frame to media bucket" creates a **new standalone `ImageEntry`** with:
- New unique ID (UUID — must NOT reuse the video entry's ID)
- `path` = extracted frame PNG path (from `extract_video_frame` cache output)
- `videoPath` = source video path (for provenance — bucket will show video badge)
- `frameTimestamp` = current playback position (ensures bucket treats it as a frame, not a raw video)
- `previewUrl` = `convertFileSrc(framePath)` for thumbnail
- Appended via `appendFile()`, not `setFile()` (does not change active selection)
- Auto-pinned via `togglePin(newId)` after append

This mirrors the existing `onFrameExtracted` callback pattern in `video-scrubber.svelte.ts` but appends a new entry rather than replacing the video's frame entry. The key distinction: existing scrubber reuses the video entry ID (so the video row always shows the latest frame), while "Add frame" creates independent entries that accumulate in the bucket.

**Star icon click must stop propagation** to prevent triggering the existing item click (switchToFile/switchToVideo).

### Files to Touch

- `src/lib/components/MediaBucket.svelte`: pin toggle overlay, pin count footer, right-click handler, context menu rendering
- `src/lib/components/BucketContextMenu.svelte`: new component for right-click menu (~80 LOC)
- `src/lib/stores/multi-analysis.ts`: imports for `togglePin`, `clearPins`, `pinnedImageIds`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add star toggle overlay to each item in MediaBucket grid
  - [ ] Import `pinnedImageIds`, `togglePin`, `clearPins` from stores
  - [ ] Render ★ (filled) when pinned, ☆ (outline) when unpinned
  - [ ] `onclick` calls `togglePin(id)` with `stopPropagation()`
  - [ ] Disable star for raw video entries (no `frameTimestamp`)
- [ ] Add pinned visual indicator: accent left-border on pinned items
- [ ] Add pin count footer: `"N pinned [Clear pins]"` visible when N > 0
- [ ] Create `BucketContextMenu.svelte` component
  - [ ] Positioned at cursor coordinates, dismissed on outside click / Escape
  - [ ] Renders menu items based on entry type (image vs video)
- [ ] Wire right-click (`oncontextmenu`) on bucket items to show context menu
  - [ ] Image items: "Export image..." menu item
  - [ ] Active video items: "Add frame to media bucket" + "Export..." menu items
  - [ ] "Add frame" extracts frame, creates entry, adds to bucket, auto-pins
- [ ] Validate: `npm run check && npm run lint`
- [ ] Manual smoke: pin 3 images across views, verify visual state, right-click menus

### Acceptance Criteria

**Scenario:** Pinning images from Colors view
**GIVEN** 4 images are in the media bucket and the user is on the Colors view.
**WHEN** the user clicks the star icon on images 1 and 3.
**THEN** images 1 and 3 show filled star + accent border.
**AND** the pin count footer reads "2 pinned".
**AND** the existing click-to-activate behavior is not triggered.

**Scenario:** Clearing pins
**GIVEN** 3 images are pinned.
**WHEN** the user clicks "Clear pins" in the footer.
**THEN** all stars revert to outline, pin count footer disappears.

**Scenario:** Right-click context menu on video entry
**GIVEN** a video is loaded and actively playing (has videoState).
**WHEN** the user right-clicks the video entry in the bucket.
**THEN** a context menu appears with "Add frame to media bucket" and "Export...".
**WHEN** the user clicks "Add frame to media bucket".
**THEN** the current frame is extracted, added to the bucket as a new image entry, and auto-pinned.

**Scenario:** Raw video exclusion
**GIVEN** a video file entry exists in the bucket without any extracted frames.
**WHEN** the user views the bucket.
**THEN** the star icon on that entry is dimmed and non-interactive.

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
