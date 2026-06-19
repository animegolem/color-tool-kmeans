---
node_id: AI-IMP-131
tags:
  - IMP-LIST
  - Implementation
  - bugfix
  - post-review
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 1.0
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-131-post-review-bugfixes

## Post-review bug fixes (EPIC-023)

Post-commit review of `caa1101` surfaced three bugs — a hardcoded MIME type that undermines `.mov`/`.webm` support (IMP-128), a timestamp race in the video controller, and a CSS specificity gap in media bucket dimming. All are regressions or incomplete implementations from the current sprint.

### Out of Scope

- New features or UX changes beyond the three identified bugs.
- Unifying the video frame extraction pipeline (IMP-124).

### Design/Approach

Three targeted, independent fixes:

1. **Hardcoded `video/mp4` in library switch path** — Replace with `inferMimeType(entry.name)` from `bridges/fs.ts`, matching the pattern already used elsewhere.
2. **Frame timestamp reads mutable state** — Use the already-captured `requestTime` closure variable instead of the live `videoCurrentTime`.
3. **Active media bucket item dimmed** — Add `item.id !== $activeImageId` guard to the dimmed class condition.

### Files to Touch

- `tauri-app/src/lib/views/HomeView.svelte`: Import `inferMimeType`, replace hardcoded MIME
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: `frameTimestamp: requestTime`
- `tauri-app/src/lib/components/MediaBucket.svelte`: Exclude active item from dimmed class

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Import `inferMimeType` from `bridges/fs` in `HomeView.svelte`
- [x] Replace hardcoded `'video/mp4'` blob type and mimeType with `inferMimeType(entry.name)` (lines 313-314)
- [x] Change `frameTimestamp: videoCurrentTime` to `frameTimestamp: requestTime` in `video-controller.svelte.ts` (line 288)
- [x] Add `item.id !== $activeImageId` guard to dimmed class in `MediaBucket.svelte` (line 39)
- [x] Pass `npm run check && npm run lint`

### Acceptance Criteria

**Scenario:** Re-activating a `.webm` video from the media bucket
**GIVEN** a `.webm` video has been loaded into the library.
**WHEN** the user switches away and clicks the video entry in the media bucket.
**THEN** the `<source type="">` attribute reflects `video/webm`, and the video plays correctly.

**Scenario:** Frame timestamp accuracy during rapid scrubbing
**GIVEN** a video is loaded and the user scrubs rapidly.
**WHEN** frame extraction completes.
**THEN** the `frameTimestamp` on the resulting `ImageEntry` matches the position at which extraction was requested, not the current scrub position.

**Scenario:** Active item opacity in Settings/Exports views
**GIVEN** multiple items exist in the media bucket.
**WHEN** the user is in Settings view or Exports view with video entries.
**THEN** the active item renders at full opacity with accent border; non-active items are dimmed.

### Issues Encountered

No issues encountered. All three fixes were straightforward single-line changes.
