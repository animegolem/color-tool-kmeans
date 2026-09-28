---
node_id: AI-IMP-174
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: backlog
depends_on:
  - AI-IMP-170
  - AI-IMP-195
  - AI-IMP-198
  - AI-IMP-199
  - AI-IMP-200
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-174-exports-sheet

## Existing export controls with composed live preview

Turn the existing Colors/Values/Batch export checklists into a constrained visual builder with a preview generated from the same export document used for saving. Preserve existing individual downloads and CSV/ASE/JSON actions; add only 3D and clearer patch labels.

Normative basis: PROJECT-RECORD rev 0.5 §9.4, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No freeform editor, new image formats, output bundle transaction, math changes, CSV/ASE/JSON schema changes, or bypass of IMP-184 retained-job authority.

### Design/Approach

Reuse the exact controls inventory in the walkthrough. Surface graph SVG/PNG choice next to the affected outputs while preserving the single preference source. Composite format remains PNG; do not invent JPEG/WebP or vector 3D. E1–E8 cover ready, no source, pending, no selected tiles, changed source, saving, success and failure/cancel branches. No freeform canvas, rearrange handles or extra preset families are authorized.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/views/ExportsView.svelte
- tauri-app/src/lib/components/study/ExportPreview.svelte (new)
- tauri-app/src/lib/components/study/ExportOptions.svelte (new)
- tauri-app/src/lib/views/SettingsView.svelte (format preference placement only, serialized with IMP-177)
- tauri-app/src/lib/views/__tests__/study-exports.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Preserve all Colors/Values/Batch checks, subchecks, eligibility, individual saves and data exports.
- [ ] Use IMP-200's document for preview and save; show current source/configuration provenance.
- [ ] Block save for invalid/empty or mismatched current state; distinguish picker cancellation from errors.
- [ ] Show output names/formats and saving/saved/error feedback truthfully; verify keyboard/reflow and no mixed-source output.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN the same captured source/configuration, WHEN an export check changes, THEN preview and eventual output contain the same tiles and labels, AND PNG scale and graph format apply only to supported formats.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
