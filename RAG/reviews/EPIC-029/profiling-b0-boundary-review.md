# B0 boundary review — minimum Colors input-to-RAF2 trace

Code Lead → Review Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.25.  
Read-only source/delta review; no implementation, app control, capture, build, test run, Git mutation or owner question.

## Disposition

**Feasible as a narrow vertical slice before color-core stage instrumentation.** The first implementation should observe one real, analysis-affecting Colors parameter input (use the Number of clusters numeric control for the first proof), the existing 400 ms debounce/dedup and token-owned request, a native `analyze_image` aggregate, actual store acceptance, all enabled figure generation, a checked DOM settle, and a second-animation-frame approximation.

This slice must not call its terminal `presented_correct` or even `ready_correct`. The honest successful label is **`associated_result_dom_raf2_approx`**: it means the observed fresh response was accepted for the intended source/settings, the enabled SVG roots were found after Svelte settled, and two visible-document RAF callbacks ran. It does not prove scan-out, compositor presentation, decoded-frame identity, or numerical correctness against an oracle. When source/settings/result association cannot be proved, the attempt terminates `unverified/result-association-unverified`; it must not inherit a successful latency merely because a setter was called.

The slice is observation-only. Correlation IDs never select a source, own a request, seed a cache, suppress work, or authorize publication. Existing request/store tokens remain the only execution/publication authority.

## Source-confirmed current boundary

