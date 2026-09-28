# Real-app profiling — Round 01 source and feasibility review

Code Lead → Review Lead, 2026-09-05. This is the one authorized review artifact for AI-IMP-202 Round 01. No build, benchmark, trace, app interaction, workload manipulation, source edit, Git mutation, or IMP-178 integration was performed.

## Executive finding

The smallest defensible next step is **not** a general tracing platform. It is a matched, quiet, optimized-release sanity run of accepted Wave 03 at the exact asset/frame/configuration that produced the owner's reported debug observation. Wave 03 was packaged with Tauri's `--debug` flag. Its displayed milliseconds measure only `run_kmeans`, and it does not contain IMP-178. A symbolized release build can preserve the release optimization profile while adding debug line tables; it should be built and identified before any regression attribution.

Recommended gate order:

1. **A0 — optimized Wave 03 sanity, no tracked source edits:** preserve a symbolized release bundle and run the exact owner-confirmed case under a quiet, declared host condition. Record every repetition, not only a best run. This alone can distinguish a debug-build effect from a gross release-path problem.
2. **A1 — matched end-to-end comparison harness:** only after A0, add private manifests and reproducible collection/summarization scripts. Compare an identified known-good binary with Wave 03 without IMP-178. If the installed historical binary cannot be mapped to source/configuration, keep it as a binary-only end-to-end arm.
3. **B — bounded correlated spans plus Instruments:** only if A0 remains slow, A1 finds an end-to-end regression, or attribution is needed. Add opt-in renderer/native spans, native Time Profiler evidence, and renderer/WebContent profiling. Do not use a CPU flame graph as the end-to-end clock.
4. **C — optional reviewed IMP-178 arm:** construct only after the lead accepts an exact patch snapshot on the accepted base. Do not mix in IMP-179's already adopted fixture repair or EPIC-026/SWEEP-012/IMP-187 changes.

This preserves the owner's observations as observations: 6616 ms / 40 iterations / 180,000 samples while ML work was active; roughly 4000 ms after a quieter relaunch; prior builds recalled at 20–60 ms. These are not matched arms and do not establish a regression ratio or SLA.

## 1. Verified identities and unavailable evidence

### Accepted candidate

- Worktree: `color-tool-kmeans-correctness-wave-01`.
- Branch: `codex/correctness-wave-01-2026-09-05`.
- HEAD: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- `git status --short --branch` reported only the branch header: tracked/untracked state clean.
- Root `Cargo.toml` contains only the workspace declaration; there is no custom Cargo profile. The default Cargo release profile therefore supplies optimized release semantics unless an approved command override changes them.
- Wave 03's preserved build command used `npm run tauri -- build --debug ...`; it is a development-profile package, not a release comparison arm.
- Preserved Wave 03 debug executable: version 1.0.2, bundle identifier `com.color.tool`, SHA-256 `46d9f1d1ee6a65b4343a5839b38a8a872688d33fa2f7edb9e8bfc2b2952be1f9`, Mach-O UUID `94DA71FA-6646-392A-8230-1AF67491E21F` (arm64).
- Its command-line `productName` overlay changed the bundle name only. The identifier remains `com.color.tool`; preference/cache isolation was not established.

### Historical installed app

- `/Applications/Color Tool.app`: version 1.0.1, identifier `com.color.tool`.
- Executable SHA-256: `475a5d0825a37e18f0b1a51b5e96d1e3154497112ebd4498a1de14626c8940c2`.
- Mach-O UUID: `5237E2A8-E620-37F2-B76C-2EEACC883A2C` (arm64).
- Exact source commit, build command, lockfiles, configuration, dSYM, and source maps are currently **unavailable**. It can become a binary-only end-to-end comparator after the owner confirms it is the remembered fast build and permits a controlled run. No internal historical spans may be invented.

### Independent IMP-178 state

- Read-only worktree base: `2cc2000bce04ce2e6bda11a2853dd42595946980`.
- It is uncommitted and absent from Wave 03. Its tracked binary-diff SHA-256 at review time is `6a0c8711850a2677400458c44e422d840037b63a550058411df512948c135b3a`.
- Production-file SHA-256 values at review time:
  - `color-core/src/color.rs`: `e8c099eee967799a2bc627ad76c612199b48420666a8d4d05884538a2e4ff1ee`
  - `color-core/src/image_pipeline.rs`: `8eaad266bf4e6bd395ba9cdf04558dc24b3f9f9ffe4a739974ae219cd8974847`
  - `color-core/src/kmeans.rs`: `6d10c4dc6e77c0e1285feb87178e3bbea64dd799327afe32f19067ec8a3c8025`
  - `color-core/Cargo.toml`: `25afe0c74a04c9c075df5a2a141c386d059816c47f71a6640f9e8b1d45fe551e`
- New benchmark/test evidence is separately identified by `color-core/benches/color_math.rs` SHA-256 `5d647dcc3e9c64b5a536a4b94ec7fda2d6380f5a406200fb51926e9b1c5bff28` and `color-core/src/kmeans_tests.rs` SHA-256 `c71f20c758a7adf8bbd806db319ab9e2bf2c81c2b22fd8f3ae5596c5338ddcca`.
- The fixture-path edit belongs to IMP-179 provenance and must be excluded from an IMP-178 application onto the accepted candidate.
- The report's microbenchmarks show output-matched wins, but they are not GUI evidence: approximately 2.6x for conversion, 1.3x for large-k cold clustering, 1.7–2.0x for warm four-iteration clustering, and 1.2–1.6x for full core analysis depending on case.

