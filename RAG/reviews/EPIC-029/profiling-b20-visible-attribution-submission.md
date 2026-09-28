# AI-IMP-202 B20 foregrounded visible attribution submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.50 §10.28; `profiling-b20-visible-attribution-brief.md`. Review state: **SUBMITTED WITH THE FOREGROUNDED VISIBLE-RESULT CAPTURE GATE SATISFIED. Two required warm-ups and both actions inside the one allowed 120 s native recording completed with explicit DOM/RAF1/RAF2 visibility checks and endpoints. The trace is sealed, loss-free, and coherent. RAF2 remains an approximate renderer endpoint, not physical display presentation; native sample alignment remains an unbounded wall projection.**

## Outcome first

B20 repairs the operational visibility gap in B19 without changing the app or instrumentation.

- Pre-recorder K46 and K45 warm-ups completed at 492 ms and 508 ms input-to-associated-result RAF2.
- During the single native recording, K46 and K45 each completed at 507 ms input-to-associated-result RAF2.
- The recorded actions spent 401 ms and 402 ms from input to request admission, consistent with the source's fixed 400 ms debounce. Their native round trips were 79 ms and 77 ms, with `run_kmeans` at 56.277 ms and 57.362 ms.
- Store acceptance occurred at 481 ms for both; all three enabled figures and DOM settlement occurred at 483/483 ms for K46 and 482/482 ms for K45. Each action has exactly one `dom_settled`, one `raf1`, and one `associated_result_dom_raf2_approx`, with `visibleAtDomSettle`, `visibleAtRaf1`, and `visibleAtRaf2` all true.
- In the **provisional, unbounded wall-projected** native receive/return regions, CPU samples concentrate in the existing `color_core::kmeans::assignment_step` Rayon path, with `kmeans_plus_plus` among the leading leaf frames. Main-thread sampled CPU weight is 2 ms for K46 and 0 ms for K45.
- No potential-hang rows were emitted in this recording.

These observations strongly distinguish this run from B19's 645–832 ms native `run_kmeans` results, but they are not a matched workload-control experiment and do not establish a regression, speedup, distribution, or causal host-load explanation. They do establish that this unchanged B14 process produced fully visible, trace-associated K45/K46 results around 0.5 s in the captured foreground run. The user's earlier ~4 s observation and the reported white screen remain unclassified.

## Exact process, material, and source identity

