---
node_id: AI-IMP-193-4
tags:
  - IMP-LIST
  - Implementation
  - ownership
kanban_status: in-progress
depends_on:
  - AI-IMP-193-3
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.75
date_created: 2026-09-07
date_completed:
---

# AI-IMP-193-4-visible-interface-replacement-acceptance

## Validate visible interface replacement with the owner

Second proposed next-sprint ticket, conditional on a suitable193-3 ruling. Establish whether replacing an interface child while retaining its native window is acceptable to use: focus, typing/shortcuts, resize, closure and relevant Spaces/fullscreen behavior. This is a small isolated interaction test, not a redesign or production migration. The owner supplies the final feel verdict.

2026-09-08 / rev0.92: owner approved the restart contract. Assigned report-only under [193-4-D1 and the bounded brief](../reviews/EPIC-029/imp-193-4-visible-replacement-brief.md). No preparation, build or launch authority; all acceptance items remain unchecked.

### Out of Scope

Silent production feature enablement, styling redesign, performance optimization, full ownership integration or claims that visible smoothness proves initial-frame authority.

### Design/Approach

Code Lead first submits a bounded visible-test plan. Review Lead reserves a separate namespace and exact source/file/binary/run fences before any changes or launch. Preserve the completed hidden artifacts unchanged. Rehearse positive and recovery paths with a small editable interface; record focus/selection and application-control effects plus the owner's observations. An unacceptable result is a valid outcome and blocks adoption.

### Files to Touch

Current rev0.97: owner authorizes one Review Lead launch under [193-4-L1..L4](../reviews/EPIC-029/imp-193-4-visible-owner-session-01-launch.md); only fresh runtime evidence and planning records may change. Earlier no-launch wording below is historical. Frozen source/binaries and candidate/main remain unchanged.

Current rev0.96: preparation accepted under [193-4-P16..P18](../reviews/EPIC-029/imp-193-4-visible-preparation-round-03-verdict.md); no further Code Lead writes or implementation assigned. Preserve all15 P8xk8N sources, R1/R2/R3 freezes/reports/binaries/probes and candidate/main. Lead selected independent R3 binary0e6237f7 for the later exact owner-session launch gate. No App/Window/WebView/--run or run output yet; accepted plan specifies owner-initiated manual launch after readiness and a separate run record. Owner verdict remains a later Review Lead record in RAG/reviews/EPIC-029/imp-193-4-owner-acceptance.md; no app source scope.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Receive the193-3 ruling and a bounded visible-test preparation/run plan.
- [x] Reserve and review an isolated artifact without changing frozen hidden-run evidence.
- [ ] Validate focus/typing/shortcuts, window size/position and recovery behavior with an explicit scenario matrix.
- [ ] Record relevant Spaces/fullscreen/close behavior as tested, failed or explicitly untested.
- [ ] Obtain the owner's explicit acceptable/unacceptable verdict; no agent checks this from screenshots alone.

### Acceptance Criteria

**GIVEN** an explicitly approved visible artifact, **WHEN** the owner uses it through the agreed scenarios, **THEN** the record states what was observed and whether adoption is acceptable. A hidden test or compile cannot satisfy this ticket.

### Issues Encountered

2026-09-18 launch receipt: scoped binary launched once, tool session86478/PID62026. Initial19-row ledger includes actual child admission, parent show and visible/frame receipts; controls open and no failure/terminal/dispositions at inspection. Desktop inventory omits this bare executable, so no screenshot/owner feel is claimed and no duplicate launch attempted. Exit and owner cases remain pending; see launch record.

2026-09-18 /rev0.97: owner explicitly requests launch. Exact R3 lead binary0e6237f7 and clean candidate/main reverified; reserved run output absent, no test instance. Host is now macOS27.0/26A428 arm64. One-session launch gate records30minute/20second bounds and preserves owner-only dispositions. No runtime/owner checkbox is checked from startup.

2026-09-08 /rev0.96 lead acceptance: reportf60891e4 accepted as preparation only. All15 hashes/fence matched:3changed/12unchanged against R2; complete3-file delta reviewed. R3 frozen in WATeWJ/source with submitted08e5a757 and independent0e6237f7 binaries; independent62 tests (59lib+3bin,0failed/ignored/doc0), Node syntax/actual validator/projection, fmt/check/strict all-target Clippy/build and non-runtime CLI paths all passed. Seven actual adapter/sampling helper regressions resolve P13/P14; unchanged lead fixture probe against R3 now observes2actual terminals and passes P15. No App/IPC/native hang/owner behavior executed. Second preparation item checked only after review/freeze; three runtime/owner items remain open. Node20, actual loss detection, native event scheduling, visible focus/paint/Spaces and owner feel remain unproven. No further implementation assigned; await owner readiness and separate manual launch gate. Candidate/main and all earlier evidence unchanged.