### Tool availability, not capture proof

- Rust/Cargo 1.90.0, arm64 Apple host; xctrace 16.0 (17E192).
- Installed xctrace templates include Time Profiler, CPU Profiler, Animation Hitches, File Activity, Logging, and System Trace.
- `xctrace record` locally documents `--attach`, `--launch`, `--all-processes`, `--time-limit`, and `--output`; `xctrace export` documents TOC and XPath XML export.
- `/usr/bin/sample`, `atos`, `dsymutil`, and `dwarfdump` are present.
- Actual Tauri main-process capture, Rayon symbolication, WebContent visibility, FFmpeg child attribution, Animation Hitches compatibility, trace export schema, and JavaScript-profile export are all **untested/unavailable** until an implementation round. Template presence is not acceptance.

## 2. Source timing and concurrency map

### 2.1 Still selection to visible result

1. The comparable start for native picker tests is **selection delivered back to the renderer**, not the initial Add media click; otherwise human dwell in the picker contaminates latency. `chooseMedia()` awaits the dialog and calls `processBatch` (`file-ingestion.svelte.ts:51–57`). A drop case starts at its delivered drop event.
2. Native still ingestion deliberately creates an empty renderer dataset instead of decoding pixels in WebContent (`file-ingestion.svelte.ts:96–106`). It sets the global active path, publishes the file, and schedules analysis (`114–125`). The preview image's asset-URL decoding is separate WebContent work and may overlap native analysis.
3. Home's reactive effect also schedules analysis after file/parameter state changes (`HomeView.svelte:470–493`). The runner's `lastRequestKey` suppresses an identical request (`analysis-runner.svelte.ts:103–127`), so explicit ingestion and the effect can overlap as scheduling attempts but normally collapse to one issued request. A deduped attempt needs a terminal `deduped_noop` observation, not silent disappearance.
4. An intentional 400 ms analysis debounce precedes request issue (`analysis-runner.svelte.ts:24, 124–127`). Pending state begins only when `runAnalysis` starts after that debounce (`134–149`); the 150 ms spinner threshold is measured from request start, not from user input. First-feedback measurement must therefore instrument the input path separately.
5. `analyzeImage` selects the Tauri bridge and constructs a request from the current active path (`compute/bridge.ts:15–21`; `bridges/compute.ts:239–265`). That active-path dependency is mutable global state, while runner/store tokens enforce latest-wins publication. Observational IDs must not replace those production authorities.
6. Native `analyze_image` immediately calls `color_core::analyze` on the path (`commands.rs:13–22`). There is no existing end-to-end native timer.
7. `prepare_samples` times file open/format guess/decode, RGBA conversion, optional Lanczos3 downscale, reservoir sampling, and RGB→OKLab conversion together (`image_pipeline.rs:98–145`). Its `duration_ms` is retained in `SampleResult` but is not included in `AnalyzeResponse`, so the UI never sees it.
8. `analyze` clones the precomputed OKLab vector into a working AoS dataset before the existing k-means timer (`analyze.rs:170–179`). That clone is currently unmeasured.
9. The existing displayed `durationMs` begins immediately before `run_kmeans` and ends immediately after it (`analyze.rs:192–194`). It includes `run_kmeans`'s AoS→SoA conversion (`kmeans.rs:131–134`), k-means++ initialization when not warm (`140–146`), all Lloyd iterations and Rayon assignment/reduction work (`151–189`, `214–265`), the final full assignment (`191–196`), and centroid SoA→Vec materialization (`198–203`). It excludes every stage before and after that call.
10. Postprocessing builds nonempty clusters, optionally runs snap-to-real nearest-sample search, optionally merges, converts centroids to sRGB/OKLCH/HSV, sorts, and applies ignore-top-N (`analyze.rs:196–269`). Snap-to-real is an O(cluster count × sample count) serial search (`118–134`) and is excluded from displayed time; it is a plausible independent cost but does not explain a displayed 4-second `run_kmeans` by itself.
11. Serde/Tauri response serialization and IPC delivery happen after the command returns and have no explicit timing seam. The renderer validates the full response with Zod and maps every cluster into a new object (`bridges/compute.ts:275–292`).
12. The runner accepts only the current local token, publishes through a store-owned token, and discards stale completions (`analysis-runner.svelte.ts:152–184`; `stores/analysis.ts:61–105`). Native work is not cancelled merely because a renderer token becomes stale; stale CPU work may overlap the winning action.
13. After store publication, Home synchronously derives up to three SVG strings—polar, hue×lightness, and histogram—based on visibility controls (`HomeView.svelte:238–272`). Svelte then updates `AnalysisCards`, whose SVGs are inserted with `{@html}` (`AnalysisCards.svelte:72–102, 145–168`). No existing mark distinguishes store publication, chart generation, DOM commit, Core Animation commit, or actual display presentation.

The path is therefore not strictly serial: preview decode, stale native analyses, background work, and renderer reactions can overlap. Stage durations must be computed within their own spans and shown on a timeline; they must not be summed to manufacture end-to-end wall time.

### 2.2 Video load, step, and seek

