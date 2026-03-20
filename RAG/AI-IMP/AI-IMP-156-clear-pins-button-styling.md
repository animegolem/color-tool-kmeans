---
node_id: AI-IMP-156
tags:
  - IMP-LIST
  - Implementation
  - ux
  - batch
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.9
date_created: 2026-03-19
date_completed:
---

# AI-IMP-156-clear-pins-button-styling

## Clear pins button styling alignment

The "Clear pins" button in batch view uses a transparent background with a gray border, diverging from the standard brown accent button style (`var(--accent)` background, white text) used throughout the rest of the application. This visual inconsistency makes the button look out of place and potentially less discoverable. The button should be restyled to match the app's design language.

### Out of Scope

- Changing the button's position or label text.
- Adding confirmation dialogs before clearing.
- Modifying other batch view buttons.

### Design/Approach

Update the `.clear-btn` CSS in BatchView.svelte to use the standard accent button style: `background: var(--accent)`, `color: white`, appropriate padding, and hover/active states consistent with other buttons in the app. Review other buttons in the app for the canonical style and replicate it exactly. Consider whether the button should use a destructive/warning variant (red) given it clears all pins, or keep the standard accent color for consistency.

### Files to Touch

- `src/lib/views/BatchView.svelte`: CSS for `.clear-btn`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Identify canonical button style used across the app
- [ ] Update `.clear-btn` to match standard accent button styling
- [ ] Verify hover and active states are consistent
- [ ] Check contrast ratio for accessibility (white text on accent background)
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: "Clear pins" button visually matches other app buttons

### Acceptance Criteria

**Scenario:** Consistent button styling
**GIVEN** the batch view has pinned images.
**THEN** the "Clear pins" button uses the same accent background, text color, and hover states as other primary buttons in the app.
**AND** the button is visually consistent with the app's design language.

### Issues Encountered

<!--
This section is filled out post work.
-->
