# AI-IMP-202 B9 invalid-input persistence implementation submission

Code Lead -> Review Lead, 2026-09-06. Source acceptance gate only.

## Result

Implemented B8 verdict G1-G7 in the assigned candidate and exact 20-file source/test fence. Source remains prepared and uncommitted. No app packaging, build, launch, attach, capture, runtime namespace/log/preference mutation, media operation, install, dependency/lock change, Git mutation, or cleanup was performed.

Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`

Baseline: HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`; accepted dirty-56 source archive SHA-256 `6ef4ad8b22384f3a4735fac981def4f2c975914318ac6da0ad1c352220ee8e1f`; `color-tool-profile-b6.fnWyNO/attempt-01/source-hashes.after.sha256` verified before implementation.

## G1-G7 mapping

- G1: New native records use schema version 2. `analysisConfig` is exactly `{state:'resolved',value:<old exact config>}` or `{state:'unavailable',reasonCode:'input-target-invalid'}`. IPC retains its existing batch shape with no serialized-record metadata. Node preserves exact v1 flat-config parsing separately, accepts strict v2, and rejects cross-version, mixed-version, and unknown-version shapes. A distinct strict v2 schema was added; v1 schema and historical fixtures remain unchanged.
- G2: The coordinator branches before `createProfileAnalysisConfig` for every invalid numeric control, including quality. It captures source identity plus render config, then synchronously emits exactly `delivered_input -> input_resolved -> action_outcome`, with source true, target false, the single false check, no measurements, no drops, and no admission. Capacity retains sticky trace loss and cannot masquerade as a clean unavailable action. Nonfinite malformed state outside the narrow null arm creates a safe failed capture with no IPC instead of silently sealing successfully.
- G3: Rust validates the exact unavailable arm, rejects unavailable evidence against prior native/action history without changing sequence or reservation policy, and records/rejects a native admission after a persisted unavailable close. Node integrity rejects any unavailable/native phase or true receipt contradiction globally, including nonselected actions. A clean nonselected unavailable action can coexist with a selected resolved action.
- G4: Normal selected unavailable import fails `ACTION_CASE_CONFIG_UNAVAILABLE`. Diagnostic import preserves `unverified/input-target-invalid` only for otherwise intact evidence, with every measurement unavailable and fresh execution unproven. Trace loss now outranks that reason; other binding diagnostics remain `acquisition-binding-unverified`.
- G5: Renderer pre-IPC validation errors are preserved only through the fixed authored allowlist; arbitrary thrown text becomes `trace-flush-failed`. First persistence failure remains sticky, Finish remains generic and nonretryable, and native finalize is not called after known loss. No sequence retry/rebase/skip/reset was added.
- G6: Permanent tests use installed `bind_value` and `effect_root`, a real Svelte writable, the actual coordinator, runner, collector, and production append validator. The only surrogate is explicitly named `nativeTransportStub` and executes after production validation. Rapid `45 -> empty -> 46 -> empty -> 45` produces contiguous batches 1-4 with truthful invalid/cancelled outcomes. Separate tests cover a settled valid admission through accepted result, figure generation and DOM+RAF2 completion; an empty value left past debounce preserves existing runner behavior but has no profiling context/admission; every numeric control; null, undefined, NaN and infinity; boolean resolved input; capacity; disabled/quiesced behavior; terminal immutability; bridge/native/parser contradictions; v1/v2 compatibility; and Rust-emitter-to-Node-import interop.
- G7: Only the exact 20 candidate paths below and this one required plan-side submission were authored. All other candidate and plan files remained untouched.

## Focused executable regression

```sh
cd /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01/tauri-app
npm run test -- --run src/lib/bridges/profiling.spec.ts src/lib/profiling/trace.spec.ts src/lib/views/__tests__/profiling-svelte.spec.ts
node --test scripts/profiling/profiling-trace.test.mjs scripts/profiling/profiling-trace-integrity.test.mjs scripts/profiling/profiling-native-wire.test.mjs
cd src-tauri
cargo test --offline profiling_tests::unavailable -- --nocapture
cargo test --offline profiling_tests::native_validation_rejects_each_unavailable_contradiction -- --nocapture
cargo test --offline profiling_tests::late_native_admission_after_unavailable_close_records_loss_not_a_span -- --nocapture
```

