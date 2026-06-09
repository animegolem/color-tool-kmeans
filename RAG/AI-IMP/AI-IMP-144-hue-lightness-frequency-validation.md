---
node_id: AI-IMP-144
tags:
  - IMP-LIST
  - Implementation
  - analysis
  - charts
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.9
date_created: 2026-03-19
date_completed:
---

# AI-IMP-144-hue-lightness-frequency-validation

## Validate hue x lightness frequency sizing

The hue x lightness scatter chart offers a "frequency" size mode that should scale marker size by cluster pixel count. In practice, markers never appear to vary in size across tested images. This ticket validates whether the frequency sizing math is correct, fixes it if broken, or removes the mode if it provides no useful signal.

### Out of Scope

- Changing the default size mode (chroma remains default).
- Modifying the polar chart or histogram.
- Adding new size modes.

### Design/Approach

Trace the data flow from `AnalysisCluster.count` through `generateHueLightnessSvg()` to the SVG `r` attribute. Verify the normalization formula produces visible size differences for typical cluster distributions. Test with known synthetic data (e.g., one large cluster and several small ones). Fix the normalization if broken; if the mode is fundamentally uninformative, remove it from the toggle group.

**Root cause located (2026-06-09 code review):** in `hue-lightness.ts` the chroma mode normalizes by the max (`chroma / maxChroma`) but frequency mode uses raw `Math.sqrt(cluster.share)` with no normalization. `share` is a 0-1 fraction (`count / sampled_pixels`) and the max symbol radius is ~17px, so at typical cluster counts `sqrt(share) * maxRadius` falls below the 2px `Math.max(2, ...)` floor for every cluster — all markers clamp to 2px and never vary. Fix: normalize by `Math.sqrt(maxShare)` so the largest cluster gets the full symbol radius, mirroring chroma mode. Keep the mode; do not remove it.

### Files to Touch

- `src/lib/exports/hue-lightness.ts`: frequency size calculation
- `src/lib/exports/__tests__/`: add or update test for frequency sizing

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Read `generateHueLightnessSvg()` and trace frequency size calculation
- [ ] Create synthetic cluster data with varied counts (1%, 50%, 0.1%)
- [ ] Verify SVG output shows visible size differences
- [ ] Fix normalization formula if broken
- [ ] If mode is uninformative, remove from toggle group in HomeView and BatchView
- [ ] Add/update unit test for frequency sizing
- [ ] `npm run check && npm run lint && npm run test`

### Acceptance Criteria

**Scenario:** Frequency mode shows size variation
**GIVEN** an analysis result with clusters of varying pixel counts.
**WHEN** the user selects "Frequency" size mode on hue x lightness.
**THEN** larger clusters render as visibly larger markers.

### Issues Encountered

<!--
This section is filled out post work.
-->
