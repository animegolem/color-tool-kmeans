# AI-IMP-202 B19 native attribution capture submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.49 §10.27; `profiling-b19-attribution-capture-brief.md`. Review state: **SUBMITTED WITH AN INCOMPLETE OWNER-FACING E2E GATE. The one allowed native-PID Time Profiler capture completed and the trace is sealed, but both numeric actions terminated `unverified / hidden-before-dom-raf2`; DOM/RAF2 and physical-presentation endpoints are absent. No rerun was made.**

## Outcome first

The capture is useful for diagnosis, but it is not an accepted full-interactivity flame graph.

- Same-clock renderer evidence shows a fixed 401–403 ms input-to-request delay, followed by 645–832 ms of `run_kmeans`, for 1.129–1.304 s from delivered input to all three enabled figures being generated.
- The source has `ANALYZE_DEBOUNCE_MS = 400`, exactly matching the measured admission delay. This is an identified contribution to interaction latency, not an inference from sampled stacks.
- Native Time Profiler stacks in both **provisional wall-projected** native receive/return windows are dominated by `color_core::kmeans::assignment_step` through Rayon workers. Main-thread sampled CPU weight in those projected windows is only 11 ms and 12 ms.
- Those CPU samples do not prove renderer DOM settlement or physical chart presentation. Both actions lack `dom_raf_2` and `canvas_paint_after_dom`, and the trace itself records `hidden-before-dom-raf2`.
- The initial post-import card read `55 ms · 18 iterations · 260,000 samples`, but no B19 action record proves that value was a fresh execution. It is retained as an operator UI observation only and is not compared as a benchmark.

The user's earlier ~4 s observation is therefore neither confirmed nor disproved. This pass establishes two concrete latency contributors in the captured run, while leaving true visible completion and repeatable regression comparison open.

## Preserved identity and launch

- Exact accepted B14 app: `Color Tool Profile B14.app`, identifier `com.color.tool.profile.b14.r8bf3187`.
- Executable SHA-256: `4b43e52313d783e2c58b9ae762fa96682086a3c6b22f1e45a3523c28ab07c2ae`.
- Build manifest SHA-256: `15f1285f15fa70ffcda71a39df868c935b91aff6024d248548780cf656fc5912`.
- dSYM UUID: `DFF35F8D-552F-322B-85D8-1FC89C2007EB` (arm64), matched by the exported Time Profiler binary row.
- Old B14 PID 18954 was identity-checked, snapshotted, and quit through the normal app menu. It was not signalled or killed. Its live B15 trace remained byte-identical to the frozen B16 copy: 41,843 bytes, SHA-256 `1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652`.
- One fresh detached app process was launched, PID 24489, PPID 1, start `Sun Sep 6 15:03:23 2026`, with inherited environment plus only `COLOR_TOOL_PROFILE_SESSION=b19-attribution-20260906-01`.
- The app reused the existing support/cache namespace. This is a fresh process, not a cold app/OS-cache run.
- The strict native-created JSONL appeared at the reserved cache path with schema v2 and native clock `native-24489-18d2d3e9f91cb8b0`.
- The exact supplied PNG was copied once into the private evidence root: 608,455 bytes, SHA-256 `e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790`.

The B19 evidence root is mode 0700 and its top-level regular artifacts are mode 0600. The native `.trace` package contents retain xctrace-created modes and directory execute bits required for traversal; the enclosing 0700 root is the privacy boundary.

## Acquisition chronology and visibility

1. The standard image was selected through the normal macOS Open panel from the exact private copy. The resulting Colors state was K45, quality 3, exclude 0, merge 0, snap false, with all three charts enabled.
2. The exact one allowed recorder command attached only PID 24489:

   `xcrun xctrace record --template 'Time Profiler' --attach 24489 --time-limit 120s --output <B19>/native-original.trace`

   It reported recording start, reached the specified time limit, completed normally, and saved `native-original.trace`. There was no all-process recording, privilege workaround, `--no-prompt`, Instruments GUI, alternate recorder, or retry.
3. An initial accessibility `setValue` against the cluster slider did not produce a numeric state transition. An accessibility-state read then timed out; a full accessibility refresh still showed K45. These are retained by the trace as sequence 1 `invalid-or-empty`, terminal `unverified / input-target-invalid`.
4. Setting the numeric field to 46 produced sequence 2. Accessibility text then showed K46 and `832 ms · 17 iterations · 260,000 samples`.
5. Setting the numeric field back to 45 produced sequence 3 `invalid-or-empty`, followed by numeric sequence 4. Accessibility text then showed K45 and `645 ms · 18 iterations · 260,000 samples`.
6. The app was not explicitly raised/activated before the numeric actions. The two numeric actions generated all three figure events but then terminated `unverified / hidden-before-dom-raf2`. This observed focus/visibility chronology explains why the instrumentation withheld the DOM/RAF2 endpoint; it does not authorize inventing a visible completion time.
7. After the recording ended, Values was opened once, `Finish capture` was clicked once after settlement, and the trace showed `Trace sealed · validation pending`. The strict JSONL was copied and hashed before returning once to Colors. The final accessible state is the same image, K45/Q3/exclude0/merge0/snapfalse, three charts, sealed, and the app remains open at PID 24489.

