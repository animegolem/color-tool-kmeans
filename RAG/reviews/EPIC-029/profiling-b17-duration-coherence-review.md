# AI-IMP-202 B17 renderer-duration coherence review

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.46 §§4, 6, 10.3, 10.25. Review state: **SUBMITTED; installed JS -> Rust JSON -> JS behavior reproduces the complete sequence-3/8 mismatch, and a narrowly bounded importer-only comparison is justified. No implementation, app operation, trace rewrite, import acceptance, or performance claim.**

The retained failure is a false negative in redundant renderer-duration equality, not evidence of a different elapsed interval. For both completed sequences 3 and 8, the renderer calculation from the retained endpoint timestamps is `402.00000000023283` ms. A private probe starts with that exact JS binary64 value, passes it through the candidate's installed `serde_json 1.0.151` without `float_roundtrip`, and reads back `402.0000000002328` ms: exactly one representable value lower, an absolute difference of `5.684341886080802e-14` ms. The independently transported start/end timestamps remain bit-identical and still subtract to the upper value. This exactly matches the unchanged B16 bytes.

Recommendation: repair only `inspectActionEvidence` with an explicit finite, nonnegative, range-bounded, ULP-derived renderer-duration predicate. Keep the event-endpoint difference authoritative for reporting. Do not change Rust dependencies/features, the renderer, schemas, trace bytes, native integer-nanosecond identities, seals, sequence checks, config equality, or any other coherence rule.

## Scope and preservation

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch/HEAD before and after: `codex/correctness-wave-01-2026-09-05` / `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Accepted source manifest: 57 entries; all 57 checked `OK` before and after.
- Exact `git status --short -uall`: 57 entries before and after; final stream SHA-256 `062d3a169ed3010c6ef1b0eb485f7b069a8c212122e9b7da959307da1e46ad1a`.
- Retained B16 raw: 41,843 bytes, mode 0600, SHA-256 before/after `1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652`.
- Private diagnostics root only: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b17.pwNu01`, mode 0700.
- The B14 app, controller, live session, candidate source/config/lockfiles, Git state, B14/B15/B16 evidence and raw trace were not operated on or modified. No suite, app build, native executable, importer-as-repaired, benchmark, or flame graph was run.

The sole build was the brief-authorized private standalone Rust probe under the B17 root, invoked by Cargo offline with its target and generated lockfile under the same root.

## Observed numerical reproduction

The probe package `b17-rust-json-roundtrip-probe` pins `serde 1.0.228` and `serde_json 1.0.151`, matching the candidate lock. It was invoked with:

```text
/Users/golem/.cargo/bin/cargo generate-lockfile --offline --manifest-path <B17>/rust-json-roundtrip-probe/Cargo.toml
/Users/golem/.cargo/bin/cargo run --offline --locked --quiet --manifest-path <B17>/rust-json-roundtrip-probe/Cargo.toml
/Users/golem/.cargo/bin/cargo tree --offline --locked --manifest-path <B17>/rust-json-roundtrip-probe/Cargo.toml -e features -i serde_json
```

The feature tree contains only `serde_json/default` and `serde_json/std`; `float_roundtrip` is absent. Inspection of the installed `serde_json-1.0.151/src/de.rs` shows the active non-`float_roundtrip` path converts the decimal significand to `f64` and divides/multiplies by a `POW10` entry. The feature-gated alternative uses lexical concise-float parsing. The writer serializes the typed value afterward. This explains why enabling a future feature might change future parsing, but it is not by itself an adequate repair for already retained traces and was not assumed or tested as the answer.

Exact observed values:

| Case | JS before Rust | JS bits before | JS after Rust | JS bits after | Endpoints after |
| --- | ---: | --- | ---: | --- | --- |
| B16 seq 3 recorded delta | `402.00000000023283` | `4079200000001000` | `402.0000000002328` | `4079200000000fff` | unchanged; recompute `402.00000000023283` |
| B16 seq 8 recorded delta | `402.00000000023283` | `4079200000001000` | `402.0000000002328` | `4079200000000fff` | unchanged; recompute `402.00000000023283` |
| exact zero | `0` | `0000000000000000` | `0` | `0000000000000000` | unchanged; recompute `0` |

For sequence 3, endpoint bits stay `413257c000000000` and `4132595200000001`; for sequence 8 they stay `4134857b00000000` and `4134870d00000001`. Thus the reproduced discrepancy is entirely the independently transported derived duration moving down one binary64 value. Receipt: `<B17>/roundtrip-receipt.json`, SHA-256 `88e2b37b98c278c15affb60761a8cc158dbd17ce5b3f35fe0cd7deaf4a71743c`.

