---
node_id: AI-IMP-173
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-170
  - AI-IMP-195
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-173-values-spread

## Values study surface and shared lifecycle feedback

Refresh Values without changing tonal analysis, notan levels, range-finder behavior or video scrubbing. Use the shared honest pending/previous/error presentation and responsive source-to-tonal comparison.

Normative basis: PROJECT-RECORD rev 0.5 §9.2, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No value-analysis-runner, scrubber lifecycle, caches, artifacts, IPC, or output generator changes; relevant EPIC-029 fixes must precede integration.

### Design/Approach

Restyle existing templates and consume status components. Preserve Values' own parameters and eligible-source behavior. Full compact composition is demonstrated in IMP-177; basic reflow is mandatory here. Do not port unverified old stacked-layout geometry at the cost of source comparison.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/views/ValuesView.svelte
- tauri-app/src/lib/views/values/VideoScrubber.svelte (presentation only)
- tauri-app/src/lib/views/__tests__/study-values.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Maintain source, neutral preview, range finder, histogram and simplified study controls.
- [ ] Identify requested versus shown frame while scrubbing.
- [ ] Apply S1/S3/S4 states only with valid result provenance.
- [ ] Test keyboard and compact comparison without changing factories or saved settings.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a selected image or eligible frame, WHEN Values recomputes or the window narrows, THEN source identity and controls remain intact and previous results are visibly distinguished from pending results.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
