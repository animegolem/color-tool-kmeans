---
node_id: AI-IMP-142
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - frontend
  - ux
kanban_status: planned
depends_on:
  - AI-IMP-139
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.80
date_created: 2026-03-19
date_completed:
---

# AI-IMP-142-pin-ux-shift-select

## MediaBucket pin UX — shift-click range select and pushpin icon

Two pin interaction improvements: (1) shift+click to range-pin all items between the last pinned item and the clicked item, and (2) try a pushpin character instead of the star glyph for better visual alignment with the "pin" terminology used in the UI.

### Out of Scope

- Drag-to-select or marquee selection.
- Keyboard-only range selection.
- Pin reordering.

### Design/Approach

**Shift-select:** Track `lastPinnedId` in MediaBucket component state. When shift+click is detected on a pin button, find the index of `lastPinnedId` and the clicked item in `$images`, then call `togglePin()` for each unpinned item in the range. Skip raw videos (`isRawVideo()` check). Only pins — does not unpin already-pinned items in range.

**Pushpin icon:** Replace `★` (U+2605) / `☆` (U+2606) with `📌` (U+1F4CC) for pinned and a neutral state for unpinned. Emoji rendering at small sizes varies — this is a try-and-evaluate change. If rendering is poor at 20px button size, revert to star glyphs.

### Files to Touch

- `src/lib/components/MediaBucket.svelte`: add `lastPinnedId` state, modify `handlePin()` for shift-select logic, swap icon characters

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `let lastPinnedId = $state<string | null>(null)` to MediaBucket
- [ ] Modify `handlePin(event, id)` to detect `event.shiftKey`
- [ ] When shift+click: find index range between `lastPinnedId` and `id` in `$images`
- [ ] Pin all unpinned, non-raw-video items in range via `togglePin()`
- [ ] Update `lastPinnedId` after every pin action
- [ ] Swap pin characters: try `📌` (U+1F4CC) for pinned, neutral indicator for unpinned
- [ ] Evaluate emoji rendering at 20px — revert to stars if poor
- [ ] Validate: `npm run check && npm run lint`

### Acceptance Criteria

**Scenario:** Shift-click range pin
**GIVEN** 6 images in the media bucket, none pinned.
**WHEN** the user clicks pin on image 1, then shift+clicks pin on image 5.
**THEN** images 1 through 5 are all pinned.

**Scenario:** Raw videos skipped in range
**GIVEN** images [A, B, video-C, D] in bucket.
**WHEN** the user pins A, then shift+clicks D.
**THEN** A, B, and D are pinned. Video-C remains unpinned (dimmed pin icon).

**Scenario:** Pushpin icon renders clearly
**GIVEN** images with pins in media bucket.
**THEN** pinned items show a pushpin icon that is legible at thumbnail size.
**AND** unpinned items show a neutral/outline indicator on hover.

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
