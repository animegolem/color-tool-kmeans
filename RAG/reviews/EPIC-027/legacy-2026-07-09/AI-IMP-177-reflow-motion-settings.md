---
node_id: AI-IMP-177
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
  - design-blocked
kanban_status: backlog
depends_on:
  - AI-IMP-170
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.5
date_created: 2026-07-09
date_completed:
---

# AI-IMP-177-reflow-motion-settings

## Summary of Issue #1

EPIC-027 FR-12, Code Change Note 9 + the two "undecided" items: (1) below ~1100px the spread folds to one scrolling column (image → params → figures → palette) with crossfade + re-stack (`--reflow-fade 120ms`, study A); tabs stay in the border; (2) deliberate page turns (bucket, view change if adopted) use the spine-hinge fold (`--fold-duration 250ms`); (3) Settings gets its decided placement (corner affordance per P1-3 artifact) and a notebook-idiom sheet.

**Design lifecycles owned:** L9 (Settings — P1-3), L11 (compact finals for Values/Exports/Batch — P3-9).

### Out of Scope

- Chart ground pref UI beyond relocating it into the final Settings surface (IMP-176 lands the store).

### Design/Approach

**Partially design-blocked:** Colors reflow is fully spec'd (5e + study A) and can start; Settings placement/sheet (P1-3) and non-Colors compact layouts (P3-9) wait on artifacts. Layout breakpoint + transition state in the shell (IMP-170's `.spread-content` becomes fold-aware); prefer CSS-driven re-stack with a brief crossfade class over view-transition APIs (offline, WebKit-safe). Replace the legacy `narrowMode`/`compactSidebars` machinery.

### Files to Touch

- `App.svelte` + shell styles, `stores/navigation.ts` (breakpoint state)
- `lib/views/SettingsView.svelte` → new surface per artifact
- Per-view compact style blocks

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Colors spread folds to column below breakpoint with study-A motion; interruptible during live resize.
- [ ] P1-3 artifact received; Settings corner affordance + sheet implemented.
- [ ] P3-9 artifacts received; Values/Exports/Batch/bucket compact layouts implemented.
- [ ] Page-turn fold used for bucket navigation (and view changes only if the artifact says so — record decision).
- [ ] Legacy narrow-mode stores removed; no regression at 900px and 1440px.
- [ ] Full gates + screenshots at three widths.

### Acceptance Criteria

**WHEN** the window narrows across the breakpoint during analysis. **THEN** the right page crossfades out (~120ms) and figures re-stack into the column without interrupting the running analysis, and widening reverses it.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
