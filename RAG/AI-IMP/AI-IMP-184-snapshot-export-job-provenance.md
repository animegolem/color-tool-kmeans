---
node_id: AI-IMP-184
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: planned
depends_on:
  - AI-IMP-183
  - AI-IMP-193
  - AI-IMP-185
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-184-snapshot-export-job-provenance

## Pin export source, settings and name for the whole job

A Values composite can combine original A with Notan panels from B and use B's filename after selection changes. Colors/Batch async exports must obey the same job boundary.

Trace: **SEP-05 / XC-01**; priority **P2**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Optional chart/palette abstraction and naming policy correction IMP-194.

### Design/Approach

Round 02 ruling: integrate after IMP-185's real Values group/ACK contract. Cached results must match the immutable input identity or verified digest of the job snapshot; if an external path changed, recompute from that one snapshot or fail explicitly. Follow C2/C3 in the Round 02 verdict for lost-operation recovery and source binding.

Round 01 ruling: synchronously capture the job descriptor, then atomically acquire/snapshot dependencies through async native admission before dependent work. Selection changes do not retarget independent exports. Resolve retained-export versus source revocation in the native protocol. Serialize shared store/contract hooks with IMP-185; see verdict Amendments 3–5.

Capture an immutable job descriptor at invocation: source revision/retained input, settings, result identity and filename. Pass explicit captured arguments through every awaited helper. If retaining the source is impossible, cancel explicitly; never silently switch inputs. Connect native artifact leases after IMP-193's approved contract without inventing a competing owner registry.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/values-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/batch-export-runner.svelte.ts`
- `tauri-app/src/lib/views/ExportsView.svelte`
- `tauri-app/src/lib/exports/chart-save.ts`
- `tauri-app/src/lib/views/exports/export-job.ts (new)`
- `tauri-app/src/lib/views/exports/export-job-provenance.spec.ts (new)`
- `tauri-app/src/lib/views/exports/values-export-chart-save.spec.ts`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/bridges/artifact-ownership.ts`
- `tauri-app/src/lib/bridges/artifact-ownership.spec.ts`
- `tauri-app/src/lib/services/source-snapshot.ts` (new)
- `tauri-app/src/lib/services/source-snapshot.spec.ts` (new)
- `tauri-app/src/lib/stores/analysis.ts` (publication acceptance hooks only)
- `tauri-app/src/lib/stores/value-analysis.ts` (publication acceptance hooks only)
- `tauri-app/src/lib/stores/value-analysis-lifecycle.spec.ts`

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Switch A to B between each deferred analysis/render/save phase and verify every panel and basename stays A.
- [ ] Change export settings mid-job; bytes reflect captured settings consistently.
- [ ] Remove source/cancel job and verify retained-source completion or explicit cancellation; never a mixed or mislabeled file.
- [ ] Verify deterministic export fixtures and token-aware analysis retry remain green.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** an export begun for A with configuration C, **WHEN** selection or settings change before completion, **THEN** all output pixels/options/name describe A/C, or the job explicitly cancels without publishing an inconsistent artifact.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
