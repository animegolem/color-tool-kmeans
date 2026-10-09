# IMP-202 profiling rebase scope report

Sol (Code Lead) -> Genga (Review Lead), 2026-10-09. This is the single read-only
report assigned by [the rebase scope verdict](profiling-rebase-scope-verdict.md).
It proposes the Stage A measurement contract; it does not authorize source work,
builds, launches, captures, Git changes, owner-data inspection, or threshold
adoption.

## Outcome and corrections first

The two-arm design is viable, but neither arm is ready to measure yet.

- **Arm A is source-identified and clean** at
  `3f3cee8cb53e6f0478b1509f87edbfd08221a672`. Its future build can be made
  reproducible once the lead adopts the exact pins below and issues a build
  fence.
- **Arm A supersedes Wave 03 for this experiment by ruling, but does not
  genealogically descend from the Wave 03 tip.** The merge-base of current
  `main` and `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2` is
  `5baa20e021855fbc57aebf48fa0f9b3374ded281`. No change found only on
  `8bf3187` may be attributed to Arm A without a source mapping.
- **The installed v1.0.1 app is an Arm B candidate, not yet an admitted
  known-good baseline.** Its binary identity is exact, but it has not been
  owner-confirmed as the remembered 20–60 ms build, copied to immutable private
  preservation, or bound to source, a build receipt, locks, symbols, or source
  maps. The `v1.0.1` tag is a plausible historical locator, not a proved source
  binding.
- **Arm A has no current trace runtime or profiling tool paths.** The only
  usable production timing is the coarse `run_kmeans` duration returned as
  `durationMs`. Sampling computes a coarse duration internally but discards it
  from the response. The global renderer heartbeat/stall log is not
  action-correlated. The B11–B20 source foundation at `9215711` is historical
  material on `codex/correctness-wave-01-2026-09-05`, not Arm A behavior.
- **B20 remains diagnostic only.** Its approximately 507 ms input-to-RAF2,
  77 ms native round trip, and 56–57 ms kernel observations were two visible
  actions on an active host. Both imports are `ACQUISITION_NOT_VERIFIED`; they
  supply no matched comparison, distribution, calibrated cross-clock
  attribution, renderer stacks, FFmpeg coverage, or physical-presentation
  proof. See [the B20 verdict](profiling-b20-visible-attribution-verdict.md).

Consequently, Stage A must first settle Arm B admission, freeze both identities,
and establish the minimum trace contract. This report contains no performance
conclusion.

## Status vocabulary

- **EXISTS** means current Arm A production emits a bounded value usable for
  that exact stage. A nearby log, source stopwatch whose value is discarded, or
  an uncorrelated heartbeat does not qualify.
- **NEEDS** means Stage A or a later explicit fence must add or validate the
  observation. It does not mean the underlying work is absent.
- **SURVIVES** means the semantic span belongs in the shared web application or
  `color-core` after the held redesign.
- **ADAPTER** means the semantic boundary survives, but each browser/Tauri
  adapter needs its own implementation and target label.
- **DESKTOP ONLY** means the present Tauri/sidecar mechanism must not be treated
  as shared-web instrumentation.

## 1. Two-arm matrix and provenance

| Field                | Arm A — current deliverable                                                                                          | Arm B — prior-release candidate                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Experimental role    | Current shared-web/Tauri base; replaces the Wave 03 arm by ruling                                                    | Immutable end-to-end regression baseline only                                                                                                              |
| Identity             | clean `main` at `3f3cee8cb53e6f0478b1509f87edbfd08221a672`                                                           | installed `/Applications/Color Tool.app`, version `1.0.1`, bundle ID `com.color.tool`                                                                      |
| Genealogy/source     | merge-base with Wave 03 `8bf3187` is `5baa20e`; supersession is experimental, not ancestry                           | possible tag `v1.0.1` -> `b31ed93d5e7e6dd4ca31e145b83fcf97b1338456`; no receipt binds the installed executable to it                                       |
| Executable           | not built or authorized                                                                                              | `Contents/MacOS/tauri-app`, SHA-256 `475a5d0825a37e18f0b1a51b5e96d1e3154497112ebd4498a1de14626c8940c2`, Mach-O UUID `5237E2A8-E620-37F2-B76C-2EEACC883A2C` |
| Preservation         | source commit exists; future bundle, manifest, symbols and source maps still NEED preservation                       | live `/Applications` copy only; no immutable private freeze found, so preservation NEEDS before use                                                        |
| Internal stages      | one coarse k-means aggregate EXISTS; all detailed correlated spans NEED instrumentation                              | unavailable by construction; never infer internal stages from Arm A or from a recompiled tag                                                               |
| Permitted comparison | full correlated observation after later fences                                                                       | external action/feedback/RAF2 or independently proved presentation only                                                                                    |
| Admission blockers   | accepted toolchain/build/trace fence, isolated namespace, symbols/source maps, parity and disabled-overhead controls | owner confirms this exact app is the remembered fast release; lead freezes and hashes it; normal launch/control gets a separate fence                      |

