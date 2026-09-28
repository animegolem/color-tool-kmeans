# AI-IMP-202 B12 trusted-input ordering review

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev 0.41 §10.20.
**Focused Round 1 complete. Causal failure reproduced; capture-phase hypothesis passes the bounded browser proof. No candidate implementation, native build, performance run, or Git mutation was performed.**

## Outcome

The unchanged production hookup fails to correlate ordinary trusted numeric input with the reactive analysis scheduling boundary. In the mounted Svelte harness, `bind:value` updates the store and the real `$effect` executes before the delegated `oninput` observer starts the profiling action. Thus the effect either resolves a prior action against the new value and rejects it, or schedules with no action; the observer then starts the correct action too late.

A private fixture changing only the six existing profiling hooks from `oninput` to `oninputcapture` reverses the relevant order. The capture observer starts a target-aware action before the unchanged binding updates the store; the subsequent unchanged effect resolves that action against the exact bound config. Trusted sequences `null -> 4 -> 46` and `null -> 4 -> 45`, a separate checkbox activation, and a keyboard-driven quality range step all behave correctly in the capture fixture. Empty numeric input remains explicitly unavailable and does not acquire a false schedule association.

This establishes the browser event-ordering cause and supports a two-file implementation fence. It does **not** prove Tauri/WebKit behavior, backend/native execution, chart or DOM completion, physical display, performance bounds, overhead, parity, or the requested flame graph.

## Preserved source floor

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD before and after: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Exact `git status --porcelain=v1 -uall` path count: 57, byte-for-byte matching the B11 after-status receipt.
- Accepted source hashes checked: 57; mismatches: 0.
- B10 PID 57783, its app, trace, bundle, carriers, and all B10/B11/B6/B7/B2/A0 material were not controlled, restarted, injected into, or modified.
- The B12 loopback process was the only process stopped. PID 47453 is no longer alive.

Machine-readable preservation receipt: `evidence/preservation.json`.

## Source diagnosis, kept separate from runtime proof

### Existing component and coordinator behavior

`tauri-app/src/lib/views/home/ParameterControls.svelte:36-64`:

- skips observation when profiling is disabled;
- reads `currentTarget`, preserving raw text plus numeric `valueAsNumber` or checked state;
- maps non-finite numeric input to `targetValue: null`;
- contains callback failure so observation cannot block normal input.

The six analysis-affecting profiling endpoints are presently delegated `oninput` hooks at lines 78-80, 93-95, 106-108, 123-125, 146-148, and 185-187. Bindings and input types remain ordinary Svelte bindings.

`tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts:92-107` already creates a target-aware candidate snapshot by cloning the current params and overriding only the delivered control. Lines 123-168 preserve disabled early return, missing dependency return, invalid-numeric unavailable handling, and fail-closed exception containment. Lines 171-184 resolve an active action against the later actual params snapshot.

`tauri-app/src/lib/views/HomeView.svelte:521-545` is the real analysis scheduling boundary. Its `$effect` reads the file, current params, scrubbing state, and status, then calls `runner.scheduleAnalysisWith(..., profiling.resolveAction(...))`.

### Installed Svelte behavior

Installed version: Svelte 5.39.6.

- `node_modules/svelte/src/internal/client/dom/elements/bindings/input.js:19-40`: `bind_value` installs a target `input` listener, converts number-like input, and synchronously calls the setter before awaiting a tick.
- The same file at lines 220-239: `bind_checked` listens to `change`, not `input`.
- `node_modules/svelte/src/internal/client/dom/elements/events.js:50-80`: a capture handler bypasses delegated propagation and is installed directly on the target.
- Lines 111-124 show the direct event helper receives the capture option.

An in-memory compile, with `generate: 'client'` and `dev: false`, records:

| Variant | Direct capture `input` handlers | `bind_value` calls | `bind_checked` calls | delegated `input` tail |
|---|---:|---:|---:|---|
| unchanged | 0 | 6 | 3 | yes |
| capture-only | 6, preceding bindings | 6 | 3 | no |

The unchanged tail delegates `input`, `pointerdown`, and `pointerup`. The capture tail delegates only the pointer events. Compiler evidence is retained in `evidence/compile-ordering.json`; it supports the runtime result but is not substituted for it.

### Why the existing test does not prove this ordering

`tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts:450-488` uses a synthetic input surrogate, manually invokes `coordinator.handleInput` and `runner.scheduleAnalysisWith` inside the same listener, and calls `dispatchEvent`. The test therefore imposes its asserted ordering. It remains useful for null/wire semantics, but it cannot establish mounted trusted-event ordering.

The source contract at lines 710-737 also asserts the current literal `oninput` form. It will require a narrow update if implementation is authorized.

## Private mounted-browser proof

### Harness boundary

