---
node_id: AI-IMP-181
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: in-progress
depends_on:
  - AI-IMP-179
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-181-revision-aware-colors-request-identity

## Make Colors request dedup respect content replacement

Same-path replacement invalidates the result but retains the runner's completed request key, suppressing replacement analysis. Success is one new analysis for changed source content and no redundant work for a valid unchanged restore.

Trace: **SEP-02 / FE-05 / SWEEP-010**; priority **P2**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Broad video controller unification; native file hashing; performance lane.

### Design/Approach

Source prerequisite: the assigned candidate must contain the adapted SWEEP-010 and SWEEP-017 invalidation/revision changes. Aggregate IMP-180 need not be closed while unrelated math remains outstanding; the implementation brief must identify the actual source patches/tip.

Round 01 ruling: seed adapters pass actual source revision, not an id-only cast. Keep stable content identity separate from active selection and transient execution authority (PROJECT-RECORD section 4.1).

Use canonical content revision consistently for scheduled and seeded keys, or prove an equivalent explicit invalidation contract. Review all seed/cancel callers. Preserve token-based cancellation and exact-cache restore semantics.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/stores/image.ts`
- `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`
- `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts (new)`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/views/HomeView.svelte`

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add a real store + ingestion + runner regression for analyzed A replaced at the same path.
- [x] Verify changed content dispatches once and stale completion cannot satisfy the new revision.
- [x] Verify unchanged, eligible cached restore does not dispatch redundant analysis.
- [x] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** ready analysis for source revision A, **WHEN** the same path is replaced by revision B, **THEN** A is invalidated and B is analyzed even when ID and settings are unchanged.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

Rev0.56: locally implemented and independently accepted at41222c50001b7a02d516e7122b94f434ea073243 after01044d7f57 and017dbfad26. Status remains in-progress pending integration, consistent with IMP179. All four implementation items are validated: actual ingestion/store/runner proof, stale success/error rejection, stored-entry remount positive control and exact report/provenance. Full gates356frontend/31files,65focus/8files,72native plus1intentional ignored,1scalar,88profiling,10hook and static checks pass. See correctness-wave-04-verdict.md. The test-local reactive equivalent is not a mounted Svelte/browser run; native/owner workflow and Node20/platform acceptance remain open. No timing/numeric/schema change, main merge or release.

Rev0.55: both prerequisites are locally accepted:010 at44d7f57 and017 atdbfad26. Independent017 gates351/30 frontend,60/7 focus,88 profiling,10 event-guard and static checks passed. Three-file181 implementation is now assigned by correctness-wave-04-phase-017-verdict-and-181-brief.md; its narrow fence supersedes the broader projected file list above. All checklist items remain open until actual181 proof. Final-wave native/scalar gates and mounted/owner acceptance must be distinguished.

Rev0.54: adapted SWEEP010 prerequisite accepted and locally committed44d7f57 after independent340/28 frontend,49/5 focused,88 profiling and10 event-guard tests plus static gates. Replacement invalidation and cancellation are present; revision allocation/pinned invalidation is assigned as phase017 and this ticket's request-key implementation remains gated afterward. No checklist item or aggregate acceptance closes at the010 tip. See correctness-wave-04-phase-010-verdict-and-017-brief.md.

Rev0.52: owner approved resumed development after normal B14 manual use. Focused correctness-wave-04-review-brief.md verifies SWEEP010/017 prerequisites and this ticket on8bf3187 plus57 preserved profiling paths before an exact implementation fence. No code or checklist acceptance yet; timing policy and native ownership remain separate.

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Original September evidence remains historical review input; the rev0.56 entry above records the separately implemented and validated local source result.
