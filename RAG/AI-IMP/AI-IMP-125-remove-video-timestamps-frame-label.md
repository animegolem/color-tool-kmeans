---
node_id: AI-IMP-125
tags:
  - IMP-LIST
  - Implementation
  - ux
  - video
  - P3
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.85
date_created: 2026-03-13
date_completed:
---

# AI-IMP-125-remove-video-timestamps-frame-label

## Remove Video Timestamps from HomeView + Frame Label Option

Remove `mm:ss / mm:ss` display from `VideoPanel.svelte:65-71` to match ValuesView's minimalist scrubber. Add a setting for labeling video frames: timestamp vs absolute frame number (user-requested).

### Out of Scope

- Changing the scrubber slider behavior
- Video playback controls

### Design/Approach

1. Remove the timestamp text from VideoPanel.
2. Add a `videoFrameLabel` setting to SettingsView with options: "timestamp" | "frame".
3. When frame label is enabled, display the label in the appropriate format on the video panel.

### Files to Touch

- `tauri-app/src/lib/views/home/VideoPanel.svelte`: remove timestamp display
- `tauri-app/src/lib/views/SettingsView.svelte`: add frame label preference

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Remove timestamp display from VideoPanel.svelte
- [ ] Add `videoFrameLabel` setting to store/settings
- [ ] Add frame label toggle to SettingsView
- [ ] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** HomeView video panel no longer shows timestamps.
**GIVEN** a video is loaded in Colors view.
**WHEN** the video panel is displayed.
**THEN** no `mm:ss / mm:ss` timestamp text is visible.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