2026-09-08 / rev0.95 preparation round 03: corrected only 193-4-P13..P15 in the isolated P8xk8N artifact and submitted `RAG/reviews/EPIC-029/imp-193-4-visible-preparation-round-03.md` SHA256 `f60891e4943a5af4bd8cd29fb47a76e187f1193e23524e631d0da45440c6e08e`. Exactly `README.md`, `audit-visible-run.cjs` and `src/driver.rs` changed against frozen R2; the other twelve authored files remain byte-identical. The runtime-used receipt helper now admits authentic protocol-current initial/recovery candidate observations without granting owner controls, rejects retired A before observation, sends candidate contradictions to the exact bounded startup/recovery waiter, and preserves the admitted-current one-attempt rule. Status snapshots are owned in separate statements before the injected/native sampling seam, and the repaired duplicate-terminal fixture clones the actual terminal, resequences, and asserts exactly two terminals before validation. Final Node syntax/actual validator+projection self-test, fmt, locked/offline check, 62 Rust tests (59 library + 3 binary), strict all-target Clippy and locked/offline build passed; inspected default/help/config-only binary paths exited0 without Tauri initialization. Driver is now 2,885 lines under the fixed file fence and local Node remains v26 rather than Node20. No App/Window/WebView/`--run`, run output, visible behavior, process-loss observation, source review/freeze, owner action, production change or adoption is claimed. Four acceptance boxes remain open pending independent R3 review and a separate launch verdict.

2026-09-08 /rev0.95 lead review: reportfc8e5996 is AMEND. Fifteen hashes/boundary match; exact eight-file delta/seven unchanged; preserved R2 in fresh Z5s0Og/source with submittedbc4c0aee and independent88f7ba26 binaries. Reproduced55 Rust tests (52lib+3bin), Node syntax/actual validator/projection self-test, fmt/check/strict all-target Clippy/build and inspected non-runtime CLI paths. Four additional expectations fail: first-child and successor receipts rejected before their own admission, both MutexGuards held at the native sampling seam, and duplicate-terminal fixture actually containing only one terminal. One separate-statement lock control passes. Probes are public-library/source-expression/VM evidence, not App/IPC/native hang observations. P13..P15 assigns a four-file round03 correction; preserve prior improvements and all four unchecked acceptance items. No new owner decision, runtime or production authority.

2026-09-08 / rev0.94 preparation round 02: corrected only 193-4-P7..P12 in the eight authorized existing P8xk8N files and submitted `RAG/reviews/EPIC-029/imp-193-4-visible-preparation-round-02.md` SHA256 `fc8e599603bbcde0c222e969f590254ca7f5ad9ecb121303bf5b6cf9ac6d0cb5`. The other seven authored files remain byte-identical to lead-frozen R1. Final Node syntax/actual validator+projection self-test, fmt, locked/offline check, 55 Rust tests (52 library + 3 binary), strict all-target Clippy and locked/offline build passed; inspected default/help/config-only binary paths exited0 without Tauri initialization. Corrections cover watchdog Failed/exit1 classification, independent self-process-only fallback with partial/unsealed evidence, shared callback disposition/current contradiction recovery, bounded main-thread snapshots plus recovery geometry/coverage comparison, authoritative case-row rehydration/focus labeling, and timestamp/exit/owner-row/admission validator reconciliation. Driver grew to2,405 lines under the fixed file fence; local Node remains v26 not Node20. No App/Window/WebView/`--run`, run output, visible behavior, process-loss observation, source review/freeze, owner action, production change or adoption is claimed. Four remaining acceptance boxes stay open pending independent R2 review and a separate launch verdict.

