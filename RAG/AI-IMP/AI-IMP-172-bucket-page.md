---
node_id: AI-IMP-172
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: backlog
depends_on:
  - AI-IMP-171
  - AI-IMP-188
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-172-bucket-page

## Responsive media strip and full collection browser

Replace the persistent rail with a capacity-aware compact strip and full collection surface, preserving stable order, active-image versus pins separation, media routing and management. UI-D1 return routing is settled by PROJECT-RECORD rev 0.10 §9.3. Removal policy UI-D2 and runtime prerequisites remain holds.

Normative basis: PROJECT-RECORD rev 0.5 §9.3, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No removal/cleanup API redesign, undo system, new search, cross-class eviction, or analysis/video job ownership changes. Requires relevant EPIC-029 corrections before active wiring.

### Design/Approach

Implement C1–C4 with measured slot capacity, honest hidden counts, View all when everything fits, and a visible active item. The collection picks shared app-wide study material; opening a tile changes that selection and returns to the invoking study, preserving controls rather than forcing Colors. Subsequent navigation retains the selected material. Do not create per-view image selections or replace Batch pins. Pin/range-pin/removal do not navigate. Carry file/video selection through existing corrected APIs. Preserve current removal semantics until a separate explicit ruling; no decorative Undo.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/components/MediaBucket.svelte
- tauri-app/src/lib/components/study/CollectionStrip.svelte (new)
- tauri-app/src/lib/views/BucketView.svelte (new)
- tauri-app/src/lib/stores/navigation.ts (return route only)
- tauri-app/src/App.svelte (collection routing only)
- tauri-app/src/lib/utils/collection-window.ts and collection-window.spec.ts (new)
- tauri-app/src/lib/views/__tests__/study-collection.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Record lead rulings for return route/removal before implementation.
- [ ] Test 0, 1, few, 24 and many items, resizing and off-strip selection.
- [ ] Verify pin/Shift-pin/remove controls never activate or close the collection.
- [ ] Test raw clip routing, frame eligibility, cancellation, focus and scroll return against corrected ownership.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN 24 items, WHEN the strip fits eight, THEN it shows 16 more; selecting an off-strip item returns with that item visible without reordering the collection, AND pinning leaves the browser open.

GIVEN Values on image A, WHEN image B is chosen from the collection, THEN the picker closes back to Values on B with controls preserved; navigating to Colors still uses B. Pending or failed analysis must not label A's old output as B. Batch pins and admitted export jobs remain separately owned. This is planned acceptance; no UI implementation tests have run.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