1. Initial native video load may restore a session cache or start an asynchronous probe (`video-controller.svelte.ts:478–559`). HTML video metadata/load proceeds independently in WebContent.
2. After a successful probe, strip generation and initial frame decode can be scheduled concurrently (`442–466`). Metadata handling can also schedule them (`640–658`), guarded by current state. The filmstrip is not a prerequisite for a correct analyzed frame and should be a separate auxiliary action/span.
3. A frame step or seek updates visible control/video state immediately, then calls `scheduleVideoFrameDecode` (`605–617`, `701–716`, `728–732`). This is a genuine first-feedback path.
4. Frame extraction has its own intentional 250 ms debounce and a per-frame-ID promise queue (`383–440`). Queue wait must be a separate span. New tokens can make queued/executing work stale.
5. Native extraction resolves the app cache path, spawns the FFmpeg sidecar, seeks, decodes, Lanczos-scales, PNG-encodes/writes, waits for exit, and prunes sibling frame PNGs (`commands.rs:127–159`; `ffmpeg.rs:213–300`). A main-process Time Profiler can show the wait but will not, by itself, attribute FFmpeg child CPU.
6. On a current completion, the renderer switches active path to the PNG, publishes the exact settled frame entry, and schedules color analysis (`video-controller.svelte.ts:315–369`). That analysis then incurs the independent 400 ms debounce and the still pipeline above.
7. Cache restoration can reuse an existing correct analysis and seed the dedup key instead of issuing analysis (`345–357`, `496–533`). This must be a distinct `session_cache_hit` condition, not pooled with fresh analysis.
8. Correct video-result presentation means both the settled-frame overlay and charts correspond to the requested source path, frame timestamp, and resolved parameters. `frameDecoding=false` is currently set when extraction ends, before color analysis/presentation finishes (`378–380`), so it is not the correct-result endpoint.

### 2.3 Existing coarse evidence

- `App.svelte:289–309` runs a continuous RAF heartbeat and logs only stalls over 1000 ms plus a five-second heartbeat. It can reveal catastrophic renderer blockage but cannot bind a stall to an action or prove a result painted.
- `devlog.ts` timestamps text relative to a renderer-local `performance.now()` origin and generates a short random `cid`. Its IPC log sink writes wall-clock-stamped lines. It has no schema, terminal guarantee, bounded drop accounting, native monotonic correlation, or durable action/result provenance. It should not be stretched into the new trace contract.
- Existing event logs are useful context but write synchronously to an app-cache file at each native append (`cache.rs:19–36`), so they are not a zero-cost profiler.

## 3. Metric endpoints

Each action records multiple endpoints; no single “interactive time” obscures the difference.

### First feedback / responsiveness

- `input_start`: entry to the delivered renderer event/action handler. For picker cases this is the returned selection, not the Add media click. For parameter/step/seek cases it is the input/click/pointer-end handler.
- `feedback_state`: production state has changed in a way the user should see (pending/decoding class, control position, or selected preview), with a Svelte `tick()` completed.
- `feedback_raf2`: the second `requestAnimationFrame` callback after `feedback_state`. This demonstrates that WebContent reached a subsequent rendering opportunity. It is explicitly a **next-frame approximation**, not proof that pixels appeared on the physical display.
- `max_renderer_frame_gap` and `long_task_count` during the action describe continued responsiveness. The existing >1000 ms heartbeat is too coarse; a profiling-only RAF sampler can record bounded gaps without emitting per-frame trace events.

### Correct-result presentation

- `native_response_received`: IPC promise settled in the renderer.
- `result_store_published`: the store token accepted the result for the expected image/frame.
- `charts_generated`: all enabled chart derivations for that accepted result completed.
- `result_dom_committed`: Svelte `tick()` completed after the accepted result and enabled chart strings were consumed by the mounted view.
- `result_raf2`: second RAF after that DOM commit; this is the primary portable “correct result ready for a paint opportunity” endpoint.
- `result_presented_display`: optional Instruments Animation Hitches/Frame Lifetimes evidence correlated to the action. Only populate when the installed tool actually exposes a defensible event-to-display record for this WKWebView; otherwise record `unavailable`, never alias `result_raf2` to it.

A `presented_correct` terminal requires latest-wins token acceptance plus matching case digest/source identity, video frame timestamp, full resolved parameters, and a result fingerprint. Fast stale publication is a correctness failure. Superseded work terminates as `stale_discarded` or `cancelled`; errors and timeouts remain in the distribution/accounting.

## 4. Trace identity, clocks, and terminal semantics

### Identity

- `experimentId`: one immutable comparison protocol and threshold set.
- `runId`: one app process/capture session.
- `actionId`: one delivered user intent, including intents later deduped or superseded.
- `spanId` / `parentSpanId`: observational causality. A background strip span can be linked to video-load action while overlapping the frame-analysis branch.
- `productionAuthority`: observation-only snapshot of existing selection epoch/store token/content revision where available. IDs never become cache keys, cancellation authority, or proof of content equality.

An action starts at delivery and has exactly one terminal record: `presented_correct`, `deduped_noop`, `stale_discarded`, `cancelled`, `error`, or `timeout_censored`. A timeout stores the censor boundary and last observed stage; it is not reported as a completed duration. The collector emits a final `drop_summary` with attempted/written/dropped counts. Confirmatory data with missing terminal records or dropped required events fails trace validity.

### Clock domains

- Renderer spans use `performance.now()` in one WebContent process/session.
- Native spans use one process-lifetime monotonic epoch based on Rust `Instant`.
- FFmpeg duration is measured by the native parent around spawn/wait unless child-native evidence is separately captured.
- Instruments owns another recording timebase; wall timestamps are only labels and can jump.

