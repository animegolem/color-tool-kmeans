# AI-IMP-202 B18 bounded renderer-duration submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.47 §10.26. Review state: **SUBMITTED; exact two-file importer/inspector repair complete, all required gates pass, and the unchanged B16 trace is numerically coherent under the approved bounded policy. No app rebuild/control, trace mutation, fabricated acquisition binding, Git action, or performance claim.**

## Result

`inspectActionEvidence` now compares each redundant recorded renderer duration with its unique event-endpoint span under the B17-approved policy:

- every operand must be a present finite number;
- recorded/start must be nonnegative and end must not precede start;
- recorded, start, end and recomputed duration must each be at most `2^30 ms` before exact comparison;
- if either duration is zero, only exact zero/zero is coherent;
- nonzero exact equality remains coherent;
- otherwise the permitted difference is `min(0.000001 ms, ulp(start) + ulp(end) + ulp(recorded) + ulp(recomputed))`.

`ulp` is the next-higher binary64 spacing computed with a `DataView` bit step. The hard domain and 1 ns ceiling prevent clock-magnitude tolerance inflation. Unique endpoint requirements and every other action, native integer, identity, sequence, seal, association and config check remain exact.

The inspector continues to return renderer measurements computed from event endpoints. It uses the redundant recorded values only for coherence, so `trace-to-run` reporting authority did not change.

## Exact source boundary

Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`

- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Baseline full 57-path inventory SHA-256: `bd2e849680dba22f2a5568e919f16a20afba00fbeb42089e5e9ec89105e12e21`
- Exact `git status --short -uall`: 57 entries before/after; stream SHA-256 remained `062d3a169ed3010c6ef1b0eb485f7b069a8c212122e9b7da959307da1e46ad1a`.
- The other 55 baseline paths rechecked `OK` after implementation.

Only the authorized two candidate files differ from the accepted baseline:

| File | Baseline SHA-256 | B18 SHA-256 | Lines after |
| --- | --- | --- | ---: |
| `tauri-app/scripts/profiling/trace-integrity.mjs` | `01b489a37e45ad76d75f5dd4ba9eba5805210c051ff0d872c931e46eea8a909c` | `e739f7aa0aef0c9a322c41352757eec7224d56cc3abff5ca0d4e663d8f093692` | 438 |
| `tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs` | `34a62aba401846a52ce844c521b6183fa2bc68a0d13b8ec9a0e157ccd7585bf4` | `61d9a514bbaedba7ee44522595a2c460d3d33d8d79ce19cf4712bdbe224cc639` | 841 |

The checker grew from 392 to 438 lines and now exceeds the 400-line CI policy; the existing test was already above it and grew from 639 to 841. The implementation is a cohesive local numerical policy plus its integration matrix, and the brief prohibited a new helper file/broad refactor. No minification was used. Review Lead should retain `[loc-bypass]` in the eventual commit unless it authorizes a separate extraction.

## Permanent regressions

Five new production-path tests were added without exporting a generic epsilon utility or copying the production predicate:

1. Re-sealed v1 and v2 imports reproduce the retained sequence-3/8 one-lower duration and remain completed. Both assert that the run reports the recomputed upper endpoint value, not the stored duplicate.
2. A v2 import moves both timestamps by adjacent binary64 values toward each other, exercising actual endpoint transport and cancellation. The recomputed value remains authoritative.
3. Re-sealed v1 and v2 imports at the `1.0` power-of-two spacing boundary prove `+3`/`-5` representable steps are just inside and `+4`/`-6` are just outside the local ULP envelope. Outside cases retain `result-association-unverified` and unavailable measurements.
4. Exact zero, zero/nonzero in both directions, the exact domain ceiling, just-above-domain and huge `2^40 ms` exact spans prove zero and range checks occur before the equality shortcut.
5. Missing recorded measurements import as unverified. Negative/nonfinite recorded values and negative/nonfinite endpoint values fail the real inspector; decreasing persisted event time retains the existing earlier `INVALID_EVENT_ORDER` parser failure.

Existing tests continue to cover contradictory association evidence, native integer aggregate mismatch, mixed clocks, sequence/close ordering, loss/taint and incomplete seals. The full v1/v2 import suites preserve those error priorities.

## Required gates — verbatim results

Focused Node inspector/importer:

```text
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

