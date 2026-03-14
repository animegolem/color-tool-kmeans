---
node_id: AI-IMP-124
tags:
  - IMP-LIST
  - Implementation
  - video
  - architecture
  - P2
kanban_status: deferred
depends_on:
  - AI-IMP-121
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.7
date_created: 2026-03-13
date_completed:
---

# AI-IMP-124-unify-video-frame-extraction

## Unify Video Frame Extraction Pipeline

HomeView (`video-controller.svelte.ts:231-314`) and ValuesView (`video-scrubber.svelte.ts:57+`) independently call `extractVideoFrame()`. The same scrub position can produce different frames due to floating-point timestamp divergence and ffmpeg keyframe seeking.

**Prerequisite**: Manual test using IMP-121 diagnostic logging — scrub video in both views, compare `t_req`/`t_ffmpeg` logs to confirm divergence pattern before choosing fix strategy.

**Fix direction**: Store extracted frame path + timestamp in `videoState` store. Second view reads cached result instead of re-extracting.

### Out of Scope

- Changing ffmpeg seeking strategy (`-ss` placement)
- Merging the color and value analysis runners
- Video decode/playback changes

### Design/Approach

1. Add `lastFrame: { path: string; timestamp: number } | null` to `videoState` store.
2. After frame extraction in either view, write to `videoState.lastFrame`.
3. Before extracting, check if `videoState.lastFrame.timestamp` matches requested timestamp (within tolerance). If so, reuse cached path.
4. Strategy depends on IMP-121 diagnostic results — if divergence is <1ms, a simple tolerance check suffices; if larger, may need to normalize timestamps before extraction.

### Files to Touch

- `tauri-app/src/lib/stores/video.ts`: add `lastFrame` to video state
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: check/write frame cache
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`: check/write frame cache

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Run manual diagnostic test per IMP-121: load video, scrub in both views, compare t_req/t_ffmpeg
- [ ] Document divergence pattern and choose tolerance strategy
- [ ] Add `lastFrame` field to `videoState` store type
- [ ] Implement frame cache check before extraction in video-controller
- [ ] Implement frame cache check before extraction in video-scrubber
- [ ] Write extracted frame to `videoState.lastFrame` after successful extraction
- [ ] Verify both views show identical frames for same scrub position
- [ ] Verify `npm run check && npm run lint` passes
- [ ] Verify `cargo clippy --workspace -- -D warnings` passes

### Acceptance Criteria

**Scenario:** User scrubs video and switches between Colors and Values views.
**GIVEN** a video is loaded in both views.
**WHEN** the user scrubs to position 5.0s in Colors view, then switches to Values view.
**THEN** Values view displays the same frame without re-extracting.
**AND** only one `extractVideoFrame` call is made for that timestamp.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
