---
node_id: AI-IMP-196
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-169
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-09-05
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-196-study-presentation-layout-preference

## Three presentation layouts over one study

Implement Workbench, Image first and Study sheet as arrangements of one study model, selected by three accessible icons/names in Settings. Layout changes must not remount analysis or duplicate state.

Normative basis: PROJECT-RECORD rev 0.5 §9.1, §4 and §6. Visuals: RAG/design-2026-09/README.md. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No Colors/Values composition wiring, shell route changes, analysis settings/default migration, or chart coordinate normalization changes.

### Design/Approach

Add a layout preference and pure responsive slot adapter. Persist through the existing preferences path. Invalid legacy values fall back safely; retain the current default until a lead explicitly picks the new default. Three choices are not three independent workflows or copied view implementations.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/stores/prefs.ts (new presentation preference only)
- tauri-app/src/lib/stores/preferences.ts (hydrate/persist only)
- tauri-app/src/lib/stores/presentation.ts (new)
- tauri-app/src/lib/components/study/StudyLayout.svelte and PresentationPicker.svelte (new)
- tauri-app/src/lib/components/study/presentation.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Define and persist the three named choices with fallback/migration tests.
- [ ] Use shared slots/data rather than cloning view state per layout.
- [ ] Prove switching preserves source, parameters, cluster selection and camera references.
- [ ] Demonstrate reflow with each preference and no forced fixed-width canvas.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN the same active study, WHEN choosing each layout, THEN data references and analysis invocation count do not change, and the next launch restores the chosen presentation.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
