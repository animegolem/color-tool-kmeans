---
node_id: AI-IMP-174
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
  - AI-IMP-170
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.7
date_created: 2026-07-09
date_completed:
---

# AI-IMP-174-exports-sheet

## Summary of Issue #1

EPIC-027 FR-8: ExportsView per wireframe 5c — single sheet, packing-list checkboxes (PaperCheckbox), format lists in interpunct voice (`png · jpeg · webp`), rubber-stamp composite actions (StampButton).

**Design lifecycles owned:** L8 — saving-pending, saved-confirmation, nothing-loaded are MISSING (P3-7 artifact).

### Out of Scope

- Export runner logic and generated artifact formats (untouched — determinism must hold).

### Design/Approach

Template/style rebuild over intact export runners. Saved/failed feedback per P3-7 artifact when it lands (candidate: stamped receipt line in mono); until then keep current feedback semantics restyled minimally. Nothing-loaded state gets the hatched-placeholder treatment as a default proposal (flag in PR for owner taste).

### Files to Touch

- `lib/views/ExportsView.svelte`
- Export determinism tests must pass unchanged (`exports/__tests__`)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Packing list + stamps per 5c; interpunct format lines.
- [ ] All export paths produce byte-identical artifacts vs pre-ticket (fixture check).
- [ ] Saving/saved/empty states per artifact or documented placeholder.
- [ ] Full gates + screenshots; manual export smoke (PNG/SVG/CSV/ase + composites).

### Acceptance Criteria

**WHEN** the user exports the color study composite. **THEN** the file is identical to pre-redesign output and the UI feedback follows the notebook voice.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
