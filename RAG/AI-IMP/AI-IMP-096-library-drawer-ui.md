---
node_id: AI-IMP-096
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-010
kanban_status: planned
depends_on: [AI-EPIC-010]
parent_epic: [[AI-EPIC-010-multi-image-input]]
confidence_score: 0.72
date_created: 2026-02-03
date_completed:
---

# AI-IMP-096-library-drawer-ui

## Summary of Issue #1
We need a right-side library drawer that can expand/collapse without disrupting the main layout. The drawer should include two lists: Imported (session library) and Active (current working set). This ticket defines the shell UI and state hooks, not the ingestion mechanics.

### Out of Scope
- Drag/drop ingestion (AI-IMP-097).
- Clipboard paste ingestion (AI-IMP-098).
- Folder tree browsing (AI-IMP-099).
- Active switching/removal behavior (AI-IMP-100).

### Design/Approach
- Add a right-side drawer that toggles open/closed via a centered button on the right edge.
- Render “Imported” and “Active” sections with placeholder empty-state copy.
- Keep layout stable: drawer expansion should not alter scroll position or cause layout jumps in the main column.
- Wire drawer state into the UI store so other IMPs can attach behavior.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: add drawer container and toggle button.
- `tauri-app/src/lib/stores/ui.ts`: add drawer open/closed state.
- `tauri-app/src/lib/styles/*`: add drawer styles, spacing, and hover states.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add a UI store boolean for library drawer open/closed.
- [ ] Render drawer shell with “Imported” and “Active” sections (empty states allowed).
- [ ] Add right-edge toggle button that opens/closes the drawer.
- [ ] Ensure drawer open/close does not shift main layout or reset scroll.

### Acceptance Criteria
**Scenario: Drawer toggle**
**GIVEN** the Colors view is visible  
**WHEN** the user clicks the drawer toggle  
**THEN** the library drawer opens or closes without shifting the main content.

**Scenario: Drawer sections**
**GIVEN** the drawer is open  
**THEN** “Imported” and “Active” sections are visible with placeholder content.

### Issues Encountered
{LOC|20}
