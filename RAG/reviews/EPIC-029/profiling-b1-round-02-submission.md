# AI-IMP-202 B1 Round 02 correction submission

Code Lead → Review Lead, 2026-09-05. PROJECT-RECORD rev 0.27 §10.8. Review state: **SUBMITTED; uncommitted; not accepted; no ticket completion.** This is the consolidated C1–C8 correction requested by `profiling-b1-round-01-verdict.md`.

No app build, launch, capture, owner-media interaction, trace acquisition, Instruments run, flame graph, optimization, core/video/cache/other-view change, dependency/configuration change, Git operation, merge, or issue completion was performed.

## Carrier and preservation receipt

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- The correction used exactly the original eighteen B1 paths plus the nineteen paths authorized by C8. `git status --short --untracked-files=all` reports 53 known paths: sixteen accepted A1 files plus these 37 B1 files. There is no path outside those two approved sets.
- The sixteen accepted A1 files remain byte-identical. Their sorted pathname/per-file-hash-list digest remains `ea93a92f171f565946ccc3f2ad1998fba146cd9350f90c911973d8aa167fe476`.
- Frozen Round 01 source archive remains `48c05031e2f6733efa96205071a573f172a3fac5a0047ec16852f31fcaf9affd` at `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/b1-review-round01.TxexcE/source.tar`.
- Original Round 01 submission remains unchanged with SHA-256 `fb177145309b51fb411110550092ae2d248d9787481bde317de2c32a876768a8`.
- `git diff --check` passes. No staging or Git mutation was attempted.

## C1–C8 disposition

### C1 — actual native wire end to end

- The canonical input shape omits inactive option arms. Numeric is `{control,targetState,targetNumber}`, boolean is `{control,targetState,targetBoolean}`, and invalid/empty is `{control,targetState}`. Explicit `null` inactive arms are rejected by Rust, Node runtime validation, and schema conditionals.
- The ignored Rust test emitter uses the production serializer and `ProfileWriter` to create a real private JSONL artifact. `profiling-native-wire.test.mjs` invokes that emitter in a test-owned temporary directory and feeds the bytes to the real `importTraceRun` path.
- The proof covers numeric, boolean, and invalid observations, Rust `46.0` spelling, raw JSONL line-plus-newline `acceptedByteCount`, and the final seal. It does not substitute a JavaScript-authored wire fixture for Rust output.

### C2 — real Svelte proxy-safe result association

- `HomeView.svelte` now keeps whole replacement-only analysis results in `$state.raw`; the profiling coordinator also retains the accepted result with `$state.raw`. Association remains strict object identity and does not mutate/cache-wrap the result or replace it with a digest.
- The new compiled-client regression uses the installed Svelte 5.39.6 compiler and `svelte/internal/client`. It proves ordinary deep `$state` proxies the result while `$state.raw` preserves the raw displayed/accepted identity. Existing assignment-driven display behavior remains unchanged.

### C3 — observer ownership through DOM/RAF2

- A Home-owned coordinator retains the accepted action after store success and owns cancellation through Svelte tick, DOM validation, both RAF callbacks, and terminal persistence.
- Unmount, source replacement, settings replacement, and displayed-result replacement revoke the action and cancel pending RAF/visibility cleanup. Late callbacks cannot replace the immutable terminal.
- DOM validation is scoped to the mounted Colors study and counts one actual direct SVG root in each expected tagged container, not merely the container marker.
- Regressions cover unmount immediately after store, while tick is pending, between RAFs, empty tagged containers, and source/settings/result replacement.

### C4 — evidence coherence instead of asserted flags

- Eligible completion now requires exactly ordered delivered/resolved/admitted/native issue/native settle/parse/store/figure-set/DOM/RAF1/RAF2/outcome evidence; exactly one bound schedule; all repeated schedules inside the resolved-to-admitted window; successful native return; exact enabled/generated figure membership and multiplicity; true underlying path/request/store/association checks; and measurement equality to event deltas.
- Mutations that omit parse, figure, or RAF stages, move a schedule outside its window, contradict path/store/figure evidence, introduce sequence gaps, or place a batch after its close cannot remain eligible.
- A native rejection close with no persisted renderer batch remains retained as tainted/unverified diagnostic evidence. The impossible close-before-a-later-batch case is rejected.

### C5 — positive whole-session completion and global loss

