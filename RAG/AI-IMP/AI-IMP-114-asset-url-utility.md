---
node_id: AI-IMP-114
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - utils
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.90
date_created: 2026-02-25
date_completed: 2026-02-25
---

# AI-IMP-114-asset-url-utility

## Summary
Extract an `assetUrl(path)` utility wrapping `convertFileSrc(path)` with `?t=${Date.now()}` cache-busting. Replace 9 inline instances across ValuesView (3), video-controller (4), ExportsView (1), and video-scrubber (1).

Done means: all artifact preview URLs use `assetUrl()`, zero inline `convertFileSrc` + `Date.now()` patterns remain, and `npm run check` passes.

### Out of Scope
- Changing the cache-busting strategy (e.g., content hashing).
- Modifying convertFileSrc itself.

### Design/Approach
Create a small utility module `lib/utils/asset-url.ts` exporting a single function. The function calls `convertFileSrc` from `@tauri-apps/api/core` and appends a timestamp query parameter. Find-and-replace all 9 inline occurrences with the new import.

### Files to Touch
- `tauri-app/src/lib/utils/asset-url.ts`: new file
- `tauri-app/src/lib/views/ValuesView.svelte`: replace 3 inline patterns
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: replace 4 inline patterns
- `tauri-app/src/lib/views/ExportsView.svelte`: replace 1 inline pattern
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`: replace 1 inline pattern

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Create `lib/utils/asset-url.ts` with `export function assetUrl(path: string): string`
- [x] Replace 3 inline patterns in `ValuesView.svelte`
- [x] Replace 6 inline patterns in `video-controller.svelte.ts`
- [x] Remove unused `convertFileSrc` imports where `assetUrl` fully replaces them
- [x] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: All preview URLs use assetUrl**
**GIVEN** the assetUrl utility is created.
**WHEN** the codebase is searched for inline `convertFileSrc` combined with `Date.now()`.
**THEN** zero inline patterns remain.
**AND** all 9 former call sites import and use `assetUrl`.

**Scenario: Build passes**
**GIVEN** the replacements are complete.
**WHEN** `npm run check` is run.
**THEN** it passes with no type errors.

### Issues Encountered
- IMP originally listed 9 instances as ValuesView (3), video-controller (4), ExportsView (1), video-scrubber (1). Actual distribution: ValuesView (3) + video-controller (6) = 9. ExportsView and video-scrubber use `convertFileSrc` without cache-busting (no `Date.now()`), which is correct for their use cases (stable strip paths, video source URLs).
