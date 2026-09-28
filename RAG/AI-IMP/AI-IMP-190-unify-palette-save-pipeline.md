---
node_id: AI-IMP-190
tags:
  - IMP-LIST
  - Implementation
  - remediation
  - optional
kanban_status: backlog
depends_on:
  - AI-IMP-184
  - AI-IMP-189
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-190-unify-palette-save-pipeline

## Unify palette CSV, ASE and JSON save plumbing

Palette-save plumbing duplicates serialization, destination naming and cancellation handling. Success is shared plumbing without changing format-specific bytes or semantics.

Trace: **XC-08 remaining palette-save slice**; priority **P4 optional**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Palette schema or color conversion changes and public API expansion.

### Design/Approach

Reuse existing palette serializers and captured export-job inputs. Consolidate only the save orchestration, with explicit format metadata and typed payloads.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/values-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/batch-export-runner.svelte.ts`
- `tauri-app/src/lib/exports/palette-save.ts (new)`
- `tauri-app/src/lib/exports/__tests__/palette-save.spec.ts (new)`
- `tauri-app/src/lib/exports/__tests__/palette.spec.ts`
- `tauri-app/src/lib/exports/__tests__/palette-ase.spec.ts`
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Verify exact CSV/ASE/JSON payloads and format extensions through the shared saver.
- [ ] Verify user cancellation writes nothing and real errors remain visible.
- [ ] Verify changing selection during save does not change captured payload or basename.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** a captured palette export, **WHEN** each supported format is saved or canceled, **THEN** its deterministic bytes, filename extension and cancellation result match the established contract.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
