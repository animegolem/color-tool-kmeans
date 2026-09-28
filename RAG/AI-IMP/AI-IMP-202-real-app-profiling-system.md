---
node_id: AI-IMP-202
tags:
  - IMP-LIST
  - Implementation
  - profiling
kanban_status: in-progress
depends_on:
  - AI-IMP-201
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.85
date_created: 2026-09-05
date_completed:
---

# AI-IMP-202-real-app-profiling-system

## Reproducible real-app latency and attribution

Create a durable local profiling workflow that reproduces an artist's actual interaction and attributes latency across renderer, IPC, native analysis and presentation. Governing contract: PROJECT-RECORD §10, with acceptance in §6. This is measurement infrastructure, not authorization to optimize or integrate IMP-178.

Owner-reported Wave 03 debug observations: 6616 ms / 40 iterations / 180,000 samples during ML activity, approximately 4000 ms on a later quieter relaunch, versus recalled prior 20–60 ms. These are observations with incomplete configuration/baseline provenance, not a verified regression ratio. Current displayed duration brackets run_kmeans only (color-core/src/analyze.rs:192–194); it excludes surrounding work.

### Out of Scope

UI redesign, new live playback, performance/code-quality changes, iteration/sample reductions, IMP-178 acceptance or integration, native retention/admission policy, public telemetry, raw media in Git, system cache purges, starting/stopping owner ML jobs, replacing installed apps, releases or merges.

### Design/Approach

Read-only review first: verify timing boundaries, release/symbolization mechanism, candidate/prior-build provenance, deterministic case/config schema, trace correlation, process coverage and presentation measurement. Propose exact implementation files and staged gates before source edits.

Stage A after a separate verdict: matched release-profile sanity comparison on identified material/config, with binaries/symbols/manifests preserved. Stage B: optional bounded end-to-end spans and capture/analysis tooling with output parity and instrumentation-overhead controls. Stage C: reviewed comparison matrix and actionable evidence-backed bottleneck register. None is implementation-authorized by this ticket's creation.

Retain original raw records and traces, version schemas and analysis, and make reruns reproducible without private files in the repo. Missing historical stage data stays unavailable; no invented timestamps. IMP-178's future comparison arm requires a separately reviewed patch snapshot on the accepted base and must exclude the already adopted IMP-179 fixture repair.

### Files to Touch

Rev 0.51 supersedes historical assignments below: B20 bounded diagnostic accepted and owner graph ready under profiling-b20-visible-attribution-verdict.md. No current source/build/Git/capture assignment; preserve candidate and all original evidence. Lead owns review delivery and follow-up pause. Future scope awaits a new ruling.

Rev 0.40: B10 build accepted. Current profiling-b11-v2-control-proof-brief.md authorizes one exact fresh-session B10 UI diagnostic and native runtime persistence, private B11 evidence and one report. No source/build/Git changes, restart/resume, direct IPC/injection, geometry or performance experiment.

Rev 0.39: B9 accepted locally. Current profiling-b10-build-brief.md allows isolated generated build/symbol/provenance evidence under color-tool-profile-b10.h6bbb9, ordinary ignored frontend dist and one report only. All57 source paths/config/locks/Git unchanged; no app/runtime capture or old build replacement.

Rev 0.38: B9Round01 AMEND H1-H2 in three exact Node importer/schema/test files under profiling-b9-round-01-verdict.md; one Round02 report, full gates allowed. Other17 B9 and37 baseline paths unchanged; no build/app/runtime/Git action.

Rev 0.37: B8 diagnosis/schema basis accepted with G1-G7. Current profiling-b9-invalid-input-implementation-brief.md authorizes20 exact source/test files, one new schema, and one submission; full gates allowed, source stays prepared/uncommitted. Preserve all unassigned56-path baseline material, B6/B7 evidence/runtime and independent work. No packaging/app/Git changes.

Rev 0.36: B7 finalization failed. Current profiling-b8-invalid-input-repair-brief.md permits focused source/in-memory/private harness reproduction and one new report only. No candidate source edits, full suites, native execution/build, app/runtime/Git changes. Lead settles exact cross-consumer schema and implementation fence next; no owner blocker.

