---
node_id: AI-IMP-200
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: backlog
depends_on:
  - AI-IMP-184
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.6
date_created: 2026-09-05
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-200-export-document-preview-contract

## One captured export document for preview and save

Unify preview and saved-composition generation around a captured export document with source/result/configuration provenance. This depends on the accepted EPIC-029 export-job ownership work rather than replacing it with a renderer-only snapshot.

Normative basis: PROJECT-RECORD rev 0.5 §9.4, §4 and §6. Visuals: RAG/design-2026-09/README.md. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No duplicate native lease registry, new quota policy, generic export refactors IMP-189/190, freeform canvas, extra formats or hidden auto-retry.

### Design/Approach

Extract existing Colors/Values/Batch tile assembly into shared document builders accepting immutable retained inputs and export-only choices. Latest preview generation wins; dispose superseded resources. Saving captures exactly the displayed valid document/configuration and retains required inputs across dialogs. A changed active study invalidates or explicitly updates preview; do not silently save old results under a new filename.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/exports/export-document.ts and __tests__/export-document.spec.ts (new)
- tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts
- tauri-app/src/lib/views/exports/values-export-runner.svelte.ts
- tauri-app/src/lib/views/exports/batch-export-runner.svelte.ts
- tauri-app/src/lib/exports/color-study-compositor.ts and value-study-compositor.ts (pure builder seams only)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Require source/result/config identity and the IMP-184 retained-job contract before dependent async reads.
- [ ] Use the same document construction for preview and save across Colors/Values/Batch.
- [ ] Test rapid option changes, source switching during preview/save, cancellation and superseded resource release.
- [ ] Preserve all existing checks/subchecks, file naming, graph format choices and non-label output bytes.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a preview for source A and configuration X, WHEN selection changes to B during async work or save dialog, THEN no output mixes A/B and any saved output is explicitly bound to the captured valid A/X document.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
