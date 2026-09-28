---
node_id: AI-IMP-193
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: in-progress
depends_on:
  - AI-IMP-179
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.75
date_created: 2026-09-04
date_completed:
---

# AI-IMP-193-native-artifact-admission-and-release-ownership

## Coordinate native workers, artifact owners and removal

Frontend token rejection does not revoke native queued work; cleanup can delete live output or be followed by artifact resurrection. Cached video refs are dropped without release. Success is an agreed and tested ownership protocol that prevents both failure modes.

Trace: **SEP-11 / RT-04**; priority **P3 design-first**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Unapproved cache-pressure policy, native process cancellation as a blanket guarantee, telemetry or runtime network.

### Design/Approach

Rev0.89: this ticket is now explicitly the aggregate ownership acceptance umbrella inside EPIC-029. Delivery units use the reserved child IDs below; no aggregate checkbox closes just because a child experiment/kernel is completed. The owner reaffirmed ticket-scoped atomic Code Lead commits and Review Lead review/merge. Current sprint proposal is193-3 then conditionally193-4; no assignment or runtime is issued here.

| Child | Bounded responsibility | State |
| --- | --- | --- |
| [193-1](AI-IMP-193-1-native-ownership-kernel.md) | Former193-A native metadata kernel, original6e12a73 provenance | Completed candidate slice |
| [193-2](AI-IMP-193-2-retained-window-feasibility-evidence.md) | Isolated retained-window feasibility and preserved evidence | Completed experiment |
| [193-3](AI-IMP-193-3-renderer-startup-authority-decision.md) | Focused startup-authority decision, including a valid no-go outcome | Completed research; contract awaits owner |
| [193-4](AI-IMP-193-4-visible-interface-replacement-acceptance.md) | Separately authorized visible replacement and owner acceptance | In progress, preparation accepted; owner session next |
| [193-5](AI-IMP-193-5-production-session-adapter.md) | Future193-B production session adapter | Backlog |

This is a provenance backfill and forward planning cut, not retroactive commit rewriting. Source/consumer/IO acceptance outside these children still belongs to193 and existing184/185/186; cut further delivery tickets before assigning those seams. Historical broad Files-to-Touch below is an inventory, never permission to implement the whole ticket.

Rev0.71: owner selects retention-only R, accepting active-session growth and cleanup only when unused, including safe flush; no new hard quota. This supersedes historical pressure holds below, not C1–C3. First implementation authority is only slice193-A in correctness-wave-07-phase-193a-brief.md on a0d9dd0; native group/lease/reclamation metadata kernel plus tests, no filesystem/session/IPC/renderer hookup. PROJECT-RECORD §12 / numbered scope amendment193-01 governs current versus future allowances. No aggregate lifecycle item is implemented or accepted yet.

Source prerequisites: the assigned candidate must contain reviewed SWEEP-019/021/022/027/029/030 artifact, IPC and worker changes, with the concrete supporting frontend cleanup subset identified in its implementation brief. Aggregate IMP-180 completion is not a global prerequisite. Native-only preparation may overlap disjoint identity work, but renderer/store/session integration waits for IMP-183.

Round 02 design basis is accepted, with C1–C3 binding: native document-lifetime ordering rejects obsolete bootstrap; operation admission/recovery/cancellation is idempotent by session/request nonce even when native IDs were lost; source capabilities cannot falsely imply equal input bytes. Pressure option/limits and coding authorization remain pending. No new general protocol review is requested.

Round 01 AMEND: registry direction is approved for refinement, not coding. Resolve async acquisition/ACK, renderer reload versus backend restart, source revocation during retained exports, and session/revision identity. Preserve existing snapshot/clipboard retention. Pressure policy and exact budget accounting remain pending. See verdict Amendments 3–6.

