---
node_id: AI-IMP-126
tags:
  - IMP-LIST
  - Implementation
  - ux
  - accessibility
  - P3
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.9
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-126-explanatory-tooltips-for-controls

## Explanatory Tooltips for Controls

Add `title=""` attributes to `ParameterControls.svelte` (7 parameter controls, currently unlabeled), `VideoPanel.svelte`, and `VideoScrubber.svelte` video step buttons. Native `title` attrs only, 1-2 sentences max. Shared controls get matching tooltips across views.

### Out of Scope

- Custom tooltip components or styling
- Tooltip library integration
- Tooltips for non-parameter UI elements

### Design/Approach

Add native HTML `title` attributes to all interactive controls that lack descriptive labels. Use concise 1-2 sentence descriptions explaining what each control does.

### Files to Touch

- `tauri-app/src/lib/views/home/ParameterControls.svelte`: add `title` to 7 parameter controls
- `tauri-app/src/lib/views/home/VideoPanel.svelte`: add `title` to video transport buttons
- `tauri-app/src/lib/views/values/VideoScrubber.svelte`: add matching `title` to shared controls

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `title` to all parameter controls in ParameterControls.svelte
- [x] Add `title` to video step/transport buttons in VideoPanel.svelte
- [x] Add matching `title` to VideoScrubber.svelte controls
- [x] Verify tooltips appear on hover
- [x] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** User hovers over a parameter control.
**GIVEN** the Colors view is active with analysis parameters visible.
**WHEN** the user hovers over any parameter slider or checkbox.
**THEN** a native tooltip appears explaining the control's purpose.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