2026-09-08 / rev0.94 lead review: report47aba2e3 is AMEND, not preparation accepted. All15 source hashes/fence independently matched and frozen under lead review pjWpcM/source, submitted binaryeb9515c3 and independent buildbccae9dd preserved. Reproduced43 passing Rust tests, fmt/check/strict Clippy/build, Node syntax/self-test and non-runtime CLI paths. Five additional pure checks fail: watchdog expiry with zero/six dispositions, Complete/exit7 acceptance, negative timestamp acceptance, and reenabling recorded case controls. Source additionally shows failure-path supervision gaps, conflicting callback/current-contradiction routing, off-main native identity sampling and missing recovery geometry comparison.193-4-P7..P12 assigns eight-file R2 correction; no runtime evidence or owner action inferred. Four remaining acceptance boxes stay open. Node20 remains unrun. Lead probes are failing review evidence, not expected-pass tests or observed native failures.

2026-09-08 / rev0.93 preparation round 01: exact fifteen-file source prepared at the lead-reserved P8xk8N root under `imp-193-4-visible-preparation-verdict.md`. Report `RAG/reviews/EPIC-029/imp-193-4-visible-preparation-round-01.md` records all source/binary hashes, selective frozen delta, lock identity-only change, generated inventory and candid residuals. Node syntax/validator self-test, fmt, locked offline check, 43 current tests, strict Clippy and locked offline build passed; default/help/config-only binary paths exited 0 without initializing Tauri. No `--run`, App, Window, WebView, run output, source-candidate/main/frozen/review-root change, installation, commit or cleanup occurred. Driver LOC is 1,966 under the fixed file fence; local Node was v26.8.1 rather than Node 20. Source review/freeze, launch, all six visible cases, actual process-loss coverage, owner feel and production adoption remain untested/unaccepted; all remaining checklist boxes stay unchecked.

2026-09-08 / rev0.93: pland9c01600 accepted under [193-4-P1..P6](../reviews/EPIC-029/imp-193-4-visible-preparation-verdict.md). Lead verified termination default/override and Wry activation facts; reserved fresh P8xk8N preparation and pjWpcM lead-review roots. Only fifteen-file isolated preparation/offline gates/report are assigned. Source/preparation review, runtime and owner feel remain unchecked. Binding details cover exact-current/stale callback isolation, duplicate attempts, nonblocking callbacks, live geometry, bounded failure access and honest shutdown/validator outcomes.

2026-09-08 / rev0.92: contract choice resolved; Sol assigned only the visible-test technical plan and ticket evidence/issues. Six owner-facing cases and strict two-path report fence are specified by Review Lead. Prior193-3 verdict and hidden experiment remain immutable. Actual process-loss detection and input/focus continuity remain unestablished; no implicit production adoption.

2026-09-08 / rev0.91:193-3 decision review complete under193-3-D1..D5. Await owner choice on trusted packaged-local, one-document-per-unique-child and fail-stop/fresh-child recovery contract. No plan assignment or source/run scope released. Approval will permit a bounded plan-only brief; preparation and launch remain separate gates.

<!--
The comments under the Issues Encountered heading must not be removed.
Record failed approaches, deviations, blockers and missing tests honestly.
-->

Current status rev0.97: preparation accepted and one assistant-initiated owner session authorized under193-4-L1..L4. Owner interaction, actual finalization and owner verdict remain pending. Historical plan-only and conditional records below remain preserved.

2026-09-08 / rev0.92 plan-only submission: `RAG/reviews/EPIC-029/imp-193-4-visible-replacement-plan.md` finds the six-case visible test technically prepareable in a fresh isolated root, with no dependency/feature increase beyond the already isolated locked `tauri/unstable` experiment. It proposes fifteen exact future files, owner-driven `met`/`failed`/`untested` dispositions, separate native/renderer/owner evidence, no renderer transient-state restoration, one-attempt serialized fresh-child recovery, exact offline preparation gates, a separately reviewed binary launch gate and one append-only run output. No checklist item is checked from this plan.

Technical correction retained for preparation review: locked runtime-wry reloads the same WebView after content-process termination unless an app handler is installed, so the isolated artifact must register the macOS termination hook and retire rather than renew. Locked Wry also activates `NSApplication` when it creates a WebView while child insertion does not itself make the child first responder. The plan therefore forbids explicit focus calls, defers background process-loss recovery until owner reactivation, and records actual focus/activation behavior rather than promising continuity. Induced actual process loss remains untested absent a separately authorized public mechanism; simulated invalidation stays labelled forced.

No source, build, test, runtime, directory, feature, dependency, binary, candidate/main, PROJECT-RECORD, epic, INDEX, other ticket, commit/ref, cleanup, new task/subagent or polling action was taken. Preparation, runtime and owner-acceptance checklist items remain unchecked and IMP-193-5 remains backlog.
