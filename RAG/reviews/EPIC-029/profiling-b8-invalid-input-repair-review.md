# AI-IMP-202 B8 invalid-input persistence repair review

Code Lead -> Review Lead, 2026-09-06. Review-only submission under PROJECT-RECORD rev 0.36 section 10.15.

## Verdict

The empty-number-input persistence defect is reproduced with installed Svelte 5.39.6, the real profiling coordinator, real collector, real production renderer validator, and the production runner's seed/dedup path. The only stub is the native transport after renderer validation. No always-success validator was used.

The smallest honest repair is a schema-v2 discriminated `analysisConfig` evidence arm:

```ts
type ProfileAnalysisConfigEvidence =
  | {
      state: 'resolved';
      value: ProfileAnalysisConfigRecord;
    }
  | {
      state: 'unavailable';
      reasonCode: 'input-target-invalid';
    };
```

Every newly written trace record should use `schemaVersion: 2`. The unavailable arm is legal only for the exact non-admitted `unverified/input-target-invalid` action shape enumerated below. All admitted or completed actions require the resolved arm and the existing exact finite configuration. Native batch-sequence checking, renderer sticky persistence failure, production input scheduling, debounce, cache and cancellation behavior remain unchanged.

This review authorizes no implementation. The lead must settle the schema and file fence.

## Scope and preserved state

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Prepared paths: 56 with `git status --short -uall`; no candidate file was changed.
- All 56 hashes in `color-tool-profile-b6.fnWyNO/attempt-01/source-hashes.after.sha256` passed before and after this report; branch, HEAD and 56-path status count were unchanged.
- B7 raw trace: 748 bytes, SHA-256 `037e79faafcb58844fbcf463f8ba78d1e91e4bad51c124db47f75fae2c626770`.
- B7 30-file index: SHA-256 `53b2580382efec31e68ea516e5ff3776dbfef562d2b8592f77aa20bdff9e613a`.
- B7 inspection: SHA-256 `1ebde2cf955e8cd2bcdd8b0190816f6feba0dfad5ef9c448c8b90e1f565f8efa`.
- Probe runtime: Node `v26.8.1`, installed Svelte `5.39.6`, installed Vite `7.3.1`.
- No build, package, Cargo/native execution, app launch/control, runtime namespace write, media operation, install, Git change, full suite, watcher, new task or temporary fixture occurred.

## Reproduction result

The executed probe used:

- installed `bind_value` and `effect_root` from `svelte/internal/client`;
- an `EventTarget` number-input surrogate whose empty `valueAsNumber` is `NaN`;
- a real Svelte writable store with synchronous subscription into the Home-equivalent `currentParams` snapshot;
- Vite's in-memory Svelte transform for the real `profiling-coordinator.svelte.ts` and `analysis-runner.svelte.ts`;
- real `RendererProfileTrace` and real `appendProfileBatch` validation;
- production `runner.seedLastRequestKey(FILE, currentParams)` at K45;
- a labelled native transport stub implementing the real writer's strict expected-sequence behavior and cumulative event-loss count.

The input listener registered after installed `bind_value` ran the exact `ParameterControls` numeric observation rule and then the Home-equivalent resolve/schedule call. This deliberately gives scheduling the earliest possible legal point after the observer; production `$effect` runs later, not earlier.

Executed input sequence and result:

| Synthetic action | Bound store value | Input state | Config evidence in current v1 batch | Terminal | Batch sequence | Renderer validation / IPC |
| --- | ---: | --- | --- | --- | ---: | --- |
| 1 | `null` | `invalid-or-empty` | `clusters: null` (invalid) | `unverified/input-target-invalid` | 1 | `profile-analysis-config-invalid`; IPC not reached |
| 2 | `46` | `number`, target 46 | fully finite, clusters 46 | `cancelled/input-superseded` | 2 | renderer-valid; IPC reached; strict stub expected 1 and rejected sequence 2; 4 events lost |
| 3 | `null` | `invalid-or-empty` | `clusters: null` (invalid) | `unverified/input-target-invalid` | 3 | `profile-analysis-config-invalid`; IPC not reached |
| 4 | `45` | `number`, target 45 | fully finite, clusters 45 | `cancelled/view-unmounted` | 4 | renderer-valid; IPC reached; strict stub still expected 1 and rejected sequence 4; 4 more events lost |

