---
node_id: AI-IMP-074
tags:
  - Implementation
  - ui
  - parameters
  - svelte
kanban_status: backlog
depends_on:
  - AI-EPIC-009
  - AI-IMP-072
confidence_score: 0.6
created_date: 2026-01-19
close_date:
---

# AI-IMP-074-ui-parameter-simplification-and-quality-slider

## Summary of Issue #1
The UI needs a minimal parameter set and a single quality slider mapped to sampling presets. Outcome: remove advanced knobs, add quality slider, and wire ignore-top-N filtering.

### Out of Scope 
- OKLCH graph rendering updates.
- Export rewiring.

### Design/Approach  
- Replace color space and axis controls with:
  - Clusters (K)
  - Quality slider (5 steps)
  - Ignore top N clusters
  - Symbol size
- Map quality steps to sampling presets centered on stride 4 with two steps each direction:
  - Step -2: stride 1
  - Step -1: stride 2
  - Step 0: stride 4
  - Step +1: stride 8
  - Step +2: stride 16
- Each step also sets max samples + max dimension caps (see compute mapping).
- Keep existing debounce; avoid re-run when slider maps to the same preset.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/compute/bridge.ts`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Update UI store types to new param set (quality, ignoreTopN, symbolScale, clusters).
- [x] Replace parameter panel controls and labels.
- [x] Implement quality slider mapping to discrete presets.
- [x] Wire ignore-top-N param through analysis call.
- [ ] Verify debounce avoids re-run on same preset.

### Acceptance Criteria
**Scenario:** Minimal parameters only
**GIVEN** the Home view
**WHEN** parameters are shown
**THEN** only clusters, quality, ignore-top-N, and symbol size are visible.

**Scenario:** Quality slider mapping
**GIVEN** each slider position
**WHEN** analysis runs
**THEN** it uses the mapped stride and caps for that step.

### Issues Encountered 
None.
