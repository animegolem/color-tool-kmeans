---
node_id: AI-IMP-054
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Exports
  - Epic-005
kanban_status: planned
depends_on: [AI-EPIC-005, AI-IMP-044, AI-IMP-051]
confidence_score: 0.85
created_date: 2025-09-29
close_date:
---

# AI-IMP-054-exports-integration-and-toasts

## Summary of Issue #1
Wire Exports view buttons to SVG/PNG/CSV helpers through `fsBridge` and provide success/error toasts with simple retry. Done when users can save all three formats in Electron and browser dev.

### Out of Scope 
- Advanced export options (batch presets, PDFs).

### Design/Approach  
- Reuse the new helpers; surface save status; retain last-used export scale in preferences (follow-up ticket may persist it).

### Files to Touch
- `tauri-app/src/lib/views/ExportsView.svelte`
- `tauri-app/src/lib/exports/*`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Call `fsBridge.saveBinaryFile/saveTextFile` and handle browser fallback.
- [ ] Show success/error toast; clear on next action.
- [ ] Manual smoke with bench assets; files open in external viewers.

### Acceptance Criteria
GIVEN analysis results exist
WHEN the user saves PNG/SVG/CSV
THEN files are written successfully (or a clear error toast is shown) in Electron and browser dev.

### Issues Encountered 
{LOC|20}

