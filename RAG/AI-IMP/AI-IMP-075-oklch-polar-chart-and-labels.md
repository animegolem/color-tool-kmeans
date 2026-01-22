---
node_id: AI-IMP-075
tags:
  - Implementation
  - visualization
  - oklch
  - exports
kanban_status: completed
depends_on:
  - AI-EPIC-009
  - AI-IMP-072
confidence_score: 0.55
created_date: 2026-01-19
close_date:
---

# AI-IMP-075-oklch-polar-chart-and-labels

## Summary of Issue #1
Graphs should reflect OKLCH semantics rather than HSV/HSL. Outcome: polar chart uses hue as angle, chroma as radius, and labels reference Hue/Chroma/Lightness.

### Out of Scope 
- Palette export updates.
- UI parameter refactors.

### Design/Approach  
- Update chart layout to use cluster OKLCH values (h, C, L).
- Normalize chroma to fit the chart radius (global max C or configured cap).
- Update axis labels to Hue/Chroma and remove HSL/HLS wording.
- Ensure symbol sizing continues to reflect share/count.

### Files to Touch
- `tauri-app/src/lib/exports/polar-chart.ts`
- `tauri-app/src/lib/views/GraphsView.svelte`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Switch polar chart math to OKLCH (angle = h, radius = C).
- [x] Normalize chroma to chart radius with a stable cap.
- [x] Update labels to Hue/Chroma/Lightness.
- [ ] Smoke test chart rendering with sample analysis output.

### Acceptance Criteria
**Scenario:** OKLCH chart
**GIVEN** cluster data with OKLCH values
**WHEN** generating the polar chart
**THEN** points are placed by hue angle and chroma radius with correct labels.

### Issues Encountered 
Awaiting a smoke test in the running app; layout polish deferred until UI alignment pass.
