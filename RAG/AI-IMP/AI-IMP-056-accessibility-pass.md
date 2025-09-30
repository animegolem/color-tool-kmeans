---
node_id: AI-IMP-056
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Accessibility
  - Epic-005
kanban_status: planned
depends_on: [AI-EPIC-005, AI-IMP-052, AI-IMP-053, AI-IMP-054]
confidence_score: 0.83
created_date: 2025-09-29
close_date:
---

# AI-IMP-056-accessibility-pass

## Summary of Issue #1
Ensure key views (Home, Graphs, Exports) are keyboard-accessible with correct roles/labels and visible focus. Address runes‑era a11y warnings and add basic tab order sanity.

### Out of Scope 
- Full screen reader narratives.

### Design/Approach  
- Use semantic roles on dropzone; aria-labels on buttons; visible focus rings per tokens.
- Add minimal axe-style checklist and fix warnings from Svelte plugin.

### Files to Touch
- `tauri-app/src/lib/views/*.svelte`
- `tauri-app/src/lib/styles/*`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Roles/labels on drag/drop and buttons.
- [ ] Keyboard tab order verified; focus visible.
- [ ] No outstanding a11y warnings in dev console for target screens.

### Acceptance Criteria
GIVEN keyboard-only navigation
WHEN interacting with Home/Graphs/Exports
THEN all actionable controls are reachable and clearly identified.

### Issues Encountered 
{LOC|20}

