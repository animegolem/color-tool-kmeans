# AI-EPIC
---
node_id: AI-EPIC-012
tags:
  - EPIC
  - AI
  - ui
  - color-picker
date_created: 2026-01-22
date_completed:
kanban-status: planned
AI_IMP_spawned:
---

# AI-EPIC-012-color-picker

## Problem Statement/Feature Scope
Users want to quickly sample colors from anywhere in the app (source image, clusters, charts) and get color codes for use in illustration programs. Currently no way to extract exact color values on click.

## Proposed Solution(s)
- Floating color picker overlay in lower-right corner (always visible on Home)
- Click anywhere to sample pixel color under cursor
- Show color codes in common formats: HEX, RGB, HSL, OKLCH
- Toast/panel showing recent selected colors for quick reference

## Path(s) Not Taken
- Eyedropper tool requiring mode switch (too many clicks)
- Color picker as separate view (should be always available)

## Success Metrics
1. User can click any visible pixel and see its color values
2. Common formats available for copy/paste into other tools
3. Recent colors accessible without re-sampling

## Requirements

### Functional Requirements
- [ ] FR-1: Floating picker visible on Home view
- [ ] FR-2: Click samples pixel under cursor
- [ ] FR-3: Shows HEX, RGB, HSL, OKLCH values
- [ ] FR-4: Copy button for each format
- [ ] FR-5: Recent colors displayed (last 5-10)
- [ ] FR-6: Clear recent colors option

### Non-Functional Requirements
- [ ] NFR-1: Picker overlay doesn't obstruct critical UI
- [ ] NFR-2: Sampling is instant (no perceptible delay)

## Implementation Breakdown

### Planned Tickets
(TBD)

### Completed Tickets

## Notes
Design consideration: floating overlay vs always-visible panel. User specified "floating layer" in lower right.
