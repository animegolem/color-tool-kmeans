# Color Tool project record

| Status                                   | Revision | Last updated |
| ---------------------------------------- | -------- | ------------ |
| Plan preserved (15144db, merge 28e5873); hook/CI 046450d with one regression pending; IMP-193-4 session 03 running | 0.99     | 2026-09-28   |

## 1. Authority and amendment

(rev0.98, 2026-09-28) The owner transferred the Review Lead seat to **Genga** (Claude Opus 5.5, the house studio's director; Herdr w4:pA), and Astra consented. The prior lead task is superseded as review authority; its records are preserved unchanged. See section 13.

This is the stable record for project steering from 2026-09-04. The owner designated the existing **Audit app control flows** task (`019f7c75-2b8b-7882-9df7-0cdc1e494671`) as project lead. Owner instructions and repository execution constraints remain authoritative. This record consolidates priorities, boundaries, decisions, and acceptance; tickets project those decisions into work orders.

Existing ADRs and the notebook design decisions remain in force and are incorporated by reference. `CLAUDE.md` describes architecture, `RAG/DATA-FLOW.md` describes flows, and `RAG/INDEX.md` derives ticket status. They are references, not alternative steering records. When source contradicts a historical description, record the discrepancy before assigning work. This record does not ratify old descriptions merely by linking them.

Amendments increment the revision and update this date. Keep sections 3, 5, 6, 7, and 8 consistent. Section numbers are stable; append new sections and preserve reversals with revision markers. Scope changes to an active assignment travel in a numbered review verdict before ticket text is synchronized.

## 2. Product and ownership

(rev0.98, 2026-09-28) **The deliverable is one web application that is both a browser app and a desktop app** (the owner, verbatim: "the goal is a browser app and a desktop app because the desktop app is just displaying the content of the browser app. So like one thing that can do both, so we can serve the website."). This supersedes the offline-desktop-only framing below and EPIC-027's no-web-deployment boundary. ADR-002 is to be amended: Tauri remains as the desktop shell over the same served web app. See section 13.

Color Tool is an offline desktop instrument for artists to inspect color palettes, value studies, and video frames. The shell is Tauri 2 with Svelte 5. Since `36bc0bb`, reusable numeric analysis lives in the Tauri-free `color-core` crate. Filesystem artifacts, FFmpeg, platform integration, and IPC orchestration remain in `tauri-app/src-tauri`.

### 2.1 Review lead

(rev0.98, 2026-09-28) Genga holds this seat: review, rulings, plan, commits and merges. Astra's no-commit instruction stands; the lead makes commits and merges.

This task owns diagnosis, product/architecture tradeoffs with the owner, epic priorities, ticket identifiers, domain boundaries, review verdicts, and integration acceptance. It independently checks consequential logic and reproduces submitted validation. It does not treat a passing historical suite as current evidence.

### 2.2 Code lead

(rev0.98, 2026-09-28) **Astra owns overall implementation and integration. Sol is a wave-owning implementation partner:** Astra delegates substantial bounded chunks to him, and he organizes his own subagents, self-reviews and returns reviewed waves. That's the owner's clarification as relayed by Astra, and it corrects any reading of Sol as a permanent correctness-only lane. Before any reassignment, Sol's current submission and uncommitted inventory are requested. His blocked IMP-202 profiling goal is NOT resumed by inertia.

(rev0.89) Owner reaffirms the default delivery contract: Review Lead maintains the epic and writes explicit IMPs; Sol receives a bounded sprint range under that epic and, once implementation is assigned in an isolated candidate, returns atomic per-ticket commits with regressions, validation and rationale. Review Lead independently reviews and owns merge/integration. This replaces lead-authored-commit handling as the default for future assigned Code Lead implementation, without rewriting prior history or granting Sol main/ref cleanup authority. Subagent no-commit restrictions remain unless separately overridden. Research/spike tickets return explicit reports and preserved artifact identities; never invent a production commit for external experimental work.

The owner supplied the existing **Code Lead** task (`01a06e5c-ac00-7761-884c-7ecca850de94`), and Round 01 was dispatched there on 2026-09-04 (rev 0.2). It may review the diagnosis, propose wave ordering and use bounded read-only subagents. After separate implementation authorization, it can schedule the approved ticket range, distribute bounded coding assignments and self-review. It cannot change scope, numerical acceptance, cache ownership, or product behavior without a lead ruling.

Round 02 was received and accepted as the design basis with binding lead clarifications (rev 0.4); both reviews and verdicts are preserved. No third general review is requested. Code Lead is waiting for a bounded implementation assignment, not polling. No new task or watcher was created. Commit and publication permissions remain explicit in a later assignment; no implementation is currently authorized.

### 2.3 Existing independent work

**Optimize color math performance** (`01a06e41-5fbc-7d80-a106-606e924ac497`) owns `codex/color-math-perf-2026-09-04`. Its ticket now reports completed work, but the code and measurements remain uncommitted and unaccepted on base `2cc2000`. Do not retask or rewrite that worktree. It includes the exact renderer fixture repair tracked by IMP-179: integrate that repair once, recording provenance, without making it depend on acceptance of all numeric optimization. Coordinate overlapping k-means edits separately.

## 3. Verified baseline and priorities

(rev0.99, 2026-09-28) IMP-193-4 session 02 (launched 03:47) ended on its 30-minute watchdog at 04:17, with ZERO owner dispositions (68 ledger rows, still in case 1). It is not acceptance. At the owner's word, session 03 was launched at 04:20 with a written checklist beside it.

(rev0.98, 2026-09-28) IMP-193-4 session 01 (2026-09-18) ended on its 30-minute owner-session watchdog, with zero owner dispositions and a failed terminal record. It is not acceptance. At the owner's word, the lead launched a fresh session 02 (run-20260928-visible-owner-02) on 2026-09-28 at 03:47 CDT; its outcome is owner-reported when they finish. **The lead's ruling: IMP-193-4 gates nothing in the first usable web app.** IMP-193-5 and any further IMP-202 are separate owner decisions, still open.

(rev0.97 launch receipt) One exact run started, process session86478/PID62026. Initial19-row ledger records child admission, parent show and renderer visible/frame receipts; no failure or owner dispositions at inspection. Exit/finalization and owner verdict remain pending. Desktop inventory omits bare executable; no screenshot claim.

(rev0.97) Exact frozen independent executable0e6237f7 rehashed on macOS27.0/26A428 arm64. Candidate/main clean6e12a73/5baa20e; reserved output absent and no test process. Prior preparation evidence remains bounded; no owner outcome yet.

(rev0.96)193-4 round03 reportf60891e4 independently accepted as preparation:15 hashes match, exactly3 changed/12 unchanged, complete delta reviewed;62 tests/all preparation gates pass. P13 receipt admission, P14 released snapshot guards and P15 actual duplicate-terminal fixture verified. R3 source/submitted08e5a757/independent0e6237f7 binaries frozen in fresh WATeWJ; selected later executable is the independent build. No App/runtime/owner evidence.

(rev0.95)193-4 round02 reportfc8e5996 reviewed: exact eight-file delta/seven unchanged, all15 hashes matched; R2 source/submittedbc4c0aee/independent88f7ba26 binaries preserved in fresh visible-review-r2.Z5s0Og. Reproduced55 tests/all preparation gates. Four additional failed expectations expose initial/successor receipt circularity, held snapshot guards and a mislabeled duplicate-terminal fixture; one lock-lifetime control passes. No native runtime observed; R2 AMEND under193-4-P13..P15.

(rev0.94)193-4 preparation report47aba2e3 independently reviewed: fifteen source hashes/fence matched and preserved in visible-review-r1.pjWpcM/source; submitted binaryeb9515c3 and independent rebuildbccae9dd frozen. All43 Rust tests and locked/offline fmt/check/clippy/build plus Node syntax/self-test reproduced. Five additional pure expectations fail (two watchdog, two validator, one case-control projection); callback, finalization and main-thread/preservation gaps confirmed by source. AMEND under193-4-P7..P12; no visible runtime. Candidate/main and prior evidence unchanged.

(rev0.93)193-4 pland9c01600 reviewed/hash matched; source verified default process-loss reload, label-scoped termination override and Wry insertion activation/no child first-responder call. Candidate clean6e12a73/rootlock05e43199, main clean5baa20e, prior evidence unchanged. Fresh empty visible-replacement.P8xk8N and lead-only visible-review-r1.pjWpcM roots reserved. No new source/build/test/runtime evidence yet.

(rev0.92) Owner accepts the proposed restart contract: trusted packaged-local startup, one document per unique child, fail-stop/fresh-child recovery inside the retained OS window with independent native-owned work/data. This is a product ruling, not new evidence. Candidate independently clean6e12a73/rootlock05e43199 and main clean5baa20e.193-3 remains completed;193-4 begins report-only planning.

(rev0.91)193-3 report3cd4b452 accepted as reviewed decision evidence under193-3-D1..D5; research ticket complete. Lead reread frozen init/receipt/bootstrap/retry and locked framework sources. Candidate clean6e12a73/rootlock05e43199, main clean5baa20e, retained result7fce8fac unchanged. No new tests/build/runtime. Trusted-local/single-document/fail-stop contract is proposed, not owner-approved.

(rev0.90) Owner approves proceeding with the proposed sprint. Candidate independently rechecked clean6e12a73/rootlock05e43199; accepted retained-window result7fce8fac unchanged. This is new assignment authority, not new runtime or implementation evidence.

(rev0.89) EPIC-029 already exists; its summary was behind the accepted kernel/experiment. Existing193-A commit6e12a73 and finite retained-window run remain the baseline. Backfill193-1(kernel)/193-2(experiment) as completed bounded children, not main/product acceptance. Reserve193-3..5 for the explicit forward delivery sequence.

(rev 0.88) C1-RW-RUN-01 on frozencbad33ec passed: actual exit0/no terminal output,198-rowce6daf15 ledger,6 ordered cases/43 required receipts. Seven distinct children retained one opaque parent; all19 pre-resize inner-size/scale samples match, requested811x613 logical reached1622x1226 physical in parent/child with zero delta. Native/session leases retained. Candidate/main clean; no production change.

(rev 0.87) Round03d5b9f06d/all14 matched; lead independently reproduced44 pure tests/all locked offline gates and reviewed the three-file H25 delta. Frozen submittede1ed6376 and leadcbad33ec preserved in retained-review-r3.iuWPrw. Candidate independently clean6e12a73, main clean. No retained-window runtime outcome yet.

(rev 0.86) Round02 preparation78096871/all14 hashes reviewed; lead reproduced35 pure tests and every locked offline preparation gate. Frozen source/submitted98e0cc73 and independent683366c8 preserved in retained-review-r2.TpFFhT. H21/H23 and bounded H24 size/identity corrections accepted at preparation level. H22 bootstrap guard is fixed, but renderer-receipt and wrong Finished observations still only log detected contradictions. Candidate independently clean6e12a73; no retained-window runtime.

(rev 0.85) Preparationedcb8286/all14 hashes reviewed; lead reproduced20 pure tests and all locked offline preparation gates. Final lock differs only in root name; initial unseeded resolution remains a disclosed historical deviation. Frozen source/submitteda7e0a01d and independent3f1f5428 preserved in retained-review-r1.owoFCP. Two additional actual-library pure probes fail: observed about:blank can activate, and active->retired leaves the comparison snapshot equal. Source also shows unreachable post-run result check and vacuous resize/event acceptance. Candidate clean6e12a73; no App/WebView/runtime run.

(rev 0.84) Round01 final1b58945c fully read/hash matched; lead source-verified native parent getter, child event/attach/close and resize surfaces and real registry accounting. Candidate clean6e12a73/lock05e43199; PEEpxt still empty before preparation. No new runtime evidence; child close-return/map absence is not a native destruction event.

(rev 0.83) Owner approves the isolated retained-window experiment after clarification that document restart is not ordinary image loading, repaint or Svelte navigation. Candidate independently rechecked clean6e12a73; tauri/unstable remains disabled there. A fresh empty color-tool-c1-retained-window.PEEpxt root is reserved. No new code/build/runtime evidence yet; earlier source/finite-run limits remain.

(rev 0.82) Feasibility0357cf73 API facts independently verified: currently enabled stable Tauri creates a new OS window; retained-window child replacement requires disabled public unstable surface. No feature or production change. Initial-document binding remains open; proposed reject-all-after-activation retry rule is not accepted because H7/C2 recovery remains. Candidate/ledgers unchanged.

(rev 0.81) Closeoute31da950 independently source-checked. Initial challenge callback omission is explained by Wry's script-only pre-first-commit queue; explicit JS receipts remain observed. Renewing-Started/eval still has an unestablished predecessor-exclusion premise, not an observed misroute. Correct hypothetical prefix requires renderer A knownSession=None; a known retired session is rejected. Candidate/ledgers unchanged; no build/test/run.

(rev 0.80) C1-RUN-02 passed its finite instrument gate: exact2a08c1c5, ledger0ef15c19 (482 rows/361913 bytes), seven ordered completions and terminal482, actual exit0/empty output. Same late callback480 now precedes successful finalization. Negative/guarded controls and actual two replacements observed;8/8 timer reports and ordinary old callback remain unobserved within bounds. Candidate/source/failed run01 unchanged. No universal/production C1 acceptance.

(rev 0.79) H14 report202eaaee/driverfd8e8099 accepted as preparation after full driver-only diff, other13 unchanged files,29 pure tests and all offline preparation gates reproduced. EventInbox survives through acknowledged main-loop finalization; real early disconnect/trace errors/watchdog still fail. Source14/submittedac5a275f/lead-built2a08c1c5 preserved in color-tool-c1-harness-review-h14.Be7eFm. Candidate clean6e12a73, first-run ledgerbf09f574 unchanged.

(rev 0.78) C1-RUN-01 executed once on exact3f0fc8ee/macOS26.6.2. Ledgerbf09f574 has481 contiguous/monotonic rows and seven ordered case completions, but no terminal success; actual exit1 with trace-failure finalization error. Row480 valid eval callback arrives after case7, consistent with dropped EventInbox poisoning send_event before exit. Partial controls and actual replacements recorded; eight timer reports remain missing/unknown. Source/binary/candidate unchanged; no retry.

(rev 0.77) Round03d6cfe265 accepted as preparation after driver-only diff12464052 review and independently reproduced27 pure tests/fmt/check/clippy/build. Actual/synthetic Started/Finished serialization is explicit. Source14/submitted0610dfc9 and distinct lead-built3f0fc8ee preserved in color-tool-c1-harness-review-r3.SEO7C2. Candidate clean6e12a73 with four preservation hashes matched. No runtime evidence yet at authorization.

(rev 0.76) Round02 reportfc845013 and all prepared hashes reviewed; lead reproduced25 pure tests plus fmt/check/clippy/build. Corrected authority/diagnostic/retry/lifecycle/exit/join/terminal mechanisms stand as preparation evidence. Synthetic case6 Started/Finished rows still inherit actual platform labels; narrow C1-H13 remains. Fourteen source files and lead-rebuilt binary6993c0f1 preserved in color-tool-c1-harness-review-r2.U6Hnyn; rebuilt binary is distinct from submitted191ebde7. Candidate clean6e12a73; no runtime launched.

(rev 0.75) Harness preparation report9588c341 reviewed;13 manifest rows and binary/icon match, src/lib hash was truncated in report (actual ends efc3). Candidate stays clean6e12a73. Lead reproduced12 pure tests/fmt/clippy, verified minimal lock graph and isolation. Original14 files/binary preserved in color-tool-c1-harness-review-r1.A54v6z; no runtime launched. Green preparation is AMEND, not accepted runtime evidence.

(rev 0.74) Installed tauri-codegen2.6.3 unconditionally loads the Unix default PNG and validates RGBA even with bundle disabled and no configured windows. Current harness config inspected; this explains the preparation compile failure, not a candidate/runtime failure.

(rev 0.73) C1 seam report559ee81e accepted as bounded installed-source evidence. Lead verified payload/label/eval/platform-hook/configuration paths; no correlated document epoch is publicly provided. Candidate remains clean6e12a73; no new app or ownership implementation. A guarded native challenge remains a test hypothesis, not an established runtime guarantee.

(rev 0.72) Native193-A accepted and committed6e12a73783c7119dae9b6add947e1b5085abe003, parenta0d9dd0. Five source paths1257ins plus generatedINDEX totals six paths1261ins/1del. All hashes matched and full kernel/test logic reviewed. Lead reproduced473renderer/36,105native plus one intentional ignored emitter, Node88/event10/scalar1/static/core-tree gates. Candidate clean; main/app/evidence unchanged.

(rev 0.71) Owner explicitly accepts active-session accumulation with safe cleanup on flush or when files are proven unused. Six prerequisites remain accepted on clean a0d9dd0be5441095ef12f5bf98c225aee02281d4. This selects retention-only R, superseding the earlier F recommendation and pending F/O/numeric gate; no new hard quota is approved. Only native193 slice A (ownership/accounting kernel) is assigned; no implementation result yet.

(rev 0.70) Phase030 accepted at a0d9dd0be5441095ef12f5bf98c225aee02281d4, parentf1a30d1: seven source/manifest/test paths380 insertions/52 deletions plus generatedINDEX gives eight paths384/56. All seven hashes/tracked diff and preserved untouched slices match; actual before-fix transcript inspected. Lead reproduced473renderer/36, native92 plus one intentional ignored emitter, Node88/event10/scalar1/static/core-tree gates. Candidate clean; all six022/019/021/027/029/030 prerequisites now locally present. Main/app/evidence unchanged; aggregate adoption and193 remain incomplete.

(rev 0.69) Phase029 accepted at f1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55, parent3d35787: commands.rs250 insertions/7 deletions plus generated INDEX gives two paths251/7. Source/diff and all prior hashes matched. Lead reproduced473renderer/36 files, native83 plus one intentional ignored emitter, Node88/event10/scalar1/static/core-tree gates. Actual worker thread/result/panic and four paired profiling outcomes pass. Candidate clean; main/app/evidence unchanged. No timing, cancellation or bounded-concurrency acceptance.

(rev 0.68) Phase027 accepted at 3d35787a5df857e095a96c31a8a5e8588b13db70, parent caf8225: four bridge/parser/test files plus generated INDEX, 432 insertions/25 deletions. Exact prepared hashes and preserved021/019/022/lock identities verified. Lead reproduced473 renderer/36 files, native80 plus one intentional ignored emitter, Node88/event10/scalar1 and static/core-tree gates. Candidate clean; main/app/evidence unchanged. Media transport fixtures are not native serialization parity.

(rev 0.67)021 reporta2ebc9c8 accepted after two hashes/diff/preservation review and reproduced434/35,Node88,event10,native80+1intentionalignored,scalar1/core-tree/static gates. Lead commitcaf822526af273c3dafdb44a51f7c094fb3ebeb4 parent575868c: two source/tests260ins3del plusINDEX gives3paths262ins4del. Candidate clean. Same-observation/byte-identity/partial-publication residuals explicit; main/app/evidence unchanged.

(rev 0.66)019 reportf12236a1 accepted after exact two-path/hash/binary-diff review, preserved022/rootlock verification and reproduced434/35,Node88,event10,native77+1intentionalignored,scalar1/core-tree/static gates. Lead commit575868c697e67fb7331ae3df3ae39fc5069efca8 parent5d22118: two source/manifest126ins10del plusINDEX gives3paths127ins10del. Candidate clean; directtempfile3.27.0 promoted, rootlockunchanged. Main/app/evidence unchanged.

(rev 0.65)022 round02e0f6c65b accepted after five hash/fence/binary-diff checks and reproduced434/35,Node88,event10,native75+1intentionalignored,scalar1/core-tree and static gates. Lead commit5d22118d9a708b49181ff2e154d84c0bb090398b parent933d888: five source/tests174ins55del plusINDEX gives6paths177ins58del; candidate clean. Four production hashes preserved across amendment. Main/app/evidence unchanged, Windows unrun.

(rev 0.64) Phase022 submission64a1ba08 reviewed at933d888+five paths; all prepared hashes/binary diff matched. Lead reproduced434/35,Node88,event10, native74+1intentionalignored,scalar1/core-tree and static gates. AMEND despite green local gates: Windows fixture timestamp helper lacks FILE_WRITE_ATTRIBUTES; Rust1.90/Win32 source contract verified, no Windows run claimed. Production source unchanged by lead; no commit or019 assignment.

(rev 0.63) Native delta report ad71a8ec accepted as source/adoption basis. Lead verified clean933d888, digest, six positive historical git-cherry entries, current prune sites/full022 diff and current media/clipboard/snapshot seams. No new test run or source acceptance in this review. All019/021/022/027/029/030 remain absent; begin022 only under correctness-wave-06-delta-verdict-and-022-brief.md. Main/app/evidence unchanged.

(rev 0.62) Wave05 local source/test acceptance at933d888880ee5507aa0ce4ee2b81bcdc3756e3ff after183 round02. Lead matched11 hashes/fence and reproduced434/35,153/13,Node88,event10/static,native72+1ignored,scalar1/core-tree. Candidate clean; three-wave commits1922853040/1828a8e133/183933d888. Combined20paths4000ins/443del includingINDEX,+78tests/+4files. Main/app/evidence unchanged.

(rev 0.61)183 submission8826aa57 reviewed at8a8e133+11paths; all prepared hashes/fence match. Lead reproduced431/35,150/13,Node88,event10/static,native72+1ignored,scalar1/core-tree. AMEND despite green gates: Values cached playhead initialization lost, Home snapshot compares captured epoch to itself, and new reconciliation can decode during active scrub. No183 commit/combined acceptance/source mutation by lead.

(rev 0.60) Phase182 report159c92aa accepted after exact two-test hash/fence review and reproduced413/34,132/12,Node88,event10/static gates. Lead commit8a8e13381410841674015ae27da9310c3c659fbe adds391 test lines plus generatedINDEX,3paths393ins/1del; candidate clean. Real controller/store/runner cases prove fresh revision/result after seek/step races; no production defect/change. Main/app/evidence unchanged.

(rev 0.59) Round02d1517872 accepted after18 hash/fence checks and reproduced404/34,123/12,Node88,event10/static gates. Lead commit2853040d6e7847eaa9aeab0d665179bb35a9dc2f adapts013 with192;19paths18source/tests plus generatedINDEX,1862ins/192del. Candidate clean; main/app/evidence unchanged. Source-only192 accepted, combined183 lifecycle/integration not accepted.

(rev 0.58) Phase192 submissionf32eaa3c is reviewed, not accepted. Exact18 prepared hashes/fence match41222c5; lead independently reproduced397/34 renderer,116/12 focus,Node88,event10 and all static gates. Amendment01 requires owned Home decode-error diagnostics and epoch-isolating Home frame/strip regressions. No candidate source/Git/app changes by lead.

(rev 0.57) Wave05 review5c874513 independently read and source-checked at clean41222c5; focus29/3 reproduced. Values local probe generation does not follow bucket still selection; Home path-only guards do not distinguish same-path return. Both historical013/023 have merge-base28d9e84, neither is accepted ancestry. No source/Git/app change in this review. Verdict correctness-wave-05-implementation-verdict.md accepts serialized192 -> test-only182 ->183 with binding intent/settlement, resource and test-fence clarifications.

(rev 0.56) Phase181 report71bf2101 independently reviewed: three paths/hashes match; full frontend356/31, focus65/8, profiling Node88, event guard10, native72/one intentional ignored, scalar1, no Tauri in color-core normal tree, check0errors/2accepted warnings, lint/format/fmt/clippy/diff pass. Lead commit41222c50001b7a02d516e7122b94f434ea073243 adds three source/tests plus generatedINDEX; clean candidate. Full wave04 has twelve source/test paths plus INDEX, three issue commits01044d7f57 ->017dbfad26 ->18141222c5. Toolchain Node26.8.1/npm11.19.0/Rust1.90.0 on local macOS; no Node20/Windows/Linux or mounted-app acceptance inferred. Main/app/build/evidence unchanged.

(rev 0.55) Phase017 reportfaaa77c2 accepted after independent five-path/hash review, frontend351/30, focus60/7, Node88, event guard10, check0errors/2accepted warnings, lint/format/diff gates. Store-owned monotonic revisions and primitive pinned snapshots verified, including same-object readmission and explicit second Batch Analyze. Lead commitdbfad2600b2d5395a61966c9913c12b56650993d contains five source/tests473 additions plus generatedINDEX:6files475ins/1del. Candidate clean; actual candidate-local hooks fmt/clippy pass; no LOC exception required. Native full/scalar remain final-wave gates. Main/app/evidence unchanged.

(rev 0.54) Phase010 submission5aa5e75d independently reviewed: exact six-file fence and all six prepared hashes match; frontend340/28, focus49/5, profiling Node88, event guard10, check0errors/2knownwarnings, lint/format/diff-check pass. Lead commit44d7f57cc9e09a66295a91544a2dffa04542b00f contains six source/test paths plus normal generatedINDEX; candidate clean. Candidate-local hook fmt/clippy also pass; pre-existing large cohesive files have explicit LOC-bypass, no numerical or source split change. Native workspace/scalar tests remain final-wave gates, not claimed newly run in010. Main/app/artifacts unchanged.

(rev 0.53) Wave04 reviewa7d897ee… independently checked and focus44/4 reproduced. Lead committed hook false-positive repair856fc98 [IMP203] then unchanged57-path profiling baseline9215711 [IMP202], each with generatedINDEX only. Candidate clean921571131939fbb7a9771e558bfbd4f54ab9f789; native/app artifacts untouched. Baseline gates frontend335/27,Node88,native72,scalar1,static0errors/2knownwarnings pass. Hook regression3fail-before/10pass-after; actual enabled candidate-local hooks pass. All earlier capture/source identities remain historical, not rewritten to newHEAD.

(rev 0.52) Owner manually exercised reopened B14 and reports normal behavior, without the prior strange delay; supplied screenshot shows78ms/40iterations/260000samples. This is bounded owner feedback, not calibrated input-to-visible timing or a matched reproduction. Earlier4s/white-screen remains not reproduced, not causally fixed. Owner authorized proceeding with correctness, careful responsiveness improvement and the redesigned study flow. Current candidate remains8bf3187 plus57 preserved profiling paths; no new source acceptance implied.

(rev 0.51) B20 independently verified:586 payloads/indexbcacd423…,42413-byte raw4cbb444c… equals live; unchanged B14 executable4b43e523…/source55+two accepted offline tools/status57. Eight coherent actions include four genuinely completed visible results and four supersededK4. Recorded46/45 each reach associated visible RAF2 at507ms; admission401/402ms. Native XML3227 sampled rows/ms,3225 stack-bearing/two missing; provisional windows276/285 retain unbounded alignment. Owner view79881423… in color-tool-b20-review.nt1cQn is QA-checked736/360 light/dark. This is bounded diagnostic evidence, not benchmark or physical-presentation acceptance.

(rev 0.50) Lead rehashed B19 all513 payloads/indexe7b37caf…/live raw19592bytes daeb5d14…/PID24489/start15:03:23/source55+two tools/status57. Four actions: two invalid-empty and two hidden-before-dom-raf2; no visible completion. Independent XML counts2533 total1ms rows,2530 stack-bearing/three missing-backtrace; provisional seq2 weights839/839ms and seq4 total895/stack-bearing892ms. Native UUID matches B14.

(rev 0.49) B18 R1 source accepted: checker47683656…/test5da34890…,55 prior hashes/status57 preserved. Lead reproduced focus19/Node88/Vitest335/Rust72/static gates and both original/suffixed evidence indexes; B16 four completed actions coherent under new inspector, raw unchanged. B14 executable4b43e523…/manifest15f1285f…/ownerPNG e3ca7176… and existing PID18954 verified; reserved B19 trace absent.

(rev 0.48) Lead reproduced B18 Node87/Vitest335/Rust72/static gates, exact two-file diff/55 preserved hashes and untouched B16 four completed coherent results. Production ULP(-0) is negative, causing a subnormal false negative; R1 narrowly corrects spacing without raw normalization.

(rev 0.47) Lead reproduced exact installed Rust JSON duration shift with unchanged endpoints, rehashed three B17 receipts/source57/status57 and reran private table19/19 plus B16 four completed comparisons. B17 is accepted as numerical repair basis, not historical IPC observation or current importer acceptance.

(rev 0.46) B16 lead verified49 frozen payloads/41843-byte trace1c9cfe55…/same live digest/PID. Eight actions/four native pairs/zero loss/valid seal; empty and superseded inputs honest. Four settled actions have full association checks, but strict inspector rejects3/8 on402.0000000002328 versus402.00000000023283 only. In-memory substitution isolates this predicate without repairing evidence. Actual B14 serde_json compiler features lack float_roundtrip; exact transport cause remains for B17.

(rev 0.45) B15 stopped before import,20 frozen payloads verified/header381bytes b3006b34… only. Lead attached to existing PID18954/start13:41:37, observed enabled Open and clicked once. Tool capture returned-3811 but fresh AX/log proved imported palette-wheel-reference.png/readyK45 at13:55:17, same root/PID and header. B15 frozen evidence preserved; thumbnails98x101/65x59 do not prove readable UI details. B16 same-session continuation assigned; B14 namespaces now exist.

(rev 0.44) B14 build independently accepted:79 payload/57 accepted/516 current/516 reconstructed/3671 target/six bundle/eight frontend hashes pass; strict manifest11 refs/seven bound files. Three actual compiler lines pass opt3/line-tables/packed/no-strip; matching UUID DFF35F8D… and fresh core131/app518/writer247 lookups. Executable4b43e523…; manifest15f1285f…; no runtime yet. B14 namespaces absent/exact process count0.

(rev 0.43) B13 independently accepted:exact two-file diff,55 preserved hashes/57 status,14 evidence payload hashes. Lead reran focus19/Node82/Vitest335 across27/native72 plus emitter through Node/scalar1/static gates with same2 Svelte warnings. Capture component equals B12 fixture706e8e9c…; test04d70b43…; no native proof yet. Archived exact57 in B14 root color-tool-profile-b14.XANBLs, all leaves verified. Prospective B14 namespaces absent.

(rev 0.42) B12 report080c10bf… accepted with R1-R5. Lead checked24 artifact hashes/57 source hashes/exact status, exact six-hook fixture delta, compiler registration per element and both raw86-record snapshots with20 trusted event records each. Current numeric effect precedes observer; capture reverses it, producing six action-bearing schedule boundaries versus checkbox-only current. Trace/scheduler are stubs, not native/collector acceptance. B13 two-file implementation assigned; no app/performance claim.

(rev 0.41) B11 raw persistence independently reproduced:14 v2 records/six contiguous batches and closes/zero native actions/zero loss/valid seal; empty actions preserved, final46/45 correlation FAILED. Source57/status unchanged on8bf3187. Live trace equals immutable b9f7706b… copy; PID57783 still matches exact B10/start. Evidence index35/36 passes: live stderr carrier grew, frozen snapshot remains a matching prefix. See profiling-b11-control-proof-verdict.md. Rev0.37 observer-before-effect guarantee is withdrawn: synthetic scheduling did not prove native event ordering. B10 namespaces now exist; prior absence is historical.

(rev 0.40) B10 independently accepted:59 evidence payloads,57 dirty/516 current/516 reconstructed hashes, six bundle/eight frontend files, strict manifest11 refs/seven bound files. Three actual compiler lines opt3/line-tables/packed/no-strip; fresh matching UUID B31A80A7-DC4B-30AF-B499-3EF8CC2E1AC1 and core131/app518 lookups. Executable c11d0fc2…; no runtime result yet. B10 namespaces remain absent.

(rev 0.39) B9Round02 accepted locally. Lead reproduced Node82, Vitest334/27, native72 plus emitter via Node, scalar1 and all static gates. H1 actual importer repro now preserves render mismatch priority; H2 required/closed event data checked.20 hashes match, only three corrections/17 preserved; baseline19 changed/37 preserved/new schema57 status unchanged. Source remains uncommitted.

(rev 0.38) B9 lead-reproduced Node80, Vitest334/27, native72 plus emitter via Node, scalar1 and static gates.20 hashes/exact19 changed+37 preserved+one new schema/57 status paths match. Renderer independent probe passes. AMEND H1-H2: unavailable import skips available render comparison; v2 schema omits required/fixed unavailable event data. Neither establishes a measured invalid result, but both violate the strict evidence contract.

(rev 0.37) B8 report b8e56fc4… accepted as repair basis with G1-G7. Lead checked56 unchanged hashes and critical source boundaries; reported installed-binding probe reproduces pre-IPC invalid1/3 then cancelled valid2/4 sequence losses. This is not B7 identity attribution or mounted capture. Source supports observer-before-effect; no production schedule fix is justified.

(rev 0.36) B7 bounded UI behavior accepted, trace/finalization failed:748 bytes, header plus losses4->8, no actions or seal. All30 evidence hashes and live/raw digests rechecked. Saved logs show transient clusters=null. Source confirms invalid config can fail pre-IPC after consuming a sequence; synthetic undefined-state probe reproduces a mechanism, not exact B7 attribution. Current installed Svelte empty binding returns null. Former PID43210 is absent, cause unknown; no process action taken. Prior namespace-absence statement is historical: B6 namespaces now exist and must be preserved.

(rev 0.35) B6 accepted after independent36 artifact/13 source-evidence/6 bundle/8 frontend/56 dirty/515 full-source checks, strict manifest7 bound files+10 references, compiler flags and matching UUID/core+app lookups. Executable869ce8df… / UUID B86C1C57-048A-3528-ABEA-D30B4E5C2A62. Lead repaired only reconstructed-source root mode0600→0700, then515 reconstructed hashes match; no content/bundle change. B6 namespaces remain absent; B2 PID/executable unchanged.

(rev 0.34) B5 locally accepted: lead reproduced Node73/Vitest309 across27/Rust68 plus emitter explicitly exercised by Node/scalar1/static gates; two accepted Svelte warnings remain. Eleven prepared hashes,45 preserved B2 paths, eight changed baseline paths and App's before hash verified; exact status set56 on unchanged8bf3187. Read-only collector probe additionally passed sticky-failure/order checks. No mounted control or runtime evidence; exact dirty56 archive preserved for new B6.

(rev 0.33) B4 source review confirms native finalize is registered, while renderer lacks quiescence/drain/operator route. Lead rechecked unchanged8bf3187/53 paths and all53 hashes, plus bridge/collector/native wire/writer and App host. Read-only reviewer identified reload erasing renderer-only failures; not a runtime reproduction. Native sealing cannot prove cross-renderer completeness. B4 basis accepted with F1–F5; B5 implementation is unexecuted.

(rev 0.32) Smoke02 accepted for exact-reference import, K45→46→45 and Colors→Values→Exports→Colors. Lead verified13 evidence hashes,53 current source hashes, executable/input/archive identity, saved same-image pending/ready transitions and five screenshots; live adopted PID67432/start20:29:26 remains exact with profiling key absent. Resize is unrun, no export or tracing occurred, and B2 namespaces now contain normal runtime state. Full interaction/performance acceptance is still open.

(rev 0.31) Smoke01 reached an empty mounted B2 window but stopped before import after direct PID67138 disappeared and PID67432 appeared. Cause is unresolved, not an app-crash finding. Lead verified13 evidence hashes,53 source hashes, exact executable/input and retained screenshot; independently checked PID67432/start20:29:26/executable and successful targeted environment read with profiling key absent. The B2 profiling directory is absent. Smoke01 remains partial; no loaded-media/performance acceptance.

(rev 0.30) B2 build accepted after independent26-artifact/5-source-evidence/6-bundle/8-frontend/53-source checks,53 archived-leaf comparison, strict manifest validation and both source-line lookups. Executable9f297d5e… / UUID A53AAE9C-FD89-34C3-9EA7-D6A0C21ECD73; actual optimized core/app compilation verified. Both B2 runtime namespaces remain absent before smoke. No B2 launch or performance evidence yet. Build-wrapper/preflight errors and incidental npm log remain disclosed, not erased.

(rev 0.29) B1 Round03 accepted locally after lead reproduced Node73/Vitest276 across26/Rust68 plus explicitly exercised ignored emitter/scalar1/static gates. Exactly seven authorized corrections,30 B1 files unchanged,16 A1 files intact and53 known carrier paths on8bf3187. Actual collector/native-writer→importer proofs cover D1–D4. A read-only reviewer accidentally launched an ordinary debug binary while attempting test enumeration; exact process terminated, ordinary-cache startup log confirmed, possible startup pruning disclosed in profiling-b1-round-03-review-incident.md. Not a controlled app test.

(rev 0.28) Round 02 gates reproduce (Node72/Vitest276 across26/Rust64 plus one explicitly exercised ignored emitter/scalar1/static); all37 B1 hashes and sixteen A1 files match. Lead independently reproduced normal post-admission repeated scheduling becoming ineligible on import. Native reviewer executed post-seal append, pre-finalization capacity refusal with clean seal, and rejected identifier persistence; lead confirmed source paths. Round 02 source/report frozen; no B1 acceptance.

(rev 0.27) B1 gates independently pass (Node68/Vitest262 across24/Rust59/scalar1/static), eighteen source hashes match and sixteen A1 files are unchanged. Yet lead reproduced native-shaped importer rejection, compiled-Svelte identity mismatch, post-store unmount falsely completing, and contradictory/nonselected-loss evidence remaining eligible. Native review additionally identified missing final-session completeness and nested-event budget accounting. B1 is not accepted; original source/report frozen.

(rev 0.26) B0 source-boundary report reviewed against current runner/store/bridge/chart source and installed Svelte/Tauri behavior. Minimum Colors vertical trace is feasible with binding V1–V7 in profiling-b1-implementation-brief.md. No implementation or live evidence yet; A1 remains locally accepted and uncommitted.

(rev 0.25) A1 Round 03 accepted locally after lead reproduced 54 Node/222 frontend/50 native/1 scalar tests and static gates. Independent pre-open FIFO probe now promptly rejects; nested redaction probe passes; A0 summary bytes unchanged. Exactly five authorized corrections versus Round 02, other eleven A1 files unchanged. Candidate remains 8bf3187 with sixteen untracked accepted files, no commit/merge.

(rev 0.24) Lead reproduced corrected A1 gates: 52 Node, 222 frontend, 50 native and 1 scalar test; static gates pass. Fourteen independent domain/grouping probes pass, and all 31 A0 attempts plus byte-identical Round 02 summary are preserved. Two residual safety cases independently reproduced: pre-open FIFO replacement hangs, and exported summary redaction forwards added nested private fields (not reachable through strict current CLI inputs). Round 02 frozen; no acceptance or commit.

(rev 0.23) Lead reproduced A1's34Node/222frontend/50native/1scalar passing gates, but targeted probes found valid quality0 rejection, unsupported exact/presentation claims, zero-measurement outcome loss and JSON-key-order grouping errors. Safety review additionally identified post-stat growth beyond limits and filename-shaped ID redaction leakage. Original eight files frozen in a private review snapshot; candidate changes remain uncommitted.

(rev 0.22) Owner approves proceeding from A0 to full-interaction measurement, permits a continuity memory and macOS attention notification if genuinely blocked. Candidate rechecked clean at 8bf3187. First implementation slice is eight A1 record/schema/test files; lead separately investigates reliable native control and durable capture using the immutable A0 bundle.

(rev 0.21) A0 run-01 produced seven fresh warm-process nearby-frame reruns: reported displayed kernel median 95 ms (93–104), independently recomputed log pending→ready median 132 ms (123–139). All five evidence hashes and 31 log/TSV pair intervals verified. Actual 58.4210 s differs from requested 58.4163; accept unmatched diagnostic evidence only. Candidate remains clean at 8bf3187.

(rev 0.20) Owner confirms the proposed [owner test clip; name redacted for the repository, rev0.98] t=58.4163/K=82/quality=2 quiet case and permits Desktop material for relevant testing. A0 run-01 uses the accepted immutable optimized build; measurements remain pending and actual UI configuration must be verified.

(rev 0.19) A0 preparation independently accepted under profiling-a0-build-verdict.md. Candidate clean at 8bf3187; executable 121ebe20… and dSYM share UUID F3C49D4F-7EB6-3AFF-BFED-F26A2EE4CF56. Lead reproduced optimized core source-line lookup and checked retained hashes/compiler flags. Missing application-crate object warnings limit broader symbol coverage. No runtime speed observation yet.

(rev 0.18) Profiling Round 01 accepted with P1–P8 in its numbered verdict. Candidate independently rechecked clean at 8bf3187; report hash preserved. Next is an isolated optimized build with symbol/source-line proof, not runtime measurement or IMP-178 adoption. Sol subsequently reported an app-log reproduction candidate at t=58.4163 s, K=82, quality=2, correcting its earlier default-K inference; the 4.579 s pending interval is not displayed kernel time. Associated persisted settings are supporting historical evidence, not proof of every resolved runtime parameter or a coordinated quiet condition. Preserve that provenance in the build submission without new media/preferences investigation.

(rev 0.17) Owner update relayed by Code Lead: manual native picker works with the usual varied Desktop set, so the prior picker incident remains a computer-use/control blocker, not an app regression. Owner observed Wave 03 debug analysis at 6616 ms / 40 iterations / 180,000 samples during ML activity and roughly 4000 ms after a quieter relaunch; earlier builds are recalled at 20–60 ms. These are not matched experiment arms. Lead confirms displayed durationMs brackets run_kmeans only in color-core/src/analyze.rs:192–194. IMP-178 remains uncommitted in its independent 2cc2000-based worktree and is absent from Wave 03. Reserve IMP-202 after checking all eight registered worktree ticket filenames and all-ref commit subjects; no collision found.

(rev 0.16) Wave 03 independently accepted locally: SWEEP-003 at 4893477 then SWEEP-008 at 8bf3187. Seven-commit candidate is clean. Lead reproduced 222 frontend / 50 native / 1 scalar tests, 33-test focus and static gates. Separate Color Tool Wave 03.app packaged/launched; old bundle hash unchanged. Native video import was not completed; see the wave-03 verdict for exact blocker evidence.

(rev 0.15) Owner approves moving ahead. Candidate rechecked clean at 58880e0; remote main remains 5baa20e. Next bounded adoption is SWEEP-003 then SWEEP-008 under partial IMP-180. Both exact historical patches and current callers were re-read by the lead; no native/core/build dependency change is required. The prior packaged candidate remains open and is not silently replaced while Sol codes.

(rev 0.14) Candidate now ends at 58880e0 (IMP-201), five issue commits above main. Fresh unsigned debug 1.0.2 bundle built successfully with the tracked native lock enforced, then ran through actual two-image Colors/Values selection and composite PNG saving without Vite. Post-alignment gates: 209 frontend / 50 native / 1 scalar tests plus static checks, all pass with two existing Svelte warnings. Main remains unchanged. Exact identities, native steps and unrun checks are in RAG/reviews/EPIC-029/fresh-build-runtime-acceptance.md.

(rev 0.13) Build diagnosis confirms the forward JS pair alignment while preserving candidate native resolution. Provisional Cargo feature/constraint edits were removed; final build-repair scope is four files. Root lock SHA-256 before packaging is e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454. No native graph change is intended.

(rev 0.12) Reserve IMP-201 after checking all eight registered worktrees and all-ref commit subjects: no collision found, prior highest reservation 200. Native locks differ already: candidate dialog 2.7.3 versus main 2.7.2. IMP-201 preserves the candidate graph and repairs its packaging separately from SWEEP-009/011.

(rev 0.11) Wave 02 accepted locally at cf4c344 after 13b6340: SWEEP-009/011 join the earlier two issue commits. Independently reproduced 209 frontend / 50 native tests and applicable static/scalar gates. Still unmerged. Installed-app 1.0.1 observations are not current-candidate evidence; the owner explicitly requests a fresh build because hands-on acceptance may never have occurred. Current packaging version mismatch is a separate prerequisite, not a passing build or an excuse to bypass checks.

(rev 0.10) Owner settled UI-D1: preserve the app-wide selected study material as the user moves between views; collection selection changes that material without forcing a return to Colors. This is an adopted design rule, not newly implemented or validated UI behavior. Correctness wave 02 remains unchanged.

(rev 0.9) Correctness wave 01 is independently accepted as a local candidate, not main integration: IMP-179 at 271bee6 and SWEEP-004 at 6a17da6, in codex/correctness-wave-01-2026-09-05. The lead reproduced 185 frontend and 48 native tests plus static/scalar gates. Main/origin main remain 5baa20e. The prepared stack is clean and retained; the planning carrier remains separate and dirty. See the wave-01 verdict for exact SHAs, the hook-generated index exception and unrun release/human gates. IMP-179 remains in-progress awaiting integration and IMP-180 remains partial.

Initial September review and this dirty planning checkout use `2cc2000bce04ce2e6bda11a2853dd42595946980`. Rechecked after Round 01: local `main` and `origin/main` both resolve to `5baa20e021855fbc57aebf48fa0f9b3374ded281`, adding the core stdout-to-stderr correction. Current divergence from sweep is **4 / 33**. The next implementation floor is `5baa20e` or a newer explicitly reviewed tip; do not relabel historical tests as run on that base.

| Track                          | Verified state                                                                             | Next treatment                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| July control-flow sweep        | `f427ff40bf6efa2e332c9705830048e1b5cfe8bd`; 33 commits absent from main                    | Re-review and adapt; preserve SWEEP identities                     |
| Core extraction                | Three commits on main since sweep base `28d9e84`                                           | Preserve `color-core` ownership and IPC compatibility              |
| EPIC-026 live video            | Four unmerged commits at `7687642` on `codex/home-video-live-perf`                         | Separate feature acceptance after correctness work                 |
| EPIC-027 notebook UI           | Tracked epic in-progress; IMP-167 completed; implementation tickets remain planned/backlog | Keep design work; rebase logic-sensitive UI work after remediation |
| EPIC-028 July 9 remediation    | Historical completed AUD-001..021 work                                                     | Preserve history; July 19 residuals are a separate delivery        |
| AI-IMP-178 numeric performance | Active isolated worktree, not yet merged                                                   | Keep measurements and file ownership separate                      |

The shipping frontend is byte-identical to the pre-sweep base. All 22 July 19 defect diagnoses remain applicable to main, with native path adjustments. “Implemented in the sweep branch” and “accepted into main” are distinct states. Several proposed fixes require follow-up before acceptance; see the September reconciliation log.

Priority: restore the baseline gate, integrate the reviewed fixes into a candidate based on current main, repair remaining correctness/retention gaps, then consider the two export refactors. Live-video and notebook feature delivery remain separate epics.

Live-video handoff update: [PR4](https://github.com/animegolem/color-tool-kmeans/pull/4) is open and non-draft at `7687642`, but a live GitHub query on September 4 reports **CONFLICTING**, not mergeable. Its four successful checks completed July 19. The handoff's reported native measurements remain historical evidence, not a current-core revalidation. Review after core/ownership reconciliation; do not merge based on the stale handoff status.

## 4. Core invariants

### 4.1 Source and request ownership

Every completion must still own its request and source revision. Removal, replacement, cancellation, and unmount revoke that authority. A timestamp alone is not proof that displayed pixels correspond to it. A multi-part export uses one captured source/configuration/name throughout the job or fails explicitly when its source cannot be retained.

(rev 0.3) Selection intent, stable content/frame identity, and request execution tokens are separate. An active-view completion checks its selection epoch without advancing it; an independent export/Batch job follows its own captured job authority, not a later UI selection. Decode tokens are not part of reusable frame-content equality. Exact restoration proves stable frame/source/settings identity under a new valid request. Unknown equality means invalidate; do not relabel old results with a new revision or reset counters into an old valid identity. Requested and settled frames remain distinct.

(rev 0.4) Native backend/client/source-generation capabilities are distinct from renderer-local counters. A retained job admitted before source removal may finish derived work from its immutable job inputs; new root jobs for the revoked source fail. Reusing cached analysis additionally requires the same immutable input identity or verified digest as those job inputs. An opaque source generation, pathname or mtime/size pair alone does not prove equal bytes.

### 4.2 Published artifacts

(rev 0.71) Ownership rollout now uses explicit owner-approved retention-only R (§12.1). Protect all owners through flush; zero leases enables only class-eligible reclamation. No proactive hard admission quota is introduced. First193-A kernel authority does not yet implement the full publication, source or session protocol below.

Returned artifact paths refer to complete bytes that later producers cannot overwrite. Cache lookup identity and a writer's output identity are different concepts. Deletion requires all current owners to release the artifact, including analysis jobs, displayed results, pins, exports, and session caches. Unique filenames require a reclamation path. No blind count-based runtime deletion of live paths.

(rev 0.3) A single native registry with staging, publication and idempotent leases is the selected design direction, not an approved complete implementation. Capture export intent before the first await; acquire/snapshot inputs through an atomic native admission boundary before dependent work. Renderer reload, view disposal and backend restart require distinct ownership transitions. No blanket startup deletion of persistent snapshots/clipboard or unreviewed conversion of retention targets into hard admission quotas. Round 02 must resolve response/ACK loss, client-session replacement, source revocation during retained exports and legacy-cache handling.

(rev 0.4) The Round 02 protocol is accepted as the design basis, subject to C1–C3 in `RAG/reviews/EPIC-029/round-02-verdict.md`: native-established document ordering prevents stale bootstrap takeover; idempotent operation recovery/cancellation by client-session/request nonce handles lost grants/responses without requiring restart; cached results must match actual retained input bytes. A canceled nonce cannot later admit work. Native admission acquires all inputs/reservations or rolls back, publication uses response escrow, and ACK transfers a complete group before frontend exposure.

Preserve the legacy retention matrix and distinguish view unmount, renderer replacement, window destruction and backend restart. A healthy client's uncertain operation is reconciled before retrying it as new work. Safety does not depend on a timeout guessing that a slow client is dead. Groups are charged once, with actual published/staging bytes plus remaining reservations. These ownership rules do not approve new capacity limits or pressure behavior.

### 4.3 Numeric behavior

`color-core` remains free of Tauri dependencies. Preserve deterministic scalar/SIMD behavior and approved golden fixtures. Empty-cluster repair must refine a materially changed seed without forcing useless iterations for flat/low-distinct-color input. Performance comparisons must state when a correctness fix intentionally changes the baseline algorithm.

### 4.4 UI and exports

Keep Svelte 5 runes, local assets, and deterministic exports. Shared helpers preserve existing naming, MIME types, cancellation, options, and bytes unless a ticket expressly corrects them. Cleanup of queued UI work must survive the interval between scheduling and executing a callback.

### 4.5 Honest completion

An issue is accepted only after current-base validation and integration evidence. A source-confirmed concern is labeled as such until its regression is executed. No unchecked ticket boxes are marked complete from a plan, and no test failures are reclassified as passing with `it.fails`.

## 5. Current slice and delivery rules

(rev0.99, 2026-09-28) **Preservation is DONE:** plan commit 15144db (260 paths), merged to main as 28e5873 (--no-ff; RAG/INDEX.md regenerated by the repository script). The hook/CI commit is 046450d. **Current slice:** the hook-regression fix, reassigned to Astra and fenced to `scripts/ci/pre-commit.test.mjs` and `scripts/ci/hook-fixtures.mjs`. Then IMP-179's one-line fixture repair as its own commit. The redesign and Sol assignments are HELD for the owner's conversation with Astra and Sol.

(rev0.98, 2026-09-28) No implementation is assigned yet. First, the planning documents are preserved by a lead-owned, explicitly staged commit and a merge to main (the owner: "You two should review and work together and then merge it to main"), with the six privacy holds handled per section 13. Then come separate file-fenced assignments for Astra and Sol.

(rev0.97) Owner explicitly requests assistant launch. Separate imp-193-4-visible-owner-session-01-launch.md /L1..L4 authorizes exactly one run of frozen0e6237f7 into the reserved fresh output, followed by owner interaction. This supersedes owner-manual-launch wording only; no rebuild, production change, retry or193-5 authority.

(rev0.96) No further implementation assigned.193-4 preparation accepted under imp-193-4-visible-preparation-round-03-verdict.md /P16..P18. Preserve P8xk8N and all review roots. Await owner's readiness, then a separate exact-binary/host/namespace/fresh-output one-session launch record for the owner-initiated manual run. No automatic launch, source/build changes, polling, commits, cleanup or193-5 authority.

(rev0.95) Sole assignment:193-4 round03 under imp-193-4-visible-preparation-round-02-verdict.md, P13..P15. At most four existing P8xk8N files: driver, session if needed for actual helper/tests, audit self-test and README. Other eleven source files and both lead freezes read-only. Fresh round03 report plus ticket evidence/issues; offline/pure gates only. No launch/run output/production change/commit/cleanup;193-5 backlog.

(rev0.94) Sole assignment is193-4 preparation round02 under imp-193-4-visible-preparation-round-01-verdict.md /193-4-P7..P12: correct eight named existing files in the same P8xk8N source root, run offline/pure gates, submit fresh round02 report plus ticket evidence/issues. Other seven authored files and lead freeze immutable. No App/Window/WebView/--run/run output, new dependency/file/task, production change, commit or cleanup. Lead owns later preservation/review/launch;193-5 backlog.

(rev0.93)193-4-P1..P6 accepts the plan and assigns isolated preparation in color-tool-c1-visible-replacement.P8xk8N: fifteen authored files, same locked dependencies/features, generated target-visible/gen/schemas only, preparation report and ticket evidence. No App/Window/WebView/--run, source candidate/production change or commit. Lead owns review/freeze root and later launch gate.193-5 remains backlog.

(rev0.92)193-4-D1 records owner contract approval and assigns only the bounded visible-test pre-implementation plan under imp-193-4-visible-replacement-brief.md. Sol may write the fresh plan report plus ticket evidence/issues only. Lead owns the six-case test shape, fresh-root/path reservation, preparation verdict and separate launch gate. No implementation/build/runtime/commit authority;193-5 backlog.

(rev0.91)193-3 assignment complete; nothing further assigned.193-4 stays planned pending owner's proposed contract choice, then a bounded plan-only brief and separate preparation/launch gates.193-5 remains backlog. No more general source/harness rounds, runtime, source/feature changes, commits or merges authorized.

(rev0.90) Sole active assignment: Sol/Code Lead performs193-3 under imp-193-3-startup-authority-brief.md, one focused source-decision report plus that ticket's validated evidence/issues. No source/build/test/runtime/commit action.193-4 follows only if the ruling supports it and after a reviewed preparation/run fence;193-5 remains backlog.

(rev0.89) Proposed next sprint is EPIC-029 /193-3 startup-authority decision then, if viable and separately authorized,193-4 visible interface replacement/owner acceptance.193-5 production adapter is backlog. This turn authorizes planning/provenance only; Sol is not dispatched, no runtime/source/feature/commit/merge action. Child IDs193-1..5 are reserved here and in the epic. Subsequent sprint brief must name exact ticket range, base, files, gates and per-ticket commit responsibility.

(rev 0.88) The one authorized isolated retained-window experiment is complete; run-01-result accepts only finite hidden mechanics/forced controls. No active Code Lead assignment, rerun, visible app test, source/feature change, production193-B or cleanup. Further adoption needs explicit initial-document/owner-interaction gates.

(rev 0.87) retained-window-run-01-verdict accepts H25 preparation and authorizes only Review Lead C1-RW-RUN-01 on frozencbad33ec/fresh run-20260907-retained-first-reviewed. One hidden six-case run, no retry/source fix/config/production change. Code Lead stopped without polling.

(rev 0.86) retained-window-review-round-02/C1-H25 assigns only driver.rs/protocol.rs/README.md and a fresh Round03 report: route detected renderer-context and wrong Finished contradictions through native-child-scoped rejection with actual-helper regressions. Other source/lock/feature/dependency and production193-B fences remain. No launch or cleanup; preserve all prior evidence.

(rev 0.85) retained-window-review-round-01/C1-H21..H24 assigns only five existing spike files and a fresh Round02 report: returning event-loop/failure reconciliation, detected-context and native invoking-child binding, meaningful authority snapshot, complete/joined stale-release/ACK/guard cases, and nonvacuous resize/geometry proof. No lock/feature/dependency or other file change, no launch, no production193-B. Preserve original report/source/binaries and all earlier evidence.

(rev 0.84) correctness-wave-07-c1-retained-window-preparation-verdict.md C1-H17..H20 authorizes only14-path standalone PEEpxt preparation, offline compile and pure gates, with unstable confined to the new root. Six cases accepted as the bounded decomposition. No launch, candidate/source/feature change,193-B or production acceptance. H19 corrects report's terminal-before-exit ordering; Code Lead returns preparation report then stops.

(rev 0.83) Owner direction supersedes rev0.82's exploration hold, not the production gate. Assign correctness-wave-07-c1-retained-window-spike-brief.md Round01: exact-source pre-implementation review and one report only. Review Lead rules before preparation/compile/pure tests, then reviews the frozen artifact before a separate bounded runtime assignment. Only the fresh standalone crate may eventually enable public tauri/unstable; no candidate/main/app feature/source change, dependency version upgrade, private API, fork, whole-window product adoption or193-B. Code Lead uses the existing task; no polling.

(rev 0.82) No active Code Lead assignment. Single-incarnation-feasibility-verdict/C1-H16 recommends only an owner-approved isolated tauri/unstable retained-window spike, not production enablement. Await that direction before a new exact brief; no preparation/build/test/run/feature/dependency or193-B work. Whole-window replacement is not accepted.

(rev 0.81) C1-H15 in evidence-closeout-verdict accepts source facts with counterexample/attachment clarifications. Only single-incarnation-feasibility-brief is assigned: read-only public API/source check of one authority-bearing document per nonrenewable native WebView, including initial navigation and whether the OS window can be retained. No source/runtime/feature change or193-B; owner-visible replacement consequences must be reported before acceptance.

(rev 0.80) No further run or code authority. correctness-wave-07-c1-evidence-closeout-brief.md assigns only a focused read-only installed-source delta: native current-document premise, missing initial eval callbacks versus explicit JS receipts, and exact existing production attachment points. One closeout report; no general protocol review, compile, test, source change, machine provisioning or193-B.

(rev 0.79) correctness-wave-07-c1-harness-shutdown-correction-verdict.md accepts H14 and assigns only Review Lead C1-RUN-02, one exact2a08c1c5 invocation into fresh run-20260907-second-reviewed. Same isolation/timeouts/preservation, no source changes or automatic retry. Code Lead idle; no193-B.

(rev 0.78) C1-RUN-01 is spent and failed. correctness-wave-07-c1-harness-run-01-verdict.md assigns C1-H14 to Code Lead: driver.rs only, causal pure regression and explicit consumer/finalization lifetime correction, preserving real early-disconnect/trace/receipt/watchdog failure. No launch; exact new shutdown-correction submission and separate review precede any C1-RUN-02.

(rev 0.77) correctness-wave-07-c1-harness-preparation-verdict-round-03.md accepts preparation and assigns C1-RUN-01 to Review Lead: one invocation of exact3f0fc8ee on macOS26.6.2/25G83 arm64, fresh harness child run-20260907-first-reviewed, hidden/incognito/local/test-owned only. Five-minute watchdog and per-case bounds; preserve all output, no fix/retry/source/production action. Code Lead stays idle until a later assignment.

(rev 0.76) correctness-wave-07-c1-harness-preparation-verdict-round-02.md assigns only C1-H13: explicit actual-versus-synthetic page-load ledger provenance in existing driver.rs with real-helper before/after tests. Other13 harness files, both reports/snapshots, candidate and app remain fenced. Fresh Round03 report and offline pure gates required before lead considers first launch; no193-B.

(rev 0.75) C1-H7..H12 in correctness-wave-07-c1-harness-preparation-verdict-round-01.md assign correction in exactly six existing harness files: driver/protocol/trace/main, harness.js and README. Fix authority-bearing replies, diagnostic mutation, original-request idempotence, real lifecycle/exit handling, exact evidence joins and durable finalization. Preserve config/lock/icon/old report/snapshot/candidate; no launch or193-B.

(rev 0.74) Numbered C1-H6 in correctness-wave-07-c1-harness-amendment-01.md adds only harness assets/icon.png plus the existing config's bundle.icon reference. Continue preparation compile/pure tests under all prior fences; no launch or193-B. Active ticket text remains unchanged until the sitting settles.

(rev 0.73) C1-H1..H5 in correctness-wave-07-c1-runtime-seam-verdict.md govern. Sole assignment is correctness-wave-07-c1-harness-preparation-brief.md: build a standalone isolated macOS harness in lead-reserved color-tool-c1-harness.zvftHz. No candidate changes; offline compile/pure tests only, no launch before lead source/config/namespace review. No193-B or runtime fork.

(rev 0.72) correctness-wave-07-phase-193a-verdict.md accepts the metadata kernel only. Sole next assignment is correctness-wave-07-c1-runtime-seam-brief.md: inspect exact locked Tauri/Wry document/window/IPC/eval implementation and report C1 feasibility plus concrete evidence and smallest fence. Report-only, optional isolated non-running compile probe; no193-B source, app action or new general protocol review.

(rev 0.71) correctness-wave-07-phase-193a-brief.md is the sole current assignment. Implement only the native in-memory group/lease/reclamation kernel plus permanent tests and lib exposure at a0d9dd0. No command/FS/renderer/session integration yet. Section12 and numbered scope amendment193-01 settle retention-only policy and the future topology fence; future allowances are not present edit authority. Lead owns review/commit, Code Lead submits then stops without polling.

(rev 0.70) correctness-wave-06-verdict.md accepts all six local prerequisite slices througha0d9dd0. No next coding assignment. Code Lead stops without polling. Native193 awaits owner capacity behavior and approved numeric budgets plus lead's numbered current-topology fence amendment. Round02 C1–C3 stays binding; do not start a third general review, infer quotas, or treat prerequisites as registry implementation.

(rev 0.69) correctness-wave-06-phase-029-verdict-and-030-brief.md accepts029 and assigns030 only on cleanf1a30d1. Seven-path maximum includes direct sha2/rootlock, helper/lib exposure, commands frame/strip production builders, Values generation/removal, and existing audit_value_cache naming fixture. Require actual producer parity/collision/removal isolation, preserve prior slices. No migration/deletion fallback, registry/protocol, timing or app action. Lead owns commit; submit then stop before193.

(rev 0.68) correctness-wave-06-phase-027-verdict-and-029-brief.md accepts027 and assigns029 only on clean3d35787. One candidate file: commands.rs with in-module helpers/tests. Await blocking workers for analysis, Values, save, copy and grid; preserve current core, request/response/domain errors and analysis profiling admission/endpoint/finalization. No historical atomic-copy import, async FFmpeg change, dependency, protocol, timing or app mutation. Lead owns commit; report then stop before030.

(rev 0.67) correctness-wave-06-phase-021-verdict-and-027-brief.md accepts021 and assigns only027 on cleancaf8225. Four frontend bridge/parser/test paths; required native camelCase fields, nullable-required fps and bounded finite/domain checks without coercion. ExistingZod4.1.11/no deps or native changes. Real bridge malformed-reply failures before hookup plus positive/argument/invoke-error controls. Lead owns commit; report then stop before029.

(rev 0.66) correctness-wave-06-phase-019-verdict-and-021-brief.md accepts019 and assigns only021 on clean575868c. Two-file fence: value_analysis.rs source-generation directory and audit_value_cache.rs real producer/unchanged-source controls. No deps/locks, pruning, canonical IDs, publication or registry work. Different observed generations get separate output paths; path/mtime/length remains explicitly weaker than immutable bytes. Lead owns commit; report then stop before027.

(rev 0.65) correctness-wave-06-phase-022-verdict-and-019-brief.md accepts022 and assigns only019 on clean5d22118. Three-path maximum: compose_grid.rs, nativeCargo.toml existing tempfile promotion and rootCargo.lock only if required; no native-local lock exists. Regression-first unique retained PNGs, concurrent/later-call byte preservation, deterministic same-input bytes and bounded failure controls. Lead owns commit; report then stop before021. No193 or quota work.

(rev 0.64) correctness-wave-06-phase-022-amendment-01.md authorizes only audit_value_cache.rs helper/control correction; preserve the four submitted production hashes and original report. Acquire minimal Windows timestamp-write access plus directory semantics, verify real file/directory modified times and unchanged bytes, retain producer regression/AUD-005 and rerun final gates. Submit round02 then notify/stop. No019 or193 authority.

(rev 0.63) Supersedes the read-only assignment: implement only adaptedSWEEP022 under AI-IMP-180, exact clean933d888 and five native/source-test paths in correctness-wave-06-delta-verdict-and-022-brief.md. Remove blind periodic/completion pruning, preserve startup retention and explicit removal behavior. Lead owns issue commits; report then stop. Proposed serialized order022 ->019 ->021 ->027 ->029 ->030 requires a new exact-base assignment per issue. IMP193 source fence amendments and coding remain pending; C1-C3 unchanged.

(rev 0.62) correctness-wave-05-verdict.md accepts bounded renderer source and assigns ONLY read-only193 delta review on933d888: exact historical prerequisite presence, current writer/release topology, smallest adoption fences and remaining pressure decision. Existing Round02 C1–C3 remain authoritative; no new general protocol review or coding/quota/cleanup authority. One report then notify/stop.

(rev 0.61) Continue183 only under correctness-wave-05-phase-183-amendment-01.md. Same11-path fence; add three meaningful pre-fix regressions, correct cached new-selection hints before subscriber dispatch, canonical snapshot currentness and active-scrub scheduling. Preserve original report, return round02 and rerun full final-wave gates. No next ticket/Git/app/cleanup authority.

(rev 0.60) correctness-wave-05-phase-182-verdict-and-183-brief.md releases183 only at8a8e133: six production/five test paths, requested versus accepted settled identity, terminal local disposal, same-epoch exact-entry reuse or successor acquisition, owned metadata-probe reacquisition and settled-only snapshots. Preserve192/182/wave04 and profiling. No outside-fence/native/timing/independent-job work; final native/scalar gates now required.

(rev 0.59) correctness-wave-05-phase-192-verdict-and-182-brief.md assigns182 only on clean2853040. Two existing test paths: Home video-controller-cache-reset and audit-control-flow-races. Prove seek/step during cached restore debounce/IPC plus actual store/runner new-analysis identity; preserve no-step fresh extraction, cachedA/freshB and stored-entry remount positives. Production/other files are fenced; actual defect requires a lead amendment before implementation.183 remains held.

(rev 0.58) Continue only192 under correctness-wave-05-phase-192-amendment-01.md and the original18-path fence. Preserve original submission, add a round02 report, correct cleanup/line-count reporting and rerun original gates.182/183 remain held until lead acceptance and a named committed base.

(rev 0.57) Implement phase192 only on clean41222c5 under correctness-wave-05-implementation-verdict.md. Eighteen exact paths include App clipboard extraction plus its executable test and two compatibility-fixture amendments; no183 lifecycle production or182 scenario implementation yet. Capture activated ingress intent before awaits, propagate immutable selection epoch, reject stale same-intent settlement before side effects, and preserve non-activating library work. Lead reviews/commits192 before naming the next base. No native/profiling/timing/job ownership scope is added.

(rev 0.56) Wave04 source accepted by correctness-wave-04-verdict.md; IMP181 stays in-progress pending integration, while its implemented source/test checklist is validated. Next assignment is correctness-wave-05-review-brief.md, a focused read-only preflight for IMP192 followed by reconciliation of IMP182/183 and their actual historical prerequisites. One report/private repro only; no candidate source/Git/app/build edits. Do not reintroduce the removed cached-preservation branch to satisfy obsolete ticket prose. Lead continues separate scheduling scope; no timing implementation is assigned.

(rev 0.55) correctness-wave-04-phase-017-verdict-and-181-brief.md accepts017 and assigns181 at cleandbfad26: only analysis-runner.svelte.ts, new analysis-runner-revision.spec.ts and profiling-contract.spec.ts. Consume normalized revision in both seeded and scheduled keys, retain existing cancellation/profiling/delay/numeric behavior, and prove actual ingestion/store/runner dispatch convergence and unchanged remount reuse. No further source scope or new owner decision. Full final-wave gates now required before submission; lead reviews and owns the commit.

(rev 0.54) correctness-wave-04-phase-010-verdict-and-017-brief.md accepts010 and assigns017 only on clean44d7f57. Five paths: image store, multi-analysis store, image lifecycle test, new multi lifecycle test and new Batch runner revision test. Store-owned fresh non-recycling revisions and pinned-content invalidation; real next explicit Batch Analyze regression. No runner key/181, timing, native, app, Git or tracking edits by Sol. Submit and notify lead, then stop for the next exact-base ruling.

(rev 0.53) correctness-wave-04-implementation-verdict.md accepts adapted010->017->181 with issue-wise lead commits. Phase010 six-file source fence is active now; stop/report for lead review before017 changes. No new owner decision, capture or debounce change. Lead selected clean committed profiling baseline9215711; the prior57-path preservation fence is now an exact committed prerequisite, not an uncommitted carrier.

(rev 0.52) Resume via correctness-wave-04-review-brief.md: focused pre-implementation verification of SWEEP010/017 prerequisites then IMP181, one report only plus optional private repro. No new whole-app audit. Lead separately owns gesture-aware scheduling scope; timing changes do not enter correctness wave04. Preserve57 profiling paths and B20/build identities; lead rules source integration and atomic commits before edits. Earlier broad hold is superseded only for this bounded review; graph heartbeat stays paused.

(rev 0.51) B20 is reviewed and ready for owner discussion under profiling-b20-visible-attribution-verdict.md. No further capture, source/build/Git change or idle polling is assigned to Sol. Lead delivers the bounded graph and pauses the existing follow-up; preserve current candidate/build/evidence. The next performance/interaction scope requires a new ruling, not another automatic acquisition loop.

(rev 0.50) B20 assigns one new b20-visible-20260906-01 session on unchanged B14 after exact old-PID preservation/normal quit. Actual Raise/titlebar foreground control plus two visible completed warm-ups must pass BEFORE one120s profiler capture with two settled46/45 targets. Five-second foreground no-AX dwell reduces observer interference; no hidden-result retry loop. Scope §10.28, no source/build/Git changes.

(rev 0.49) B19 permits preserving old B14 sealed evidence/carrier snapshots, normal Quit of verified exact PID, one new detached session b19-attribution-20260906-01 on unchanged B14 bundle, same still/setupK45q3snapfalse, one120s Time Profiler attachment to new native PID with settled46/45 actions, Finish/seal and private exports/symbolication/binding. Exact scope in §10.27; no source/build/Git changes or other-app/all-process recording.

(rev 0.48) profiling-b18-r1-review-verdict.md authorizes only existing B18 checker/test signed-zero guard and production regression, repeated gates and new suffixed evidence/report. Preserve original B18 receipt/report and unchanged B14 app; lead concurrently prepares installed-profiler acquisition, no capture assigned yet.

(rev 0.47) B18 authorizes only trace-integrity.mjs and profiling-trace-integrity.test.mjs repair, full repository gates and new offline B16 numerical reinspection receipt under private color-tool-profile-b18.LVNlpB. Preserve other55 source files and all sealed app/evidence/Git state. No app rebuild/control; stronger endpoint-shift/boundary tests are binding.

(rev 0.46) B16 sealed session is finished and immutable. B17 brief authorizes focused installed numerical-roundtrip/coherence review with private explicitly named offline Rust/JS probe and one report. No candidate edits/app build/control/Git/trace changes. Propose bounded comparison/regressions before implementation; preserve source57 and B14/B16 identity.

(rev 0.45) B16 narrow authority resumes existing B15 session/PID18954 from lead-completed import; no launcher/restart/picker repeat. New private continuation evidence and ordinary remaining B15 controls only. Verify actual PID/root/selection/header continuity before attachment; preserve original B15 stop and all artifacts. Capture errors require read-only delivery checks before retries.

(rev 0.44) B15 brief alone admits one exact B14 detached launch/session b15-control-20260906-01, supplied PNG and ordinary numeric/checkbox/range/navigation/Finish controls. Exact runtime and private evidence/report only; no source/build/Git/old-app changes or performance run. Preserve all actual actions, honest intermediate supersession and immutable copies before final navigation.

(rev 0.43) profiling-b14-build-brief.md authorizes fresh isolated optimized/symbolized build for exact accepted source under Color Tool Profile B14/com.color.tool.profile.b14.r8bf3187. Generated build/private evidence and one report only, normal ignored frontend output permitted. No source/Git/app/runtime action or old artifact replacement. B13 coding is complete.

(rev 0.42) B13 authorizes only ParameterControls.svelte six capture hooks and profiling-svelte.spec.ts contract/label corrections, plus one submission. Preserve other55 baseline files and57-path carrier; full gates allowed. No build/app/browser/Git action, production scheduling change or wider repair. B12 private diagnostics are complete and immutable.

(rev 0.41) B11 is finished diagnostic evidence, not a resumable capture. B12 brief assigns isolated trusted-browser ordering proof and exact repair fence under IMP-202; private fixtures may compare current/capture-hook variants with installed dependencies. No candidate edit, production scheduling change, native build/app control, full suites or Git operations. Lead must promptly rule on the returned scope rather than substitute a watcher for handoff.

(rev 0.40) profiling-b11-v2-control-proof-brief.md authorizes one exact B10 detached launch/session b11-control-20260906-01, supplied still, ordinary empty-intermediate45->46->45 and Values-hosted Finish with bounded coherent-pending retries. B10-only runtime/private B11 evidence and one report; no source/build/Git change, restart/resume, other-app control, injection or performance experiment.

(rev 0.39) profiling-b10-build-brief.md authorizes build-only preparation in color-tool-profile-b10.h6bbb9 from accepted dirty57 source. New Color Tool Profile B10 / com.color.tool.profile.b10.r8bf3187, fresh target, packed matching symbols and strict provenance. No source/config/Git/runtime changes or launch; preserve all earlier builds/evidence.

(rev 0.38) profiling-b9-round-01-verdict.md assigns H1-H2 only in import-trace-run.mjs, trace-record.v2.schema.json and profiling-trace.test.mjs plus one Round02 submission. Preserve other17 B9 files/37 baseline files; full gates allowed, no app/build/runtime/Git activity.

(rev 0.37) profiling-b9-invalid-input-implementation-brief.md authorizes20 exact source/test paths (one new v2 schema) and one submission under B8 verdict G1-G7. Implement strict unavailable-config persistence across renderer/native/parser/importer; preserve internal resolved values and all production behavior. Full gates allowed; no packaging/app/runtime/Git operations. B8 report-only restriction is superseded only within this fence.

(rev 0.36) B7 ended failed, not resumable. Current profiling-b8-invalid-input-repair-brief.md assigns focused current-dependency reproduction, schema/fence proposal and one report, with bounded in-memory/private temporary harness allowed. No candidate source changes, full suites, native execution/build, app control/restart, runtime writes or Git mutation. Lead owns prompt implementation ruling after B8; no owner decision is pending.

(rev 0.35) profiling-b7-control-proof-brief.md authorizes one exact B6 detached launch with session b7-control-20260905-01, the exact supplied still,45→46→45, Values-hosted Finish and bounded pending retries. B6-only runtime/private evidence allowed; no source/build/Git changes, other-app control, restart/resume, direct IPC/injection or benchmark. This is a diagnostic control/strict-raw-integrity run, not eligible acquisition or performance comparison.

(rev 0.34) profiling-b6-build-brief.md alone authorizes new locked/offline optimized packaging in color-tool-profile-b6.fnWyNO with product/window Color Tool Profile B6 and com.color.tool.profile.b6.r8bf3187. Preserve all56 source paths and B2/A0 artifacts/processes; no source/config/dependency/Git changes or app launch/control/capture. Lead owns acceptance/integration.

(rev 0.33) profiling-b5-finalization-implementation-brief.md assigns eleven exact renderer/test paths plus one report under B4 verdict F1–F5. App-header profiling-only control, strict finalize bridge, serialized sticky drain and typed state only. Preserve all other A1/B1/native/core/config/importer bytes and immutable B2; tests allowed, no app build/control/capture or Git mutation.

(rev 0.32) B3 UI smoke is settled under profiling-b3-smoke-02-verdict.md. Only profiling-b4-finalization-review-brief.md assigns the next Code Lead action: one read-only source-boundary report for safe operator quiescence/drain/native seal. Leave B2 open untouched; no new implementation, build, app control, capture or Git mutation. Lead retains the control-surface ruling.

(rev 0.31) profiling-b3-smoke-01-verdict.md explicitly adopts existing PID67432/start20:29:26 for a non-timed smoke02, superseding only the new-launch requirement/output location. Reuse the retained UI-controller object and verify stable identity before/after first state read. No restart, process substitution, source/build/Git change or tracing. Preserve smoke01; new evidence goes in b3-smoke-02.xvIUy8 and a separate submission.

(rev 0.30) profiling-b3-smoke-brief.md now authorizes one exact-executable B2 launch with profiling explicitly disabled, B2-only runtime persistence, the owner's exact attached palette-wheel still reference and bounded Colors/Values/Exports/parameter/reflow checks. No source/build/dependency/Git change, other-app control, owner media mutation, profiler or timing comparison. Preserve private evidence and leave identified B2 open for lead inspection.

(rev 0.29) B1 source is prepared and uncommitted. Only profiling-b2-build-brief.md authorizes the next Code Lead action: locked offline optimized app packaging in the newly reserved color-tool-profile-b2.wLOiuF root, unique com.color.tool.profile.b2.r8bf3187 identifier, command-local packed debug info and no stripping. Preserve all53 source paths and every prior artifact. No source/config/dependency/Git change or app launch/capture.

(rev 0.28) profiling-b1-round-02-verdict.md D1–D4 assigns a focused correction in eight existing native/adapter/test paths only, plus a new Round03 submission. Preserve the other29 B1 files and all sixteen A1 files. No additional refactor round, app build/launch/capture, source-policy change, dependencies, Git or IMP-178.

(rev 0.27) profiling-b1-round-01-verdict.md C1–C8 governs one consolidated correction pass: original eighteen B1 files plus nineteen exact optional extraction/test paths. Preserve A1 and all other files. Add explicit observer session finalization within existing profiling command/bridge files; no actual app build/launch/capture, dependencies, core/cache/video/other-view changes, Git or IMP-178.

(rev 0.26) Authorize exactly eighteen B1 source/schema/test files plus one submission under profiling-b1-implementation-brief.md. Observe analysis-affecting Colors input through native aggregate, store receipt and DOM/RAF2; preserve production semantics, all sixteen A1 files and core/video/other-view fences. No app build/launch/capture, dependencies, Git operations or IMP-178. Delegate implements and submits; lead owns acceptance.

(rev 0.25) A1 settled under profiling-a1-round-03-verdict.md. Code Lead now receives only profiling-b0-boundary-review-brief.md: source-boundary/delta review for a minimum Colors input→result→DOM/RAF2 trace, one new report, no implementation or app control. Assess a vertical slice before fine-grained core instrumentation; preserve existing authority/numeric contracts and all accepted A1 files.

(rev 0.24) profiling-a1-round-02-verdict.md assigns only R9–R10 corrections in five named existing A1 files plus a new Round 03 report. Other eleven A1 files and all tracked source remain unchanged. Recompute A0 summary without duplicating the evidence corpus. No app control/build/instrumentation/Git operations or IMP-178 integration; lead retains review authority.

(rev 0.23) A1 Round01 verdict R1–R8 assigns corrections and eight additional named validation/I-O/test modules (16 A1 files total). Public facade retained; no app/core/build/dependency/config/Git changes or IMP-178. Sol implements new regression proofs, reruns full gates and submits a separate Round02 report; lead owns acceptance.

(rev 0.22) profiling-a1-implementation-brief.md authorizes eight new Node-only tooling/schema/test files on the existing clean candidate, plus one submission. Sol does no app control/build/instrumentation/Git operations. Lead may inspect/control the isolated A0 app and preserve capture/control proof; no all-process tracing or owner-workload manipulation. Source instrumentation B requires its own reviewed fence.

(rev 0.21) Run-01 is settled under its R1–R5 verdict; Code Lead stops. No automatic instrumentation, all-process recording, rebuild or IMP-178 adoption. Next direction is reproducible full-interaction evidence with reliable material/frame selection and durable capture, followed by bounded correlated tracing under a separate brief.

(rev 0.20) Authorize profiling-a0-run-01-brief.md: native test-bundle launch, UI configuration/import/seek, 2 warm-ups plus 7 fresh-analysis warm-process observations and optional 3 separately labeled fresh-process trials. Isolated app state/logs and private run evidence only; no source/build/Git changes, IMP-178 adoption, instrumentation or owner workload manipulation.

(rev 0.19) A0 build assignment is settled. Preserve prepared artifacts; Sol stops without polling. Next is owner case/quiet-window confirmation and a separate measurement brief, not automatic launch, instrumentation, symbol repair or IMP-178 adoption.

(rev 0.18) Authorize only profiling-a0-build-brief.md against clean 8bf3187: generated isolated release artifacts, symbols, private build manifest and one submission report. No tracked source/configuration/dependency/lock changes, app launch, tracing, workload manipulation, media inventory, Git mutations or IMP-178 integration. Stage A1/B/C and actual A0 measurement require subsequent bounded assignments. This supersedes rev 0.17's no-build restriction only for the named preparation slice.

(rev 0.17) Prioritize IMP-202 real-app profiling design/review under §10 before another correctness/performance implementation slice. The next Sol assignment is profiling-round-01-brief.md, read-only except its new report. No builds, instrumentation, profile recording, app interaction, performance integration or Git mutations in this round. Source review will propose exact staged fences; lead verdict precedes implementation. Preserve seven-commit candidate and both independent performance/live-video lanes.

(rev 0.16) Wave 03 coding is settled and no next implementation range is dispatched. Lead created one commit per issue. Native follow-up remains before claiming video acceptance: picker selection did not admit the generated MP4 and capture/window-control became unreliable. Do not broaden source fixes or replace the old bundle based on an ambiguous UI attempt.

(rev 0.15) Authorize correctness wave 03 on 58880e0 in the same isolated candidate: SWEEP-003 cached reset and SWEEP-008 settled snapshot only. Exact five-source-file fence, W3-1/2 test/identity limits, and report path are in correctness-wave-03-implementation-brief.md. Prior general review is accepted; Sol checks current preconditions then implements, self-reviews, reports and stops. Lead owns commits, native rebuild/testing and all tracking. No UI implementation, unrelated adoption or main/ref/publication changes.

(rev 0.14) IMP-201 four-file repair is committed at 58880e0, with only hook-generated INDEX metadata additionally included. Sol's bounded build diagnosis is complete; no next coding range is dispatched. Fresh candidate is left open for owner inspection; full native regression, later correctness waves, and main integration remain separate work.

(rev 0.13, B1 supersedes rev 0.12 feature/cap scope) Keep only .gitignore, root Cargo.lock, package.json and package-lock.json. JS API 2.11.1 and dialog 2.7.3 are aligned; unchanged CLI/Store are already sufficient for the diagnosed check. Official installed CLI changelog says custom-protocol is no longer required and ignored; no application Cargo.toml delta remains. Optional all-family caps, CLI/Store upgrades and release-workflow hardening are deferred. Candidate-only npm-10 lock generation/install is authorized; no mismatch bypass.

(rev 0.12) IMP-201 authorizes exactly .gitignore, root Cargo.lock, native Cargo.toml custom-protocol/Tauri-dialog constraints, and the two JS package/lock alignments. Candidate-only npm-10 installation/lock generation is permitted for this build repair; prior no-install fences continue to apply to other waves/worktrees. Preserve tested native dependencies, enable bundled frontend assets, and run locked packaging without mismatch bypass. No application behavior rewrite.

(rev 0.11) Owner authorizes producing and running a fresh local remediation-candidate build, including the minimum diagnosed build repair, then computer-use inspection of real workflows. Review Lead owns build changes as a separate issue commit, with exact file scope recorded before edits; no version-check bypass, broad upgrade, UI redesign, installation over the existing app, merge or release. Sol's wave 02 is settled; its current narrow assignment is read-only build-dependency diagnosis. Preserve both prior submissions and all other worktrees.

(rev 0.10) UI-D1 is settled in §9.3; synchronize the inactive collection ticket and design coverage only. This ruling does not add UI work to Sol's active correctness wave or authorize edits to its assignment. UI-D2 and the collection's runtime prerequisites remain holds.

(rev 0.9) Wave 01 is settled under its independent verdict. Continue correctness with SWEEP-009 then SWEEP-011 only (partial IMP-180), building on accepted candidate 6a17da6 in the same isolated worktree. The wave-02 implementation brief is the exact nine-source-file fence and carries bounded source-review corrections: own-key media lookups, cleanup restricted to supported owned clipboard formats, and actual-caller regression proof. Preserve wave-01 commits and all unrelated lanes. Sol leaves changes uncommitted, reports and stops; the lead reviews and creates one issue commit each. No UI implementation, merge, PR, release, native quota or general publication redesign is authorized.

(rev 0.8) The owner explicitly authorized correctness work to continue while the lead frames design questions. Implementation wave 01 is now authorized for IMP-179 plus IMP-180's SWEEP-004 only, in codex/correctness-wave-01-2026-09-05 at freshly fetched 5baa20e. The exact candidate and nine-file fence are in reviews/EPIC-029/correctness-wave-01-implementation-brief.md. Sol implements/self-reviews and leaves changes uncommitted; the lead independently validates and creates one commit per issue. No UI implementation, other sweep adoption, native quota/publication change, performance change, merge or PR is implied. Prior review-only authorizations remain historical, superseded only for this named slice.

(rev 0.7) UI Round 02 is accepted for test-seam design and local proof; the lead reproduced 2 files / 17 tests, including the unchanged race audit. UI-T1 is resolved. No more pre-implementation review is requested. Next is a separately issued bounded 168 → 169 → 195 implementation brief in a fresh-main isolated candidate; this compatibility verdict authorizes no production edits, commits or merges.

(rev 0.6) UI Round 01 is received. Its numbered verdict accepts C2–C6 with inventory/archival clarifications; C1 needs a focused test-harness addendum because the installed Svelte plugin expects Vite 6/7 while Vitest uses Vite 5. A direct-plugin diagnostic failed before component loading. Round 02 is limited to executable compatibility evidence and exact future file scope, not another general design review. No foundation implementation is authorized yet; all prior EPIC-029 rulings remain unchanged.

(rev 0.5) The owner authorized drawing the missing UI surfaces, cutting/refining tickets and assigning Sol. This opens EPIC-027 UI Round 01: review the foundation range IMP-168 → IMP-169 → IMP-195 against current main, with the refreshed downstream map as context. It is not a third EPIC-029 protocol review. No production code is authorized by this first dispatch; a bounded implementation verdict follows a source-verified review. Repository rules leave commits with the review lead; a future candidate is an isolated checkout based on fresh reviewed main, with one commit per accepted issue/ticket. Keep the existing dirty planning carrier and independent performance work intact.

Current authorization is review and planning. EPIC-029, reconciliation, tickets and the brief are prepared; the owner then authorized notifying the existing Code Lead, and Round 01 has been dispatched (rev 0.2). No production implementation, branch merges, commits or publication is authorized by this review assignment.

(rev 0.3) Round 01 is received; `RAG/reviews/EPIC-029/round-01-verdict.md` requests a focused Round 02 addendum. The lead synchronizes its numbered amendments into tickets now that Round 01 has settled. No coding assignment is issued. Optional IMP-189/190/194 remain outside required acceptance; low-risk adoption is not globally blocked on performance, while overlapping math is coordinated.

(rev 0.4) Round 02 is accepted with binding implementation clarifications; the general protocol review is finished. No code assignment is issued yet. The first bounded coding slice may cover IMP-179 or disjoint adoption without waiting for native quota policy. Dependent tickets require their named source patches to be present, not closure of the aggregate IMP-180 while unrelated math is outstanding. For shared consumers, integrate Values185 before export184, then Batch186.

The original sweep branch is an immutable review input for this round. A future integration candidate starts from fresh main and imports reviewed issue changes with their SWEEP tags. Do not restore obsolete `tauri-app/src-tauri/src/kmeans.rs` or duplicate core analysis in commands. Regenerate the RAG index after conflict resolution; never choose a stale generated side wholesale.

Review rounds: diagnosis and permitted files first; lead verdict second; implementation and self-review third; independent lead verification before acceptance. Review submissions state base/head, round, files, provenance, test counts, and unresolved concerns. Store a numbered submission and verdict under the epic's review directory; preserve earlier rounds. No timer, poller, or notification loop is installed by this draft.

Identifier reservations checked against fetched refs and registered worktrees, including uncommitted work: AI-IMP-178 belongs to performance; **AI-EPIC-029 and AI-IMP-179 through AI-IMP-194** are reserved for this remediation plan. Recheck before creating any identifier beyond this range. Unused reserved numbers are not completed tickets.

## 6. Acceptance

(rev0.99, 2026-09-28) Hook CI is NOT green on main yet. The lead's .gitattributes exemption (RAG markdown whitespace), added after the lead had reproduced 63/63, makes one negative regression pass (its bad fixture lives under RAG/). Astra found it. The fix: move that fixture outside RAG/, add positives for preserved RAG whitespace, and keep conflict-marker rejection inside RAG/. The pre-addition 63/63 stands as historical evidence only.

(rev0.98, 2026-09-28) IMP-193-4's acceptance is still the owner's six visible cases plus their verdict. Session 01 produced no acceptance (a timeout, no dispositions); session 02 is owner-reported. By the lead's ruling, it gates nothing in the first usable web app. IMP-193-5 and IMP-202 keep their own, separate decisions.

(rev0.97) Startup/launch is not acceptance. Two preparation items remain checked and three runtime/owner items open; owner alone records hands-on dispositions and acceptable/unacceptable feel.

(rev0.96) Check193-4's isolated-artifact preparation/review item after complete independent source/gate/freeze review; two items checked total, three runtime/owner items remain open.62 tests include seven actual helper regressions; duplicate-terminal lead probe now passes. No native callback schedule, visible behavior, first-responder/paint/Space feel or owner adoption inferred from preparation. Explicit owner acceptable/unacceptable verdict still required.

(rev0.95) R2's55 green tests do not close preparation. Protocol-current candidate receipts must precede session admission without enabling owner controls; stale predecessors remain isolated and candidate contradictions settle the owned startup/recovery. Both protocol/session guards must be released before main-thread native sampling. Actual duplicate-terminal fixture must contain two terminals. Permanent tests must exercise actual adapter helpers, not only separate protocol/session models. Four remaining193-4 acceptance boxes stay open.

(rev0.94) R1 is not preparation-accepted despite43 green baseline tests. Required corrections: watchdog and actual process exit, ledger-independent bounded self-only failure supervision, callback conflict/current-contradiction routing, main-thread native sampling plus actual live geometry/coverage comparison, native case-progress projection/focus labels, and truthful validator timestamps/exit/row corroboration. Pure tests must exercise runtime-used helpers. No automatic owner-acceptance claim; all four remaining193-4 checklist items open.

(rev0.93)193-4 preparation must preserve exact-original authority, stale-child isolation and one owned recovery attempt. Validate actual runtime-used session/teardown helpers, distinguish machine errors from owner met/failed/untested, and test the ledger validator itself.20-second machine-operation waits are separate from30-minute owner-session watchdog. Native/window/DOM/owner focus and paint evidence remain distinct; no source fact is a visible pass.

(rev0.92) The trusted-local/single-document/fail-stop contract is owner-approved. This does not establish complete process-replacement detection, startup liveness, renderer authentication, pending-response routing or production readiness.193-4 must separately establish visible focus/input/first-paint, retained native state, geometry and relevant window-mode behavior; owner feel cannot be checked by an agent. Simulated loss is not actual process-crash evidence.

(rev0.91)193-3-D1 accepts conditional source exclusion: wrong-document receipt poisons before bootstrap, missing receipt cannot fulfill its continuation, and exact NotReady retry never mints successor authority. This is trusted-local application reasoning, not hostile-renderer/frame authentication or all-platform proof.193-3-D2 preserves unknown startup liveness, initial-empty injection, process-replacement detection coverage and ordinary command-response routing. A proposed obligation to retire on replacement is not demonstrated detection or production recovery.

(rev0.90)193-3 must distinguish actual trusted-local initialization guarantees from arbitrary-renderer assumptions, trace exact locked native/init/IPC behavior and return go/constrained-go/no-go. Review Lead/owner retain changes to the invariant or product contract. One report may validly conclude no-go; no unbounded experiment loop.

(rev0.89) Proposed sprint exit is an explicit adoption go/no-go with source assumptions and owner interaction evidence, not full193 completion.193-3 can close with an evidence-backed no-go;193-4 may then defer. Each implementation ticket requires a cohesive regression-bearing commit and independent acceptance; report, candidate acceptance, main merge and owner verdict remain separate receipts.

(rev 0.88) Accept actual exit0 plus independently audited198 contiguous rows,6 cases/43 receipts, native retention, exact requested bounds and unchanged successor/owner snapshots. Do not promote this finite result to initial-frame authentication, all schedules, native child destruction, ordinary pending-response routing or visible UX. No about:blank/contradictory context was observed; H25 negatives remain pure-test evidence.

(rev 0.87) H25 actual receipt/Finished helper guards and44 pure regressions pass preparation review. Runtime success requires actual exit0 plus reviewed contiguous six-case/receipt/terminal evidence, not ledger text alone. Finite hidden mechanics cannot establish unknown initial binding, ordinary pending-response routing, native child destruction or visible UX.

(rev 0.86)35 pure tests independently pass but do not cover detected wrong-document receipt/Finished paths. These observations must poison only their captured native child and fail completion, not remain unmatched backlog until a later positive receipt passes. Matching diagnostics are not native frame identity. Returning-loop/ACK and stale-owner/marker corrections are accepted as preparation; retained geometry evidence covers only inner size/scale/opaque identity plus child bounds, not window position or visible UX.

(rev 0.85)20 passing pure tests are insufficient: actual runtime-used finalization/delivery/matcher helpers must catch failures, late receiver/ACK loss and wrong receipts. App::run is non-returning; accept only explicitly reconciled returned-loop/driver/ACK/fault state before process success. Detected about:blank/wrong native context must reject before admission without calling matching renderer fields native identity. Snapshot must detect current authority retirement; resize must match a post-request actual event and target geometry. Initial unknown binding and visible UX remain open, not repaired by overclaiming these guards.

(rev 0.84) H17 requires actual parent pointer/event/geometry observations without claiming native child destruction or visible UX. H18 preserves exact-original recovery and session-specific/native ownership using real registry positive and stale controls. H19 requires exit-request/finalizer-ACK ordering, real late-callback/receiver/trace regression gates and separate actual process status; flush is not power-loss durability. All compile/source evidence remains preparation only, and initial document binding remains conditional/open.

(rev 0.83) Evaluate retained native-window identity/geometry/lifetime separately from conditional one-incarnation admission. H16 exact-original lost-ack confirmation must remain idempotent without new authority or duplicate allocation; initial empty-document binding stays an explicit open premise. Hidden runtime observations cannot establish flicker, focus feel, Space/fullscreen or owner acceptance. No production/C1-C3 checkbox closes from spike preparation or a finite run. Preserve all prior harness sources, binaries and both ledgers.

(rev 0.82) Source feasibility does not prove initial-document binding or retained-window interaction quality. Exact-original lost-ack recovery/idempotence remains mandatory; nonrenewable authority does not mean blindly rejecting every already-active retry. Any future isolated spike still needs source/compile/pure review before runtime and separate production acceptance.

(rev 0.81) Do not ship the renewing eval mechanism based on finite run success or treat absent explicit guarantees as an observed WebKit bug. Nonrenewable-incarnation direction is only a design hypothesis; initial about:blank/navigation/identity and public API feasibility must be source-checked. No renderer retirement may revoke independent native owners or flush caches.

(rev 0.80) Accept C1-RUN-02 as complete selected-schedule macOS evidence, including H14 shutdown; first run remains failed. Synthetic controls/missing callbacks do not establish platform guarantees. Any remaining native document-ordering premise must be explicitly source-closed or recorded open before production adapter authority.

(rev 0.79) Second run must independently produce seven ordered completions, final terminal row and exit0 with reconciled evidence. H14's29 pure tests do not supply that platform result; failed first run remains failed. No cross-platform/universal/production acceptance from finite macOS success.

(rev 0.78) Seven case-completed rows did not make the first run pass; terminal ledger gate rejected exit0 and process exited1. Preserve partial bounded observations but do not close runtime/C1 acceptance. H14 must test legitimate late callback during finalization versus unexpected early disconnect and genuine taint; all27 existing tests remain.

(rev 0.77) First run must reconcile actual ledger sequence, all seven ordered case completions, final success row and exit outcome. Partial/missing/failed observations remain failed or inconclusive; no empty/zero-exit-only pass. Preparation27 is not platform evidence. Finite macOS success cannot close universal/cross-platform C1 or production193.

(rev 0.76) All25 current pure tests and preparation static/build gates reproduced. C1-H13 requires actual serialized Started/Finished rows to retain call-site provenance; injected callbacks cannot count as platform observations. Source corrections are accepted within preparation only; first macOS runtime evidence and production C1-C3 remain unaccepted.

(rev 0.75) Require compiling before-fix assertion failures and permanent actual-helper regressions for C1-H7..H11, then all pure/offline preparation gates. Ordinary bootstrap replies must contain no grant, telemetry cannot activate, same original current request recovers one session, stale lifecycle/events cannot affect successor, and incomplete/tainted/early-exit runs cannot succeed. No actual platform result yet.

(rev 0.74) Submission must include the deterministic RGBA fixture hash/dimensions/provenance and disclose the missing-icon compile failure and correction. Icon existence is a build prerequisite, not runtime ordering evidence; no dependency/product-icon or app acceptance change.

(rev 0.73) Source review is accepted, but finite test runs cannot prove all schedules or all platforms. Harness must separate actual native hooks, controlled delayed messages, synthetic callback release and pure protocol evidence, with nonvacuous unguarded-eval control and actual193-A accounting on rejection. No runtime result yet; macOS execution follows separate exact-artifact review, Windows/Linux remain unverified.

(rev 0.72) Thirteen new actual-kernel tests/full gates pass. This proves serialized ownership/accounting/reclaim-state behavior, not file safety. Reclaim Failed must never later re-expose partly deleted bytes; finer retention classes, tombstone lifecycle, C1–C3 and real consumers remain open. Exact runtime event ordering must be established before193-B session wiring; source/API/compile/inferred/runtime evidence stay distinct.

(rev 0.71) Slice193-A must prove one group charge across multiple leases, atomic acquire-versus-reclaim exclusion, idempotent exact release, failed-reclaim rollback, stale-backend rejection, persistent-class eligibility separation and overflow-safe accounting. This is an in-memory kernel gate only: no actual file confinement/deletion, C1 document ordering, C2 operation recovery, C3 immutable inputs or app lifetime acceptance is implied. Full existing gates remain mandatory; all aggregate193 lifecycle checkboxes remain open.

(rev 0.70) Phase030's nine new tests and full combined gates pass. Genuine frame/strip production-builder plus real Values producer/remover evidence establishes naming/parity/isolation at that level, not FFmpeg/AppHandle transport or byte-content identity. All six local prerequisite acceptance receipts are consolidated in correctness-wave-06-verdict.md. Node20/Windows/Linux/main/mounted/native-lifetime gates and aggregate180/193 acceptance remain open.

(rev 0.69) Phase029's three new worker/profile tests and full gates pass. Phase030 must prove exact logical UTF-8 hash mapping through actual frame/strip request builders and real Values generation/removal, not repeated calls to one helper. Tests distinguish formerly colliding IDs and verify surviving output bytes after removing the other ID. Request-builder proof is not FFmpeg transport execution; canonical logical naming is not immutable-byte/C3 or ownership proof.

(rev 0.68) Phase027's39 boundary tests and full gates pass. Phase029 requires off-thread behavioral negative/positive proof, typed results/domain errors/panic mapping and paired profiling returns for success/error/worker failure through shared command sequencing. Native receive-to-return includes worker queue/await time, not kernel-only timing. Placement is not cancellation, concurrency bounds, source retention or improved wall-time acceptance; installed/native/platform proof remains separate.

(rev 0.67)021 generation/retention/no-rewrite controls pass; no immutable-byte or atomic-publication acceptance.027 must reject malformed replies at all four actual bridge boundaries, preserve args/invoke errors, project declared fields and cover native required-vs-null semantics. JavaScript fixtures plus source inspection are not Rust serialization parity or actual native interaction. Full gates remain mandatory.

(rev 0.66)019 real concurrent/later-call and same-cache byte determinism pass; only local collision-prevention accepted.021 requires before-fix real concurrent failure, three-output byte preservation after later work, deterministic same-path changed-generation coverage and actual unchanged-source no-rewrite control. Preserve022/AUD-005. Same-generation collision, equal-metadata changed bytes and incomplete publication remain185/193; no false C3 acceptance.

(rev 0.65)022 corrected fixture and all local gates pass; source-only acceptance does not close actual mounted/native/platform/owner ownership.019 must prove distinct real producer outputs into one cache, prior bytes intact after later work and unchanged encoded output for identical inputs. Dependency promotion permits no unrelated lock churn. Unique output naming is not publication, lease or lifecycle acceptance.

(rev 0.64) Green macOS gates do not excuse a source-visible Windows API-contract error. Correct the timestamp helper without skipped tests; API review is not Windows execution. Four production hashes must remain unchanged. Local helper/producer/full gates can support bounded acceptance; Windows CI and actual native lifetime remain unrun. Phase022 not accepted yet.

(rev 0.63) Phase022 requires a real Values-generation regression failing before the fix, byte-preservation and valid-new-output proof after, actual startup/managed-root positive controls and prune call-site inventory, plus full native/frontend/scalar/profiling/static gates. Textual call-site evidence is not mounted timer/FFmpeg proof. No lease, safe explicit deletion, multi-process lifetime, bounded growth, registry or aggregate adoption acceptance is implied.

(rev 0.62)183 amendment01 passes current source/factory/store and all final gates. Mounted Svelte navigation/gesture, destination rendered analysis, actual native output lifetime, Node20/platform and owner acceptance remain open. Literal mounted checklist items stay unchecked. Native193 delta review cannot claim implementation acceptance.

(rev 0.61) Current431-test/native passes are reproduced but183 unaccepted. Require Values cachedt7 fresh extraction without provisionalt0, immediate Home snapshot denial after canonical epoch revocation while entry remains unchanged, and no reconciliation-driven decode until scrub release. Existing exact reuse, overlap merge, phase182 queues and quality-size reacquisition must remain. Mounted/native-output/owner acceptance remains separate.

(rev 0.60)182 test-only reconciliation accepted,413 tests independently reproduced.183 must prove both navigation directions during debounce/IPC, old success/rejection before/after successor, same-path/probe handoff, exact admitted reuse, mismatch reacquisition and snapshot eligibility. Real factory/store tests are not mounted Svelte or native-output proof. Require final workspace/scalar plus renderer/Node/static gates before combined review.

(rev 0.59)192 stale diagnostic and epoch-isolating controller amendment accepted; current completion/error/finally controls pass.404/34 renderer and123/12 focused counts independently reproduced.182 must distinguish schedule-call evidence from actual store/runner fresh-result proof, without resurrecting unsafe cache reuse. Native full/scalar at183 and mounted/platform/owner gates remain separate.

(rev 0.58) A passing combined local-token reset test does not isolate the canonical epoch guard. Require real deferred frame/strip callbacks revoked by epoch alone, current positive/error/finally controls, and no stale Home decode error logging.397 tests passing is reproduced evidence, not192 acceptance; combined183 lifecycle and native/mounted gates remain open.

(rev 0.57) Selection epoch must be non-recycling and separate from content admission revision, view/request tokens and independent jobs. Validate late success/error/finally, pending-event delivery, active-intent removal, same-ID return, legitimate same-epoch settlement and current failures. Clipboard and Home browser-decode pre-await proof must execute production helpers, not a source-text assertion. Stale settlement neither allocates a revision nor activates/sets path/poster/cache/schedules work; release only unadmitted blob previews. Native output lifetime stays193. Full source lifecycle acceptance remains at combined183 tip; mounted/native/platform gates remain separate.

(rev 0.56) Wave04 accepted as local renderer-source/test proof: same-path changed content dispatches once after existing debounce, late old success/error cannot overwrite new result, stored-entry remount retains cache, pinned replacement invalidates before next explicit Batch Analyze. The reactive-equivalent test is not mounted Svelte/browser proof; native tests are not real app/owner workflow evidence. All source gates reproduced at181 tip; no kernel/request-parameter change. IMP180 aggregate adoption, IMP181 integration, native ownership, pending-view handoff, cross-platform and owner acceptance remain open.

(rev 0.55) Both replacement prerequisites are locally accepted, not full IMP181/180 closure. Phase181 must independently prove same-path B dispatches exactly once after ready A, stale A cannot land after B, and actual stored unchanged revision/settings seeded on remount makes no native call. Profiling must observe a new opaque key for B without schema or association relaxation; repeated B remains deduped. Real store/ingestion/runner tests are production-boundary proof, not mounted browser or owner interaction acceptance. Final native/scalar and all frontend/Node/static gates apply at181 tip.

(rev 0.54) Phase010 is accepted as a prerequisite, not complete replacement-dispatch or IMP180/181 acceptance. Phase017 must ignore caller revision claims, preserve preview-only/actual stored-entry reuse, retain distinct-ID duplicate-path rejection without resource changes, and invalidate the ready pinned aggregate on a pinned content revision change. A real explicit Batch Analyze must recompose after invalidation; no automatic rerun or in-flight Batch/export ownership claim. Lead reproduces each phase's counts and final-wave native/scalar gates before the full behavior verdict.

(rev 0.53) Wave04 requires canonical Values pending-token invalidation, not only cache deletion; new content revisions must not recycle on same-ID re-admission after clear/remove. Re-extraction from a mutable video path conservatively recomputes; stored-entry remount is the unchanged-cache positive control. Phase010 does not close revision dispatch or aggregate IMP180/181. IMP203 and profiling foundation are locally committed, not main-integrated or broader performance acceptance.

(rev 0.52) Owner normal-run feedback permits moving on from urgent stall investigation but does not close IMP202 aggregate measurement gates. Wave04 must prove changed-source invalidation, stale-result rejection and unchanged-cache positive controls through actual store/runner boundaries, with issue-granular provenance. Any scheduling change later needs committed-versus-continuous action coverage, no duplicate dispatch/worker flooding, unchanged numerical results and real interaction evidence.

(rev 0.51) Accept B20 visible renderer endpoints plus separately scoped native flame graph for diagnostic discussion. Whole-recording scope is default; optional action windows remain prominently uncalibrated/unbounded. Both imports remain caller-asserted ACQUISITION_NOT_VERIFIED, viewport unavailable, not eligible benchmarks. Physical presentation, semantic WebContent/FFmpeg stacks, calibrated alignment, parity/overhead, repeated cases and broad app acceptance remain open. IMP202 aggregate checks are not closed and prior4s/white-screen reports remain unresolved.

(rev 0.50) Accept B19 raw/native partial diagnostics, reject owner-facing E2E completion. Noncompleted coherent:true does not validate completion; visible DOM/Raf1/Raf2 checks/endpoints must actually exist. B20 counts every CPU row including missing-backtrace weight, preserves actual recorder/UI receipts and unknown viewport/clock bounds. No precise projected timing, causal hang, physical presentation or benchmark acceptance.

(rev 0.49) B18 R1 is accepted offline tooling, not shipped app source or performance. B19 must independently bind actual source/config/build/session and preserve sampled CPU versus elapsed renderer semantics, all outcomes and unresolved symbol/clock/viewport/coverage gaps. Native sampled stacks plus separate renderer stages do not automatically satisfy the owner's fully reviewable end-to-end graph. No exact native/header-wall calibration, physical presentation, quiet-host/parity/overhead or aggregate acceptance inferred.

(rev 0.48) B18 main predicate and B16 numerical reinspection verified, but R1 must make ULP(+0) and ULP(-0) both Number.MIN_VALUE. Keep exact zero/nonzero checks, raw numbers and reported endpoint subtraction unchanged. Accept checker/test cohesion with explicit eventual LOC bypass; no aggregate acceptance.

(rev 0.47) Supersede strict redundant renderer-duration equality with the B17 verdict policy: finite/nonnegative/ordered inputs within2^30ms before exact shortcut; exact zero/zero; otherwise exact equality or difference <= min(1e-6ms,sum of next-higher ULPs of start/end/recorded/recomputed). This is conservative validation, not global parser error proof. Both v1/v2 report recomputed endpoint deltas; unrelated/native-integer/integrity checks stay exact. Revised offline receipt coexists with old failed report and cannot prove acquisition/performance.

(rev 0.46) Accept B16 native repaired-hook association and clean seal as diagnostic evidence, not full strict coherence/eligible import. New comparison policy must address floating representation narrowly, preserve nonnumeric/native-integer/integrity guards and reject meaningful contradictions even at large timestamp magnitudes. Reinspection of immutable bytes is distinct from original report status or acquisition acceptance.

(rev 0.45) B15 launch/header and honest controller stop accepted, not control/correlation completion. Lead-operated import established via fresh AX/log after one Open click; screenshot thumbnails are not detailed visual proof. B16 may prove remaining native/renderer action association and seal using full unchanged session evidence. Long picker idle is setup, not performance.

(rev 0.44) B14 source/build/symbol gates accepted only. B15 must independently establish unavailable-input persistence, honest intermediate terminals and actual settled target-to-native/result/figure/DOM correlation plus loss-free strict seal. Do not require every intermediate to execute or infer display/performance/binding from UI readiness/seal alone.

(rev 0.43) Accept B13 source and independently reproduced gates locally, not merged/native/measurement acceptance. B14 requires complete dirty-source/build manifest and compiler/executable/dSYM/source-line proof; review precedes fresh exact-binary launch. B12 R4 honest intermediate supersession and separate overhead/physical-display limitations remain binding.

(rev 0.42) B12 browser source basis accepted, not production/native. B13 requires all six element-specific capture/binding contracts, old-hook negative control, existing null/wire regression and full gates. Later native proof must allow legitimately superseded/debounced intermediates; only actually executing settled actions require native/renderer endpoints. Fresh repetition is not overhead evidence without matched off/on acquisition.

(rev 0.41) Accept B11 invalid-input persistence and strict seal only, with live-carrier/hash-interval limitations. Reject settled-valid correlation and any performance inference. B12 must distinguish actual trusted input/reactive scheduling from synchronous surrogate dispatch, test numeric/checkbox differences and retain before/after evidence. Later fresh Tauri native/renderer correlation remains required even if a separate-browser harness passes.

(rev 0.40) B10 build/symbol/source gates accepted only. B11 must report actual invalid-event persistence, settled-valid native/renderer correlation and strict raw seal/integrity, separately from UI readiness. Preserve every diagnostic/setup action and failure. Unknown/replaced renderer continuity stops; raw integrity is not bound acquisition/numerical/performance acceptance.

(rev 0.39) B9 source/gates accepted, not mounted capture or performance. B10 requires locked optimized build, complete dirty-source reconstruction, matching UUID and actual fresh core/application line lookup, strict manifest and unchanged57 hashes. Full schema engine/Node20/Windows and real v2 operator sealing/import remain unrun.

(rev 0.38) B9 remains unaccepted overall pending H1-H2. All reported gates independently pass; source/runtime surrogate proof does not close mounted capture. Correct diagnostic render mismatch precedence and schema-required event data, then rerun focused/full gates and preservation checks.

(rev 0.37) B8 source basis accepted, not implementation. B9 must prove installed-binding regression, exact invalid three-event terminal, native state guards, producer-consumer v2 interoperability, unchanged v1 semantics and strict nonselected accounting. Full gates and independent review precede any new build. Invalid observations never become eligible measurements; B7 stays failed and immutable.

(rev 0.36) Accept B7 exact-still/K/navigation/header and truthful failure evidence only. Usable trace, native correlation and seal remain failed/unproved; no aggregate closure. B8 must separate source/probe evidence from B7 attribution and propose strict cross-consumer unavailable-config semantics without relaxing sequence or completion checks.

(rev 0.35) B6 build/symbol/source gate accepted only. B7 must prove actual mounted control, exact process/session/namespace/material, ordinary UI finalization and honest raw seal/integrity outcomes. Unknown/replaced renderer lifetime stops and invalidates continuation regardless of seal. Preserve all setup/actions/loss; parser failure is evidence, never permission to fabricate records. Bound copy/hash checks do not imply fsync/durability or numerical/import eligibility.

(rev 0.34) Accept B5 source/regression gates only. Native wire, ordered sticky drain, quiescence and state labels pass bounded review; actual header/reflow/IPC sealing remain unrun. B6 must establish new exact dirty-source/executable/UUID/manifest provenance and actual core+application source-line lookup. Clean native seal still does not prove renderer continuity, numerical correctness or performance.

(rev 0.33) B5 requires synchronous quiesce before side effects, ordered append and complete persistent action accounting, sticky failure/session-drop guards, coherent receipt validation and truthful pending/loss/sealed states. A clean local seal remains validation-pending, never numerical correctness or importer eligibility. First acquisition requires independent uninterrupted renderer/native ownership; reload/replacement or unknown continuity makes the run ineligible regardless of seal. No recovery mechanism or automatic replacement detection is implied.

(rev 0.32) Accept B3's bounded non-timed import/K/navigation/retention evidence, not resizing, exports, numerical correctness, profiling overhead or whole-app performance. Screenshot-visible state, transcribed AX controls and saved log transitions are separate evidence. B4 must source-confirm the renderer/native finalization ordering and exact minimum implementation/test fence; a registered native command alone is not operator usability.

(rev 0.31) Current executable/PID/start/environment/namespace proof can establish an adopted-process functional-smoke carrier without proving the original launch mechanism. It cannot be relabeled fresh/cold or pooled with PID67138. Actual import/K/navigation/reflow steps remain unrun. Preserve screenshot-versus-window-geometry and control-failure-versus-product-defect distinctions.

(rev 0.30) B2 packaging/source/symbol gate is accepted under profiling-b2-build-verdict.md; core0x1004b4ea8→kmeans.rs131 and app0x100209fcc→profiling_writer.rs247 independently resolve through matching dSYM. This does not imply every-frame coverage. B3 must report exact process/namespace/input identity, actual UI states and control failures, durable versus inline-only evidence, and unchanged source/input. Disabled smoke is not whole-app numerical correctness, overhead or measured performance acceptance.

(rev 0.29) D1–D4 source corrections and producer→consumer tests satisfy bounded B1 implementation acceptance. Retain disclosed cohesive LOC exceptions for separate commit-time handling; no automatic bypass. B2 must prove actual compiler flags, dirty-source identity, exact executable/dSYM UUID/hashes and both core AND application source-line resolution. Packaging does not establish mounted DOM, real acquisition binding, parity/overhead, physical presentation, video controls or Node20/Windows acceptance. AI-IMP-202 aggregate checkboxes remain open.

(rev 0.28) Retain corrected C1–C8 mechanisms and cohesive splits. Require runtime-faithful positive pending/ready repeat import; irreversible seal with unchanged post-seal bytes/counters; pre-finalization refusal durably tainted or unsealable; and safe identity validation before reservation/persistence. Full gates and preservation hashes remain required. These are measurement-infrastructure defects, not evidence of incorrect color analysis; aggregate app/performance/platform acceptance stays open.

(rev 0.27) Passing isolated suites are insufficient. Require production-native wire→Node import, real compiled-Svelte association, post-store unmount revocation, actual SVG-root checks, coherent event-chain validation, positive session seal/all-action loss accounting, actual nested event bounds and disabled call-site proof. C8 authorizes cohesive extractions, not blanket LOC bypass. No B1 or AI-IMP-202 acceptance yet.

(rev 0.26) B1 requires input-vs-reactive-call identity, actual store receipts, source/settings/result render joins, nonvacuous enabled-figure proof, exact-once observed outcomes plus separate persistence receipts, bounded closure capacity, explicit trace/build/case acquisition binding and per-case action selection. Disabled bootstrap handshake is a disclosed one-time exception; no physical presentation, content identity or negligible-overhead claim is inferred. Full gates and unchanged A1 hashes required; live/platform/system acceptance remains open.

(rev 0.25) A1 local tooling acceptance is bounded by reproduced gates and corrected R1–R10 cases. Approve the 427-line summarizer's cohesion without minification or automatic LOC bypass; integration remains separate. Node 20/Windows, correlated live tracing, exact frame/control proof, actual presentation, full symbol coverage and observer overhead remain unaccepted. No AI-IMP-202 aggregate checkbox closes.

(rev 0.24) R1–R4/R7–R8 and ordinary R5–R6 paths verified. Before A1 acceptance, require bounded nonregular pre-open replacement rejection and nested exported-redactor tests, plus unchanged A0 summary bytes and full gates. Node 20 remains an explicit unrun platform gate. AI-IMP-202 aggregate acceptance stays open.

(rev 0.23) Existing passing tests are insufficient until R1–R8 counterexamples fail correctly. Require coherent frame/evidence claims, endpoint-independent attempt counts, semantic canonical grouping, read-time bounds, safe redacted caller identifiers and structural schema vectors. Preserve A0 raw evidence and regenerate only new projections. No automatic LOC bypass or issue closure.

(rev 0.22) A1 requires explicit Node test discovery, strict versioned evidence/attempt validation, unavailable-vs-zero semantics, safe private writes/redaction, deterministic non-pooled summaries and reproducible A0 projection with all 31 attempts retained. Full current gates remain required; no owner/media data in commits. Capture capability and timing endpoints must be proven, not inferred from tool availability.

(rev 0.21) Arithmetic/log execution checks pass; live UI values remain operator transcriptions without retained screenshots or lead replay. Six visible trials differ from one visibility-caveat trial. Host was active; no idle claim. Exact-frame, fresh-process (zero valid target trials), presentation and full-app acceptance remain open. Original ~4000 ms was reported kernel/display time, not a measured whole-app interval.

(rev 0.20) Verify runtime isolation and each timing's source/settled-frame/settings/new execution. Keep cache/dedup/failed/unmatched outcomes explicit; do not pool them. Kernel duration and pending interval are separate endpoints, neither presentation time. Preserve every attempt, median/range and workload notes; no historical regression ratio from this single-build pilot.

(rev 0.19) Accept A0 preparation only: six bundle/eight frontend files and eleven referenced evidence/prior-binary hashes verified, locks/cleanliness retained, core line lookup reproduced. Application-frame symbol coverage, runtime isolation, actual speed and complete profiling-system acceptance remain open.

(rev 0.18) Preparation requires locked packaging, effective compiler-flag evidence, exact bundle/lock/sidecar/frontend identity, matching binary/dSYM UUIDs and demonstrated application/core source-line resolution, with a clean unchanged candidate. None establishes runtime speed, actual preference/cache isolation, end-to-end presentation or IMP-202 completion. A0 measurements may use only exposed timings, must prove new execution, and retain unavailable endpoints. Apply §10.5; future statistical/overhead thresholds remain provisional.

(rev 0.17) Owner manual import/video-analysis observation clears the inference of an app-wide picker failure, but does not validate all video races/snapshot paths. Performance remains unclassified until matched optimized builds, assets and configuration are measured. §10 requires real-app outcomes, stage semantics, overhead/correctness controls, durable raw evidence and explicit missing-data/uncertainty. A successful microbenchmark or debug screenshot cannot close this acceptance.

(rev 0.16) Accept Wave 03 source/regression gates and separate unsigned debug packaging only. Native app launch is observed; actual video playback/scrubbing/capture is not. Preserve Sol's negative-control evidence as reported, separately from lead rerun passing counts. Prior image smoke is historical evidence at the earlier bundle, not retroactively new-video validation.

(rev 0.15) Wave 03 requires cached-A→fresh-B failure proof plus a cached-restore positive control; settled-frame tests cover debounce/active extraction, supersession, errors, path switch/disposal and exact snapshot field provenance. Full current gates and file fences must pass. Keep native follow-up distinct; no existing live app rebuild by Sol. Exact cache identity and successor view reacquisition remain IMP-182/183, not claims closed by these two patches.

(rev 0.14) Local packaging and bounded runtime smoke pass. Native picker imports, Colors/Values shared material, selection within Values with level retention, unpinned Batch empty state, and one visually inspected Colors composite PNG were executed. Actual OS clipboard/drop variants, Batch computation, video, races, resizing, remaining export paths and owner/platform/release acceptance are still open. Do not relabel a first smoke as proof of all adopted fixes.

(rev 0.13) Package with the CLI's ordinary Tauri 2 behavior, no custom-protocol feature workaround. Verify the actual app loads bundled assets without a dev server; passing compilation cannot establish that runtime fact. Recheck the recorded Cargo lock hash and the two-package-only npm delta.

(rev 0.12) IMP-201 must retain a reproducible native lock, use npm-10-compatible frontend lock, rerun post-alignment gates, and verify the bundle runs without Vite. Record exact binary and bundle identities so installed 1.0.1 evidence cannot be mislabeled as current. Linux/Windows/Node 20 and owner acceptance remain separate unless actually executed.

(rev 0.11) Fresh-build acceptance requires the actual packaged candidate's identity/path/version/hash, successful packaging without mismatch bypass, app launch and recorded native interaction outcomes. Exercise material import/switching, Colors/Values, Batch and export where supported. Distinguish automation-observed behavior from owner acceptance, and name untested failure/race/platform states. Record any dependency repair and rerun affected full gates. Unit tests alone cannot close native interaction checks.

(rev 0.10) Future collection integration must prove: selecting image B from Values returns to Values with B and preserves study controls; moving to Colors retains B as the shared material; pending/error state does not mislabel image A's result as B. Selecting an active image neither silently replaces Batch pins nor retargets an already captured export job. These are required future tests, not executed evidence or a ruling on export-builder follow/freeze UX.

(rev 0.9) Wave 01 counts were independently reproduced and its two commits prepared, not merged. Wave 02 must prove picker/MIME/drag-drop parity including .tif, unsupported/prototype-key rejection, honest clipboard extension mapping and managed-root cleanup across supported formats while preserving unrelated files. Preserve wave-01 regressions. Full frontend/native/scalar gates remain mandatory at the combined tip, with Node/runtime and human/platform gaps stated; partial adoption cannot close aggregate IMP-180 or IMP-191.

(rev 0.8) Correctness wave 01 must reproduce the pre-fix fixture failure, retain exact canonical fixture/assertion bytes, prove rollback/rejection/late-disposal listener behavior, run focused tests per issue and full frontend/native gates at the combined candidate. No production math or layout change. Report exact counts/platform and unrun human/cross-platform acceptance. IMP-180 remains partial regardless of this wave's outcome.

(rev 0.7) Local proof passed on Node 26.8.1, not Node 20 or the full suite. The future typed in-repo config must pass check/lint/format, all existing/new specs, Node 20.19-or-newer runtime evidence and applicable browser/full candidate gates. Keep the known IMP-179 baseline issue separate; do not fix or suppress it under UI work.

(rev 0.6) Before assigning UI component implementation, prove its SSR test route against the actual installed toolchain and normal CI discovery. Preserve existing rune-factory/audit behavior; source-text assertions, guessed compatibility or a caught diagnostic error with exit 0 are not passing component evidence. Responsive evidence additionally names the current 720×600 native minimum. See §9.7 for scoped styles, provenance and reference rules.

(rev 0.5) UI planning acceptance additionally requires traceable design source hashes, archived superseded ticket text, an acyclic dependency map, all current export/settings options accounted for, and unresolved policy fenced off. UI implementation requires real reflow/keyboard/pointer tests, not just a shrinking artboard; 360/736/1024/1440 CSS-pixel evidence plus the supported desktop minimum. Existing data export schemas and unrelated figure bytes remain deterministic. New visual patch labels have explicit narrow fixture approval; GPU 3D capture has fixed-environment pixel tolerance and deterministic source/camera/config metadata, not an unqualified cross-device bit-equality promise. All assets remain offline. Human acceptance remains unchecked until the owner performs it.

The implementation candidate must pass all four renderer gates (`test -- --run`, `check`, `lint`, `format:check`) and Rust workspace fmt, clippy with warnings denied, and tests. Also run `cargo test -p color-core --no-default-features --test kmeans_snapshots` and verify `cargo tree -p color-core --edges normal` contains no Tauri dependency. Report platform, toolchain, exact tip, suite counts, and exceptions.

Windows packaging and Linux CI remain required release evidence, not claims inferred from macOS tests. Keep the two existing AUD-020 accessibility warnings explicit until separately addressed. A native smoke pass covers still replacement, rapid cross-view video handoff, pin/reanalysis, canceled and concurrent exports, and cache pressure. Only observed results can close those checks.

Planning acceptance is narrower: complete mapping to the current baseline, explicit residuals and evidence level, no duplicate tickets against active work, resolvable file scopes and dependencies, and a reproducible generated index.

(rev 0.3) Add protocol proof for renderer replacement/ACK loss, acquisition versus removal, stable-frame restore under fresh execution tokens, and the owner-approved pressure behavior. Evidence from the planning base and unaccepted performance work does not substitute for the future accepted integration tip.

(rev 0.4) Also require delayed-old-bootstrap rejection, live-client lost-grant/result reconciliation, cancel-before-delayed-admission, and external-file mutation between cached analysis and export (including equal size/mtime). These are future executable gates, not tests claimed to have run in design review.

## 7. Open decisions

(rev0.99, 2026-09-28) Unchanged: IMP-193-5 and IMP-202 remain distinct open owner decisions, and IMP-193-4 gates nothing. Session 03's outcome is owner-reported.

(rev0.98, 2026-09-28) IMP-193-4 gates nothing in the first usable web app; that's the lead's ruling. The 01 record stays as it is: a 30-minute owner-session timeout, zero dispositions, a failed terminal record, not acceptance. Session 02, at the owner's word (run-20260928-visible-owner-02), is owner-reported. **Two open owner decisions, kept distinct:** (a) whether IMP-193-5 is wanted at all; (b) whether IMP-202's profiling resumes. It won't resume by inertia.

(rev0.97) Owner readiness and assistant launch authority are now explicit. Remaining evidence is the six visible cases, actual exit/ledger outcome and owner verdict; actual process loss remains untested.

(rev0.96) No contract decision remains for this isolated test. Preparation is accepted; next owner question is readiness for the manual hands-on session. Lead must issue/recheck the separate launch gate before runtime. Actual loss detection, focus/visual continuity, window modes and production adoption remain open evidence questions; no further general source research assigned.

(rev0.95) No new owner contract decision. Startup/admission and snapshot-lock repairs are bounded implementation corrections, not architecture reopening. Await round03 before launch review. Native deadlock/startup failure was not executed; pure/source counterexamples are sufficient to withhold launch. Owner feel, actual loss coverage and adoption remain unresolved.

(rev0.94) No owner decision needed for bounded R1 corrections; trusted-local/unique-child/fail-stop contract remains settled. Await corrected round02 preparation before the separate launch decision. Actual process-loss coverage, first paint/focus/Space/flicker/owner feel and production adoption remain unestablished. Source failure-path findings are not observed native hangs/crashes.

(rev0.93) No new owner contract decision. Visible plan accepted with preparation rulings; await source/pure/build submission before launch. Default same-child crash reload must be overridden and Wry activation disclosed, not silently worked around. Actual process-loss coverage, first-responder/Space/flicker feel, restoration and production adoption remain unresolved.

(rev0.92) Owner resolved the restart-contract choice affirmatively. No repeated approval is needed for that contract or assigned193-4 plan. Await the bounded technical plan before allocating source/preparation/run scope; transient renderer-state continuity and owner feel remain test questions. Production unstable enablement,193-5 integration and unestablished detection coverage remain separate gates.

(rev0.91) Owner choice: accept trusted packaged-local startup and one authority-bearing document per unique native child, with fail-stop/fresh-child recovery inside the retained OS window on document reload/navigation/process loss/contradiction/ambiguous startup? Recommend yes for proceeding to193-4 planning, not production adoption. Ordinary image loading/repaint/Svelte navigation are unaffected. Renderer-only input/focus restoration remains a visible-test question. Unstable child-WebView production enablement and193-5 still require separate approval. No further research is needed before posing this bounded choice.

(rev0.90) Sprint direction is owner-approved; startup-authority outcome remains open. No renewed owner approval is needed for the assigned source review. A changed contract, production adoption or concrete visible runtime action remains separately gated.

(rev0.89) Owner is discussing the next sprint; no new implementation/run assignment yet. Initial startup premise and visible feel remain the proposed gates. Production session adapter only follows explicit capability/adoption approval. Do not reopen settled R policy or substitute repeated finite probes for a missing source guarantee.

(rev 0.88) Retained-window mechanics are feasible in the isolated public unstable route. Unknown initial-empty-document binding and visible focus/continuity/Spaces/fullscreen remain unresolved before production adoption. Experiment complete with no further action assigned; R/native-owner policy unchanged.

(rev 0.87) No owner blocker; first retained-window runtime outcome is pending under the exact one-run verdict. All production, initial-document and visible-interaction decisions remain open; R and independent native owners unchanged.

(rev 0.86) No owner blocker. One narrow incomplete H22 observation guard remains before a runtime gate; this is not another policy review. Initial unknown-document binding, ordinary pending-response delivery and visible UX remain open. Native retained-owner/R policy unchanged.

(rev 0.85) No owner blocker. Four bounded preparation corrections, not another policy or general protocol review, precede any run. All corrections stay in the already-approved isolated experiment; production, unknown initial-document binding, visible interaction quality and platforms remain unaccepted. R and native retained-owner policy unchanged.

(rev 0.84) No owner blocker or new design review. Code Lead prepares within14 paths under H17..H20; lead independently reviews the frozen source/tests/binary before a bounded run. Initial empty-document binding, hidden-versus-visible behavior, production integration and platforms remain open, not prerequisites to recording the experiment honestly. R unchanged.

(rev 0.83) Exploration approved; no owner blocker. Remaining technical questions are the exact child API/initial-document startup behavior and reviewable test mechanism. Initial binding and visible interaction quality remain unaccepted, as do production integration and other platforms. Lead owns staged preparation and runtime gates within the approved experiment; return to owner only for materially expanded scope or a genuine product decision. Retention-only R unchanged.

(rev 0.82) Owner decision requested: explore the public tauri/unstable child-WebView API only in an isolated spike to preserve the OS window. Stable whole-window recreation has unaccepted focus/Space/fullscreen consequences. No feature change or app action until direction; this does not reopen retention-only R.

(rev 0.81) Next question is concrete API feasibility of nonrenewable WebView identity, preferably preserving the native window. No owner blocker for this read-only check. A necessary whole-window replacement/private API/dependency change would be reported for lead/owner ruling, not silently accepted. R and all production gates remain unchanged.

(rev 0.80) No owner blocker or new retention policy. Concrete C1 source obligation closeout remains: current-document ordering premise, initial callback omission and production initialization attachment. Windows/Linux and production/IO/C2-C3 integration still open; no extrapolation from finite macOS success.

(rev 0.79) No owner blocker. H14 source/pure causal repair accepted; its real shutdown outcome remains pending one authorized isolated run. Missing timer/ordinary callbacks retain unknown classification; R unchanged.

(rev 0.78) No owner blocker. A concrete harness teardown-lifetime defect is inferred from the first-run suffix and source, requiring deterministic regression and one-file repair. Missing ordinary/timer callbacks remain finite observations, not proof. R and production gates unchanged.

(rev 0.77) No owner blocker. Existing authority suffices for this separately recorded isolated first run; no new quota or app-control authority. Actual runtime results pending, Windows/Linux and production integration remain open.

(rev 0.76) No owner blocker or new policy choice. One residual harness evidence-labeling error is a bounded driver-only correction, not reopened protocol design. Retention-only R and all runtime/main/app fences remain.

(rev 0.75) No owner blocker. Concrete harness defects explain AMEND despite12 green pure tests. Temporary production-icon compile override is disclosed as a past fence deviation; final distinct asset is verified, no app launch. Fix only named harness seams; retention-only R, C1 and production gates remain unchanged.

(rev 0.74) No owner blocker: C1-H6 resolves one exact build-file fence. Existing runtime evidence and pre-launch review gates remain; no new policy or platform decision.

(rev 0.73) No owner policy blocker. R and C1 remain unchanged. Native challenge mechanism is conditional; first prepare an isolated macOS experiment rather than infer a runtime fork or require new Windows/Linux environments. Any unsupported runtime guarantee stays explicit; full production activation remains gated.

(rev 0.72) No owner policy blocker. R remains selected. The narrow technical question is how installed tauri2.11.5/runtime-wry2.11.4/wry0.55.1 proves native document recency across reload and window replacement. Existing callbacks expose a surface, not an already proven ordering guarantee. Inspect only this concrete seam; no new whole-protocol review.

(rev 0.71) Capacity direction is resolved by the owner's explicit approval of session growth and cleanup only when unused, including flush: R retention-only, no proactive hard admission bound. Earlier pending F/O/number statements below are historical, superseded. Numeric admission ceilings are not a gate for this selected policy; adding a future hard guard/overflow scheme needs fresh approval. Existing IO/disk-full errors remain honest. No owner blocker for193-A; actual runtime incompatibilities return for a narrow ruling.

(rev 0.70) Owner attention is now needed before native193 implementation: recommend recoverable rejection after unowned reclamation while preserving accepted jobs/results; bounded overflow requires an explicit allowance and hard ceiling. Ask for behavioral direction, then concrete transient/class ceilings/headroom and oversized-job approval; no numbers or retention-only alternative selected here. Lead still owes numbered topology amendment. This native gate does not globally prohibit disjoint scoped work; none assigned now.

(rev 0.69) No owner blocker for030 naming. Explicitly preserve029 attribution and021/022 controls; old cache naming transition has no automatic migration/fallback-deletion authority. Hash naming is not a legacy ownership or confinement proof. After030,193 still needs the owner pressure ruling and numbered current-topology amendment. No admission limit or retention-only policy is chosen by silence.

(rev 0.68) No owner blocker for placement-only029. Preserve profile endpoints without new schema/reason codes; outside-file requirements return for amendment. Existing source/copy/publication races and owner-pending pressure limits are not solved by spawn_blocking.030 and193 remain gated; no capacity or UI choice is inferred.

(rev 0.67) No blocker for027 media reply validation. Correct optionality is grounded in live Rust structs; caller/fixture changes outside four paths need a narrow amendment. No ownership/escrow fields or pressure policy are assigned. Actual cross-language emission and platform/native lifetime remain unrun until separately scoped.

(rev 0.66) No blocker for021 observed-generation isolation. PressureF/O/numeric ceilings and193 authority stay pending; generation folder names are not input-byte capabilities. Windows/Linux/Node20, installed-app output lifetime and deterministic encode/sync/keep failure injection are not established by019 local gates.

(rev 0.65) No blocker for019 collision-prevention adaptation. PressureF/O/transient/class ceilings/oversized-job behavior remain owner-pending before193. The root-lock clarification is a live workspace path correction, not dependency-upgrade authority. Windows and actual native lifetime remain explicit validation gaps.

(rev 0.64) No owner blocker: phase022 test-only Windows-access correction is fully scoped. F/O/quotas and193 authority remain unapproved, not implicated by this fixture amendment. Do not create a Windows environment or broaden work solely to obtain platform proof.

(rev 0.63) No owner blocker for the scoped prerequisite022 adaptation. Native193 still needs F versus O, separate transient/class admission ceilings/headroom and oversized-single-job behavior; existing retention targets are not quotas. Fail-closed preserving accepted owners is recommended, not selected. Future193 topology amendment must include moved clipboard writer, post183 dual-view controller/scrubber/handoff and two snapshot call sites. No new general protocol review.

(rev 0.62) No blocker for read-only193 delta review. Pressure options/limits remain unapproved; preserve accepted protocol C1–C3 and identify only source/topology/prerequisite changes before a lead implementation ruling. Renderer selection/settlement does not resolve native byte ownership.

(rev 0.61) No owner blocker. Amendment01 is correction within H1–H4, not a new gesture policy: initialize cache hints only for new intent, merge later metadata; snapshot compares current global authority; active scrub does not dispatch through reconciliation. No timing parameter or cache-preservation API change allowed.

(rev 0.60) No owner blocker.183 H1–H4 settle required state shape and ownership: requested time survives disposal, settlement comes only from accepted normalized store entry, probe merges preserve advanced request/settlement, synchronous subscriber reentry dedupes its own local request. Native mutable output safety remains193; do not broaden this renderer phase to solve it.

(rev 0.59) No owner blocker.192 committed locally;182 receives a two-test-only fence. Original cleanup-fence deviation acknowledged with original temporary path and transcript receipt; physical Trash path unavailable under read-only access, no further recovery authorized.1854ins/185del source payload and848 new lines corrected. Current state has no pending192 amendment.

(rev 0.58) No owner blocker. Lead requests bounded amendment01, not a design expansion. Original submission's temporary archive Trash move is a cleanup-fence deviation despite its no-cleanup claim; round02 must preserve provenance and clarify retained receipts without further movement. Four original new files total848 lines, not1,101.

(rev 0.57) No owner blocker. Lead approves the review's three amendments and adds a bounded clipboard-ingestion helper/test for executable coverage plus interface-only fixtures in video cache-reset and Values snapshot tests. Epoch is immutable freshness identity; nullable/pre-admission media targeting must be bound by the store without invalidating the same captured epoch. Removal/replacement follows current intended media, not an old activeImageId still displayed during a newer pending selection. Non-activating append does not begin intent. Test-only182 reconciliation remains binding.

(rev 0.56) No owner blocker. Wave05 report must determine the minimal current selection-epoch boundary and what remains of IMP182 after conservative cache-branch removal, before any coding. Content revision, selection intent and request authority remain distinct; current selection settlement must not revoke itself. Scheduling lead scope remains a proposal and is not folded into selection/frame code.

(rev 0.55) No owner blocker. Source normalization is settled in017: supplied and stored entries share the allocated revision. Remaining181 three-file fence is sufficient on inspected callers; return any contrary adapter requirement before editing. Scheduling/design follow-up remains separately ruled after the correctness wave, not authorized by this assignment.

(rev 0.54) No owner decision is blocking. Phase010 is locally committed44d7f57; lead releases017 now, retaining181 for the subsequent exact-base assignment. Mutation of a newly admitted caller entry must not leave explicit ingestion/controller scheduling with a different revision from the store; any required outside-fence adapter change returns to lead before editing.

(rev 0.53) Base/integration ruling is settled at9215711. No owner blocker. Lead commits each submitted issue before releasing the next overlapping phase; Sol starts010 now. Scheduling remains separately scoped and unchanged.

(rev 0.52) Owner has approved the recommended direction; no further owner answer is needed to start wave04 preflight. Lead must settle precise replacement-identity fence and integration of preserved profiling source before implementation. Scheduling policy remains a lead proposal to test, not blanket removal of400ms debounce. Do not use that separate design question to stall correctness verification.

(rev 0.51) No execution blocker. B20 graph is ready to discuss with owner and Sol; no next coding/capture wave is assigned. Owner can choose interaction/debounce priorities, an exact varied-material stall reproduction, or broader calibrated measurement. These are proposals only. Automated graph follow-up pauses at delivery; owner acceptance is distinct from lead diagnostic acceptance.

(rev 0.50) No owner blocker. Foregrounded capture recipe is settled; first visible warm-up gates profiler spend. If controlled foreground still yields hidden/incomplete evidence, stop for concrete lead diagnosis without code changes or repeated blind runs. Owner graph remains pending.

(rev 0.49) No owner blocker currently. B19 actual process-targeted sampling/export and truthful binding/coverage are next. Source numerical gate settled; no new app rebuild. Installed-tool permissions and cross-profiler alignment remain to be observed, not reasons to expand scope or claim flame completion.

(rev 0.48) No owner blocker. Exact signed-zero amendment is settled; source acceptance waits on R1. Installed profiler and fresh acquisition binding plan are next, not another app rebuild.

(rev 0.47) B17 comparison/domain/reporting policy is settled for B18. No owner blocker. Source implementation/gates and separately labelled numerical reinspection precede bound acquisition/parity/overhead/end-to-end flame graph; avoid a needless rebuild of the unchanged app.

(rev 0.46) No owner blocker. Settle exact numerical duration comparison/transport origin under B17; avoid needless app rebuild if tool-only repair is sufficient. Bound acquisition/parity/overhead/end-to-end flame graph remain open. Lead owns prompt repair ruling after numerical review.

(rev 0.45) No owner blocker: lead completed the selected-file import. B16 native control continuation follows exact continuity checks; source/runtime/flame acceptance remain distinct. Do not allow recurring capture errors to cause blind duplicate controls or invented screenshot evidence.

(rev 0.44) No owner blocker. B15 real WebKit/native control proof is next; later bound acquisition/parity/matched overhead/end-to-end flame graph and owner/platform gates remain. Exact preflight namespace absence is historical after launch; unknown continuity stops without recovery.

(rev 0.43) No owner blocker. B14 immutable build proof next; real WebKit/native action-to-chart capture, bound acquisition, numerical parity/matched overhead, end-to-end flame graph, Node20/Windows and owner gates remain open. No inference that fixed source implies a usable runtime trace.

(rev 0.42) Capture-phase two-file repair scope settled by B12 R1-R5; B13 coding/gates next. No owner blocker. Fresh immutable build/Tauri capture, bound acquisition/parity/overhead/flame graph and owner/platform acceptance remain open. Lead owns immediate source review and next assignment on submission.

(rev 0.41) No owner blocker. B12 must settle the minimal input hook/regression scope; capture-phase profiling observation is preferred, not implemented. Native acquisition/parity/overhead/flame graph and owner/platform gates remain open. Owner asks for notification once a genuine end-to-end flame graph is ready for discussion with Astra and Sol. The current-task follow-up is a continuity aid, not a replacement for lead review and dispatch.

(rev 0.40) No owner blocker. Fresh B11 process/renderer/namespace proof, actual v2 actions/seal, later bound acquisition/parity/overhead/flame graph and owner/platform gates remain open. Geometry and performance are not assigned in this pass.

(rev 0.39) H1-H2 resolved; no owner blocker. B10 build proof precedes a separately assigned fresh-session UI capture. B7 remains failed/immutable; do not revive its vanished process/session.

(rev 0.38) No owner blocker. H1-H2 are settled technical corrections; no new design or broad review required. Fresh-build/capture authority follows only after source acceptance.

(rev 0.37) B8 schema/fence choice settled in G1-G7; no owner or design blocker. B9 implementation/gates are next. Remaining mounted capture, real valid-action correlation, later acquisition/parity/overhead/performance/platform gates are unchanged. No failed-session recovery.

(rev 0.36) No owner blocker. Lead must settle B8's narrow unavailable-config wire arm/version and exact implementation fence. Valid-input observer/scheduling order remains a separate technical question. Former PID disappearance does not authorize restart; later source/build/fresh-session proof require explicit assignments.

(rev 0.35) No owner decision blocks the bounded B7 diagnostic. Detached launch avoids reliance on the tool shell lifetime; observed PID/renderer continuity still must be checked, not inferred. Real mounted behavior, geometry, trace integrity, later bound acquisition/parity/overhead/flame graph and owner/platform acceptance remain open. No quiet-host or repeated performance experiment is assigned.

(rev 0.34) No owner question blocks B6 packaging. First actual operator/trace run follows separately reviewed new build and one uninterrupted renderer lifetime; resize, mounted states, real trace import/binding, parity/overhead, performance and owner/platform gates remain open. No reload recovery or new optimization is implied by local B5 acceptance.

(rev 0.33) Header host, explicit Finish/Retry controls and no automatic polling are settled under F1–F5. Reload/resume support is excluded; a native seal cannot recover lost renderer-only failures. B5 remains implementation/review work. New immutable build, mounted operator proof, uninterrupted acquisition evidence, reflow, parity/overhead and broader owner/platform acceptance remain open; no owner choice blocks the bounded coding slice.

(rev 0.32) Resolve the smallest profiling-only Finish capture control and safe pending-action/persistence/seal ordering after B4 source review. No owner design decision is needed for that mechanical review. Narrow-window reflow, eligible acquisition and broader performance/owner/platform gates remain open; keep the smoke01 PID loss unexplained rather than spending another control experiment on it.

(rev 0.31) No owner decision blocks reuse of independently verified PID67432 for non-timed UI work. First-process loss and possible UI-controller launch behavior remain unresolved; no causal diagnosis or new restart experiment is needed for this continuation. Instrumented finalization/acquisition control is still separate.

(rev 0.30) Actual instrumented acquisition still needs a safe operator route for native profile_finalize, which is registered but has no confirmed current UI/renderer-bridge entry. Do not fabricate seals or use invasive injection. Lead will settle that control surface separately while B3 proves basic mounted operation with tracing off; no owner design choice blocks this bounded smoke.

(rev 0.29) No owner choice blocks isolated B2 preparation. Packed dSYM generation is a source-documented remedy to test for A0's application symbol limitation, not yet successful evidence. Real launch and acquisition receive a later exact-executable/namespace assignment. The review incident has a confirmed ordinary log write but no pre-launch inventory to establish or rule out retention deletions; no owner-data restoration or zero-side-effect claim.

(rev 0.28) No owner choice blocks D1–D4. Finalization deliberately stops new observation, but a refusal before that boundary cannot vanish; an already sealed artifact is immutable. Actual instrumented build and live acquisition remain the next separately bounded step after these corrections, not authorized to the Code Lead yet.

(rev 0.27) No owner decision blocks reproduced B1 corrections. The explicit final-session seal is required for eligible import; action closes cannot prove absence of later failed writes. Native/Svelte unit integration remains distinct from later live acquisition/overhead/platform/symbol proof.

(rev 0.26) Source-level implementation choices are settled in V1–V7; no owner question blocks B1. Actual acquisition/binding verification, isolated instrumented build, native/application symbols, mounted DOM/on-off parity and wider process/video controls remain later exact assignments, not automatic permissions.

(rev 0.25) Next technical decision is the exact minimum vertical instrumentation fence, including how to distinguish actual store acceptance from attempted publication and how to label any unproven result association. B0 reviews only that delta against source; no repeat general architecture review or owner decision requested.

(rev 0.24) No owner decision blocks the two concrete tooling corrections. Current CLI privacy is not reported broken by the nested exported-API case. Full-interaction capture, exact seek and application-wide symbol coverage remain later technical work, not optimization authority.

(rev 0.23) No owner action is needed for the reproduced A1 defects. Approved structural seams replace the earlier eight-file-only constraint for this correction round. Node20 remains unrun; later full-interaction tracing and native symbol coverage remain separate.

(rev 0.22) No owner question blocks A1 implementation or native control/capture proof. Escalate with the existing notify-owner bell only when owner action is genuinely needed, then pause that blocked activity. Normal review/completion is not bell-worthy. Whole-app tracing/symbol fences and historical comparator remain technical work, not implicit optimization authority.

(rev 0.21) A0 exposes no grossly slow kernel in the nearby-frame warm sample but does not classify cause. Need reliable exact material/frame interaction, durable visual evidence, full application symbols and bounded whole-interaction endpoints before broader attribution; known-good prior binary still unverified. No new owner material question or speculative optimization is needed.

(rev 0.20) Owner case/material permission is resolved; no more confirmation is needed for this pilot. Quiet intent requires observed workload notes, not control over ML jobs. Historical fast binary, full application symbols, later instrumentation and UI-D2..D6 remain open.

(rev 0.19) Prepared optimized bundle is available. Confirm the log-derived [owner test clip; name redacted for the repository, rev0.98] t=58.4163/K=82/quality=2 case and a quiet host window before measurement. Application symbol coverage needs a later bounded proof/repair for whole-app attribution; it does not block exposed-timing A0 comparison.

(rev 0.18) Release build preparation can proceed without more owner input. The exact log/settings-derived case is a useful candidate; owner confirmation and full resolved run parameters/quiet-window coordination remain before measurement. Historical fast-build identity remains open. Future runner test discovery, instrumentation file fences, presentation evidence and confirmatory thresholds require later rulings; no UI-D2..D6 choice is inferred.

(rev 0.17) Profiling review must resolve exact baseline binary/source, selected Desktop asset/config manifest, symbolized optimized build mechanism, cross-process trace/presentation support, feasible repeat budget and thresholds. Missing concrete asset paths do not block the read-only architecture review. No new user UX decision is required for that review; active ML load must later be owner-coordinated, not started/stopped by the harness without authorization.

(rev 0.16) Native picker/capture blocker needs a stable UI retry and diagnosis; it is not yet a confirmed app defect or owner product choice. No design decision is inferred. IMP-182/183 and UI-D2..D6 stay open.

(rev 0.15) No new owner choice blocks this five-file video correctness slice. UI-D2..D6 and capacity policy remain open and are not inferred from permission to continue. Snapshot timestamp production semantics stay unchanged; the requested-versus-settled association is repaired without promising a new frame-accuracy contract.

(rev 0.14) Native selection behavior supports settled UI-D1. The current rail remains open after selection; proposed automatic collapse is not implemented. UI-D2..D6 remain open; this build does not authorize redesign implementation. Tile Pin/Remove exposure merits a focused keyboard/accessibility check, not a confirmed defect yet.

(rev 0.13) The build's B1 correction is settled from source evidence, not an owner UX choice. Extra release workflow/toolchain/sidecar pinning identified in the read-only diagnosis remains follow-up, not silently included in this fresh local build.

(rev 0.12) Build alignment is a bounded technical ruling in IMP-201, not a new product choice. The owner has authorized building/testing the fixes; no new routing/removal/export policy is inferred.

(rev 0.11) A fresh candidate build and bounded build repair no longer require an owner decision; authorization is explicit. Exact dependency alignment is a technical diagnosis/lead ruling. UI-D2..D6 and capacity policy remain open, with UI-D1 already settled.

(rev 0.10) UI-D1 is resolved by the owner's explicit confirmation: "you are picking the study material then moving around." Shared active material persists across app navigation; changing it preserves the invoking study. UI-D2..D6 and capacity policy remain open. Historical unanswered UI-D1 statements below are superseded.

(rev 0.9) UI-D1..D6 and capacity policy remain unanswered; no owner routing or export behavior is inferred from correctness authorization. These choices do not block the bounded media-format wave. The first coding assignment is no longer an open question: waves 01 and 02 supersede that historical hold below.

(rev 0.8) UI-D1..D6 and native capacity policy remain open; none blocks this first correctness slice. UI implementation remains parked while the owner and Review Lead discuss design. The next conversation begins with collection return routing; a recommendation is not an adopted ruling until the owner answers.

(rev 0.7) UI-T1 below is resolved by the accepted exact-.svelte compiler transform and independently reproduced proof. Preserve its failed alternative as history. Runtime/full-suite/browser checks remain implementation acceptance, not another owner design choice.

- (rev 0.6 / UI-T1) A compatible, narrowly scoped SSR test harness is required for IMP-169/195. The direct installed Svelte-plugin-to-Vitest approach fails on the nested Vite 5 server. Sol is assigned a focused proof; no package upgrade or permanent test-config change is approved. This is a technical hold, not a new owner design choice.

- (rev 0.5 / UI-D1; resolved rev 0.10) The former Colors-only-versus-invoking-study question is settled in favor of shared material and preserved invoking study, per §9.3. Preserve supported native media routing; this does not add unsupported raw-clip behavior. IMP-172 still has UI-D2/runtime holds; pinning never navigates.
- (rev 0.5 / UI-D2) Removal: confirm versus genuine recoverable undo; active-item successor policy; clear-collection confirmation. Do not invent Undo over already-disposed resources or change source-file deletion policy. IMP-172 management wiring remains held.
- (rev 0.5 / UI-D3) Final Settings placement/reset treatment and retirement/migration of compactSidebars; default of the new three-layout preference. Preserve existing controls and preferences until the scoped ruling. IMP-177/196 integration cannot guess defaults.
- (rev 0.5 / UI-D4) Redistributable offline serif font selection and final label field defaults/precision. Reuse existing Fira assets for early development; no network font dependency or inferred color names.
- (rev 0.5 / UI-D5) Live ledger identity/order, scene-cut behavior, overload and focused live zoom remain EPIC-026 decisions. The UI rescope does not authorize implementing that unmerged feature.
- (rev 0.5 / UI-D6) Snapshot-versus-follow-current export interaction: the first proposed builder follows the current valid study while editing, and captures an immutable document for save. Source/configuration changes make stale previews unsaveable until refreshed. This is proposed UX pending the export review; §4.1 retained-job safety is already binding.

- Capacity direction resolved rev0.71: retention-only R, with owned artifacts protected through safe flush. No new admission quota or bounded-overflow ceiling; a future policy change requires approval.
- Round02 C1–C3 remain binding. Slice193-A is assigned; remaining runtime/session/filesystem integrations need later exact fences and evidence. A concrete incompatibility requires a narrow ruling, not a new whole-protocol round.
- Optional IMP-189/190/194 are ruled out of the first required acceptance path (rev 0.3), unless the owner later elevates them.
- EPIC-026's old K<=128 success line conflicts with its GO text and later performance evidence. Reconcile supported limits and remeasure in that epic; this plan does not choose a new limit.

## 8. Decision summary

(rev0.99, 2026-09-28) Preservation done (15144db / 28e5873). Hook/CI 046450d is in, with one regression being fixed. Session 02 timed out and isn't acceptance; session 03 is running. Assignments are held for the owner.

(rev0.98, 2026-09-28) Genga is Review Lead. The deliverable is one web app served to a browser and displayed by the desktop shell. Astra implements and integrates, with Sol as a wave-owning partner. The plan's preservation by a lead commit and merge is PLANNED; it becomes a fact when the commit exists. IMP-193-4 gates nothing, and session 02 is owner-reported.

(rev0.97) 2026-09-18: one assistant-initiated isolated owner session authorized under193-4-L1..L4. No contract change or production adoption; earlier rev0.96 launch-readiness restriction is superseded for this one run.

- (rev0.96)193-4-P16..P18 accept round03f60891e4 as preparation only:62 independently passing tests, exact15-file freeze, selected future binary0e6237f7 in WATeWJ. No new Sol work. Owner-initiated manual launch follows readiness and separate run record; three runtime/owner gates remain open,193-5 backlog.

- (rev0.95)193-4-P13..P15: AMEND round02fc8e5996 despite55 reproduced green tests; narrow to four files for protocol-current receipt admission, drop-before-dispatch snapshots and duplicate-terminal fixture. Freeze R2 source/binaries/probes in Z5s0Og; no visible runtime or owner reapproval.

- (rev0.94)193-4-P7..P12: AMEND report47aba2e3 with six bounded correction groups across eight existing files; preserve original15-file source and both binaries in pjWpcM. Independently reproduced43 green tests; five additional failed expectations prevent launch. No architecture reopening, owner reapproval, runtime or193-5 scope.

- (rev0.93)193-4-P1..P6 acceptsd9c01600 and releases isolated15-file preparation, not runtime. Reserve fresh P8xk8N/pjWpcM roots, p8xk8n namespace and future nonexistent run-20260908-visible-owner-01. Preserve all earlier artifacts and independent native owners.

- (rev0.92)193-4-D1: owner approves trusted packaged-local, unique-child/fail-stop restart contract. Assign193-4 plan only, six bounded owner-facing cases. Preserve193-3 report/verdict and all hidden evidence; no new runtime or production authority.

- (rev0.91)193-3-D1..D5 accepts3cd4b452 as the focused decision deliverable; close193-3 only. Hold193-4 for owner contract choice;193-5 stays backlog. Preserve all platform/detection/liveness/owner-feel and production boundaries, no new assignment.

- (rev0.90) Dispatch193-3 report-only to existing Sol task after owner go-ahead; preserve candidate/evidence and review ownership.193-4 conditional,193-5 backlog. No acceptance inferred from assignment.

- (rev0.89) Keep EPIC-029 as umbrella; reserve193-1..5 and backfill accepted kernel/experiment receipts. Propose193-3 -> conditional193-4 as next sprint;193-5 stays backlog. Restore Sol's per-IMP atomic-commit handoff for future assigned work, with Review Lead review/merge. No task dispatch or product changes today.

- (rev 0.88) Accept C1-RW-RUN-01 finite resultce6daf15/exit0: one native parent survives six child replacements and exact resize while forced stale work preserves native/session owners. No retry, production enablement or C1-C3/193-B closure.

- (rev 0.87) Accept Round03d5b9f06d after independent44/all locked gates and exact three-path H25 review. Release one Review Lead run only on preservedcbad33ec; no production or universal correctness acceptance.

- (rev 0.86) AMEND Round02 preparation78096871 only under H25 after reproducing35/all locked gates. Accept H21/H23 and bounded H24 at preparation level; finish the already-required detected-context guard on receipt/Finished boundaries in three existing files. No run/production acceptance.

- (rev 0.85) AMEND preparationedcb8286 despite reproduced20/all offline gates. H21-H24 correct source-proven unreachable exit checks, two executed protocol/snapshot counterexamples and incomplete receipt/resize evidence. Five-file correction only, no run or production acceptance; frozen original artifacts remain intact.

- (rev 0.84) Accept Round01 final1b58945c as the preparation plan with H17..H20. Release14-path isolated code/compile/pure work, no runtime. Preserve exact owner-specific release and H14 shutdown ordering; no native child-destruction/initial-binding/visual continuity overclaim.

- (rev 0.83) Owner approves separate tauri/unstable retained-window exploration, not a framework migration or production enablement. Reserve fresh PEEpxt namespace and issue bounded Round01 before implementation. Preserve H16 recovery, native retained owners and all evidence; distinguish hidden mechanics from visible UX.

- (rev 0.82) Accept replacement API inventory; hold both production choices. Recommend isolated unstable child-WebView exploration, pending owner direction and a separate brief. Correct report's terminal-retry suggestion without weakening H7/C2; initial binding stays open.

- (rev 0.81) Accept closeout source facts with knownSession=None counterexample clarification; keep current production C1 wiring held. Assign only read-only nonrenewable WebView-incarnation feasibility, no further experiments or implementation.

- (rev 0.80) Accept one complete finite macOS run0ef15c19/exit0, not universal or production C1. Assign only three-question read-only installed-source closeout before the next native slice; no further launch/code authority.

- (rev 0.79) Accept H14 receiver/finalizer handoff and29-test preparation; authorize one Review Lead C1-RUN-02 on2a08c1c5/fresh directory. Preserve failed first run and all production gates.

- (rev 0.78) First isolated run failed honestly at finalization despite reaching seven cases. Preserve ledgerbf09f574 and exact3f0fc8ee; authorize only H14 driver shutdown correction/pure gates, no rerun or193-B.

- (rev 0.77) Accept C1-H13/27-test harness preparation; authorize only Review Lead C1-RUN-01 on exact rebuilt3f0fc8ee with fresh output and preservation. No source fix, repeat run,193-B or production acceptance.

- (rev 0.76) Accept Round02 mechanism corrections as source/pure preparation evidence; AMEND only synthetic Started/Finished ledger provenance under C1-H13. Lead reproduced25 tests and all preparation gates; no launch authorized.

- (rev 0.75) AMEND harness Round01 under C1-H7..H12 after independent source and12-test review. Preserve original evidence and candidate6e12a73; exact six-file correction, no runtime/app/193-B authority.

- (rev 0.74) Authorize one distinct harness RGBA icon and bundle.icon reference under C1-H6 after installed-source verification. All no-launch/candidate/data/193-B fences remain intact.

- (rev 0.73) Accept C1 source report559ee81e, not a proven impossibility or safe application mechanism. Assign only standalone macOS harness preparation under C1-H1..H5. Preserve candidate6e12a73/main/app/evidence and owner-selected retention-only policy.

- (rev 0.72) Accept193-A at6e12a73 after independent473/105 gates. Assign focused C1 runtime seam check only, keeping retention-only policy and all production filesystem/session/consumer gates open. No main/app/evidence action.

- (rev 0.71) Select owner-approved retention-only R; preserve fast-switching owners, persistent snapshot/clipboard retention and safe flush. Supersede prior F/O/numeric gate without silently choosing quotas. Assign only193-A kernel at a0d9dd0 under §12 and amendment193-01; main/running app/evidence unchanged, full193 not accepted.

- (rev 0.70) Accept030 ata0d9dd0 and complete the six local prerequisite reviews with473renderer/92native. Preserve naming/content/ownership and source/transport distinctions. Hold193 for owner capacity behavior/budgets and lead topology amendment; Code Lead stopped, no polling or further implementation assigned. Main/app/evidence unchanged.

- (rev 0.69) Accept029 atf1a30d1 with473renderer/83native and paired panic-safe profiling. Assign030 seven-path naming-only scope, existing sha2 promotion and genuine producer/remover controls. Main/app/evidence and owner pressure decisions unchanged.

- (rev 0.68) Accept027 at3d35787 with473renderer/80native and preserved prior slices. Assign029 only in commands.rs; preserve current core/profiling/error semantics, require thread/panic and profiling lifecycle proof. No main/app/evidence change or owner-pressure selection.

- (rev 0.67) Accept021 atcaf8225 with434renderer/80native and preserved prior slices. Assign027 only: four bridge/parser/test paths, no dependency/native changes, honest mock-transport limit. Main/app/evidence and owner pressure decisions unchanged.

- (rev 0.66) Accept019 at575868c with434renderer/77native and unchanged root lock/022 paths. Assign021 only within two native/source-test paths; preserve source-byte/publication residuals and all existing policy gates. No main/app/evidence action or aggregate180 closure.

- (rev 0.65) Accept022 at5d22118 with434renderer/75native and corrected local helper proof. Assign019 only with exact compose/tempfile/root-lock fence; no other prerequisite, pressure policy, app/main/evidence action or aggregate adoption closure.

- (rev 0.64) AMEND022 only for Windows test-fixture access; production adaptation retains review support but no acceptance/commit. Lead reproduced434renderer/74native and all other local gates. Preserve original report, correct one test file, return round02; no next prerequisite yet.

- (rev 0.63) Accept native delta review ad71a8ec; assign022 only on933d888, with regression-first removal of blind session pruning and unchanged startup retention. Later prerequisites and registry remain separately gated. Pressure behavior/limits unapproved; no main/app/evidence action or new test acceptance.

- (rev 0.62) Accept local wave05 at933d888 after corrected cached playhead, canonical snapshot currentness and scrub policy.434renderer/72native/scalar/profiling pass; main/app unchanged. Next is read-only193 delta/prerequisite review, not registry coding or a new protocol design cycle.

- (rev 0.61) Amend183 before combined acceptance: restore Values cached playhead initialization without settlement reuse, require canonical Home snapshot ownership, retain end-of-scrub dispatch policy. Eleven prepared paths verified and all gates reproduced; source remains uncommitted8a8e133. No main/app/evidence changes.

- (rev 0.60) Accept182 at8a8e133 with two-test391-line scope and nine added tests. Assign183 exact11-path H1–H4 handoff/disposal model; same-epoch stored reuse differs from182 fresh new-selection extraction. Lifecycle/global epoch and content revision remain distinct. Final native/scalar tests required; no next-wave or release authority.

- (rev 0.59) Accept192 at2853040 after amendment01 and reproducible404-test gate. Retain exact18-source-path scope and acknowledged cleanup deviation. Assign182 conservative cached-frame race reconciliation in two tests only; do not restore old preserve/RestoreIntent design. Lead commits before183; no app/native/timing/design changes.

- (rev 0.58) Amend192 before commit: guard stale Home error diagnostics, isolate canonical frame/strip ownership in regressions and correct submission provenance/accounting. Original18-path authority retained;182/183 remain held. No source/Git/app action by lead and no new owner question.

- (rev 0.57) Accept wave05 preflight with explicit18-path192 fence; allow small clipboard helper extraction for actual pre-await tests, not a general framework. Adapt013 with192, reserve023 disposal/handoff for183, retain test-only182. Lead owns serial commits and final combined review; no app, native, timing, schema, export/Batch or release mutation.

- (rev 0.56) Accept/commit181 at41222c5 after independently reproduced356frontend/72native/1scalar/88profiling/10hook gates. Preserve three-issue wave04 provenance and explicit mounted/integration gaps; issue read-only wave05 selection/frame preflight, not a third general architecture review or blanket implementation.

- (rev 0.55) Accept017 and commitdbfad26 after independent351/60/88/10 gates. Assign final181 request-key slice and full final-wave validation, preserving both earlier prerequisite commits and all profiling provenance. No automatic Batch rerun, native ownership, debounce change, main integration or release.

- (rev 0.54) Accept and commit010 after independent340/49/88/10 gates; dispatch five-file017 at44d7f57. Preserve conservative video recomputation, Values pending-token revocation and exact cached-entry positive controls; no release, main integration, scheduling change or aggregate closure.

- (rev 0.53) Accept wave04 adaptation, reject boolean cached-video preservation, retain Values token invalidation and non-recycling content identity. Commit exact profiling prerequisite after separately repaired hook; assign phase010 only, then017 and181 at named subsequent bases.

- (rev 0.52) Proceed after normal owner B14 trial. Assign bounded010/017/181 source preflight; lead scopes gesture-aware scheduling separately. No new capture or general audit; preserve all original evidence and no claim the prior stall is fixed.

- (rev 0.51) Accept B20 bounded visible-interaction diagnostic and QA-checked graph; notify owner, send Sol verdict, pause follow-up. Preserve RAF2/clock/binding/coverage caveats; no benchmark, speedup, integration or aggregate completion claim.

- (rev 0.50) B19 visibility guard correctly withheld completion. Authorize new B20 foreground/visibility-gated capture, not an instrumentation repair; retain count correction2533 total/2530 backtraces and incomplete binding/UI provenance limits.

- (rev 0.49) Accept B18 R1; authorize one scoped B19 fresh-process attribution pilot with reused app caches, immutable original traces and explicit native-only sampling coverage. Normal exact-app quit/relaunch supersedes prior sealed-app no-control only for this new session; no purge or recovery loop.

- (rev 0.48) B18 R1 is one local signed-zero spacing fix plus real production regression, within the existing two-file fence. Preserve prior successful gates and diagnostic receipts as historical evidence.

- (rev 0.47) Accept B17 as repair basis and authorize exact two-file B18 implementation with strengthened endpoint and tolerance-boundary regressions. Do not rewrite raw decimals, change serde features or relax non-duration checks.

- (rev 0.46) Native capture-hook repair has runtime association evidence; preserve strict-equality failure for actions3/8. Assign narrow B17 transport/comparison review, no tolerance or trace rewriting authorized yet.

- (rev 0.45) Preserve B15 controller-stop artifacts; record successful one-click lead import despite tool capture error. Authorize only same-process/session B16 remaining controls; no relaunch/recovery or performance inference.

- (rev 0.44) Accept exact B14 build/static proof and preserved shell receipt failures. Assign one fresh B15 ordinary-UI control capture with exact binary/session and honest superseded-input accounting. No eligible/performance or aggregate closure.

- (rev 0.43) Accept two-file B13 capture-hook repair with independent gates; preserve exact57 archive. Assign build-only B14 in a distinct root/identity, followed by lead build review and fresh native control assignment.

- (rev 0.42) Accept scoped trusted Chrome ordering proof; authorize B13 exact two-file repair. Correct B12 native recipe: do not force intermediate work past debounce and do not infer overhead from repeated profiling-on runs. Preserve all prior artifacts.

- (rev 0.41) Preserve B11 as loss-free failed-correlation diagnostic. Correct rev0.37 native-ordering inference and live stderr index classification. Assign bounded B12 trusted-input review; no production scheduler change or aggregate closure. Lead owns immediate next handoff.

- (rev 0.40) Accept exact B10 build and preserved inventory friction. Assign B11 fresh real-UI v2 diagnostic, including actual empty delivery and settled-valid correlation checks. Preserve B7 failure and all immutable artifacts; no eligible/performance or aggregate closure.

- (rev 0.39) Accept B9 source including strict v2 invalid-input evidence and H1-H2 corrections. Archive exact57 dirty paths, assign uniquely identified B10 build only; no runtime or aggregate closure.

- (rev 0.38) Retain passing B9 renderer/native direction; amend two evidence-validation gaps in three files. Diagnostic invalid input must still check available render config, and v2 schema must require its fixed event payloads.

- (rev 0.37) Accept narrowly discriminated schema-v2 analysis evidence and exact old v1 compatibility. G1-G7 add source-match/capacity/native-state/diagnostic-reason guards and permanent reproducible tests; preserve resolved internal state. Assign B9 implementation in20 files, prepared/uncommitted.

- (rev 0.36) Retain failed B7 diagnostic; profiling-b7-control-proof-verdict.md corrects sampled empty-state interpretation using saved logs. Assign B8 focused repair review, not resweep. Honest unavailable config, strict sequence/sticky failure and unchanged production behavior are binding.

- (rev 0.35) Accept exact B6 build with one disclosed private reconstruction-directory mode repair. Assign a first profiling-on operator/trace diagnostic through normal UI; preserve B2, all immutable artifacts and single-lifetime limits. No eligible timing/performance or aggregate closure.

- (rev 0.34) Accept B5 source locally after independent gates/boundaries. Preserve uncommitted56-path carrier and immutable B2; assign B6 build/symbol/source preparation only in a fresh namespace. No app/runtime/performance or aggregate closure.

- (rev 0.33) Accept B4 mechanical basis with sticky loss, sequence and single-renderer-lifetime limits. Assign B5's eleven-file implementation/test fence; no native/status/recovery subsystem, app build/control/capture, Git mutation or aggregate acceptance.

- (rev 0.32) Accept B3 import/K/navigation smoke only; preserve resize as unrun and leave B2 open. Assign focused read-only B4 finalization-boundary review before any new source/build/capture. No performance claim or aggregate ticket closure.

- (rev 0.31) Accept smoke01 only as partial control evidence; explicitly adopt the verified existing B2 process for smoke02 through the retained app object. Preserve both process histories and prohibit another silent relaunch.

- (rev 0.30) Accept exact immutable B2 build; assign one profiling-disabled B3 smoke on the supplied reference. Keep capture-finalization usability, real binding, on/off parity/overhead and broader workload acceptance open.

- (rev 0.29) Accept B1 locally, preserve uncommitted source and all prior evidence, and assign build-only B2. Record and disclose the accidental ordinary debug launch separately; prohibit guessed-binary test enumeration. No owner bell or performance claim.

- (rev 0.28) AMEND only D1–D4 after independently reproduced full gates. Preserve Round02 and accepted corrections; no new audit/split round, owner bell, app build or performance claim.

- (rev 0.27) AMEND B1 under C1–C8 despite passing gates. Preserve original source and all A1 bytes; close cross-language/reactivity/lifecycle/evidence gaps before building. Split actual domains under the named fence; no owner bell.

- (rev 0.26) Proceed with the eighteen-file Colors vertical implementation under V1–V7. Keep action observation separate from request authority, observed endpoint separate from persistence, and path equality separate from source/build content proof. No app optimization or live capture in this sitting.

- (rev 0.25) Accept A1 locally, prepared and uncommitted. Proceed to one narrowly scoped B0 source-boundary report for live input-to-result measurement, preserving all app/optimization/owner-workload fences.

- (rev 0.24) Retain settled A1 corrections and gate evidence; issue narrowly fenced AMEND R9–R10. Preserve Round 02 source/report/projection; no acceptance, commit, owner bell or broader instrumentation.

- (rev 0.23) AMEND A1 before integration despite passing gates. Preserve reports/snapshot, add targeted counterexample tests and split by actual domain/I-O/test boundaries. No owner bell or speculative app optimization.

- (rev 0.22) Continue with A1 durable evidence tools and lead-owned native capture proof concurrently. Save an owner-authorized memory note; retain two-lead separation, originals and no-optimization boundary. Notify/pause only on a concrete owner blocker.

- (rev 0.21) Accept only A0 nearby-frame warm-process diagnostic evidence, not exact reproduction or complete profiling acceptance. Preserve every trial/control failure and original owner timing semantics. Choose a separately fenced reproducibility/tracing slice before optimizing.

- (rev 0.20) Execute the A0 native pilot on the owner-confirmed case. Desktop media is permitted for testing; keep this first experiment fixed/private. Installed app, immutable build evidence and no-optimization fences remain protected.

- (rev 0.19) Accept the optimized A0 artifact with disclosed application-symbol limitation, preserving original binaries and no-source-change status. No runtime or regression claim follows from successful packaging.

- (rev 0.18) Accept profiling design with P1–P8; dispatch A0 build preparation only. Distinguish exposed kernel timing, log pending intervals, approximate readiness and actual presentation. Preserve exact execution/cache provenance and private evidence; no automatic instrumentation or performance adoption.

- (rev 0.17) Adopt a durable end-to-end real-app profiling workflow as the next review target, not a claim that Wave 03 regressed. Keep debug/optimized comparisons and IMP-178 adoption separate; start with the smallest optimized sanity comparison after a scoped verdict.

- (rev 0.16) Accept the two bounded video patches locally; keep incomplete native video checks visible. Preserve both bundle identities and the clean seven-commit stack, with no main integration or release.

- (rev 0.15) Proceed with SWEEP-003/008 under the wave-03 brief. Preserve the clean five-commit base and running smoke-tested bundle; later issue commits follow independent review. No broader acceptance or redesign authorization.

- (rev 0.14) Accept IMP-201 and the first native smoke locally; retain exact bundle evidence and keep broader acceptance/integration open. Preserve the installed app, other worktrees, and the reviewed per-issue stack.

- (rev 0.13) Use the minimum four-file reproducibility repair; withdraw the unnecessary Cargo feature/caps proposal. No production application behavior is changed by IMP-201.

- (rev 0.12) Track the tested native dependency graph and align its two JavaScript peers under IMP-201; package with a self-contained asset protocol. Preserve the installed application and all other lanes.

- (rev 0.11) Accept wave 02 locally; prepare a fresh candidate app and inspect it with computer use. Fix diagnosed build prerequisites separately, preserve the installed app, and keep automated tests, runtime observations and human/release acceptance distinct.

- (rev 0.10) Collection is a shared study-material picker, not a route that chooses Colors. Material follows the user between views; selecting new material preserves the current study and controls. Batch pin sets and captured export-job inputs retain separate ownership. No UI implementation or export-builder follow/freeze ruling is implied.

- (rev 0.9) Accept locally validated wave 01 into the prepared stack only; continue with SWEEP-009/011 under the next exact brief. Preserve unmerged lifecycle status and all human/platform acceptance gaps. No additional design ruling is adopted.

- (rev 0.8) Resume correctness implementation now: canonical golden path repair (IMP-179, preserving IMP-178 provenance once) then self-contained listener setup/teardown repair (SWEEP-004 under partial IMP-180). Fresh isolated worktree, exact fences, no agent commits, lead review and atomic issue commits. Sol is not being sent another general review.

- (rev 0.7) Accept Round 02 R2-1..R2-4: one Vitest-only exact-.svelte server compiler transform, public package resolution, unchanged .svelte.ts/audit behavior and ordinary test discovery. Reproduced 17/17 locally; Node 20/full/browser gates remain. Ready for a bounded coding brief, not already implemented.

- (rev 0.6) UI Round 01 C2–C6 are accepted with V2–V6 in the numbered verdict. Preserve the report; correct the inventory to nine font binaries plus README. C1 is AMEND pending a focused executable compatibility proof. No implementation or further whole-epic review is implied.

- (rev 0.5) Refresh EPIC-027 in place, preserve IMP-167 completion and IMP-168..177 identifiers, and archive the prior prescriptions. Reserve IMP-195..200 for shared feedback, layouts, true 3D, 3D capture, patch labels and shared export documents. Checked fetched refs and all seven registered worktrees on September 5; highest prior reservation was 194 (performance owns 178).
- (rev 0.5) The owner endorsed a flatter crisp study UI, three presentation arrangements over one data model, compact collection → full browser → select/return, an optional true OKLab gamut view, and a preview-based export builder retaining current controls. The major added product capabilities are 3D and better patch labels, not an unconstrained design editor.
- (rev 0.5) Supersede the old folded-page/spine/tape/ground-toggle prescriptions and unrequested behavioral changes in the July bundle. Preserve current analysis switches/defaults, native media behavior and formats; do not remove snap-to-real or upload controls merely because old notes said so.
- (rev 0.5) EPIC-029 remains accepted design basis, unimplemented in main; 33 sweep commits remain unmerged, native capacity decisions remain pending, and IMP-178 remains isolated/uncommitted. UI foundations may be prepared without waiting for the full remediation epic; active async consumer rewrites wait for their specific corrected seams.

## 9. September study-interface ruling and ticket contract (rev 0.5)

### 9.1 One study, several arrangements

The approved direction is flat paper/ink with crisp type, restrained navigation and an expanded palette index. Workbench, Image first and Study sheet are presentation preferences, not three independent stores or duplicated app workflows. Existing Colors/Values/Batch/Exports navigation and all current commands stay reachable. Native accessible controls are preferred over recreating every old decorative component. Basic reflow ships with each surface, not as a deferred cosmetic phase. Current Fira fonts already exist; an editorial serif is a visual proposal subject to licensing/asset approval. Early tokens/components remain dormant until explicitly wired.

### 9.2 Honest lifecycle surfaces

The 34-frame user storyboard covers import, ready/pending/previous/error, collection, management, inspection, Values/Batch and desktop video. New drawings are review candidates, not automatic feature authority. Shared presentation types/components may describe existing states, but cannot manufacture progress, cancellation, source retention or retry guarantees. Previous results must identify their actual source/settings. UI integration preserves §4 request and artifact invariants and requires the relevant EPIC-029 consumer corrections. Batch pins remain separate from active media and from Colors parameters. Preserve all real SettingsView/ExportsView options in the inventory.

### 9.3 Collection

(rev 0.10 / UI-D1) The owner confirms the existing mental model: pick the study material, then move around the app. One shared active-material selection follows navigation; do not introduce independent image selections per Colors/Values view. Choosing material in the expanded collection updates that selection, collapses the picker back to its invoking study, and preserves the study's controls. It does not force Colors or reset the study. Recompute/invalidate source-dependent results under §4 with honest pending/error state. Batch pins are separate from the active item, and an in-flight captured export keeps its admitted inputs. Preserve existing compatible native image/video paths; no new unsupported route is inferred. Export-builder follow/freeze remains UI-D6.

The compact strip shows as many useful thumbnails as fit, capped at an approved practical maximum rather than shrinking them indefinitely. The hidden count is total minus visible unique items; View all remains when there is no overflow. Selecting an off-strip item changes the visible window, not collection order. Active selection remains visible. Opening a media tile returns to the invoking study after selection intent, with honest loading/ready/error; pin/range-pin/removal controls do not navigate. Back/Escape preserves active media. Focus/scroll restoration must be revocable and source-compatible. UI-D1 routing is settled above; destructive-action specifics remain UI-D2.

### 9.4 Export builder and annotation

Keep current Colors controls (source, polar, cluster histogram/all sorts, hue-lightness, palette, available video barcode), Values controls (neutral/include-original, range finder, histogram, simplified/all studies), Batch controls (grid and corresponding color figures), individual saves, PNG scale 1–4, graph SVG/PNG preference and CSV/ASE/JSON. Composite output stays PNG. No JPEG/WebP/freeform placement/new palette schemas are authorized. The actual export composition, not a screenshot of the application shell, is the preview.

Analysis state and export presentation are distinct. A single captured document binds source/result/parameters, selected tiles, label options, format/scale and optional 3D camera; both preview and save use its builders. Latest preview wins; stale output cannot be labeled as current. Before saving, immutable input/retained-job authority comes from EPIC-029 IMP-184 and §4, not a renderer-only copy pretending to retain external bytes. IMP-200 depends on that foundation and does not recreate the registry. Avoid overlaps with optional export refactors IMP-189/190 and filename provenance IMP-194.

Patch labels should clearly identify a stable patch, HEX and share, with optional technical data; exact defaults/precision remain UI-D4. Preserve stable cluster identity when display ranks change. No invented color names. Visual label layout/fixtures may change only within IMP-199; CSV/ASE/JSON and unrelated chart bytes remain unchanged. 3D exports are raster captures from a specified camera, with honest PNG/mixed-raster capability; do not label them vector 3D or promise cross-GPU byte identity.

### 9.5 True 3D and focus

Keep the existing deliberate 2D polar/hue-lightness normalization. Third primitive: actual sRGB gamut boundary transformed into OKLab, equal units on the coordinate axes, source palette positions and an explicitly documented proportion encoding. A cylinder is not that gamut. Reuse existing pure conversion math and golden evidence; the numeric core is not duplicated or revised. Offline-bundle a reviewed Three.js dependency, render on demand and dispose resources. Provide keyboard/preset camera control and a 2D fallback when WebGL fails.

Expand is distinct from mark selection and rotation. Preserve camera, selected cluster, source and return position through focus. Existing image/2D zoom remains usable. There is no new pinned-card chart-ground preference or mandatory page-lift effect.

### 9.6 Scheduling and review boundary

First UI review range: IMP-168 → 169 → 195, dormant references/tokens, minimal surfaces and feedback. No active consumer rewiring and no global remediation dependency. Subsequent lane: 196/199/197, then shell/views/focus on individually corrected runtime seams. Consumer lane remains serialized with EPIC-029: source identity/restore fixes before active view wiring; 188 before queued return changes; 185/184 before export document consumers; 186 before aggregate surface lifecycle wiring. Backlog tickets signal explicit design or technical holds, not discarded vision.

The normative decision source is this record. RAG/design-2026-09 is evidence and a coverage/walkthrough projection, not a second constitution. Sol receives a self-contained brief, reports corrections before coding, and awaits a bounded verdict without polling. No new task, recurring watcher, merge or code commit is implied by dispatch.

### 9.7 Foundation review refinements (rev 0.6)

The isolated showcase uses its own HTML/dev entry, never App/main/app.css or a production route. Only that dev entry imports new study styles. Root every selector under [data-study-surface], namespace --study-* variables, and verify shipping import/build exclusion. FigureFrame has a textual title and Svelte 5 typed Snippet composition; no legacy slots or general decorative framework.

Feedback descriptions keep current-request provenance separate from visible-result provenance, including when pending and previous coexist. Display strings establish no runtime authority. Actions/copy come from the caller; never synthesize recovery guarantees or invoke actions on render. Pure types own no async machinery. Busy/status/error announcements are deliberate, not a live region around the entire display.

Preserve eight pinned references byte-for-byte; distinguish copied-source hashes from generated wrappers. Six non-3D HTML references and one Markdown register are offline-inspectable without runtime imports. The seventh HTML is a preserved network-dependent 3D prototype with a source-confirmed error path, not a bundled production fallback. Actual offline 3D and 2D visual fallback remain IMP-197. Keep all archives and font binaries unchanged. There are nine existing font binaries, six matching archived files, and no license record found in the inspected font directory/archive; do not claim legal verification or fetch assets. An isolated page must not assume it inherits shipping font declarations.

SSR testing must use a proven route compatible with installed packages. The direct Svelte plugin 6.2.1 / Vitest-nested Vite 5.4.21 combination failed the lead's bounded diagnostic; configuration/helper scope remains UI-T1. The isolated browser page is approved in principle, not built. Test structure with real Svelte SSR and interactions in the browser at 360/736/1024/1440 plus 720×600, without changing production entries, package files or legacy audit expectations.

(rev 0.7, supersedes the UI-T1 hold above) Match query-stripped IDs ending exactly in .svelte and compile through the public installed svelte/compiler API for SSR; .svelte.ts stays untouched. Resolve from the candidate package boundary, return code/maps and errors, preserve current test discovery/environment/alias. No dependency, production configuration, general preprocessor/helper framework, server lifecycle or absolute proof paths. Typed-config, full-suite, Node 20 and real browser acceptance remain pending. See Round 02 R2-1..R2-4.

- (rev 0.1) This task holds project steering and review authority per the owner's September 4 instruction.
- (rev 0.1) July sweep completion means branch implementation, not shipped remediation; current main and core ownership govern integration.
- (rev 0.1) Recommend a separate code lead for approved coding ranges; no code-lead task has been dispatched yet.
- (rev 0.1) Preserve active performance work and its IMP-178 reservation. Correctness takes precedence over preserving outputs known to be wrong.
- (rev 0.1) EPIC-029 covers adoption and residual correction; EPIC-026/027 retain feature/design ownership. Existing design decisions are not reopened by this audit.
- (rev 0.1) Retain issue-granular SWEEP provenance and require source revision, publication, and release-ownership tests before closure.
- (rev 0.2) Owner supplied the existing Code Lead task and authorized notification. Round 01 review was dispatched; this supersedes the earlier not-dispatched state without authorizing implementation.
- (rev 0.3) Round 01 received; AMEND verdict requests a focused review-only Round 02. Preserve the report and its counterevidence. Rust golden reader is correct; only the renderer path needs repair.
- (rev 0.3) Current integration floor is `5baa20e`; planning remains `2cc2000`. IMP-179 absorbs the already prepared fixture repair once, with provenance, independently of full performance acceptance.
- (rev 0.3) Approve separate selection/content/execution identities and one-native-registry direction, subject to the recorded lifecycle amendments. Do not adopt blanket startup deletion or a new hard cache quota without a ruling.
- (rev 0.4) Accept Round 02 as the design basis with stale-bootstrap, lost-operation recovery and exact-input cache-binding clarifications. General review is complete; no implementation or new quota is authorized.
- (rev 0.4) Preserve legacy retention, retained-job independence and exclusive shared-file scheduling. Capacity policy does not globally block the independent fixture repair or already-available source-patch corrections.

## 10. Real-app profiling contract (rev 0.17)

### 10.1 Purpose and comparison boundaries

Measure actual user interactions and correct visible outcomes, not only numeric kernels. Preserve the owner's slow debug observation without declaring its cause or regression ratio. Current durationMs is k-means-call time; sampling has a separate internal timer, and total user wait includes work outside both. Intentional debounces, cache hits, parallel work and stale/cancelled requests must be observable rather than hidden.

Start with a matched quiet optimized-build sanity comparison. The full matrix distinguishes identified known-good prior release, accepted Wave 03 without IMP-178, and optionally Wave 03 plus a separately reviewed IMP-178 snapshot. Debug is diagnostic-only and never the regression baseline for release. Historical immutable binaries lacking source/symbols may supply end-to-end observations but cannot be assigned invented internal spans. A recompiled historical tree is a separately identified arm.

IMP-178 stays independently owned and uncommitted until reviewed. Record exact diff/new-file hashes when identifying its proposed state; a branch at 2cc2000 is not the patch. Future integration uses a new reviewed candidate and excludes the already adopted IMP-179 fixture-path repair. Do not combine this with EPIC-026 feature adoption or SWEEP-012/IMP-187 math changes. No numerical shortcuts, sample/iteration reductions or output-parity concessions under profiling authority.

### 10.2 Reproduction and experimental conditions

Every run binds exact source/dirty-patch state, executable/symbol/lock/sidecar hashes, build profile/flags/features/toolchain, machine/OS/viewport, case ID, asset digest/media metadata/frame intent and full resolved analysis/render parameters. Private asset paths map locally to stable IDs; no broad Desktop inventory, raw media commits or trace uploads. Preserve original binaries/traces/records and version the schema and analysis.

Separate first response/feedback from correct-result presentation. Include still import, video initial/frame step/seek, representative parameter change and navigation/switching as staged real-app cases; extended Batch/export scenarios can follow without pretending a kernel benchmark covers them. Correctness requires source/frame/parameters match; stale publication is failure even if fast.

Define cold explicitly (for example fresh process/app caches), separate from OS filesystem cache. Do not purge system caches or delete user-owned data. Specify warm-ups, randomized/counterbalanced run order and seed, quiet versus owner-coordinated active-ML conditions, thermal/power/workload notes and per-case repetition budgets before measurement. Do not start/stop training, change system settings or inspect unrelated process arguments. Keep non-comparable cases in distinct strata.

Report p50/p95 with counts/estimator/uncertainty and failures/cancellations/censored runs; small pilots do not establish reliable tail claims. Never silently discard stalls/outliers. Define absolute and relative regression/overhead criteria before confirmatory comparison, after a reviewed pilot if needed; the remembered 20–60 ms is not a universal SLA. Distinguish exploratory threshold selection from later confirmation.

### 10.3 Trace semantics and implementation constraints

Tracing is optional, bounded and local. Disabled overhead must be demonstrated. Correlation IDs are observational and cannot replace selection/content/execution authority or alter result/cache keys. Every admitted action has a terminal status; missing/dropped spans are explicit. Preserve production response/export contracts and Tauri-free color-core. Avoid tracing inside per-pixel/per-centroid hot loops; aggregate per-stage/iteration observations with a bounded collection policy.

Source-verified stages should cover input/debounce/admission/wait, FFmpeg/process decode, image decode/downscale/sample, OKLab and dataset preparation, k-means initialization/iterations/final assignment, snap/merge/conversion, serialization/IPC delivery, store publication, chart/SVG generation, DOM and presentation. Attribute parentage/concurrency and distinguish elapsed wall time from CPU sampling. Do not add overlapping spans as if they were serial.

Rust, JavaScript and profiler timestamps have distinct clock domains until calibrated with stated uncertainty. A requestAnimationFrame-style endpoint is an approximation unless actual presentation is independently demonstrated. Record native, Rayon, FFmpeg and WKWebView/WebContent process coverage and limits; a native CPU flame graph alone is not a full renderer/wait timeline. Native and JS profiling mechanisms must be verified for installed tools rather than assumed.

Preserve optimized code generation while retaining matched symbols/source maps. Instrumented/uninstrumented paired controls quantify profiling overhead and prove output parity. Build/run isolation must account for preferences/cache identity as well as productName; a differently named bundle alone does not establish isolated state. Capture/analysis tooling must validate schema, identifiers, partial traces, failures and no-result runs.

### 10.4 Current authorization

(rev 0.17, superseded for A0 preparation by rev 0.18) IMP-202 began planned with a read-only Round 01 except one new review report. Sol proposed staged fences and measurement semantics before implementation. Lead retains steering, ticket ownership, IMP-178 integration review and final acceptance. Source correctness waves remain accepted locally; this profiling priority does not close their outstanding lifecycle/platform gates.

### 10.5 Binding profiling review amendments (rev 0.18)

(rev 0.20) The following preparation-only gates are historical. §10.6 supersedes them only for the bounded real-app pilot.

Profiling Round 01 P1–P8 governs the accepted design. Current authorization is A0 build preparation only under its exact brief: separate target/artifact root, productName Color Tool Profile A0, identifier com.color.tool.profile.a0.r8bf3187, no source changes or launch. Line-table settings must preserve ordinary release optimization and matching symbols must actually resolve to source lines. Runtime namespace isolation remains a later observed gate.

Uninstrumented A0 must not invent internal spans, RAF2 or presentation endpoints. Exposed durationMs is run_kmeans time; external operator/video observations require their own method/uncertainty labels. New execution must be established for each repetition; restored results, deduped attempts and cached displayed timings are distinct conditions. Future ready_correct_raf2 is an approximation, not presented_correct. Correctness and observation precision are separate dimensions.

Small A0 pilots report all outcomes, counts, median/range; no reliable tail or causal debug-regression claim. Gross-slow thresholds are triage, not SLAs. Future overhead/regression thresholds remain provisional until an explicit plan verdict. A1's proposed scripts/profiling spec is outside current Vitest discovery; require an explicit Node test command or separately approved discovered test/configuration fence. No such source fence is approved now.

Preserve the disclosed pre-brief broad Desktop inventory chronology without repeating it. Hashing reads file bytes; no visual inspection is not the same as no content read. Do not promote inventory guesses or persisted settings alone into owner-confirmed resolved runtime inputs. Further investigation, real-app runs, instrumentation and IMP-178 adoption remain separately gated; the full end-to-end profiling objective remains open.

### 10.6 Owner-confirmed A0 pilot (rev 0.20)

(rev 0.22) A0 run-01 is settled under its verdict. §10.7 now governs the next slice; the pilot protocol below remains historical.

Owner accepts the exact proposed clip/time/K/quality and quiet run; Desktop material may be used for relevant tests. Run-01 admits only that fixed case under profiling-a0-run-01-brief.md. Launch and ordinary UI operations on the isolated A0 bundle are authorized, including normal app-local persistence. Confirm resolved namespace and control state. Source media is immutable; no installed-app control, broad inventory, uploads or workload manipulation is necessary or authorized by this pilot.

Use K81→settled→K82 target trials with proof of newly issued analysis; 2 warm-ups, 7 warm-process target observations, optional 3 fresh-process observations separately. No cache purges or machine-cold claims. Exact unavailable seek/frame/configuration or control failures produce explicit unmatched/partial evidence, not fabricated reproduction. Record actual exposed kernel timing, separately supported pending interval, complete attempt accounting and median/range. No new tracing/source changes or optimization. Lead independently reviews the submitted evidence before choosing the next slice.

### 10.7 A1 implementation and native capture proof (rev 0.22)

(rev 0.26) A1 and B0 are settled. §10.8 supersedes the earlier no-source-instrumentation fence only for its explicit B1 implementation; build, launch, capture, symbols and other source files remain gated.

(rev 0.25) A1 is locally accepted under its Round 03 verdict. The only new Code Lead authority is the B0 source-boundary review brief; actual source instrumentation, app capture/build and symbol repair still require their exact implementation assignments. Earlier A1 file fences below are retained as history.

(rev 0.23) R1–R8 in profiling-a1-round-01-verdict.md supersede the original A1 file fence for the named correction round. Sixteen A1 files total, same no-app/build/config/dependency/Git constraints.

Owner explicitly permits proceeding. A1 is the eight-file Node standard-library record/validator/summarizer slice in its self-contained brief. Correct the former out-of-discovery .spec.ts plan to explicitly executed profiling-tools.test.mjs. Unknown/invalid records fail; private evidence remains outside Git; no automatic scans, shell commands, overwritten artifacts or leakage through redacted output. Keep attempted actions, provenance/clock/method, exact/unmatched frame, process/cache/workload/visibility and outcome strata intact. No tail or causal inference from a small pilot.

Lead independently uses the existing isolated app to establish reliable exact-source selection and accessible controls, plus supported screenshot capture/retention. This is a capability/control proof, not another statistically comparable A0 timing run. Preserve evidence in new private artifacts. No new input injection/production endpoint or guessed APIs; use documented computer-use actions. Later native/renderer instrumentation and symbol repair remain separately fenced under B, not folded into A1.

### 10.8 B1 Colors vertical observation (rev 0.26)

(rev 0.29) B1 source is locally accepted under profiling-b1-round-03-verdict.md. Its old no-build fence is superseded only by the exact B2 preparation in §10.9; no source changes or live acquisition follows automatically.

(rev 0.28) Round02 verdict D1–D4 narrows correction to eight named existing paths. Exactly one bound schedule precedes admission; legitimate same-action repeats may continue until terminal without becoming ineligible. Successful sealing ends every write/reservation/counter mutation. Pre-finalization refused observation produces safe durable loss or prevents sealing; invalid identifiers never enter persistence. Prior C1–C8 and V1–V7 remain otherwise intact.

(rev 0.27) C1–C8 in profiling-b1-round-01-verdict.md supersede the initial eighteen-file-only fence for the named correction. Positive final-session sealing and all-record integrity are required for eligible import; real Svelte proxy identity and post-store observer ownership must be proven. No initial B1 implementation acceptance is implied.

profiling-b1-implementation-brief.md V1–V7 governs eighteen exact files. It implements optional observation from delivered analysis-affecting input through existing debounce/native aggregate/accepted result to associated_result_dom_raf2_approx. No physical presentation or numerical oracle claim; zero enabled figures is unverified. An internal duplicate scheduling callback cannot end an active user observation as deduped.

Observed action outcome is immutable; writer/close receipt separately establishes written evidence, not power-loss durability. Any session loss/failed write conservatively taints imported actions. Explicit acquisition binding joins exact trace/build/case bytes and preserves asserted versus verified source/executable status. Mixed settings require explicit per-case selection/accounting, never a shared invented case.

One lifetime status handshake is allowed while disabled; no per-action observer work beyond a disabled branch. Preserve production request/cache/cancellation and output contracts. Synthetic implementation gates do not close actual app build, mounted DOM, parity/overhead, source-symbol, video-frame or process coverage acceptance.

### 10.9 B2 isolated instrumented build preparation (rev 0.29)

(rev 0.30) B2 is accepted under its build verdict. §10.10 alone supersedes the no-launch fence for its exact profiling-disabled smoke; source/build changes and instrumented acquisition remain unassigned.

profiling-b2-build-brief.md governs one offline locked release build of the exact accepted dirty53-path source carrier on8bf3187. New product/window identity Color Tool Profile B2 and identifier com.color.tool.profile.b2.r8bf3187 isolate it from ordinary/A0 namespaces. Reserved artifact root is color-tool-profile-b2.wLOiuF beside the planning/candidate worktrees; preserve its accepted37-file B1 source archive and all prior artifacts.

Command-local line-tables-only, split-debuginfo=packed and strip=none are allowed; normal release optimization/features/numeric policy remain unchanged. Require actual core/application compile-flag evidence and both source-line symbol lookups, exact executable/dSYM and dirty-source hashes, strict private A1 build manifest plus necessary supplementary provenance. An absent renderer source map stays unavailable; no schema/config/source workaround.

Only generated artifacts/private logs/inventory and one B2 submission may be written; normal ignored renderer dist regeneration is allowed. No app execution, including guessed --help/--list probes. Use static bundle/Mach-O/DWARF inspection and normal Cargo test identification. Successful preparation still requires lead review before a separate controlled launch/acquisition, on/off parity and overhead assignment.

### 10.10 B3 profiling-disabled real-app smoke (rev 0.30)

(rev 0.32) Smoke02 is accepted under profiling-b3-smoke-02-verdict.md except unrun geometry. The exact reference loaded and K45→46→45 plus Colors→Values→Exports→Colors retained the study. Thirteen evidence hashes and53 source hashes independently match. Leave the adopted B2 process open; the prior smoke authority does not become continuing app-control or tracing permission.

(rev 0.31) profiling-b3-smoke-01-verdict.md supersedes the initial new-launch rule only for verified existing PID67432/start20:29:26. This already-running process has the accepted executable and profiling key absent. Reuse the retained controller object, check identity on both sides of attachment, keep smoke01 immutable, and write smoke02 separately. Existing runtime state is not fresh; no cold/timing claim or automatic restart is authorized.

profiling-b3-smoke-brief.md governs one controlled launch of the immutable B2 bundle identified by executable9f297d5e67c90259ab44c96fa2b8101974c7b6e3d8a712dcce117ccba8681ed7 and com.color.tool.profile.b2.r8bf3187. Explicitly omit COLOR_TOOL_PROFILE_SESSION. Verify actual PID/path and runtime namespace before media input; do not control ordinary/A0 apps.

Use only the owner's supplied palette-wheel PNG (digest e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790), original immutable; an exact private evidence copy is allowed. Observe initial/load, configured45→46→45 cluster changes, shared material through Colors/Values/Exports, optional narrow900×720 and restored window. Keep all setup/failures and do not force unavailable controls through preference-file edits.

No benchmark, instrumentation/capture, source/dependency/build/Git mutation, export jobs, broad Desktop inventory or owner-workload control. Native finalization control remains a separate lead decision. Normal B2-only persistence and private smoke evidence under color-tool-profile-b2.wLOiuF/b3-smoke-01.ZeEyA0 are allowed. Final report identifies actual retained screenshots/AX/logs versus transcriptions/unavailable evidence, final open app/PID, unchanged source/input and unresolved gates. Stop at review after bounded documented control alternatives, not blind repeated clicking.

### 10.11 B4 operator finalization boundary review (rev 0.32)

(rev 0.33) Source review settled under profiling-b4-finalization-verdict.md F1–F5. §10.12 supersedes its report-only fence for exact B5 renderer/test implementation, not native source, packaging or runtime work.

profiling-b4-finalization-review-brief.md authorizes one new source-grounded report only. Preferred bounded direction is an accessible profiling-only session status and Finish capture action, absent while profiling is disabled. Lead will settle its host/API/test fence after review, not delegate product design or authorize implementation here.

Before sealing, renderer observation must cease new admission without changing production computation authority, all open action outcomes and pending batch persistence must be accounted for, and native pending work/seal failures must remain explicit. A positive native seal is required, not inferred from a displayed result or fabricated offline. Preserve B2 immutable; any source change requires separately accepted source/build identity before new acquisition. No UI interaction, runtime changes, tests/builds, dependencies or Git mutation in this report-only slice.

### 10.12 B5 profiling-only operator finalization (rev 0.33)

(rev 0.34) B5 locally accepted under profiling-b5-round-01-verdict.md. §10.13 supersedes its no-build fence only for exact new B6 preparation; no source or runtime changes follow automatically.

B4 verdict F1–F5 and profiling-b5-finalization-implementation-brief.md govern eleven exact renderer/test paths. Approve the persistent App header component, hidden on disabled initialization, one cached bootstrap, Finish capture and explicit Retry finish for renderer/native open-action pending only. Component status is accessible, compact and local; no ordinary-launch UI slot, new setting or redesign.

Quiesce before collector supersession/allocation, preserve existing production lifecycle, serialize append in assigned order, retain each outcome/persistence and all sticky session loss. Every known action must be terminal and written before native finalize; recheck after awaits. Native sealed/open/error/drop/sequence fields must be coherent. No known renderer failure may be replaced with a clean prefix seal. Trace sealed means native artifact sealing, not usable measurement; show validation pending or loss/unverified as appropriate.

One uninterrupted renderer lifetime per new native session is a required first-acquisition precondition, established separately from this UI. Reload/crash/replacement or unknown continuity invalidates the run even if a native prefix seals. No reload recovery, sequence rebasing, durable marker or new native claim/status mechanism is authorized. Existing native idempotence alone proves no renderer history. Preserve partial evidence and start a separately authorized new session instead of resuming.

Tests and source preparation only; no app build, process/UI/runtime control, capture, Git mutation or owner workload changes. Preserve B2 immutable and running. Lead independently reviews source/gates before a separately identified new build and acquisition.

### 10.13 B6 isolated operator-capable build (rev 0.34)

(rev 0.35) Build accepted under profiling-b6-build-verdict.md. §10.14 alone supersedes no-launch for its exact B7 session/material/control proof; source/build changes and broader acquisition remain gated.

profiling-b6-build-brief.md governs build-only preparation of accepted dirty56-path8bf3187 source in color-tool-profile-b6.fnWyNO. Product/window Color Tool Profile B6; namespace com.color.tool.profile.b6.r8bf3187. Preserve accepted-b5-dirty56-source.tar SHA2566ef4ad8b22384f3a4735fac981def4f2c975914318ac6da0ad1c352220ee8e1f and all prior artifacts; both prospective B6 runtime namespaces were absent at lead preflight.

Locked/offline normal optimized release, command-local line tables/packed dSYM/no-strip only; no app execution, source/config/dependency/Git change, ordinary/runtime/owner-data control or full-suite rerun. Require exact dirty-source reconstruction, executable/dSYM hashes and matching UUID, actual fresh core+application line lookups and strict build manifest. Mounted control, real sealing/import/continuity, reflow and performance remain separately gated.

### 10.14 B7 first real finalization control proof (rev 0.35)

(rev 0.36) This run is finished and failed under profiling-b7-control-proof-verdict.md. Former PID absent at current check; preserve namespaces/evidence without continuation, restart or substitute adoption.

profiling-b7-control-proof-brief.md governs one exact B6 executable869ce8df… launch into com.color.tool.profile.b6.r8bf3187 with launch-local COLOR_TOOL_PROFILE_SESSION=b7-control-20260905-01. New evidence root b7-capture-01.CMdcCN. Detached explicit executable launch, PID/start checks bracketing controller attachment, native header/namespace and root renderer mount evidence required; stop on process/lifetime uncertainty without restart/resume.

Only exact palette-wheel still e3ca7176…; setup45/q2/exclude0/merge0/snap/three figures,45→46→45, navigate Values and Finish from persistent header. At most two explicit coherent-pending retries, no direct invoke/injection fallback. Preserve actual complete/failed/loss outcomes. Optional geometry only via documented bounds control; unsupported stays unrun. Leave identified B6 open, B2 untouched.

Retain immutable native trace copy and bounded hashes; use existing strict parser/organizer/action checks after the run without schema/source edits. All setup and noncompleted actions remain diagnostic evidence. No A1 eligible import, repeated/quiet timing, overhead, numerical oracle, full workload/flame graph or performance claim. Only B6 runtime/private evidence and one report may be written.

### 10.15 B8 invalid-input persistence repair (rev 0.36)

(rev 0.37) B8 review settled by profiling-b8-invalid-input-repair-verdict.md G1-G7. §10.16 is the current bounded implementation authority.

profiling-b7-control-proof-verdict.md and profiling-b8-invalid-input-repair-brief.md govern focused pre-implementation repair review on accepted dirty56-path8bf3187 source. Reproduce installed null-valued numeric binding into real coordinator/collector/bridge validation; separately test undefined/nonfinite states. Distinguish B7 losses from synthetic action mapping. Resolve valid-input observer attachment versus production schedule/dedup without changing production authority.

Invalid/empty actions must remain honestly unavailable/unverified and persistable. Never invent finite current config, discard actions, mislabel prior config, relax native sequence, rebase/reset/retry away loss or weaken importer completion. A narrow schema/version proposal must guard renderer, native and Node consumers together; completed/admitted analysis still requires valid resolved parameters. Retain safe allowlisted failure reasons and sticky finalization failure.

Code Lead writes one B8 report, with bounded in-memory/private temporary reproduction permitted. Candidate source/dependencies/artifacts/runtime namespaces remain unchanged; no full suites/native execution/build/app/Git operations. Lead owns the next exact implementation ruling upon submission. No owner decision is pending; silence is not a review gate. New-build and real mounted capture acceptance remain separate.

### 10.16 B9 strict v2 invalid-input persistence (rev 0.37)

(rev 0.38) Round01 source remains prepared/unaccepted under profiling-b9-round-01-verdict.md. §10.17 narrows current correction authority.

profiling-b8-invalid-input-repair-verdict.md G1-G7 and profiling-b9-invalid-input-implementation-brief.md govern20 exact implementation/test files. New native records uniformly use v2 with resolved/value or unavailable/input-target-invalid analysisConfig evidence. IPC is typed internally, not a trace-record envelope. Old v1 parser/schema semantics and immutable evidence remain intact; mixed/unsupported versions reject.

Ordinary invalid input branches before numeric config construction for all numeric controls and terminalizes synchronously with exact three events, true source match, false target match, only inputTargetResolved:false, empty measurements, valid render/identity and no admission/native work. Capacity sentinel remains explicit sticky loss/failure, not invented invalid completion. Keep internal action.analysisConfig and ProfileResolvedSnapshot resolved-only; wire wrapping plus separate unavailable metadata avoids DOM/config churn.

Native append guards existing native history using current loss/receipt flow; sequence/reservation/finalization/production policy stays unchanged. Integrity rejects native/receipt contradictions even for nonselected invalid actions. Normal selected unavailable config fails ACTION_CASE_CONFIG_UNAVAILABLE; otherwise intact diagnostic invalid evidence retains its reason and no measurements/fresh proof. Actual trace/binding corruption retains priority. Safe allowlisted local failure and sticky Finish survive.

Permanent installed-binding/coordinator/runner/collector/real-validator regression and native v2 producer-to-importer tests required, with v1 compatibility and all gates independently reviewed later. No source acceptance, new build/session, numerical/performance or aggregate acceptance follows automatically. No app/runtime/Git mutation or independent worktree changes.

### 10.17 B9 H1-H2 evidence correction (rev 0.38)

(rev 0.39) Corrections accepted under profiling-b9-round-02-verdict.md; §10.18 is current build-only authority.

profiling-b9-round-01-verdict.md governs three exact files plus one new submission. H1 compares selected renderConfig even when analysisConfig is unavailable; mismatched/unavailable expected render keeps binding-unverified priority. H2 requires all three unavailable event data payloads and their fixed invalid-target/source-match/outcome constraints in the v2 schema. Dynamic cross-location equality and native history remain runtime guards; distinguish structural schema checks from actual full schema validation.

Preserve remaining B9/baseline source and all artifacts; run focused and full B9 gates. No new dependency/validator, schema arm, frontend/native change, packaging/app/runtime/Git operation or owner decision. Lead owns prompt Round02 review.

### 10.18 B10 isolated v2 operator build (rev 0.39)

(rev 0.40) Build accepted under profiling-b10-build-verdict.md. §10.19 alone supersedes no-launch for the exact fresh B11 session.

profiling-b10-build-brief.md governs accepted dirty57-path8bf3187 source in color-tool-profile-b10.h6bbb9. Product/title Color Tool Profile B10; identifier com.color.tool.profile.b10.r8bf3187; fresh cargo-target. Lead archive accepted-b9-dirty57-source.tar SHA2564e7ade0dff25a8d6b1318340b3f4d86a05a30acafe888bb9b46e64a9330e34ac has57 verified leaves; accepted-source-hashes.sha256 SHA2562eec9e72d225e084421611647b43527f944ae1be84ad40b4400156cfb8b669a7. Prospective B10 runtime namespaces absent at exact preflight.

Locked/offline normal optimized build with command-local packed line-table symbols/no stripping, complete dirty provenance and actual core/application symbol lookup. Preserve traversable private reconstruction directories, immutable old artifacts and all source/config/locks/Git. Generated private build evidence, normal ignored dist and one submission only; no app launch/control/capture or runtime namespace creation. Compile success is not v2 mounted sealing/import, numerical parity/overhead/performance or aggregate acceptance.

### 10.19 B11 first real strict-v2 capture proof (rev 0.40)

(rev 0.41) Run complete and reviewed in profiling-b11-control-proof-verdict.md. Persistence/seal accepted with stated limitations; valid-action/native correlation failed. Do not resume this sealed session. Historical launch authority below is not authority for a second launch.

profiling-b11-v2-control-proof-brief.md governs exact B10 executable c11d0fc2391bc6068a4e8586cbf3bb7d2965f4f023bed169ee0be1cc7152142d, manifest5df45bb76cf6f1e166cee99137359b30aba50f835be31cd7d79bffbb476ad976, com.color.tool.profile.b10.r8bf3187 and launch-local b11-control-20260906-01. Evidence root color-tool-profile-b10.h6bbb9/b11-capture-01.1X95GF. Namespace absence rechecked; wrapper detached with explicit stdio and exact PID/start/session/renderer continuity.

Exact owner palette-wheel still only, ordinary45->46->45 number replacement retaining any empty intermediate, settled readiness after each, Values-hosted Finish once with at most two coherent-pending retries. No deliberate long empty-state hold or injection to force coverage. Actual invalid and valid evidence/coherence must be reported separately; absent coverage remains unrun. On clean seal only, final Colors navigation/hash recheck and leave exact app open. Loss/failure/continuity uncertainty stops without restart/recovery.

Strict v2 raw parse/organizer/action evidence with bounded immutable copy and all action/loss accounting. No parser/source repair, source/build/Git change, eligible acquisition import, geometry, export/Batch, quiet timing/repetitions/overhead/flame graph or performance claim. B10-only runtime and new private evidence/report authorized; preserve B6/B7 and other apps.

### 10.20 B12 trusted-input ordering review (rev 0.41)

(rev 0.42) Completed and accepted under profiling-b12-input-ordering-verdict.md R1-R5. Read-only artifact/compile review confirms restricted browser boundary; not native collector/renderer completion. §10.21 is current implementation authority.

profiling-b12-input-ordering-review-brief.md assigns the existing Code Lead a focused pre-implementation review with isolated browser diagnostics in color-tool-profile-b12.wPLNxd. Verify actual installed Svelte and mounted control/store/reactive-effect ordering; compare unchanged and capture-hook-only private variants using ordinary trusted numeric input, checkbox and keyboard range interaction. Record event trust, identities, renderer-local ordering and every surrogate boundary. No candidate source/native/build/Git change or sealed B10 control.

Capture-phase observation is the preferred source repair hypothesis; existing paramsWithTarget supports prebinding delivery. Checkbox change-binding/input-observation distinction is intentional until real activation is checked. Do not alter production debounce, deduplication or request authority to improve trace results. Existing synchronous regression remains a conversion/wire test, not browser-order proof. Return the exact implementation/test fence and native verification recipe immediately for lead ruling.

### 10.21 B13 capture-phase input implementation (rev 0.42)

(rev 0.43) Source accepted under profiling-b13-source-verdict.md after independent full gates. Prepared/uncommitted; §10.22 is current build-only authority.

profiling-b13-input-capture-implementation-brief.md authorizes two candidate files: ParameterControls.svelte six existing profiling capture hooks, and profiling-svelte.spec.ts accurate surrogate label/compiler contract. Per-element capture=true registration precedes each binding; old-hook in-memory negative control must fail. No binding/control/pointer/production scheduling changes. Preserve other55 baseline hashes/exact57-path status and all immutable browser/native evidence. Full gates required; lead independently reproduces before fresh build/control capture authorization.

### 10.22 B14 capture-hook build preparation (rev 0.43)

(rev 0.44) Build accepted under profiling-b14-build-verdict.md. §10.23 alone authorizes the fresh B15 exact-binary launch; all older sealed apps remain untouched.

profiling-b14-build-brief.md reserves color-tool-profile-b14.XANBLs/cargo-target, Color Tool Profile B14 and com.color.tool.profile.b14.r8bf3187. Exact accepted57 source archivee5f47c0a…/hashlistbd2e8496… already preserved and verified. Build manifest must bind full current source/reconstruction and actual fresh executable/dSYM/compiler flags; source-line checks cover core and app profiling. No launch or old bundle/trace replacement. Lead review precedes fresh native capture authorization.

### 10.23 B15 capture-hook native control proof (rev 0.44)

(rev 0.45) Original attempt submitted at controller limit before import; frozen artifacts remain intact. Lead subsequently completed import in the same verified PID/session. profiling-b15-control-verdict.md records the intervention; §10.24 alone permits continuation.

profiling-b15-native-control-brief.md admits exact B14 executable4b43e52313d783e2c58b9ae762fa96682086a3c6b22f1e45a3523c28ab07c2ae/manifest15f1285f15fa70ffcda71a39df868c935b91aff6024d248548780cf656fc5912, com.color.tool.profile.b14.r8bf3187 and launch-local b15-control-20260906-01. Private evidence b15-capture-01.Z38jdd. Single detached launch, source/PID/renderer continuity and app-created v2 header required.

Exact ownerPNG only; ordinary45->46->45 with empty/intermediate digits, settled checkbox activation and keyboard quality-range step, then same-study Values/Finish. Preserve all setup/unavailable/cancelled/dedup evidence; intermediate4 need not execute past unchanged debounce. Require exact settled fresh native/renderer correlation independently of UI ready. On clean seal, copy/hash before final Colors and rehash after; leave sealed app open. No restart/injection/source/build/Git/performance action. Unknown continuity/loss stops for lead.

### 10.24 B16 same-process continuation (rev 0.45)

(rev 0.46) Continuation finished/sealed; profiling-b16-native-verdict.md accepts native association diagnostic but retains two strict duration-equality failures. Do not resume or alter sealed B14 session.

profiling-b16-native-continuation-brief.md authorizes only existing PID18954/start13:41:37/executable4b43e523…/session b15-control-20260906-01/native clock native-18954-18d2cf73cb3aa4b8, with new private b16-continuation.bynwZo evidence. Lead imported the exact selected private PNG at13:55:17; fresh AX shows K45/q2/exclude0/merge0/snap enabled. Verify continuity and381-byte header before remaining controls; no namespace-absence expectation or launch authority.

Run remaining B15 numeric/checkbox/range/Values/Finish/final-Colors sequence with honest supersession and strict whole-session correlation/seal accounting. Preserve failed-attempt evidence and active-carrier versus frozen-snapshot distinction. Check action delivery after capture errors before retry; retain raw AX and usable-dimension screenshots or disclose unavailable visual capture. No owner blocker/source/build/Git/performance authority.

### 10.25 B17 floating-duration coherence review (rev 0.46)

profiling-b17-duration-coherence-review-brief.md assigns current installed JS/Rust JSON boundary reproduction and a bounded renderer-duration rule/regression proposal in private color-tool-profile-b17.pwNu01. Untouched B16 trace1c9cfe55… exhibits a5.684341886080802e-14ms equality gap for actions3/8. Inspect timestamps and transported durations, reject huge-magnitude tolerance bypasses, keep missing/negative/nonfinite behavior explicit and native integer/ID/clock/sequence/seal checks exact. No candidate source/trace/app changes; a named standalone offline dependency probe is permitted. Return minimal implementation fence immediately.

(rev 0.47) Review completed and accepted by profiling-b17-numerical-verdict.md; implementation authority is §10.26, not retroactive B17 code permission.

### 10.26 B18 bounded duration checker repair (rev 0.47)

(rev 0.49) R1 accepted by profiling-b18-r1-acceptance-verdict.md. Preserve B14 build identity separately from revised offline checker identity.

(rev 0.48) Main submission reviewed; profiling-b18-r1-review-verdict.md adds the signed-zero spacing correction and immutable suffixed evidence requirements. Original B18 report/receipt remain preserved.

profiling-b18-duration-coherence-implementation-brief.md assigns two existing checker/test files only on8bf3187 plus accepted57. Apply §6 policy and B17 strengthened endpoint-shift/cancellation/powers-of-two/boundary tests against production logic, full Node/frontend/native/static gates. Preserve other55 accepted hashes and old evidence. New offline B16 inspection in color-tool-profile-b18.LVNlpB identifies exact revised tool hashes and unaltered raw digest; no historical relabelling, app build/control, acquisition fabrication, performance conclusion or Git mutation. Report immediately for lead acceptance and next acquisition assignment.

### 10.27 B19 targeted native/renderer attribution pilot (rev 0.49)

profiling-b19-attribution-capture-brief.md assigns private color-tool-profile-b19.R3XH4m and new session b19-attribution-20260906-01. Exact B14 PID18954 normal quit only after old evidence preservation and identity check; one unchanged-bundle new process, reused namespace/caches without purge. Same suppliedPNG/K45q3snapfalse setup, one120s Time Profiler --attach new nativePID, real46/45 settled inputs, native seal and all action accounting. Export TOC then observed-schema stacks and symbolicate to a new output using matched dSYM. Private manifests/imports only from observed evidence; preserve unresolved/missing provenance. No all-process recording, privilege/workload/system changes, source/build/Git changes, alternate launches or recording retries. Clock uncertainty, renderer semantic stack/physical-display limits stay explicit; report immediately for lead artifact review.

(rev 0.50) B19 concluded as preserved partial diagnostic, not visible E2E success. profiling-b19-attribution-review-verdict.md corrects sampled-row accounting and accepts no exact wall projection or causal visibility explanation.

### 10.28 B20 foregrounded visible-result capture (rev 0.50)

(rev 0.51) Capture reviewed by profiling-b20-visible-attribution-verdict.md; visible endpoints now actually exist. Owner discussion view is separate from immutable evidence and all further acquisition is held. Original assignment below is completed within its bounded diagnostic scope, not broader profiling acceptance.

profiling-b20-visible-attribution-brief.md assigns private color-tool-profile-b20.JHAWY2/new session b20-visible-20260906-01 on unchanged B14 bundle after verified PID24489 ordinary quit and evidence preservation. Reused namespace/caches explicit. Raise exposed window, activate by supported visible UI if needed, and complete46/45 warm-ups with true DOM/Raf1/Raf2 visibility before recording. Five-second no-AX foreground intervals are experimental no-observation dwell, not UI tool-settling workarounds. At most one extra pending dwell, no hidden retry. Then one120s native Time Profiler around46/45 targets, seal and immutable export/symbolication/count-reconciled analysis. Preserve missing stacks, source/config/binding/viewport uncertainty and actual capture/UI receipts. No source/build/Git changes, all-process capture, owner/system workload changes or invented clock/physical-display proof. Lead review before owner graph acceptance.

## 11. Post-profile correctness and responsiveness (rev 0.52)

(rev0.97) One isolated visible session authorized, not production UI/performance acceptance; no app source or profiling changes.

(rev0.96) Isolated visible-test preparation accepted, not application performance/UI acceptance. The remaining work is owner interaction with the frozen artifact after its separate launch gate. No app source, benchmark, profiling or production change.

(rev0.95) Visible-artifact integration correction only. Pure checks expose receipt ordering and Rust guard-lifetime problems; no actual application performance or visible usability measurements. Preserve corrected case-progress UI and evidence distinction; no product source work.

(rev0.94) Visible-test preparation correction only. No application UI/performance/source change or runtime measurement. Fix experimental owner-case projection and failure reporting so a later owner test has trustworthy controls/evidence; no production transient-state restoration decision.

(rev0.93) Only experimental visible-artifact preparation is assigned. No app UI/performance/source changes or runtime measurement; Wry activation is a source warning awaiting owner interaction.

(rev0.92) Visible-test planning only; ordinary image loading, repaint, Svelte navigation, performance and styling stay unchanged. No active app is manipulated.

(rev0.91) Source-decision review complete; owner contract choice pending. No performance, layout, normal image/view interaction or app behavior changed.

(rev0.90) Only focused lifecycle source review is active; no performance/design/app behavior changes.

(rev0.89) Next-sprint planning concerns the lifecycle/adoption boundary, not another optimization or redesign sprint. Existing performance/design lanes remain separate.

(rev 0.88) Hidden retained-window mechanics passed one bounded run; this is not a performance or visible-interaction benchmark. Production behavior remains unchanged.

(rev 0.87) Only the isolated hidden-window experiment may now run once; no production image/repaint/window/performance changes. Runtime result pending.

(rev 0.86) Retained-window experiment remains unlaunched. H25 closes an evidence-path omission, not an observed app/WebKit/performance defect; no production behavior change.

(rev 0.85) The held launch reflects defects in experiment safeguards/evidence, not an observed production/WebKit failure. Only five-file preparation correction is active; no app/performance behavior changes.

(rev 0.84) Only standalone retained-window preparation is active. No production image/repaint/view/reload/performance behavior changes. Source review is not an experiment result.

(rev 0.83) Resume only the isolated retained-window experiment under staged review. Ordinary image/view/parameter changes are not document reincarnation; no production reload, window, performance or cache behavior changes.

(rev 0.82) Pause at the concrete retained-window experimental-API versus stable whole-window behavior gate. No production window/reload or performance behavior is changed.

(rev 0.81) Lead is checking an architectural way to remove the ambiguous cross-document authority handoff, not accumulating more schedule trials. Running app and product behavior are unchanged.

(rev 0.80) The isolated harness now has a complete accepted run. The next step closes the specific source premises needed for native session attachment; production app/performance/UI remain untouched.

(rev 0.79) One isolated second run is authorized to test the repaired harness shutdown; no production app or performance work follows.

(rev 0.78) First harness run yielded real selected-schedule controls and replacement events but failed its terminal gate. Only the test-driver shutdown seam is being corrected; no production correctness/performance acceptance follows.

(rev 0.77) First isolated C1 macOS run is now authorized after preparation acceptance. This does not launch or alter the production Color Tool app and supplies no performance/UI claim.

(rev 0.76) C1 harness mechanism corrections pass preparation tests; only explicit synthetic page-load provenance remains assigned before launch. No Color Tool source/UI/timing or running-app action follows.

(rev 0.75) C1 harness needs correction before first launch: its measurement paths must not grant authority or let early exit appear successful. This is test-instrument repair, not a production Color Tool defect or another policy review.

(rev 0.73) The concrete native session seam now has an isolated runtime-experiment preparation assignment. Source review did not grant193-B or platform-fork authority. No timing/UI change, running-app action or new quota; candidate still6e12a73.

(rev 0.72) The first native ownership kernel is locally accepted. Next resolve actual C1 runtime hook evidence before wiring sessions; no timing/UI or193-B source assignment yet. Reclamation metadata does not implement file deletion, and normal quick-switch caches remain unchanged.

(rev 0.71) Native ownership can proceed under explicit retention-only approval. Start with193-A group/lease kernel, then separately gated native session/operation and filesystem integration, IPC/store/view hookup, and185 ->184 ->186. Keep fast switching and currently accepted RAM caches. No timing/UI changes or whole-app storage guarantee follow from the initial kernel.

(rev 0.70) Native prerequisites022/019/021/027/029/030 are locally committed througha0d9dd0. No193 implementation follows automatically. Owner capacity behavior and numerical approval is the next native gate; current C1–C3 and required topology additions are already recorded. Retain separate timing/UI scope and all real-interaction/immutable-input/publication residuals.

(rev 0.69) Worker placement is locally committedf1a30d1. Last native prerequisite030 now unifies logical artifact components, retaining all current worker/profile and cache-generation behavior. Its digest is of an ID, not source contents;193/C3 and pressure remain unimplemented/pending. Timing/UI work is separate.

(rev 0.68) Media reply validation is locally committed3d35787. Next029 moves synchronous work off async executor threads while preserving native profiling receive-to-return attribution; it supplies neither cancellation nor worker admission bounds.030 then193 remain separately gated. No response escrow/input identity, timing/UI or pressure decision is made here.

(rev 0.67) Native Values generation isolation is locally committedcaf8225. Next027 validates media replies before renderer admission;029/030 then193 remain gated. This does not select response escrow/session ownership or improve source-byte identity; no timing/UI/pressure change.

(rev 0.66) Second native prerequisite019 committed575868c;021 now isolates different observed Values generations. Subsequent027/029/030 and193 remain separately gated. Same-generation atomic output publication belongs185 and actual retained input identity belongs193; no timing/UI or pressure decision is inferred.

(rev 0.65) Startup-only pruning prerequisite is locally committed5d22118. Next019 isolates retained grid outputs; subsequent021/027/029/030 and193 stay separately gated. Keep bounded session growth and explicit removal races open; no pressure decision or timing/UI work is inferred.

(rev 0.64) First native prerequisite awaits a one-test-file amendment before its issue commit. This is test portability, not new production ownership or pressure design. Later019/021/027/029/030 and193 stay behind their exact-base gates.

(rev 0.63) Native prerequisite adaptation now follows accepted delta:022 first, then issue-scoped019/021/027/029/030. Only022 is authorized. This safety floor is not owner-aware cleanup or a storage policy. Native193 awaits accepted prerequisites and pressure ruling; requested/settled renderer authority remains distinct from native bytes. Responsiveness and UI foundation assignments remain separate.

(rev 0.62) Local wave05 closes its renderer implementation review; current requested/settled handoff is factory-tested, not mounted/owner accepted. Native193 prerequisite and topology review now follows while pressure approval remains open. Responsiveness/design work is still separately scoped; no timing optimization assigned.

(rev 0.61)183 handoff review retains requested/settled design but finds three uncovered integration edges; amendment01 governs round02. Reconciliation is not permission for active-scrub decoding, and a structurally matching captured epoch is not proof of current canonical ownership. Existing timing policy and new-selection cached playhead remain compatibility requirements.

(rev 0.60)182 conservative cached-frame race proof is local and committed;183 now supplies missing requested/settled successor handoff and terminal old-owner cleanup. Settled identity is accepted renderer entry/revision/path/requested timestamp/maxDimension, not physical PTS or immutable native bytes. Missing/mismatched proof reacquires; exact same-epoch entry may reuse extraction while destination analysis remains independent.

(rev 0.59) Canonical192 local source/test acceptance is recorded at2853040; old-view disposal and requested/settled handoff remain183. Next182 tests must cross controller/store/runner where asserting new analysis, while unchanged stored-entry reuse stays a separate positive. This does not establish native source immutability, mounted interaction acceptance or scheduling improvements.

(rev 0.58) Phase192 amendment01 is the current gate. Retain immutable epoch/contentRevision separation and R1–R7 design; tighten owned rejection diagnostics and prove epoch-only controller revocation without relying on a local reset. Source remains uncommitted41222c5 plus18 submitted paths; final lifecycle acceptance remains183. No timing or study-interface implementation assigned by this amendment.

(rev 0.57) correctness-wave-05-implementation-verdict.md releases192 only. Begin user intent once, carry immutable epoch through pending event/probe/frame/strip and pre-await ingress, and settle under that epoch without self-revocation. Associated media metadata may become known after admission; it is not stale-check identity. Bare epoch changes must not reset independent job state.183 later adds requested/settled frame and owner-disposal convergence;182 adds regressions for the removed preserve branch's remaining scenarios. No true decoded-PTS/immutable-byte or native cancellation claim.

(rev 0.56) Wave04 is locally accepted under correctness-wave-04-verdict.md. Next correctness-wave-05-review-brief.md verifies IMP192 first and reconciles182/183 against current41222c5 without reviving unsafe cache preservation. Existing requested-versus-settled frame distinctions and independent-job fences bind the proposed scope. Gesture-aware scheduling remains separately lead-owned; current400ms/numerical behavior is unchanged.

(rev 0.55) Phase017 is accepted atdbfad26; phase181 follows correctness-wave-04-phase-017-verdict-and-181-brief.md. Existing ingestion cancels before admission and passes the normalized entry copy; Home remount uses actual selectedFile. Only request-key construction and its real-boundary/profiling regressions are assigned. Source revision remains renderer-local content admission identity, not selection epoch, native immutable bytes, or independent export/Batch authority.

(rev 0.54) Phase010 accepted and committed44d7f57. Current authority is correctness-wave-04-phase-010-verdict-and-017-brief.md for017 only. Revisions are fresh on content admission, session-local, safe-integer and never caller-owned or reset by clear. Preview metadata and actual stored-entry selection reuse retain identity. Pinned revision snapshots must be primitive values, not references that caller/store mutation can silently change before comparison. Ready aggregate invalidation and explicit Analyze are bounded behavior, not retained-job cancellation.

(rev 0.53) Binding implementation/base ruling is correctness-wave-04-implementation-verdict.md. Fresh-video extraction is not unchanged-content reuse. Content revision allocator in017 must be store-owned and non-recycling across clear/remove; Values invalidation in010 must retain pending-token revocation. Source patches are serialized010->017->181, each submitted to lead for an atomic commit. Newly reserved IMP203 repairs only the actual hook false-positive prerequisite; it does not broaden wave04 production scope. Source-approved profiling57 is now committed9215711 unchanged.

Owner accepted the direction to resume correctness and the redesigned study flow while tuning interaction delay carefully. Latest normal B14 trial reduces urgency of historical-stall investigation without resolving its cause. First assignment is correctness-wave-04-review-brief.md for same-path content replacement and downstream request/pin identity: SWEEP010, SWEEP017, IMP181. Canonical selection/frame handoff IMP192/182/183 and native ownership IMP193 remain separate subsequent work. No all-at-once refactor.

Responsiveness direction: distinguish continuous/incomplete edits from committed intent; avoid waiting unnecessarily after an explicit commit while preserving coalescing, validity, token ownership and output quality. Determine browser/native event ordering and in-flight admission behavior before selecting a debounce/flush policy. Do not change numeric budgets, model quality, core algorithm, or add a queue of obsolete work to improve a displayed number. Lead owns this policy; exact ticket/fence and acceptance are required before implementation. UI foundations and one complete Colors/collection return flow follow their own correctness and design gates, not a new mock-only completion claim.

## 12. Owner-approved retention-only ownership rollout (rev 0.71)

### 12.1 Policy decision and reversal

On2026-09-07, after discussing the existing quick-switch caches and managed working files, the owner explicitly approved active-session accumulation and cleanup on flush or when we are confident the files are no longer used. Adopt Round02 alternative R as the compatibility policy: protect all accepted owners and attempt work without a new proactive admission quota. This supersedes rev0.70's pending F/O and numeric-budget gate; the prior fail-closed recommendation was not adopted. Preserve the historical reviews unchanged.

This permits temporary session growth; it is not a promise of bounded disk use or permission to ignore filesystem failures. Ordinary disk-full/write/verification failures remain errors and must roll back new work safely without invalidating accepted owners. Do not invent ManagedCapacityExceeded, cross-class eviction, a worker quota, hard ceiling, or bounded-overflow numbers. Accounting still matters for truthful observation and later eligible retention cleanup. A future admission policy change requires separate owner approval.

A flush releases only the authority its actual scope retires and then considers eligible unowned artifacts. It is never a blanket delete: a quick-switch cache, display, source entry, response escrow, running worker, export, or Batch job may independently retain bytes. Zero leases makes an artifact eligible for class-specific policy, not obligatorily disposable. Preserve intentional persistent clipboard/snapshot copies and the accepted restart matrix. Keep existing RAM/result/video-state reuse; legitimate content invalidation is unaffected. No new flush UI, timer or running-app action is authorized here.

### 12.2 Numbered scope amendment193-01 and serialization

Accepted source topology adds the following exact future193 paths to the ticket fence: clipboard-ingestion.ts and .spec.ts under tauri-app/src/lib/services; video-controller.svelte.ts and video-controller-cache-reset.spec.ts under views/home; video-scrubber.svelte.ts and video-scrubber-snapshot.spec.ts under views/values; video-view-handoff.spec.ts and audit-resource-integrity.spec.ts under views/__tests__; views/home/VideoPanel.svelte and views/ValuesView.svelte only for managed capabilities at their existing snapshot calls; services/frame-snapshot.spec.ts(new). These are future scoped allowances, not authority to edit them in193-A. App.svelte remains session/paste-listener wiring, not the extracted clipboard writer. HomeView.svelte and file-ingestion-values.svelte.ts remain fenced out absent a later demonstrated need.

193-A permits new src/artifact_ownership.rs, optional new src/artifact_ownership/types.rs and src/artifact_ownership/tests.rs, existing src/lib.rs, and new tests/audit_artifact_ownership.rs, all under tauri-app/src-tauri. These cohesive submodules are expressly added rather than silently escaping the ticket fence. Exact current assignment is correctness-wave-07-phase-193a-brief.md; no other file authority follows from this section.

Sequence:193-A group/lease/reclamation kernel; later native session/source/operation-key and filesystem snapshot/publication/recovery integration; IPC plus actual C1 native document ordering and C2 reconciliation; store/cache semantic ownership, dual-view transfer, clipboard and snapshot hookup; then185 ->184 ->186. Each later slice requires an exact-base assignment. C1–C3 remain binding; no third general protocol review.

### 12.3 Initial kernel acceptance boundary

(rev0.97) Visible run authority does not change candidate kernel or grant C1-C3/193-5 production integration. Runtime and owner outcomes remain to be recorded.

(rev0.96) Corrected experimental adapter preserves protocol-current candidate receipt admission separately from admitted session-current controls. Candidate kernel, protocol and R remain unchanged; no session/IO/consumer integration or C1-C3/193-5 production acceptance.62 pure tests are preparation evidence only.

(rev0.95) Protocol-current construction/admission identity and session-current control identity must remain distinct in the experimental adapter. No premature session install, protocol mutation or owner-control bypass to mask the receipt regression. Candidate kernel/R unchanged;193-5/session/IO/consumer integration and aggregate C1-C3 remain unaccepted.

(rev0.94) Preparation round02 leaves candidate native kernel and protocol read-only. Callback/supervision fixes are isolated visible-adapter requirements, not native ownership acceptance or session/IO/consumer integration. R and independent owners unchanged; C1-C3 and193-5 remain unaccepted.

(rev0.93) Visible preparation reuses unchanged candidate ownership kernel. Exact-current controls and stale process callbacks are experimental adapter requirements; no193-5/session/IO/consumer integration or C1-C3 production acceptance.

(rev0.92) Owner-approved restart contract retains independent native owners and R.193-4 is a separate isolated visible-test planning gate; no session/IO/consumer integration or C1-C3 production acceptance. Process-detection obligations remain unproven despite contract approval.

(rev0.91)193-3 completed as research only. Proposed child-lifetime contract does not integrate sessions/IO/consumers or close C1-C3. Native independent owners and R unchanged; unknown process-replacement detection cannot be silently converted into a source guarantee.193-4/5 remain separate pending gates.

(rev0.90)193-3 assesses whether the actual initialization path supports the needed document-bound authority; it does not implement193-5 or change the accepted native registry. Retained owners/R remain unchanged.

(rev0.89) Accepted kernel receipt now maps to193-1; finite retained-window evidence to193-2. Their completed status does not close193 or implement session/IO/consumer integration.193-3/4 gate future193-5; existing184/185/186 remain distinct delivery work.

(rev 0.88) Actual native run retained one4096-byte group with2 active native/session leases, no eligible/claimed bytes and active successor authority after stale controls. This bounded adapter evidence does not authorize193-B, IO/reclamation or consumer integration; initial document premise remains open.

(rev 0.87) Detected wrong A context now leaves B/native owners intact in actual-helper pure tests. One hidden run may observe these forced controls against the unchanged registry dependency, not integrate193-B or prove unknown document authority.

(rev 0.86) Round02 now observes active/retired authority state and tests actual old-A release versus successor foreign release, preserving native owners in pure gates. The remaining receipt/Finished guard must preserve B when a delayed A observation is contradictory. No193-A edit,193-B/consumer/IO acceptance or initial-binding proof.

(rev 0.85) Real registry baseline/owner controls compile and pure-test, but current protocol snapshots omit authority state and runtime lacks the late-A-release arm. Correct the test adapter/observations without editing193-A or claiming consumer/IO integration. Unknown initial-document binding remains open.

(rev 0.84) Preparation consumes the accepted registry through a read-only dependency for synthetic Snapshot/native-owner accounting. It does not attach193-A to production, implement C2-C3 or authorize cleanup. Session-specific release must preserve independent native and predecessor ownership.

(rev 0.83) Owner-approved spike is outside193 production source.193-A remains accepted only as the in-memory kernel; independent owners survive test renderer retirement, and no full C1/C2/C3/IO/consumer acceptance follows. Initial proof binding must not be inferred from successful API replacement.

(rev 0.82) Neither replacement API route is implemented or accepted for193. Owner direction on isolated exploration precedes the next brief;193-A, finite run evidence and independent native ownership remain unchanged.

(rev 0.81) The193-A registry remains accepted and independent from renderer replacement. A nonrenewable WebView-incarnation adapter is under read-only feasibility, not implementation authority or production C1 acceptance.

(rev 0.80) Finite harness success does not wire or accept a production C1 adapter.193-A stays accepted; source obligation closeout precedes separately scoped session/IO/consumer implementation.

(rev 0.79) H14 preparation accepted; second finite run pending.193-A and retention-only policy remain unchanged; C1-C3/production integration not accepted.

(rev 0.78) C1-RUN-01 remains FAILED, not accepted from seven partial completion rows.193-A stays accepted independently; all later ownership/IO/consumer integration gates remain open.

(rev 0.77) Harness source preparation accepted; one macOS experiment authorized, not yet observed.193-A and retention-only R are unchanged; C1-C3/native IO/consumer integration still require later gates.

(rev 0.76) Native193-A remains unchanged. Harness Round02 is narrowly AMEND for synthetic callback labels despite25 passing pure tests. No runtime or C1 safety result is claimed.

(rev 0.75) The isolated harness is AMEND before launch. C1-H7..H12 require guarded-only grant delivery, observational diagnostics, original-request recovery, incarnation-safe lifecycle and exact durable evidence. The accepted193-A metadata kernel is unchanged; no C1/runtime safety acceptance is implied.

(rev 0.73) C1-H1..H5 narrow the next gate to a standalone prepared harness, reviewed before launch. Native challenge/page-load semantics remain hypotheses pending source-backed runtime evidence; neither callback names nor finite pure-model passes close C1. Do not make unprovided cross-platform runtimes a blocker for local preparation.

(rev 0.72)193-A passed its bounded acceptance and is committed6e12a73. Preserve remaining integration requirements: partial filesystem deletion cannot use Failed to resurrect readable eligibility, finer retention classes still need adapters, and tombstones have no new expiry rule. Focused C1 runtime evidence is now the next slice; complete193 remains open.

The first kernel has no filesystem or IPC effects. Backend-scoped native-issued group/lease/reclamation capabilities protect complete-group metadata; measured published bytes count once irrespective of lease count. Last release preserves resident accounting until a successful reclaim acknowledgment, and class eligibility remains explicit. Acquire and reclaim are mutually exclusive atomic state transitions; failed reclamation can restore eligibility without reviving a stale reclaim ticket. Typed stale/unknown capabilities cannot mutate current state.

Permanent tests must execute this actual library kernel, not a parallel model or source-text assertions. Cover multiple leases, exact/idempotent release, both acquire/reclaim orders, failed-reclaim retry, stale ticket/backend isolation, resident byte totals, overflow safety and persistent-class separation. Full candidate gates follow. Metadata registration is trusted native preparation, not proof of complete on-disk bytes, input equality, path confinement, atomic publication, renderer lifetimes or native deletion. Aggregate193 implementation/lifecycle checkboxes stay open until the corresponding production paths are wired and tested.

## 13. Review-lead handoff and the deliverable (rev 0.98, 2026-09-28)

- **Authority.** The owner confirmed that Genga leads review, rulings, plan and merges, that Astra implements, and that Sol is a partner.
  The owner said "Yeah" and that they would talk to both seats themselves. Astra's consent and inventory are in Genga's room,
  `proposals/color-tool.astra-handoff-response.2026-09-28.md` and `color-tool.planning-inventory.2026-09-28.md` (with its .json
  manifest).
- **The deliverable.** One shared web application, served for browsers and reused by the Tauri desktop app, which displays the same app.
  This is the owner's decision, not an inference. Not yet settled: hosting, where the compute runs, the file adapters, and how the
  desktop app loads it. The September study-interface plan (section 9) is carried
  into it; the July design stays as historical reference; performance and profiling work is mined where relevant (the owner: "we can mine
  it if there's relevant performance related work").
- **The preservation commit.**
  - The lead stages only the explicitly listed paths from Astra's manifest: the planning documents.
  - **Held out of this commit** (kept locally, unredacted, as frozen evidence):
    - `RAG/reviews/EPIC-027/2026-09-05-current-app-clickthrough.md`;
    - `RAG/reviews/EPIC-029/profiling-a0-build-submission.md`;
    - `RAG/reviews/EPIC-029/profiling-a0-run-01-brief.md`;
    - `RAG/reviews/EPIC-029/profiling-a0-run-01-submission.md`;
    - `RAG/reviews/EPIC-029/profiling-native-control-proof-01.md`.
  - This record carries a marked redaction of the owner-media name instead.
  - The eight external design references are copied in a follow-up after Astra's privacy screen.
  - The commit and merge preserve documents and this handoff. They don't validate historical implementation claims.
- **The stale rev0.97 header** ("owner session running") is replaced by rev0.98's. The 01 session's startup receipts and its failed
  outcome are preserved as recorded.
