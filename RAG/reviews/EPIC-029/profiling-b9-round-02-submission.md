# AI-IMP-202 B9 Round 02 source submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.38 §10.17.

Verdict executed: `profiling-b9-round-01-verdict.md`, H1-H2 only. Candidate source remains prepared and uncommitted at `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, branch `codex/correctness-wave-01-2026-09-05`, unchanged HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.

## H1 — independent render-config verification

`import-trace-run.mjs` now compares every selected batch's available `renderConfig` with the case render configuration before branching on analysis availability. A matching unavailable-analysis action still records only `ACTION_CASE_CONFIG_UNAVAILABLE` and retains terminal reason `input-target-invalid`. A render mismatch or unavailable expected render records `ACTION_CASE_CONFIG_MISMATCH` alongside analysis unavailability, so the existing `trace-to-run.mjs` precedence yields `acquisition-binding-unverified`.

The comparison emits at most one mismatch code when both available analysis and render config differ. v1, v2 resolved, selected-unavailable rejection, diagnostic invalid reason, and nonselected eligibility behavior are otherwise unchanged. `trace-to-run.mjs` was not touched.

## H2 — exact unavailable event-data schema

The v2 schema's three unavailable `prefixItems` now each require `data`:

- `delivered_input`: exactly `control` from the four supported numeric controls and `targetState: invalid-or-empty`; numeric, boolean, and extra arms are forbidden.
- `input_resolved`: exactly `sourceMatches: true` and `targetMatches: false`.
- `action_outcome`: exactly `status: unverified`, `reasonCode: input-target-invalid`, and `endpoint: null`.

The schema still does not claim cross-location equality for the dynamic control or identity/time relationships. Those remain executed runtime parser/integrity guards.

Permanent regressions assert the schema's required keys, enums, constants, and closed data shapes. Runtime tests accept the positive three-event unavailable fixture; reject missing data on each event; reject unsupported control, numeric target leakage, incorrect resolution/outcome values, and extra outcome fields; preserve the matching-render diagnostic; and cover both mismatched-render and expected-render-unavailable binding precedence.

No draft-2020 validator was installed or reimplemented. The JSON Schema evidence is structural document assertion; the paired wire behavior is executed through the production runtime parser.

## Validation

Focused regression:

```text
node --test scripts/profiling/profiling-trace.test.mjs scripts/profiling/profiling-trace-integrity.test.mjs scripts/profiling/profiling-native-wire.test.mjs
tests 25
pass 25
fail 0
```

Full B9 gates, all exit 0 after the final source edit:

```text
node --test scripts/profiling/*.test.mjs
tests 82
pass 82
fail 0

npm run test -- --run
Test Files 27 passed (27)
Tests 334 passed (334)

npm run check
svelte-check found 0 errors and 2 warnings in 2 files

npm run lint
exit 0

npm run format:check
All matched files use Prettier code style!

cargo fmt --all -- --check
exit 0

cargo clippy --workspace --offline -- -D warnings
exit 0

cargo test --workspace --offline
72 passed; 0 failed; 1 ignored

cargo test -p color-core --no-default-features --test kmeans_snapshots --offline
1 passed; 0 failed
```

The two Svelte warnings are the accepted existing `a11y_no_noninteractive_tabindex` warnings in `VideoPanel.svelte:33` and `ValuesView.svelte:267`. The ignored Rust emitter remains intentionally exercised by `profiling-native-wire.test.mjs` inside the 82-test Node gate.

## Exact correction fence and preservation

Only the three authorized candidate files changed from B9 Round 01:

```text
0502a3f5afe3e74b1f93bc535a32ae82351a7318239d79a4d5ff120ceb31a9fb  tauri-app/scripts/profiling/import-trace-run.mjs
0fc97cae8d33eb88996b0ab57f215dc40580b007e371767d7473bc12178a6f0c  tauri-app/scripts/profiling/schema/trace-record.v2.schema.json
8fd4bb114486b463ef01c7755bb522d1994ed38351a3e4c9f6fe670973256ea2  tauri-app/scripts/profiling/profiling-trace.test.mjs
```

All other 17 B9 source hashes were checked against the Round 01 submission and passed. The accepted 56-path B6 source hash manifest was checked again: 37 remain byte-identical, the same 19 B9 paths differ, and none are missing. The candidate still has exactly the same 57-path status set: those 56 accepted source paths plus the authorized v2 schema. No fourth correction file or new candidate path changed.

The Round 01 B9 report and all earlier artifacts remain untouched. This report is the sole new plan-side artifact.

## Errors, friction, deviations, and evidence limits

- H1 and H2 reproduced as described by the verdict; the focused tests passed on the first implementation run.
- During self-review, the structural assertion and runtime mutation matrix were made explicit for the numeric-control enum as well as the invalid target, so the report does not overstate fixed-shape coverage.
- No gate failed, no old assertion was weakened, and there was no scope deviation.
- Evidence remains source, structural schema assertions, production parser/importer execution, native-emitter interop, and the full source gates. It is not JSON Schema engine execution, a packaged or mounted app, an actual profiling capture, a flame graph, or performance acceptance.
- No dependency install, frontend/native expansion, source split, app build/package/launch/control, runtime capture, or Git mutation was performed.
