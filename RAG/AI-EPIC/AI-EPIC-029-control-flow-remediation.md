---
node_id: AI-EPIC-029
tags:
  - EPIC
  - AI
  - defects
  - reliability
date_created: 2026-09-04
date_completed:
kanban_status: in-progress
AI_IMP_spawned:
  - AI-IMP-179
  - AI-IMP-180
  - AI-IMP-181
  - AI-IMP-182
  - AI-IMP-183
  - AI-IMP-184
  - AI-IMP-185
  - AI-IMP-186
  - AI-IMP-187
  - AI-IMP-188
  - AI-IMP-189
  - AI-IMP-190
  - AI-IMP-191
  - AI-IMP-192
  - AI-IMP-193
  - AI-IMP-193-1
  - AI-IMP-193-2
  - AI-IMP-193-3
  - AI-IMP-193-4
  - AI-IMP-193-5
  - AI-IMP-194
  - AI-IMP-201
  - AI-IMP-202
---

# AI-EPIC-029-control-flow-remediation

## Problem Statement/Feature Scope

Users can receive stale/mixed results, lose a source through self-copy, or retain/delete the wrong generated artifacts. July's whole-app sweep diagnosed 22 defects and prepared a tagged stack, but none of its 33 commits is on current main. September review confirms the main defects remain and identifies incomplete source/frame/export ownership and native artifact publication in several proposed fixes. Core extraction also broke one golden-test path. This epic adopts and completes that corrective work without absorbing live playback, notebook redesign or the active performance lane.

## Proposed Solution(s)

### Current steering — 2026-09-18, PROJECT-RECORD rev0.97

**Rev0.97:** Owner explicitly authorizes assistant launch of one isolated193-4 session under imp-193-4-visible-owner-session-01-launch.md /L1..L4. Frozen independent0e6237f7 reverified on macOS27.0/26A428; reserved run output absent. Owner hands-on cases and verdict remain open; no automatic retry, source/build or production/193-5 change.

**Rev0.96:**193-4 preparation accepted under P16..P18 after independent62-test/all-gate reproduction and15-file R3 freeze in WATeWJ. No further implementation assigned. Await owner readiness and separate exact-binary one-session launch gate for manual hands-on testing; no automatic launch, production change or193-5 authority. Two preparation/plan items checked, three runtime/owner items open.

**Rev0.95:**193-4 preparation R2 AMEND under193-4-P13..P15;55 tests/all preparation gates independently pass, but current-candidate receipts are blocked by session admission and snapshots retain locks across main-thread dispatch. Narrow R3 to four existing files plus report/ticket evidence, including one duplicate-terminal fixture correction. Original R2 frozen in Z5s0Og. No launch, owner reapproval or production change;193-5 backlog.

**Rev0.94:**193-4 preparation R1 AMEND under193-4-P7..P12. Lead reproduced43 tests/all preparation gates but five additional expectations fail; source review found related lifecycle/supervision/native sampling gaps. Correct only eight existing isolated files and resubmit round02. Source/binaries preserved; no launch or production change, no repeated owner contract decision.193-5 backlog.

**Rev0.93:**193-4 plan accepted under193-4-P1..P6. Isolated15-file preparation assigned in a fresh root; no visible launch or production change. Owner interaction and independent preparation acceptance remain ahead;193-5 backlog.

**Rev0.92:** owner approved the restart contract.193-4 is in progress for its bounded visible-test plan only under193-4-D1; source preparation and launch remain separate gates.193-3 stays completed and193-5 backlog. No production behavior changed.

**Rev0.91:**193-3 is complete as a reviewed source decision under193-3-D1..D5. Constrained-go recommendation awaits owner approval of trusted packaged-local, one-document-per-unique-child and fail-stop replacement behavior.193-4 remains planned/unassigned;193-5 backlog. No further research loop or production change is authorized.