Exact event types were:

```text
batch 1: delivered_input, input_resolved, action_outcome
batch 2: delivered_input, input_resolved, schedule_observed, action_outcome
batch 3: delivered_input, input_resolved, action_outcome
batch 4: delivered_input, input_resolved, schedule_observed, action_outcome
```

The stub's cumulative loss was 4 then 8. `finishCapture()` returned non-retryable `failed/renderer-persistence-failed`, and the stubbed finalize function was not called.

This is a deterministic mechanism reproduction, not attribution of these synthetic IDs, cancellation terminals or exact timing to B7's missing actions. B7's immutable artifact contains no action IDs or batches. It proves only a header and cumulative `batch-sequence` losses 4 then 8. The B7 log independently shows real `clusters=null` transitions immediately before 46 and 45 at `b6-event-log.final.txt:42-48`.

### Hostile-state separation

A second real-collector/production-validator probe separately supplied `undefined`, `NaN`, and positive infinity as the runtime `clusters` field. Each retained a `clusters` own-property before serialization; the types were respectively `undefined`, `number`, and `number`, and none was finite. All three were rejected by `appendProfileBatch` as `profile-analysis-config-invalid`; `RendererProfileTrace` normalized each to `trace-flush-failed`. None reached native transport.

These are hostile or synthetic runtime states. They are not the installed binding's current empty-field value. Installed Svelte 5.39.6 returns literal `null` for an empty number/range input.

## Listener, effect and production-dedup ordering

Observed source/runtime order:

1. `ParameterControls.svelte:92-95` declares `bind:value={$params.clusters}` and the profiling `oninput` observer on the same input.
2. Compiling that exact component with the installed compiler emits the observer as delegated `input_2.__input`, and emits `$.bind_value(input_2, ...)` during component setup.
3. Installed `bindings/input.js:22-31,278-279` registers a direct target listener. On input it converts `''` to `null` and calls the store setter before awaiting `tick()`.
4. Installed `events.js:242-266` invokes the declarative `__input` handler during delegated bubbling, after the target's direct binding listener.
5. The writable subscription at `HomeView.svelte:392-394` therefore copies the new bound value into `currentParams` before `profiling.handleInput` reads it.
6. Installed Svelte state updates enter a batch and enqueue its flush as a microtask (`reactivity/batch.js:435-457`). The Home analysis `$effect` at `HomeView.svelte:521-545` cannot run before the same-dispatch observer.
7. The observer creates/resolves the valid action before the Home effect calls `profiling.resolveAction(...)` and `runner.scheduleAnalysisWith(...)`. The probe then called that resolve/schedule synchronously after the observer, an earlier and stricter ordering than the real microtask effect, and obtained `schedule_observed/bound` for 46 and 45.

Conclusion: mounted-equivalent ordering attaches a valid action before its first production schedule. No injected pre-scheduled key is needed, and the observer does not lose to the Home effect. The earlier `deduped/request-key-unchanged` result required manual injection and is not the normal first-schedule disposition for this sequence.

Production dedup still has one legitimate role: the same already-bound action may observe a repeated reactive schedule, and a truly unchanged key may close as `deduped/request-key-unchanged`. That behavior should not be altered. The invalid empty action closes synchronously, so the following Home effect has no open profiling action to attach to the production null-key schedule. The next valid value changes the runner key and binds normally.

The probe did not mount a full browser DOM or run compute. That limitation does not leave the ordering ambiguous: it executed the installed conversion/listener, real synchronous store propagation and a schedule placed earlier than production's microtask effect. A later implementation regression should retain this focused no-browser harness and may add one real mounted component test only if the lead wants DOM dispatch proof.

## Root cause

