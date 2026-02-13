---
node_id: AI-IMP-103
tags:
  - IMP-LIST
  - Implementation
  - Bugfix
kanban_status: in-progress
depends_on: [AI-IMP-102]
parent_epic:
confidence_score: 0.90
date_created: 2026-02-13
date_completed:
---

# AI-IMP-103: Fix State Regressions in ValuesView and Cross-Tab Flow

Post-IMP-102 regression fix pass targeting 6 issues across the value analysis runner, HomeView analysis runner, video controller, and error handling. Several were latent bugs exposed by the refactor.

## Fixes

### Fix 1: Levels slider does not live-reload "Simplified Tones"
`ValuesView.svelte` effect guard uses `runner.analysis` which falls back to `displayAnalysis` (last success from old key). When levels change, the fallback is still truthy → guard exits early → no new analysis triggered.
**Fix:** Add `hasCurrentAnalysis` derived checking `analysis !== null` (not the fallback). Update effect guard.

### Fix 2: No scroll preservation in Values view + stale-request cancellation
Value runner has no `currentToken`, `captureAnalysisScroll`, `restoreAnalysisScroll`, or `cancelPending` (unlike HomeView's runner). Scroll jumps on re-analysis. In-flight analysis has no cancellation, contributing to Fix 5.
**Fix:** Add full token-based scroll lock targeting `.view-container`. Token check after `await` discards stale results.
**Testing dependency:** Cannot verify scroll until Fix 1 lands (slider doesn't trigger refresh).

### Fix 3: Tab switch causes visual flash
Views use `{#if}` conditional rendering → destroyed on tab switch. Runner creates fresh `$state` with null. Store subscriptions fire after first render → 1-2 frame blank flash.
**Fix:** Eagerly seed all state from store cache using `get()` in `mount()` before subscriptions.

### Fix 4: Undismissable error dialog on Values→Home with video
3-part chain: (1) `restoreVideoSelection()` does not set `__ACTIVE_IMAGE_PATH__` global, (2) analysis fires with empty path → `missing-path` error, (3) retry dedup check blocks actual retry → dialog loops.
**Fix:** Set global in `restoreVideoSelection`, wrap in try-catch, clear `lastRequestKey` before retry in HomeView.

### Fix 5: Blank page after dismissing video from header (Values tab)
`clearFile()` resets all stores while value analysis is in-flight. No token check after `await` → stale results write back → store subscription order leaves template in inconsistent state (intermittent).
**Fix:** Addressed by Fix 2's stale-request cancellation. Also call `cancelPending()` from cleanup.

### Fix 6: HomeView scroll lock regression — targets wrong element
`analysis-runner.svelte.ts` targets `document.scrollingElement` but outer `main` grid has `overflow: hidden`. Actual scroll container is `.view-container`. Capture reads 0, restore writes 0 — effectively a no-op.
**Fix:** Target `.view-container` via querySelector.

## Files to Touch
- `tauri-app/src/lib/views/values/value-analysis-runner.svelte.ts` — Fixes 1, 2, 3, 5
- `tauri-app/src/lib/views/ValuesView.svelte` — Fix 1
- `tauri-app/src/lib/views/home/video-controller.svelte.ts` — Fix 4
- `tauri-app/src/lib/views/HomeView.svelte` — Fix 4
- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` — Fix 6

## Implementation Checklist

- [ ] Add `hasCurrentAnalysis` derived + getter to value runner
- [ ] Update ValuesView effect guard to use `runner.hasCurrentAnalysis`
- [ ] Add `currentToken`, scroll lock, `captureAnalysisScroll`, `restoreAnalysisScroll`, `cancelPending` to value runner
- [ ] Add token tracking + stale-request guard to `ensureAnalysis`
- [ ] Call `captureAnalysisScroll` in `updateLevels`
- [ ] Eagerly seed state from store cache in `mount()`
- [ ] Set `__ACTIVE_IMAGE_PATH__` in `restoreVideoSelection`
- [ ] Wrap `restoreVideoSelection` in try-catch
- [ ] Fix `retryAnalysis` in HomeView to clear `lastRequestKey`
- [ ] Fix `analysis-runner.svelte.ts` scroll functions to target `.view-container`
- [ ] Call `cancelPending()` from runner cleanup
- [ ] `npm run check` passes
- [ ] `npm run build` passes

## Acceptance Criteria

**Scenario:** Levels slider live-reloads
**GIVEN** an image loaded on the Values tab.
**WHEN** the Levels slider is changed from 3→4.
**THEN** "Simplified Tones" re-renders with the new level count.

**Scenario:** Scroll preserved on re-analysis
**GIVEN** the user is scrolled down in a view.
**WHEN** analysis re-triggers (param change or frame selection).
**THEN** scroll position is restored after render.

**Scenario:** Tab switch shows cached results
**GIVEN** a completed analysis on the Values tab.
**WHEN** the user switches to Colors and back to Values.
**THEN** the analysis renders immediately with no flash.

**Scenario:** Video restoration does not trigger error dialog
**GIVEN** a video loaded with a scrubbed frame.
**WHEN** the user switches Values→Home.
**THEN** the video restores and analysis runs without error.

**Scenario:** Clear from header on Values tab
**GIVEN** a video loaded, user is on Values tab.
**WHEN** the user clicks Clear in the header.
**THEN** empty state with Upload button renders cleanly.
