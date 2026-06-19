---
node_id: AI-IMP-110
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Video
  - Epic-020
  - values-view
kanban_status: completed
depends_on:
  - AI-EPIC-020
  - AI-IMP-109
parent_epic:
  - - AI-EPIC-020-multi-image-input
confidence_score: 0.6
date_created: 2026-02-18
date_completed: 2026-02-24
---

# AI-IMP-110-video-controls-values-view

## Summary
When a video is loaded, the Values view currently analyzes whatever frame was extracted in the Colors view. There's no way to scrub or select a different frame from Values. This ticket adds minimal video transport controls (scrubber, current time) to the Values view so users can select which frame to analyze for value/lightness without switching back to Colors.

Done means: the Values view shows a scrubber bar when a video is the active media, allowing frame selection that triggers value re-analysis. Initially defaults to the current extracted frame.

### Out of Scope
- Full video panel duplication (filmstrip, strip generation).
- Values-specific video analysis modes.
- Video playback on Values view — scrubbing only.

### Design/Approach
- Reuse `video-controller.svelte.ts` or expose shared frame-selection controls as a smaller component.
- Add a minimal scrubber + time display to the Values view header or above the analysis section.
- On frame change via scrubber, extract the new frame and trigger value re-analysis.

### Risk Assessment
- Low-to-moderate lift: reuse existing `video-controller.svelte.ts` or expose shared controls.
- Need to trigger value re-analysis on frame change.

### Files to Touch
- `tauri-app/src/lib/views/ValuesView.svelte`: Add scrubber controls when video is active
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: Potentially extract shared scrubber logic
- `tauri-app/src/lib/views/values/value-analysis-runner.svelte.ts`: Wire frame change to re-analysis

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Detect when active media is a video on Values view
- [x] Render minimal scrubber + time display on Values view
- [x] Extract frame on scrub position change
- [x] Trigger value re-analysis with newly extracted frame
- [x] Default to current extracted frame on view switch
- [x] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: Video scrubber on Values view**
**GIVEN** a video is the active media and the user is on the Values view
**WHEN** the user scrubs to a different time position
**THEN** a new frame is extracted and value analysis runs on that frame.

**Scenario: Default frame**
**GIVEN** a video was analyzed on the Colors view at frame t=5s
**WHEN** the user switches to the Values view
**THEN** the scrubber shows t=5s and value analysis uses the same frame.

### Issues Encountered
<!-- Post-implementation notes go here -->
