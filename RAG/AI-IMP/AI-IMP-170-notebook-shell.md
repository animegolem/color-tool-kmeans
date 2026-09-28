---
node_id: AI-IMP-170
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-169
  - AI-IMP-195
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-170-notebook-shell

## Flat study shell with preserved navigation

Replace the old sidebar-heavy shell with restrained Colors/Values/Batch/Exports navigation and a reachable Settings affordance, preserving every existing command and route. The old desk/spine/edge-tab implementation prescription is superseded.

Normative basis: PROJECT-RECORD rev 0.5 §9.1, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No feature-view rebuilds, analysis default changes, video controller/IPC changes, export generation or unreviewed removal of navigation state.

### Design/Approach

Keep existing views functional during transition. Responsive stacking is required from the first shell commit; do not defer basic reflow to IMP-177. Keep the library reachable until IMP-172 replaces it. Wire no lifecycle or ownership rewrites under cover of styling.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/App.svelte
- tauri-app/src/app.css
- tauri-app/src/lib/styles/study-shell.css (new)
- tauri-app/src/lib/stores/navigation.ts (shell route state only)
- tauri-app/src/lib/views/__tests__/study-shell.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Preserve Colors, Values, Batch, Exports and Settings reachability and current file actions.
- [ ] Keep media access available during the transitional shell.
- [ ] Pass live resize and keyboard navigation checks without remounting active analysis.
- [ ] Inventory command parity against the pre-change shell; do not remove legacy state until consumers are reconciled.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN an active image, WHEN switching routes or resizing through the compact breakpoint, THEN the correct media/results remain active and all existing workflows remain reachable.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
