---
node_id: AI-IMP-147
tags:
  - IMP-LIST
  - Implementation
  - video
  - ux
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.8
date_created: 2026-03-19
date_completed: 2026-04-28
---

# AI-IMP-147-guard-video-frame-click

## Guard video frame click during processing

When a user clicks on a video filmstrip frame, there is a transient state where the new frame has been selected but not yet processed. During this window, clicking the preview image or attempting analysis could serve stale data from the prior frame. The click target should be guarded with a processing state check, and the cursor should change to an hourglass (or equivalent wait indicator) to signal that the frame is not yet ready.

### Out of Scope

- Changing the filmstrip extraction pipeline.
- Adding progress bars or percentage indicators.
- Modifying analysis debounce timing.

### Design/Approach

Add a `frameProcessing` boolean state derived from the video controller's frame decode lifecycle. When true, apply `pointer-events: none` and `cursor: wait` to the video preview container. Clear the guard once the frame decode completes and the preview URL updates. Apply the same guard in ValuesView's video preview area.

### Files to Touch

- `src/lib/views/home/VideoPanel.svelte`: add processing guard and cursor styling
- `src/lib/views/ValuesView.svelte`: add processing guard on video preview

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Identify frame decode lifecycle signals in video-controller.svelte.ts
- [ ] Add `frameProcessing` reactive state derived from decode lifecycle
- [ ] Apply `pointer-events: none` and `cursor: wait` to VideoPanel preview when processing
- [ ] Apply same guard to ValuesView video preview
- [ ] Verify guard clears once frame is decoded and preview URL updates
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: click filmstrip frame → cursor changes → reverts when frame loads

### Acceptance Criteria

**Scenario:** Frame click guarded during processing
**GIVEN** a video is loaded and the user clicks a filmstrip frame.
**WHEN** the new frame is being decoded.
**THEN** the video preview shows a wait cursor and does not respond to clicks.
**AND** once the frame is decoded, the preview becomes interactive again.

### Issues Encountered

<!--
This section is filled out post work.
-->