Rev 0.35: B6 exact build accepted under its verdict. Current profiling-b7-control-proof-brief.md permits one reserved-session B6 launch and bounded supplied-still/K/Values-Finish diagnostic, B6-only runtime persistence, private B7 evidence and one report. No source/build/Git changes, reload/resume, direct IPC/injection, eligible acquisition or performance experiment.

Rev 0.34: B5 source/tests accepted locally under profiling-b5-round-01-verdict.md. Current assignment profiling-b6-build-brief.md allows only fresh B6 generated build/symbol/provenance artifacts, normal ignored renderer dist regeneration and one B6 submission. All56 accepted source paths/configs/locks and Git remain unchanged; no app execution/control/capture.

Rev 0.33: current assignment is profiling-b5-finalization-implementation-brief.md under B4 F1–F5: eleven exact renderer/test paths plus one new submission. Five production paths (including existing trace-types) and six test/fixture paths; two new files. Tests permitted, no native/core/importer/config/build/app/runtime/Git changes. Preserve every other accepted53 path and immutable B2.

Rev 0.32: B3 bounded smoke locally accepted except unrun resize. Current assignment is profiling-b4-finalization-review-brief.md: one new profiling-b4-finalization-boundary-review.md source report only. No source/build/runtime/app-control/Git changes or tests; all53 accepted source paths and immutable B2 remain intact. Lead settles the operator control before implementation.

Rev 0.31: profiling-b3-smoke-01-verdict.md authorizes adoption of the verified existing B2 PID for smoke02 through the retained UI object; new private evidence and profiling-b3-smoke-02-submission.md only. No launch/restart, source/build/Git change or tracing. Preserve smoke01 partial evidence.

Rev 0.30: B2 exact build locally accepted. Current assignment is profiling-b3-smoke-brief.md: one profiling-disabled B2 launch, scoped app persistence and private smoke evidence plus profiling-b3-smoke-01-submission.md. Exact supplied still reference only; all53 source paths/build artifacts/Git remain unchanged. No instrumented acquisition or performance claim.

Rev 0.29: B1 source locally accepted under profiling-b1-round-03-verdict.md. Current assignment is profiling-b2-build-brief.md: isolated optimized build/symbol/provenance artifacts in the reserved B2 root, normal ignored renderer dist regeneration, and profiling-b2-build-submission.md only. All53 accepted source paths, configs/locks and Git state remain unchanged. No app launch/capture.

Rev 0.28: current assignment is profiling-b1-round-02-verdict.md D1–D4, eight existing native/adapter/test paths plus profiling-b1-round-03-submission.md. Other29 B1 files and sixteen A1 files remain byte-identical. No new split/audit, build/launch/capture, dependencies, production-policy changes or Git operations.

Rev 0.27: current assignment is profiling-b1-round-01-verdict.md C1–C8, original eighteen B1 files plus nineteen named optional extraction/test paths and profiling-b1-round-02-submission.md. A1's sixteen files remain byte-identical. No app build/launch/capture, core/video/other-view/cache/config/dependency changes or Git operations.

Rev 0.26: current authorized implementation is profiling-b1-implementation-brief.md, eighteen exact B1 source/schema/test files plus profiling-b1-submission.md. Sixteen A1 files remain byte-identical. Core/video/other views/config/dependencies/fixtures and app build/launch/capture/Git/IMP-178 remain fenced. This supersedes B0's report-only boundary solely for B1.

Rev 0.25: A1 locally accepted; its sixteen untracked files remain prepared without commit. Current assignment is only profiling-b0-boundary-review-brief.md and its one new report, profiling-b0-boundary-review.md. No source edits, app control/build/tracing or Git mutations. Earlier slice fences below are historical.

Rev 0.24 current slice supersedes historical A0-only fences below: profiling-a1-round-02-verdict.md authorizes two residual A1 safety corrections in its five exact Node tooling/test/documentation files, plus profiling-a1-round-03-submission.md. Preserve the other eleven A1 files and all tracked candidate source. No app control/build/instrumentation/dependency/Git operations or IMP-178 integration. Review Lead owns ticket/record/log/index updates.

Rev 0.20 current slice supersedes preparation-only/no-interaction statements below: execute profiling-a0-run-01-brief.md against the accepted immutable A0 bundle, owner-confirmed case and isolated runtime namespace. Private run-01 artifacts plus profiling-a0-run-01-submission.md only; normal isolated app persistence allowed. No source/build/dependency/Git changes, instrumentation or IMP-178 integration.

