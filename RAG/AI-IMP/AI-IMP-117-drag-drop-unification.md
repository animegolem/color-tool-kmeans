---
node_id: AI-IMP-117
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - services
kanban_status: backlog
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.85
date_created: 2026-02-25
date_completed:
---

# AI-IMP-117-drag-drop-unification

## Summary
Extract the `tauri://drag-drop` listener setup with path-to-FileSelection mapping from `file-ingestion.svelte.ts` (lines 114-129) and `ValuesView.svelte` (lines 267-278) into a shared `lib/services/drag-drop.ts` module.

Done means: a single shared drag-drop implementation exists, both HomeView and ValuesView consume it, and drag-drop works identically in both views.

### Out of Scope
- Browser (non-Tauri) drag-drop support.
- Window-level drag overlay logic (stays in HomeView).

### Design/Approach
Create `lib/services/drag-drop.ts` exporting `setupTauriDragDrop(onBatch: (selections: FileSelection[]) => void): Promise<(() => void) | null>`. The function registers the `tauri://drag-drop` event listener, maps dropped paths to `FileSelection` objects, and returns an unlisten callback. Replace the inline implementations in both consumers.

### Files to Touch
- `tauri-app/src/lib/services/drag-drop.ts`: new file
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: replace inline drag-drop setup
- `tauri-app/src/lib/views/ValuesView.svelte`: replace inline listener in onMount

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create `lib/services/drag-drop.ts` with `setupTauriDragDrop` function
- [ ] Implement path-to-FileSelection mapping (detect image vs. video by extension)
- [ ] Return unlisten callback for cleanup
- [ ] Replace drag-drop setup in `file-ingestion.svelte.ts` with `setupTauriDragDrop` call
- [ ] Replace inline listener in `ValuesView.svelte` onMount with `setupTauriDragDrop` call
- [ ] Test drag-drop of images in HomeView
- [ ] Test drag-drop of images in ValuesView
- [ ] Test drag-drop of video files in both views
- [ ] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: Drag-drop in HomeView**
**GIVEN** the user is on the HomeView.
**WHEN** the user drags and drops an image file onto the window.
**THEN** the file is ingested and appears in the Media Bucket.

**Scenario: Drag-drop in ValuesView**
**GIVEN** the user is on the ValuesView.
**WHEN** the user drags and drops an image file onto the window.
**THEN** the file is ingested and appears in the Media Bucket.

**Scenario: Single shared implementation**
**GIVEN** the refactor is complete.
**WHEN** the codebase is searched for `tauri://drag-drop` listeners.
**THEN** exactly one registration exists in `lib/services/drag-drop.ts`.

### Issues Encountered
<!-- Post-implementation notes go here -->