- `paramsWithTarget` returns a copy of current params unchanged when the observer target is null (`profiling-coordinator.svelte.ts:81-95`). The installed binding has already changed `clusters` to null.
- `createProfileAnalysisConfig` copies `params.clusters` without a runtime guard (`trace-config.ts:27-43`). TypeScript's `number` does not protect the runtime store.
- `resolveDeliveredAction` honestly terminalizes the action `unverified/input-target-invalid`, but the action retains the non-finite/non-number config (`trace.ts:220-237`).
- `flush` increments `batchSequence` before calling the production append boundary (`trace.ts:582-604`).
- `appendProfileBatch` requires every analysis numeric field to be finite and rejects locally before `tauriInvoke` (`bridges/profiling.ts:269-305,351-387`).
- Native correctly continues to expect sequence 1 and records each later valid gap as `batch-sequence` loss (`profiling.rs:241-254`; `profiling_writer.rs:126-145`).
- Renderer persistence failure is sticky and Finish correctly refuses native finalization (`trace.ts:612-645,675-703`).

The defect is not native gap handling and not Finish. It is a contradiction between an intentionally representable invalid input observation and a v1 batch schema that requires a fully resolved finite analysis config for every terminal.

## Preferred v2 wire arm

### Exact allowed invalid-input batch fragment

```json
{
  "schemaVersion": 2,
  "recordType": "renderer-batch",
  "analysisConfig": {
    "state": "unavailable",
    "reasonCode": "input-target-invalid"
  },
  "input": {
    "control": "clusters",
    "targetState": "invalid-or-empty"
  },
  "observedOutcome": {
    "status": "unverified",
    "reasonCode": "input-target-invalid",
    "endpoint": null,
    "freshExecution": false,
    "associationChecks": { "inputTargetResolved": false },
    "measurements": {}
  }
}
```

The complete batch continues to require the existing identity, sequence, render config and exact three-event closure. `renderConfig` stays fully resolved because the empty cluster input does not make visual settings unavailable.

### Exact resolved arm

```json
{
  "analysisConfig": {
    "state": "resolved",
    "value": {
      "clusters": 46,
      "quality": 2,
      "sampleCap": 180000,
      "maxDimension": 2200,
      "ignoreTopN": 0,
      "mergeThreshold": 0,
      "snapToReal": true,
      "seed": 1,
      "maxIterations": 40,
      "tolerance": 0.001,
      "warmStart": "none"
    }
  }
}
```

### Forbidden contradiction

```json
{
  "analysisConfig": {
    "state": "unavailable",
    "reasonCode": "input-target-invalid"
  },
  "input": { "control": "clusters", "targetState": "number", "targetNumber": 46 },
  "events": [
    { "type": "request_admitted" },
    { "type": "action_outcome", "data": { "status": "completed", "reasonCode": null, "endpoint": "associated_result_dom_raf2_approx" } }
  ],
  "observedOutcome": { "status": "completed" }
}
```

It must fail before IPC in the renderer and fail native/parser validation if submitted directly.

### Exhaustive guards

The `unavailable` arm is accepted only when all are true:

1. Object keys are exactly `state` and `reasonCode`; values are exactly `unavailable` and `input-target-invalid`.
2. `input.targetState` is exactly `invalid-or-empty`; neither target number nor target boolean is present.
3. `observedOutcome` is exactly `unverified/input-target-invalid`, endpoint null and `freshExecution: false`.
4. Events are exactly one `delivered_input`, one `input_resolved`, and one terminal `action_outcome`, in that order. No schedule, admission, native issue/settle, response, store, figure, DOM or RAF event is present.
5. The delivered event canonically equals `input`; `input_resolved` has `targetMatches: false`; the action's association checks are exactly `{inputTargetResolved:false}`; measurements are empty.
6. The action has no native receive/return span. Its action-close receipt must report both native flags false.
7. The render config remains exact and valid. All normal identity, byte, event-count, monotonic-time, action-close, seal and per-session limits remain enforced.
8. Any action containing `request_admitted`, any completed outcome, and every numeric/boolean delivered target requires the `resolved` arm.
9. The `resolved` arm has exact keys `state,value`; `value` has the existing 11 exact keys and all current finite/domain/quality-derived checks. Null, undefined, NaN, infinity, omitted keys and extra keys remain forbidden.
10. No code may construct a native request, mark admission, compare accepted result configuration or claim a completed endpoint from an unavailable arm.