Round 01 is settled under profiling-round-01-verdict.md P1–P8. Current authorized slice: profiling-a0-build-brief.md, generated isolated build/symbol artifacts and one profiling-a0-build-submission.md report only. Review Lead separately owns this ticket, PROJECT-RECORD, epic and log/index updates.

Future implementation exact-file fence is a required Round 01 deliverable, not preapproved. Candidate read scope includes root Cargo profiles; color-core analyze/image_pipeline/kmeans; native commands/FFmpeg/logging; renderer bridges, runners, stores, chart builders and mounted views. Existing benchmarks are evidence, not substitutes for real-app measurement.

Do NOT change any tracked source/config/dependency/lock/fixture/profile file. Only the exact A0 preparation build and command-local symbol overrides in its brief are authorized; no benchmarks, instrumentation, app interaction, installs, Git mutations, media/preferences investigation or writes in independent performance/live-video worktrees. No new ticket IDs taken by delegates.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Accept source-verified review, exact instrumentation/runner fences, and staged implementation brief.
- [ ] Preserve comparable optimized app binaries and matching symbols with complete build/config/asset manifests.
- [ ] Exercise real interaction scenarios and prove correlation, cancellation/stale-outcome accounting and clock/presentation semantics.
- [ ] Validate trace schema, output parity, missing-data handling, bounded collection and profiling overhead.
- [ ] Capture quiet and owner-coordinated workload arms with declared cold/warm conditions, randomized repetitions and retained raw artifacts.
- [ ] Produce reproducible per-case latency distributions and process/thread attribution, with explicit thresholds and uncertainty.
- [ ] Independently rerun accepted cases; keep unavailable variants, owner/platform gates and unresolved regressions explicit.

### Acceptance Criteria

GIVEN a preserved build, local asset/config manifest and declared machine/cache/load condition, WHEN the documented workflow is repeated through the actual app, THEN every admitted interaction has a terminal outcome and comparable end-to-end/stage measurements or an explicit unavailable reason, with trace-to-case provenance.

GIVEN instrumented and non-instrumented matched builds, WHEN the same workload runs, THEN numerical/visible results remain equivalent under the accepted algorithm contract, and instrumentation overhead is quantified against a predeclared budget. Faster wrong/stale results fail regardless of latency.

GIVEN repeated cases, WHEN summaries are generated, THEN p50/p95, sample counts, failures/cancellations, responsive-frame evidence and uncertainty are reproducible from retained data. Debug timings and differently configured historical anecdotes cannot serve as release regression thresholds.

### Issues Encountered

Rev 0.51: Lead independently verified B20 all586 payloads/source55+two tools/status57/raw42413bytes, eight coherent actions/four completed visible/four superseded. Recorded46/45 each reach guarded RAF2 at507ms with401/402ms admission. Native3227rows/ms includes2ms missing backtrace; optional276/285ms windows uncalibrated. Owner view79881423… passes736/360 light/dark and interactive QA. B20 diagnostic discussion gate met, not benchmark eligibility: both bindings remain ACQUISITION_NOT_VERIFIED, viewport absent, no physical presentation/shared calibration/parity/overhead/distribution/full-app acceptance. No aggregate checkbox closes. Prior4s/white-screen unresolved; no further capture or implementation assigned.

Rev 0.50: B19 partial capture independently verified but both numeric actions hidden-before-dom-raf2, so visible E2E gate remains open. Corrected sampled totals2533 modeled rows vs2530 stack-bearing; three missing-backtrace rows cannot disappear from totals. B20 one explicitly foregrounded fresh capture gated by actual completed visible warm-ups; no source repair or owner blocker.

Rev 0.49: B18 R1 independently accepted after focus19/Node88/Vitest335/Rust72/static gates and preserved source/evidence verification. B19 one targeted native Time Profiler capture plus same-session renderer trace authorized on unchanged B14 app with exact new session; normal verified-app quit/relaunch and reused caches explicit. Missing clock alignment/renderer semantic stacks/physical display/parity/overhead remain open; no aggregate checkbox closure.

