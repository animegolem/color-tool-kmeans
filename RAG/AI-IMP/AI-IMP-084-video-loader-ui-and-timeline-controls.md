---
node_id: AI-IMP-084
tags:
  - IMP-LIST
  - Implementation
  - video
  - ui
  - svelte
kanban_status: completed
depends_on: AI-EPIC-016
parent_epic: [[AI-EPIC-016-video-input-and-frame-analysis]]
confidence_score: 0.5
date_created: 2026-01-30
date_completed: 2026-01-30
---

# AI-IMP-084-video-loader-ui-and-timeline-controls

## Add video loader + timeline controls to Home view
Introduce a video input path in the Home view with a scrub timeline and play/pause toggle. Done means: users can load an MP4, see a preview frame area, and interact with a timeline UI without analysis wiring.

### Out of Scope
- Actual frame decoding and analysis updates.
- Export changes for video.
- Keyboard shortcuts for playback.

### Design/Approach
- Reuse existing slider/button components to keep visual consistency.
- Provide a compact timeline under the preview image area (shift layout upward as needed).
- Show current timestamp and duration near the scrub control.
- Keep state in a dedicated store (current time, duration, playing).

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: add video input UI + timeline.
- `tauri-app/src/lib/components/` (as needed): small shared play/pause control.
- `tauri-app/src/lib/stores/`: new video state store.
- `tauri-app/src/lib/styles/`: small layout adjustments for controls.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add a video load action in the Home view (file chooser for MP4).
- [x] Add a scrub timeline using the existing slider style.
- [x] Add play/pause toggle UI (button changes icon/state).
- [x] Display current time and duration near the scrub control.
- [x] Store video UI state locally in the Home view with defaults and resets.

### Acceptance Criteria
- **GIVEN** the user is on Home **WHEN** they select an MP4 **THEN** the UI shows a video preview area and a timeline.
- **GIVEN** the user drags the scrubber **WHEN** they release it **THEN** the displayed time updates.
- **GIVEN** the user toggles play/pause **WHEN** the button is clicked **THEN** the control reflects the new state.

### Issues Encountered
{LOC|20}