This is deliberately not `analysisConfig: null`, a nullable clusters field, a last-good snapshot, zero, or an arbitrary string reason. It makes only the already-existing `input-target-invalid` terminal serializable.

## Version and backward policy

- New production writer sessions emit schema version 2 on every record, including header, native events, renderer batches, closes, losses and seal. Mixed record versions in one session reject.
- The renderer and native bundle use the v2 union for IPC. No sequence or action identity field changes.
- Keep the existing v1 parser path byte-for-byte semantic: v1 renderer batches require the old flat resolved analysis config. Existing valid sealed v1 artifacts remain importable and eligible exactly as before.
- Do not rewrite, migrate, reseal or reinterpret immutable v1 artifacts. A v1 trace missing batches/seal or containing losses remains diagnostic/ineligible; B7 is unchanged.
- Add a separate `trace-record.v2.schema.json`; retain `trace-record.schema.json` as the v1 document instead of silently changing its `$id` contract.
- `parseTraceJsonl` dispatches strict validation by record version, then `organizeTrace` requires every record version to equal the first `trace-session` version. Unsupported versions reject.
- Integrity may consider a correctly closed/sealed v2 unavailable action structurally clean. It is never an eligible completion and contributes no latency measurements.
- Acquisition binding must account for the action. A nonselected unavailable action can coexist with selected resolved measured actions in a normal import. Selecting an unavailable action causes normal import to fail with a fixed `ACTION_CASE_CONFIG_UNAVAILABLE`; diagnostic import may represent it only as `unverified/input-target-invalid` with every measurement unavailable. It cannot satisfy case-config equality or measured acceptance.

## Safe local failure and sticky Finish

The intended unavailable action should no longer fail persistence. Unexpected pre-IPC failures still must fail closed.

Add a fixed renderer-side `ProfileAppendValidationErrorCode` allowlist containing only the bridge's authored validation codes, including `profile-analysis-config-invalid`, `profile-render-config-invalid`, `profile-batch-identity-invalid`, `profile-outcome-invalid`, `profile-session-disabled-or-mismatched`, `profile-batch-event-count-invalid`, `profile-event-invalid`, `profile-event-data-not-primitive`, `profile-event-data-not-finite`, and `profile-batch-bytes-exceeded`. `persistBatch` may retain one of these codes in its internal `ProfilePersistenceResult`; every non-allowlisted thrown value becomes `trace-flush-failed`. Arbitrary exception text, paths, input values or native error strings must not enter the UI or artifact.

`persistenceFailure` remains first-failure sticky. A later valid append cannot clear it. Finish remains non-retryable `renderer-persistence-failed`, does not call `profile_finalize`, and does not reset/rebase/retry batch sequence. The visible control may remain generic; test/debug receipts can expose the safe local code.

## Proposed implementation fence and order

### Production files

1. `tauri-app/src/lib/bridges/profiling.ts` — add the evidence union, v2 strict branch validation and safe validation-code classifier.
2. `tauri-app/src/lib/profiling/trace-types.ts` — distinguish resolved config from unavailable action evidence and extend internal persistence error typing.
3. `tauri-app/src/lib/profiling/trace.ts` — never retain the raw null/undefined/nonfinite analysis config for an invalid target; flush the tagged unavailable arm; require resolved before admission; keep sticky first failure.
4. `tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts` — construct the exact invalid-target evidence without inventing a numeric snapshot. Do not change production scheduling.
5. `tauri-app/src-tauri/src/profiling_wire.rs` — bump new records to v2 and add a deny-unknown-fields tagged analysis-config evidence type.
6. `tauri-app/src-tauri/src/profiling_validation.rs` — validate both v2 arms and all cross-field/event guards above.
7. `tauri-app/scripts/profiling/trace-wire.mjs` — strict v1/v2 parser dispatch and exact v2 union validation.
8. `tauri-app/scripts/profiling/trace-integrity.mjs` — reject mixed versions and unavailable-arm contradictions; preserve unavailable as noncompletion evidence.
9. `tauri-app/scripts/profiling/import-trace-run.mjs` — unwrap resolved v2 config for case binding and fail/diagnose selected unavailable config explicitly.
10. `tauri-app/scripts/profiling/schema/trace-record.v2.schema.json` — new exact v2 trace schema; leave the v1 schema document intact.