Rev 0.48: B18 main source/gates/B16 numerical result reproduced by lead. R1 fixes observed ULP(-0) sign error affecting subnormal comparisons; exact same two-file fence and new suffixed evidence, no app rebuild/raw normalization. Installed acquisition preflight proceeds independently; aggregate acceptance remains open.

Rev 0.47: B17 installed Rust roundtrip reproduced independently with unchanged endpoints; table19/19 and four completed B16 predicate diagnostics verified. B18 two-file checker/test implementation authorized with bounded ULP/domain/zero policy and stronger endpoint-shift/boundary regressions. No app rebuild or trace rewriting; new offline numerical receipt stays distinct from historical failure and missing acquisition/performance/flame acceptance. Aggregate checkboxes remain open.

Rev 0.46: B16 actual controls/native/figure/DOM association and loss-free seal verified, but strict inspector rejects two completed renderer durations on a5.68e-14ms representation difference. Lead reproduced untouched bytes and isolated equality in a throwaway in-memory counterfactual; no artifact repair/eligibility claim. B17 narrow numerical transport/bound proposal assigned; no new app rebuild or owner blocker. All aggregate acquisition/performance gates remain open.

Rev 0.45: B15 controller limit reached before import, not analysis failure. Lead fresh AX showed enabled Open; one click returned ScreenCaptureKit-3811 but subsequent AX/log proved successful exactPNG import in unchanged PID18954/session/root. B16 continuation authorized after identity checks. B15 frozen screenshots are tiny thumbnails, not readable UI proof; preserve them and capture raw AX/actual screenshot bytes going forward. No native correlation/performance acceptance yet.

Rev 0.44: B14 exact build independently verified including79 payloads/57 accepted/516 current/reconstructed/3671 target leaves, strict manifest and fresh core/app/writer DWARF lookups. Preserved special-variable and post-build shell-typo receipts; no build repair. B15 exact native control authorized, with honest debounce supersession and settled execution association. No runtime/performance or aggregate acceptance yet.

Rev 0.43: B13 exact two-file repair accepted after lead reproduced focus19/Node82/Vitest335/native72/scalar1/static gates; same2 existing Svelte warnings. Other55 hashes/exact57 status preserved. Exact57 source archived and B14 fresh build-only preparation assigned; no native/action/performance or aggregate acceptance.892-line integration test cohesion reviewed for this bounded compiler seam, commit-time LOC handling still explicit.

Rev 0.42: B12 mounted trusted Chrome input supports capture-hook repair; lead checked24 artifacts/57 source hashes, six-hook-only delta, compiled per-element capture and raw86-record snapshots. Trace/schedule sinks remain stubs. B13 exact two-file implementation authorized with old-hook negative control and full gates. Corrected proposed native recipe: superseded intermediate inputs need honest terminals, not forced native work; repeats alone do not prove overhead. All aggregate gates remain open.

Rev 0.41: B11 independently parses/seals without loss and preserves both empty inputs, but final46/45 actions lack native/renderer correlation. Intermediate4 resolves against later config; final values dedupe. Prior synchronous regression imposes observer/schedule order and does not prove native browser dispatch. Source57/status unchanged. Evidence index35/36 passes: live stderr grew, frozen snapshot is intact; preserve index and classify active carriers separately. B12 isolated trusted-browser source review assigned; no aggregate checkbox closed, no production fix or flame graph yet.

Rev 0.40: lead independently verified B10 artifact/source/manifest/compiler/symbol gates; exact namespaces absent and owner image digest intact. Inventory attempt included directory symlinks and failed read-only; corrected separate inventory preserved, no build repair. B11 must establish actual unavailable and settled-valid action persistence/seal; static build success and prior surrogate tests are insufficient. All aggregate gates remain open.

Rev 0.39: lead reran Node82/Vitest334/native72/scalar1/static gates and H1 importer counterexample now yields binding-unverified as required. H2 source/structural schema and runtime parser checks accepted; full JSON Schema engine unrun. Exact57 source archived with matching leaves before new B10 build. Source acceptance does not close any aggregate capture/performance checklist.