**2026-09-08 / rev0.90:** owner approved this sprint. Sol is assigned only193-3's focused source-decision brief.193-4 remains conditional on the resulting ruling and separately reviewed visible-test preparation/run;193-5 stays backlog. Dispatch is not completion or production adoption.

This remains the active umbrella epic. The owner reaffirmed epic -> explicitly scoped IMP tickets -> Sol's atomic per-ticket implementation commits -> independent Review Lead acceptance and merge. Review reports retain the reasoning, but they do not replace a named delivery ticket. No new sprint is dispatched by this planning update.

The accepted candidate is now6e12a73, including the native metadata kernel; that is candidate-local acceptance, not main integration. The separate retained-window experiment passed one hidden macOS run after44 pure tests. Its source/artifacts are external experimental evidence, not a merged product implementation. The earlier chronological updates below remain history.

**Proposed next sprint: safe interface restart, ready for an owner test.** IMP-193-3 produces one focused startup-authority go/no-go decision; if the direction remains viable, IMP-193-4 produces a separately authorized visible interaction test and owner verdict. End the sprint with a supported adoption decision, including an honest no-go if necessary, rather than expanding into unbounded harness work. Production adapter IMP-193-5 remains conditional backlog; existing IMP-184/185/186 retain their export/publication/cleanup ownership.

| Unit | Status / delivery receipt |
| --- | --- |
| [IMP-193-1: native ownership kernel](../AI-IMP/AI-IMP-193-1-native-ownership-kernel.md) | Completed bounded candidate slice; original6e12a73 commit retained under its original IMP-193 identity. |
| [IMP-193-2: retained-window feasibility](../AI-IMP/AI-IMP-193-2-retained-window-feasibility-evidence.md) | Completed bounded experiment; original hashes/review/run evidence, no invented product commit. |
| [IMP-193-3: startup authority decision](../AI-IMP/AI-IMP-193-3-renderer-startup-authority-decision.md) | Completed source decision; proposed contract awaits owner, not product acceptance. |
| [IMP-193-4: visible replacement acceptance](../AI-IMP/AI-IMP-193-4-visible-interface-replacement-acceptance.md) | In progress, preparation accepted; owner readiness, separate launch and visible/owner acceptance remain. |
| [IMP-193-5: production session adapter](../AI-IMP/AI-IMP-193-5-production-session-adapter.md) | Backlog; capability, owner/adoption approval and exact source fence required. |

Completed child tickets do not close aggregate IMP-193 or epic requirements. Preserve implementation, validation, review, main merge, runtime acceptance and owner acceptance as separate facts. When dispatched, Sol owns the approved sprint ticket range within this epic, not every backlog item.

### Historical steering updates

Rev 0.18: profiling design accepted with binding P1–P8. IMP-202 is in-progress for A0 isolated optimized build/symbol preparation only; no app launch, source instrumentation or IMP-178 integration. Exact-case quiet measurements and whole-app attribution remain separate gates. See profiling-a0-build-brief.md and PROJECT-RECORD §10.5.

Rev 0.17 profiling priority: owner manual import works; slow debug observations motivate a durable real-app measurement workflow, not a classified regression. IMP-202 owns the next bounded review, governed by PROJECT-RECORD §10. Optimization, IMP-178 integration, live playback and redesign remain separate.

2026-09-05 current status: waves 01/02 are locally accepted as four issue commits through cf4c344, not merged/released. IMP-179 has local implementation evidence; IMP-180 has SWEEP-004/009/011 only. The owner authorized a fresh build and runtime inspection; IMP-201 covers its bounded packaging prerequisite. All earlier review-only statements below are historical. See PROJECT-RECORD rev 0.12 and the numbered wave verdicts.

Later 2026-09-05 update: IMP-201 is locally accepted at 58880e0, fifth issue commit. Locked macOS packaging and a bounded native two-image/Values/composite-export smoke passed; see fresh-build-runtime-acceptance.md and PROJECT-RECORD rev 0.14. No full runtime, owner, platform, release or main-integration acceptance is implied.

