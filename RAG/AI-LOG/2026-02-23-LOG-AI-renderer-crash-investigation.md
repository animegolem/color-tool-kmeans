---
node_id: LOG-renderer-crash-2026-02-23
tags:
  - AI-log
  - development-summary
  - renderer-crash
  - webkit
  - video
  - sidebar
closed_tickets: []
created_date: 2026-02-23
related_files:
  - tauri-app/src/lib/views/home/file-ingestion.svelte.ts
  - tauri-app/src/lib/stores/ui.ts
  - tauri-app/src/lib/views/HomeView.svelte
  - tauri-app/src/lib/bridges/video.ts
confidence_score: 0.95
---

# 2026-02-23-LOG-AI-renderer-crash-investigation

## Work Completed

Investigated and fixed an intermittent WebKit renderer crash that occurred when multiple video files were loaded into the sidebar library.

**Root cause**: WebKit auto-plays and loops MP4 content placed in `<img>` tags (a Safari/WebKit-specific behavior). When 10+ videos were loaded, only the first was sent to VideoPanel for proper handling. The rest went through `ingestSelection()` which set `previewUrl = convertFileSrc(videoFilePath)` — the raw video URL. `MediaBucket` rendered these as `<img src="asset://...video.mp4">`, causing WebKit to simultaneously decode and loop all videos, exhausting GPU/memory resources and crashing the content process.

**Evidence gathered**:
- Sidebar thumbnails were actively playing full clips and looping
- Crash always occurred during idle (looping video decode as background load)
- Crash occurred after analysis rendered (by then all sidebar videos loaded and looping)
- Last sidebar item (active video) did NOT loop — it used an extracted PNG frame via `scheduleVideoFrameDecode`
- `imagesAfter=16` with only 1 having a proper PNG poster

**Fix applied**:
1. Null out `previewUrl` for video entries during ingestion (prevents MP4 in `<img>` tags)
2. Fire-and-forget `extractVideoFrame()` with `timestamp=0, maxDimension=200` for static thumbnails
3. Added `updateEntryPreview(id, previewUrl)` store function to update sidebar after extraction
4. Set `videoPath` on non-first video entries so `pendingVideoSwitch` correctly resolves video path on click

## Session Commits

Pending — changes not yet committed.

## Issues Encountered

The crash was non-deterministic and only appeared after all sidebar videos loaded and began looping. It did not reproduce when actively interacting with the app (scrubbing, clicking) because user interaction temporarily paused WebKit's background decode. This made it difficult to correlate the crash with video playback specifically.

The key insight was that WebKit treats `<img src="video.mp4">` as auto-playing looping video content, unlike Chromium which shows the first frame or ignores it. This is documented WebKit/Safari behavior but is not widely known.

## Tests Added

No automated tests added. Manual verification required:
- Load 10+ video files, confirm sidebar shows placeholders then static thumbnails
- Confirm no looping video playback in sidebar
- Confirm clicking non-first video loads it into center panel
- Confirm single video loading still works

## Next Steps

- Monitor for crash recurrence after fix deployment
- Consider adding a `isVideo` flag to `ImageEntry` for clearer type discrimination
- The 200px max dimension for sidebar thumbnails is a conservative choice; could be tuned based on actual sidebar width
- If GIF files exhibit similar behavior (auto-play in sidebar), the same pattern could be applied
