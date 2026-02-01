---
node_id: AI-IMP-086
tags:
  - IMP-LIST
  - Implementation
  - colors
  - kmeans
  - oklab
kanban_status: completed
depends_on: AI-EPIC-017
confidence_score: 0.63
created_date: 2026-01-31
close_date: 2026-01-31
---

# AI-IMP-086-color-merge-threshold-post-process

## Add Oklab merge threshold after k-means clustering
Introduce a Color Merge Threshold slider to merge perceptually similar centroids after k-means. Done when merged cluster count and visuals update across the Colors tab and exports without altering the base K setting.

### Out of Scope
- Replacing k-means with threshold-first clustering.
- New color spaces beyond Oklab/OKLCH for this merge pass.

### Design/Approach
- Compute Oklab distance between centroids after k-means.
- Merge clusters with distance < threshold using weighted averages (pixel counts) and recompute RGB/OKLCH values.
- Ensure merged clusters feed into all graphs/exports (same cluster list used everywhere).
- Slider range 0.00–0.10 (ΔE Oklab), default ~0.04; UI conveys “merge similar colors” rather than raw units.

### Files to Touch
- `tauri-app/src-tauri/src/main.rs`: merge pass + request param + response variant.
- `tauri-app/src/lib/stores/ui.ts`: store new merge threshold param.
- `tauri-app/src/lib/views/HomeView.svelte`: add slider UI + bind to analysis params.
- `tauri-app/src/lib/bridges/compute.ts`: include merge threshold in IPC payload.
- `tauri-app/src/lib/exports/*.ts`: ensure merged clusters are used by graphs/exports.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add merge-threshold param to analysis request/response types and UI store.
- [x] Implement Oklab distance helper and centroid merge routine (weighted average by pixel count).
- [x] Apply merge pass to k-means output before it is returned to UI.
- [x] Wire UI slider with default and clamp, update analysis trigger on change.
- [x] Ensure all graphs/exports use the merged cluster list.
- [x] Add minimal logging/telemetry for merge results (before/after count).
- [x] Validate on at least one monochrome image and one high‑chroma image.

### Acceptance Criteria
**Scenario:** User wants fewer clusters without changing K.
**GIVEN** an image with K=12.
**WHEN** the merge threshold is set to 0.04.
**THEN** the displayed clusters reduce to ≤5 when colors are perceptually similar.
**AND** exports/graphs reflect the merged clusters.

### Issues Encountered
- Validation run via `cargo test -- --nocapture` using `test-patterns/grey.gif` and `test-patterns/hsl_ligthness.png`; merge counts printed in test output.
