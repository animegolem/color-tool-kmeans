---
node_id: AI-IMP-139
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - view
  - frontend
  - cleanup
kanban_status: completed
depends_on:
  - AI-IMP-136
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.90
date_created: 2026-03-19
date_completed: 2026-03-19
---

# AI-IMP-139-batch-view-cleanup

## BatchView layout restructure, lifecycle fixes, and UI polish

Post-IMP-136 cleanup addressing issues found during user testing of the BatchView. Consolidates layout changes, functional bug fixes, context menu removal, and pin icon readability into a single remedial pass.

### Out of Scope

- Export functionality (IMP-137 scope).
- Right-click context menus on charts/views for "Save as SVG/PNG" (future exports push).
- "Add active frame" button for MediaBucket (design TBD).
- Values analysis for batch composites.

### Design/Approach

**Layout:** Replaced the 3+2 panel grid (composite | polar | palette, histogram | hue-lightness) with a HomeView-style 2-column layout (composite+histogram left, polar+hue-lightness right) using `@container` responsive breakpoint. Removed palette card entirely — it will return with exports wiring.

**Lifecycle:** Fixed spurious state reset on tab switch caused by `prevPinSnapshot` initializing as empty string. Removed stale-state `onMount` recovery (redundant with `onDestroy` cancellation).

**Upload:** Wired `chooseMedia()` to both the empty-state button and `subscribeMediaLoadRequested` for the header Upload button. Uses `openMediaFiles('images')` — images-only since videos are illegal for batch.

**Context menu:** Removed `BucketContextMenu.svelte` entirely. "Save image as..." didn't open the system dialog and "Add frame to media bucket" didn't load frames. The UX direction for right-click exports targets view charts, not bucket items.

**Pin icons:** Changed pinned color from `var(--accent)` (brown, low contrast) to white. Size bump 18→20px, font 11→12px. Added subtle ring shadow for definition against dark images.

### Files to Touch

- `src/lib/views/BatchView.svelte`: layout restructure, lifecycle fixes, upload wiring, button removal
- `src/lib/components/MediaBucket.svelte`: remove context menu, add batch video dimming, pin icon styling
- `src/lib/components/BucketContextMenu.svelte`: delete

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Fix `prevPinSnapshot` initialization: `$state(serializePins(get(pinnedImageIds)))` instead of `$state('')`
- [x] Remove stale-state `onMount` recovery block
- [x] Add `chooseMedia()` function using `getFsBridge().openMediaFiles('images')`
- [x] Wire `subscribeMediaLoadRequested(chooseMedia)` in `onMount`
- [x] Wire empty-state button directly to `chooseMedia`
- [x] Restructure results to 2-column layout with `@container (min-width: 760px)` breakpoint
- [x] Remove palette card (import, derived, markup)
- [x] Remove "Save Composite" button and `handleSaveComposite()` + `saveFromPath` import
- [x] Remove "Re-analyze" button from results header
- [x] Add `$currentView === 'batch'` to MediaBucket video dimming conditions (dimmed + inert)
- [x] Delete `BucketContextMenu.svelte`
- [x] Remove context menu wiring from MediaBucket (import, state, handler, `oncontextmenu`, render block, `videoState` import)
- [x] Update pin icon styles: size 20px, font 12px, pinned color `#fff`, ring shadow
- [x] Validate: `npm run check && npm run lint && npm run test` — 0 errors, 152/152 tests pass
- [x] Validate: BatchView.svelte 522 LOC, MediaBucket.svelte 283 LOC — both under 600

### Acceptance Criteria

**Scenario:** State persists across tab switch
**GIVEN** batch analysis completed with 4 pinned images.
**WHEN** the user switches to Colors tab then back to Batch tab.
**THEN** batch results are still displayed.

**Scenario:** Upload button works in empty state
**GIVEN** fewer than 2 images pinned.
**WHEN** the user clicks "Upload media" in the empty state.
**THEN** a native file dialog opens (images only).
**AND** selected files appear in the media bucket.

**Scenario:** Results show 2-column layout
**GIVEN** batch analysis has completed.
**THEN** results display as: left column (composite + histogram), right column (polar + hue-lightness).
**AND** no palette card, no "Save Composite" button, no "Re-analyze" button.

**Scenario:** Videos dimmed on batch tab
**GIVEN** a raw video entry in the media bucket.
**WHEN** the user is on the Batch tab.
**THEN** the video thumbnail is dimmed and non-interactive.

**Scenario:** Pin icon readability
**GIVEN** images in the media bucket with pins toggled.
**THEN** pinned star is white filled on dark circle, unpinned is white outline on hover.
**AND** icons are legible against both dark and light thumbnails.

**Scenario:** No context menu on bucket items
**GIVEN** items in the media bucket.
**WHEN** the user right-clicks a bucket item.
**THEN** the native browser context menu appears (no custom menu).

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- `$state` rune naming collision: variable named `state` conflicted with Svelte 5's `$state` rune in the original IMP-136 implementation. Renamed to `batchStatus`.
- `prevPinSnapshot` initialization as `''` caused spurious `runner.reset()` on every tab switch back to Batch, destroying cached results. Root cause of user-reported "adding image resets analysis" issue.
- `BucketContextMenu` had two broken features: `saveFromPath` didn't trigger the native dialog in context, and frame extraction silently failed. Removed entirely rather than debugging — UX direction for right-click exports targets view charts per user feedback.
