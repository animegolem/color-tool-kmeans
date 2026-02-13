---
node_id: AI-IMP-099
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
kanban_status: planned
depends_on: [AI-EPIC-020, AI-IMP-096]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.66
date_created: 2026-02-03
date_completed:
---

# AI-IMP-099-session-root-folder-tree

## Summary of Issue #1
Provide an optional session-scoped folder tree so users can browse a single root directory per run. The tree should be lazy-loaded, collapsible, and used for quick import into the library.

### Out of Scope
- Persistent roots across sessions.
- Multi-root trees.
- Advanced search or filtering beyond basic type filter.

### Design/Approach
- Add a “Select folder…” action in the drawer that uses a native folder picker.
- Render a collapsible tree for the selected root; lazy-load on expand.
- Allow clicking a file to import it into the Imported list.
- Optional filter toggles (image/video) if both types are present.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: folder picker action and tree container.
- `tauri-app/src/lib/bridges/fs.ts`: folder listing helpers.
- `tauri-app/src/lib/stores/*`: store for root path + tree nodes.
- `tauri-app/src/lib/styles/*`: tree styles, indentation, expand icons.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add “Select folder…” action in the library drawer.
- [ ] Store selected root path for the session (no persistence).
- [ ] Render lazy-loaded tree for the root and allow expand/collapse.
- [ ] Import files from the tree into the Imported list.
- [ ] Add optional filter toggles for image/video display.

### Acceptance Criteria
**Scenario: Select root folder**
**GIVEN** the drawer is open  
**WHEN** the user selects a folder  
**THEN** a tree appears and can be expanded without additional prompts.

### Issues Encountered
{LOC|20}
