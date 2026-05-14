---
node_id: AI-IMP-155
tags:
  - IMP-LIST
  - Implementation
  - ux
  - media-bucket
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.9
date_created: 2026-03-19
date_completed:
---

# AI-IMP-155-settings-tab-media-fading

## Settings tab media bucket fading

The active media clip in the media bucket sidebar is not visually dimmed when the user navigates to the Settings tab, unlike the behavior on Batch and Exports views where non-active context thumbnails are faded. This inconsistency makes it unclear whether the active image applies to the settings context. The active clip should be dimmed on Settings (and any other non-analysis view). Additionally, consider adding a highlighted ring or accent border to indicate the currently active clip across all views for better visual clarity.

### Out of Scope

- Changing which image is "active" based on the current view.
- Multi-select or bulk operations on media bucket items.
- Redesigning the media bucket layout.

### Design/Approach

Identify the CSS class or conditional that controls thumbnail fading/dimming in the media bucket (likely tied to `currentView`). Add the Settings view to the list of views that trigger the faded state. For the active clip indicator, add a 2px accent-colored border or ring (using the existing brown accent `var(--accent)`) to the active thumbnail across all views. Ensure the ring is visible even when the thumbnail is dimmed.

### Files to Touch

- `src/lib/components/MediaBucket.svelte`: fading logic and active indicator styling

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Identify fading/dimming CSS conditional in MediaBucket
- [ ] Add Settings view to the faded state trigger list
- [ ] Add accent border/ring to active thumbnail across all views
- [ ] Verify ring is visible on both faded and non-faded states
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: switch to Settings → active clip is dimmed with accent ring

### Acceptance Criteria

**Scenario:** Settings tab fading
**GIVEN** the media bucket has images and the user is on the Settings tab.
**THEN** all media bucket thumbnails are visually dimmed/faded.

**Scenario:** Active clip indicator
**GIVEN** the media bucket has multiple images.
**THEN** the currently active image has a visible accent border or ring.
**AND** this indicator is visible on all views (Home, Values, Batch, Settings, Exports).

### Issues Encountered

<!--
This section is filled out post work.
-->
