---
node_id: AI-IMP-175
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
  - design-blocked
kanban_status: backlog
depends_on:
  - AI-IMP-170
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.5
date_created: 2026-07-09
date_completed:
---

# AI-IMP-175-batch-spread

## Summary of Issue #1

EPIC-027 FR-9: BatchView in the notebook idiom. Wireframe 5d is **flagged "approximate — to be checked against BatchView" by the bundle itself**; this ticket is design-blocked until the P2-4 artifact (verified Batch spread) lands.

**Design lifecycles owned:** L7 — contact sheet, aggregate, pin expand, empty, computing.

### Out of Scope

- Batch analysis/runner logic (untouched).
- Batch export section (IMP-174 owns export UI idiom; batch export actions restyle here consistently).

### Design/Approach

**BLOCKED — do not start until `RAG/DESIGN-COVERAGE.md` P2-4 is checked off.** When the artifact lands: template/style rebuild over intact batch runners; PinExpandOverlay adopts the pinned-card/zoom idiom; empty and computing states per artifact; aggregate figures numbered in page sequence.

### Files to Touch

- `lib/views/BatchView.svelte`, `batch/PinExpandOverlay.svelte`
- Screenshot fixtures

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] P2-4 artifact received and linked here (path/reference recorded).
- [ ] Contact sheet + aggregate per verified design.
- [ ] Pin expand, empty, computing states implemented.
- [ ] Full gates + screenshots; manual batch smoke (pin 4, aggregate, export).

### Acceptance Criteria

**WHEN** four images are pinned. **THEN** the Batch spread matches the verified artifact, aggregate analysis renders in the notebook idiom, and batch exports remain byte-identical.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
