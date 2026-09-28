---
node_id: AI-IMP-185
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: planned
depends_on:
  - AI-IMP-193
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-185-atomic-values-artifact-publication

## Publish Values artifacts from one owned source snapshot

Same-generation cache misses share writable final paths, source is decoded twice, and metadata write failure is ignored. Success is immutable complete returned artifacts from one source snapshot.

Trace: **SEP-06 / RT-03 / SWEEP-021**; priority **P2**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

New Value algorithms, output redesign, global memory/disk pressure product policy.

### Design/Approach

Round 02 ruling: every result/cache group records the actual immutable input identity or verified digest that produced it. An opaque generation or metadata-only path match is insufficient. C2/C3 govern recoverable response ownership and cached-result binding; frontend hookup precedes IMP-184 and is serialized.

Round 01 ruling: completion includes frontend transfer/release, not just atomic PNG publication. Newly fenced store/contract hooks overlap IMP-184 and must serialize. A rejected acceptance or lost response cannot leak the published result; see verdict Amendments 4–5.

Use the approved native ownership contract, snapshot source once, compute into private staging, and atomically admit a complete generation. A cache hit must not rewrite published files. Deduplicate concurrent producers or publish distinct immutable generations with owned references. Propagate metadata/PNG errors and reclaim unpublished staging.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src-tauri/src/value_analysis.rs`
- `tauri-app/src-tauri/src/artifact_ownership.rs`
- `tauri-app/src-tauri/tests/audit_value_cache.rs`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/bridges/value-analysis.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.spec.ts`
- `tauri-app/src/lib/stores/value-analysis.ts`
- `tauri-app/src/lib/stores/value-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/views/values/value-analysis-runner.svelte.ts`
- `tauri-app/src/lib/views/values/value-artifact-ownership.spec.ts` (new)

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Race two same-generation misses; read first returned output while second producer finishes and assert stable complete bytes.
- [ ] Replace source between former read phases; every output belongs to one snapshot.
- [ ] Inject write/publication failure and assert no accepted partial generation or ignored metadata error.
- [ ] Fix the all-transparent test to inspect actual nested output paths and verify no artifacts; keep alpha-sentinel handling.
- [ ] Verify unchanged cache hit does not modify accepted file bytes or timestamps.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** concurrent Values requests for the same logical generation, **WHEN** either returns output paths, **THEN** those files are complete and cannot subsequently be truncated by another producer.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