All citations below are relative to the candidate root at `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.

1. `ParameterControls.svelte` currently binds the analysis-affecting values directly into the params store. The clusters range and numeric controls are at `tauri-app/src/lib/views/home/ParameterControls.svelte:28-48`; quality, ignore-top-N and merge-threshold ranges are at `:50-96`. There is no delivered-input observation callback. For the first deterministic real-input proof, ArrowUp/ArrowDown on the focused clusters numeric control is preferable to a drag: it produces one contextual native UI action while avoiding a stream of scrub events.
2. `HomeView.svelte` snapshots params through its subscription (`tauri-app/src/lib/views/HomeView.svelte:346-348`) and schedules from the reactive effect unless there is no file, a scrub is active, or status is error (`:474-493`). Scrub completion also schedules explicitly (`:281-293`). Ingestion can schedule once directly (`tauri-app/src/lib/views/home/file-ingestion.svelte.ts:114-125`) and the Home effect can observe the same state; the request-key check, not an observation ID, must continue to deduplicate that overlap.
3. `scheduleAnalysisWith` builds the semantic request key from image ID and analysis parameters, returns immediately on an unchanged key, replaces the existing debounce timer otherwise, and fires after 400 ms (`tauri-app/src/lib/views/home/analysis-runner.svelte.ts:98-128`). A delivered UI input is therefore not proof of request admission. Admission is the debounce callback entering `runAnalysis`, immediately before the authoritative store pending token is obtained (`:130-140`).
4. The runner's local token rejects an older completion before publication (`tauri-app/src/lib/views/home/analysis-runner.svelte.ts:151-163`), while the store separately rejects a non-current store token (`tauri-app/src/lib/stores/analysis.ts:79-95`). Cancellation increments the runner token, conditionally resets its owned pending store token, and clears debounce/spinner state (`analysis-runner.svelte.ts:57-73`). Home unmount calls that cancellation (`HomeView.svelte:466-468`), and navigation actually destroys Home because App renders exactly one current view (`tauri-app/src/App.svelte:385-396`).
5. There is a material observation gap at the requested success boundary: `setAnalysisSuccess` returns `void`; the runner calls it and immediately continues to scroll restoration (`analysis-runner.svelte.ts:162-164`). The call proves only an attempted setter. Actual acceptance happens only after the store-token equality check, when the result is placed in `analysisById`, state becomes ready and the error is cleared (`analysis.ts:79-95`). The minimum repair is a return receipt such as `{ status: 'accepted' | 'stale-token', imageId }`. The runner must preserve all existing behavior, including scroll restoration, but may advance the trace to the result/render phase only on `accepted`.
6. The current native path is selected from a global active path, not from the dataset argument: `compute.ts` ignores `_dataset`, reads `getActivePath`, invokes `analyze_image`, parses the response and maps it to `AnalysisResult` (`tauri-app/src/lib/bridges/compute.ts:239-293`). `compute/bridge.ts` currently adds an `await` before calling the bridge (`tauri-app/src/lib/compute/bridge.ts:15-22`), so an observer must compare the runner's intended `image.path` with the actual path captured by the compute bridge at request issue; it must not silently replace the chosen path or use the observation context as source authority.
7. Native command entry is `tauri-app/src-tauri/src/commands.rs:12-22`. The full native operation is currently a single call into `color_core::analyze`. Inside that core operation, decode/downscale/sample precedes k-means (`color-core/src/analyze.rs:144-194`), while snap, merge, conversion, sort and ignore-top-N follow it (`:196-269`). Existing `durationMs` times only `run_kmeans` (`:192-194`); the displayed value in `AnalysisCards.svelte:72-76` is therefore **`run_kmeans_ms`**, not native aggregate or user wait. Historical `~4000 ms` remains a displayed kernel-time observation on its original build/case, not an end-to-end measurement.
8. A successful store write is not yet a rendered-result proof. `analysisResult` is derived only by active image ID (`tauri-app/src/lib/stores/image.ts:74-79`), and the Home subscription copies any non-null value into `displayResult` (`HomeView.svelte:352-356`). The three enabled figures are independently generated in Svelte derived blocks (`HomeView.svelte:238-272`) and injected as raw SVG in `AnalysisCards.svelte:79-105`, `:145-170` and `:199-225`. There is no result/action tag, figure-complete join, DOM-settle mark, or action-bound RAF endpoint today.
9. Cache restoration is not a fresh or parameter-proven result. `setFile` treats any `analysisById[imageId]` entry as ready (`tauri-app/src/lib/stores/image.ts:191-197`), while that cache is keyed only by image ID (`analysis.ts:57-59`, `:90-93`). Home remount seeds the request key using the *current* params (`HomeView.svelte:174-180`; `analysis-runner.svelte.ts:192-207`). A restored/deduped result therefore cannot be promoted to an associated current-parameter result by instrumentation. Record it as `cache/cache-parameters-unbound` or `deduped/request-key-unchanged`, with fresh execution `not-applicable`; fixing cache identity is an independent correctness ticket.
10. The shell's existing RAF heartbeat is continuous and only logs stalls over 1000 ms (`tauri-app/src/App.svelte:289-309`). It cannot be reused as an action terminal. The minimum slice needs action-bound `tick()` plus two RAF callbacks in Home; App-level frame-gap sampling remains deferred.

## Ordered minimum implementation fence

The following is one proposed fence for lead approval, ordered by dependency. Existing accepted A1 files remain untouched; the three A1-side entries below are new files.

### Mandatory evidence adapter and record contract

1. `tauri-app/scripts/profiling/schema/trace-record.schema.json` — new strict raw-trace envelope/event schema, including version, session/action/span IDs, process/clock labels, bounded-drop summary, exactly one attempt terminal, resolved analysis/render settings, association checks and no raw path field.
2. `tauri-app/scripts/profiling/import-trace-run.mjs` — new explicit-input adapter. It reads one exact trace plus explicit existing build/case records, checks identity/terminal/drop rules, and creates a validated A1 run record at an explicit private destination. It does not infer build, case, workload, cache or frame claims.
3. `tauri-app/scripts/profiling/profiling-trace.test.mjs` — new Node 20 standard-library tests for strict parsing, partial/dropped traces, association failure, endpoint mapping, no cross-clock arithmetic, explicit private I/O and redacted-output absence of raw paths/IDs.

### Mandatory renderer collector and endpoint state machine

4. `tauri-app/src/lib/profiling/trace.ts` — new opt-in renderer collector. It owns observational IDs, a fixed-capacity event/attempt buffer, drop-new accounting with terminal capacity reserved, result-object/action association, exact-once terminal rules, figure joins, visibility/unmount handling, post-terminal result fingerprinting, and injected clock/tick/RAF seams for tests. Disabled calls return before ID generation, allocation, timers, RAF or IPC.
5. `tauri-app/src/lib/profiling/trace.spec.ts` — new deterministic collector tests: disabled no-op, ID non-authority, bounded overflow/drop receipt, one terminal, supersession, hidden/unmount, figure-set join, DOM predicate, RAF1/RAF2 ordering, fingerprint-after-endpoint, and separate clock labels.
6. `tauri-app/src/lib/bridges/profiling.ts` — new narrow bridge for one startup status/calibration read and bounded renderer-event batch append. It must validate batch count/byte size before IPC and surface the native accepted/dropped receipt.

### Mandatory native aggregate and durable bounded artifact

7. `tauri-app/src-tauri/src/profiling.rs` — new dependency-free, opt-in profile state. Enable only from an explicit launch-time session value; write a uniquely named JSONL artifact beneath the app cache; use a mutex-protected fixed event/byte budget, drop-new count and reserved close/drop record; reject unknown/oversized renderer batches. Store native monotonic offsets and wall anchors as distinct fields. Unit tests live in this file under `#[cfg(test)]`.
8. `tauri-app/src-tauri/src/main.rs` — register/manage the optional state and the status/append commands. Disabled startup creates no trace file or worker.
9. `tauri-app/src-tauri/src/commands.rs` — add an optional top-level `ProfileInvocationContext` argument adjacent to `req`, not inside `AnalyzeRequest`; record native command receive and success/error return on all paths. `AnalyzeRequest`, `AnalyzeResponse`, numeric work and normal callers remain unchanged.

