---
node_id: AI-IMP-172
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
  - AI-IMP-171
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.65
date_created: 2026-07-09
date_completed:
---

# AI-IMP-172-bucket-page

## Summary of Issue #1

EPIC-027 FR-6 / Code Change Note 4: MediaBucket stops being a persistent right rail — recent strip docks at the bottom of the Colors page (IMP-171 renders it); the full bucket becomes its own page (wireframe 3b, `MEDIA BUCKET · N items`) reached by "view all ↘" / FoldedCorner, and clicking an item loads it and returns to Colors.

**Design lifecycles owned:** L5 — empty bucket, overflow, tile pin flow are PARTIAL/MISSING (P3-8 artifact).

### Out of Scope

- Batch pin semantics changes (pin action preserved as-is).
- Page-turn *animation* (IMP-177; navigation is instant here).

### Design/Approach

New `BucketView` page from BucketTile grid per 3b; route added to tab/nav model as a page you *turn to*, not a tab (FoldedCorner affordance from Colors). MediaBucket.svelte rail retires; its item ops (load/remove/pin, context menu) move to tiles. Return-to-Colors on selection via existing `switchToFile`/video-selection flows (respecting IMP-162/163 fixes — raw video selection goes through the video path).

**Design dependencies:** P3-8 (empty/overflow/pin states) — implementable with placeholder treatments if artifact trails; note deviations.

### Files to Touch

- `lib/views/BucketView.svelte` (new), `lib/components/MediaBucket.svelte` (retire), `App.svelte` nav, `stores/navigation.ts`
- Tests: selection-returns-to-Colors flow, raw-video item routed through video flow (regression vs AUD-006 class)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Bucket page per 3b with tile grid, mono page title with live count.
- [ ] FoldedCorner + "view all ↘" navigation from Colors; selection loads media and returns.
- [ ] Rail removed; all item ops preserved on tiles (incl. video ▶ badge, frame ✕, pin).
- [ ] Raw-video selection routes through video flow (test).
- [ ] Empty/overflow states per artifact or documented placeholder.
- [ ] Full gates + screenshots.

### Acceptance Criteria

**WHEN** 7 items are loaded and the user turns to the bucket page and clicks a clip. **THEN** the clip loads through the video path and the view returns to Colors, matching 3b.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
