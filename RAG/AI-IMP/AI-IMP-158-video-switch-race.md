---
node_id: AI-IMP-158
tags:
  - IMP-LIST
  - Implementation
  - video
  - bug
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.85
date_created: 2026-06-10
date_completed: 2026-06-10
---

# AI-IMP-158-video-switch-race

## Stale async writes when switching videos mid-load

User-reported (2026-06-10 smoke test): on Home view, clicking video A then video B before A finished loading caused A's filmstrip to be processed and stored against B in the data store. Root cause: two async completion handlers in `video-controller.svelte.ts` write into the controller's *current* state without checking that their request is still the active video. `resetVideoState()` clears state on switch but cannot cancel in-flight ffmpeg promises:

1. **Strip generation** (`scheduleVideoStripGeneration`): the `extractVideoStrip(...).then()` unconditionally sets `videoStripPath`/`videoStripUrl`, calls `pushVideoState()` (now containing B's path with A's strip) and `saveToCache()` — persisting A's strip under B's cache entry, which makes the corruption sticky across reloads. The `.finally` also clears `videoStripPending`, which can clobber B's own in-flight pending flag.
2. **Probe** (`probeVideoDuration`): after `await probeVideo(path)`, writes `videoDuration`/`videoFps`, schedules strip generation and frame decode, and saves to cache — A's late probe can land A's duration/fps on B and schedule strip generation with mismatched parameters.

The frame-decode path already has the correct pattern (`videoDecodeToken` staleness checks); strip and probe never got the equivalent.

### Out of Scope

- Cancelling in-flight ffmpeg processes (guard-and-discard is sufficient).
- ValuesView scrubber (separate factory; extraction is token-guarded there).
- Cache repair for already-corrupted entries — `videoStateCache` is in-memory and session-scoped, so existing corruption clears on app restart (or via the strip-mode regenerate path).

### Design/Approach

Mirror the existing token pattern. Strip generation: capture the request's `stripId` and path; in `.then`, bail if `videoStripId !== stripId` or the selection path changed; in `.finally`, only clear `videoStripPending` if the request is still current (so a stale finally can't clobber a newer run's pending flag). `resetVideoState()` nulling `videoStripId` and `regenerateStrip()` rotating it both invalidate in-flight runs for free. Probe: capture `path` param; after the await, bail before any state writes if `videoSelection?.path !== path`; same conditional in `finally` for `videoProbePending`.

### Files to Touch

- `src/lib/views/home/video-controller.svelte.ts`: staleness guards in strip `.then`/`.finally` and probe post-await/finally

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Guard strip generation `.then` against stale stripId/path
- [x] Guard strip generation `.finally` pending-flag clear
- [x] Guard probe post-await writes against changed selection path
- [x] Guard probe `finally` pending-flag clear
- [x] Log stale skips for diagnosability — `video:strip:stale` / `video:probe:stale` events
- [x] `npm run check && npm run lint && npm run test` — 155 tests pass
- [x] Manual smoke: click video A, immediately click video B → B's state/cache never contains A's strip or duration — user confirmed not reproducible after fix (2026-06-10)

### Acceptance Criteria

**Scenario:** Rapid video switching
**GIVEN** two videos in the media bucket.
**WHEN** the user clicks video A and then video B before A finishes probing/strip generation.
**THEN** B's video state, filmstrip, and cache entry contain only B's data.
**AND** A's late completions are discarded (logged as stale skips).

### Issues Encountered

Confirmed `videoStateCache` is an in-memory session store, so pre-fix corruption is not persisted to disk and clears on restart. Both guards follow the established `videoDecodeToken` pattern; `resetVideoState()` nulling `videoStripId` and `regenerateStrip()` rotating it invalidate in-flight strip runs without any new token plumbing.
