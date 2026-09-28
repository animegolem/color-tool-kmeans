---
node_id: AI-IMP-183
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: in-progress
depends_on:
  - AI-IMP-182
  - AI-IMP-192
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-183-reacquire-pending-frame-across-views

## Transfer pending frame intent across view disposal

Home revokes pending decode on unmount but Values accepts an older same-video frame despite a newer playhead. Success is successor-owned convergence of displayed pixels, analysis and frameTimestamp.

Trace: **SEP-04 / FE-02 / SWEEP-023**; priority **P2**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

IMP-124 full extraction unification and EPIC-026 persistent playback.

### Design/Approach

Rev0.60: exact implementation authority is correctness-wave-05-phase-182-verdict-and-183-brief.md H1–H4 on clean8a8e133. Current Home does not yet dispose its controller; the summary's contrary statement is historical. Six production/five test paths add terminal local lifetime, required settled identity, immediate requested playhead, same-epoch exact stored reuse or successor-owned reacquisition, metadata merge preservation and strict snapshots. Mounted/native-output acceptance remains separate; final native/scalar gates are required.

Distinguish requested playhead from settled frame identity; on mount, the successor reacquires when identity differs, not just when videoPath differs. Preserve late-owner rejection and settled-only snapshot eligibility. Avoid two simultaneously authoritative controllers.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/ValuesView.svelte`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`
- `tauri-app/src/lib/stores/video.ts`
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`
- `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts (new)`
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` (approved rev0.57;183 assignment released rev0.60)
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` (approved rev0.60 fixture amendment; retain182 cases)
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Mount Home, step, navigate Values during debounce; verify successor acquisition.
- [ ] Repeat with active IPC and reversed completion order; old owner cannot publish.
- [x] Assert snapshots stay unavailable while pending and label settled pixels accurately.
- [x] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** Home displays t0 and requests t1, **WHEN** navigation disposes Home before decode, **THEN** Values acquires t1 under its own ownership and never analyzes t0 as t1.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

Rev0.62: local source/factory scope accepted at933d888 after round02; lead reproduced434/35,153/13,Node88,event10/static,native72+1ignored,scalar1/core-tree and11 hashes. Three amendment regressions corrected cache initialization, canonical snapshot currentness and scrub policy. Snapshot and reporting items validated; literal mounted Home/navigation items remain open because factory simulation is not mounted proof. Status stays in-progress for integration/owner acceptance. See correctness-wave-05-verdict.md for combined scope and next read-only193 review.

Rev0.61: submission8826aa57 remains uncommitted/unaccepted. Lead matched11 hashes/fence and reproduced431/35,150/13,Node88,event10/static,native72+1ignored,scalar1/core-tree. Amendment01 requires pre-fix regressions/fixes for Values new cached selection losing cached time, Home snapshot getter missing canonical epoch validation, and reconciliation bypassing active-scrub dispatch policy. Same11-path authority; original report immutable, round02 required. No checklist closure or combined-wave acceptance from green gates.

Rev0.60:182 accepted/committed8a8e133 after413-test gate;183 implementation now released by exact11-path brief. Required pure settlement matching may live in video.ts, no VideoPanel/frame-snapshot service/image-store expansion. Tests must use actual controller/store/ingestion seams, with factory evidence distinguished from mounted lifecycle. All183 checklist items remain open at dispatch; no handoff implementation claimed yet.

Rev0.57: wave05 source review confirms both old-owner disposal and successor pending-intent reacquisition are needed; historicalSWEEP023 is absent from41222c5. Lead approves the Values ingestion disposal test amendment and accepts requested-versus-settled direction, but192 and test-only182 execute first. No183 production permission yet; requested timestamp is not exact decoded PTS and renderer settlement is not native immutable ownership.

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
