---
node_id: AI-IMP-118
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - services
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.80
date_created: 2026-02-25
date_completed: 2026-03-10
---

# AI-IMP-118-active-image-path-abstraction

## Summary
Centralize `__ACTIVE_IMAGE_PATH__` global management (13 direct mutations across 6 files, plus 2 reads) into `lib/services/active-image.ts` with `setActivePath()`, `getActivePath()`, and `clearActivePath()` functions.

Done means: no direct `__ACTIVE_IMAGE_PATH__` `globalThis` access remains in the codebase, all analysis paths still work, and `npm run check` passes.

### Out of Scope
- Replacing the global with a Svelte store (would require compute bridge changes).
- Changing the compute bridge's path resolution logic.

### Design/Approach
Create `lib/services/active-image.ts` exporting three functions that encapsulate the `globalThis.__ACTIVE_IMAGE_PATH__` read/write/delete pattern. Replace all 13 direct mutations (9 writes + 4 deletes) and 2 reads across the 6 consumer files. The `clearActivePath()` function replaces the existing try-catch delete patterns.

### Files to Touch
- `tauri-app/src/lib/services/active-image.ts`: new file
- `tauri-app/src/App.svelte`: replace globalThis mutations
- `tauri-app/src/lib/views/ValuesView.svelte`: replace globalThis mutations
- `tauri-app/src/lib/views/HomeView.svelte`: replace globalThis mutations
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: replace globalThis mutations
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: replace globalThis mutations
- `tauri-app/src/lib/stores/ui.ts`: replace globalThis mutations if present
- `tauri-app/src/lib/compute/bridge.ts`: replace globalThis read with `getActivePath()`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Create `lib/services/active-image.ts` with `setActivePath`, `getActivePath`, `clearActivePath`
- [x] Replace all `globalThis.__ACTIVE_IMAGE_PATH__` writes with `setActivePath()` in App.svelte
- [x] Replace all `globalThis.__ACTIVE_IMAGE_PATH__` writes with `setActivePath()` in ValuesView.svelte
- [x] Replace 2 delete patterns in HomeView.svelte with `clearActivePath()`
- [x] Replace 1 write in file-ingestion.svelte.ts with `setActivePath()`
- [x] Replace 3 writes in video-controller.svelte.ts with `setActivePath()`
- [x] Replace 2 deletes + 1 read + 1 write in ui.ts with service functions
- [x] Replace 1 read in compute/bridge.ts with `getActivePath()`
- [x] Verify color analysis works after switching active images
- [x] Verify value analysis works after switching active images
- [x] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: No direct globalThis access**
**GIVEN** the abstraction is complete.
**WHEN** the codebase is searched for `__ACTIVE_IMAGE_PATH__`.
**THEN** the only file containing the literal string is `lib/services/active-image.ts`.

**Scenario: Analysis still works**
**GIVEN** the refactor is complete.
**WHEN** the user loads an image and triggers color analysis.
**THEN** the analysis completes successfully using the path from `getActivePath()`.

**Scenario: Image switching works**
**GIVEN** multiple images are loaded.
**WHEN** the user switches between active images.
**THEN** `setActivePath()` is called and subsequent analysis uses the correct path.

### Issues Encountered
<!-- Post-implementation notes go here -->
