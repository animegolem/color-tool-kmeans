---
node_id: AI-IMP-195
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

# AI-IMP-195-shared-study-feedback-surfaces

## Shared pending stale empty and error presentation

Add reusable presentation-only feedback surfaces for the already defined import, analysis, collection and export states. The first wave proves their contract in isolation; it does not change real async ownership.

Normative basis: PROJECT-RECORD rev 0.5 §9.2, §4 and §6. Visuals: RAG/design-2026-09/README.md. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No actual job cancellation, runtime view wiring, token/generation changes, caches, files, native bridges, timers or new dependencies.

### Design/Approach

Follow PROJECT-RECORD rev 0.6 §9.7 and Round 01 verdict V4. An exhaustive pure discriminated model renders idle/empty/pending/previous/error/cancelled/saving/saved. Current-request and visible-result provenance are separate caller-supplied source/settings records whenever both appear; pending may include a previous result, while previous alone does not invent a job. Never infer identity/freshness from label strings. Render only caller-supplied copy/action descriptors and invoke one caller callback on explicit activation, never during render. No synthetic Retry/Cancel/Relink/Undo/Open Folder or progress guarantees. Use deliberate busy/status/error announcements and native controls; no stores/runes/jobs/timers/bridges. SSR component testing depends on IMP-169's separately approved compatible harness (UI-T1).

Round 02 update / PROJECT-RECORD rev 0.7: UI-T1 is resolved. Reuse IMP-169's accepted exact-.svelte SSR seam without another configuration edit. SSR proof remains separate from browser action activation/focus/interaction evidence.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/components/study/FeedbackState.svelte (new)
- tauri-app/src/lib/components/study/FeedbackState.spec.ts (new)
- tauri-app/src/lib/components/study/feedback-state.ts and feedback-state.spec.ts (new)
- tauri-app/src/lib/views/DevStudyShowcase.svelte (feedback examples only, sequential after IMP-169)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Define exhaustive visible states and separate requestProvenance/visibleResultProvenance in a pure type; include differing source/settings and invalid/missing-provenance cases.
- [ ] Render state/action examples with accessible busy/status/error announcements and no fake percentages.
- [ ] Show previous-result labeling without implying it belongs to a new source or settings.
- [ ] Test no action callback fires on render and no production view/store/runner is imported or modified.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a previous result plus a pending new request, WHEN the isolated component renders, THEN source and settings provenance are explicit and only supplied recovery actions are available.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
