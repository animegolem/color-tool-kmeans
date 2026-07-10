---
node_id: AI-EPIC-027
tags:
  - EPIC
  - AI
  - ui
  - redesign
  - design-system
date_created: 2026-07-09
date_completed:
kanban_status: in-progress
AI_IMP_spawned:
  - AI-IMP-167
  - AI-IMP-168
  - AI-IMP-169
  - AI-IMP-170
  - AI-IMP-171
  - AI-IMP-172
  - AI-IMP-173
  - AI-IMP-174
  - AI-IMP-175
  - AI-IMP-176
  - AI-IMP-177
---

# AI-EPIC-027-notebook-ui-redesign

## Problem Statement/Feature Scope

The shipped UI was effectively the wireframe: a conventional sidebar/header shell built before the design direction existed. A complete design system now does — the **notebook redesign** (Claude Design bundle, currently `RAG/Color Tool Design System.zip`): the app as a two-page paper spread on a dark desk, edge tabs riding the page border, figures drawn in ink on ruled paper, the palette as a ledger, errors as paper slips. The bundle ships full-size tokens, 18 specced components (reference JSX + `.d.ts` + prompt docs), an interactive kit covering all five surfaces, wireframes, motion studies, and `Code Change Notes.md` — 12 decided code changes referencing our actual file paths. This epic lands that redesign.

## Proposed Solution(s)

Rebuild the Svelte template/style layer to the notebook idiom, keeping everything below it untouched (Rust backend, stores, bridges, compute, export generators, extracted `.svelte.ts` runners). Scope is ~4,000–4,500 LOC of Svelte across App.svelte, five views, and three components, guided by the design bundle. Sequenced so the app stays shippable:

1. **Foundation** — vendor the extracted design bundle into the repo (e.g. `RAG/design-system/`, replacing the zips); swap `lib/styles/tokens.css` to the notebook tokens; port the paper primitives to Svelte 5 (EdgeTabs, Spine, FoldedCorner, PaperSlider, PaperCheckbox, BracketSelector, StampButton, Figure, PaletteLedger, BucketStrip, Scrubber, TapedPhoto, PinnedCard, ErrorSlip, ZoomOverlay chrome); refresh stale CLAUDE.md sections while in there.
2. **Shell** — desk + spread + edge tabs replace the sidebar and per-view header bar (Code Change Note 6); existing views run inside during transition.
3. **Colors spread (wireframe 4a)** — taped photo, always-visible parameters, figures 01–04 with bracket selectors (Note 7), metrics caption under the histogram (Note 8), live palette ledger with copy/CSV/ase quick actions (Note 3), bucket strip (Note 4a), snap-toggle removal (Note 1), hue×lightness default → frequency (Note 2), upload-affordance removal (Note 5).
4. **Bucket page + Values (3b, 5b)** — full bucket as a turn-the-page view (Note 4b); Values previews stacked original-over-neutral with scrubber beneath (Note 10).
5. **Exports + Batch (5c, 5d)** — Exports as single sheet with packing list and stamp composites; Batch checked against the wireframe's own "approximate" caveat before committing.
6. **Overlay + settings + motion** — zoom overlay chrome and ~70% frame (Note 12), flat-ink vs pinned-cards chart-ground setting (Note 11), spread→column reflow below ~1100px with crossfade re-stack (Note 9), Settings placement decision (corner affordance).

## Path(s) Not Taken

- **The .fig kit's componentry** (Feather-style icons, tooltip/slider families) — superseded by the design docs; the notebook idiom uses unicode glyphs in Fira Code, no icon set.
- **A logo/wordmark** — none is defined in the sources; "Color Tool" renders in type. Do not invent a mark.
- **New features under cover of redesign** — live video analysis is EPIC-025/026; this epic restyles and restructures existing functionality only (the 12 decided notes are the full behavioral delta).
- **Dark mode / theming** — the notebook is one material palette; no theme system.

## Success Metrics

- All five surfaces (Colors, Values, Batch, Exports, bucket page) render in the notebook idiom matching the design kit; screenshots against `ui_kits/notebook/` in each PR.
- All 12 decided code changes from `Code Change Notes.md` landed (or explicitly re-decided with rationale in the ticket).
- App remains shippable after every phase: existing vitest suites pass, exports remain deterministic, manual smoke (K=300, drag-drop, PNG/SVG/CSV exports) on macOS + Windows.
- No regression in the offline-first rule: fonts and all design assets vendored.
- INDEX.md size watch: no view exceeds the informal 600 LOC target post-redesign (submodule extraction pattern continues).