Private root:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b12.wPLNxd`

Actual candidate code mounted or invoked:

- the complete candidate `ParameterControls.svelte`, copied unchanged into the `current` fixture;
- the candidate `createProfilingCoordinator` module;
- Svelte's real writable store and a real Svelte `$effect` mirroring Home's relevant schedule call.

Stubbed or absent boundaries:

- fixed selected-image identity/path;
- render extras and profiling-study lookup;
- trace sink, with real candidate config correlation semantics recorded in one renderer clock;
- schedule sink at the Home effect boundary;
- analysis runner/debounce, native IPC/Rust, filesystem/media decode, charts/DOM completion, persistence, paint/display, and performance acquisition are absent.

The trace stub did not manually invoke the effect or scheduler from the input observer.

### Exact variant delta

The `current` fixture is a byte copy of candidate `ParameterControls.svelte`, SHA-256:

`0782f5828e9c7516df19c414449af36eb00150c777382275f30010da52122bb5`

The `capture` fixture SHA-256 is:

`706e8e9c9c640e51fd2de73e7a92e4caad21738ad0ae8c8e99da939dfa346dab`

Its only six source changes are the existing profiling attributes:

```diff
- oninput={onAnalysisInput
+ oninputcapture={onAnalysisInput
```

Bindings, control types, coordinator, effect, trace correlation, and all other code remain unchanged. Candidate and `node_modules` were never transformed.

### Server and browser

- Loopback server: PID 47453, `127.0.0.1:56706`, OS-selected port.
- Initial URL: `http://127.0.0.1:56706/?variant=current`.
- Served roots were restricted to the B12 fixture, candidate `tauri-app/src`, and existing candidate `tauri-app/node_modules`.
- Browser: Codex In-app Browser, `Mozilla/5.0 ... Chrome/152.0.0.0 Safari/537.36`.
- The server was stopped and the completed diagnostic tab was closed.

The actions were documented computer-use controls only: click the number input; Command-A; Backspace; press `4`; press `6`; repeat Backspace, `4`, `5`; separately click the Snap checkbox; click the quality range and press Right. There was no `dispatchEvent`, DOM value assignment, evaluated click, or synthetic EventTarget. Diagnostic-state export only serialized the page's own retained records.

Reproduction/build commands from the private root:

```sh
node compile-ordering.mjs
node server.mjs
node summarize.mjs
node preservation.mjs
node index-artifacts.mjs
```

`server.mjs` selects a free port itself and writes the actual receipt; the URL above is the completed run, not a promised fixed port.

## Observed trusted event order

Both snapshots contain 86 ordered records in a distinct renderer clock. Every retained native `input` and `change` event reports `isTrusted: true`.

| User action | Unchanged hookup | Capture-only hookup |
|---|---|---|
| number becomes empty | binding/store -> effect/schedule null -> observer starts unavailable action | observer starts unavailable action -> binding/store -> effect/schedule null |
| type `4` | binding/store/effect rejects prior unavailable action; schedule null; observer starts candidate 4 too late | observer starts candidate 4 -> binding/store/effect resolves exact candidate -> schedule carries action 2 |
| append `6` | binding/store/effect rejects candidate 4 against actual 46; schedule null; observer starts candidate 46 too late | observer starts candidate 46 -> binding/store/effect resolves exact candidate -> schedule carries action 3 |
| repeat empty, `4`, append `5` | same failure; no numeric schedule carries an action | exact actions 5 and 6 correlate to 4 and 45 |
| click Snap checkbox | observer on trusted `input` starts action; binding changes store on subsequent trusted `change`; exact action 7 schedules | same successful `input` then `change` behavior |
| keyboard Right on quality range | binding/store/effect runs before delegated observer; prior action mismatch and schedule null; quality action starts too late | observer starts action 8 -> binding/store/effect -> exact quality 3 schedule |

The unchanged fixture's only successful action-bearing schedule is the checkbox action 7. The capture fixture's successful action-bearing schedules are numeric 4, 46, 4, and 45; checkbox false; and quality 3. The invalid empty steps remain unavailable and do not schedule with an action in either variant.

This corrects the prior B11 inference: the precise current failure is not merely a speculative microtask checkpoint. The mounted trusted proof directly records target binding/store/effect before the delegated observer for numeric input. Capture moves observation before binding at the required boundary.

## Proposed implementation fence

No implementation is performed or authorized by this report. If the Review Lead accepts the result, the smallest proposed ticket fence is:

### Files to touch

1. `tauri-app/src/lib/views/home/ParameterControls.svelte`
   - Change only the six existing analysis profiling hooks from `oninput` to `oninputcapture`.
   - Preserve bindings, input/control types, pointer scrub hooks, target extraction, disabled behavior, coordinator calls, and exception containment.
2. `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts`
   - Retain the existing null/wire synthetic regression and label its transport-order limitation in the test structure/name or adjacent assertion context.
   - Replace the obsolete literal-source assertion.
   - Add a compiler contract that compiles `ParameterControls.svelte` and asserts six direct capture `input` handlers occur before the corresponding value/checked binding calls and `input` is absent from the delegated tail. This must fail against the old hookup.

### Do not touch

- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts`
- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`
- all `tauri-app/src/lib/profiling/**`
- bridges, stores, Rust/native code, package manifests, lockfiles, tool configs, and `node_modules`
- benchmark binaries and performance/math changes
- `RAG/INDEX.md`
- B10/B11/B6/B7/B2/A0 artifacts, bundles, manifests, logs, and traces

No scheduler, debounce, request-key, numerical, checkbox-binding, persistence, or tracing-schema change is supported by B12.

## Validation and subsequent native acceptance

### Implementation validation commands

From candidate `tauri-app/`:

```sh
npm run test -- --run src/lib/views/__tests__/profiling-svelte.spec.ts
npm run test -- --run
npm run check
npm run lint
npm run format:check
```

From `tauri-app/src-tauri/`:

```sh
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
```

`cargo test --workspace --offline` is acceptable if needed. None of these candidate suites was run in B12 because the assignment prohibited full suites and candidate implementation.

### Fresh native acceptance recipe

1. After explicit implementation authorization, verify a fresh source hash and exact status; use a new isolated target directory, new profile app identity/bundle ID, and fresh process. Do not reuse or inject into B10.
2. Build and launch the new Tauri/WebKit app with profiling enabled.
3. Use the owner's standard varied Desktop sample and trusted controls for `null -> 4 -> 46`, `null -> 4 -> 45`, a separate Snap checkbox activation, and a keyboard-driven range change.
4. Seal only after the real native request, Rust analysis, chart generation, and renderer/DOM completion endpoints finish. Do not treat `raf2` as physical display.
5. Require each valid delivered intermediate/final numeric action to correlate to the exact analysis config, native span, and renderer completion; require empty input to remain explicit unavailable; require zero loss, a valid untainted seal, and the actually visible ready/chart state.
6. Repeat the exact sequence in a fresh process to establish replayability and instrumentation overhead/bounds.
7. Only then perform the separate whole-interactivity flame-graph acquisition across input, scheduling/debounce, IPC, Rust/native analysis, chart generation, and renderer completion. Compare against an equally fresh control. Do not infer the user's reported ~4 s regression from this ordering proof.

## Friction and unrun gates

- First server attempt let Vite normalize port 0 to 5173 and lacked dependency optimization resolution. Preserved as `evidence/server-receipt-attempt-01.json`.
- Second attempt used OS port 56635 but failed package resolution because a Vite-created directory occupied the intended dependency-link path. Preserved as `evidence/server-receipt-attempt-02.json` and `evidence/attempt-01-vite-node_modules/`.
- The successful isolated setup used a real private dependency symlink and OS port 56706.
- The first harness logger read its reactive record collection inside the mirrored effect, creating a private diagnostic feedback loop. It was corrected with Svelte `untrack`; no affected snapshot was accepted.
- Initial export attempted `structuredClone` on a Svelte proxy and failed. JSON serialization replaced it, and both variants were replayed cleanly from reset state before freezing evidence.
- No Tauri/WebKit, native/backend, chart/paint, flame graph, timing bound, overhead, parity, fresh-process replay, or owner acceptance gate ran in B12.

## Immutable evidence index

The final index contains 24 regular immutable files. It excludes the dependency symlink, Vite's preserved attempt cache, and the index file itself. Frozen snapshot and index hashes:

| Artifact | SHA-256 |
|---|---|
| `evidence/current-snapshot.json` | `98a615b3efdbcd66c618304c142f941d8f59a9fa2e58f1ec01e9fc2676b47c7a` |
| `evidence/capture-snapshot.json` | `18bcb815ad84f790e69985a6d3d338672924aa88d961d127d2dd845923f781ba` |
| `evidence/ordering-summary.json` | `44b53eba03275a28d6df6dff9f541329a7e1e988725a65c49ffdf2edd7588651` |
| `evidence/compile-ordering.json` | `2c43f9a97408540e5f4dfa71aee5739e88fe1437649a3b467c64614cd8ffe7a5` |
| `evidence/preservation.json` | `a1df0d34deb33637c063363c3acd0cdc2727e9a6c21cf57d8f3a9aac1a880b79` |
| `evidence/server-receipt.json` | `967cc9ce15c1f305232fe838d2642d2a1e5049a6918a7b543e51a9afbcae9640` |
| `evidence/immutable-index.sha256` | `a89abd024f31fa001ca5b1c332e65d4a5480677a2a1b465a1690cf7115ae486c` |

The authoritative per-file digest list is `evidence/immutable-index.sha256`. All authored private directories/files were restricted to 0700/0600 as requested.

## Recommendation

Authorize the exact two-file repair and regression fence above, then require a fresh native capture before any performance or aggregate acceptance. The capture-phase change is now a tested causal repair hypothesis; it is not yet production or native acceptance and does not answer the flame-graph question by itself.