Round 01 must propose the smallest admission/lease/release model, including source identity, queued/running jobs, displayed results, pins, exports, session-cache refs and restart recovery. Lead approval is required before mechanism implementation. Prefer explicit ownership transfer over arbitrary timeouts. Source removal revokes future admission and defers deletion until last owner leaves; a stale native completion must release its unadmitted outputs. Decide pressure behavior explicitly; no blind deletion of owned paths.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `tauri-app/src-tauri/src/artifact_ownership.rs (new)`
- `tauri-app/src-tauri/src/commands.rs`
- `tauri-app/src-tauri/src/commands_types.rs`
- `tauri-app/src-tauri/src/lib.rs`
- `tauri-app/src-tauri/src/main.rs`
- `tauri-app/src-tauri/src/cache.rs`
- `tauri-app/src-tauri/src/ffmpeg.rs`
- `tauri-app/src-tauri/src/value_analysis.rs (ownership hooks only; publication IMP-185)`
- `tauri-app/src-tauri/src/compose_grid.rs (ownership hooks only; lifecycle IMP-186)`
- `tauri-app/src-tauri/tests/audit_artifact_ownership.rs (new)`
- `tauri-app/src/lib/bridges/fs.ts`
- `tauri-app/src/lib/bridges/value-analysis.ts`
- `tauri-app/src/lib/bridges/compute.ts`
- `tauri-app/src/lib/bridges/video.ts`
- `tauri-app/src/lib/bridges/compose.ts`
- `tauri-app/src/lib/services/artifact-cleanup.ts`
- `tauri-app/src/lib/stores/image.ts`
- `tauri-app/src/lib/stores/video.ts`
- `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts`
- `tauri-app/src/lib/views/exports/export-job.ts (if admitted; coordinate IMP-184)`
- This ticket's checklist and Issues Encountered section.
- `tauri-app/src/lib/bridges/ipc-contracts.ts`
- `tauri-app/src/lib/bridges/ipc-contracts.spec.ts`
- `tauri-app/src/lib/bridges/artifact-ownership.ts` (new)
- `tauri-app/src/lib/bridges/artifact-ownership.spec.ts` (new)
- `tauri-app/src/main.ts` (client-session bootstrap only)
- `tauri-app/src/App.svelte` (client-session lifecycle and managed clipboard hookup only)
- `tauri-app/src/lib/services/frame-snapshot.ts` (managed snapshot ownership hookup only)

Numbered lead scope amendment193-01 (rev0.71) adds these exact paths to the overall ticket fence. Only the two optional native submodules below are inside current193-A; all frontend additions await a later explicit assignment:

