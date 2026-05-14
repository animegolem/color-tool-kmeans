---
node_id: AI-IMP-105
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Exports
  - Epic-013
kanban_status: completed
depends_on: [AI-EPIC-013, AI-IMP-066]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.85
date_created: 2026-02-14
date_completed: 2026-02-16
---


# AI-IMP-105-export-builder-compositor

## Summary of Issue #1
ExportsView currently offers individual download buttons without a way to select and compose multiple charts into a single export. This ticket rewrites ExportsView as a builder UI with checkbox sections (Colors, Values, Data) and adds a compositor engine that arranges selected tiles into an adaptive grid layout for composite PNG export. Done means users can check any combination of available charts, click "Export Composite", and receive a single PNG containing all selected items in a clean grid layout.

### Out of Scope
- Artist palette .ase export (handled by AI-IMP-106).
- Notan study generation (handled by AI-IMP-107).
- Context menu infrastructure (handled by AI-IMP-108).
- Deterministic output testing (handled by AI-IMP-066).

### Design/Approach
ExportsView redesign as builder with three sections matching app analysis domains:

```
┌─────────────────────────────────────────┐
│ Colors                                  │
│  ☑ Source Image                    [↓]  │
│  ☑ Cluster Histogram               [↓]  │
│  ☑ Polar Chart                     [↓]  │
│  ☑ Hue × Lightness                [↓]  │
│  ☐ Palette Strip                        │
│                                         │
│  [Export Colors Composite]              │
├─────────────────────────────────────────┤
│ Values                                  │
│  ☑ Original + Neutral              [↓]  │
│  ☑ Range Finder                         │
│  ☑ Values Histogram                     │
│  ☑ Notan Study (2×2)              [↓]  │
│                                         │
│  [Export Values Composite]              │
├─────────────────────────────────────────┤
│ Data                                    │
│  Palette CSV                [Save CSV]  │
│  Palette .ase               [Save .ase] │
│                                         │
│  PNG Scale: [2×]  ──────○               │
└─────────────────────────────────────────┘
```

New compositor module (`exports/compositor.ts`):
- Takes array of tiles (SVG strings or image data URLs with dimensions)
- Computes adaptive grid layout (rows × cols based on item count)
- Scales items proportionally, pads with app background color (`#f8f2e3`)
- Renders to single SVG → PNG via existing `svgToPngBlob()`

Per-item `[↓]` download icons allow quick individual chart export without compositing.

### Files to Touch
- `tauri-app/src/lib/views/ExportsView.svelte`: full rewrite as builder UI (~300 LOC).
- `tauri-app/src/lib/exports/compositor.ts`: new layout engine (~200-250 LOC).
- `tauri-app/src/lib/exports/histogram.ts`: wire existing `generateHistogramSvg/Png` to builder.
- `tauri-app/src/lib/exports/hue-lightness.ts`: wire existing `generateHueLightnessSvg/Png` to builder.
- `tauri-app/src/lib/exports/polar-chart.ts`: verify integration with builder tile format.
- `tauri-app/src/lib/stores/ui.ts`: add export builder selection state if needed.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Design and implement compositor module: tile input format, adaptive grid layout algorithm, SVG composition.
- [x] Rewrite ExportsView.svelte with Colors/Values/Data sections and checkbox state management.
- [x] Wire histogram SVG/PNG generation into the builder as a selectable tile.
- [x] Wire hue-lightness SVG/PNG generation into the builder as a selectable tile.
- [x] Wire polar chart SVG/PNG generation into the builder as a selectable tile.
- [x] Add source image as a selectable tile in the Colors section.
- [x] Add palette strip as a selectable tile in the Colors section.
- [x] Implement "Export Colors Composite" button that composes checked Colors items via compositor.
- [x] Implement "Export Values Composite" button that composes checked Values items via compositor.
- [x] Add per-item download icons `[↓]` for individual chart exports.
- [x] Integrate PNG scale slider into compositor output resolution.
- [x] Add placeholder slots for .ase export (wired by IMP-106) and notan study (wired by IMP-107).
- [x] Verify composite export produces clean grid layout for 1, 2, 3, 4, and 5+ selected items.
- [x] Run `npm run test`, `npm run lint`, `npm run check`, and pre-commit hooks successfully.

### Acceptance Criteria
**Scenario: Builder UI renders with available items**
GIVEN color analysis results are available
WHEN the user navigates to the Exports view
THEN they see checkbox sections for Colors, Values, and Data with all available charts listed.

**Scenario: Composite export with selected items**
GIVEN the user has checked 3 items in the Colors section
WHEN they click "Export Colors Composite"
THEN a native save dialog appears and a single PNG is saved containing all 3 items in a grid layout.

**Scenario: Individual chart download**
GIVEN a chart item has a download icon
WHEN the user clicks the `[↓]` icon next to a chart
THEN that single chart is exported as PNG via save dialog.

**Scenario: Adaptive grid layout**
GIVEN 4 items are selected for composite
WHEN the composite is generated
THEN items are arranged in a 2×2 grid with consistent padding and the app background color.

**Scenario: Empty state**
GIVEN no analysis results are available
WHEN the user navigates to Exports
THEN export buttons are disabled with a message indicating analysis is required.

### Issues Encountered
{LOC|20}
