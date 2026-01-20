---
node_id: AI-IMP-077
tags:
  - Implementation
  - cleanup
  - ui
  - bridges
kanban_status: backlog
depends_on:
  - AI-EPIC-009
  - AI-IMP-074
  - AI-IMP-075
  - AI-IMP-076
confidence_score: 0.5
created_date: 2026-01-19
close_date:
---

# AI-IMP-077-remove-legacy-ui-bridge-artifacts

## Summary of Issue #1
After migration, legacy UI/bridge code paths should be removed to reduce confusion. Outcome: remove unused color-space toggles, axis options, and dead bridge branches.

### Out of Scope 
- Core compute pipeline updates.
- Figma asset refresh.

### Design/Approach  
- Remove unused params from stores, bridges, and component props.
- Delete dead branches for legacy compute paths if no longer referenced.
- Update any residual copy or labels referencing HSL/HSV/axis modes.
- Verify build passes and no unused exports remain.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`
- `tauri-app/src/lib/bridges/compute.ts`
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/GraphsView.svelte`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [ ] Remove legacy params and axis toggles from stores and UI.
- [ ] Remove unused bridge logic and schema branches.
- [ ] Update copy/labels to match OKLCH terminology only.
- [ ] Run lint/build checks to confirm no unused exports.

### Acceptance Criteria
**Scenario:** Legacy controls removed
**GIVEN** the Home and Graphs views
**WHEN** parameters are displayed
**THEN** no color-space or axis toggles remain.

### Issues Encountered 
{LOC|20}