No change is proposed for `ParameterControls.svelte`, `HomeView.svelte`, `analysis-runner.svelte.ts`, analysis math, compute request fields, cache keys, debounce timing, native sequence checks, writer sequencing/finalization, case manifests, run-record schema or disabled-path mounting.

### Test files

1. `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts` — installed binding conversion/order plus real coordinator/collector/production-validator sequence.
2. `tauri-app/src/lib/profiling/trace.spec.ts` — contiguous invalid-v2 then valid-v2 batches; hostile invalid state and sticky-failure cases.
3. `tauri-app/src/lib/bridges/profiling.spec.ts` — exact union positive/negative and IPC-not-called assertions.
4. `tauri-app/src-tauri/src/profiling_tests.rs` — native v2 unavailable then resolved continuity; exhaustive contradictions; v2 writer/seal output.
5. `tauri-app/scripts/profiling/trace-fixtures.mjs` — explicit v1 and v2 fixtures.
6. `tauri-app/scripts/profiling/profiling-trace.test.mjs` — v1 compatibility, v2 parser/import, selected-unavailable policy and schema checks.
7. `tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs` — mixed-version and unavailable cross-field guard matrix.
8. `tauri-app/scripts/profiling/profiling-native-wire.test.mjs` — production Rust v2 artifact/import interoperability.

`trace-to-run.mjs` should not need production changes if integrity/import normalize the arm before conversion; its existing noncompleted path already produces unavailable measurements. If implementation proves otherwise, stop and return that exact dependency rather than widening silently.

## Regression matrix

Positive:

- Installed binding: K45 -> empty stores null; observer sees invalid; exact unavailable batch 1 reaches IPC and closes; valid 46 batch 2 reaches IPC with no sequence gap.
- Full rapid sequence K45 -> empty -> 46 -> empty -> 45 yields sequences 1-4, all persisted; invalid terminals have no native spans; valid terminals retain their truthful actual status.
- Empty input left for longer than debounce remains an unavailable profiling action and does not acquire a native profiling context; production behavior is unchanged.
- Boolean and all finite numeric controls use the resolved arm.
- Valid sealed v1 fixture parses/imports unchanged.
- Valid sealed v2 trace with unavailable actions nonselected and a resolved measured selection imports normally.
- Diagnostic selection of an unavailable action yields only unverified terminal and unavailable measurements.

Negative:

- Unavailable plus numeric/boolean target; wrong/extra reason; extra/missing arm key; nullable arm; arbitrary reason; resolved null/undefined/NaN/infinity; missing/extra resolved field.
- Unavailable plus schedule/admission/native/store/chart/DOM/RAF event, native span, completed/deduped/cache/cancelled/failed/stale outcome, non-null endpoint, fresh execution null/true, measurement, or successful target check.
- Resolved arm whose target does not match; completed/admitted unavailable; case-config claim from unavailable.
- Mixed v1/v2 records; unknown schema version; v2 shape under v1 and v1 shape under v2.
- First pre-IPC hostile failure followed by valid append: later result cannot clear sticky failure; Finish refuses finalize.
- Native receives sequence 2 while expecting 1: rejection and loss remain unchanged.
- Arbitrary thrown text is reduced to `trace-flush-failed` and never surfaced.

## Proposed gates after implementation

Focused first:

```sh
cd tauri-app
npx vitest run src/lib/views/__tests__/profiling-svelte.spec.ts src/lib/profiling/trace.spec.ts src/lib/bridges/profiling.spec.ts
node --test scripts/profiling/profiling-trace.test.mjs scripts/profiling/profiling-trace-integrity.test.mjs
cd src-tauri
cargo test --offline profiling_tests -- --nocapture
```

