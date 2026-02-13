---
node_id: AI-IMP-100
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
kanban_status: planned
depends_on: [AI-EPIC-020, AI-IMP-096]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.68
date_created: 2026-02-03
date_completed:
---

# AI-IMP-100-active-item-switching-removal

## Summary of Issue #1
Switching between Imported items should be instant and preserve analysis state. Users should be able to remove items from the library without touching disk.

### Out of Scope
- Persistence across sessions.
- Bulk operations (multi-select remove).

### Design/Approach
- Clicking an item in Imported sets it active.
- Active list shows the currently selected item(s) for quick access.
- Add an “X” action to remove from Imported/Active lists (no disk delete).
- Ensure analysis cache persists per item while in session.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: wiring for active selection and remove controls.
- `tauri-app/src/lib/stores/*`: active item switching logic and removal.
- `tauri-app/src/lib/styles/*`: active/selected states and remove affordances.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Clicking an Imported item sets it active without re-analysis.
- [ ] Active list reflects current item(s) and selection state.
- [ ] Remove (X) deletes item from lists without touching disk.
- [ ] Analysis cache is preserved while items remain in session.

### Acceptance Criteria
**Scenario: Switch active**
**GIVEN** two items in Imported  
**WHEN** the user clicks the second  
**THEN** it becomes active and analysis loads from cache if available.

**Scenario: Remove item**
**GIVEN** an item in Imported  
**WHEN** the user clicks X  
**THEN** it disappears from Imported and Active lists and is not deleted from disk.

### Issues Encountered
{LOC|20}