- Unchanged app: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/cargo-target/release/bundle/macos/Color Tool Profile B14.app`.
- Executable SHA-256: `4b43e52313d783e2c58b9ae762fa96682086a3c6b22f1e45a3523c28ab07c2ae`; identifier `com.color.tool.profile.b14.r8bf3187`.
- Manifest SHA-256: `15f1285f15fa70ffcda71a39df868c935b91aff6024d248548780cf656fc5912`.
- Matching dSYM UUID: `DFF35F8D-552F-322B-85D8-1FC89C2007EB`, independently present in the exported symbolicated stack table.
- Old B19 PID 24489/start `Sun Sep 6 15:03:23 2026` was checked against the exact executable, its live trace matched the frozen B19 bytes at 19,592 bytes/SHA-256 `daeb5d14764f21ff2b52f8ac4fdd5016d3f5c7c88106910e39f423c0808b5b93`, relevant carriers/settings were snapshotted, and it exited through the normal app Quit menu. It was not signalled or killed.
- One new detached process was launched: PID 94078, PPID 1, start `Sun Sep 6 15:33:49 2026`, exact executable, inherited environment plus only `COLOR_TOOL_PROFILE_SESSION=b20-visible-20260906-01`.
- Native-created header: schema v2, session `b20-visible-20260906-01`, native clock `native-94078-18d2d593122ac1a8`.
- Exact private source copy: 608,455 bytes, SHA-256 `e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790`. The ordinary native picker showed that exact B20 path selected, an enabled Open button, and the app logged the resulting `palette-wheel-reference.png` source.
- Existing app support/cache namespaces were reused. This is a fresh process, not a cold-cache run.

The final process still matches PID/start/executable, the root renderer log contains one `pageshow:persisted=false` and one `renderer:mounted visibility=visible`, and the app remains open and sealed on final Colors.

## Foreground gate and UI chronology

1. After import, actual state was K45, quality 3, exclude 0, merge 0, snap false, three charts, Frequency/OKHSV/Chroma, with an initial UI card observation of `56 ms · 18 iterations · 260,000 samples`. That card is not treated as a captured action measurement.
2. A fresh native B14 window exposed the documented `Raise` secondary action. `Raise` was performed before the warm-ups; a screenshot showed the unobscured window. The titlebar fallback was unnecessary.
3. The cluster number field was visible after an ordinary content scroll. K45 -> 46 used a field click, select-all, and ordinary keyboard typing. Five seconds elapsed with no AX/screenshot query. Production inspection then established completed sequence 2 with all association and explicit visibility gates true; fresh AX/screenshot showed K46 and the matching charts.
4. K46 -> 45 used the same recipe and no-observation dwell. Sequence 4 passed the same gate; fresh AX/screenshot showed K45.
5. Only after both warm-ups passed was the native recorder started. Its actual stdout established attachment and recording start. The window's `Raise` action was performed again, and a fresh screenshot showed the foreground K45 state.
6. Recorded K45 -> 46 and K46 -> 45 used the same ordinary field and five-second no-observation recipe. Sequences 6 and 8 both passed the full visible endpoint gate and had matching fresh AX/screenshots.
7. The recorder reached its specified limit and saved normally. Values showed the same source and value-analysis surface. Finish was clicked exactly once; `Trace sealed · validation pending` appeared and the button disabled. The 42,413-byte raw trace was copied and hashed before one final Colors navigation. Final Colors retained the same image, K45/q3/exclude0/merge0/snapfalse, three charts, and sealed state.

The normal field replacement emitted an intermediate numeric `4` before the final two-digit target each time. All four intermediate actions are retained as coherent `cancelled / input-superseded`; none entered native execution. No empty or invalid action was produced.

Native CUA screenshots and raw AX results are retained in this task's tool history. Screenshot buffers were not exported to indexed files, so the report does not invent screenshot paths. Most returned screenshots were 1215x768 native capture pixels. The Values capture returned only 92x104 pixels and is not used as readable visual proof. Neither screenshot dimensions nor AX outer-window geometry are claimed as CSS viewport or devicePixelRatio.

## Strict trace evidence

The live trace and frozen pre-Colors copy remain identical after final Colors: 42,413 bytes, SHA-256 `4cbb444c810ceb38c5d6716f17133dfc39ff2baf316b91b9b2e8388cc4b02303`.

The accepted B18 R1 production parser/organizer/inspector reports schema v2, 26 records, eight batches/actions/closes, four native receive/return pairs, zero loss, an untainted valid seal, and eight coherent actions. The four completed targets have one each of the three required visible endpoint records.

| Seq | Phase | Delivered input | Terminal | Native receive/return | Visible DOM/RAF1/RAF2 | Input -> admit | `run_kmeans` | Input -> store | Input -> 3 figures / DOM | Input -> RAF2 |
| --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | warm-up intermediate | K4 | cancelled / input-superseded | no / no | no endpoints required | — | — | — | — | — |
| 2 | warm-up | K46 | completed | yes / yes | true / true / true | 402 ms | 52.515 ms | 476 ms | 478 / 478 ms | 492 ms |
| 3 | reset intermediate | K4 | cancelled / input-superseded | no / no | no endpoints required | — | — | — | — | — |
| 4 | reset warm-up | K45 | completed | yes / yes | true / true / true | 403 ms | 56.960 ms | 481 ms | 483 / 483 ms | 508 ms |
| 5 | recorded intermediate | K4 | cancelled / input-superseded | no / no | no endpoints required | — | — | — | — | — |
| 6 | recorded target | K46 | completed | yes / yes | true / true / true | 401 ms | 56.277 ms | 481 ms | 483 / 483 ms | 507 ms |
| 7 | recorded reset intermediate | K4 | cancelled / input-superseded | no / no | no endpoints required | — | — | — | — | — |
| 8 | recorded target | K45 | completed | yes / yes | true / true / true | 402 ms | 57.362 ms | 481 ms | 482 / 482 ms | 507 ms |

`associated_result_dom_raf2_approx` proves that the guarded document visibility checks passed through a second animation frame for the associated result. It is not a physical display-present timestamp.

## Recorder and native sampling evidence

The one allowed command was:

`xcrun xctrace record --template 'Time Profiler' --attach 94078 --time-limit 120s --output <B20>/native-original.trace`

Actual recorder stdout says `Starting recording with the Time Profiler template. Attaching to: tauri-app (94078). Time limit: 120.0 s`, then reports the time limit reached, recording completed, and `native-original.trace` saved. Process exit was code 0 with no signal. The original trace package is preserved; TOC was exported before observed-schema tables. Symbolication used the matched dSYM and a new `native-symbolicated.trace`, never the original in place. Both original and symbolicated `time-sample`, `time-profile`, and `potential-hangs` tables are retained.

Whole recording:

- 3,227 modeled `time-profile` rows / 3,227 ms total sampled CPU weight;
- 3,225 stack-bearing rows / 3,225 ms;
- two missing-backtrace rows / 2 ms, retained explicitly in totals;
- sampling interval configured at 1 ms;
- first modeled sample at 0.331510333 s and last at 120.741508791 s;
- zero `potential-hangs` rows.

CPU sample weight is not elapsed latency and can exceed wall duration when parallel workers run concurrently. Recursive frame-occurrence totals count a sample at every frame occurrence, including repeated Rayon recursion, and are inclusive/non-additive.

## Clock boundary and provisional native attribution

Every CPU-window result below is **provisional and unbounded wall-projected attribution**, not calibrated alignment.

- Trace-session wall origin: `1788726829661` ms.
- xctrace start: `2026-09-06T15:37:38.595-05:00` = `1788727058595` ms.
- Derived offset: `228934` ms.
- Formula: `projected_xctrace_ns = native_monotonic_ns - ((xctrace_start_unix_ms - trace_session_wall_unix_ms) * 1_000_000)`.
- Both persisted wall inputs are represented to 1 ms, but the uncertainty bound is **unavailable/unbounded**: the header wall epoch is not an exact native `Instant` calibration, and no shared calibration instant, skew measurement, or clock-error bound was captured.

Warm-up native regions project before the recorder and correctly contain no profiler rows. Recorded candidate regions are:

| Recorded action | Renderer terminal | Provisional interval | Native elapsed | Total / stack-bearing CPU sample weight | Missing-backtrace weight | Main-thread CPU sample weight | Stack concentration |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| K46 seq 6 | completed, visible checks true | ~37.258–37.335 s | 77.186 ms | 276 / 276 ms | 0 ms | 2 ms | Rayon `assignment_step`; `kmeans_plus_plus` 26 ms leaf weight |
| K45 seq 8 | completed, visible checks true | ~59.258–59.335 s | 76.654 ms | 285 / 285 ms | 0 ms | 0 ms | Rayon `assignment_step`; `kmeans_plus_plus` 24 ms leaf weight |

The full-recording missing-backtrace bucket remains in whole CPU totals and the folded-stack convention names it `[missing-backtrace]`; neither selected candidate window happened to contain such a row. The native trace does not provide semantic WebContent JavaScript/layout stacks, FFmpeg work, or physical presentation timing.

## Case binding and importer outcome

K46 and K45 have separate case manifests because their analysis configurations differ. Each binding accounts for all eight action IDs and selects only its matching recorded action; all other actions remain nonselected with warm-up/reset/measured roles.

- Source and runtime configurations are represented from hash-checked material, native-created trace, persisted settings, and frozen event log.
- Still-image frame timestamps are `not-applicable`; decoded pixel digest was not collected.
- CSS viewport width/height/scale are `not-exposed` rather than inferred from screenshot pixels.
- Binding verification is deliberately `caller-asserted`, because the native CUA screenshot evidence exists only in tool history and viewport evidence is unavailable.
- Both bindings validate structurally. Current importer diagnostic runs each select one action, account for seven nonselected actions, and report only `ACQUISITION_NOT_VERIFIED`. They are diagnostic records, not eligible benchmark imports.

No evidence reference, viewport, binding status, or eligibility was upgraded merely to produce a green import.

## Source, host, and preservation state

- Candidate remains `codex/correctness-wave-01-2026-09-05` at `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`, with 57 status entries and exact status-stream SHA-256 `062d3a169ed3010c6ef1b0eb485f7b069a8c212122e9b7da959307da1e46ad1a`.
- All 55 B14 source leaves remain exact. Current offline-only tool differences remain limited to accepted checker SHA-256 `476836565d75e82b9147ab61801cd762d49fcefd5a72348c6b7b8abb3b441dee` and test SHA-256 `5da348902e19b05c8d9ab8f05e8e5bd4c75c77d660c5e4b0d963125aed2ef3a5`.
- No candidate source, build, manifest, dependency, lockfile, schema, Git state, old trace, or prior evidence was modified.
- Host receipt: macOS 26.6.2 (25G83), arm64 Mac15,8, 128 GiB, AC power, charged battery. `pmset` reports no recorded thermal/performance/CPU-power warning level.
- This was an active-host exploratory capture. No quiet-host, workload-equivalence, cache-parity, instrumentation-overhead, distribution, or platform claim is made. No unrelated process arguments were inspected and no owner workload was stopped.

## Evidence inventory

Private root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b20.JHAWY2`, mode 0700. Top-level regular evidence is mode 0600; xctrace package internals retain tool-created file and directory modes inside the private root.