Durations are subtracted only within one clock domain. At run start and end, perform 9 no-op IPC calibration exchanges. Each stores renderer send/receive times and native receive/send monotonic values. Choose/report the minimum-RTT sample, estimate midpoint offset, retain half-RTT plus native handling as alignment uncertainty, and check drift between start/end calibrations. Cross-domain event order is “indeterminate” when uncertainty intervals overlap. Never subtract raw Rust `Instant` from JS `performance.now`, and never sum parallel child spans as elapsed wall time.

For Instruments, prefer a bounded recording launched with the app and correlate by run/action marker plus capture start metadata. A future signpost bridge is an alternative only if ordinary spans cannot align traces; it adds platform-specific implementation/dependency risk and is not in the first instrumentation slice.

## 5. Private manifest and trace schemas

Repo code should contain versioned JSON Schemas and redacted examples only. Exact paths, hashes, raw traces, screenshots, source maps, and run data live beneath an owner-chosen local artifact root outside Git. The checked-in case template uses `pathKey`; a private local mapping resolves it to a path.

### Build manifest sketch

```json
{
  "schemaVersion": 1,
  "armId": "wave03-no178-release-symbols-v1",
  "source": {
    "commit": "8bf3187d...",
    "clean": true,
    "trackedDiffSha256": null,
    "untrackedFiles": []
  },
  "binary": {
    "sha256": "...",
    "machOUuid": "...",
    "bundleIdentifier": "com.color.tool.profile.wave03",
    "version": "1.0.2"
  },
  "symbols": { "dSYMHash": "...", "machOUuid": "..." },
  "frontend": { "distManifestHash": "...", "sourceMapHashes": [] },
  "locks": { "cargoLockSha256": "...", "packageLockSha256": "..." },
  "toolchain": {
    "rustc": "...", "cargo": "...", "node": "...", "npm": "...",
    "tauriCli": "...", "xcode": "...", "xctrace": "..."
  },
  "sidecars": {
    "ffmpeg": { "sha256": "...", "version": "..." },
    "ffprobe": { "sha256": "...", "version": "..." }
  },
  "build": { "profile": "release", "features": ["simd"], "command": [], "env": {} }
}
```

### Private case manifest sketch

```json
{
  "schemaVersion": 1,
  "caseId": "standard-video-a-frame-001-q2-k45",
  "pathKey": "standard-video-a",
  "asset": {
    "sha256": "...", "bytes": 0, "mime": "video/mp4",
    "width": 0, "height": 0, "codec": "h264",
    "durationSeconds": 0, "fps": "24000/1001", "frameSeconds": 0
  },
  "analysis": {
    "k": 45, "quality": 2, "stride": 4, "maxSamples": 180000,
    "maxDimension": 2200, "minLum": 0, "ignoreTopN": 0,
    "mergeThreshold": 0, "snapToReal": true,
    "tolerance": 0.001, "maxIterations": 40, "seed": 1,
    "simd": true, "warmStart": false, "miniBatch": false
  },
  "render": {
    "histogram": true, "polar": true, "hueLightness": true,
    "histogramSort": "frequency", "polarMode": "okhsv",
    "hueLightnessSizeMode": "chroma", "symbolScale": 1,
    "axisLabels": true, "clusterOutline": false
  },
  "viewport": {
    "cssWidth": 1360, "cssHeight": 860, "deviceScaleFactor": 0,
    "displayRefreshHz": 0, "appZoom": 1
  },
  "sourceCondition": "fresh_import",
  "cacheCondition": "process_warm_app_cache_declared_os_cache_ambient"
}
```

The runner records OS/build/machine architecture, power source, thermal-state note if available without settings changes, display identity/refresh, quiet or owner-declared active-ML workload, and free-form confound notes. It must not record unrelated process arguments.

### Event JSONL sketch

```json
{
  "schemaVersion": 1,
  "eventType": "span",
  "experimentId": "...", "runId": "...", "actionId": "...",
  "spanId": "...", "parentSpanId": "...",
  "domain": "renderer|native|ffmpeg-parent|instruments",
  "clockId": "renderer-1|native-1",
  "name": "kmeans.iteration_block",
  "startNs": 0, "durationNs": 0,
  "status": "ok",
  "attributes": { "caseId": "...", "iterations": 40, "sampleCount": 180000 }
}
```

Allowed attributes are enumerated and bounded. No file path, image pixels, centroid-per-event data, per-pixel events, or unbounded error text. A separate terminal event carries expected/actual source/frame/parameter fingerprints and final result fingerprint.

### Owner inputs needed before A0

- Which exact stable case produced the ~4000 ms quiet observation: private path mapping, asset SHA-256, and—if video—the requested frame timestamp.
- Full visible settings, especially K, quality, snap-to-real, merge, ignore-top-N, enabled charts, polar mode, and app zoom/viewport.
- Confirmation that `/Applications/Color Tool.app` 1.0.1 is the remembered fast build, or another immutable app path/hash.
- A quiet measurement window and, later, an owner-declared active-ML window. Profiling never starts/stops training itself.

These do not block this source/design review. The earlier EPIC-025 records identify two real-video case labels, but their current local paths/content and the owner's present standard-case intent must be confirmed privately rather than inferred or scanned.

## 6. Build and capture command proposals

These commands are proposals for a separately authorized round. They were not run.

### A0 symbolized release build

Use a dedicated artifact/target directory and a unique bundle identifier, not only `productName`. The only Cargo overrides add line information and explicitly preserve symbols; `--debug` is omitted, so release `opt-level`, assertions, overflow checks, and other optimization semantics remain those of the release profile.

