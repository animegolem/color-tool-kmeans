---
node_id: AI-IMP-097
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
  - media-ingest
kanban_status: planned
depends_on: [AI-EPIC-020, AI-IMP-096, AI-IMP-100]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.72
date_created: 2026-02-03
date_completed:
---

# AI-IMP-097-media-ingest

## Summary
Unify the image and video upload paths into a single "Add media" button and enable multi-file drag-drop (including on Tauri). Each ingested file is added to the Media Bucket in the Library sidebar. Replaces the current separate "Upload image" / "Upload video" buttons.

Done means: a single "Add media" button opens a native dialog accepting both image and video formats, multi-file drag-drop works on Tauri, and all ingested files appear in the Media Bucket without force-switching to each new item.

### Out of Scope
- Clipboard paste (IMP-098).
- Folder browsing (IMP-099).
- Switching/removal UX (IMP-100, though ingest must populate the store correctly).

### Design/Approach
- **Bridge (`fs.ts`)**: Add `openMediaFile()` method that opens a native dialog accepting both image and video formats. On Tauri side, add `open_media_dialog` command (or reuse existing with combined filters).
- **Store (`ui.ts`)**: Add `addFile(entry, dataset)` function that appends to `images` array and caches dataset WITHOUT force-switching to the new item (unlike current `setFile()` which always switches). Keep `setFile()` for backward compat — it calls `addFile()` then switches.
- **File ingestion (`file-ingestion.svelte.ts`)**: Replace `chooseFile()` + `chooseVideo()` with unified `chooseMedia()`. After selection, detect type by MIME/extension and route to image pipeline or video pipeline.
- **Drag-drop**: Enable for Tauri by listening to Tauri's `tauri://drag-drop` event (or WebKit drag events). Support multiple files. Each valid file goes through `addFile()`.
- **HomeView**: Replace the two-button upload group with a single "Add media" button. Update the drop overlay text.

### Key Codebase Notes
- Drag-drop is currently **disabled for Tauri** (returns early at `file-ingestion.svelte.ts:161-162`) — must be enabled.
- `setFile()` in `ui.ts` adds to array AND sets active — need a new `addFile()` that only adds.
- `openImageFile()` and `openVideoFile()` in `fs.ts` are separate methods with separate Tauri commands.
- Video ingest has a different pipeline: needs probe → frame extract → then enters image pipeline.

### Files to Touch
- `tauri-app/src/lib/bridges/fs.ts`: Add `openMediaFile()` method
- `tauri-app/src/lib/stores/ui.ts`: Add `addFile()` function, refactor `setFile()` to use it
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: Unified `chooseMedia()`, enable Tauri drag-drop, multi-file support
- `tauri-app/src/lib/views/HomeView.svelte`: Merge upload buttons, update drop overlay text
- `tauri-app/src-tauri/src/commands.rs`: Add `open_media_dialog` command (or extend existing)
- `tauri-app/src-tauri/src/main.rs`: Register new command

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `openMediaFile()` to `FsBridge` interface and both implementations (Tauri + browser)
- [ ] Add Rust `open_media_dialog` command accepting image + video filters
- [ ] Add `addFile(entry, dataset)` to `ui.ts` store that appends without switching active
- [ ] Refactor `setFile()` to call `addFile()` then set `activeImageId`
- [ ] Replace `chooseFile()` + `chooseVideo()` with `chooseMedia()` in file-ingestion
- [ ] Route media type (image vs video) after selection based on MIME/extension
- [ ] Enable multi-file drag-drop for Tauri (remove early return, wire Tauri drag event or WebKit events)
- [ ] Support dropping multiple files — each valid file added via `addFile()`
- [ ] Merge "Upload image" / "Upload video" into single "Add media" button in HomeView
- [ ] Update drop overlay text
- [ ] Verify video pipeline still works through unified path (probe → extract → ingest)
- [ ] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: Single media upload**
**GIVEN** the app is open with no active media
**WHEN** the user clicks "Add media" and selects a JPEG
**THEN** the image is loaded, added to the Media Bucket, and set as active.

**Scenario: Video via unified upload**
**GIVEN** the app is open
**WHEN** the user clicks "Add media" and selects an MP4
**THEN** the video pipeline activates (probe, extract frame) and the video appears in the Media Bucket.

**Scenario: Multi-file drop**
**GIVEN** the app is open
**WHEN** the user drags 3 images onto the app
**THEN** all 3 appear in the Media Bucket; the first becomes active.

**Scenario: Drop on Tauri**
**GIVEN** the app is running as a Tauri native build
**WHEN** the user drops a file onto the app window
**THEN** the file is ingested (drag-drop is no longer disabled for Tauri).

### Issues Encountered
<!-- Post-implementation notes go here -->