The original and copied strict JSONL are still identical after returning to Colors: 19,592 bytes, 14 lines, SHA-256 `daeb5d14764f21ff2b52f8ac4fdd5016d3f5c7c88106910e39f423c0808b5b93`.

## Same-clock renderer and native elapsed evidence

All numbers in this table come from their named clock domains. They are not Time Profiler CPU sample weights.

| Seq | Input | Terminal outcome | Input -> admit | Native receive -> return | `run_kmeans` | Input -> store | Input -> 3 figures | DOM / RAF2 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 1 | invalid/empty | unverified / input-target-invalid | — | — | — | — | — | missing |
| 2 | K46 | **unverified / hidden-before-dom-raf2** | 403 ms | 895.214 ms | 831.621 ms | 1,302 ms | 1,304 ms | missing |
| 3 | invalid/empty | unverified / input-target-invalid | — | — | — | — | — | missing |
| 4 | K45 | **unverified / hidden-before-dom-raf2** | 401 ms | 720.967 ms | 645.464 ms | 1,126 ms | 1,129 ms | missing |

The B18 R1 production parser/organizer/inspector reports schema v2, 14 records, four actions, all structurally/numerically coherent, untainted, and sealed. “Coherent” does not upgrade either numeric action from unverified to completed. All available recorded renderer endpoint durations recompute exactly; `input_to_dom_settled_ms` and `input_to_associated_result_dom_raf2_approx_ms` remain null.

The 400 ms source debounce is at `tauri-app/src/lib/views/home/analysis-runner.svelte.ts:38`; admission is scheduled by the timer at lines 170–183. No source change is made or proposed in this submission.

## Native Time Profiler evidence

The original trace package is preserved unchanged. Its TOC was exported first, and only then were actual schemas selected. Relevant actual schemas are:

- `time-sample`: raw CPU profiling samples;
- `time-profile`: modeled rows with process/thread, 1 ms weight, and symbolicated tagged backtraces;
- `potential-hangs`: Hangs model output.

The TOC identifies one attached target `tauri-app`, PID 24489, plus the kernel support row. The `tauri-app` binary UUID is exactly `DFF35F8D-552F-322B-85D8-1FC89C2007EB`. The original trace was symbolicated into a new `native-symbolicated.trace`; the original was never symbolicated in place.

Whole-recording, unprojected baseline: 2,530 modeled Time Profiler rows and 2,530 ms of deduplicated row sample weight, from xctrace-relative 2.112765 s through 120.355762 s.

### Clock boundary and provisional projection

Every row below is **provisional wall-projected attribution**, not exact alignment.

- App trace-session wall origin: `1788725003879` ms.
- xctrace TOC start: `2026-09-06T15:06:43.486-05:00` = `1788725203486` ms.
- Derived wall-start offset: `199607` ms.
- Projection formula: `projected_xctrace_ns = native_monotonic_ns - ((xctrace_start_unix_ms - trace_session_wall_unix_ms) * 1_000_000)`.
- Known input resolution: both persisted wall inputs are represented to 1 ms.
- Uncertainty bound: **not available / unbounded by this capture**. There is no shared calibration instant, skew measurement, or clock-error bound.


Renderer elapsed clocks remain separate from the app native-monotonic clock and the xctrace sample axis. The projection is useful for locating candidate stack regions only.

| Provisional window | Terminal renderer outcome | Projected xctrace interval | Native elapsed | Deduplicated sampled CPU weight | Main-thread sampled CPU weight | Observed stack concentration |
| --- | --- | ---: | ---: | ---: | ---: | --- |
| K46 seq 2 | **unverified / hidden-before-dom-raf2** | ~61.426–62.322 s | 895.214 ms | 839 ms | 11 ms | `assignment_step` / Rayon; `kmeans_plus_plus` among top leaf frames |
| K45 seq 4 | **unverified / hidden-before-dom-raf2** | ~73.858–74.579 s | 720.967 ms | 892 ms | 12 ms | `assignment_step` / Rayon; `kmeans_plus_plus` among top leaf frames |

Sampled CPU weight can exceed wall elapsed because work runs on parallel workers. Folded stacks and leaf/thread summaries are retained for both provisional windows. Recursive frame-occurrence aggregates count a row's weight at every frame in its stack; they are inclusive/non-additive and must never be summed as CPU or elapsed time.

The strongest supported attribution is therefore: **during the provisionally located native request windows, sampled CPU execution is concentrated in the existing native k-means assignment path across Rayon workers, not on the app main thread.** This does not locate renderer semantic JS/layout work or prove a physical presentation endpoint.

