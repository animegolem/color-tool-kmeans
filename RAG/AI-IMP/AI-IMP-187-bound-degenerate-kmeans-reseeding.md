---
node_id: AI-IMP-187
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

# AI-IMP-187-bound-degenerate-kmeans-reseeding

## Stop unchanged empty-cluster reseeds from forcing max iterations

The proposed convergence fix always marks an empty cluster as reseeded, even when the centroid does not change. Uniform/low-distinct input then runs to max_iters. Success preserves necessary refinement but converges when no material reseed remains.

Trace: **SEP-08 / RT-07 / SWEEP-012**; priority **P3**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

IMP-178 optimizations, fixture reblessing without approval, old native kmeans.rs and spike binaries.

### Design/Approach

Round 01 ruling: baseline repair replaces aggregate IMP-180 completion as the ticket dependency. Explicit coordinated math-base and RT-07 source prerequisites still apply. Prefer one semantically corrected SWEEP-012 adaptation carrying IMP-187 provenance and both regressions; do not duplicate an accepted test extraction or manufacture a knowingly deficient intermediate patch.

Distinguish material centroid/assignment changes from unchanged duplicate seeds, or use a bounded degeneracy rule justified by tests. Preserve tol=0 fixed-budget semantics. IMP-178 owns active performance edits to this same file: obtain its accepted base and coordinate before applying; this ticket does not authorize editing that worktree or its benchmarks.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `color-core/src/kmeans.rs`
- `color-core/tests/kmeans_snapshots.rs`
- This ticket's checklist and Issues Encountered section.
- `color-core/src/kmeans_tests.rs` (only when present on the coordinated accepted math base)

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Retain the original warm-start empty-cluster false-convergence regression.
- [ ] Add uniform k>distinct and repeated-tone cases with bounded iteration evidence.
- [ ] Verify fixed-budget tol=0 behavior, deterministic scalar/SIMD parity and approved snapshots.
- [ ] Report numerical differences separately from any measured performance claim.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** uniform points and more clusters than distinct points, **WHEN** empty seeds remain unchanged, **THEN** convergence does not force useless max_iters work; a materially reseeded centroid still receives refinement.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. Coordinate the separately owned IMP-178 base before implementation.