### Mandatory existing Colors path

10. `tauri-app/src/lib/bridges/compute.ts` — capture the actual active path once, compare it privately with the runner's expected source path, build the unchanged numeric request from that captured path, pass only the optional observation context beside `req`, and mark renderer request issue/settle/parse. Do not put paths in trace events.
11. `tauri-app/src/lib/compute/bridge.ts` — propagate an optional observation context without changing ordinary callers or result shape.
12. `tauri-app/src/lib/stores/analysis.ts` — return the actual acceptance receipt from success (and the symmetrical error receipt needed for honest error terminals) after the token check; do not change token ownership, cache keys, states or result data.
13. `tauri-app/src/lib/stores/analysis.spec.ts` — new deterministic receipt tests for accepted current token, rejected stale token, optional-token legacy caller, error acceptance and no state/cache semantic delta.
14. `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` — bind delivered actions to the existing semantic request key observationally; close replaced debounce, dedup, cancel, stale, invoke/parse error and store-rejected attempts; mark fresh execution only after native command receive/return evidence; notify the render coordinator only from an accepted receipt. Preserve debounce, dedup, spinner, scrolling and token policy.
15. `tauri-app/src/lib/views/home/ParameterControls.svelte` — emit a synchronous, allowlisted delivered-input observation for analysis-affecting controls. The first live proof uses the clusters numeric control. Intermediate range scrub inputs must end as superseded/coalesced rather than disappear.
16. `tauri-app/src/lib/views/HomeView.svelte` — connect the input observation to scheduling, retain the accepted result object plus source/settings snapshot, time each enabled chart generator, join exactly the enabled set, await Svelte `tick()`, verify the tagged expected SVG roots, then schedule RAF1/RAF2 only while the same result/source/settings remain current and `document.visibilityState === 'visible'`. Cancel pending RAFs and close the attempt on replacement, hidden state or unmount.
17. `tauri-app/src/lib/views/home/AnalysisCards.svelte` — add an observation-only `data-*` tag to the rendered figure containers so the post-`tick()` DOM predicate can count the SVG roots belonging to the accepted result. The tag is evidence, never publication authority.
18. `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` — new rune-shim/fake-timer contract tests across delivered input → debounce/dedup → native settle → acceptance receipt, including stale, error, cancel, unmount and fresh execution. Pure chart/result fixtures assert that enabled-set accounting changes neither SVG bytes nor analysis values.

No `package.json`, lockfile, Cargo manifest or Vite configuration change is needed. The installed Svelte, Tauri, serde and platform standard library are sufficient. If implementation discovers that Tauri cannot deserialize an absent optional adjacent command argument, stop and return that concrete delta; do not move observation fields into the numeric request/response contract without a new verdict.

## Attempt lifecycle and identity contract

### First admitted action

