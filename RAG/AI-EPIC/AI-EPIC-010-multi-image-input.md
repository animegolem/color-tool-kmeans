# AI-EPIC
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
kanban-status: planned
AI_IMP_spawned:
---

# AI-EPIC-010-multi-image-input

## Problem Statement/Feature Scope
Users need to load, manage, and compare multiple images (up to 16) without manually juggling tabs or screenshots. Current UI supports single active image despite store architecture already supporting ID-keyed caching.

## Proposed Solution(s)
- Add image tabs/slots UI (horizontal tab bar or thumbnail strip)
- Enable drag-drop of multiple files at once
- Support clipboard paste (Ctrl/Cmd+V)
- Global setting for add vs replace behavior (MKVToolNix-style: add to set, replace current, prompt each time)
- Leverage existing per-image analysis caching in stores

## Path(s) Not Taken
- Infinite image loading (capped at 16 for 4x4 grid export compatibility)
- Modal-based image management (tabs are more immediate)

## Success Metrics
1. User can drag 3+ images and each appears as separate tab
2. Switching tabs preserves analysis state without re-running
3. Clipboard paste loads image into app
4. Add/replace setting honored consistently

## Requirements

### Functional Requirements
- [ ] FR-1: Image tab bar component displaying loaded images (up to 16 slots)
- [ ] FR-2: Multi-file drag-drop handling loads each file as new tab
- [ ] FR-3: Clipboard paste (Ctrl/Cmd+V) loads image from clipboard
- [ ] FR-4: Global setting: add to set / replace current / prompt each time
- [ ] FR-5: Tab switching preserves analysis state (verify existing store)
- [ ] FR-6: Close button on tabs to unload individual images
- [ ] FR-7: Maximum 16 images enforced with user feedback

### Non-Functional Requirements
- [ ] NFR-1: Tab switching should be instant (no re-analysis)
- [ ] NFR-2: Memory usage stays reasonable with 16 loaded images

## Implementation Breakdown

### Planned Tickets
- AI-IMP-080: Image tab bar UI component
- AI-IMP-081: Multi-file drag-drop handling
- AI-IMP-082: Clipboard paste support
- AI-IMP-083: Add/replace behavior setting + UI
- AI-IMP-084: Tab switching state verification

### Completed Tickets

## Notes
Store foundation already exists:
- `images: ImageEntry[]`
- `activeImageId: string | null`
- `analysisById: Record<string, AnalysisResult>`
- Recent commit: "prepare for multiple image inputs"
