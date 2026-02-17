---
node_id: AI-IMP-105-2
tags:
  - IMP-LIST
  - Implementation
  - exports
  - compositor
  - layout
  - design
kanban_status: completed
depends_on:
  - AI-IMP-105-1
parent_epic:
  - - AI-EPIC-013-export-redesign
confidence_score: 0.6
date_created: 2026-02-15
date_completed:
---

# AI-IMP-105-2 — Export Aesthetic & Template Layout Polish

## Summary

Upgrade the export compositor from a generic grid layout to semantic template layouts that match the app UI's visual quality and the design mockups in `RAG/assets/`. Includes card-based sections, palette strip right-column layout, video barcode full-width rendering, badge-style labels, and typography improvements.

### Out of Scope

- Export preview panel in ExportsView
- Responsive canvas width (currently fixed 1200px)
- New export formats (ASE, ACO)

### Design/Approach

1. **Semantic template system** — Named layout functions (`composeColorStudy`, `composeValueStudy`) replace generic grid
2. **Card-based sections** — Rounded-corner cards with subtle borders matching app UI
3. **Palette strip right-justified** — Vertical column on right edge per mockup
4. **Video barcode full-width** — Edge-to-edge at bottom of composite
5. **Badge-style labels** — Pill badges for key/contrast indicators
6. **Typography and spacing** — Match app UI section titles, metadata, margins

### Files to Touch

- `src/lib/exports/compositor.ts`: template functions, major rewrite
- `src/lib/exports/value-analysis.ts`: card styling, visual refinements
- `src/lib/exports/palette.ts`: right-column layout variant
- `src/lib/views/ExportsView.svelte`: template selection wiring
- `src/lib/exports/__tests__/compositor.spec.ts`: template layout tests

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Design `composeColorStudy()` template layout function
- [ ] Design `composeValueStudy()` template layout function
- [ ] Implement card-based section rendering with border-radius and padding
- [ ] Implement palette strip right-column layout variant
- [ ] Implement video barcode full-width bottom rendering
- [ ] Add badge-style pill labels for key/contrast indicators
- [ ] Match typography hierarchy (14px/600 titles, 12px/0.7 metadata)
- [ ] Update ExportsView to wire template selection
- [ ] Add compositor tests for template layouts
- [ ] Manual smoke test against `RAG/assets/` mockups

### Acceptance Criteria

**Scenario:** Colors composite matches design mockup
**GIVEN** analysis is complete with all export options checked
**WHEN** user exports Colors composite
**THEN** output matches the layout in `RAG/assets/colors-export-palette-strip.png`
**AND** palette strip appears as right-justified column
**AND** video barcode renders full-width at bottom

### Issues Encountered

<!-- Post-implementation notes -->