- **Delivered input:** synchronous `input` event on an allowlisted analysis-affecting Colors control. For the first live proof, use a single keyboard step on the clusters numeric input. The timestamp is `performance.now()` taken inside that handler; OS hardware arrival before browser dispatch remains unavailable.
- **Observed candidate:** record current image runtime ID, expected path-equality status, complete analysis settings and complete render settings. Raw path and filename never enter the event. A new delivered input closes an older not-yet-admitted candidate as `cancelled/input-superseded`.
- **Request-key observation:** mirror the existing semantic key only for trace association. The production `lastRequestKey` remains authoritative. A return at `analysis-runner.svelte.ts:116-118` ends `deduped/request-key-unchanged`. Replacing the timer ends the older candidate `cancelled/debounce-replaced`.
- **Admission:** `runAnalysis` entry after 400 ms plus the returned store pending token. This is the first point eligible to become a fresh analysis attempt.
- **Fresh execution:** requires correlated native command receive and native return for the action. Renderer invoke issue alone is not enough.

### Terminals

Every delivered action that enters the trace has exactly one terminal:

- `completed` only after `associated_result_dom_raf2_approx` and all association checks pass;
- `deduped/request-key-unchanged` for the runner short-circuit;
- `cache/cache-parameters-unbound` for restored image-only cache state;
- `cancelled/input-superseded`, `debounce-replaced`, `source-replaced`, or `view-unmounted`;
- `stale/runner-token-mismatch` before the setter or `stale/store-token-rejected` from the new receipt;
- `failed/native-invoke`, `invalid-response`, or `accepted-error` using stable error codes, not raw error text;
- `unverified/result-association-unverified`, `hidden-before-dom-raf2`, `dom-figure-mismatch`, `trace-dropped`, or `trace-flush-failed` where evidence cannot support success.

`cancelPending` needs an observational reason parameter/default so Home unmount, source replacement and ordinary supersession are distinguishable; the parameter must not alter its existing cancellation work. Document hidden state does not cancel native computation today. The observer records mixed/hidden visibility and withholds the RAF2 completion; it must not introduce a new production cancellation policy.

### Association checks

A fresh attempt may use the successful label only when all of these are true:

1. the actual path captured by the compute bridge equals the runner's intended selected-image path at request issue;
2. the exact normalized numeric request fields equal the admitted analysis snapshot;
3. native receive and native return carry the same observational action ID;
4. the runner token is current and the store receipt says accepted;
5. active image ID still equals the admitted image ID;
6. Home's `chartResult` is the same accepted result object, not a previous `displayResult`;
7. analysis and render setting snapshots used by the generators match the trace record;
8. every enabled figure and no disabled figure is present under the action's DOM tag after `tick()`;
9. the same association is still current and the document visible at RAF2.

The runtime image ID, action ID and result observation ID are ephemeral evidence only. Durable authority remains the explicit A1 case record: external source digest, config digest and frame fields. The importer compares trace settings/association claims with that exact case record. A still-image case uses frame `unverified/not-applicable`; the existing A0 video case remains `unmatched` at the nearby frame and cannot be relabelled by this slice. A deterministic SHA-256 of the normalized accepted result may be computed asynchronously *after* the RAF2 timestamp for later parity/join evidence; it is not waited on in the latency path and does not prove semantic correctness by itself.

## Endpoints and clocks

| Endpoint | Meaning | Clock | Eligible subtraction |
|---|---|---|---|
| `input_to_request_admitted_ms` | browser-delivered input handler to debounce callback / runner admission | renderer `performance.now` | yes, same renderer clock |
| `renderer_native_roundtrip_ms` | invoke issue to promise settle, including IPC/native/serialization wait | renderer `performance.now` | yes |
| `input_to_store_accepted_ms` | delivered input to actual accepted store receipt | renderer `performance.now` | yes, only accepted receipt |
| `input_to_enabled_figures_generated_ms` | delivered input to completion of all enabled SVG generators for the accepted result | renderer `performance.now` | yes |
| `input_to_dom_settled_ms` | delivered input to post-`tick()` expected SVG-root predicate | renderer `performance.now` | yes |
| `input_to_associated_result_dom_raf2_approx_ms` | delivered input to second visible-document RAF after checked DOM settle | renderer `performance.now` | yes; **paint opportunity approximation only** |
| `native_analyze_aggregate_ms` | native command receive to native success/error return | Rust `Instant` relative to native session origin | yes, native endpoints only |
| `run_kmeans_ms` | existing `durationMs`, exactly the current `run_kmeans` call | native elapsed `Instant` | retain separately; do not call total analysis |