All profiling Node tests:

```text
ℹ tests 87
ℹ suites 0
ℹ pass 87
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Frontend Vitest:

```text
Test Files  27 passed (27)
     Tests  335 passed (335)
```

Svelte check:

```text
svelte-check found 0 errors and 2 warnings in 2 files
```

The two warnings are the accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`; neither file was touched.

Lint and formatting:

```text
> eslint .
exit 0

Checking formatting...
All matched files use Prettier code style!
exit 0
```

Rust formatting and clippy:

```text
cargo fmt --all -- --check
exit 0

Checking tauri-app v1.0.2 (.../tauri-app/src-tauri)
Finished `dev` profile [unoptimized + debuginfo] target(s) in 1.89s
exit 0
```

Rust tests (aggregate of the emitted suite totals):

```text
72 passed; 0 failed; 1 ignored
```

The single ignored test is the intentional `profiling_tests::emit_native_interop_fixture`, which is invoked explicitly by the passing Node native-wire interop test. All Cargo commands used `--offline` where assigned; no install or lock generation occurred.

## Source-labelled B16 numerical reinspection

After all gates, the repaired production `parseTraceJsonl`, `organizeTrace` and `inspectActionEvidence` inspected the untouched raw B16 trace directly in memory. No import run or acquisition binding was fabricated.

- Raw before/after: 41,843 bytes, mode 0600, SHA-256 `1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652`, byte-identical.
- Parsed: schema v2, 26 records, eight actions, untainted.
- All eight actual outcomes are retained: sequences 1/4 unverified invalid-empty, 2/5 cancelled superseded, and 3/6/7/8 completed.
- All four completed actions are coherent under the repaired inspector.
- Across 24 completed renderer endpoints, sequences 6/7 and 22 endpoints are exact. Only `input_to_request_admitted_ms` on sequences 3/8 uses bounded comparison: recorded `402.0000000002328`, recomputed authoritative value `402.00000000023283`, difference `5.684341886080802e-14 ms`.
- Receipt records Node executable/version, policy/domain, inspection-script hash, exact checker/wire hashes, all eight outcomes, all four completed comparisons and both raw digests.

Private evidence root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b18.LVNlpB`, mode 0700; all files mode 0600.

| Evidence | SHA-256 |
| --- | --- |
| `inspect-b16.mjs` | `41df090f85738d8370368166f4173b58d262fbc2b8ed56f9137a7a3d2f0b2861` |
| `b16-numerical-reinspection.json` | `70ed0f60be2902eefe56517c50e96b7ce60d89abbfa0bd389b16087e29b6b06e` |
| `artifact-hashes.sha256` | `f4dcbc59beb1c71f9bc805e7cfb1f7da7c35ec7c3f4373e278c2872bf3df02c9` |

The two indexed artifacts reverified `OK`.

## Preservation, friction and missing gates

- No renderer/app/native/schema/fixture-outside-test/trace-wire/trace-to-run/import-trace-run/manifest/lock/dependency change.
- No B14/B15/B16/B17 evidence or historical report/verdict was rewritten. B16 remains the original failed strict-equality result; B18 is a separately labelled numerical reinspection.
- No app package build, launch, control, restart, media acquisition, benchmark, flame graph, native capture, or Git operation occurred.
- No repaired import was claimed because B18 did not have authority to manufacture the missing acquisition binding. The receipt is explicitly numerical inspection only.
- The only implementation friction is the disclosed LOC threshold. All assigned executable gates passed; no assigned gate is missing.
- One final preservation command was initially invoked from the private B18 evidence directory, so its Git and candidate-relative hash checks failed on the wrong working directory. It wrote nothing and changed nothing; the identical command was rerun from the exact candidate and produced the successful 57-status/55-unchanged/two-new-hash results reported above.
- This repairs a validator false negative. It does not establish media-import strictness, cold/fresh-process parity, profiling overhead, quiet-host distributions, end-to-end performance, flame attribution, owner acceptance, or AI-IMP-202 closure.

Stop point: Review Lead source/evidence review. No owner blocker is asserted.