```sh
export CARGO_NET_OFFLINE=true
export CARGO_TARGET_DIR="/owner/local/profile-artifacts/wave03-no178/cargo-target"
export CARGO_PROFILE_RELEASE_DEBUG=line-tables-only
export CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO=off
export CARGO_PROFILE_RELEASE_STRIP=none

npm run tauri -- build \
  --bundles app --no-sign --ci \
  --config '{"productName":"Color Tool Profile Wave 03","identifier":"com.color.tool.profile.wave03"}' \
  -- --locked
```

Cargo documents `CARGO_PROFILE_<name>_DEBUG`, `SPLIT_DEBUGINFO`, and `STRIP` as profile overrides, and that release defaults to optimized code with debug info off. Tauri's installed CLI help confirms that plain `build` is release and `--debug` changes that mode. The implementation round must capture verbose Cargo output/config and verify rather than assume final flags.

After bundling, run `dsymutil` explicitly against the bundle executable, then require executable/dSYM UUID equality:

```sh
dsymutil "/owner/local/.../Color Tool Profile Wave 03.app/Contents/MacOS/tauri-app" \
  -o "/owner/local/.../symbols/tauri-app.dSYM"
dwarfdump --uuid "/owner/local/.../Color Tool Profile Wave 03.app/Contents/MacOS/tauri-app"
dwarfdump --uuid "/owner/local/.../symbols/tauri-app.dSYM"
shasum -a 256 "/owner/local/.../Color Tool Profile Wave 03.app/Contents/MacOS/tauri-app"
```

Do not delete the Cargo target/object files until `dsymutil` and a sample address symbolication check succeed. Hash the app executable, dSYM contents, locks, sidecars, and renderer asset inventory. A dSYM existing without UUID equality is a failed build manifest.

For Stage B renderer profiling, add an environment-gated Vite `build.sourcemap: 'hidden'`. Vite documents that this emits separate production maps while suppressing map comments. Preserve minification/target settings and hash-map-to-bundled-JS pairs. Because the local profiling app may contain the `.map` assets, it must never be mistaken for a shipping bundle.

### Native capture

Default to the named app process, not all processes:

```sh
xcrun xctrace record \
  --template 'Time Profiler' \
  --time-limit 45s \
  --output '/owner/local/.../traces/run-id-native.trace' \
  --launch -- '/owner/local/.../Color Tool Profile Wave 03.app/Contents/MacOS/tauri-app'

xcrun xctrace export \
  --input '/owner/local/.../traces/run-id-native.trace' \
  --toc \
  --output '/owner/local/.../traces/run-id-native-toc.xml'
```

Inspect the TOC before selecting an XPath; xctrace table schemas are template/version dependent. Preserve the original `.trace` and exported XML. The primary native artifact is the symbolized Instruments call tree/flame-graph view plus the custom stage timeline. Use `sample` only as a secondary symbolication/call-tree check.

`--all-processes` could reveal WebContent/FFmpeg/render-server activity, but it also captures unrelated work, increases overhead, and widens private data scope. It is **not the default**. Consider one short owner-approved diagnostic only if process-targeted captures cannot answer a concrete question; analyze and retain only within the local artifact policy.

### Renderer and display capture

- Time Profiler attached to the Tauri executable is expected to cover native/Rayon threads, but not provide semantic JavaScript/chart stacks.
- WebKit WebContent is a separate process boundary in practice; exact visibility from this xctrace version is unverified. Use the app's Web Inspector Timelines/JavaScript profiler for semantic JS/layout/paint attribution if the release-profile app can be attached without changing system settings. Preserve matching Vite source maps.
- Apple documents Animation Hitches as exposing user events, commits, renders, GPU work, frame lifetimes, and displayed frames. Its actual usefulness/availability for this WKWebView desktop app must be tested. If the trace cannot bind the custom action to a display lifetime, keep actual presentation unavailable and use the labeled RAF approximation.
- FFmpeg is a sidecar process. The default trace records native parent spawn/wait and exact command duration; it does not claim FFmpeg CPU stacks. A child/all-process capture is optional diagnostic work, not needed to know frame extraction wall time.

## 7. Experiment design and execution budget

### A0 gross-sanity pilot

- One owner-confirmed case/config, accepted Wave 03 without IMP-178, unique profiling identifier.
- Quiet host only; record power/thermal/workload notes without changing settings.
- Two untimed warmups, then 7 measured actions in a warm process. Also run 3 fresh-process actions if practical.
- “Fresh process” means app process and in-memory caches are fresh; OS filesystem cache remains ambient. Never call this cold disk and never purge OS caches.
- Record displayed k-means milliseconds, input→feedback RAF2, input→correct-result RAF2 if a no-code external observation is available, result fingerprint, failures, and each raw value. A0 may report median/range only; 7–10 observations do not justify a stable p95 claim.
- Estimated owner time: 20–45 minutes after build/manifest preparation.

This pilot answers the immediate question. A quiet optimized-release median below 500 ms with no ≥1 s kernel observation would reject the specific “still ~4 seconds in release” hypothesis, but it would not prove the whole app meets a 20–60 ms SLA. A median ≥500 ms or any repeated ≥1 s kernel result is a **gross-slow-path trigger**, not a product threshold: proceed directly to Stage B attribution before changing math.

### A1 comparison pilot

