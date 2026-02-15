---
node_id: AI-IMP-107
tags:
  - IMP-LIST
  - Implementation
  - Exports
  - Values
  - Notan
  - Epic-013
kanban_status: planned
depends_on: [AI-EPIC-013, AI-IMP-105]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.82
date_created: 2026-02-14
date_completed:
---


# AI-IMP-107-values-notan-study-export

## Summary of Issue #1
Value analysis can generate simplified tone images at various levels but there is no dedicated notan study export. Artists studying composition need a side-by-side comparison of tone simplifications at different levels. This ticket adds a notan study export: a 2×2 grid showing levels 2, 3, 4, and 5 with tone bars displaying percentages. Done means users can export a single image showing four tone simplifications, matching the `Values-Export-Notan-Only.png` reference mockup layout.

### Out of Scope
- Interactive notan level selection (fixed at 2/3/4/5 grid).
- Animated transitions between levels.
- Custom color mapping for tone levels.

### Design/Approach
The notan study export generates a 2×2 grid SVG:

```
┌──────────────┬──────────────┐
│  2 Levels    │  3 Levels    │
│  [tone bar]  │  [tone bar]  │
│  [image]     │  [image]     │
├──────────────┼──────────────┤
│  4 Levels    │  5 Levels    │
│  [tone bar]  │  [tone bar]  │
│  [image]     │  [image]     │
└──────────────┴──────────────┘
```

Each cell contains:
- Label (e.g., "2 Levels")
- Tone bar: horizontal strip with grayscale segments sized proportionally to area percentage, with percentage labels
- Simplified preview image at that level

Implementation uses the existing `requestValueAnalysis()` bridge to generate each level's data. The grid is composed via the compositor from IMP-105 or as a standalone SVG generator in `exports/notan-study.ts`.

### Files to Touch
- `tauri-app/src/lib/exports/notan-study.ts`: new file, 2×2 grid SVG generator (~150-200 LOC).
- `tauri-app/src/lib/exports/__tests__/notan-study.spec.ts`: unit tests for grid layout and tone bar generation.
- `tauri-app/src/lib/views/ExportsView.svelte`: wire notan study as a selectable tile in Values section.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Implement `generateNotanStudySvg()` that produces a 2×2 grid SVG for levels 2, 3, 4, 5.
- [ ] Each cell renders: level label, tone bar with proportional segments and percentage labels, simplified image.
- [ ] Tone bar segments use grayscale values matching the value analysis output for each level.
- [ ] Request value analysis data for all four levels (2, 3, 4, 5) via existing bridge.
- [ ] Handle loading state: show progress or placeholder while analysis runs for each level.
- [ ] Wire notan study as a selectable tile in the ExportsView Values section with `[↓]` individual download.
- [ ] Integrate with compositor for inclusion in Values composite export.
- [ ] Add unit tests for tone bar percentage calculation and grid layout structure.
- [ ] Verify output matches `RAG/assets/Values-Export-Notan-Only.png` reference layout.
- [ ] Run `npm run test`, `npm run lint`, `npm run check`, and pre-commit hooks successfully.

### Acceptance Criteria
**Scenario: Export notan study**
GIVEN value analysis is available for the current image
WHEN the user exports the notan study (individually or as part of Values composite)
THEN a PNG is saved showing a 2×2 grid of levels 2, 3, 4, and 5.

**Scenario: Tone bar accuracy**
GIVEN a value analysis result with known percentages
WHEN the notan study is generated
THEN each cell's tone bar shows segments proportional to the area covered by each tone level
AND percentage labels are readable.

**Scenario: Consistent with reference**
GIVEN the reference mockup `Values-Export-Notan-Only.png`
WHEN the notan study export is generated
THEN the layout matches: 2×2 grid, tone bars above images, level labels visible.

### Issues Encountered
{LOC|20}
