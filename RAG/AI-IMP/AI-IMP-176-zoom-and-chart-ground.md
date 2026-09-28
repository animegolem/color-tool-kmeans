---
node_id: AI-IMP-176
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-171
  - AI-IMP-197
  - AI-IMP-188
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-176-zoom-and-chart-ground

## Focused source and figure inspection with faithful return

Refresh existing image/2D zoom and the third figure's expansion with explicit return, preserving camera, cluster selection and scroll/focus. The old pinned-card/flat-ground mode and forced 70-percent frame prescription are superseded.

Normative basis: PROJECT-RECORD rev 0.5 §9.5, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No chart-ground preference, new zoom physics, geometry/math changes or native live-playback implementation.

### Design/Approach

Keep the existing image/2D zoom gesture behavior, add an explicit compatible focus target for the 3D component, and prevent drag/click/expand ambiguity. Use Expand to enter focus; selecting a mark selects, dragging rotates. No decorative ground preference or page-lift animation.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/components/ZoomOverlay.svelte
- tauri-app/src/lib/utils/zoom.ts
- tauri-app/src/lib/stores/zoom.ts (focus target metadata only)
- tauri-app/src/lib/components/study/ColorVolume.svelte (focus wiring only, after IMP-197)
- tauri-app/src/lib/views/__tests__/study-focus.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Preserve image/2D pan, wheel, fit, keyboard and Escape behavior.
- [ ] Retain 3D camera and selected cluster on expansion/return.
- [ ] Test close during pending work and scroll/focus restoration without queued stale callbacks.
- [ ] Keep focus UI accessible when 3D is unavailable and retain 2D fallback.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a selected cluster and rotated inline 3D view, WHEN expanding and returning, THEN camera, selection and study position remain the same; drag does not activate expansion.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
