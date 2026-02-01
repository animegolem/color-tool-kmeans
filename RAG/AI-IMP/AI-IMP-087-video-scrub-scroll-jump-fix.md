---
node_id: AI-IMP-087
tags:
  - IMP-LIST
  - Implementation
  - video
  - ui
kanban_status: completed
depends_on: AI-EPIC-017
parent_epic: [[AI-EPIC-017-color-merge-threshold-and-visualization-polish]]
confidence_score: 0.58
date_created: 2026-01-31
date_completed: 2026-01-31
---

# AI-IMP-087-video-scrub-scroll-jump-fix

## Prevent page scroll jump while scrubbing video frames
Video timeline updates currently cause the page to jump to the top during frame refresh. Done when scrub updates no longer alter the scroll position, while initial video load remains allowed to reset layout as needed.

### Out of Scope
- Redesigning video controls or timeline UI.
- Changing analysis debounce behavior.

### Design/Approach
- Capture current scroll position on scrub start and restore it after the frame refresh completes.
- Scope restoration to video-driven updates only (initial load may still reset for layout changes).
- Use requestAnimationFrame + microtask timing to avoid fighting layout.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: capture/restore scroll around video frame updates.
- `tauri-app/src/lib/stores/ui.ts`: optional flag/state if needed to coordinate refresh.
- `tauri-app/src/lib/utils/logging.ts` (if present): add log entries for scroll restore (optional).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Track scrollY during video scrub start.
- [x] Restore scrollY after video frame update completes (debounced path).
- [x] Ensure initial video load does not lock scroll unexpectedly.
- [x] Verify no jump when repeatedly scrubbing with the timeline.

### Acceptance Criteria
**Scenario:** User scrubs a video while scrolled down the Colors tab.
**GIVEN** the user is mid‑page and scrubbing the timeline.
**WHEN** the frame refresh occurs.
**THEN** the scroll position remains unchanged.

### Issues Encountered
- Validated manually after implementation; scroll remains stable during repeated scrubs.