Continuation authorized at rev 0.15: owner approved moving ahead; SWEEP-003/008 are assigned to Sol under correctness-wave-03-implementation-brief.md on the same clean candidate. Five source files only, no native/build/design work. Remaining IMP-182/183 identity/handoff defects stay separately planned. Assignment delivery is not implementation or acceptance.

Rev 0.16: Wave 03 now locally accepted at 4893477/8bf3187; seven issue commits in the clean candidate. Separate new bundle launches; actual video smoke remains incomplete after a picker/capture blocker, not a confirmed app failure. See correctness-wave-03-verdict.md. No next wave dispatched or aggregate acceptance claimed.

Round 02 disposition: [design basis accepted with binding clarifications](../reviews/EPIC-029/round-02-verdict.md). No third general review is requested. Cache policy/parameters and a bounded coding assignment remain separate decisions. Original reviews and earlier base observations below remain dated history, not current execution claims.

Round 01 update: live main/origin main are `5baa20e` (divergence from sweep **4 / 33**); `2cc2000` remains the historical review/planning base. The [AMEND verdict](../reviews/EPIC-029/round-01-verdict.md) requests a focused Round 02 protocol addendum. No coding assignment is authorized. IMP-179 reuses the already prepared fixture repair once, with provenance, without waiting for all performance work.

Give every analysis, frame, export and generated file an explicit source and lifetime. A later selection cannot be overwritten by older work; a multi-part export describes one input; returned files stay complete until their last consumer releases them. Preserve the July issue-granular stack while adapting to the newer Tauri-free core.

The [project record](../PROJECT-RECORD.md) governs decisions. The [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md) maps all 22 original defects, seven helper families, and 12 current review entries (including the main gate regression and optional snapshot-name issue). These are overlapping acceptance boundaries, not 34 independent shipping defects. [The source manifest](../reviews/EPIC-029/sweep-adoption-manifest.md) retains exact SHAs and file scope.

This task remains Review Lead. The owner supplied the existing Code Lead task; the [first brief](../reviews/EPIC-029/round-01-brief.md) was dispatched on 2026-09-04 for review only. Implementation and subagent coding require a subsequent verdict and assignment.

## Path(s) Not Taken

- Blind merge of the old sweep: conflicts and core-path changes require semantic adaptation.
- Restarting the entire audit or bundling 32 issue commits into one opaque fix.
- Full Home/Values controller unification (deferred IMP-124), EPIC-026 live video or EPIC-027 visual redesign.
- Taking over IMP-178 color-math performance. Coordinate its eventual accepted core base.
- Choosing an arbitrary cache eviction policy or broad native cancellation scheme before the ownership design is reviewed.
- Making optional chart/palette refactors a prerequisite for the correctness release.

## Success Metrics

- By the end of candidate preparation, all 32 implementation patches and the historical-register commit have explicit source-to-candidate provenance, with no silently omitted SWEEP identity.
- Before the required remediation candidate is accepted, all 22 original defects and every required September residual have a current-code disposition and permanent regression or explicitly approved invariant evidence.
- At the first gate-repair submission, the canonical golden test and full renderer suite pass without duplicating or changing the fixture.
- At the final acceptance checkpoint, renderer/native gates have zero unexpected failures, core remains Tauri-free, and platform gaps are explicit. No calendar delivery date is asserted before the code-lead estimate and owner scheduling decision.

## Requirements

### Functional Requirements