Rev 0.38: lead independently reproduced Node80/Vitest334/native72/scalar1 and static gates; exact20 hashes and57-path carrier match. Executed diagnostic fixture with mismatched invalid-action render returned only ACTION_CASE_CONFIG_UNAVAILABLE/input-target-invalid because comparison was skipped. Source schema inspection found optional event data despite runtime requirement; existing schema test is structural, not full validator execution. H1-H2 narrowly assigned; B9 not yet accepted.

Rev 0.37: B8 installed-binding probe uses actual null conversion and valid cancelled synthetic actions, correcting older injected-dedup assumptions. Lead source review adds native action-state guard omitted from payload-only fence and trace-to-run diagnostic reason correction; adapter review adds true source match/all numeric controls/capacity exception. Internal resolved config stays plain to avoid DOM/config ripple. Report omitted complete executable probe; B9 permanent regression must close that reproducibility gap. All56 baseline hashes match; implementation and real v2 capture remain unaccepted.

Rev 0.36: all30 B7 evidence hashes verified; raw/live trace remains748 bytes with losses4->8 and no actions/seal. UI45->46->45/Values/header succeeded but capture failed. Saved clusters=null corrects sampled-UI “no empty-field action observed” interpretation. Source and delegated undefined-state probe establish a pre-IPC sequence-gap mechanism, not exact rejected B7 attribution; current installed Svelte returns null, requiring exact-binding repro. Former PID43210 absent at lead recheck, cause unknown; no control/restart performed. B8 focused schema/repair review assigned; aggregate gates remain open.

Rev 0.35: B6 artifact/manifest/source/symbol gates independently pass. Lead found reconstructed-source root mode0600 blocked traversal; changed only that directory to0700 and verified515 unchanged leaf hashes. Bundle/executable unaffected. Build/wrapper0 and81.53seconds are packaging-only. B7 tests actual UI sealing/strict raw trace for the first time; broader acquisition/continuity/performance and all aggregate checkboxes remain open.

Rev 0.34: lead reproduced Node73, Vitest309/27, native68 plus emitter via Node, scalar1 and static gates; eleven hashes and exact56 status set match.45 baseline paths unchanged, eight baseline edits plus App/two new files within fence. Collector reviewer independently probed ordered append and sticky failure with zero native finalize after failure. Disabled header behavior remains source/compiled-only; no real trace or aggregate checkbox closure. B6 creates a distinct immutable build, not a B2 replacement.

Rev 0.33: B4 native/renderer/host source facts independently checked;53/53 hashes and carrier unchanged. Binding review adds sticky session-drop/persistence guards, strict sequence/loss receipt handling and explicit single-renderer-lifetime acquisition. Reload can erase pre-native renderer failures, so native sealing alone is not complete capture/eligibility. No reload recovery or automatic continuity detection is implemented or assigned. B5 source/tests are next; no new runtime evidence or aggregate checkbox closure.

Rev 0.32: lead verified13 smoke02 evidence hashes,53 source hashes, exact executable/input/archive and live adopted PID identity; five screenshots and saved same-image pending/ready/navigation transitions support bounded import/K/view-retention acceptance. Picker/accelerator friction is controller evidence, not an app defect. Resize remains unrun without documented geometry control; no export, instrumented trace, performance or aggregate acceptance. B4 reviews the missing safe operator finalization route.

Rev 0.31: smoke01 stopped before import on a PID transition; cause unknown, not established app crash/controller restart. Lead verified the current exact PID67432/start/executable and absent profiling key, so a non-timed adopted-process smoke is explicitly allowed. Existing namespace/setup state and both process histories are retained; loaded-reference UI gates remain unrun.

Rev 0.30: B2 source/artifact/manifest preservation and actual core+application DWARF lookup independently pass. Build returned0 after71.33s, while an outer zsh wrapper failed afterward; preflight/extraction failures and incidental npm log retained honestly. No runtime result yet. B3 is a limited off-path image/navigation/reflow smoke; the native finalization command still lacks a confirmed operator-facing route for later eligible capture.

Rev 0.29: D1–D4 accepted after lead independently reproduced Node73, Vitest276/26, Rust68 plus ignored emitter explicitly exercised by Node, scalar1 and static gates. Exactly seven corrected files and all preservation checks pass. B2 is build-only, with packed dSYM generation and actual core+application lookup required; no aggregate checklist closes. The reviewer's mistaken debug-binary test enumeration caused an ordinary app launch; process terminated, startup log confirmed and potential retention side effects disclosed in profiling-b1-round-03-review-incident.md. This was not controlled runtime acceptance.