### Observed versus inferred

Observed directly:

- unchanged B16 JSONL contains the lower recorded duration and unchanged endpoint decimals for sequences 3/8;
- JS subtraction of the parsed retained endpoints yields the upper duration;
- the standalone installed Rust parse/write changes the separately supplied upper duration by exactly one binary64 value while preserving all four retained endpoints;
- the installed feature graph lacks `float_roundtrip`;
- the current Node inspector uses strict `===` for recorded-versus-recomputed renderer durations.

Inferred, with the exact source path and reproduction as support:

- the live renderer originally held the upper derived duration before IPC, because `trace.ts` computes it directly from the same two renderer timestamps and performs no rounding;
- the typed Tauri `f64` deserialization/write path is the cause of the retained lower value. The private probe reproduces that numerical hop, but it is not an instrumented observation inside the historical WebKit/Tauri IPC call.

## Current end-to-end consumption

1. `trace.ts` records each `rendererMs` after only finite/nonnegative cleaning and stores endpoint measurements as JS subtractions. No decimal rounding occurs.
2. The bridge passes the renderer batch object to `profile_append_batch`; Rust receives `renderer_ms: f64` and `BTreeMap<String, f64>`.
3. `profiling_writer.rs` persists the typed batch with `serde_json::to_vec`.
4. `import-trace-run.mjs` parses and organizes the JSONL, then routes every selected v1 or v2 action through the same `buildRun` / `inspectActionEvidence`. Its only relevant v1/v2 branch unwraps `analysisConfig`; it does not alter renderer-duration handling.
5. `trace-integrity.mjs` recomputes every renderer endpoint as `end.rendererMs - start.rendererMs`, then currently requires `outcome.measurements[endpoint] === recomputed`.
6. `trace-to-run.mjs` already reports the recomputed event-derived values from `evidence.values`; it does not report the redundant stored renderer duration. `run_kmeans_ms` remains the stored native result duration, and `native_analyze_aggregate_ms` remains the strict integer-nanosecond delta.

Therefore the authoritative renderer value should remain the recomputed endpoint difference after the redundant stored value passes coherence validation. The repair should change only that validation predicate, not reporting.

## Proposed renderer-duration rule

All inputs and outputs are milliseconds. For each renderer endpoint, let `r` be the recorded outcome duration, `s` and `e` the unique start/end event timestamps, and `d = e - s` recomputed in Node.

1. Reject unless `r`, `s`, and `e` are present JS numbers and all are finite.
2. Reject if `r < 0`, `s < 0`, or `e < s`.
3. Reject if any of `r`, `s`, `e`, or `d` exceeds `2^30 ms` (`1,073,741,824 ms`, about 12.43 days).
4. If either `r` or `d` is zero, accept only exact zero/zero equality.
5. Accept exact nonzero equality.
6. Otherwise accept only when:

```text
abs(r - d) <= min(
  0.000001 ms,
  ulp(s) + ulp(e) + ulp(r) + ulp(d)
)
```

Here `ulp(x)` is the distance from nonnegative finite binary64 `x` to its next greater representable value. Implement `nextUp` through a `DataView`/`BigUint64` bit step, not a percent calculation or `Number.EPSILON * unboundedMagnitude` shortcut.

Bound rationale:

- The four-term envelope conservatively budgets one local binary64 spacing for each separately transported timestamp and duration plus the recomputed subtraction result. It is an acceptance envelope, not a claim that the JSON parser is globally guaranteed to remain within one ULP; any larger transport error remains unverified.
- At the explicit clock ceiling, one ULP is `2^-22 ms` (about 0.238 ns); four such terms are below the independent hard cap of `0.000001 ms` (1 ns). The cap and the pre-equality range check prevent huge timestamp magnitudes from inflating the tolerance or bypassing it through exact-but-meaningless cancellation.
- At the retained sequence-3/8 clock magnitude, the allowed envelope is `4.657749741454609e-10 ms`; the observed difference is `5.684341886080802e-14 ms`, about 8,192 times smaller. A `1e-8 ms` perturbation at a 1,000,000 ms clock is rejected; so is a visible `0.001 ms` perturbation.
- The zero rule prevents `0` from becoming coherent with `Number.MIN_VALUE` merely because subnormal ULP arithmetic is tiny.
- Twelve days is intentionally a profiling-trace validation ceiling, not an app lifetime statement. It is far beyond this 128-action acquisition use while keeping binary64 cancellation explicitly bounded. A trace beyond it remains intact but its affected action is honestly unverified.

