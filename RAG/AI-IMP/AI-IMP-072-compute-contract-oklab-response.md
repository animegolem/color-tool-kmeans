---
node_id: AI-IMP-072
tags:
  - Implementation
  - contract
  - tauri
  - compute
kanban_status: backlog
depends_on:
  - AI-EPIC-008
  - AI-IMP-070
  - AI-IMP-071
confidence_score: 0.6
created_date: 2026-01-19
close_date:
---

# AI-IMP-072-compute-contract-oklab-response

## Summary of Issue #1
We need to update the analyze_image request/response to the OKLab golden path and remove legacy color space toggles. Outcome: updated Tauri command input/output and bridge schemas that carry OKLab/OKLCH + display RGB.

### Out of Scope 
- Graph/exports changes (handled in UI epic).
- Removal of legacy UI components.

### Design/Approach  
- Replace `colorSpace`/`axis` params with `quality` and `ignoreTopN`.
- Emit cluster fields: `oklab`, `oklch`, `rgb`, `count`, `share`, and any ordering metadata needed.
- Update the Zod schema in the compute bridge and TS types in the store.
- Ensure old fields are not required; add a migration path if needed for persisted prefs.

### Files to Touch
- `tauri-app/src-tauri/src/main.rs`
- `tauri-app/src/lib/bridges/compute.ts`
- `tauri-app/src/lib/compute/bridge.ts`
- `tauri-app/src/lib/stores/ui.ts`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Update analyze request shape to accept quality + ignoreTopN.
- [x] Update analyze response shape to include OKLab/OKLCH per cluster.
- [x] Update compute bridge schema validation to the new fields.
- [x] Update TS types and store defaults to remove colorSpace/axis.
- [ ] Add migration for any persisted preferences (if present).

### Acceptance Criteria
**Scenario:** Contract updated
**GIVEN** a valid analyze request
**WHEN** the Tauri command runs
**THEN** the response includes OKLab/OKLCH values and validates in the bridge schema.

**Scenario:** Legacy fields removed
**GIVEN** the new UI defaults
**WHEN** analysis runs
**THEN** no color space or axis params are required.

### Issues Encountered 
None.