Rev 0.28: lead reproduced Node72, Vitest276/26, Rust64 plus one ignored emitter exercised by Node, scalar1 and static gates. Actual collector post-admission repeat becomes unverified on import. Native reviewer executed post-seal appending with a stale sealed receipt, pre-finalization action-capacity refusal followed by clean seal, and rejected malformed identifier persistence. D1–D4 narrowly correct those paths; preserve C1–C8 work, no aggregate acceptance.

Rev 0.27: B1 independent gates pass (68 Node,262 frontend/24files,59 Rust,1 scalar), but cross-boundary probes expose native null-arm import rejection, deep-state proxy identity failure, post-store unmount falsely completing, contradictory event evidence accepted and nonselected loss ignored. Final-session completeness and native nested event budget also need correction. C1–C8 assigns regressions and cohesive splits; B1 remains unaccepted, no aggregate checkboxes closed.

Rev 0.26: B0 found a feasible narrow vertical before core internals. Lead/source and bounded safety review refined repeated reactive dedup, pre-binding input values, zero-figure joins, terminal-versus-write receipts, explicit trace/build/source binding and mixed-case import accounting. V1–V7 are implementation authority, not implemented behavior. No aggregate checklist completion or live performance claim.

Rev 0.25: Round 03 resolves R9–R10; lead reproduced Node 54, frontend 222/21, native 50, scalar 1, static gates and independent FIFO/nested-redaction probes. A0 summary is byte-identical. Accepted 427-line summarizer cohesion without minification/automatic LOC bypass. Node 20 and Windows remain unrun; actual live interaction trace and full-system acceptance remain open. B0 is a minimum vertical-slice source review, not implementation.

Rev 0.24: A1 Round 02 full gates independently reproduced (Node 52, frontend 222/21, native 50, scalar 1) and A0 summary regenerated byte-identically with all 31 attempts. R9–R10 AMEND remains for a pre-open regular-file-to-FIFO hang and added nested private fields surviving the exported summary redactor; the latter is blocked through current strict CLI input validation. No owner-data leak observed. Node 20 remains unrun. Source snapshot and both reports preserved; no aggregate checklist completion.

Rev 0.21: run-01 accepted only as nearby-frame diagnostic evidence under R1–R5. Seven UI-transcribed kernel values median 95 ms; log intervals independently verified, median 132 ms. Exact requested timestamp not reached, no retained screenshots or lead live replay, host materially active, one visibility-caveat trial, zero valid fresh-process target samples. No aggregate checklist closure or causal regression claim. Original ~4000 ms remains reported kernel time; full-interaction profiling still open.

Rev 0.20: owner confirmed the exact proposed case and quiet run and permits Desktop media. The first fixed-case real-app pilot is authorized; measurements and runtime isolation/configuration verification remain pending. All aggregate acceptance checks remain open.

Rev 0.19: A0 preparation accepted independently under profiling-a0-build-verdict.md. Core symbol/source-line lookup passes; 15 missing application-crate CGU objects limit broader symbol coverage. No launch or measurement yet, no aggregate checkbox closed; exact case/quiet-window confirmation and runtime configuration verification remain.

<!--
Document failed approaches, blockers, deviations, and missing tests.
Do not remove this Issues Encountered comment.
-->

Not implemented. Owner manually imported varied Desktop assets, so the earlier disabled picker is retained as a computer-use/control blocker, not a confirmed app regression; this does not close every video lifecycle test. Exact standard-asset paths/configuration and the historical fast build's identity still need pinning. Xcode and xctrace are installed, but actual capture, symbolication and renderer/WebContent visibility remain untested. IMP-178 is uncommitted at its separate 2cc2000-based worktree despite its ticket's completed status.

Rev 0.18: design basis accepted with P1–P8; A0 build preparation assigned, no runtime evidence yet. All aggregate checkboxes remain open because broader runner/instrumentation fences and execution are not accepted. Sol supplied log-derived K=82/quality=2/frame evidence and associated persisted settings after review; these correct the earlier K=45 inference but require resolved runtime verification before a matched run. Preserve report and inventory disclosure; no further asset/settings investigation in the build slice.