- Arms: identified known-good release; Wave 03 no-178. Optional accepted-178 arm is excluded until review.
- Cases, kept separate rather than pooled:
  1. still fresh import at owner-standard q/K/snap/render controls;
  2. same still analysis-parameter change in a warm process;
  3. video initial settled frame + correct charts (strip completion reported separately);
  4. video one-frame step and representative seek.
- First run a 10-repetition/cell pilot in alternating AB/BA order with a stored random seed. Use it to estimate variance and finalize confirmatory thresholds without reusing pilot data for threshold confirmation.
- Confirm only decision-relevant cells with 40 repetitions per arm/condition if p95 is required. Report nearest-rank p50/p95, bootstrap confidence intervals, raw `n`, failures/cancellations/censoring, and paired deltas/ratios. Forty observations still give a coarse tail; state uncertainty.
- Do not discard outliers. Report robust median/MAD as diagnostics and show all stalls. Hardware/OS interruptions become annotated observations, not silent exclusions; a predeclared technical-invalid rule may exclude only a broken case/run identity, never slowness.
- Active-ML is a separate, owner-coordinated block. Counterbalance arm order within the stable workload window; do not start, stop, inspect, or retune training. Never pool quiet and active-ML data.

Pilot budget: 4 cases × 2 arms × 10 = 80 actions per workload/cache stratum. At an operator average of 30–60 seconds/action including reset and notes, 40–80 minutes per stratum. Confirmatory 40-repeat work is 160–320 minutes per stratum, so restrict it to cells that affect a decision. The full Cartesian matrix is intentionally not mandatory.

### Cache labels

- `process_fresh_app_cache_existing_os_cache_ambient`
- `process_warm_app_cache_warm_os_cache_ambient`
- `session_cache_hit`
- `fresh_frame_artifact` versus `existing_frame_artifact`
- `renderer_preview_cold_in_process` versus `renderer_preview_warm_in_process`

No label implies a purged disk cache. App-cache clearing/deletion is outside current authority and unnecessary; use unique bundle identifiers and declared within-arm warmup semantics. The historical installed app remains a distinct shared-identifier arm and requires explicit state-handling approval.

## 8. Provisional gates for lead approval

These are proposals, not adopted project acceptance.

1. **Correctness hard gate:** exact accepted output/result fingerprint for the same asset/frame/parameters, zero stale visible publications, and correct visible provenance. Faster wrong output fails.
2. **Trace integrity hard gate:** every admitted action has exactly one terminal; required IDs are unique; parent references resolve or explicitly name an external root; dropped required events = 0; timeout/failure counts are reported.
3. **Clock gate:** retain all calibration samples. If alignment uncertainty exceeds `max(5 ms, 5% of the boundary being compared)`, do not make cross-domain ordering/idle-gap claims at that resolution.
4. **Instrumentation overhead:** in randomized on/off pairs on the same binary/arm, profiling spans alone add no more than both 5% and 5 ms to p50 correct-result RAF2, and no more than both 10% and 10 ms to p95. Instruments-on overhead is reported separately and is not used for product-latency comparison.
5. **Disabled overhead:** profiling-disabled build has no trace files/events and differs from the matched release only by reviewed dormant code; paired p50 must stay within the same 5%/5 ms bound. If not, redesign the seam.
6. **Relative candidate regression trigger:** after a separate pilot fixes thresholds, flag confirmatory Wave 03 no-178 if paired p50 exceeds known-good by both 20% and 20 ms, or p95 by both 30% and 50 ms, in the same case/condition. These margins are provisional and must be checked against pilot variance before confirmation.
7. **First feedback:** provisional quiet p95 `feedback_raf2` ≤100 ms, active-ML descriptive target ≤200 ms. This endpoint excludes intentional analysis/decode debounce because visible pending/control feedback should precede it.
8. **Gross A0 trigger:** quiet symbolized-release k-means median ≥500 ms or repeated individual ≥1 s for the owner-confirmed 180k/default-style case requires attribution before optimization. This is only a triage boundary against the reported 4 s, not a universal SLA.

The recalled 20–60 ms remains a hypothesis to test on an identified old binary and matched case. It must not be promoted into acceptance by memory alone.

## 9. Prior tooling inventory and deduplication

| Existing evidence | What it answers | What it does not answer |
| --- | --- | --- |
| `kmeans_baseline` | release cold synthetic kernel timing | real file decode, IPC, renderer, charts, presentation |
| IMP-159 `kmeans_framesim` | cold/warm frame-sequence iteration and kernel costs | shipping still/video path and UI |
| IMP-160 `live_pipe_probe` | persistent rawvideo delivery and LUT conversion | current per-frame FFmpeg+PNG route and UI |
| IMP-161 `live_loop_probe` | real-clip prototype loop, stage timing, budgeted quality | shipping Wave 03 interaction; it implements ADR-003's proposed live architecture |
| EPIC-025 / ADR-003 | feasibility evidence for EPIC-026 live playback | current cold still analysis regression |
| IMP-178 `color_math` bench | deterministic before/after core stages and full `analyze()` | Tauri IPC, WebContent, charts, correct display, accepted-base integration |
| old observable/runner reports | historical JS/Rust and fidelity context | current source/build/asset identity |

Reuse their case labels, seeds, fingerprints, and stage vocabulary where semantics match. Do not edit the four existing spike binaries, make GUI acceptance depend on a microbenchmark, or duplicate IMP-178's core benchmark in the real-app runner.

## 10. Proposed architecture and alternatives

### Recommended: local JSONL spans + process-specific profilers

