---
node_id: AI-IMP-180
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

# AI-IMP-180-adopt-reviewed-control-flow-stack

## Adapt the reviewed SWEEP stack onto current core ownership

The 32 implementation commits and historical-register commit are absent from main. Produce a review candidate with per-issue provenance, without restoring obsolete native core modules. This ticket is adoption, not closure of its residual tickets.

Trace: **Original 22 defects and seven helper families**; priority **integration**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

New features, IMP-178 performance changes, residual implementation owned by other tickets, restoring stale RAG INDEX. No wholesale checkout of source commands.rs.

### Design/Approach

Wave06 settled (PROJECT-RECORD rev0.70): six local prerequisite slices022/019/021/027/029/030 accepted througha0d9dd0 under correctness-wave-06-verdict.md. Earlier phase assignments below are historical. No further coding range is assigned; this is partial aggregate180 adoption, not closure.

Wave06 phase030 authorization (PROJECT-RECORD rev0.69): after029 acceptedf1a30d1, adapt sourcee383b881 under correctness-wave-06-phase-029-verdict-and-030-brief.md. Seven-path maximum includes rootlock/native directsha2, helper/lib, actual frame/strip builders, Values naming/removal and existing audit cache fixture. Producer-backed parity/collision/removal tests required; no migration/protocol/app authority. Lead owns commits.

Wave06 phase029 authorization (PROJECT-RECORD rev0.68): after027 accepted3d35787, adapt source489c3627 under correctness-wave-06-phase-027-verdict-and-029-brief.md. One candidate file commands.rs, including tests: awaited blocking placement for five commands, exact core/domain behavior and profiling lifecycle retained. No historical atomic-copy helper, dependencies, async FFmpeg, protocol or other prerequisite. Lead owns commits.

Wave06 phase027 authorization (PROJECT-RECORD rev0.67): after021 acceptedcaf8225, adapt source3640300 under correctness-wave-06-phase-021-verdict-and-027-brief.md, exactly video.ts/compose.ts/newipc-contracts.ts+spec. Required native field/null semantics, no coercion, positive/negative real bridge controls; no deps/native/other prerequisite. Lead owns commits.

Wave06 phase021 authorization (PROJECT-RECORD rev0.66): after019 accepted575868c, adapt only source0f15c8e in value_analysis.rs and audit_value_cache.rs under correctness-wave-06-phase-019-verdict-and-021-brief.md. Observed-generation directory isolation is not immutable-byte equality or atomic publication. No dependencies/locks/other prerequisite; lead owns commits.

Wave06 phase019 authorization (PROJECT-RECORD rev0.65): after accepted022 at5d22118, adapt only SWEEP-019 source84c8f88 under correctness-wave-06-phase-022-verdict-and-019-brief.md. compose_grid.rs plus existing tempfile promotion in nativeCargo.toml and rootCargo.lock only if needed. No src-tauri/Cargo.lock exists. Other prerequisites remain unassigned; lead owns commits.

Wave06 phase022 authorization (PROJECT-RECORD rev0.63): adapt only SWEEP-022 source dd73c6ba370de1d14d527b85bfecda1387004ce2 on clean933d888. Exact five-path fence, regression-first retention proof and full gates are in correctness-wave-06-delta-verdict-and-022-brief.md. Preserve startup retention; no quota/registry or other prerequisite coding. Lead owns commits. Future019/021/027/029/030 need new exact-base assignments.

Wave 03 authorization (PROJECT-RECORD rev 0.15): SWEEP-003 then SWEEP-008 only on 58880e0. See correctness-wave-03-implementation-brief.md for the exact five-file fence, regression strengthening and known IMP-182/183 residuals. No aggregate checklist closes, no other patches are authorized, and lead owns commits.

Wave 02 authorization (PROJECT-RECORD rev 0.9): SWEEP-009 followed by SWEEP-011 only, on the accepted local wave-01 tip 6a17da6. Use correctness-wave-02-implementation-brief.md for exact source SHAs, nine-file scope, own-key lookup and supported-format cleanup corrections. The wave-01-only statement below is historical, not blanket authorization for other patches.

