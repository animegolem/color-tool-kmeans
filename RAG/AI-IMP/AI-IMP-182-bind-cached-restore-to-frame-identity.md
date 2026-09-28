---
node_id: AI-IMP-182
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: in-progress
depends_on:
  - AI-IMP-181
  - AI-IMP-192
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-182-bind-cached-restore-to-frame-identity

## Bind cached restore eligibility to an exact frame

A cached-restore boolean survives a user seek/step and preserves analysis for different pixels. Success means only the exact unchanged frame/settings can reuse cached Colors output.

Trace: **SEP-03 / SWEEP-003 and SWEEP-010**; priority **P2**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Playback feature delivery, DOM layout and global cache policy.

### Design/Approach

Rev0.59: correctness-wave-05-phase-192-verdict-and-182-brief.md assigns two-test-only reconciliation at2853040. Only video-controller-cache-reset.spec.ts and audit-control-flow-races.spec.ts may change; the historical production list below is not current editing authority. Real store/runner proof is required for new-result claims, with conservative no-step fresh extraction and unchanged stored-entry remount as distinct positives. All production defects return to lead before a fix.

Rev0.57 supersedes the production RestoreIntent proposal below for the current conservative path: wave04 removed the unsafe preserve branch, so phase182 is test-only reconciliation after192. Prove seek/step during restore debounce/IPC plus current no-step fresh extraction and cached-A/fresh-B reset. Retain actual stored-entry remount reuse; do not recreate a cache-preservation API. See correctness-wave-05-implementation-verdict.md R7. Production changes require a new source-specific ruling if the tests expose a remaining defect.

Round 01 ruling: serialize after IMP-192. New request tokens must not become part of reusable frame-content equality. Exact restore proves the cached content/frame/settings under current execution authority; it cannot relabel old results with an unproven new content revision.

Capture an explicit restore intent including source revision, frame time, parameters and request generation. Revoke it on step/seek/new selection/disposal. Compose with IMP-181 dedup semantics instead of adding another loose preserve flag.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/stores/video.ts`

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Step during cached-restore debounce and during active frame IPC; assert new pixels cause new analysis.
- [x] Retain no-step fresh extraction and separate actual unchanged stored-entry remount positive controls (rev0.59 reconciliation).
- [ ] Test cached A to fresh B reset and disposed restoration.
- [x] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** cached A at 7 seconds, **WHEN** the user steps before restoration finishes, **THEN** the settled new frame is analyzed and cannot inherit A's old result.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

Rev0.60: report159c92aa test-only reconciliation accepted; lead commit8a8e13381410841674015ae27da9310c3c659fbe contains two tests391 additions plus generatedINDEX. Nine new cases retain all27 prior cases in the modified suites. Lead reproduced413/34,132/12,Node88,event10/static gates. Timing spies and real store/runner result proof are explicitly distinct. No production defect, fabricated negative or source change. Mixed cachedA/freshB plus disposed-restoration checkbox remains open for183 disposal; status stays in-progress pending combined lifecycle/integration.

Rev0.59:192 locally accepted/committed2853040 after404-test gate;182 test-only work is now assigned at that exact clean base. Two allowed test files, no production/RestoreIntent/preserve API. Disposal and requested/settled handoff remain183 and its mixed checklist item stays open. No182 implementation is claimed by dispatch.

Rev0.57: preflight confirms the specific old preserve-on-new-pixels branch is removed. Lead assigns test-only reconciliation after phase192's separate review/commit; no182 implementation is currently released. Original proposal remains historical, not permission to introduce RestoreIntent or restore cached analysis onto mutable-path extraction.

Rev0.56: wave04 deliberately removed the loose cached-preservation branch and ID-only seed, retaining conservative fresh-extraction recomputation and actual stored-entry remount reuse. The original implementation proposal above therefore needs reconciliation, not blind execution. correctness-wave-05-review-brief.md asks which failure remains and which direct seek/step/handoff regressions are still required. No182 implementation or closure is inferred from removal alone.

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Local test-only reconciliation accepted at8a8e133; combined183 lifecycle and integration remain open.
