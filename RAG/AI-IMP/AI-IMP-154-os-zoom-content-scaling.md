---
node_id: AI-IMP-154
tags:
  - IMP-LIST
  - Implementation
  - ux
  - layout
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.5
date_created: 2026-03-19
date_completed:
---

# AI-IMP-154-os-zoom-content-scaling

## OS zoom content-only scaling

OS zoom functions (Cmd+/Cmd- on macOS, Ctrl+/Ctrl- on other platforms) currently scale the entire WebKit viewport, including navigation, sidebars, and chrome elements. This makes the app unusable at high zoom levels as sidebars consume excessive space. Ideally, zoom should affect only the center content area so users can scale analysis output independently of the app shell.

### Out of Scope

- Pinch-to-zoom gesture handling.
- Per-chart zoom controls (already handled by ZoomOverlay).
- Accessibility zoom requirements (OS-level accessibility zoom is unaffected).

### Design/Approach

Evaluate whether intercepting Cmd+/Cmd- keyboard events and applying CSS `transform: scale()` or `zoom` to only the view-container grid cell is feasible without breaking layout or scroll behavior. If implemented, add a "UI Scale" slider or dropdown in SettingsView (e.g., 75%, 100%, 125%, 150%). If the approach proves too brittle (scroll issues, pointer coordinate mismatches), document the limitation and close as won't-fix.

**Feasibility note (2026-06-09 code review):** `App.svelte` already intercepts Cmd+/Cmd-/Cmd+0 (`handleZoomHotkeys`) and applies whole-webview zoom via `getCurrentWebview().setZoom()`. The content-only variant is swapping that call for the CSS `zoom` property on `.view-container` — WebKit supports CSS `zoom` and it participates in layout (unlike `transform: scale`), so scrolling and hit-testing largely work. This is a ~20-line timeboxed experiment, not a rearchitecting. Decision still pending whether to do it at all (nice-to-have; user open to dropping).

### Files to Touch

- `src/App.svelte`: keyboard event interception, layout adjustments
- `src/app.css`: scoped zoom/transform on view-container
- `src/lib/views/SettingsView.svelte`: UI scale setting

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Prototype intercepting Cmd+/Cmd- and applying scale to view-container
- [ ] Verify scroll, pointer events, and layout remain functional at 150% scale
- [ ] If feasible: add UI Scale setting to SettingsView
- [ ] If feasible: persist scale preference
- [ ] If not feasible: document limitation and close ticket
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: zoom in/out → sidebars stay fixed, content scales

### Acceptance Criteria

**Scenario:** Content-only zoom
**GIVEN** the app is open with analysis results displayed.
**WHEN** the user presses Cmd+ to zoom in.
**THEN** only the center content area scales up.
**AND** the left nav and right sidebar remain at their original size.

**Scenario:** UI Scale setting (if implemented)
**GIVEN** the user sets UI Scale to 125% in Settings.
**THEN** the center content area renders at 125% scale.
**AND** navigation and sidebars remain at 100%.

### Issues Encountered

<!--
This section is filled out post work.
-->
