---
node_id: AI-IMP-171
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
  - AI-IMP-170
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.6
date_created: 2026-07-09
date_completed:
---

# AI-IMP-171-colors-spread

## Summary of Issue #1

EPIC-027 FR-5 — the flagship page. Rebuild HomeView to wireframe 4a: left page = `COLORS · filename` title, TapedPhoto, always-visible PaperSlider params, PaperCheckboxes, bucket strip; right page = figures 01–03 with BracketSelectors, metrics caption under histogram, live PaletteLedger (04) with copy-hex / csv / ase quick actions. Applies Code Change Notes 1 (snap toggle removed), 2 (hue×lightness default `frequency`), 3 (live ledger), 5 (upload affordance removed), 7 (brackets), 8 (metrics move).

**Design lifecycles owned:** L1 (ingestion states), L2 (analysis pending idiom), L3 (video pending states) — see `RAG/DESIGN-COVERAGE.md`.

### Out of Scope

- Bucket page navigation (IMP-172; strip's "view all ↘" can stub).
- Live playback UI (EPIC-026 tickets, after L4 artifact).
- Chart SVG generation changes (exports/* untouched — figures render existing SVGs on the paper ground).

### Design/Approach

HomeView keeps its runner/controller factories untouched; template/style layer rebuilt around notebook primitives. Ledger renders from `AnalysisResult.clusters` in export row format (`[r:g:b] · count px · share%`), reusing palette/CSV/ase runners for actions. `params.snapToReal` hardcoded true; `hueLightnessSizeMode` default flipped in store with pref migration. VideoPanel transport restyles to Scrubber idiom (behavior intact).

**Design dependencies (blockers per state):** P1-1 analysis-pending idiom, P2-5 ingestion overlay comps, P2-6 video pending states. Ready states are implementable immediately; pending/overlay states land when artifacts arrive — ticket may split a follow-on sub-ticket (AI-IMP-171-1) if artifacts trail.

### Files to Touch

- `lib/views/HomeView.svelte`, `home/ParameterControls.svelte`, `home/AnalysisCards.svelte`, `home/VideoPanel.svelte`
- `lib/components/notebook/PaletteLedger.svelte` consumers; new `home/LedgerActions` glue if needed
- `lib/stores/analysis.ts` (default flip + snapToReal removal), `preferences.ts` migration
- Tests: default-flip migration, ledger row formatting determinism

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Left page per 4a (title, taped photo, params, checkboxes, bucket strip).
- [ ] Right page figures 01–03 + brackets + metrics caption (Notes 7/8).
- [ ] Live ledger with quick actions (Note 3); row format matches export palette exactly (shared formatter, tested).
- [ ] Notes 1/2/5 applied with pref migration test.
- [ ] Pending/ingestion/video states implemented per artifacts (or split to sub-ticket with rationale).
- [ ] Screenshots vs kit; manual smoke incl. K=300 and video scrub.
- [ ] Full gates.

### Acceptance Criteria

**WHEN** an image is loaded at ≥1280px width. **THEN** the Colors spread matches the kit's 4a rendering, the ledger updates live with analysis, and copy/csv/ase actions produce identical output to the Exports page equivalents.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
