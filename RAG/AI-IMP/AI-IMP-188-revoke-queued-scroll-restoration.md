---
node_id: AI-IMP-188
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: planned
depends_on:
  - AI-IMP-179
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-188-revoke-queued-scroll-restoration

## Revoke scroll restoration after enqueue and before execution

The shared helper clears ownership before a queued callback runs and looks up a replacement container. Success is zero stale viewport mutation after cancel, supersession or unmount.

Trace: **SEP-09 / XC-10 / SWEEP-028**; priority **P3**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

New scrolling behavior, view layout, auto-scroll policy changes.

### Design/Approach

Source prerequisite: the assigned candidate must contain the adapted SWEEP-028 helper and tests. This ticket does not wait for closure of unrelated IMP-180 adoption; its brief must name the actual source patch/tip.

Maintain an execution generation and capture the owning container. Validate both inside every queued callback, including RAF. Clear/new capture revokes queued authority while allowing the current owner's restore.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/services/analysis-scroll-lock.ts`
- `tauri-app/src/lib/services/analysis-scroll-lock.spec.ts`
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Capture, enqueue restore, clear, replace container, flush promises/RAF: new container must not move.
- [ ] Repeat with a new capture superseding the old callback and with unmount.
- [ ] Verify uncanceled restoration still preserves scroll without accumulating listeners or callbacks.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** a queued restoration for container A, **WHEN** its owner is cleared or replaced before execution, **THEN** neither A nor successor B receives a stale scroll assignment.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
