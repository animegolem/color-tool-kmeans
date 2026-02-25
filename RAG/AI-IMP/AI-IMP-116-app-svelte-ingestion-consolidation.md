---
node_id: AI-IMP-116
tags:
  - IMP-LIST
  - Implementation
  - refactor
  - svelte
  - ingestion
kanban_status: backlog
depends_on:
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.85
date_created: 2026-02-25
date_completed:
---

# AI-IMP-116-app-svelte-ingestion-consolidation

## Summary
Replace `App.svelte` `globalChooseMedia()` inline entry-creation logic (44 LOC, lines 65-108) with calls to `ingestFileAsEntry()` from `lib/services/media-ingestion.ts`. This is the third copy of ingestion logic that drifted from the other two.

Done means: `globalChooseMedia` uses the shared `ingestFileAsEntry` function, video thumbnails are generated for all non-active videos, and single-file/multi-file upload works from the Exports view.

### Out of Scope
- Changing the routing logic in `handleUpload()` / `handleMediaAdd()` (Home/Values delegate via `requestMediaLoad`, Exports falls back to `globalChooseMedia`).
- Refactoring the media-ingestion service itself.

### Design/Approach
Import `ingestFileAsEntry` from `lib/services/media-ingestion.ts` into `App.svelte`. Replace the inline entry creation loop with calls to the shared function. Preserve first-file activation and `__ACTIVE_IMAGE_PATH__` assignment. Remove `convertFileSrc` and `extractVideoFrame` imports if they are no longer directly used after the replacement.

### Files to Touch
- `tauri-app/src/App.svelte`: replace inline ingestion logic with shared function calls

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Import `ingestFileAsEntry` from `lib/services/media-ingestion.ts` in `App.svelte`
- [ ] Replace inline entry creation loop in `globalChooseMedia()` with shared function calls
- [ ] Keep first-file activation and `__ACTIVE_IMAGE_PATH__` assignment
- [ ] Remove `convertFileSrc` and `extractVideoFrame` imports if no longer directly used
- [ ] Test single-file upload from Exports view
- [ ] Test multi-file upload from Exports view
- [ ] Verify video thumbnails are generated for all non-active videos
- [ ] Run `npm run check && npm run lint`

### Acceptance Criteria

**Scenario: Single-file upload from Exports view**
**GIVEN** the user is on the Exports view with no files loaded.
**WHEN** the user clicks upload and selects one image file.
**THEN** the file is ingested via `ingestFileAsEntry` and appears in the Media Bucket.

**Scenario: Multi-file upload with video**
**GIVEN** the user is on the Exports view.
**WHEN** the user selects multiple files including a video.
**THEN** the first file is activated, all files appear in the Media Bucket.
**AND** video thumbnails are generated for non-active video files.

**Scenario: No inline ingestion logic remains**
**GIVEN** the refactor is complete.
**WHEN** `App.svelte` is reviewed.
**THEN** `globalChooseMedia` delegates to `ingestFileAsEntry` without inline entry creation.

### Issues Encountered
<!-- Post-implementation notes go here -->
