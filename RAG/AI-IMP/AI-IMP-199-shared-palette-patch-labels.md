---
node_id: AI-IMP-199
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-09-05
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-199-shared-palette-patch-labels

## Consistent readable patch labels in app and exports

Unify palette annotation formatting for the app index and visual exports: stable patch identifier, HEX and share as the default, with technical RGB/count/OKLCH fields optional. Existing CSV/ASE/JSON serialization remains unchanged.

Normative basis: PROJECT-RECORD rev 0.5 §9.4, §4 and §6. Visuals: RAG/design-2026-09/README.md. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No invented color names, palette re-clustering, numeric conversions, data export schema, save helpers or global fixture rewrites.

### Design/Approach

Create a pure palette label formatter that does not infer artist color names. Keep stable cluster identity separate from display rank when sorting. Update palette SVG layout to reserve label width/height and remain readable at configured scale. The current strip prints RGB/count/share but omits the computed HEX; fix visual labels deliberately with narrowly reviewed fixtures.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/exports/palette-labels.ts and __tests__/palette-labels.spec.ts (new)
- tauri-app/src/lib/exports/palette.ts (visual SVG labels/layout only; CSV function unchanged)
- tauri-app/src/lib/exports/__tests__/palette.spec.ts
- tauri-app/src/lib/exports/__tests__/color-study-compositor.spec.ts (only explicit visual annotation fixture changes)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Test deterministic rounding, long labels, tiny shares, many clusters and unavailable technical fields.
- [ ] Separate stable cluster ID from rank; sorting must not misidentify a patch.
- [ ] Render HEX/share/identifier without clipping or text laid unreadably over swatches.
- [ ] Prove CSV/ASE/JSON and unrelated 2D export bytes remain unchanged; document changed visual fixtures.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN the same palette in app and export, WHEN sorting or changing optional label fields, THEN patch identity/HEX/share agree and labels remain legible without changing analysis.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
