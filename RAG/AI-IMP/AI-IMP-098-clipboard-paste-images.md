---
node_id: AI-IMP-098
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-010
kanban_status: planned
depends_on: [AI-EPIC-010, AI-IMP-096]
parent_epic: [[AI-EPIC-010-multi-image-input]]
confidence_score: 0.68
date_created: 2026-02-03
date_completed:
---

# AI-IMP-098-clipboard-paste-images

## Summary of Issue #1
Support pasting images via clipboard (Ctrl/Cmd+V) so users can quickly bring in references without a file picker. Pasted images should be added to the Imported list.

### Out of Scope
- Video paste handling.
- Folder tree browsing (AI-IMP-099).
- Active switching/removal behavior (AI-IMP-100).

### Design/Approach
- Listen for paste events in the main view.
- Extract image blobs from the clipboard and pass through the existing ingestion pipeline.
- Add the pasted entry to the Imported list and set it active only if no active item exists.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: paste event binding.
- `tauri-app/src/lib/views/home/file-ingestion.ts`: handle clipboard image blobs.
- `tauri-app/src/lib/stores/*`: add library entries.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add paste listener in Home view with cleanup on unmount.
- [ ] Parse clipboard images and feed into ingestion.
- [ ] Add pasted images to Imported list.
- [ ] Handle empty/unsupported clipboard contents gracefully.

### Acceptance Criteria
**Scenario: Paste image**
**GIVEN** the app is focused  
**WHEN** the user pastes an image  
**THEN** it appears in the Imported list.

### Issues Encountered
{LOC|20}