Then all repository gates from `tauri-app/` and `tauri-app/src-tauri/`:

```sh
npm run test -- --run
npm run check
npm run lint
npm run format:check
cargo fmt --all -- --check
cargo clippy --workspace --offline -- -D warnings
cargo test --workspace --offline
```

The later build/runtime proof must create a fresh namespace and repeat the real B7 interaction with a sealed/importable trace. This B8 review is not that proof and makes no performance claim.

## Actual commands and outputs

All commands exited 0 unless noted.

```sh
# Read-only preflight
git branch --show-current
git rev-parse HEAD
git status --short -uall | wc -l
shasum -a 256 -c /absolute/color-tool-profile-b6.fnWyNO/attempt-01/source-hashes.after.sha256
shasum -a 256 /absolute/b7-capture-01.CMdcCN/{native-trace.raw.jsonl,final-artifact-hashes.sha256,trace-inspection.json}
node --version
node -p "require('./tauri-app/node_modules/svelte/package.json').version"
node -p "require('./tauri-app/node_modules/vite/package.json').version"
```

```sh
# Exact component compile inspection, no emitted output
cd tauri-app
node --input-type=module -e "import {readFileSync} from 'node:fs'; import {compile,preprocess} from 'svelte/compiler'; import {vitePreprocess} from '@sveltejs/vite-plugin-svelte'; const p='src/lib/views/home/ParameterControls.svelte'; const s=readFileSync(p,'utf8'); const x=await preprocess(s,vitePreprocess(),{filename:p}); const out=compile(x.code,{filename:p,generate:'client',dev:false}).js.code; const lines=out.split('\\n'); for(let i=0;i<lines.length;i++){if(lines[i].includes('bind_value')||lines[i].includes('observeAnalysisInput')) console.log(String(i+1).padStart(4),lines.slice(Math.max(0,i-3),i+5).join('\\n'));}"
```

The sequence probe was one `node --input-type=module` stdin module. It created a middleware-mode Vite server with `configFile:false`, loaded the four real modules with `server.ssrLoadModule`, imported installed `bind_value/effect_root`, installed a strict `__TAURI__.core.invoke` sequence stub, seeded the real runner at K45, dispatched `['', '46', '', '45']`, cancelled on the Home-equivalent unmount, awaited each `trace.getPersistence(ref)`, then called `finishCapture()`. It emitted exactly the table and event lists above and closed the in-memory server in `finally`. It emitted no files or app bundle.

The hostile matrix used a second stdin module with fresh collectors for `[undefined, NaN, +Infinity]`, the real `appendProfileBatch`, and a native stub that throws if reached. Output for each was `bridgeError=profile-analysis-config-invalid`, `traceError=trace-flush-failed`; native was not reached.

No full test suite was run because B8 forbids it.

Final preservation checks passed all 56 candidate source hashes and all 30 B7 evidence-index payloads; the three B7 digests above remained unchanged.

## Friction and limitations

- I initially ran the B7 index check from the candidate directory, so all 30 relative paths failed open; rerunning from the B7 evidence root passed all 30. I also initially ran the 56-source hash check from the B6 evidence root, so all relative paths failed open; rerunning against the absolute checksum file from the candidate root passed all 56. These were working-directory mistakes only; no files changed.
- The first combined source-read command used the wrong coordinator path (`src/lib/profiling/...` rather than `src/lib/views/home/...`) and produced one `sed` not-found before the corrected targeted read.
- The sequence probe is mounted-equivalent event/runtime evidence, not a browser/native-app mount and not B7 identity attribution. It intentionally avoids compute by keeping the scripted sequence inside the debounce window and then cancelling. B7's actual valid analyses ran; their missing records cannot be reconstructed from the lossy artifact.
- Node is v26.8.1, not CI Node 20. The relevant Svelte/Vite dependencies are the candidate's installed versions. Node 20 and Windows remain future gates.

## Stop state

B8 diagnosis and one preferred schema/fence proposal are complete. Candidate source, B6/B7 evidence and runtime namespaces remain untouched. Await the Review Lead's bounded implementation brief or concrete technical objection; do not implement, build or launch from this report.
