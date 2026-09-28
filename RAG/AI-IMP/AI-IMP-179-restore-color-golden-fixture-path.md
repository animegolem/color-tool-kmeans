---
node_id: AI-IMP-179
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: in-progress
depends_on: []
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-179-restore-color-golden-fixture-path

## Restore the canonical color-golden test path

M's full Vitest gate fails because color-goldens.spec.ts reads the removed native fixture. Success is a passing suite using the single canonical color-core fixture.

Trace: **SEP-01**; priority **P3**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Golden regeneration, production math, dependency changes, other tests.

### Design/Approach

Implementation authorized by PROJECT-RECORD rev 0.8 and correctness-wave-01-implementation-brief.md. Preserve all prior review evidence; the code lead leaves the bounded candidate uncommitted for independent lead acceptance.

Round 01 ruling: reuse the identical renderer-path patch already prepared in IMP-178 and integrate it once, with provenance, without making this gate repair depend on all numeric optimization. If performance supplies an accepted repair first, record this ticket satisfied by that exact commit after validation. The Rust golden reader is already correct. See the Round 01 verdict, Amendment 2.

Resolve the relocated fixture relative to the test module. Preserve exact fixture bytes and all assertions. Do not copy the fixture back into the old tree.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts`
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Run the previously failing golden suite against the canonical core fixture.
- [x] Run the full renderer test suite and record exact counts.
- [x] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** a clean checkout at the core-extracted baseline, **WHEN** the golden suite runs from tauri-app, **THEN** it loads color-core/tests/fixtures/color_golden.json and retains all numerical assertions.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Locally implemented and independently validated on 2026-09-05; status remains in-progress pending integration. Lead commit 271bee6efe7fd1f65ca5b90ef4e0e8d9bbfba922 carries the exact IMP-178 path repair once. Wave tip 6a17da61d079635d2dcec93c896d8e05c17027d8: 17 frontend files / 185 tests and 48 native tests passed, plus static/scalar gates. Sol reproduced pre-fix ENOENT; lead reran the repaired golden/full suites. See correctness-wave-01-submission.md and correctness-wave-01-verdict.md for full evidence, hook-generated index exception, provisioning correction and remaining Node 20/platform/native-human gates. No fixture bytes or math changed; no main integration or release is claimed.
