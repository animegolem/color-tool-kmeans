---
node_id: AI-IMP-119
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - services
kanban_status: backlog
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.80
date_created: 2026-02-25
date_completed:
---

# AI-IMP-119-store-channel-handlers

## Summary
Extract `pendingVideoSwitch` and `mediaLoadRequested` subscription handlers from HomeView.svelte (lines 282-310) and ValuesView.svelte (lines 287-302) into shared factory functions in `lib/services/view-subscriptions.ts`. Note: HomeView's `pendingVideoSwitch` handler is more complex (includes devlog tracing, dedup check, state clearing) — the factory should accept callbacks for view-specific behavior.

Done means: both views use shared factory functions for these subscriptions, video switching works from the library rail in both views, and the upload button triggers the correct view's dialog.

### Out of Scope
- Changing the `pendingVideoSwitch` debounce mechanism in `ui.ts`.
- Modifying the store channel API itself.

### Design/Approach
Create `lib/services/view-subscriptions.ts` exporting two factory functions:
1. `subscribePendingVideoSwitch(onVideoLoad: (path: string) => void): () => void` -- subscribes to the pendingVideoSwitch store and calls the provided callback.
2. `subscribeMediaLoadRequested(onUpload: () => void): () => void` -- subscribes to the mediaLoadRequested store and calls the provided callback.

Both return unsubscribe functions for cleanup in `onDestroy`. Replace the inline subscription logic in both views.

### Files to Touch
- `tauri-app/src/lib/services/view-subscriptions.ts`: new file
- `tauri-app/src/lib/views/HomeView.svelte`: replace inline subscribers with factory calls
- `tauri-app/src/lib/views/ValuesView.svelte`: replace inline subscribers with factory calls

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create `lib/services/view-subscriptions.ts` with `subscribePendingVideoSwitch` factory
- [ ] Add `subscribeMediaLoadRequested` factory to the same module
- [ ] Replace HomeView inline pendingVideoSwitch subscriber with factory call
- [ ] Replace HomeView inline mediaLoadRequested subscriber with factory call
- [ ] Replace ValuesView inline pendingVideoSwitch subscriber with factory call
- [ ] Replace ValuesView inline mediaLoadRequested subscriber with factory call
- [ ] Test video switching from library rail in HomeView
- [ ] Test video switching from library rail in ValuesView
- [ ] Test upload button triggers correct dialog in both views
- [ ] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: Video switching in HomeView**
**GIVEN** the user is on HomeView with multiple videos in the Media Bucket.
**WHEN** the user clicks a different video in the library rail.
**THEN** the video switches correctly via the shared subscription handler.

**Scenario: Video switching in ValuesView**
**GIVEN** the user is on ValuesView with multiple videos in the Media Bucket.
**WHEN** the user clicks a different video in the library rail.
**THEN** the video switches correctly via the shared subscription handler.

**Scenario: Upload button routing**
**GIVEN** the user is on either view.
**WHEN** the user clicks the upload button in the header.
**THEN** the correct view's file dialog is triggered via `subscribeMediaLoadRequested`.

### Issues Encountered
<!-- Post-implementation notes go here -->