- A tiny profiling module in `color-core` defines a Tauri-free, optional observer and aggregate stage names. Existing public functions call the no-op path; an observed variant is invoked only by the profiling-enabled native command.
- Native Tauri owns opt-in activation from a launch-time local artifact directory, a bounded JSONL writer, calibration endpoint, and command-level spans. Renderer action context is an optional command argument adjacent to—not inside—the numeric request/response contract.
- Renderer owns action/span IDs, delivered-input start, chart/DOM/RAF endpoints, and a bounded in-memory buffer flushed once at terminal. It does not synchronously IPC-log every mark.
- Instruments Time Profiler provides native/Rayon CPU call trees. Web Inspector provides JavaScript/layout attribution. Custom spans provide the shared causal timeline and waiting/overlap information.

Tradeoff: this is more code than signposts alone, but it is cross-process explicit, schema-testable, locally exportable, and can represent stale/error/timeout outcomes. The observer adds a few coarse branch/callback sites; paired controls quantify it.

### Alternative A: Instruments/signposts only

Pros: excellent native timeline integration and low overhead. Cons: platform-specific implementation, uncertain current Rust/Tauri bridge/dependency, poor portable schema/terminal validation, and still needs renderer instrumentation. Defer unless correlation proves inadequate.

### Alternative B: renderer User Timing + existing text logs only

Pros: very small. Cons: no robust native stage decomposition, weak dropped/terminal semantics, synchronous file-log interference, and no defensible clock mapping. Insufficient for the requested attribution system.

### Alternative C: all-process Time Profiler flame graph only

Rejected as primary evidence. CPU samples cannot measure intentional debounce/queue/IPC idle time, correct-result provenance, DOM state, or display. All-process capture also widens privacy and overhead.

## 11. Exact future file fences in dependency order

No file below is authorized by this review. Each stage needs a numbered lead verdict.

### Stage A0 — no tracked source files

- Generated build outputs only in the accepted candidate's authorized target/dist locations and an owner-local artifact root.
- New report/manifest data only in the private artifact root.
- Do not edit Cargo/Vite/Tauri configuration to perform A0; use the reviewed CLI/environment overlays.

### Stage A1 — durable non-instrumented harness

New files only:

- `tauri-app/scripts/profiling/README.md`
- `tauri-app/scripts/profiling/build-manifest.mjs`
- `tauri-app/scripts/profiling/validate-manifest.mjs`
- `tauri-app/scripts/profiling/summarize-runs.mjs`
- `tauri-app/scripts/profiling/schema/build-manifest.schema.json`
- `tauri-app/scripts/profiling/schema/case-manifest.schema.json`
- `tauri-app/scripts/profiling/schema/run-record.schema.json`
- `tauri-app/scripts/profiling/profiling-tools.spec.ts`

No dependencies or lockfiles. Node standard library only. Scripts reject paths under the repo for raw/private artifacts by default and never scan Desktop.

### Stage B1 — coarse action/native/core attribution