Wave 01 authorization (PROJECT-RECORD rev 0.8): SWEEP-004 only, source 362b4a4a9327040682944e89ddbb8fd3d138932c, with the narrower exact file fence in correctness-wave-01-implementation-brief.md. No other source patch is authorized by this wave. Partial adoption does not complete this ticket; all aggregate checklist items remain open.

Round 01 ruling: integration floor is 5baa20e or newer explicitly reviewed main, preserving stderr diagnostics. Disjoint low-risk adoption may proceed independently of performance acceptance; shared math still requires a coordinated base. Review Lead owns historical log import and INDEX regeneration. Semantically adapt SWEEP-012 with IMP-187's correction as one RT-07 patch instead of introducing a deficient intermediate tip. See verdict Amendments 1, 2 and 8.

Use the exact-file manifest and source SHA mapping. Apply reviewed issue patches individually, resolving current color_core::analyze delegation, re-exports and native dependencies. Keep SWEEP IDs in the stack; append an AI-IMP-180 adaptation reference where appropriate. Do not claim integrated acceptance before IMP-191. Leave changes uncommitted unless a lead implementation verdict explicitly grants commit authority.

### Files to Touch

Before touching `color-core/src/kmeans.rs`, coordinate the exact accepted base with the independently owned IMP-178 performance lane. This constraint applies to adoption of SWEEP-012 here, not just its later correction in IMP-187. Do not edit or rebase that lane's worktree.

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- See RAG/reviews/EPIC-029/sweep-adoption-manifest.md for the exhaustive allowed paths.
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Do not edit sibling tickets, generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Map all 32 implementation commits and the historical document to their resulting patches; explain any omission to the lead.
- [ ] Preserve core crate isolation and run all adopted audit/regression suites.
- [ ] Test pending Batch invalidation, delayed hydration/write-failure recovery, actual artifact-producer ID parity, and source-copy alias/failure cases.
- [ ] Run full renderer/native gates and report residual red tests honestly; do not encode known defects as it.fails.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** current main plus the immutable source manifest, **WHEN** the candidate is built, **THEN** no duplicate native core modules exist, each SWEEP patch has provenance, and all acceptance gaps remain explicitly assigned until corrected.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

Rev0.71: six native prerequisites remain locally accepted througha0d9dd0. Owner selects retention-only safe cleanup; separate IMP-193-A kernel is assigned under PROJECT-RECORD §12. This does not change aggregate180 adoption status or authorize more SWEEP work; previous193 capacity hold is historical.

Rev0.70: adaptedSWEEP030 sourcee383b8812a68326fd7a0b0a7d4bbcc4edae4e59f accepted locallya0d9dd0be5441095ef12f5bf98c225aee02281d4. Exact seven-path source/manifest/test fence plusINDEX; lockedsha2 directedge only. Lead independently reproduced473renderer/92native/scalar1/Node88/event10/static with prior regressions retained. Producer/request-builder/removal proof passes; no actual FFmpeg/AppHandle/native-lifetime claim. All six wave06 prerequisites locally present, aggregate checklist still open.193 awaits owner capacity ruling/budgets and lead fence amendment.

Rev0.69: adaptedSWEEP029 source489c3627d264b67e9789f0bb25ac5d41a525f5df accepted locallyf1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55. commands.rs plusINDEX,473renderer/83native/scalar1/Node88/event10/static independently pass. Prior source/locks preserved;516-line cohesive module LOC-reviewed. Shared profiling sequence covers success/no-file/invalid-source/panic; other command routes have source/compile rather than AppHandle transport proof.030 now assigned; aggregate checklists open.

Rev0.68: adaptedSWEEP027 source3640300831162cf530e61b9cfe6f0b82edf49c23 accepted locally3d35787a5df857e095a96c31a8a5e8588b13db70. Four source/test paths plusINDEX;473renderer/80native/scalar1/Node88/event10/static independently pass. Prior native/lock hashes preserved. Known-field projection and required-null fps validated; mock transport does not prove Rust media emission.029 now assigned; aggregate checklists remain open.

Rev0.67: adaptedSWEEP021 source0f15c8e5697613586cabc6d8f1e203fa92f3615b accepted locallycaf822526af273c3dafdb44a51f7c094fb3ebeb4. Two native source/test paths plusINDEX;434renderer/80native/scalar1/Node88/event10/static independently pass. Prior019/untouched022/rootlock preserved. Different observed generations isolated; same-generation writes/byte equality/atomic publication remain185/193.027 now assigned; aggregate checklists remain open.