- New IPC command: `profile_finalize({req:{sessionId}})`. Its first call stops admission of new actions. It returns `sealed:false`, `profiling-actions-open`, and the open count while a close or native-return reservation remains; a retry after those reservations resolve writes the seal. Successful finalization is idempotent.
- The terminal `session-seal` is the last complete record. It carries recomputable record, nested-event, action, closed-action, native receive/return, renderer batch/event, artifact-byte, cumulative-drop, and last-admitted-batch-sequence totals. `artifactByteCount` includes the seal and newline via a fixed-point encoding check.
- Every nonfatal loss persists a strictly increasing cumulative `session-loss` snapshot. If a later snapshot cannot be written or reserved, the writer becomes unsealable. Import requires the seal drop total to equal the final loss snapshot, or zero when there is no loss. This closes both a clean-prefix write failure and forged-larger-total case.
- Importer taint derives from every batch, close, loss, seal, missing/mismatched receipt, and nonselected action. A selected action cannot stay eligible when another action reports loss. Renderer outcomes remain immutable; a late native return is separate span evidence and never reopens the renderer terminal.
- A production-invalid batch can close without a renderer batch and import as unverified evidence, while close receipt sequence continuity still reflects every admitted batch.

### C6 — real nested-event budget

- `MAX_ARTIFACT_EVENTS=8192` now charges the header, every native event, every nested renderer event, every action close, every loss snapshot, and the final seal. Records have an independent `MAX_ARTIFACT_RECORDS=1024` budget.
- Checked arithmetic and reservations protect every admitted action close, possible native return, first loss record, and seal. Later cumulative loss snapshots consume ordinary bounded capacity; inability to persist one makes the session unsealable.
- Boundary tests exercise batches at/over the nested limit, cancellation, late native return, loss, close, seal, record bounds, and zero-byte writer failures.

### C7 — disabled application path

- `ParameterControls` omits profiling input listeners entirely while disabled. Its helper gates before reading the input target, `performance.now()`, or allocating the delivery object.
- Chart call sites gate on the existing show/result conditions before profiling clocks. Coordinator figure/input methods gate before observer work, and its dedupe sets are allocated only after the cached status handshake enables profiling.
- Observer getters, callbacks, native-issue/settle/parse hooks, and persistence failures are isolated from valid production input/result behavior. A runner regression proves an observer throw cannot prevent the shipping success/store path.
- The previously disclosed one cached status bootstrap and additive frozen store receipts remain the only disabled-path additions.

### C8 — authorized structural seams

- Native DTOs/constants, validation, writer/seal logic, and tests are split into the four authorized modules while `profiling.rs` remains the Tauri/state facade.
- Renderer types, config, DOM lifecycle, fixtures, and the Home coordinator are split behind the stable `profiling/trace.ts` facade.
- Node wire validation, binding, integrity, A1 projection, and fixtures are split behind the stable `import-trace-run.mjs` exports/CLI.
- No empty scaffolding, production import from test fixtures, minification, or blanket LOC bypass was added.

## Wire, CLI, and finalization contract

- Launch remains opt-in through `COLOR_TOOL_PROFILE_SESSION=<validated-session-id>`.
- Existing commands remain `profile_status`, `profile_append_batch({batch})`, and `analyze_image({req,profileContext?})`. `profileContext` remains adjacent and optional.
- Finalization is `profile_finalize({req:{sessionId}})` and returns `{sessionId,sealed,openActionCount,recordCount,eventCount,artifactByteCount,droppedEventCount,lastBatchSequence,errorCode}`.
- Header limits now include `maxArtifactRecords:1024`. `eventCount` uses nested-event units rather than JSONL-record units.
- The final record is `{schemaVersion:1,recordType:'session-seal',sessionId,nativeClockId,recordCount,eventCount,actionCount,closedActionCount,nativeReceiveCount,nativeReturnCount,rendererBatchCount,rendererEventCount,artifactByteCount,droppedEventCount,lastBatchSequence,sealed:true}`.
- Public Node exports remain `parseTraceJsonl(bytes)`, `validateAcquisitionBinding(value)`, and `importTraceRun({...})`. CLI flags remain `--trace --binding --build --case --output [--diagnostic]`.

## Exact B1 files, SHA-256, and LOC

Original eighteen paths:

