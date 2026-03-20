---
node_id: AI-IMP-149
tags:
  - IMP-LIST
  - Implementation
  - batch
  - drag-drop
kanban_status: planned
depends_on:
  - AI-IMP-148
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.7
date_created: 2026-03-19
date_completed:
---

# AI-IMP-149-batch-drag-drop

## Drag-and-drop on batch view (load + pin)

The batch view currently requires users to add images via the media bucket sidebar before pinning them for comparison. Dragging files directly onto the batch view should streamline this workflow: dropped files are validated, loaded into the media bucket if not already present, and automatically pinned for batch analysis.

### Out of Scope

- Drag-and-drop reordering of existing pins.
- Drag from media bucket sidebar to batch (internal drag).
- Supporting directory drops (only individual files).

### Design/Approach

Add `ondragover` and `ondrop` handlers to BatchView's main content area. On drop, iterate the file list: for each file, check if it already exists in the media bucket by path; if not, call the ingestion pipeline to add it. Then pin each file's image ID. Use the shared drop handler from IMP-148 if available, otherwise implement inline. Show a visual drop zone indicator (dashed border highlight) during drag-over.

### Files to Touch

- `src/lib/views/BatchView.svelte`: add drop zone and handlers
- Media ingestion services (file-ingestion.ts or equivalent): validate + load files

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add ondragover/ondrop handlers to BatchView content area
- [ ] Implement drop zone visual indicator (dashed border on drag-over)
- [ ] Validate dropped files against accepted formats
- [ ] Load new files into media bucket via ingestion pipeline
- [ ] Auto-pin all dropped files (new and existing)
- [ ] `npm run check && npm run lint`
- [ ] Manual smoke: drop 3 images on batch → all appear in sidebar and as pins

### Acceptance Criteria

**Scenario:** Drop files onto batch view
**GIVEN** the batch view is active.
**WHEN** the user drags image files onto the batch content area.
**THEN** the files are added to the media bucket (if not already present).
**AND** all dropped files are pinned for batch analysis.

**Scenario:** Drop zone visual feedback
**GIVEN** the user is dragging files over the batch view.
**THEN** a visual indicator (e.g., dashed border) shows the drop target.

### Issues Encountered

<!--
This section is filled out post work.
-->