### Arm B exact bundle inventory

The six currently installed files identify the located candidate. Hashes are
observations of the mutable installed location, not proof of immutable
preservation.

| Relative path                    | SHA-256                                                            |
| -------------------------------- | ------------------------------------------------------------------ |
| `Contents/Info.plist`            | `17475e420a40cd5c50df648a99db9ded079216f1095d9bf3d533db1ef7a44115` |
| `Contents/MacOS/ffmpeg`          | `e554de6ac7cf6d93182961e89eafbb022012601770def39316bc3844a560e501` |
| `Contents/MacOS/ffprobe`         | `e6555c55b60734a7fd690e32f63f7ab801872e7097bc54995e101cdd307f25af` |
| `Contents/MacOS/kmeans_baseline` | `ad505684e29cfcc5ffa6e3906d191fae9c9361d52089a812ca5911b3f5f043f2` |
| `Contents/MacOS/tauri-app`       | `475a5d0825a37e18f0b1a51b5e96d1e3154497112ebd4498a1de14626c8940c2` |
| `Contents/Resources/icon.icns`   | `b2473ce8e57edc8ee0f2a3bb35368cea763b33720b4819ea3817c8042232818a` |

Missing for Arm B: owner admission, frozen bundle path and inventory manifest,
code-signing receipt, source/build command/profile/features/environment, lock
files, Rust/Node/Xcode identity, dSYM, JavaScript source maps, and a tag-to-binary
receipt. The tag tree has no `Cargo.lock`. Recompiling it would create a third,
separately identified arm and is outside this assignment.

### Proposed exact Arm A build pins

These pins are a proposal for lead adoption before any build. The current local
defaults (`rustc 1.90.0`, Node `26.8.1`, npm `11.19.0`) must not silently supply
the profiling build.

| Item            | Proposed pin / observed identity                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rust target     | `aarch64-apple-darwin`                                                                                                                                                                                                              |
| rustc           | `1.99.0`, commit `b940084d7eb6a299eb4bfeb8e34901bc051e7ac4`                                                                                                                                                                         |
| Cargo           | `1.99.0`, commit `5f94df4789f005f9a352888e8355ffc645b7ed0e`                                                                                                                                                                         |
| Node/npm        | Node `20.20.2` with bundled npm `10.8.2`; Node 20 is now out of maintenance, but this is the exact final Node 20 line matching current CI's major-version contract ([official archive](https://nodejs.org/en/download/archive/v20)) |
| Apple toolchain | Xcode `27.0` build `27A266a`; macOS SDK `27.0`; Apple clang `21.0.0 (clang-2100.3.34.2)`                                                                                                                                            |
| Host at audit   | macOS `27.0` build `26A428`, arm64; recapture machine model, power and thermal state at build/run time                                                                                                                              |
| Build mode      | ordinary optimized release; preserve matching dSYM/line tables and renderer source maps; record all flags, features and environment allowlist                                                                                       |

Arm A source/config inputs at `3f3cee8`:

