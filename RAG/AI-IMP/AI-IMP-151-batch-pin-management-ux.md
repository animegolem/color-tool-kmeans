---
node_id: AI-IMP-151
tags:
  - IMP-LIST
  - Implementation
  - batch
  - ux
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.7
date_created: 2026-03-19
date_completed: 2026-04-28
---

# AI-IMP-151-batch-pin-management-ux

## Batch pin management UX

In the batch selection state, users should be able to interact with pin thumbnails more directly. Clicking a pin thumbnail should expand it to a larger view, and users should be able to dismiss (unpin) images directly from the expanded view rather than only from the sidebar. Additionally, the current pin thumbnail scaling may be too large — consider reducing it and preserving aspect ratio to avoid cropped or stretched previews.

### Out of Scope

- Drag-and-drop reordering of pins.
- Adding pin grouping or tagging.
- Modifying the batch analysis grid layout.

### Design/Approach

Add click-to-expand behavior on batch pin thumbnails that opens a larger preview (potentially reusing ZoomOverlay or a lighter popover). Include an unpin/dismiss action in the expanded state. Review the current thumbnail CSS — if thumbnails are forced to a square aspect ratio, switch to `object-fit: contain` or preserve natural aspect ratio within a max bounding box. Reduce thumbnail size if the current scale crowds the pin bar.

### Files to Touch

- `src/lib/views/BatchView.svelte`: pin thumbnail click handler, sizing CSS

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add click-to-expand on batch pin thumbnails
- [ ] Implement expanded view with unpin/dismiss action
- [ ] Review and adjust thumbnail scaling (reduce if too large)
- [ ] Preserve aspect ratio on pin thumbnails (no stretching/cropping)
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: click pin → expands → dismiss from expanded view unpins

### Acceptance Criteria

**Scenario:** Expand pin thumbnail
**GIVEN** the batch view has pinned images.
**WHEN** the user clicks a pin thumbnail.
**THEN** an expanded preview of that image appears.
**AND** the expanded view includes an option to unpin/dismiss the image.

**Scenario:** Pin thumbnails preserve aspect ratio
**GIVEN** images of varying aspect ratios are pinned.
**THEN** all pin thumbnails display without stretching or cropping.

### Issues Encountered

<!--
This section is filled out post work.
-->
