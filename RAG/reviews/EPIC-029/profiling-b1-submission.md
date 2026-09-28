# AI-IMP-202 B1 implementation submission

Code Lead → Review Lead, 2026-09-05. PROJECT-RECORD rev 0.26. Review only; no commit, merge, issue-state change, app build, app launch, trace capture, or flame graph was performed.

## Carrier and boundary receipt

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Exact B1 source fence: 18/18 files below; no source file outside that fence changed during B1.
- The 16 accepted A1 files were hashed in sorted pathname order before and after B1. Initial and final combined SHA-256 are both `ea93a92f171f565946ccc3f2ad1998fba146cd9350f90c911973d8aa167fe476`.
- Existing A1 untracked state remains preserved. No staging or Git mutation was attempted.

## Exact B1 files and final SHA-256

1. `tauri-app/scripts/profiling/schema/trace-record.schema.json` — new — `5e64e9d2339b66bb888d7a3c0def30b6e097d0ee4f21ab34dcae85dcbd393704`
2. `tauri-app/scripts/profiling/import-trace-run.mjs` — new — `1c3f8cba04c10c513502697fca27e1c2ef0b0ecf27d6a8aebb64b7f094339de1`
3. `tauri-app/scripts/profiling/profiling-trace.test.mjs` — new — `a020f57fc2859b8c57bf047caad7b5f4fc83c1aeb16023fae7809be963f0e6ae`
4. `tauri-app/src/lib/profiling/trace.ts` — new — `dfc3fd334f174c998a04a0c3678ac78b71d8ad35d9c88fdfe7c3018f0e574aed`
5. `tauri-app/src/lib/profiling/trace.spec.ts` — new — `a46248450564ea965b95f481d7eaacba19dd8bd096d045da1bdb4cf47ddcee0d`
6. `tauri-app/src/lib/bridges/profiling.ts` — new — `38de8f926ca17edceb22943e87c5a5658ba4e8f6352dc4c2480d615be588b82a`
7. `tauri-app/src-tauri/src/profiling.rs` — new — `0c78dd5b1bf43c219504a5fdc07b82dca42e2fd3feca3b806f7f268c0b9801a5`
8. `tauri-app/src-tauri/src/main.rs` — modified — `696cd73a293a5706bd24600404c85e40c5be312a1ed059af5ab27b1f0b85ed38`
9. `tauri-app/src-tauri/src/commands.rs` — modified — `4c4571a98df1881f327ade5181d21348166b71832cef16f9d55468ab394e4d59`
10. `tauri-app/src/lib/bridges/compute.ts` — modified — `d471cb280189b490f4f8313bc75d6e633009526abb11003bf4c107082322db36`
11. `tauri-app/src/lib/compute/bridge.ts` — modified — `47cf9addd07f43442ae0ad524e3abadb0bbfd702446d2bb843168854146ab732`
12. `tauri-app/src/lib/stores/analysis.ts` — modified — `d728d54f3960e5f73886cce4e978bada6dba2fec3297f0a623db9e1b973543c3`
13. `tauri-app/src/lib/stores/analysis.spec.ts` — new — `7c3e7ede775f98432b4a22fe933c82adc984d7bfb977df868c047aeac5572437`
14. `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` — modified — `6d9dcf21e6184cca54f840ecf2520dcbcec5fb48bf76353b50f67529e8df9c3e`
15. `tauri-app/src/lib/views/home/ParameterControls.svelte` — modified — `790156b5bf52b8203b3ff4d68f7bb066282f220d0aa2519e827a2a194fa65ecf`
16. `tauri-app/src/lib/views/HomeView.svelte` — modified — `1bd511d2a5155eaea88d55b7f1c34d884b6dcf1723a9d0fc6b6daaa10c3b98c9`
17. `tauri-app/src/lib/views/home/AnalysisCards.svelte` — modified — `aeab1370e7263826c225e645913dda2aefd819895376327b60e143f67c50e2cd`
18. `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` — new — `62efe60c7a7fb793286fbadb747ff3ba7a338f8f83c325d83260589443ef74ca`

`git diff --check` passes. Working state consists of the nine authorized tracked modifications plus the nine B1 new files and the sixteen pre-existing accepted A1 files.

## Implemented contract