| Input                                 | SHA-256                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| `Cargo.toml`                          | `22964484ab47857c253186fa250eb7a314c581bebdf8e8081852a27fa6ddd444` |
| `Cargo.lock`                          | `fc69255a02bb05664a4cd1e7fe9e69115034445584a3526e04dcdda76065b82e` |
| `color-core/Cargo.toml`               | `5b7042622de26faf1d4d7cd20ad4cdf340876085d8c0929a0c45353582441f88` |
| `tauri-app/package.json`              | `f190b837eaa17dfdffc239c10b71207a10e6294ed18792378b9918e39b6b43d5` |
| `tauri-app/package-lock.json`         | `a21ccb86d5ffa47a257dca4a2de346ac9d51db257066f29739a5a58743b1283c` |
| `tauri-app/src-tauri/Cargo.toml`      | `c501ba80556a669da7ddf372034b085d0812bfa9269e5093093aa6b690c6f55d` |
| `tauri-app/src-tauri/tauri.conf.json` | `d369c228c69da7a78a9e9c939a751441705e9dadc5bc112077e52444d3946c76` |
| `tauri-app/vite.config.ts`            | `f3be777f0190f1bf666c262cf236da3d76d4e067c2c1da4cba85abe95bd36841` |
| FFmpeg sidecar                        | `e554de6ac7cf6d93182961e89eafbb022012601770def39316bc3844a560e501` |
| FFprobe sidecar                       | `e6555c55b60734a7fd690e32f63f7ab801872e7097bc54995e101cdd307f25af` |

Every future build receipt must additionally bind the final executable/bundle,
dSYM UUID and bytes, source-map bytes, dependency graph, exact command,
profile/flags/features, code-sign identity, isolated preferences/cache identity,
and dirty-status stream. Arm B has no build pin because it is deliberately a
binary-only arm; unknown provenance is recorded, not invented.

## 2. Arm A stage map

The map follows PROJECT-RECORD §10.3. `EXISTS` is deliberately strict. A single
parent action/correlation ID must reach every admitted child and terminal state;
parallel spans retain parentage and are not added as if serial.

| ID  | Semantic boundary                                | Current Arm A | Redesign fate    | Source basis / required observation                                                                                                   |
| --- | ------------------------------------------------ | ------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| S00 | delivered user input -> correlated action        | NEEDS         | SURVIVES         | Place at the shared UI control before debounce; record exact delivered value, selection/content/execution identities and case ID.     |
| S01 | debounce interval                                | NEEDS         | SURVIVES         | Current Colors analysis has a fixed 400 ms timer; video frame extraction has 250 ms. Source constants are not observations.           |
| S02 | admission, queue and wait                        | NEEDS         | SURVIVES         | Mark admitted/cancelled/deduped/stale separately and terminate every action. Do not collapse worker/queue wait into compute.          |
| S03 | FFmpeg/FFprobe process spawn, decode and wait    | NEEDS         | DESKTOP ONLY     | Tauri sidecar timing and process identity; browser decode needs a distinct adapter span, never the FFmpeg label.                      |
| S04 | encoded image read/decode                        | NEEDS         | SURVIVES in core | Begin/end inside `color-core` around `ImageReader` decode, for path and byte sources.                                                 |
| S05 | RGBA conversion/downscale                        | NEEDS         | SURVIVES in core | Separate conversion and conditional Lanczos resize; preserve dimensions.                                                              |
| S06 | pixel sampling                                   | NEEDS         | SURVIVES in core | Aggregate only; retain stride/max-sample/seed and counts, never per-pixel events.                                                     |
| S07 | RGB -> OKLab and dataset preparation             | NEEDS         | SURVIVES in core | Separate conversion from the subsequent dataset clone/build.                                                                          |
| S08 | whole `run_kmeans` call                          | EXISTS        | SURVIVES in core | Returned `durationMs` times only `run_kmeans`; it is not the full native pipeline. Bind it to the action.                             |
| S09 | k-means initialization                           | NEEDS         | SURVIVES in core | Aggregate k-means++ or warm-start initialization; no centroid-loop tracing.                                                           |
| S10 | k-means iterations                               | NEEDS         | SURVIVES in core | One bounded aggregate plus iteration count; optional bounded per-iteration summary, no point/centroid hot-loop events.                |
| S11 | final assignment/materialization                 | NEEDS         | SURVIVES in core | Separate final assignment and centroid/count materialization from iterations.                                                         |
| S12 | snap/merge/color conversion/sort                 | NEEDS         | SURVIVES in core | Named postprocess children with output counts.                                                                                        |
| S13 | native response serialization and command return | NEEDS         | ADAPTER          | Tauri serialization/IPC implementation is desktop-specific; request/response contract and adapter boundary survive.                   |
| S14 | renderer receive, normalize and validate         | NEEDS         | ADAPTER          | Bound `invoke` resolution separately from Zod normalization/validation.                                                               |
| S15 | accepted store publication                       | NEEDS         | SURVIVES         | Mark only token-current acceptance; stale results terminate as stale and never acquire a presentation endpoint.                       |
| S16 | chart/SVG derivation                             | NEEDS         | SURVIVES         | One bounded span per enabled figure plus aggregate; current Svelte derived calls are unmeasured.                                      |
| S17 | associated DOM settle -> RAF1 -> RAF2            | NEEDS         | SURVIVES         | Require the result-associated document to be visible at each checkpoint. RAF2 remains approximate.                                    |
| S18 | physical presentation                            | NEEDS         | ADAPTER          | Only claim when independently demonstrated with target-specific presentation evidence and an error bound. Otherwise report RAF2 only. |
| S19 | feedback and renderer responsiveness             | NEEDS         | SURVIVES         | Action-correlated first feedback, frame gaps/long tasks and visibility. Current global >1 s stall log and heartbeat are insufficient. |
| S20 | end-to-end terminal status                       | NEEDS         | SURVIVES         | Completed, cancelled with reason, failed, timed out/right-censored, stale or no-result; zero silent drops.                            |