Renderer `performance.now`, Rust `Instant`, wall-clock anchors, and Instruments/xctrace timestamps are distinct domains. The status/calibration handshake may record renderer before/after bounds around a native monotonic/wall anchor and state its uncertainty, but must not subtract raw timestamps across clocks. End-to-end latency above intentionally stays wholly on the renderer clock; native aggregate stays wholly on Rust `Instant`. A later xctrace export may use a verified mapping only to select an approximate action window, never to manufacture a cross-clock duration.

`store_accepted`, `enabled_figures_generated`, `dom_settled` and RAF2 are four different facts. RAF2 is not physical presentation. `presented_correct` remains unavailable until an independent displayed-frame mechanism is demonstrated and correlated.

## Opt-in, bounds, extraction and privacy

- One optimized binary supports both arms. A launch-time profile session value enables native state; renderer learns it through one status call. With no value, native creates no writer and renderer creates no IDs, buffers, listeners, timers, RAFs or IPC batches. Coarse call sites perform only a predictable disabled branch. There is no runtime network.
- Renderer uses fixed event and attempt capacities and drop-new accounting, reserving room for one terminal/drop summary. It flushes one bounded batch at terminal rather than IPC-logging every mark. Native separately caps accepted event count and file bytes and returns accepted/dropped counts. A missing receipt or any nonzero drop makes the attempt ineligible and explicit.
- Native writes a unique session artifact beneath the app cache rather than an arbitrary media/export path. The filename is derived from the allowlisted session ID; creation is exclusive with owner-only permissions where supported. The artifact contains no media path, filename, freeform error, SVG or pixel data.
- `import-trace-run.mjs` receives that one explicit trace path plus exact build/case records and an explicit safe private output. It reuses A1's bounded regular-file/private-output primitives, adds an `instrumentation` evidence reference, and validates the generated run before writing. It never scans the app cache or Desktop and never overwrites. Existing A1 public summarization then handles redaction.
- A1 v1 currently permits numeric measurements only on a `completed` terminal (`tauri-app/scripts/profiling/validate-run.mjs:101-113`). Therefore partial durations remain durable in the raw trace but import as unavailable on an unverified/stale/cancelled attempt. Do not weaken the accepted schema merely to pool those numbers; a future schema-version decision may represent partial timings separately.

## Deterministic validation proposed, not run here

The implementation brief should require:

1. Renderer table vectors for single numeric K step, rapid K changes (debounce replacement), same-key dedup, source replacement, stale local token, stale store token, native failure, parse failure, hidden before tick, hidden between RAFs, view unmount and buffer overflow. Every vector asserts one terminal and exact fresh-execution status.
2. Store receipt vectors proving accepted and stale-token paths have the same store/cache outcomes as current code.
3. Native vectors for disabled no-file behavior, optional absent context, receive/return on `Ok` and `Err`, fixed event/byte limits, stable drop count, exclusive session artifact and rejection of oversize/unknown batches.
4. Adapter vectors mapping completed/dedup/cache/stale/cancelled/failed/unverified attempts, rejecting mixed actions or clocks, and never calculating renderer-minus-native durations.
5. Figure vectors for all eight enable/disable combinations of histogram, polar and hue-lightness. Existing deterministic SVG/golden suites remain byte-identical with tracing on/off.
6. Full repository gates from the future implementation brief. This B0 assignment ran none.

After the pilot establishes a repeat budget, run randomized/counterbalanced on/off pairs against the **same executable and exact case**, with warmup role, process/cache/workload/visibility strata and all attempts retained. Compare output/result digests first. Report raw values, counts, estimator and uncertainty for the renderer end-to-end and native aggregate endpoints. Define an overhead decision boundary only in that later measurement-plan verdict; this review sets no percentage, millisecond target, p95 claim, regression SLA or causal conclusion. Instruments-on overhead is a separate arm and must not be attributed to the product or to the lightweight trace.

## Explicitly deferred

- All `color-core` observation/core edits: `color-core/src/lib.rs`, new `observation.rs`, `analyze.rs`, `image_pipeline.rs`, `kmeans.rs` and core observation tests. Sampling, dataset construction, k-means sub-stages, snap, merge and conversion remain opaque inside the first native aggregate.
- `tauri-app/src-tauri/src/commands_types.rs`; profile context belongs in the new profiling module and beside the numeric command argument. No `AnalyzeRequest`/`AnalyzeResponse` change.
- Video/media path: `file-ingestion.svelte.ts`, `video-controller.svelte.ts`, `VideoPanel.svelte`, `bridges/video.ts`, `ffmpeg.rs`. Thus no FFmpeg/decode/seek/strip span and no exact-frame claim in the first slice.
- App-wide frame-gap sampling in `App.svelte`, Values, Batch, Exports, navigation and other controls/views.
- `vite.config.ts` source-map work, Cargo/profile/config changes, dependency/lock changes, application symbol repair, builds and captures.
- IMP-178 and every optimization/numeric-policy change.

