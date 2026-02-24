---
node_id: AI-IMP-100
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
  - media-bucket
kanban_status: completed
depends_on: [AI-EPIC-020, AI-IMP-096]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.75
date_created: 2026-02-03
date_completed: 2026-02-24
---

# AI-IMP-100-active-item-switching-removal

## Summary
Make the Library sidebar's Media Bucket section functional: render actual entries from the `$images` store as thumbnail items, click to switch active, X to remove individual items. Currently the sidebar shows placeholder "No items yet" text.

Done means: the Media Bucket section in the sidebar shows thumbnails for all loaded media, supports instant switching via click, and per-item removal via X button with selective cache cleanup.

### Out of Scope
- Persistence across sessions.
- Bulk operations (multi-select remove).
- Unified ingest changes (IMP-097 — this ticket focuses on display, switching, and removal).

### Design/Approach
- **`removeFile(id)` in `ui.ts`**: Currently `clearFile()` nukes ALL images and ALL analysis caches. Need to add `removeFile(id)` that removes a single entry, revokes its blob URL, and deletes only its analysis cache entries — WITHOUT touching other images. `clearFile()` remains for "clear all".
- **Sidebar rendering**: Replace placeholder in `App.svelte` library-rail with actual item list from `$images`. Each item shows: thumbnail (from `previewUrl`), filename, and X button.
- **Click to switch**: Clicking a Media Bucket item sets `activeImageId` to that item's ID. Analysis cache (`analysisById[id]`) means no re-analysis needed.
- **Active indicator**: Visual highlight on the currently active item.
- **Active fallback**: If the removed item was active, switch to next/previous item or null.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`: Add `removeFile(id)` function; selective cache cleanup
- `tauri-app/src/App.svelte`: Replace placeholder library-rail content with Media Bucket item list
- `tauri-app/src/app.css`: Thumbnail grid/list styles for Media Bucket items

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `removeFile(id)` to `ui.ts` — removes from `images` array, revokes blob URL, clears analysis caches for that ID only
- [x] If removed item was active, switch to next/previous item or null
- [x] Render Media Bucket items in sidebar from `$images` store (thumbnail + name + X)
- [x] Click item → set `activeImageId` (instant switch, no re-analysis)
- [x] Visual active indicator on current item
- [x] X button calls `removeFile(id)`
- [x] Empty state when no items loaded
- [x] Verify analysis cache survives switching (no re-run)
- [x] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: Switch active**
**GIVEN** two items in the Media Bucket
**WHEN** the user clicks the second item
**THEN** it becomes active with visual highlight and analysis loads from cache if available.

**Scenario: Remove item**
**GIVEN** an item in the Media Bucket
**WHEN** the user clicks X on that item
**THEN** it disappears from the Media Bucket, its blob URL is revoked, and its analysis cache is cleared.
**AND** if it was active, the next available item becomes active (or null if empty).

**Scenario: Empty state**
**GIVEN** all items have been removed
**WHEN** the Media Bucket is empty
**THEN** a placeholder "No items yet" message is displayed.

### Issues Encountered
<!-- Post-implementation notes go here -->