No native nanosecond, integer, count, sequence, digest, seal, identity, config, association, event-order or exact string/boolean equality receives tolerance.

## Private predicate diagnostics

The proposed predicate was exercised privately without changing or invoking the current importer as repaired.

- Table diagnostic: 19/19 expected results. It covers ordinary exact values, exact zero, zero versus minimum-positive, adjacent representable duration, both retained serde shifts, cancellation at a large ordinary timestamp, a clearly outside `1e-8 ms` difference, a `0.001 ms` difference, missing, negative, reversed and nonfinite inputs, the exact range ceiling, above-range duration, and huge `2^40 ms` timestamps with exact and adjacent durations. Receipt: `<B17>/proposed-predicate-receipt.json`, SHA-256 `f06b18f5fe30669c90c5a42c54f3d4963f9bfd5fff9cca6382f504bd6c7d2b36`.
- Unchanged B16 diagnostic: four completed actions / 24 renderer endpoint comparisons. Current strict equality passes every endpoint for sequences 6/7 and all but `input_to_request_admitted_ms` for sequences 3/8. The proposed rule makes all 24 coherent; only those two values use bounded-representation-error rather than exact equality. Raw bytes and digest were identical before/after. Receipt: `<B17>/b16-predicate-diagnostic.json`, SHA-256 `d672cfa9cd5134135f90c4138538d019cc39661d5492386f8e825a02985975a9`.

This is predicate evidence only. It is not current importer acceptance and does not change the B16 verdict.

## Compatibility and historical-artifact policy

- Apply the same comparison to v1 and v2 renderer batches. Both schemas carry the same relevant event timestamps and outcome measurement map, and both already share `inspectActionEvidence`.
- Preserve raw recorded decimals and every historical report. Do not rewrite B16 JSONL, its seal, its diagnostic run, the B16 submission, or the B16 verdict.
- After a reviewed tool repair, a newly named, revision-labelled re-import may evaluate the unchanged B16 bytes under the new predicate. Its receipt must identify the repaired tool/source revision and coexist with the old failed result; it must not silently relabel the earlier report.
- A successful new numerical re-inspection would remove only this false-negative coherence defect. It would not establish strict media-import proof, cold/fresh-process parity, profiling overhead, quiet-host distributions, exact A0 replay, performance acceptance, flame-graph attribution, or ticket closure.

## Exact implementation fence proposed for lead ruling

Files to touch:

1. `tauri-app/scripts/profiling/trace-integrity.mjs`
   - add the private constants/`nextUp`/`ulp`/renderer-duration comparison;
   - make `measured` call it with each endpoint's recorded value and unique start/end timestamps;
   - continue returning the existing recomputed `values` unchanged.
2. `tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs`
   - add focused helper and importer-level regressions described below.

Do not touch:

- renderer collection (`tauri-app/src/lib/profiling/**`), bridge code, Tauri/Rust profiling code, Cargo manifests/lock/dependency features;
- trace schemas, `trace-wire.mjs`, `trace-to-run.mjs`, `import-trace-run.mjs`, fixtures except within the named test file, build/case/run manifests or profiling documentation;
- app source outside the two files, B14/B15/B16 artifacts, source hash baseline, the active app, PLAN record/tickets except the Review Lead's own ruling, or Git.

If the implementation cannot remain inside those two files, stop for a revised fence rather than broadening it.

## Regression and gate plan

Focused regressions in the named Node test file:

1. A table test for the exact predicate boundaries listed above, including zero/nonzero, finite/nonnegative/order, `2^30 ms` ceiling, huge-clock rejection and outside-bound values.
2. Re-sealed v1 and v2 completed fixtures with the retained endpoint decimals and one-lower recorded duration. Each must remain completed, and the emitted `input_to_request_admitted_ms` must equal the recomputed upper value `402.00000000023283`, proving reporting authority did not switch to the stored duplicate.
3. For each schema version, mutations beyond the ULP envelope and beyond the clock range must produce the existing `result-association-unverified` terminal with unavailable measurements.
4. Existing exact fixtures and every non-duration coherence mutation must retain current outcomes. Native aggregate equality, seal, ordering, config and association tests remain strict.

Then run the ticket-authorized focused Node test, followed by the normal repository gates if the implementation ticket authorizes them:

```text
node --test scripts/profiling/profiling-trace-integrity.test.mjs
npm run test -- --run
npm run check
npm run lint
npm run format:check
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
```

Stop point: Review Lead ruling on the exact two-file tool-only repair. No owner action is needed, and no performance conclusion follows from B17.
