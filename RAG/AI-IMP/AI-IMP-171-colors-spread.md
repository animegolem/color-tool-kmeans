---
node_id: AI-IMP-171
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on:
  - AI-IMP-170
  - AI-IMP-195
  - AI-IMP-196
  - AI-IMP-199
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-171-colors-spread

## Colors study composition and expanded palette index

Arrange source, existing controls, 2D distributions, palette index and collection entry point as one study. Preserve the current histogram in addition to polar and hue-lightness plots. The optional 3D primitive is integrated after IMP-197, not substituted for 2D.

Normative basis: PROJECT-RECORD rev 0.5 §9.2, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No stores/runner ownership changes, sampling/math changes, new ingestion cancellation, native video/live mode, or export serialization changes.

### Design/Approach

Consume the presentation adapter and shared status/label components. Keep analysis runner/controller factories and current toggles/defaults intact. In particular do not force snapToReal=true, flip hue-lightness defaults, or remove upload affordances from old Code Change Notes. Add the 3D slot only when the reviewed component is available.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/views/HomeView.svelte
- tauri-app/src/lib/views/home/ParameterControls.svelte
- tauri-app/src/lib/views/home/AnalysisCards.svelte
- tauri-app/src/lib/views/home/VideoPanel.svelte (status presentation only)
- tauri-app/src/lib/components/study/PaletteIndex.svelte (new consumer of IMP-199 formatter)
- tauri-app/src/lib/views/__tests__/study-colors.spec.ts (new)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Preserve all current analysis parameters, defaults and chart visibility choices.
- [ ] Render linked palette index with deterministic labels and known source identity.
- [ ] Wire pending/stale/error status only from existing proven state; do not manufacture cancellation support.
- [ ] Compare all three arrangements and compact stacking over the same selected media.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN one completed analysis, WHEN presentation layout or a cluster selection changes, THEN no reanalysis is triggered, current controls remain available, and index/figures identify the same cluster.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