- `native-original.trace` and `native-symbolicated.trace`.
- Original and symbolicated TOCs and exported `time-sample`, `time-profile`, and `potential-hangs` XML.
- `native-trace.raw.before-colors.jsonl` and `sealed-trace-inspection.json`.
- Four phase-specific live-inspection receipts for warm-up and recorded K46/K45 targets.
- `b20-attribution-analysis.json` plus provisional folded stacks for each native action; recorded folds retain all selected-window rows and have an explicit missing-stack convention.
- Exact recorder stdout/stderr, spawn/exit receipts, export/symbolication receipts, and corrected stream-classification receipt.
- Prequit B19 snapshots; B20 sealed/final app, event-log, and settings snapshots; launch, UI-observation, safe-host, and final preservation receipts.
- Two case manifests, two acquisition bindings, two diagnostic imported runs, and combined importer receipt.
- Exact private image copy and the scripts used to prepare, launch, inspect, record, export, analyze, bind, and preserve the acquisition.
- `artifact-hashes.sha256`: 586-entry stable evidence index, SHA-256 `bcacd4237826ac6febcef7e795d3fa1e93099f97a1c68d2e76a5fae91e04d26a`; all entries passed `shasum -a 256 -c` after creation.

Growing `b20-app.stdout.log` and `b20-app.stderr.log` are excluded from the immutable index; frozen sealed and final snapshots are included instead.