The coarse sampling stopwatch at `color-core/src/image_pipeline.rs` covers decode
through OKLab conversion but its `duration_ms` is discarded by `analyze`; it does
not make S04–S07 EXIST. The current global renderer RAF loop can notice a large
stall but cannot associate it with a case/action, so it does not make S17 or S19
EXIST.

Historical commit `921571131939fbb7a9771e558bfbd4f54ab9f789` and B11–B20
may be mined for schema, terminal-state, loss accounting, store/DOM association,
validation and local bounded-capture patterns. Reuse requires a new source review
against Arm A; none of those paths are present in current `main`.

## 3. Case-to-stage matrix

All cases bind source/frame, resolved parameters, viewport/scale, visible result,
cache state and terminal status. A cache hit and a fresh computation are different
cases, not mixed samples.

| Case                 | Exact action                                                                                        | Required stage path on Arm A                                 | Notes                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| C01 still import     | choose one owner-mapped still from outside the app -> first correct visible analysis                | S00, S02, S04–S20; S01 only if the actual import path defers | Separate picker time from the delivered-input clock.                                                                                            |
| C02 video initial    | choose owner-mapped video -> exact initial extracted frame -> first correct visible analysis        | S00–S20, including desktop S03                               | Bind requested and FFmpeg-used timestamp plus decoded-pixel digest. Strip/poster work is concurrent child work, not serial analysis time.       |
| C03 video frame step | from a fixed settled landmark, step exactly +1 frame -> correct frame/result visible                | S00–S20, including 250 ms S01 and desktop S03                | Record effective FPS, requested frame intent and actual timestamp.                                                                              |
| C04 video seek       | drag or set the scrubber to one owner-selected landmark and release -> correct frame/result visible | S00–S20, including 250 ms S01 and desktop S03                | Input feedback while dragging is separate from release-to-result.                                                                               |
| C05 parameter        | settled K45 -> delivered K46 -> correct visible result                                              | S00–S02, S04–S20                                             | Preserve any intermediate field value as cancelled/input-superseded, as B20 did. Fixed 400 ms debounce remains part of latency, not an outlier. |
| C06 navigation       | Colors -> Values -> Colors with fixed settled content                                               | S00, S02, S15–S20                                            | No native analysis is expected. Measure feedback and each correct view presentation; unexpected compute is evidence.                            |
| C07 fresh switch     | switch from settled asset A to not-yet-analyzed asset B -> correct B result visible                 | S00–S02, then applicable S03–S20                             | Bind selection/content/execution identity and prove A cannot publish into B.                                                                    |
| C08 cache-hit switch | B -> A where A has a proved current cached result/state -> correct A visible                        | S00–S02, S15–S20; record any actual extra work               | Never pool with C07. Cache-key and currentness proof are part of correctness.                                                                   |

Arm B runs the same externally observable action definitions where its UI supports
them. Only S00, action-correlated feedback, external visible/RAF2 endpoint (or a
later independently proved presentation endpoint), and S20 may be reported for
Arm B. Its S03–S16 internals are **unavailable**, not zero.

## 4. Experimental design

### 4.1 Preconditions and run binding

Before measurement, freeze a versioned protocol, case manifests and randomized
schedule. Each record binds:

- arm identity, source/dirty status or immutable executable inventory, bundle,
  symbol/source-map/lock/sidecar hashes and build receipt;
- machine model, OS/build, target, Xcode/SDK, power source, thermal-pressure
  state, display/viewport/device scale, window visibility/occlusion and app
  namespace;
