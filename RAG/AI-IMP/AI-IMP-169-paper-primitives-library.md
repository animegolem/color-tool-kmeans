---
node_id: AI-IMP-169
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
  - components
kanban_status: planned
depends_on:
  - AI-IMP-168
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.7
date_created: 2026-07-09
date_completed:
---

# AI-IMP-169-paper-primitives-library

## Summary of Issue #1

EPIC-027 FR-3: port the 18 notebook components (reference JSX in `RAG/design-system/components/`) to Svelte 5 under `lib/components/notebook/`, plus a dev-only showcase route. **Done state:** all 18 render in the showcase matching the kit's component cards; unit tests for interactive primitives (PaperSlider keyboard/pointer, BracketSelector, PaperCheckbox); gates green.

### Out of Scope

- Wiring into real views (IMP-170+).
- The analysis-pending idiom (P1 artifact — add the state to Figure when it lands; leave a TODO slot).

### Design/Approach

Port order: navigation (EdgeTabs, FoldedCorner, Spine) → controls (PaperSlider, PaperCheckbox, BracketSelector, StampButton) → figures (Figure, PaletteLedger+LedgerRow, BucketStrip+BucketTile, Scrubber) → paper (TapedPhoto, PinnedCard+PinHole, ErrorSlip) → overlay (ZoomOverlay chrome as a variant of the existing component, not a fork). Runes only; props mirror the `.d.ts` files; styles consume notebook tokens. Showcase: dev-gated route/view rendering each component with the kit's sample data (`ui_kits/notebook/kit-data.js`).

### Files to Touch

- `tauri-app/src/lib/components/notebook/*.svelte` (~18 files, each small)
- `tauri-app/src/lib/views/DevShowcase.svelte` (dev-only)
- `*.spec.ts` beside interactive primitives

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Navigation trio ported + showcased.
- [ ] Controls quartet ported; PaperSlider keyboard/pointer + aria tests.
- [ ] Figures set ported (Figure header/control-slot/caption contract per prompt.md files).
- [ ] Paper set ported (tape rotation, pin colors, slip rotation per tokens).
- [ ] Showcase route gated to dev; side-by-side check against `ui_kits/notebook/index.html`.
- [ ] Gates: full frontend suite, `check`, `lint`, `format:check`; LOC discipline per file.

### Acceptance Criteria

**WHEN** the showcase renders next to the kit in a browser. **THEN** components are visually indistinguishable at full size.
**AND** slider/checkbox/bracket are operable by keyboard with correct aria.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
