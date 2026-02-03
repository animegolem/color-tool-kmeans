---
node_id: AI-IMP-097
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-010
kanban_status: planned
depends_on: [AI-EPIC-010, AI-IMP-096]
parent_epic: [[AI-EPIC-010-multi-image-input]]
confidence_score: 0.7
date_created: 2026-02-03
date_completed:
---

# AI-IMP-097-library-drag-drop

## Summary of Issue #1
Users should be able to drag and drop multiple files into the app, with each file added to the Imported library list. The current flow only supports single active loading. This ticket adds multi-file drag/drop ingestion and wires it to the library.

### Out of Scope
- Clipboard paste ingestion (AI-IMP-098).
- Folder tree browsing (AI-IMP-099).
- Active switching/removal behavior (AI-IMP-100).

### Design/Approach
- Reuse existing file ingestion utilities for images/videos.
- Allow dropping on the main canvas or the drawer surface.
- Add every valid file to the Imported list; ignore unsupported items with a lightweight toast/log.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: bind drop targets and handlers.
- `tauri-app/src/lib/views/home/file-ingestion.ts`: handle multi-file ingestion and return library entries.
- `tauri-app/src/lib/stores/*`: add or extend library entries store.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Update drag/drop handler to accept multiple files.
- [ ] Ensure each supported file is added to Imported list.
- [ ] Add a user-visible cue for unsupported file types (toast or log).
- [ ] Verify dropping files does not replace current active item unless explicitly chosen later.

### Acceptance Criteria
**Scenario: Multi-file drop**
**GIVEN** the app is open  
**WHEN** the user drops 3 images  
**THEN** all 3 appear in the Imported list.

### Issues Encountered
{LOC|20}