- case/stable asset ID, byte digest, encoded and decoded metadata, requested and
  actual video frame intent, resolved analysis/render parameters and cache state;
- action ID, parent/child structure, timestamp clock/domain, calibration receipt,
  terminal status, trace loss and profiler process coverage;
- quiet/active-ML and process-cold/warm strata. Non-comparable runs remain in
  separate strata.

No run is eligible if correctness, provenance, trace integrity or required
visibility fails. The run remains in the record with its failure/censoring state.

### 4.2 Cold and warm

- **Process-cold:** the first measured case after a normal app quit and verified
  fresh process launch. Existing persistent app caches/preferences are not
  deleted; their state and namespace are recorded. OS filesystem caches are not
  purged. Therefore this is explicitly process-cold, **not** OS-cold or
  guaranteed app-cache-cold. Only experiment-owned isolated state may later be
  reset, and only under a separate fence.
- **Warm:** same process, same arm/case/asset and unchanged resolved settings
  after two successful unmeasured warm-ups. Warm-ups are retained and labeled,
  not included in the measured distribution. A process restart or material cache
  transition starts a new block.

If Arm B cannot expose enough cache-state evidence for a matched claim, its
process-cold results remain end-to-end observations with that limitation; they
are not silently called cache-cold.

### 4.3 Repetitions and order

- **Pilot:** 10 completed observations per arm/case/stratum/temperature cell,
  plus every failure/cancellation/censored attempt. Pilot p95 is descriptive and
  tail-inadequate; it selects no winner.
- **Confirmation proposal:** 40 completed observations per retained cell, with
  the pilot excluded. Forty is the minimum here for a nontrivial nearest-rank
  p95 (rank 38); all failed/censored attempts remain alongside the completed
  count. The lead may narrow confirmation cells after the pilot, but any omitted
  case/stratum stays unaccepted rather than inheriting another cell's result.
- **Pairing:** where both arms support a case, run matched A/B pairs within the
  same host window. Balance AB and BA inside blocks; do not run every A then
  every B.
- **Fixed schedule seed:** literal UTF-8
  `imp202-rebase-v1-20261009`. A Stage A tool derives order from SHA-256 of
  `seed || stratum || temperature || case || repetition`, publishes the schedule
  and digest before results, and never redraws after a failure. A retry is a new
  labeled attempt, not a replacement row.

The full proposal is deliberately substantial. Operator/autonomous wall time is
estimated after the 10-repeat pilot and is not owner-attention time.

### 4.4 Host strata

- **Quiet:** owner declares a window with no planned heavy local ML job; the
  operator records visible app state, power and thermal pressure without killing
  processes, changing system settings or inspecting unrelated arguments.
- **Active-ML:** the owner identifies an already intended representative local
  ML workload and declares its stable window. Profiling neither starts/stops nor
  reconfigures it. Exact private workload details may remain a stable local ID;
  record only owner-authorized coarse load evidence. Pair A/B closely within
  that window.

Quiet and active-ML results are separate distributions. Neither is normalized
into the other, and an unmatched active workload cannot support a causal ratio.

### 4.5 Exact owner request for the varied Desktop set

Ask the owner for one bounded session to:

1. point to at least two stills and two videos already on the Desktop that span
   ordinary and demanding material, and confirm the exact installed Arm B app
   is or is not the remembered fast release;
2. approve private stable IDs (`STILL-A`, `STILL-B`, `VIDEO-A`, `VIDEO-B`) mapped
   locally to exact paths; approve byte hashing and media-metadata/decoded-pixel
   inspection only for those files;
3. choose one initial frame and two meaningful landmarks per video for initial,
   +1-frame and seek cases, and confirm the representative K45 -> K46 change;
4. confirm the fixed window size/viewport/scale and resolved quality, exclude,
   merge, snap and enabled-chart settings.

The local mapping is mode-restricted private evidence. Record SHA-256, byte size,
format, dimensions and authorized video metadata; do not copy raw media into Git,
upload it, mutate it, perform a broad Desktop inventory, or expose private paths
in committed reports. Stable IDs, digests and nonidentifying metadata may enter
manifests only after the owner's privacy confirmation.

## 5. Metrics, estimators and criteria before data

### 5.1 Reported metrics

For every eligible cell report completed/attempted/cancelled/failed/censored
counts, p50 and p95 for:

