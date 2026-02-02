---
node_id: AI-IMP-094
tags:
  - IMP-LIST
  - Implementation
  - ui
  - polar
  - axis
  - labels
kanban_status: planned
depends_on:
parent_epic: [[AI-EPIC-019-polar-field-and-merge-stability]]
confidence_score: 0.72
date_created: 2026-02-02
date_completed:
---

# AI-IMP-094-polar-axis-label-placement

## Move polar axis labels inside the ring
Axis labels are clipped when rendered outside the polar ring. We need to position labels inside the chart to avoid clipping across all panel sizes. Done when labels are readable and never cut off in OKLCH/OKHSV/HSV views.

### Out of Scope
- Re-styling fonts or axis line weights.
- Changing label copy beyond placement.

### Design/Approach
- Adjust axis label radius to be inside the ring (negative offset from effective radius).
- Validate in all three polar modes.

### Files to Touch
- `tauri-app/src/lib/exports/polar-chart.ts`: adjust axis label placement math.

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Move axis labels inside the ring (e.g., `effectiveRadius - N`).
- [ ] Verify label placement in OKLCH/OKHSV/HSV with multiple sizes.

### Acceptance Criteria
**Scenario:** Axis labels never clip.
**GIVEN** the polar chart in any mode.
**WHEN** rendered in the standard panel size.
**THEN** the axis labels remain fully visible and readable.

### Issues Encountered
{LOC|20}
