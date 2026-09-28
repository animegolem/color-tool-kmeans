---
node_id: AI-IMP-175
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: backlog
depends_on:
  - AI-IMP-170
  - AI-IMP-195
  - AI-IMP-186
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-175-batch-spread

## Batch contact sheet and focused pin detail

Refresh Batch's selection, less-than-two-pins, aggregate pending/ready/error and focused pin states without conflating active media with pinned inputs. Keep the old approximate wireframe non-normative until the new surface receives a ruling.

Normative basis: PROJECT-RECORD rev 0.5 §9.2, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No pin-store semantics, multi-analysis ownership, batch runner, artifact lifetime, or export renderer changes.

### Design/Approach

Use the walkthrough's batch/detail state as a review candidate, not permission to alter batch defaults. Preserve all existing exclusions and limits. The focused pin overlay returns to the same aggregate and parameter set. Artifact/aggregate ownership remains EPIC-029's concern.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/views/BatchView.svelte
- tauri-app/src/lib/views/batch/PinExpandOverlay.svelte
- tauri-app/src/lib/views/__tests__/study-batch.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Obtain a lead verdict for contact-sheet and focused-pin geometry.
- [ ] Preserve zero/one-pin guidance, exact limits and raw-video exclusion.
- [ ] Display batch parameters separately from Colors and retain the set on overlay close.
- [ ] Exercise pending/error/invalidated aggregate and per-source failure states with correct source labels.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a completed aggregate, WHEN inspecting one pin and returning, THEN the pin set, source order and batch parameters are unchanged and no stale aggregate is relabeled.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