- delivered input -> first visible feedback;
- delivered input -> admission;
- every available same-clock S03–S19 span and the S08 coarse k-means value;
- delivered input -> associated DOM/RAF2 approximation;
- independently proved physical presentation only when S18 is actually
  available;
- action-correlated renderer frame gaps/long tasks and maximum consecutive
  unresponsive interval;
- paired Arm A minus Arm B absolute and percent deltas for common external
  endpoints; Arm A tracing-on minus tracing-disabled overhead for common spans.

Use empirical nearest-rank quantiles (Hyndman–Fan Type 1): sorted rank
`ceil(p * n)`. Use a deterministic 10,000-resample paired, block-stratified
bootstrap with seed `imp202-bootstrap-v1-20261009` for 95% percentile confidence
intervals on p50, p95 and paired deltas. Report the estimator, seed and actual
resample count. Do not bootstrap across cases, host strata or cold/warm strata.

The attempt ceiling is 30 seconds from delivered input. An action without its
required terminal endpoint is right-censored at the observed bound and preserved.
Use a Kaplan–Meier estimate for censored end-to-end distributions; if the p95 is
not estimable, report the lower bound (for example `p95 >= 30 s`) rather than a
fabricated number. Stalls and outliers are never discarded.

### 5.2 Hard gates

These are not exploratory performance thresholds:

1. **Correctness:** exact source/frame/parameters/cache intent, token-current
   result, correct visible content, no stale cross-publication. Any mismatch
   fails that attempt and blocks performance acceptance for the cell.
2. **Trace integrity:** every admitted action terminates; identifiers are unique
   and parentage-valid; dropped/missing/partial records and no-result runs are
   explicit; schema and immutable evidence validate.
3. **Parity:** Arm A instrumented-disabled and instrumented-enabled builds use
   identical inputs/settings and yield the same canonical response digest and
   required visible state. Tracing may observe but may not change selection,
   cache keys, scheduling authority or numerical output.
4. **Clock calibration:** do not subtract or join Rust, JavaScript and profiler
   clocks unless calibration demonstrates an error bound no larger than
   `max(5 ms, 5% of the boundary being compared)`. Otherwise publish only
   within-clock spans and label projected windows unbounded.
5. **Profiler coverage:** identify native, Rayon, FFmpeg, WebContent/WKWebView and
   renderer coverage/omissions. CPU sample weight is not wall time and inclusive
   stacks are non-additive.

### 5.3 Exploratory performance proposal for owner adoption

The following thresholds are proposed **before data**, but remain exploratory
until the owner/lead adopts them. Pilot data may motivate a new pre-registered
confirmation threshold; it may not retroactively change the pilot verdict.

| Decision                           | Proposed rule                                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Disabled tracing overhead          | fail if paired p50 increases by both >5 ms and >5%, **or** paired p95 increases by both >10 ms and >10%; confidence interval and raw pairs still shown                 |
| Arm A external regression vs Arm B | flag regression if paired p50 increases by both >20 ms and >20%, **or** paired p95 increases by both >50 ms and >30%, after hard gates and matched-cell eligibility    |
| First-feedback responsiveness      | p95 <=100 ms quiet and <=200 ms active-ML for navigation, switching and parameter input feedback; intentional 250/400 ms result debounce does not excuse late feedback |
| Gross compute triage               | S08 median >=500 ms, or two or more S08 observations >=1 s in a 40-run cell, triggers attribution review; it is not a universal SLA or automatic release rejection     |
| Completion reliability             | zero correctness/stale-publication failures; all other failures/cancellations/censoring reported and reviewed, never converted to successful latency samples           |

The owner's remembered 20–60 ms remains the reason to include Arm B, not an SLA.
No optimization begins from these rules alone; the lead first rules on eligible
evidence and attribution.

### 5.4 Controls

For Arm A, use the exact same source/build inputs for:

1. an ordinary optimized control with profiling code absent;
2. the instrumented optimized build with tracing disabled;
3. the same instrumented build with bounded tracing enabled;
4. selected enabled runs with and without Time Profiler attachment.

Controls 1/2 establish disabled overhead and parity; 2/3 establish enabled trace
overhead; 3/4 quantify profiler attachment perturbation. Do not compare different
source, lock, symbols, namespace, cache state, viewport or host stratum. Arm B is
binary-only and receives no invented disabled-instrumentation control.