Latest focused outcomes: Vitest `3 passed (3)`, `90 passed (90)` before the final debounce-expired case; that added case separately passed in `profiling-svelte.spec.ts` as `18 passed (18)`. Node focused `tests 23`, `pass 23`, `fail 0`. Rust focused: unavailable filter `2 passed`; strict contradiction `1 passed`; late native admission `1 passed`; all failed 0.

New permanent cases: 25 Vitest cases (10 positive/lifecycle, 15 rejection/failure/edge), 7 Node cases (3 positive/mixed compatibility, 4 rejection/integrity), and 4 Rust cases (1 positive lifecycle, 3 rejection/state). The ignored Rust emitter is exercised explicitly by the Node native-wire test and is not double-counted.

## Full gate outcomes

All required commands exited 0.

```text
node --test scripts/profiling/*.test.mjs
tests 80
suites 0
pass 80
fail 0
cancelled 0
skipped 0
todo 0
```

```text
npm run test -- --run
Test Files  27 passed (27)
Tests  334 passed (334)
```

The two pre-existing profiling-contract error-path tests print expected `TauriComputeError` stderr while passing. The installed-binding regression prints four expected `profile_append_batch` transport-stub invocation lines while passing.

```text
npm run check
svelte-check found 0 errors and 2 warnings in 2 files
```

The warnings are the accepted existing `a11y_no_noninteractive_tabindex` warnings in `VideoPanel.svelte:33` and `ValuesView.svelte:267`.

```text
npm run lint
exit 0

npm run format:check
Checking formatting...
All matched files use Prettier code style!

cargo fmt --all -- --check
exit 0

cargo clippy --workspace --offline -- -D warnings
Finished `dev` profile [unoptimized + debuginfo] target(s) in 2.30s

cargo test --workspace --offline
72 passed; 0 failed; 1 ignored

cargo test -p color-core --no-default-features --test kmeans_snapshots --offline
running 1 test
test kmeans_snapshots_match ... ok
test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out
```

Native total is 72 passing tests across workspace targets plus the one intentionally ignored emitter; the emitter passed through `profiling-native-wire.test.mjs` in the 80-test Node gate.

## Exact fence, SHA-256 and preservation

Relative to the accepted 56-path baseline: exactly 19 existing allowed paths changed, 37 baseline paths remain byte-identical, and the one authorized v2 schema is new. Therefore all 20 allowed paths were touched and no allowed path is left unaccounted. No 21st candidate path changed. Cohesive delta against reconstructed accepted source: 2,287 additions, 68 deletions, net +2,219; 1,491 added lines are test code and 331 are the strict schema document.

