---
node_id: AI-IMP-173
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
  - AI-IMP-170
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.7
date_created: 2026-07-09
date_completed:
---

# AI-IMP-173-values-spread

## Summary of Issue #1

EPIC-027 FR-7 / Code Change Note 10: ValuesView per wireframe 5b — original stacked over neutral full-width (both larger), Scrubber directly beneath, range finder / values histogram / simplified tones as numbered figures, levels/notan as bracket selector.

**Design lifecycles owned:** L6 — pending state shares the L2 idiom (P1-1 artifact).

### Out of Scope

- Value analysis logic/runners (untouched).
- Video pending states beyond what P2-6 provides (shared with IMP-171).

### Design/Approach

Template/style rebuild over intact `value-analysis-runner`/scrubber factories; `preview-pair` 2-up → stacked rows; microlabels (`ORIGINAL`, mono `--text-55`); figures numbered in the Values page sequence; ErrorSlip for failures.

**Design dependencies:** P1-1 (pending idiom). Ready states implementable now.

### Files to Touch

- `lib/views/ValuesView.svelte`, `values/VideoScrubber.svelte`
- Tests: layout-agnostic behavior already covered; add stacked-order render assertion if cheap

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Stacked previews + scrubber beneath per 5b.
- [ ] Figures + bracket selectors in notebook idiom; metrics/captions per bundle voice.
- [ ] Pending state per P1-1 artifact (or documented placeholder + follow-on).
- [ ] Full gates + screenshots; manual smoke incl. video scrub in Values (exercises IMP-162 fixes).

### Acceptance Criteria

**WHEN** a video frame is analyzed in Values. **THEN** the spread matches 5b with both previews rendered full-width and the scrubber operable beneath them.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