1. `tauri-app/scripts/profiling/schema/trace-record.schema.json` — `36f131a3805e03e3a0486cd4715767f03f7b720142b0629cc28c524a7e158888` — 600
2. `tauri-app/scripts/profiling/import-trace-run.mjs` — `2265a13c45e57aa845f6c56d24b103fb9d09a469ad8369005540f2015a7f9c84` — 131
3. `tauri-app/scripts/profiling/profiling-trace.test.mjs` — `9c8d78ec60fd3686f00b8f829518bd4976210847c96d5ba805e3c40cc156f7a1` — 121
4. `tauri-app/src/lib/profiling/trace.ts` — `b2d9e0febcbea0a593b40b537066b2eaf4c4f2d0d82a74793db5a7645a78deb4` — 623
5. `tauri-app/src/lib/profiling/trace.spec.ts` — `95cca09601bc5ae36f91c31b62666d067cfe1934355985e908661dc0d48474e9` — 560
6. `tauri-app/src/lib/bridges/profiling.ts` — `38de8f926ca17edceb22943e87c5a5658ba4e8f6352dc4c2480d615be588b82a` — 396
7. `tauri-app/src-tauri/src/profiling.rs` — `302fb3224db1c10a6e9870c84d7ab13e207a380d8b52418451e299aedd3da19e` — 425
8. `tauri-app/src-tauri/src/main.rs` — `5c889a8dbd119875ad36d4b2b158b355f177bd03de981373fa262bb7af4e77e0` — 210
9. `tauri-app/src-tauri/src/commands.rs` — `4c4571a98df1881f327ade5181d21348166b71832cef16f9d55468ab394e4d59` — 273
10. `tauri-app/src/lib/bridges/compute.ts` — `d471cb280189b490f4f8313bc75d6e633009526abb11003bf4c107082322db36` — 383
11. `tauri-app/src/lib/compute/bridge.ts` — `47cf9addd07f43442ae0ad524e3abadb0bbfd702446d2bb843168854146ab732` — 24
12. `tauri-app/src/lib/stores/analysis.ts` — `d728d54f3960e5f73886cce4e978bada6dba2fec3297f0a623db9e1b973543c3` — 132
13. `tauri-app/src/lib/stores/analysis.spec.ts` — `7c3e7ede775f98432b4a22fe933c82adc984d7bfb977df868c047aeac5572437` — 108
14. `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` — `bf181e03d86ec58113a7e2b19ff8ff5241a7c5cd503c56cf3af25591b215e5cd` — 403
15. `tauri-app/src/lib/views/home/ParameterControls.svelte` — `0782f5828e9c7516df19c414449af36eb00150c777382275f30010da52122bb5` — 251
16. `tauri-app/src/lib/views/HomeView.svelte` — `c08fa3661a73e3a806b4399e28271c621908f6fcdd2d151bdd855dae900afc7a` — 875
17. `tauri-app/src/lib/views/home/AnalysisCards.svelte` — `aeab1370e7263826c225e645913dda2aefd819895376327b60e143f67c50e2cd` — 297
18. `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` — `e7ecbb46eff6e8385b6327db2501370378203663853edaf224b9bd129c0a6cf0` — 293

Nineteen C8 additions:

1. `tauri-app/src-tauri/src/profiling_wire.rs` — `2306db032b6236878b65c1f274d16e8e833f5709745b6848a075419bb2380ece` — 245
2. `tauri-app/src-tauri/src/profiling_validation.rs` — `13987c0ff4f5be7c3436ce496d9ae8790d22c7f3be9998893e0b7e8ba0266ed7` — 440
3. `tauri-app/src-tauri/src/profiling_writer.rs` — `a75c5d5392d06eb49205b48f62505f43c34a39df91c0d82238b97526ece5d723` — 420
4. `tauri-app/src-tauri/src/profiling_tests.rs` — `88a5116ae87312e1cfb990770880b2a880fe2bdeaa480924fffd9bece2973d69` — 873
5. `tauri-app/src/lib/profiling/trace-types.ts` — `6bdd68d5d530d00df2e74e5b921630143e3e3b4f84ab77d0674a9c4e9e92208d` — 144
6. `tauri-app/src/lib/profiling/trace-config.ts` — `6f734402d761634dcf2b7f4cc0fb896794927b5fc7b57371ef1f78ca7c7affac` — 79
7. `tauri-app/src/lib/profiling/trace-dom.ts` — `4a5b977f7eac12c1cab9c62944951cd35c63c69399a083d336331337a074fa81` — 236
8. `tauri-app/src/lib/profiling/trace-fixtures.ts` — `f39a4258efc46e39788433107554a1931f51e17875dd64deb70153bda2a36074` — 168
9. `tauri-app/src/lib/profiling/trace-dom.spec.ts` — `fc1a4a4992415c59157542e2809bbdef23936002ee26ccb30847707f1113c401` — 150
10. `tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts` — `c733b94e9b6b134971ba9191b4955f73173f57bf11f061d1d843ce7ed6962546` — 286
11. `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts` — `8c154c70d617ca49ed6ef9fdd41d60ff966260981e01baf3925a4ba51214b302` — 229
12. `tauri-app/scripts/profiling/trace-wire.mjs` — `1800aa1c59f0d3feb8afbd8949aae68dbd4aed13d476136fd6da081acc4d5fa2` — 595
13. `tauri-app/scripts/profiling/trace-binding.mjs` — `932539eb444f052ebc54099d75010390b1aae1404c535debfe9894d658cfd914` — 269
14. `tauri-app/scripts/profiling/trace-integrity.mjs` — `be54d84ffaf2866ca2cc91efdfb4af5f0985d5e38ad5fe00ffd5ab4efa754a5b` — 378
15. `tauri-app/scripts/profiling/trace-to-run.mjs` — `f869f755d9728741979983fe2c1d47f34c13e2dbdbaa262f8d145cb44e5d3b48` — 219
16. `tauri-app/scripts/profiling/trace-fixtures.mjs` — `a377b132c41ff556b961d73f7e76cad498ed31e867413c6e4fa47b0d37f51778` — 346
17. `tauri-app/scripts/profiling/profiling-trace-binding.test.mjs` — `10cb3038f39d86cf0295352a9e88b8ebb34723b45d576bd76a4f98bba12a20dd` — 61
18. `tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs` — `bafd964a41a02e8e93aedaa40656c600060198b4947bc466e3ea4fb32b07d892` — 360
19. `tauri-app/scripts/profiling/profiling-native-wire.test.mjs` — `6e525396a2c47ad67fc1d737e6acdd3141d9e3e9abf316940f42846441c6a651` — 200

