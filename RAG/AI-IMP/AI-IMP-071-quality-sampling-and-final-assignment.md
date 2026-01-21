---
node_id: AI-IMP-071
tags:
  - Implementation
  - sampling
  - kmeans
  - pipeline
kanban_status: completed
depends_on:
  - AI-EPIC-008
  - AI-IMP-070
confidence_score: 0.65
created_date: 2026-01-19
close_date:
---

# AI-IMP-071-quality-sampling-and-final-assignment

## Summary of Issue #1
We need a unified quality control that maps to sampling params and a final full assignment step for stable counts. Outcome: sampling uses a quality preset (stride/max samples/max dimension) and k-means performs a final assignment to compute consistent counts/shares.

### Out of Scope 
- UI wiring and slider rendering.
- Export/polar chart updates.

### Design/Approach  
- Introduce a `quality` preset (int or enum) in the analysis request; map to stride and caps.
- Default mapping centered on stride 4 with two steps each direction (stride 1/2/4/8/16).
- Tie each step to `max_samples` and `max_dimension` to keep runtime bounded.
- Update sampling to compute OKLab samples once and reuse for clustering.
- Add a final full assignment pass after convergence to recompute counts against the full dataset.

### Files to Touch
- `tauri-app/src-tauri/src/image_pipeline.rs`
- `tauri-app/src-tauri/src/kmeans.rs`
- `tauri-app/src-tauri/src/main.rs`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Define quality preset mapping (stride 1/2/4/8/16) and sample caps.
- [x] Update sampling params to accept quality preset and remove direct stride/maxSamples wiring.
- [x] Compute OKLab samples in the sampling stage and reuse for clustering.
- [x] Add final full assignment pass to recompute counts after convergence.
- [x] Add tests for quality mapping and stable counts on deterministic input.

### Acceptance Criteria
**Scenario:** Quality mapping applies correctly
**GIVEN** each quality preset
**WHEN** sampling parameters are resolved
**THEN** stride/max samples/max dimension match the mapping table.

**Scenario:** Final counts are stable
**GIVEN** a fixed dataset and seed
**WHEN** k-means converges
**THEN** a final assignment pass produces deterministic counts/shares.

### Issues Encountered 
None.
