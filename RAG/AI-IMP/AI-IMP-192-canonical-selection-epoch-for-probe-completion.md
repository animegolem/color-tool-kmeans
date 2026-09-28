---
node_id: AI-IMP-192
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: in-progress
depends_on:
  - AI-IMP-181
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-192-canonical-selection-epoch-for-probe-completion

## Revoke dispatched probes on every newer selection

Canceling the raw-video debounce does not revoke an already-dispatched Values probe when the bucket selects a still. Success means all completion authority follows the canonical latest selection.

Trace: **SEP-10 / FE-01 / SWEEP-013**; priority **P2**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Global event-bus rewrite and reworking the media bucket UI.

### Design/Approach

Rev0.57 implementation ruling: correctness-wave-05-implementation-verdict.md R1–R7 is the exact phase192 authority on clean41222c5. Immutable selection epoch orders activated intent before awaits; store-owned target metadata may bind on same-epoch settlement. Non-activating append is not a new selection, and old displayed activeImageId is not necessarily the intended pending target. Default synchronous admission begins intent; captured-authority admission validates/returns acceptance without self-revocation. Scoped clipboard extraction provides executable async coverage.183 disposal/requested-settled handoff remains separate.

Round 01 ruling: include Values view/scrubber frame acquisition in epoch enforcement. Active-selection changes must not revoke independent export/Batch job authority. Same-ID re-admission cannot make an old completion valid again.

Establish or reuse a canonical selection epoch at the store boundary; distinguish starting a user selection from settling that same request. Check it in Home/Values probe and frame ownership as appropriate without falsely revoking current work on its own setFile. Cover still switch, replacement, removal, clear and newer video selection.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/stores/image.ts`
- `tauri-app/src/lib/stores/video.ts`
- `tauri-app/src/lib/services/view-subscriptions.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/stores/image-video-switch-lifecycle.spec.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/views/ValuesView.svelte`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`
- `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts`
- `tauri-app/src/App.svelte` (clipboard delegation only)
- `tauri-app/src/lib/services/clipboard-ingestion.ts` (new)
- `tauri-app/src/lib/services/clipboard-ingestion.spec.ts` (new)
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` (phase192 interface fixtures only)
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts` (phase192 interface fixtures only)

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Dispatch A's probe, select still B via canonical bucket path, resolve A; B must remain current.
- [x] Repeat for clear/removal/replacement/newer video and late rejection, not only success.
- [ ] Keep positive current probe, pre-dispatch cancellation and unmount disposal tests green.
- [x] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** an already-dispatched video probe A, **WHEN** a newer user selection B supersedes it, **THEN** A cannot publish state, acquire a frame or clear B's ownership when it settles.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

Rev0.59: round02d1517872 locally accepted after amendment01. Lead commit2853040d6e7847eaa9aeab0d665179bb35a9dc2f adaptsSWEEP013,18source/test paths plus generatedINDEX. Independently reproduced404/34,123/12,Node88,event10/static gates; hook fmt/clippy passed. Epoch-only frame/strip and owned Home errors now have current controls. Original cleanup-fence deviation explicitly acknowledged; no recovery performed. Source checks above are validated, but mixed unmount-disposal checkbox remains open until183; status stays in-progress pending combined lifecycle/integration. No mounted/native-output/owner acceptance inferred.

Rev0.58: first submissionf32eaa3c remains uncommitted/not accepted. Lead matched18 hashes/fence and reproduced397/34,116/12,Node88,event10 plus static gates. Amendment01 requires stale Home decode-error diagnostic suppression and epoch-isolating Home frame/strip regressions with current controls; existing combined-reset test does not isolate epoch ownership. Original report's no-cleanup claim conflicts with its disclosed temporary archive Trash move, and its four-new-file line subtotal is848, not1,101. Preserve that report and return a corrected round02 receipt with no further artifact movement. All checklist/integration gates remain open;182/183 held.

Rev0.57: source review5c874513 accepted with explicit R1–R7 clarifications and18-path192 implementation fence. Lead independently reproduced29/3 focused current tests and verified absent013/023 ancestry. App/Home pre-await capture and Home event identity amendments approved; new clipboard helper/test required for real pipeline coverage, and two fixture-only allowances prevent silent interface scope drift. No192 code/checklist acceptance yet; phase183 remains a separate later exact-base assignment.

Rev0.56: focused correctness-wave-05-review-brief.md now verifies this ticket on clean41222c5 and proposes the minimal canonical selection boundary before implementation. ContentRevision from wave04 is admission identity, not selection intent; current request settlement must not revoke itself. Adjacent182/183 are reconciliation context. No code/checklist acceptance yet; no new general architecture review requested.

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Local source/test scope accepted at2853040; combined183 lifecycle and integration remain open.