## Final validation receipts

All commands below were rerun by the integrating Code Lead after the final cross-lane corrections:

- `node --test scripts/profiling/*.test.mjs` — **72 passed, 0 failed, 0 skipped**. This includes the production Rust writer → real Node importer test, 1/1.
- `npm run test -- --run` — **26 files, 276 passed, 0 failed**. Profiling coverage is 54 tests across trace, DOM, store, runner contract, and compiled-Svelte integration suites.
- `npm run check` — **0 errors** and the same two accepted AUD-020 accessibility warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `cargo fmt --all -- --check` — passed.
- `cargo clippy --workspace --offline -- -D warnings` — passed.
- `cargo test --workspace --offline` — **64 passed, 0 failed, 1 intentionally ignored**. The ignored test is the production interop emitter invoked explicitly by the Node test.
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline` — **1 passed, 0 failed**.

The deterministic chart/golden suites remain green. Local Node is v26.8.1. Node 20 and Windows remain unavailable/unrun; nothing was installed or downloaded.

## Remaining size exceptions

No LOC bypass is applied. The formatted JSON schema is 600 lines, which C8 explicitly anticipated. Remaining substantive code/test exceptions are:

- `HomeView.svelte` 875: pre-existing full shipping view; profiling lifecycle is extracted to the 286-line coordinator.
- `profiling_tests.rs` 873: test-only native lifecycle, writer-failure, exact-budget, finalization, and production interop matrix.
- `trace.ts` 623: stable renderer facade plus bounded collector/action state and persistence core; types/config/DOM/fixtures were extracted.
- `trace-wire.mjs` 595: cohesive strict raw-record, event, config, and input wire validation; binding/integrity/projection were extracted.
- `trace.spec.ts` 560: test-only renderer lifecycle/capacity matrix.
- `profiling_validation.rs` 440, `profiling.rs` 425, and `profiling_writer.rs` 420: narrow strict-native validation, Tauri/state facade, and bounded persistence/seal seams respectively.
- `analysis-runner.svelte.ts` 403: shipping runner plus optional isolated observation hooks.

All other new structural seams are below 400 lines.

## Candid friction and proof boundary

- The first real Rust→Node run caught a noncanonical quality-2 fixture (`300000/1024` rather than shipping `180000/2200`) and a pre-admission `freshExecution` mismatch. Both were corrected before the final gate.
- The compiled-Svelte test initially used `import.meta.resolve`, which is unavailable through this Vite SSR path; it now resolves the installed client runtime with `createRequire` and a file URL.
- Independent integration review caught that the renderer initially repeated a cumulative drop count in each batch while native summed it, and that the importer allowed `seal.droppedEventCount >= observed`. The final contract sends action-local drops, persists strictly increasing cumulative native loss snapshots, and requires exact seal equality. A second review found the native-rejected-batch close nuance; that trace now remains unverified evidence without weakening impossible record-order rejection.
- These are executable Rust/Node and compiled-client Svelte proofs, not a live mounted-app acceptance run. There is still no app bundle, real owner interaction, real mounted window/DOM proof, process/symbol attribution, Instruments capture, flame graph, overhead pair, output-parity acquisition, or performance verdict.
- Correction to the previous report: historical `~4000 ms` was displayed **kernel time**, not a measured full interaction. It is not evidence that the whole app interaction took roughly four seconds and no speed claim is made here.

Stop point: review gate. Review Lead owns acceptance and any later live acquisition assignment.
