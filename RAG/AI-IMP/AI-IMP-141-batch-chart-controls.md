---
node_id: AI-IMP-141
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - view
  - frontend
kanban_status: planned
depends_on:
  - AI-IMP-139
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.85
date_created: 2026-03-19
date_completed:
---

# AI-IMP-141-batch-chart-controls

## BatchView chart toggle controls, auto-pin uploads, and column alignment

BatchView results currently render charts with no user controls — no way to switch polar mode (OKLCH/OKHSV/HSV), histogram sort order, or hue-lightness size mode. HomeView has these via AnalysisCards toggle groups. Additionally, chart columns are not vertically centered (HomeView uses `align-items: center`), and uploading images from batch view doesn't auto-pin them.

### Out of Scope

- ParameterControls panel (k-means sliders) — analysis params remain shared via global `params` store.
- Batch values analysis (greyscale, rangefinder) — future ticket.
- Export functionality — IMP-137 scope.

### Design/Approach

**Batch chart params store:** Create `stores/batch-params.ts` with a focused subset of rendering params that affect chart display only:
- `polarMode`, `histogramSort`, `hueLightnessSizeMode`, `symbolScale`, `showClusterOutline`, `showAxisLabels`

Analysis params (clusters, quality, ignoreTopN, mergeThreshold, snapToReal) stay in the global `params` store — they affect the k-means run, not chart rendering.

**Toggle controls:** Add inline toggle groups in each chart card header within BatchView, matching the AnalysisCards pattern (pill-style button groups). Read/write `batchChartParams` instead of `params`.

**Column alignment:** One CSS property change — `align-items: start` → `align-items: center` in the `@container` rule.

**Auto-pin:** After appending files in `chooseMedia()`, call `togglePin(entry.id)` if not a raw video and under MAX_PINS.

### Files to Touch

- `src/lib/stores/batch-params.ts`: new store (~20 LOC)
- `src/lib/stores/ui.ts`: add re-export
- `src/lib/views/BatchView.svelte`: toggle controls in card headers, switch chart derivations to batchChartParams, fix alignment CSS, auto-pin in chooseMedia

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create `src/lib/stores/batch-params.ts` with `BatchChartParams` interface and `batchChartParams` writable store
- [ ] Re-export from `src/lib/stores/ui.ts`
- [ ] Add histogram toggle group (Frequency / Hue / Lightness) to histogram card header in BatchView
- [ ] Add polar mode toggle group (OKLCH / OKHSV / HSV) to polar chart card header
- [ ] Add hue-lightness size mode toggle group (Chroma / Frequency) to hue-lightness card header
- [ ] Update chart derivations to read from `batchChartParams` instead of `params` for rendering options
- [ ] Fix `.results-layout.two-columns` CSS: `align-items: start` → `align-items: center`
- [ ] In `chooseMedia()`, auto-pin uploaded images (skip raw videos, respect MAX_PINS)
- [ ] Validate: `npm run check && npm run lint && npm run test`
- [ ] Validate: BatchView.svelte stays under 600 LOC

### Acceptance Criteria

**Scenario:** Independent chart controls
**GIVEN** batch analysis results are displayed.
**WHEN** the user toggles histogram sort to "Hue" on the batch view.
**THEN** the batch histogram re-renders sorted by hue.
**AND** the HomeView histogram sort setting remains unchanged.

**Scenario:** Column alignment
**GIVEN** batch analysis results in 2-column layout.
**THEN** left and right columns are vertically centered against each other.

**Scenario:** Auto-pin on upload
**GIVEN** fewer than 16 images are pinned and user is on batch tab.
**WHEN** the user uploads 3 images via the batch "Upload media" button.
**THEN** all 3 images appear in the media bucket and are automatically pinned.

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