- [ ] FR-1: Restore the main golden-test fixture path (IMP-179).
- [ ] FR-2: Adopt reviewed SWEEP changes with core-compatible boundaries and atomic issue provenance (IMP-180).
- [ ] FR-3: Same-path replacement, cache restoration and newer selection revoke stale completion authority (IMP-181/182/192).
- [ ] FR-4: Cross-view handoff reacquires pending frames and preserves honest snapshot timestamps (IMP-183).
- [ ] FR-5: Exports capture one source, settings and name for the entire job (IMP-184).
- [ ] FR-6: Native admission/release coordinates workers, cached references and removal (IMP-193).
- [ ] FR-7: Values publishes complete immutable artifacts from one owned source snapshot (IMP-185).
- [ ] FR-8: Batch releases unique generations and recovers abandoned files at startup (IMP-186).
- [ ] FR-9: k-means refines material reseeds but terminates unchanged degenerate clusters (IMP-187).
- [ ] FR-10: Queued scroll work cannot mutate a successor viewport (IMP-188).
- [ ] FR-11: Integrated code and project records pass independent acceptance (IMP-191).
- [ ] Optional FR-12: Unify chart adapters and palette-save plumbing with deterministic output (IMP-189/190).
- [ ] Optional FR-13: Preserve dotted snapshot source labels and timestamps in export names (IMP-194).

### Non-Functional Requirements

- Offline-only runtime; local assets, no telemetry, no production secrets.
- Preserve Svelte5 runes, token-owned stores, deterministic exports, approved numeric fixtures and scalar/SIMD contracts.
- No revived native copies of color-core modules and no Tauri dependency in color-core.
- Regression and fix travel together; preserve SWEEP and AI-IMP identities. This draft does not grant delegated agents commit permission.
- Current rev0.89 workflow: after explicit assignment in an isolated candidate, Sol as Code Lead returns one cohesive implementation commit per IMP with regression, gates and rationale. His subagents still leave changes for his integration unless specifically authorized. Review Lead alone accepts and merges. Prior lead-authored commits and uncommitted external experiments keep their real provenance; no history rewriting or fictitious commits.
- Every assignment has file fences; overlapping writers are serialized. A completed code-lead self-review is a submission, not Review Lead acceptance.
- Windows packaging/Linux CI are release gates; macOS success is not cross-platform proof.
- Existing AUD-020 warnings remain explicit; no new expected-failure masking.

## Implementation Breakdown

Current next-sprint decomposition is the five-row map above and IMP-193's child table. IMP-193 remains the aggregate ownership acceptance ticket, not one giant implementation commit. The bands and original count below describe the initial September04 cut; they are not a current work assignment or completion summary.

The following are proposed dependency bands, not simultaneously writable assignments. Round 01 amended the identity ordering and shared-file fences. Code Lead returns a focused Round 02 addendum before the lead issues a coding assignment. At most two later implementation writers may run, only on explicitly disjoint files.

| Band                      | Tickets                                      | Exit / coordination                                                                                                                           |
| ------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Review                    | IMP-193 protocol proposal; all ticket fences | Numbered verdict before implementation; decide admission/release and pressure behavior                                                        |
| Baseline                  | IMP-179                                      | Golden fixture and full renderer test gate repaired                                                                                           |
| Adoption                  | IMP-180                                      | Coordinate IMP-178 core base before k-means adoption; retain SWEEP provenance and open residuals                                              |
| Selection / frame lane    | IMP-181 → IMP-192 → IMP-182 → IMP-183        | Serialize shared stores, view wiring and controllers                                                                                          |
| Native ownership lane     | IMP-193 → IMP-185 → IMP-186                  | Design first; serialize frontend hooks with selection lane; IMP-186 also requires IMP-184 export leases                                       |
| Export correctness lane   | IMP-184                                      | After 183 and admitted 193 ownership contract; coordinate leases without a second registry                                                    |
| Independent focused fixes | IMP-187, IMP-188                             | 187 uses the coordinated math base with the adapted RT-07 patch; 188 is isolated. Neither requires all residual adoption to be accepted first |
| Optional polish           | IMP-189 →190; IMP-194                        | All touch export runners: serialize, and do not make required acceptance wait for optional work                                               |
| Acceptance                | IMP-191                                      | Independent current-tip gates, issue/commit/test map, truthful platform status                                                                |

Historical initial cut: all16 tickets were newly planned/backlog at creation. That is superseded by the current status map and generated index, not a claim that accepted work is unimplemented. IMP-178 remains in the separate performance lane. The original planning pass did not implement production code.
