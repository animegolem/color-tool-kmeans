---
node_id: AI-IMP-115
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - utils
kanban_status: backlog
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.95
date_created: 2026-02-25
date_completed:
---

# AI-IMP-115-format-time-dedup

## Summary
Extract the identical `formatTime()` function from `video-controller.svelte.ts` (line 564) and `video-scrubber.svelte.ts` (line 119) into a shared `lib/utils/time.ts` module.

Done means: a single `formatTime` implementation exists in `lib/utils/time.ts`, both consumers import from it, and `npm run check` passes.

### Out of Scope
- Adding additional time formatting functions.
- Changing the formatTime logic itself.

### Design/Approach
Create `lib/utils/time.ts` exporting `formatTime(seconds: number): string`. Remove the duplicate definitions from both consumer files and replace with imports. Verify that VideoPanel and VideoScrubber components still render correctly.

### Files to Touch
- `tauri-app/src/lib/utils/time.ts`: new file
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: remove local formatTime, add import
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`: remove local formatTime, add import

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create `lib/utils/time.ts` with `export function formatTime(seconds: number): string`
- [ ] Remove `formatTime` definition from `video-controller.svelte.ts`, add import from `lib/utils/time`
- [ ] Remove `formatTime` definition from `video-scrubber.svelte.ts`, add import from `lib/utils/time`
- [ ] Verify VideoPanel renders time displays correctly
- [ ] Verify VideoScrubber renders time displays correctly
- [ ] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: Single source of truth**
**GIVEN** the formatTime utility is extracted.
**WHEN** the codebase is searched for `function formatTime`.
**THEN** exactly one definition exists in `lib/utils/time.ts`.
**AND** both consumers import from that module.

**Scenario: Build passes**
**GIVEN** the refactor is complete.
**WHEN** `npm run check` is run.
**THEN** it passes with no type errors.

### Issues Encountered
<!-- Post-implementation notes go here -->