## Requirements

### Functional Requirements

- [ ] FR-1: Vendor extracted design bundle into the repo; remove/archive the zips; refresh stale CLAUDE.md sections.
- [ ] FR-2: Notebook tokens replace current `tokens.css`; Fira Code added to vendored fonts.
- [ ] FR-3: Paper-primitive component library ported to Svelte 5 with a dev showcase route.
- [ ] FR-4: Shell rebuilt — desk, two-page spread, edge tabs; sidebar and header bar removed.
- [ ] FR-5: Colors spread rebuilt per wireframe 4a, incl. Code Change Notes 1, 2, 3, 5, 7, 8 and the bucket strip.
- [ ] FR-6: Media bucket restructured — recent strip + full bucket page with turn-the-page navigation (Note 4).
- [ ] FR-7: Values view rebuilt per 5b — stacked previews, scrubber beneath (Note 10).
- [ ] FR-8: Exports view rebuilt per 5c.
- [ ] FR-9: Batch view rebuilt per 5d after design check against current BatchView (wireframe flags 5d as approximate).
- [ ] FR-10: Zoom overlay chrome + ground behavior (Note 12).
- [ ] FR-11: Chart-ground display setting — flat ink vs pinned cards (Note 11).
- [ ] FR-12: Responsive reflow — spread folds to single column below ~1100px with crossfade re-stack (Note 9); Settings placement decided and implemented.

### Non-Functional Requirements

- Logic layer untouched: stores, runners, bridges, compute, exports, Rust — restyle/restructure only, per-FR exceptions documented in tickets.
- Runes only (`$state`/`$derived`, `onclick`); pre-commit hooks and LOC discipline apply.
- Each phase is a separate PR with screenshots against the kit; work happens on a feature branch off `main`.
- Wireframe-derived sizes are "strong defaults, not measured finals" — visual judgment calls recorded in tickets.

## Implementation Breakdown

Cut 2026-07-09 with a lifecycle-coverage focus: **IMP-167 (completed at cut) produced `RAG/DESIGN-COVERAGE.md`** — 12 lifecycles mapped against the bundle with a priority-ordered artifact shopping list the owner is producing in Claude Design.

- **AI-IMP-167** — design coverage manifest (lead, done).
- **AI-IMP-168** — vendor bundle, Fira Code, dormant tokens, CLAUDE.md refresh (FR-1/2). Not design-blocked.
- **AI-IMP-169** — 18 paper primitives + dev showcase (FR-3). Not design-blocked (pending-idiom slot reserved).
- **AI-IMP-170** — desk/spread/edge-tabs shell (FR-4). Not design-blocked.
- **AI-IMP-171** — Colors spread + Notes 1/2/3/5/7/8 (FR-5). Ready states unblocked; pending/ingestion/video states need P1-1, P2-5, P2-6.
- **AI-IMP-172** — bucket page + turn-page nav (FR-6). Edge states need P3-8.
- **AI-IMP-173** — Values spread (FR-7). Pending state needs P1-1.
- **AI-IMP-174** — Exports sheet (FR-8). Feedback states need P3-7.
- **AI-IMP-175** — Batch spread (FR-9). **Design-blocked on P2-4** (5d flagged approximate by the bundle).
- **AI-IMP-176** — zoom chrome + chart ground (FR-10/11). Unblocked.
- **AI-IMP-177** — reflow/motion/Settings (FR-12). Colors reflow unblocked; Settings needs P1-3, compact finals need P3-9.

Sequencing: 168 → 169 → 170 → {171, 173, 174, 176 in parallel} → 172 → 175/177 as artifacts land. Delegation assignments decided at activation per ticket (Sol/Sonnet candidates for 168/169; lead for 170/171).


_To be filled when IMPs are cut. Sequenced after EPIC-025 (spike first); EPIC-026 and this epic can interleave — they touch disjoint layers (Rust loop vs Svelte templates) — but VideoPanel/chart surfaces overlap, so live-mode UI tickets in 026 should land against the redesigned shell or be explicitly rebased._
