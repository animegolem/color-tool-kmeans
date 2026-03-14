---
node_id: AI-IMP-129
tags:
  - IMP-LIST
  - Implementation
  - ux
  - P3
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.9
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-129-fade-selection-media-bucket

## Fade Selection for Media Bucket Items

Lower opacity of clips/images in the media bucket to indicate deselected state. Similar visual to how the media bucket currently dims video clips, but extended to images. Neither deselected type has actionable controls from that tab.

### Out of Scope

- Multi-select behavior
- Drag reordering of media bucket items

### Design/Approach

Apply `opacity: 0.5` (or similar) to media bucket items that are not the currently active/selected entry. Use the `activeImageId` store to determine selection state.

### Files to Touch

- `tauri-app/src/lib/components/MediaBucket.svelte`: add opacity styling based on active selection

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add conditional opacity class to media bucket items based on active selection
- [x] Reworked to view-aware dimming: Home/Values=none, Exports=videos only, Settings=all
- [x] Verify active item remains full opacity
- [x] Verify deselected items are visually dimmed per view rules
- [x] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** User has multiple images in the media bucket.
**GIVEN** the media bucket contains 3 images.
**WHEN** one image is selected as active.
**THEN** the active image is displayed at full opacity.
**AND** the other 2 images are displayed at reduced opacity.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
