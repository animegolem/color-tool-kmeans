---
node_id: AI-IMP-198
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-197
  - AI-IMP-200
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-09-05
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-198-color-volume-export-capture

## Camera-bound 3D raster export tile

Make the 3D view exportable as a raster tile captured from a specified camera and captured study descriptor. A static export is the selected view of the volume, not an interactive or falsely vectorized 3D deliverable.

Normative basis: PROJECT-RECORD rev 0.5 §9.4, §4 and §6. Visuals: RAG/design-2026-09/README.md. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No interactive HTML/GLB/PDF/3D-SVG output, backend math, new save pipeline, CSV/ASE/JSON changes or repeated live animation capture.

### Design/Approach

Capture only after the requested render completes; bind camera/projection, labels, source descriptor and target dimensions to the export document. Individual 3D output is PNG and inclusion in composites stays raster. Existing SVG graph exports remain vector for the existing supported 2D figures. Fail clearly on context loss.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/exports/color-volume-capture.ts and __tests__/color-volume-capture.spec.ts (new)
- tauri-app/src/lib/visualization/oklab-volume.ts (capture API only)
- tauri-app/src/lib/exports/export-document.ts (3D tile extension, after IMP-200)
- tauri-app/src/lib/exports/color-study-compositor.ts (new optional raster tile only)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Bind camera and target pixel dimensions to the captured immutable document descriptor.
- [ ] Wait for render readiness and reject stale/context-lost captures without emitting a blank success.
- [ ] Preserve existing non-3D output paths and metadata; state mixed raster/vector capability honestly.
- [ ] Test structural determinism and fixed-environment pixel tolerances; do not claim cross-GPU bit equality.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a selected camera and source descriptor, WHEN exporting 3D, THEN the PNG/composite shows that camera and source at the requested resolution or reports an explicit failure.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
