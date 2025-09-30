---
node_id: AI-IMP-055
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Preferences
  - Epic-005
kanban_status: planned
depends_on: [AI-EPIC-005]
confidence_score: 0.84
created_date: 2025-09-29
close_date:
---

# AI-IMP-055-preferences-store-and-theme

## Summary of Issue #1
Add a local preferences store for theme (light/dark/system) and default analysis params (K, stride, minLum, space, export scale). Apply on boot and expose a minimal preferences panel.

### Out of Scope 
- Cross-device sync.

### Design/Approach  
- Store JSON in `localStorage`; guard against schema changes with a versioned key; provide defaults.
- Expose a small preferences popover/modal.

### Files to Touch
- `tauri-app/src/lib/stores/prefs.ts` (new)
- `tauri-app/src/lib/views/*` minimal UI hook

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Implement load/save with schema version.
- [ ] Apply theme and defaults on boot.
- [ ] Minimal UI to change + persist values.

### Acceptance Criteria
GIVEN a user changes theme or defaults
WHEN the app restarts
THEN the preferences are applied without errors.

### Issues Encountered 
{LOC|20}

