---
node_id: AI-IMP-176
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
  - AI-IMP-171
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.65
date_created: 2026-07-09
date_completed:
---

# AI-IMP-176-zoom-and-chart-ground

## Summary of Issue #1

EPIC-027 FR-10/FR-11, Code Change Notes 11/12: (1) ZoomOverlay keeps all behavior, gains chrome — title line (figure number + active bracket set), ✕, fit control, % readout, hint line; frame shrinks 92% → ~70% centered; (2) new display preference **chart ground: flat ink vs pinned cards** (6a) applied to Colors figures; pinned mode lifts a white card and leaves pin hole + ghost outline behind during zoom; histogram bar hover surfaces its ledger row.

**Design lifecycles owned:** L10 (video-zoom PARTIAL noted; live-zoom deferred with L4).

### Out of Scope

- Zoom behavior/physics changes (wheel/pan/pinch/dbl-click/esc intact).
- Settings sheet itself (IMP-177) — the pref lands in the store + a temporary control.

### Design/Approach

Chrome from 7a/7b tokens (`--zoom-*`); ground follows the new `chartGround` pref ('flat' | 'pinned') in preferences store (persisted). Pinned ground renders Figure inside PinnedCard on both page and overlay; open/close animates the lift (`--fold`/lift motion per Note 12). Histogram-bar hover → ledger row via existing cluster index mapping.

### Files to Touch

- `lib/components/ZoomOverlay.svelte`, `lib/utils/zoom.ts`
- `lib/stores/preferences.ts` (+ migration/test), `home/AnalysisCards.svelte` ground wiring
- Tests: pref persistence, keyboard/esc regression

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Overlay chrome per Note 12; frame ~70%, behavior regression-tested.
- [ ] chartGround pref: flat/pinned rendering on Colors figures + persisted.
- [ ] Pinned zoom lift with pin hole + ghost outline.
- [ ] Histogram hover → ledger row.
- [ ] Full gates + screenshots (both grounds, open/closed).

### Acceptance Criteria

**WHEN** pinned ground is set and the histogram is zoomed. **THEN** a white card lifts off the page leaving a pin hole + ghost, chrome shows `01 · cluster histogram [frequency] hue lightness`, and Esc returns it with the reverse motion.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