- Launch opt-in is `COLOR_TOOL_PROFILE_SESSION=<validated-session-id>`. Disabled startup creates no profiling directory/writer. Renderer performs one cached status handshake per lifetime; disabled actions allocate no IDs, buffers, listeners, timers, RAFs, or batches.
- Native output uses an exclusive file in the private `profiling` subdirectory of the isolated app cache. Session identifiers are strictly validated; callers cannot choose a path. Bounds cover session actions/events/bytes, renderer batch events/bytes, individual renderer events, and per-action native-return/action-close reservations. No fsync or power-loss durability claim is made.
- The input handler timestamps the actual allowlisted target before relying on the bound store. The resolved reactive snapshot is then matched. Invalid numeric transients become unverified evidence. Repeated reactive scheduling for one action is distinct from a new same-key delivered action, which is deduped. Rapid inputs supersede prior observations without changing production cancellation timing.
- Once an action is bound, its full 11-field analysis and 13-field render snapshots are immutable. A later source/result/setting replacement revokes the observation instead of rewriting its admitted identity.
- The compute bridge captures the actual active path once, constructs the shipping request once, privately compares path and normalized request to the admitted snapshot, and sends optional adjacent `profileContext`. Missing optional context preserves the old command contract. Observation callbacks are isolated from valid production results.
- Native receive and aggregate-return records use the native process clock. The aggregate end timestamp is captured before return serialization/write work. The receive record write is inside the measured aggregate and is not called free. Renderer and native clocks are never subtracted.
- Store success/error setters return frozen additive acceptance receipts after existing token checks while preserving cache/state write order and optional-token legacy behavior. Void legacy callbacks cannot advance proof.
- Figure instrumentation wraps only existing enabled/lazily requested SVG generation. It does not mutate `AnalysisResult`, chart output, cache entries, export bytes, or disabled chart behavior. The two `AnalysisCards` instances tag actual chart containers; DOM checks are scoped to the mounted Colors study.
- Completion requires accepted result-object identity, source, full config identity, exact enabled/generated figure set, one scoped DOM container per enabled figure, visible tick, and two visible RAF callbacks. The endpoint is only `associated_result_dom_raf2_approx`; zero enabled figures are unverified.
- Renderer outcome is immutable and separate from persistence. Cancellation cannot be reopened by a late renderer settle. A correlated native return can still be appended later as native span evidence. Write/drop/truncation/session-loss evidence conservatively removes eligibility without creating a second terminal.
- The strict adapter requires an explicit `trace-acquisition-binding` that binds exact trace bytes/session, build-manifest bytes/executable digest, case-manifest bytes/source/config/frame/viewport claims, selected action IDs, complete selected/nonselected accounting, and caller verification status/evidence. It supports repeated explicit per-case selections from one retained mixed trace; no case is inferred by time proximity.
- Eligible completed import maps eight instrumented endpoints with same-clock evidence only. Noncompleted or tainted attempts retain raw evidence but emit unavailable A1 numeric measurements. A successful A1 terminal has `reasonCode: null`; RAF2 is not promoted to physical presentation or correctness.

## Invocation examples

Later controlled acquisition launch opt-in (not executed in B1):

```sh
COLOR_TOOL_PROFILE_SESSION=colors_k46_case01 <controlled-app-launch-command>
```

Importer (implemented and tested; not run on owner media in B1):

```sh
node scripts/profiling/import-trace-run.mjs \
  --trace /absolute/private/raw-trace.jsonl \
  --binding /absolute/private/acquisition-binding.json \
  --build /absolute/private/build-manifest.json \
  --case /absolute/private/case-manifest.json \
  --output /absolute/private/run-record.json
```

Add `--diagnostic` only to retain rejected binding/trace evidence as explicitly unverified and excluded.

## Validation receipts

All required executable gates passed from the candidate using installed dependencies only:

- `node --test scripts/profiling/*.test.mjs`: 68 passed, 0 failed, 0 skipped. Baseline 54 plus 14 B1 strict trace/import tests.
- `npm run test -- --run`: 24 files, 262 passed, 0 failed. Baseline 222 across 21 files plus 40 B1 tests across 3 files (`trace.spec.ts` 29, `analysis.spec.ts` 6, `profiling-contract.spec.ts` 5).
- Targeted B1 Vitest subset: 3 files, 40 passed after the final capacity test; the prior recorded 39-test targeted run preceded that final test. Full-suite 262 is the final authoritative Vitest receipt.
- `npm run check`: 0 errors; the two pre-existing accepted AUD-020 accessibility warnings remain in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --offline -- -D warnings`: passed.
- `cargo test --workspace --offline`: 59 passed, 0 failed; baseline 50 plus 9 native profiling tests.
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline`: 1 passed, 0 failed.

The full deterministic chart/golden suites remained green. Node 20 and Windows gates were not available/run locally. Pure/unit tests do not constitute a live mounted-DOM acceptance pass.

## Required review decisions and incomplete proof

- No app was built or launched, and no trace, media inspection, Instruments capture, process attribution, symbols, flame graph, on/off pair, or output-parity acquisition was performed because B1 expressly fenced those to a later assignment.
- Therefore B1 makes no speed, regression, overhead, color-parity, physical-presentation, exact-decoded-frame, or numerical-correctness verdict. The reported roughly four-second interaction remains an owner observation to investigate, not a measured result.
- CI LOC threshold is 350. Touched/new offenders are: trace schema 534 lines; importer 1,214; adapter tests 690; renderer trace 899; renderer trace tests 680; profiling bridge 396; native profiling implementation/tests 1,577; and touched `HomeView.svelte` 1,016. The exact 18-file fence explicitly placed schema, adapter, state machine/coordinator, native writer/validator/tests, and Home integration in these files and prohibited helper splits. Review Lead must either authorize `[loc-bypass]` on the eventual commit or issue a new split fence; no bypass/minification was applied here.
- Acquisition binding remains caller-asserted until a later controlled operator records verification evidence. Structural digest matching does not prove executable/source provenance by itself.
- Successful file flush means complete bytes written through the process file handle, not fsync or power-loss durability.

## Candid friction / failed approaches

- First integration `npm run check` exposed a non-iterable `NodeListOf` under the configured TypeScript libs. The scoped DOM loop now uses `Array.from`; final check is clean apart from the two accepted warnings.
- The first eight-combination Vitest table used raw nested arrays, which Vitest expanded as positional parameters and caused eight test failures. Cases are now wrapped as named records; all eight combinations pass.
- Adapter review caught that re-stringifying parsed JSON can change Rust f64 spelling and invalidate `acceptedByteCount`. The importer now compares the action close receipt to the captured raw JSONL line byte length including newline.
- A bound action initially allowed later reactive resolution to overwrite its render snapshot. Integration review changed this to equality-only after binding/admission and added a regression test so setting changes revoke the action.
- A hard renderer action cap initially had no durable final loss witness. The last reserved action slot now closes as `trace-dropped`, carrying session drop evidence before later observations are refused.
- One adapter Prettier check was mistakenly invoked from the candidate root, where plugin resolution is unavailable; it was rerun from `tauri-app` and passed. No dependency/install change was made.