- `tauri-app/src-tauri/src/artifact_ownership/types.rs` (new, optional)
- `tauri-app/src-tauri/src/artifact_ownership/tests.rs` (new, optional)
- `tauri-app/src/lib/services/clipboard-ingestion.ts`
- `tauri-app/src/lib/services/clipboard-ingestion.spec.ts`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`
- `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-resource-integrity.spec.ts`
- `tauri-app/src/lib/views/home/VideoPanel.svelte` (existing snapshot capability call only)
- `tauri-app/src/lib/views/ValuesView.svelte` (existing snapshot capability call only)
- `tauri-app/src/lib/services/frame-snapshot.spec.ts` (new)

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Obtain numbered lead verdict on the protocol and exact file changes before implementation.
- [ ] Queue worker A, remove its source before it runs, then release queue: no persistent artifact resurrection.
- [ ] Remove during active publication/read; owned output stays complete until final release, then is reclaimed.
- [ ] Remove/clear video with cached frame/poster/strip refs and verify eviction plus exactly-once last-owner cleanup.
- [ ] Verify user source paths cannot enter managed-file deletion and stale completion cannot acquire a new owner.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** removal racing a queued/running native job, **WHEN** ownership is revoked, **THEN** the job cannot publish a new live artifact and cleanup cannot delete bytes still owned by another accepted consumer.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

2026-09-18 /rev0.97: owner authorizes one assistant launch of the frozen193-4 visible artifact under193-4-L1..L4. This is isolated runtime scope, not owner acceptance or production193-5 authority. Source/candidate/main remain unchanged.

Rev0.96 /2026-09-08:193-4 preparation accepted underP16..P18 after exact15-file R3 review/freeze and independent62-test/full-gate pass. No further source work assigned; owner readiness and separate launch gate precede the manual session. All aggregate ownership checkboxes remain unchanged; three child runtime/owner items open. Candidate/main, native kernel/R and193-5 scope unchanged.

Rev0.95 /2026-09-08:193-4 R2 AMEND despite independent55-test/all-gate pass. Current candidate receipt ordering, snapshot guard lifetime and one fixture need P13..P15 four-file correction. All15 R2 sources/both binaries frozen in Z5s0Og; no native runtime, candidate/main change, aggregate acceptance or193-5 authority. Four child acceptance gates remain open.

Rev0.94 /2026-09-08:193-4 preparation R1 AMEND; independent43-test/gate reproduction plus five failing lead expectations and source integration findings.193-4-P7..P12 authorizes eight-file isolated correction only, fresh round02 report. Original source/binaries frozen; no visible runtime, aggregate ownership acceptance, candidate/main change or193-5 authority. No new owner contract decision.

Rev0.93 /2026-09-08:193-4 plan accepted; fifteen-file isolated preparation assigned under193-4-P1..P6 with no launch/candidate/production authority. Fresh-root reservation and source platform findings are not new runtime evidence. All aggregate ownership checkboxes unchanged.

Rev0.92 /2026-09-08: owner accepts trusted-local/unique-child/fail-stop restart contract.193-4 begins bounded report-only planning under193-4-D1;193-5 stays backlog. No aggregate checkbox, source, build, runtime or production acceptance follows.

Rev0.91 /2026-09-08:193-3 report3cd4b452 accepted under193-3-D1..D5 as conditional source-decision evidence, not production authority. Proposed trusted-local/single-document/fail-stop child replacement contract awaits owner choice.193-4 remains planned/unassigned;193-5 backlog. Process-replacement detection, startup liveness and production recovery remain unestablished. Native kernel/R policy and all aggregate checkboxes unchanged.

Rev0.90 /2026-09-08: owner approved proceeding; Sol assigned only193-3 under its exact source-decision brief.193-4 remains conditional,193-5 backlog. No production source, runtime, commit or aggregate checklist acceptance.

Rev0.89: owner requested clearer epic/IMP/atomic-commit provenance. EPIC-029 existed but its top-level summary lagged, and193 had accumulated kernel, experiments and future integration. Added193-1..5 and refreshed the epic. Completed children preserve actual prior receipts; forward sprint is proposed only. No code, new runtime, commit or merge occurred in this planning update.

Rev0.88: one retained-window run accepted as finite hidden evidence: actual exit0,198 rowsce6daf15,6cases/43receipts, seven children/one parent, exact target resize, native/session owners preserved. No initial about:blank observed or universal identity/visible-UX proof. No rerun/source/production/193-B assigned; all original evidence preserved. Lead audit selector correction affected only read-only audit tooling, not runtime or ledger.

Rev0.87: Round03d5b9f06d/all14 matched; lead reproduced44 pure tests/all locked gates and accepted H25 native-scoped receipt/Finished guard. Source/submittede1ed/leadcbad33 preserved separately. Only one Review Lead hidden run is now authorized under C1-RW-RUN-01; no runtime result yet, retry/source/production/193-B or checklist closure.

Rev0.86: Round02 preparation78096871/all14 hashes reviewed;35 pure tests and locked offline gates independently pass. H21/H23 and bounded H24 size/identity accepted at preparation level. H25 narrowly completes H22 because renderer receipts and wrong Finished observations only log contradictions; three existing files assigned, no runtime. Frozen Round02 source/submitted98e0/lead683366 preserved; candidate clean6e12a73. Initial-binding/production/visible-UX gates unchanged.

Rev0.85: preparationedcb8286 reviewed;20 pure tests/all offline gates independently pass, but two extra actual-library probes fail on observed about:blank activation and snapshot blindness to retirement. Source reveals unreachable post-App::run result check, weak receipt joins/missing stale-A release and vacuous old resize acceptance. H21-H24 five-file correction assigned, no launch. Frozen14/submitteda7e0/lead3f1f and all prior evidence preserved; candidate clean6e12a73, initial-binding/production gates unchanged.

Rev0.84: Round01 final1b58945c accepted for14-path standalone preparation under H17..H20, no launch. Native parent identity supported; no public child-destruction event. Exact-original/owner-specific registry controls and H14 late-callback/finalizer ordering remain mandatory; report's terminal-before-exit shorthand corrected. Candidate clean6e12a73; no production or initial-binding acceptance.

Rev0.83: owner approves isolated tauri/unstable retained-window exploration after document-restart clarification. Fresh PEEpxt root reserved; only bounded report-only Round01 assigned before preparation/runtime review gates. No candidate feature/source or production change. H16 exact-original recovery, initial-document premise and independent native owners remain binding; hidden mechanics cannot close visible UX acceptance.

Rev0.82: public retained-window child-WebView APIs require unenabled tauri/unstable; current stable recovery replaces the OS window. Lead verified source and recommends only an isolated feature-gated spike, pending owner direction. No source/feature/runtime action assigned. Initial-document binding stays open; report's terminal-after-activation retry rule rejected in favor of existing H7/C2 idempotent recovery obligation. Native owners/R unchanged.

Rev0.81: source closeout accepted with narrower pre-activation counterexample requiring absent renderer-side session; known retired-session requests reject. Wry first-commit queue explains initial callback omission. Current renewing eval adapter remains unaccepted; only read-only nonrenewable WebView/public-API feasibility is assigned, with initial-navigation and any owner-visible window consequences explicit. No implementation or additional runtime test.

Rev0.80: C1-RUN-02 finite macOS run accepted:482-row0ef15c19 ledger,7 ordered completions, terminal success and actual exit0. Late callback interval now succeeds after H14; first run stays failed. No universal/production C1 acceptance. Three-question read-only installed-source closeout assigned for document-ordering premise, missing initial callbacks and production attachment points; no code/rerun/193-B.

Rev0.79: H14 driver-onlyfd8e8099 accepted after lead reproduced29 pure tests/all preparation gates and preserved exact source/binaries. Only Review Lead C1-RUN-02 on2a08c1c5/fresh directory is authorized. First runbf09f574 stays failed; no production/C1-C3 checklist closes.

Rev0.78: one actual isolated run reached seven case completions but exited1 before terminal success; ledgerbf09f574 preserved481 rows. Source/late-callback suffix implicates EventInbox dropping before finalizer. C1-H14 assigns driver-only regression/correction with no rerun. Negative/guarded eval and actual window replacement are partial bounded observations;0/8 timer receipts and missing ordinary async callback remain unknown, not proof. No production/C1-C3 checkbox closes.

Rev0.77: C1-H13 satisfied; driver-only12464052 and other13 unchanged files reviewed. Lead reproduced27 pure tests/all preparation gates; source and submitted0610dfc9 plus distinct lead-build3f0fc8ee preserved. Only Review Lead C1-RUN-01 is authorized on fresh run-20260907-first-reviewed; no source fix/retry/193-B. Actual runtime result pending, no C1-C3 checklist closes.

Rev0.76: Round02 mechanism corrections accepted at preparation level after lead reproduced25 pure tests and fmt/check/clippy/build; C1-H13 narrowly amends synthetic case6 Started/Finished ledger labels in driver.rs only. Source14 and independently rebuilt binary6993c0f1 preserved separately from submitted191ebde7 identity. Candidate remains clean6e12a73; no App/WebView run or C1-C3 acceptance. Fresh Round03 report required; no new owner policy question.

Rev0.75: isolated harness Round01 AMEND under C1-H7..H12. Lead reproduced12 pure tests but found authority-bearing ordinary replies, mutating diagnostics, incomplete original-request duplicate recovery, missing destruction/last-window exit handling, loose event joins and terminal-ledger false-success paths. Original source/binary preserved; only six existing harness files may change. Candidate6e12a73 remains clean; no runtime launched, C1–C3/production acceptance unchanged. Correct next report's truncated lib hash; temporary compile-only production-icon override remains an acknowledged historical fence deviation.

Rev0.73: C1 source report559ee81e accepted with C1-H1..H5. Public locked callbacks/IPC/eval lack correlated document identity; challenge mechanism remains conditional, not impossible/proven. Only standalone macOS harness preparation in reserved external artifact directory is assigned, no candidate source or launch. Lead must inspect isolation and compiled artifact before runtime. Windows/Linux and all C1–C3/IO/consumer acceptance remain open; retention-only R unchanged.

Rev0.72:193-A kernel accepted locally6e12a73 after lead matched all five hashes/read full logic and reproduced473renderer/105native/Node88/event10/scalar1/static gates. No aggregate lifecycle checkbox closes. Future IO cannot report partial deletion as Failed/restored complete data; finer class policies and session tombstone lifetime remain open. Next assignment is focused C1 locked-runtime seam inspection only; no193-B source authority or new general protocol review. R policy stays selected.

Rev0.71: owner explicitly accepts session accumulation and safe unused/flush cleanup. Earlier pending F/O/numbers gate is superseded by retention-only R; no proactive admission bound selected. Lead amendment193-01 records current topology.193-A now assigned at clean a0d9dd0 with five-path maximum; in-memory kernel only, no production deletion or C1–C3 acceptance. Full ticket remains open and every implementation checklist unchecked. Later filesystem/lifetime/producer/consumer slices require separate assignments.

Rev0.70: all six prerequisites022/019/021/027/029/030 locally accepted througha0d9dd0; see correctness-wave-06-verdict.md. No193 source/protocol/checklist implementation accepted or assigned. Owner-pending capacity behavior and numeric budgets now gate the next native phase; lead's numbered current-topology amendment remains required. Logical-ID digest is not C3 contents or ownership. Code Lead stopped without polling; no third general protocol review.

Rev0.69:022/019/021/027/029 locally accepted throughf1a30d1;030 alone follows under180. Worker placement preserves profiling but does not provide bounded admission or cancellation. Canonical logical ID naming will not establish C3 contents or producer identity when callers use different IDs. Numbered topology amendment and owner pressure limits remain pending; no193 implementation/checklist closure.

Rev0.68:022/019/021/027 locally accepted through3d35787;029 alone follows under180. Renderer validation is not native ownership or serialization parity. Worker placement preserves profiling but adds no cancellation/admission bound.030, numbered topology amendment and owner pressure limits remain pending; no193 implementation/checklist closure.

Rev0.67:022/019/021 locally accepted throughcaf8225;027 alone follows under180. Metadata-based Values directories do not satisfy C3 immutable input identity; no193 implementation/checklist closure.029/030, topology amendment and owner pressure limits remain pending.

Rev0.66: source prerequisites022 at5d22118 and019 at575868c locally accepted; only021 now assigned under180. No193 implementation/checklist acceptance. Unique grid outputs do not establish leases/retirement/bounded growth; pressure and later numbered topology amendment remain pending.

Rev0.65: first source prerequisite022 is locally accepted at5d22118;019 alone follows under180. No193 source/protocol/checklist implementation accepted; remaining prerequisites, numbered topology amendment and owner pressure limits remain pending. Blind session pruning removal is not owner-aware cleanup or bounded growth.

Rev0.63: native delta ad71a8ec accepted as bounded source/adoption basis; all six source prerequisites absent. Only022 is now assigned under180 with five native/source-test paths. Post183 clipboard/controller/scrubber/handoff/snapshot193 additions are accepted future fence requirements, not current file-edit authority; a numbered193 scope amendment must enumerate them when coding is released. Pressure behavior and numeric admission limits remain owner-pending; no193 implementation or checklist accepted. See correctness-wave-06-delta-verdict-and-022-brief.md.

Rev0.62: renderer wave05 accepted locally933d888; correctness-wave-05-verdict.md assigns read-only native delta review only. Preserve existing accepted Round02 C1–C3; inspect exact019/021/022/027/029/030 prerequisites and current writer/release topology, including moved clipboard logic. Pressure and implementation authority remain pending. No193 checklist implementation accepted.

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. Protocol choice is intentionally review-gated.
