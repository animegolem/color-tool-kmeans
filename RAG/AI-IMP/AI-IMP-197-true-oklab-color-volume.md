---
node_id: AI-IMP-197
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

# AI-IMP-197-true-oklab-color-volume

## True sRGB gamut volume in OKLab

Build the third visual primitive from the actual sRGB gamut mapped into OKLab, not the cylindrical normalization used for the deliberate 2D plots. Preserve palette proportions and provide accessible camera control/fallback.

Normative basis: PROJECT-RECORD rev 0.5 §9.5, §4 and §6. Visuals: RAG/design-2026-09/README.md. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No Rust/color-core optimization, new color-space definition, revised 2D normalization, runtime CDN, analysis runner or export capture; IMP-198 owns capture.

### Design/Approach

Reuse and centralize the existing sRGB/OKLab conversion functions without changing 2D output. Plot (a,L,b) with equal coordinate units and a tested neutral axis; distinguish source color samples, display-gamut boundary and proportion marks. Use locally bundled Three.js only after dependency review, render on demand, dispose GPU resources, and keep context-loss recovery explicit.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- tauri-app/src/lib/color/oklab.ts and oklab.spec.ts (new shared math seam)
- tauri-app/src/lib/exports/polar-chart.ts (mechanical import/re-export of identical pure conversions only)
- tauri-app/src/lib/components/study/ColorVolume.svelte (new)
- tauri-app/src/lib/visualization/oklab-volume.ts and oklab-volume.spec.ts (new)
- tauri-app/package.json and package-lock.json (reviewed pinned dependency only; npm-10 lock compatibility)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Test primary colors, grayscale, gamut boundary samples and equal-axis coordinate scaling against existing golden math.
- [ ] Preserve 2D exports byte-for-byte through any pure conversion extraction.
- [ ] Test camera presets/keyboard rotation, shared cluster identity, resize, disposal and unavailable WebGL fallback.
- [ ] Document marker-size/proportion encoding and occlusion; no claim that projection removes all visual ambiguity.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN a known RGB palette, WHEN viewing from multiple angles, THEN sample positions and the irregular sRGB boundary agree with tested OKLab coordinates and no cylinder or independent axis stretching is substituted.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