```text
bf759b64d9cc30bc6fad86306ddeccba25c918f24af1eb0835127e7095516782  tauri-app/src/lib/bridges/profiling.ts
985ca6eb46a3368f703947fc331080cfad8b00dda0d1b0a990de5dafd9a64370  tauri-app/src/lib/profiling/trace-types.ts
408e29c259678ba7022a54f627704d6cf680a2646d0e4551c41887c6f3ba2ec1  tauri-app/src/lib/profiling/trace.ts
098383e666885fbce34f9bc72ca841473dc6f886843b248e9c8891a807c82bc4  tauri-app/src/lib/views/home/profiling-coordinator.svelte.ts
eca6ce851f32367765494ad6bdee26e45da9dd08e8941f72af7ff567ef456dd1  tauri-app/src-tauri/src/profiling_wire.rs
a855ffe11816ba05b3ae28f6f5ad97933a7c68ad7f168e6189d80c2a0b85346c  tauri-app/src-tauri/src/profiling_validation.rs
327e373de90d562fef4ba78d709008f7fa68a2cbc01a7dc15761c0527970210d  tauri-app/src-tauri/src/profiling.rs
b06dddb53a14e690123bd6e589cc4a9411b7c99728fbfe6a424de50f453f543e  tauri-app/scripts/profiling/trace-wire.mjs
01b489a37e45ad76d75f5dd4ba9eba5805210c051ff0d872c931e46eea8a909c  tauri-app/scripts/profiling/trace-integrity.mjs
1d5c2455acc82fd86a6da188f5b5d8c8270fa5484212d70872a7bff7b67d2937  tauri-app/scripts/profiling/import-trace-run.mjs
2b42d058731c09224fd28d2cfb6bed77957e2802502d92daed7a93c38c8dfe41  tauri-app/scripts/profiling/trace-to-run.mjs
94990d9c911e6cc848beabd00b72cef46f966ef4ed2ce9bb14323f01c345d86b  tauri-app/scripts/profiling/schema/trace-record.v2.schema.json
136618ea9ee05f011b90e676081a1b2ee12c58191b54948095db175dce6237f2  tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts
a81a9a9a7cdbafddfc7e7e31a2b9bd200a308fcc89fc3925a41c6196b2e230e8  tauri-app/src/lib/profiling/trace.spec.ts
3bcd16e5be4a85eeee669a4302519b0a1c1b36631c1f890b3daa2f3c54f4f5d3  tauri-app/src/lib/bridges/profiling.spec.ts
602f2941f606f9bab87e7b49979bbc190c58ec3ba8fffa8e53f86a722c069ef2  tauri-app/src-tauri/src/profiling_tests.rs
6a36f17f24d6031e3fd5035c5a8605c68597fbd4f3c37f71629d1625ea19585e  tauri-app/scripts/profiling/trace-fixtures.mjs
b4de36600b44852dd0999a819fd7b06a982685d9d61212e2f37493073166630b  tauri-app/scripts/profiling/profiling-trace.test.mjs
34a62aba401846a52ce844c521b6183fa2bc68a0d13b8ec9a0e157ccd7585bf4  tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs
2fa2c7ff7f4cd99501ca842af67e5ae1f4071de2958ed15817de06e093c56f03  tauri-app/scripts/profiling/profiling-native-wire.test.mjs
```

Explicitly preserved by baseline SHA check: `trace-config.ts`, `trace-dom.ts`, `trace-fixtures.ts`, `ParameterControls.svelte`, `HomeView.svelte`, `analysis-runner.svelte.ts`, stores, compute bridge, App/ProfileCaptureControl, `profiling_writer.rs`, commands/main, old v1 schema, case/run/binding schemas, summaries/redaction tooling, package/config/lock/dependency files, and every other member of the accepted source set.

## Evidence limits, friction and deviations

- Evidence is source, installed-runtime regression, production validator/parser/native writer tests, and full gates. It is not mounted-app, packaged-app, numerical-parity, profiling-overhead, flame-graph, or fresh isolated runtime acceptance. Those remain the later build/runtime gate.
- The surrogate transport is intentionally limited to strict sequence checking and receipts after the real production bridge validator. It does not claim native validation success. Actual native validation and writing are covered separately by Rust tests and the Rust-emitter-to-Node-import test.
- During implementation, the first native-wire run exposed the required v2 resolved wrapper in its case-binding helper; fixed before gates. A native late-admission regression then exposed that a fresh receive could follow a renderer-only unavailable close. `profiling.rs` now keeps a narrow unavailable-action set and rejects/records that late call; writer reservation/finalization code remains untouched.
- A focused Rust assertion initially overconstrained every malformed unavailable variant to one error string; variants correctly rejected at different earlier validation layers. The assertion was corrected to require rejection, without weakening payload coverage.
- A diagnostic test exposed reason precedence; trace loss now correctly outranks intact invalid-input diagnostics.
- No ticket deviation, skipped gate, weakened old assertion, minification, app execution, or scope expansion occurred.