## Issues encountered

- Ordinary select-all/type emits an intermediate `4` before the complete two-digit target. The four resulting actions were preserved and coherently cancelled as input-superseded rather than hidden or forced into execution.
- `record-b20.mjs` initially watched stderr for recorder-start text, but installed xctrace emitted start and completion text to stdout. The original exit receipt therefore says `startedEvidence:false`; it is preserved unchanged. Actual stdout contains the exact start and normal-completion evidence, and `seal-preservation-receipt.json` records the corrected stream classification without rewriting the original receipt.
- The Values screenshot returned only 92x104 pixels. Its bytes were not persisted and it is not treated as readable proof; fresh AX established the same study and Values surface.
- CUA screenshot buffers were displayed in task history but not exported to private files. The durable trace/AX transcriptions and UI observation receipt are explicit about this limitation.
- The first local analysis-script execution failed before output because `nativeAggregateNs` is encoded as a JSON string. The private analysis script was corrected to parse that field as an integer, then succeeded. Raw/native/source evidence was not changed and no alternate capture occurred.
- A pre-index permission check briefly normalized the two top-level `.trace` package directories to mode 0600 along with regular files. It was detected immediately and both package roots were restored to 0700 before validation and indexing; package contents and evidence bytes were unchanged.
- The two case imports are diagnostic because binding verification remains caller-asserted. Their sole problem code is `ACQUISITION_NOT_VERIFIED`; this is deliberate honesty, not an ignored failure.

No destructive action, profiler retry, source change, second session, or second recording occurred.

Stop point: Review Lead inspection and construction of the bounded owner-facing visual review artifact now that real visible endpoints exist. This submission does not itself declare owner E2E acceptance, a performance regression, profiling parity/overhead, or an optimization ruling.