## Remaining control, capture, flame-graph and symbol sequence

1. Lead approves/revises only the 18-file vertical fence above, then issues a bounded implementation brief. The implementation proves the trace state machine and A1 import before any profiler capture.
2. Build the accepted implementation as a separately identified optimized artifact with matching executable/dSYM identity. Repair/prove at least one **application-crate** source-line symbol in addition to the already accepted core lookup before claiming whole-app native attribution. Renderer source-map generation/resolution is a separate explicit fence.
3. Perform a minimal approved-tool proof. This host has `/usr/bin/xctrace` 16.0 (17E192), `/usr/bin/sample`, `/usr/bin/atos` and `/usr/bin/dwarfdump`; `xctrace help record` exposes bounded `--attach`, `--all-processes`, `--time-limit` and explicit `--output`. In a later authorized run, record a short Time Profiler trace of the isolated bundle into the private artifact root, inspect the trace table before export, and prove that the Tauri main process plus Rayon workers are present and that one application and one core sample resolve to matching source lines. `sample` is secondary evidence. Do not assume WKWebView/WebContent attribution, export-table shape, action-window clock mapping or JavaScript stacks until each is observed.
4. Run the first real vertical on an exact admitted **still-image** case with a contextual keyboard step on the clusters numeric input. This avoids pretending the current video frame is exact while testing the full action/result/DOM chain. Use ordinary visible UI input; hidden IPC action injection is prohibited.
5. Then complete the renderer/process proof: verify WebContent visibility in the chosen profiler and a JavaScript profile/source-map resolution path. A native flame graph alone does not explain chart generation, layout or waiting.
6. Only after that widen control/capture. A0 already demonstrated contextual video import by inspecting picker focus/listing, using Home→Down, verifying the selected preview, then pressing Return (`profiling-native-control-proof-01.md:9-12`). Reuse that contextual pattern; do not encode a blind picker index. Exact seek remains unproved. Establish a real accessible seek/step action and compare requested timestamp, FFmpeg `timestampUsed` and decoded-frame digest before admitting an exact video case.
7. The prior full-window screenshot is retained inline in the native-control task, while the picker image was tiny and no local screenshot-save endpoint was demonstrated (`profiling-native-control-proof-01.md:10-11`, `:21`). Before a presented-evidence claim, prove an approved local capture/retention path with an exact output file and hash. Until then, screenshots remain inline support and `presented_correct` remains unavailable.
8. Correlate each private CPU flame graph with the trace/build/case/session records. If xctrace cannot expose a verified clock mapping, associate it only with the bounded run/capture window and state that uncertainty; do not subtract its timestamps from renderer or Rust timestamps.

## Candid constraints

- The narrow slice can prove a freshly executed result's call-chain association without fixing cache identity, but cache-restored results remain parameter-unbound in current source. That is the main correctness dependency and the reason the first proof must force a real K change and require native receive/return.
- Svelte's node test environment cannot mount the real DOM and `.svelte.ts` runners need the established rune shim (`CLAUDE.md:102-106`). Pure trace/coordinator tests plus Svelte compile checks are necessary but not sufficient; the first authorized live trace must demonstrate actual SVG counts and RAF ordering.
- Optional adjacent Tauri command context is source-plausible and matches the accepted architecture, but absent-argument deserialization must be proven before implementation is accepted. Moving fields into numeric request/response types is not an allowed fallback.
- A bounded custom timeline answers waiting and association; Time Profiler answers sampled CPU attribution. Neither alone is the requested whole-app explanation, and neither proves physical display.

## Preservation receipt

At review start the 16 accepted A1 files under `tauri-app/scripts/profiling/` produced a sorted per-file-hash-list digest of `ea93a92f171f565946ccc3f2ad1998fba146cd9350f90c911973d8aa167fe476`. They were read only. This report is the sole written file in the B0 assignment.