Rev0.66: adaptedSWEEP019 source84c8f88b85752303cfb3a4dce6f1670920bf7168 accepted locally575868c697e67fb7331ae3df3ae39fc5069efca8; two source/manifest paths plusINDEX,434renderer/77native/1scalar/88profiling/10event/static independently pass. All022 hashes/rootlock unchanged; directtempfile existing3.27.0 promoted.021 now assigned, no aggregate checklist closure or Batch lifetime/retirement acceptance.

Rev0.65: adaptedSWEEP022 source dd73c6ba370de1d14d527b85bfecda1387004ce2 accepted locally at5d22118d9a708b49181ff2e154d84c0bb090398b after round02 Windows helper correction. Five source/test files plus generatedINDEX;434renderer/75native/1scalar/88profiling/10event and static gates independently pass. No Windows execution, actual lifetime or aggregate checklist closure.019 now assigned at that exact clean tip; explicit remove races and bounded growth remain193/186.

Rev0.64: phase022 submission64a1ba08 has matching five-path manifest and independently passing434renderer/74native/scalar/profiling/static gates, but amendment01 requires minimal Windows timestamp-write access and real file/directory helper controls in audit_value_cache.rs. Four production files are frozen; original report retained. No local commit/checklist acceptance or019 assignment yet; Windows execution not claimed.

Rev0.63: native delta ad71a8ec confirms all six193 prerequisites absent on933d888. Phase022 only is assigned; no new implementation/checklist acceptance. Blind session pruning remains current until separately reviewed correction; explicit removal races and bounded growth remain193 responsibilities.

Wave04 local adoption accepted2026-09-06: adaptedSWEEP010 source42137f7451297c8bff52cb0ee73c83845979c14f ->44d7f57cc9e09a66295a91544a2dffa04542b00f; adaptedSWEEP017 source1e48deb6d3cac490096fc45cd1ca1fc1c1b1025a ->dbfad2600b2d5395a61966c9913c12b56650993d. SeparateIMP181 at41222c5 completes local renderer replacement-key proof. See correctness-wave-04-verdict.md: twelve source/test paths, three ordered issue commits,356frontend/72native/1scalar/88profiling/10hook independently reproduced. Preserve rejected cached-video boolean, store-owned non-recycling revision and explicit-only Batch recomposition rulings. All aggregate adoption checkboxes stay open; pending Batch/native ownership and main/platform/mounted gates remain separate.

Wave 03 local adoption accepted 2026-09-05: SWEEP-003 source a09c834d maps to 4893477dbce439a8b24c84dfdf4e1f8e82fa6de4; SWEEP-008 source 0857489c maps to 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Lead independently reproduced 222 frontend / 50 native / 1 scalar tests and static gates. Exact five-file scope, commit/index receipts and incomplete native video smoke are in correctness-wave-03-verdict.md. IMP-182/183 and all aggregate adoption checkboxes remain open.

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Partial local adoption accepted on 2026-09-05: SWEEP-004 source 362b4a4a9327040682944e89ddbb8fd3d138932c maps to lead commit 6a17da61d079635d2dcec93c896d8e05c17027d8. Exact eight source files; six new tests and one strengthened existing regression. Lead independently reproduced 185 frontend / 48 native tests plus static/scalar gates. See correctness-wave-01-verdict.md. Main is unchanged, native-human/platform gates remain open, and no aggregate checklist item is complete. Next authorized subset is SWEEP-009/011 under the wave-02 brief; all other patches still require bounded assignment.

Subsequent Wave 02 accepted locally: SWEEP-009 at 13b6340994d34e4409f6908da0a8c3256e4af525 and SWEEP-011 at cf4c3440ae525bbd204e17c1af5b5db60c5bc9ed. See correctness-wave-02-verdict.md for exact nine-file scope and independent 209 frontend / 50 native validation. IMP-201 separately enabled a fresh macOS package and bounded native smoke, recorded in fresh-build-runtime-acceptance.md. Actual clipboard/drop variants and race stress remain unexecuted natively; no aggregate adoption checklist is closed. No further implementation range is dispatched.