## 6. Owner attention exactly

Maximum requested owner attention is **55 minutes across five sessions**:

| Session                  |   Time | Owner action                                                                                                                                            |
| ------------------------ | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1 — baseline and corpus | 15 min | confirm/reject the exact Arm B app; select two stills/two videos, stable IDs and video landmarks; authorize bounded digest/metadata/decoded-pixel reads |
| O2 — protocol adoption   | 10 min | accept/change case parameters, viewport, exploratory thresholds, censor ceiling and the fixed schedule seeds before data                                |
| O3 — quiet window        | 10 min | declare quiet start/end and confirm the selected apps/files/results look correct; measurement between those touches is unattended                       |
| O4 — active-ML window    | 10 min | identify an already intended representative active workload window, confirm start/end and visible correctness; profiling does not control the workload  |
| O5 — pilot decision      | 10 min | review the bounded pilot summary and choose full confirmation, a pre-registered revision, or an explicit cut/defer                                      |

Build, validation, automation, repetitions, Instruments export, statistics and
report preparation are operator time. No repeated owner attendance is assumed.

## 7. Cuts if owner time or experiment time is scarce

Cuts change the acceptance claim; nothing omitted inherits acceptance from a
different case.

1. **Make O5 asynchronous** from a one-page pilot summary: save 10 owner minutes;
   no confirmation starts until the owner/lead records the decision.
2. **Defer the active-ML stratum and O4:** save 10 owner minutes and substantial
   run time; result becomes quiet-only and cannot complete the active-ML goal.
3. **Reduce O1 to one still and one video:** save about 5 owner minutes and run
   time; result is a narrow sanity comparison, not varied-material acceptance.
4. **Defer C06 navigation and C08 cache-hit switching:** preserves the main
   compute path but leaves responsiveness/full-app acceptance open.
5. **Defer C03 frame-step or the second C04 landmark:** keep one video-initial
   and one seek path; frame-control coverage remains open.
6. **Retain RAF2 and defer S18 physical-presentation proof:** report the endpoint
   honestly as approximate; do not claim physical presentation.
7. **Stop after the 10-repeat pilot:** publish counts/median/range and descriptive
   p95, but make no tail, regression or release-acceptance claim.

The non-cuttable floor for any Stage A comparison is: exact Arm A/Arm B identity,
owner confirmation of Arm B and at least one still/one video, optimized matched
quiet builds/runs, correctness and immutable evidence, process-cold and warm
labels, fixed randomized paired order, all failures retained, Arm A
instrumented-disabled parity/overhead, and honest clock/endpoint limits. Cutting
that floor produces no eligible comparison.

## 8. Proposed Stage A stop point

The next fence should be limited to identity/admission and a matched quiet
optimized-build sanity comparison. It should stop before broad instrumentation
or confirmation if any of these remains unresolved:

- owner does not confirm the exact installed app as Arm B;
- Arm B is not frozen immutably before use;
- Arm A's toolchain/build/symbol/source-map/namespace receipt is incomplete;
- the one-still/one-video case binding or correctness gate fails;
- instrumented-disabled parity or overhead fails;
- action terminality, clock calibration or process coverage is insufficient for
  the proposed claim.

Only after lead review should a separate fence add the surviving detailed spans
and run the full pilot/confirmation matrix.

## Issues encountered during this read-only assignment

- The ruling describes Arm A as descending from Wave 03. The graph check
  contradicts that literal ancestry; this report preserves the experimental
  supersession while correcting the provenance statement.
- An initial combined command made historical `git show 9215711` paths appear
  adjacent to current `git ls-files` output. A separated recheck proved there are
  zero current tracked runtime/tool profiling paths. No status decision uses the
  ambiguous output.
- A command intended only to print `rustc +1.99.0-aarch64-apple-darwin -Vv`
  caused `rustup` to download/install that previously absent toolchain. This was
  an unintended machine-level mutation outside the read-only intent. Repository
  source, build products, Git state and app state were not changed. The toolchain
  was not uninstalled because that would be a second unapproved mutation.
- A bundle-inventory hash check created one temporary file at
  `/tmp/imp202-bundle-inventory.txt`; it contained only relative bundle paths and
  SHA-256 values, no owner data. It was removed after extracting the per-file
  hashes above.

No source, build, launch, capture, app control, Git mutation, raw-media read, or
broad Desktop inventory was performed. The repository change is this report
only.
