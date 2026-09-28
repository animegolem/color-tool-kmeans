---
node_id: AI-IMP-177
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: backlog
depends_on:
  - AI-IMP-170
  - AI-IMP-172
  - AI-IMP-173
  - AI-IMP-174
  - AI-IMP-175
  - AI-IMP-176
  - AI-IMP-196
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-177-reflow-motion-settings

## Complete Settings placement and cross-surface reflow acceptance

Finish the real Settings surface and verify all study routes at supported narrow/wide widths. Preserve current settings, persistence and reset behavior while adding the approved layout selector. Basic reflow is not deferred to this final acceptance ticket.

Normative basis: PROJECT-RECORD rev 0.5 §9.6, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No wholesale removal of old preferences without migration, theme platform, folded-paper motion, native behavior or unreviewed defaults.

### Design/Approach

Inventory current SettingsView controls against settings walkthrough Q1–Q3. Preserve compactSidebars compatibility until shell consumers retire via reviewed migration. Move only explicitly approved controls; no additional user preferences for pending, retention or theme. Test interruption-safe transitions and reduced motion, with no page folds.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/views/SettingsView.svelte
- tauri-app/src/App.svelte (settings placement and final compact fixes only)
- tauri-app/src/app.css and per-view style blocks (verified compact fixes)
- tauri-app/src/lib/stores/preferences.ts (reviewed compatibility migration only)
- tauri-app/src/lib/views/__tests__/study-settings-reflow.spec.ts (new)
- RAG/HUMAN-TESTING.md (append evidence requests; owner checks only)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Obtain Settings/reset/legacy-preference ruling and record the exact preserved control inventory.
- [ ] Verify all routes at 360, 736, 1024 and 1440 CSS pixels plus supported desktop minimum.
- [ ] Test resize while computing, focused views, keyboard, long filenames and reduced motion.
- [ ] Reproduce full gates; retain unexecuted Windows/Linux/manual owner acceptance explicitly.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN any supported study route, WHEN resized and navigated by keyboard, THEN all source/control/feedback/export actions remain reachable without clipping or changed analysis state.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