### Hangs model rows

The Hangs schema contains four rows: 3.542531 s severe at 17.311906 s; 252.003 ms microhang at 21.142603 s; 2.243287 s severe at 21.394631 s; and 8.011919 s severe at 38.957495 s.

Under the same unbounded wall projection, all four precede both numeric native windows. Samples in those earlier regions include AppKit/HIServices accessibility attribute traversal. They overlap operator accessibility inspection activity, but neither temporal projection nor the stacks establish a production causal conclusion. They are retained as unassigned acquisition-context evidence, not relabelled as app-interaction hangs.

## Source and system preservation

- Candidate branch/HEAD remain `codex/correctness-wave-01-2026-09-05` / `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- Exact `git status --short -uall` remains 57 entries with stream SHA-256 `062d3a169ed3010c6ef1b0eb485f7b069a8c212122e9b7da959307da1e46ad1a`.
- Accepted B18 R1 source hashes remain:
  - `trace-integrity.mjs`: `476836565d75e82b9147ab61801cd762d49fcefd5a72348c6b7b8abb3b441dee`;
  - `profiling-trace-integrity.test.mjs`: `5da348902e19b05c8d9ab8f05e8e5bd4c75c77d660c5e4b0d963125aed2ef3a5`.
- No candidate source, build, manifest, config, dependency, lockfile, Git state, B14/B15/B16/B17/B18 evidence, or old live trace was changed.
- Safe host facts only: macOS 26.6.2 (25G83), arm64, Mac15,8, 128 GiB, AC power, battery charged. `pmset` reported no recorded thermal/performance/CPU-power warning level. No quiet-host claim is made; unrelated process arguments were not inspected and other workloads were not stopped.

## Evidence inventory

Private root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b19.R3XH4m`

- `native-original.trace`: immutable original Time Profiler package.
- `native-original.toc.xml`, `native-original.time-sample.xml`, `native-original.potential-hangs.xml`: original-trace exports.
- `native-symbolicated.trace`: new symbolicated package.
- `native-symbolicated.toc.xml`, `native-symbolicated.time-sample.xml`, `native-symbolicated.time-profile.xml`, `native-symbolicated.potential-hangs.xml`: symbolicated exports.
- `native-trace.raw.before-colors.jsonl`: strict sealed app trace copy.
- `b19-trace-inspection.json`: B18 R1 production parser/organizer/inspector receipt.
- `b19-attribution-analysis-r1.json`: corrected clock-boundary, whole-recording, and provisional-window analysis.
- `action-2-projected-r1.folded`, `action-4-projected-r1.folded`: provisional folded stack inputs.
- `preflight-and-prequit-receipt.json`, `launch-receipt.json`, bounded old-session snapshots, tool help/version, exact image copy, and analysis scripts.
- `artifact-hashes-r1.sha256`: verified index of 513 stable files, SHA-256 `e7b37caf6dd07f44facecce19db2da2dd5637b2a42ecf7e0edd64cb0abc6f1b7`. It indexes sealed stdout/stderr snapshots and excludes their still-open carrier logs.

The earlier `b19-attribution-analysis.json` and unsuffixed folded files are preserved as superseded derived outputs. R1 corrects their aggregate labels and adds whole-recording totals and explicit per-window provisional status; it does not alter raw/native evidence.
The earlier `artifact-hashes.sha256` is also preserved as superseded: it indexed the still-open stderr carrier before that carrier received later shutdown output. `artifact-hashes-r1.sha256` is the stable, successfully verified evidence index.

## Issues encountered

- `/usr/bin/proc_pidpath` is absent on this host. Exact `ps` executable path plus executable digest were retained instead.
- The first accessibility slider value operation did not produce a numeric input and a following accessibility-tree read timed out. Both resulting invalid/intermediate actions remain in the sealed trace.
- The app was not explicitly raised before the numeric controls, so both numeric actions withheld DOM/RAF2 completion with `hidden-before-dom-raf2`. This is the blocking acceptance fact for an owner-facing E2E graph.
- Source frame symbolication is partial: the matching dSYM resolves major Rust functions such as `color_core::kmeans::assignment_step`, `color_core::kmeans::run_kmeans`, and `color_core::analyze::analyze`, while some optimized leaf frames remain address-only.
- The first artifact index included a live stderr carrier whose contents later changed. It remains preserved for provenance; R1 instead indexes the sealed carrier snapshots and excludes the live logs.

No assigned destructive action, recorder retry, or candidate mutation occurred. No owner blocker is asserted: the incomplete visible endpoint is a review/next-capture design issue, and the Review Lead has the preserved evidence needed to rule on it.

Stop point: Review Lead inspection of B19 artifacts and decision on a separately authorized, explicitly foregrounded owner-facing E2E capture. This submission makes no implementation or optimization recommendation and does not declare the performance regression established.