- `color-core/src/lib.rs`
- `color-core/src/observation.rs` (new; no Tauri types)
- `color-core/src/analyze.rs`
- `color-core/src/image_pipeline.rs`
- `color-core/src/kmeans.rs`
- `color-core/tests/observation_contract.rs` (new)
- `tauri-app/src-tauri/src/main.rs`
- `tauri-app/src-tauri/src/commands.rs`
- `tauri-app/src-tauri/src/commands_types.rs`
- `tauri-app/src-tauri/src/profiling.rs` (new)
- `tauri-app/src-tauri/src/profiling_tests.rs` (new, or a `#[cfg(test)]` module if the lead rejects another source file)
- `tauri-app/src/lib/profiling/trace.ts` (new)
- `tauri-app/src/lib/profiling/trace.spec.ts` (new)
- `tauri-app/src/lib/bridges/profiling.ts` (new)
- `tauri-app/src/lib/bridges/compute.ts`
- `tauri-app/src/lib/compute/bridge.ts`
- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`
- `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` (new; use established rune shims)

B1 stages: action/debounce/request issue; IPC native receive/return; prepare aggregate; dataset clone; k-means SoA/init/iteration-block/final assignment/materialize; postprocess aggregate; response receive/parse; store acceptance; terminal/error/stale. No per-iteration, per-centroid, or per-pixel events.

### Stage B2 — video, chart, DOM, and presentation approximation

- `tauri-app/src-tauri/src/commands.rs`
- `tauri-app/src-tauri/src/ffmpeg.rs`
- `tauri-app/src/lib/bridges/video.ts`
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/home/ParameterControls.svelte`
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/home/AnalysisCards.svelte`
- `tauri-app/src/App.svelte`
- `tauri-app/vite.config.ts` (environment-gated hidden source maps only)
- Extend the B1 profiling specs; add no second trace implementation.

B2 stages: delivered input/feedback; video decode debounce/queue/FFmpeg wait/prune; background probe/strip overlap; individual enabled chart generation; store→DOM tick→RAF2; bounded frame-gap summary. Do not alter chart algorithms or production selection/caching semantics.

### Stage C — analysis/report only

- `tauri-app/scripts/profiling/summarize-runs.mjs`
- `tauri-app/scripts/profiling/profiling-tools.spec.ts`
- New lead-owned RAG result/verdict files only as separately assigned.

IMP-178 adoption remains its own reviewed patch application and is not part of these fences.

## 12. Test plan

- **Schema:** valid manifests/events accepted; unknown version/field/type rejected; private path absent from redacted output; hashes/UUID formats checked; missing source/symbol/history represented as `unavailable`.
- **Identity:** unique action/span IDs; parent cycle/orphan detection; exactly one action terminal; duplicate terminal rejected; stale/cancel/error/timeout retained.
- **Clock:** calibration midpoint/uncertainty math fixtures; high RTT and drift produce indeterminate ordering; cross-clock raw subtraction impossible in the API.
- **Overlap:** synthetic parallel spans do not sum into wall time; exclusive/critical-path reporting stays distinct from CPU sampled weight.
- **Statistics:** fixed fixtures verify nearest-rank p50/p95, stratification, no small-n p95 claim, censored/failure counts, bootstrap seed reproducibility, and zero silent outlier deletion.
- **Core parity:** profiling off/on returns byte-equivalent serialized response excluding timing/observation artifacts; scalar/SIMD/golden tests unchanged; observer receives bounded aggregate stages and exactly one terminal on success/error.
- **Renderer correctness:** latest action only reaches `presented_correct`; stale native completion records `stale_discarded`; enabled chart set is complete before DOM/RAF terminal; unmounted/hidden view yields explicit unavailable/cancelled terminal; rune tests use the existing shim pattern.
- **Video:** 250 ms decode debounce and 400 ms analysis debounce remain intentional and separately measured; queue wait and FFmpeg execution split; session-cache hit never masquerades as fresh analysis; source/frame provenance holds under rapid A→B/seek actions.
- **Overhead:** release on/off randomized pairs; trace disabled emits nothing; bounded buffer/drop summary; writer failure does not change production result or block the UI.
- **Build/symbols:** executable/dSYM UUID equality, executable/source-map/lock/sidecar hashes, a known native address resolves to expected source, and a known JS stack resolves through the matching map before accepting captures.

Normal repository gates remain mandatory after any implementation. No dependency or lock change is currently justified.

## 13. Risks, unknowns, and review deviations

- The owner-observed case is not yet pinned to an exact private asset/frame/settings record. The screenshot establishes 40 iterations and 180,000 samples, not every parameter.
- Installed 1.0.1 may or may not be the remembered fast build; its source/symbol identity is unavailable.
- Unique compile-time bundle identifiers isolate new profiling-arm preferences/cache, but the immutable historical app retains `com.color.tool`; cross-arm cache semantics require an explicit protocol and owner authority.
- Release line tables/dSYM generation are supported in principle by Cargo/rustc/dsymutil, but the exact Tauri artifact and symbolication path remains untested.
- Time Profiler template presence does not establish WebContent, FFmpeg child, or renderer-server coverage. Renderer/display evidence needs separate validation.
- Safari/Web Inspector export and source-map behavior for this packaged Tauri release is untested.
- RAF2 is not physical presentation. Animation Hitches may still be unavailable or uncorrelatable for this app.
- Existing synchronous event logging and background cache/log heartbeats are potential noise; do not disable production behavior silently. Record it or propose a separately reviewed control.
- Rapid stale native jobs continue consuming CPU. Traces must show overlap without altering cancellation ownership under profiling authority.
- The previous EPIC-025 log already warns that concurrent agent work inflated timings. The quiet-host gate must exclude our own builds/tests during measurement.
- **Review deviation:** before the lead's Round 01 brief was received/read, this Code Lead performed a broad read-only Desktop inventory in response to the owner's statement that Desktop held the standard varied set. That conflicts with the later explicit “no broad Desktop scan” boundary. No content was opened, copied, committed, or placed in this report; only file metadata/type/hash probes were made. No further scan occurred. Future work uses only owner-supplied private mappings.

## 14. Decisions requested from Review Lead

1. Approve A0 as the next minimal slice: one symbolized, uniquely identified optimized Wave 03 build and one exact quiet owner case, with no tracked source edits.
2. Approve or revise the proposed symbol flags and unique profiling bundle identifier. Require executable/dSYM UUID equality before capture.
3. Choose whether A1 scripts should precede A0 or follow only after A0 confirms profiling remains worthwhile. Recommendation: A0 first, then codify.
4. Approve the two endpoint families and the explicit RAF2-versus-display distinction.
5. Approve private path mapping outside Git and the proposed manifest/JSONL schema direction.
6. Approve or revise A0 gross-slow trigger, overhead budgets, first-feedback target, and provisional relative regression margins before confirmatory runs.
7. Decide whether Stage B should stop after B1 if native/core attribution answers the regression, rather than automatically touching video/charts/presentation.
8. Keep all-process capture opt-in and owner-approved only; default to targeted native plus separate renderer evidence.
9. Keep IMP-178 review/application separate until the no-178 release arm is measured and the exact patch is accepted.

## Sources checked for tool claims

- Local `tauri build --help`, `cargo build --help`, `rustc -C help`, `xctrace help record`, `xctrace help export`, `xctrace list templates`, `dsymutil(1)`, `dwarfdump --help`, and `atos -h` on this host.
- Cargo profiles and environment overrides: <https://doc.rust-lang.org/cargo/reference/profiles.html> and <https://doc.rust-lang.org/cargo/reference/config.html>.
- Vite production source maps: <https://vite.dev/config/build-options#build-sourcemap>.
- Apple render-loop/presentation semantics and Animation Hitches: <https://developer.apple.com/videos/play/tech-talks/10855/>, <https://developer.apple.com/videos/play/tech-talks/10857/>, and <https://developer.apple.com/documentation/xcode/improving-app-responsiveness>.

## Round outcome

Review/design complete; implementation not started. Await numbered Review Lead verdict and a bounded assignment.
