---
node_id: AI-IMP-097
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
  - media-ingest
kanban_status: completed
depends_on: [AI-EPIC-020, AI-IMP-096]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.85
date_created: 2026-02-03
date_completed: 2026-02-24
---
gi
# AI-IMP-097-media-ingest

## Summary
Unify the image and video upload paths into a single "Add media" button and enable multi-file drag-drop on Tauri. Each ingested file is added to the Media Bucket in the Library sidebar. Replaces the current separate "Upload image" / "Upload video" buttons.

Done means: a single "Add media" button opens a native dialog accepting both image and video formats, multi-file drag-drop works via Tauri event listener, and all ingested files appear in the Media Bucket. First file in a batch is activated; subsequent files are appended without switching.

### Out of Scope
- Clipboard paste (IMP-098).
- Folder browsing (IMP-099).
- Switching/removal UX (IMP-100, though ingest must populate the store correctly).
- Session management toggle (IMP-112 — MKVToolNix-style "load into session vs. start new" dialog).
- Browser bridge cleanup (IMP-111 — legacy `createBrowserFsBridge()` removal).

### Design/Approach

- **Bridge (`fs.ts`)**: Replace `openImageFile()` and `openVideoFile()` with `openMediaFiles()` (plural) returning `FileSelection[] | null`. Uses Tauri `pick_files()` under the hood.
- **Rust (`commands.rs`)**: Replace both `open_image_dialog` and `open_video_dialog` with a single `open_media_dialog` command using `pick_files()` with filter groups (Images / Videos / All Media). Delete the old commands.
- **Drag-drop**: Use `listen('tauri://drag-drop')` for filesystem paths. No browser drop path for file ingestion. Existing WebKit drag event handlers remain for overlay visuals only (hover state, drop zone highlight).
- **Store (`ui.ts`)**: No new `addFile()` needed. Default policy is "always switch" — `setFile()` is called per file. For multi-drop: call `setFile()` for the first file (activates it), then for subsequent files use an append-only path that adds to `images` array without changing `activeImageId`.
- **Video handling**: In a multi-file batch, process all images normally. Route the **first video only** through the video pipeline. Skip additional videos with a user-facing banner/toast.
- **`ingestSelection()` (`file-ingestion.svelte.ts`)**: Remove `clearVideoSelection()` call from `ingestSelection()`. Callers are responsible for clearing video state once before their ingest loop.
- **Auto-switch policy**: New files always activate (matches current `setFile()`). Multi-drop activates the first file. A future session toggle (IMP-112) may change this behavior.
- **Rust command registration**: Register `open_media_dialog` in `main.rs`, remove old command registrations.

### Key Codebase Notes
- Drag-drop currently disabled for Tauri (early return at `file-ingestion.svelte.ts:161-162`) — will be replaced with `listen('tauri://drag-drop')` Tauri event listener in the Tauri app shell or file-ingestion module.
- `setFile()` in `ui.ts` adds to array AND sets active — this is the correct behavior for single ingest and first-in-batch. Need an append-only variant for subsequent batch items.
- `openImageFile()` and `openVideoFile()` in `fs.ts` are separate methods with separate Tauri commands — both replaced by single `openMediaFiles()`.
- Video ingest has a different pipeline: needs probe -> frame extract -> then enters image pipeline.
- Browser bridge in `fs.ts` is legacy from EPIC-005 (Sept 2025, shell-agnostic era) — cleanup deferred to IMP-111.

### Files to Touch
- `tauri-app/src/lib/bridges/fs.ts`: Replace `openImageFile()` / `openVideoFile()` with `openMediaFiles()`
- `tauri-app/src/lib/stores/ui.ts`: Add append-only variant for batch adds (no active switch)
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: Unified `chooseMedia()`, Tauri drag-drop via event listener, multi-file support, remove `clearVideoSelection()` from `ingestSelection()`
- `tauri-app/src/lib/views/HomeView.svelte`: Merge upload buttons into single "Add media", update drop overlay text
- `tauri-app/src-tauri/src/commands.rs`: Replace `open_image_dialog` + `open_video_dialog` with `open_media_dialog` using `pick_files()`
- `tauri-app/src-tauri/src/commands_types.rs`: Update request/response DTOs for new command
- `tauri-app/src-tauri/src/main.rs`: Register `open_media_dialog`, remove old command registrations

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add Rust `open_media_dialog` command using `pick_files()` with filter groups (Images / Videos / All Media)
- [x] Register `open_media_dialog` in `main.rs`, remove `open_image_dialog` and `open_video_dialog` registrations
- [x] Delete old `open_image_dialog` and `open_video_dialog` command handlers from `commands.rs`
- [x] Replace `openImageFile()` / `openVideoFile()` with `openMediaFiles()` in `FsBridge` interface and Tauri implementation (return `FileSelection[] | null`)
- [x] Add append-only store function for batch adds (adds to `images` without switching `activeImageId`)
- [x] Replace `chooseFile()` + `chooseVideo()` with unified `chooseMedia()` in file-ingestion
- [x] Route media type (image vs video) after selection based on MIME/extension
- [x] Implement first-video-only policy: process first video in batch, skip extras with banner
- [x] Remove `clearVideoSelection()` from `ingestSelection()`; move to callers (clear once before loop)
- [x] Replace Tauri drag-drop early return with `listen('tauri://drag-drop')` event listener for filesystem paths
- [x] Keep existing WebKit drag handlers for overlay visuals only (hover/highlight)
- [x] Multi-drop: activate first file via `setFile()`, append rest via append-only path
- [x] Merge "Upload image" / "Upload video" into single "Add media" button in HomeView
- [x] Update drop overlay text
- [x] Verify video pipeline still works through unified path (probe -> extract -> ingest)
- [x] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: Single media upload**
**GIVEN** the app is open with no active media
**WHEN** the user clicks "Add media" and selects a JPEG
**THEN** the image is loaded, added to the Media Bucket, and set as active.

**Scenario: Video via unified upload**
**GIVEN** the app is open
**WHEN** the user clicks "Add media" and selects an MP4
**THEN** the video pipeline activates (probe, extract frame) and the video appears in the Media Bucket.

**Scenario: Multi-file drop on Tauri**
**GIVEN** the app is running as a Tauri native build
**WHEN** the user drops 3 images onto the app window
**THEN** all 3 appear in the Media Bucket; the first becomes active.
**AND** the drop is handled via Tauri event listener (not WebKit file drop).

**Scenario: Multi-file with mixed media**
**GIVEN** the app is open
**WHEN** the user drops 2 images and 2 videos onto the app
**THEN** both images are ingested, the first video is processed through the video pipeline, the second video is skipped with a user-facing banner.
**AND** the first file (by order) becomes active.

**Scenario: Native dialog multi-select**
**GIVEN** the app is open
**WHEN** the user clicks "Add media" and selects 3 files in the native dialog
**THEN** all 3 are ingested following the same batch rules (first active, first-video-only).

### Issues Encountered
<!-- Post-implementation notes go here -->
