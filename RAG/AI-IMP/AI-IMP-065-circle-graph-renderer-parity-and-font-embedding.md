---
node_id: AI-IMP-065
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Graphs
  - Exports
  - Epic-007
kanban_status: in-progress
depends_on: [AI-EPIC-007, AI-IMP-052]
parent_epic: [[AI-EPIC-007-tauri-ui-graphs-exports]]
confidence_score: 0.86
date_created: 2025-11-21
date_completed:
---


# AI-IMP-065-circle-graph-renderer-parity-and-font-embedding

## Summary of Issue #1
The current Graphs view is a static placeholder and does not render the polar circle graph or top-N palette rail described in AI-EPIC-007 or the Figma `graphs.png` slice. We already have `generateCircleGraphSvg` and palette helpers, but they are not wired to the UI, do not reflect live parameter changes, and exported SVGs rely on ambient system fonts instead of embedding Fira Sans for offline determinism. The goal of this ticket is to implement a responsive Graphs view that uses the existing generators, reacts live to axis and symbol-scale changes, and produces SVG output that embeds Fira Sans so visuals match the style guide on any host.

### Out of Scope 
- Preferences persistence (e.g., remembering last axis or symbol scale across sessions).
- Keyboard shortcuts and broader a11y sweep (handled by AI-IMP-068).
- Changes to the underlying k-means math or sampling pipeline.

### Design/Approach  
- Use `analysisResult` and `params` stores to derive the clusters and axis/symbol-scale values, and render a live preview SVG in `GraphsView.svelte` using `generateCircleGraphSvg`.
- Mirror the visual structure from `figma/graphs.png`: circle graph as the primary focus, with a compact top-N palette rail using the existing `topClusters` selector where appropriate.
- Ensure that axis toggles and symbol scale controls (already present in Home parameters) immediately update the graph layout; the Graphs view should be purely derived from shared state with no extra local copies.
- Extend the SVG helpers so that the circle graph document can include an embedded `@font-face` or equivalent `<style>` block for Fira Sans, using the same font family name and weights as `styles/fonts.css`.
- Keep layout simple and responsive: ensure the graph scales sensibly on narrower windows while preserving the Figma circle framing and axis labels.

### Files to Touch
- `tauri-app/src/lib/views/GraphsView.svelte`: replace placeholder with live circle graph and palette rail UI.
- `tauri-app/src/lib/stores/ui.ts`: expose any additional derived selectors needed for Graphs (e.g., top clusters).
- `tauri-app/src/lib/exports/polar-chart.ts`: ensure axis labels and layout align with the Figma spec; add hooks for font embedding.
- `tauri-app/src/lib/exports/svg.ts`: optional helpers for injecting `<style>` / `@font-face` into SVG documents.
- `tauri-app/src/lib/styles/*`: minor adjustments to align spacing/typography with `figma/graphs.png`.
- `RAG/AI-EPIC/AI-EPIC-007-tauri-ui-graphs-exports.md`: update notes when implementation is in place.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Replace `GraphsView.svelte` placeholder with a live circle-graph preview bound to `analysisResult` and `params`.
- [ ] Add a compact top-N palette rail in Graphs view using existing cluster data, matching the structure in `figma/graphs.png`.
- [ ] Ensure axis and symbol-scale changes immediately recompute the layout without requiring a rerun of analysis.
- [ ] Extend SVG helpers and/or circle graph generation to embed Fira Sans in the SVG document so exported graphs render consistently offline.
- [ ] Validate graph appearance against `figma/graphs.png` at representative K values (e.g., 6, 12, 24) and both axis modes (HSL/HLS).
- [ ] Run `npm run lint`, `npm run check`, and pre-commit hooks to ensure no regressions.

### Acceptance Criteria
**Scenario: Live circle graph preview**
GIVEN an image has been analyzed and clusters are available  
WHEN the user navigates to the Graphs tab  
THEN a circle graph appears using the current axis and symbol-scale settings  
AND a top-N palette rail is visible beneath or alongside the graph.

**Scenario: Axis and symbol-scale interaction**
GIVEN the Graphs view is visible with a circle graph rendered  
WHEN the user changes the axis (HSL/HLS) or adjusts symbol scale in Parameters  
THEN the positions and sizes of the plotted circles update immediately to reflect the new layout.

**Scenario: SVG font embedding**
GIVEN the user exports a circle graph SVG (via the Exports flow)  
WHEN the SVG is opened on a host without Fira Sans installed  
THEN the text labels still render with the intended typography because the font is embedded in the SVG.

### Issues Encountered 
{LOC|20}
