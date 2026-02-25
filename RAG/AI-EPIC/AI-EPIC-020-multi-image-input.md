---
node_id: AI-EPIC-020
tags:
  - EPIC
  - AI
  - ui
  - multi-image
  - input
  - library
date_created: 2026-01-22
date_completed: 2026-02-24
kanban_status: completed
AI_IMP_spawned:
---
# AI-EPIC-020-multi-image-input

## Problem Statement/Feature Scope
Users need to load, manage, and compare multiple references (images and videos) without juggling external tabs. The current UI only supports a single active image even though store architecture supports ID-keyed caching. We need a Library sidebar with a **Media Bucket** section (always visible, showing loaded media) and an optional **Folder Browser** (IDE-style file tree). The Library must be accessible from all views (Colors, Values, Exports).

## Proposed Solution(s)
- Right-side **Library** sidebar that can expand/collapse without disrupting the main CSS Grid layout.
- **Media Bucket** section: shows all loaded media as thumbnails, supports click-to-switch and per-item removal.
- **Unified media ingest**: single "Add media" button replaces separate image/video upload buttons; multi-file drag-drop (including on Tauri).
- Support clipboard paste for images (Ctrl/Cmd+V) in the main view.
- Optional **Folder Browser**: IDE-style collapsible file tree for a session-scoped root folder with image thumbnails. Stretch feature — may be deprecated if lift is disproportionate.
- Keep state ephemeral: no persistence across app restarts.
- Leverage existing per-image analysis caching in stores for instant switching.

## Path(s) Not Taken
- Persistent library across sessions (explicitly out of scope).
- Full disk browser / multiple-root tree (avoid extra permission scope complexity).
- Modal-based image management (sidebar is more immediate).
- Video controls on Values view deferred to IMP-110 (future).

## Success Metrics
1. User can drag 3+ images and each appears in the Media Bucket.
2. Switching active item preserves analysis state without re-running.
3. Clipboard paste loads an image into the Media Bucket.
4. Library sidebar is accessible and functional from Colors, Values, and Exports views.

## Requirements

### Functional Requirements
- [x] FR-1: Library sidebar with Media Bucket section; accessible from all views. Can expand/collapse.
- [x] FR-2: Unified media ingest (merged upload button, multi-file drag-drop) populates Media Bucket.
- [x] FR-3: Clipboard paste (Ctrl/Cmd+V) loads image into Media Bucket.
- [ ] FR-4: Folder Browser: IDE-style file tree for session-scoped folder, with image thumbnails. Stretch feature. *(deferred — IMP-099)*
- [x] FR-5: Switching active item preserves analysis state (verify existing store).
- [x] FR-6: Remove (X) action per item to unload from Media Bucket (no disk delete).
- [ ] FR-7: Optional filter by type (image/video) when both are present. *(nice-to-have, no IMP)*
- [x] FR-8: Library sidebar accessible from Colors, Values, and Exports views.

### Non-Functional Requirements
- [x] NFR-1: Switching active item should be instant (no re-analysis).
- [x] NFR-2: Sidebar interactions should not cause layout jumps or scroll resets.

## Implementation Breakdown

### Completed Tickets
- AI-IMP-096: Library Drawer Shell
- AI-IMP-097: Media Ingest (Unified Upload + Multi-Drop)
- AI-IMP-098: Clipboard Paste to Media Bucket
- AI-IMP-100: Media Bucket Navigation & Removal
- AI-IMP-101: Header Bar Layout
- AI-IMP-109: Library Sidebar on All Views
- AI-IMP-110: Video Controls on Values View

### Deferred Tickets

| IMP | Title | Priority | Reason |
|-----|-------|----------|--------|
| 099 | Folder Browser (IDE File Tree) | P4 - Stretch | Lift disproportionate to value |
| 112 | Session Management Toggle | P4 | Deferred to future epic |

### Dependency Graph

```
COMPLETED: IMP-096 (drawer shell), IMP-101 (header bar)
         |
    IMP-100 (Media Bucket Navigation)  <-  P1, Core
         |
    IMP-097 (Media Ingest)             <-  P1, Core
         |
    IMP-109 (Sidebar All Views)        <-  P2
         |
    IMP-098 (Clipboard Paste)          <-  P3, Nice-to-have
    IMP-099 (Folder Browser)           <-  P4, Stretch (may deprecate)
    IMP-110 (Video on Values)          <-  P4, Future
```

> **Note**: Folder Browser (IMP-099) is stretch and may be deprecated if lift is disproportionate.

## Notes
Store foundation already exists:
- `images: ImageEntry[]`
- `activeImageId: string | null`
- `analysisById: Record<string, AnalysisResult>`
- Video ingestion + per-image caching already in place
