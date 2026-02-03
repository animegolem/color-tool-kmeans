---
node_id: AI-EPIC-010
tags:
  - EPIC
  - AI
  - ui
  - multi-image
  - input
date_created: 2026-01-22
date_completed:
kanban_status: planned
AI_IMP_spawned:
---
# AI-EPIC-010-multi-image-input

## Problem Statement/Feature Scope
Users need to load, manage, and compare multiple references (images and optionally videos) without juggling external tabs. The current UI only supports a single active image even though store architecture supports ID-keyed caching. We need a lightweight, session-scoped library for quick switching, with an optional single-root folder tree per run.

## Proposed Solution(s)
- Add a right-side drawer (“Library”) that can expand/collapse without disrupting the main layout.
- Provide a session-scoped library list (“Imported”) and a lightweight “Active” list for quick switching.
- Support multi-file drag/drop into the main view or drawer.
- Support clipboard paste for images (Ctrl/Cmd+V) in the main view.
- Optional: allow selecting a single root folder per session (via folder picker) and render a collapsible file tree within that root.
- Keep state ephemeral: no persistence across app restarts (re-pick root each run).
- Leverage existing per-image analysis caching in stores for instant switching.

## Path(s) Not Taken
- Persistent library across sessions (explicitly out of scope).
- Full disk browser / multiple-root tree (avoid extra permission scope complexity).
- Modal-based image management (drawer is more immediate).

## Success Metrics
1. User can drag 3+ images and each appears in the library list.
2. Switching active item preserves analysis state without re-running.
3. Clipboard paste loads an image into the library.
4. User can open a folder (single root) and browse subfolders for import in-session.

## Requirements

### Functional Requirements
- [ ] FR-1: Library drawer with “Imported” list and “Active” list; can expand/collapse.
- [ ] FR-2: Multi-file drag-drop loads each file into Imported list.
- [ ] FR-3: Clipboard paste (Ctrl/Cmd+V) loads image into Imported list.
- [ ] FR-4: Optional single-root folder picker for session-scoped tree browsing.
- [ ] FR-5: Switching active item preserves analysis state (verify existing store).
- [ ] FR-6: Remove (X) action per item to unload from library (no disk delete).
- [ ] FR-7: Optional filter by type (image/video) when both are present.

### Non-Functional Requirements
- [ ] NFR-1: Switching active item should be instant (no re-analysis).
- [ ] NFR-2: Drawer interactions should not cause layout jumps or scroll resets.

## Implementation Breakdown

### Planned Tickets
- AI-IMP-096: Library drawer UI (Imported + Active lists)
- AI-IMP-097: Multi-file drag-drop handling into library
- AI-IMP-098: Clipboard paste support (images)
- AI-IMP-099: Session-scoped root folder tree (single root) + basic filter
- AI-IMP-100: Active item switching state verification + removal behavior

### Completed Tickets

## Notes
Store foundation already exists:
- `images: ImageEntry[]`
- `activeImageId: string | null`
- `analysisById: Record<string, AnalysisResult>`
- Recent commits: video ingestion + per-image caching already in place
