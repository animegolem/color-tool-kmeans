# A1 Round 02 implementation submission

Code Lead → Review Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev0.23. Review state: **SUBMITTED; uncommitted; not accepted; no ticket completion.**

Assignment: R1–R8 from `profiling-a1-round-01-verdict.md`. Candidate remains `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2` on `codex/correctness-wave-01-2026-09-05`.

## Boundary receipt

`git status --short --untracked-files=all` reports exactly the 16 authorized untracked files below. `git diff --stat` is empty: no tracked candidate file changed. No app control, launch, profiling trace, package/bundle build, configuration, dependency, Git history/ref/index, ticket/index/record, or IMP-178 change was made. No commit was attempted.

Original eight:

- `tauri-app/scripts/profiling/README.md`
- `tauri-app/scripts/profiling/build-manifest.mjs`
- `tauri-app/scripts/profiling/validate-manifest.mjs`
- `tauri-app/scripts/profiling/summarize-runs.mjs`
- `tauri-app/scripts/profiling/schema/build-manifest.schema.json`
- `tauri-app/scripts/profiling/schema/case-manifest.schema.json`
- `tauri-app/scripts/profiling/schema/run-record.schema.json`
- `tauri-app/scripts/profiling/profiling-tools.test.mjs`

Round 02 additions:

- `tauri-app/scripts/profiling/validation-primitives.mjs`
- `tauri-app/scripts/profiling/validate-build.mjs`
- `tauri-app/scripts/profiling/validate-case.mjs`
- `tauri-app/scripts/profiling/validate-run.mjs`
- `tauri-app/scripts/profiling/private-files.mjs`
- `tauri-app/scripts/profiling/profiling-fixtures.mjs`
- `tauri-app/scripts/profiling/profiling-files.test.mjs`
- `tauri-app/scripts/profiling/profiling-summary.test.mjs`

All 16 files are below 400 lines. Largest implementation file: `validate-run.mjs`, 396 lines. Largest test file: `profiling-tools.test.mjs`, 385 lines. No LOC bypass is requested.

## R1–R8 corrections and regression evidence

### R1 — real quality domain

- Case runtime validation and schema now accept only integer quality presets 0, 1, 2, 3, and 4.
- Regression tests exercise all five accepted presets and reject -1, 5, 1.5, NaN, and Infinity.
- App controls and numeric policy were not touched.

### R2 — coherent frame and measurement evidence

- Case and run validation share one exact-frame rule. `exact` requires available requested and achieved timestamps with equal numeric values. Two `not-applicable` nulls and unequal timestamps are rejected as `FRAME_STATUS_CONFLICT`.
- Decoded-frame digest remains independent; timestamp equality is not treated as decoded-pixel identity.
- Each measurement method now requires its exact evidence level and at least one referenced evidence item of the matching kind for an available measurement: UI transcription → UI transcription, app-log interval → app log, instrument span → instrumentation, and presented observation → presented evidence.
- Available measurements with empty references fail. UI/app-log evidence cannot satisfy a presented observation. Unavailable measurements retain explicit unavailable reasons and may have no evidence; supplied references must still include the method-matching kind.
- Fresh-request proof remains separate from eligibility and explicit exclusions.

### R3 — endpoint-independent attempt accounting

- Summaries now include `attemptGroups`, grouped by build, full case identity, operation, and process/cache/workload/visibility strata.
- Every attempt enters one attempt group once, even with zero measurements. Attempt groups retain role, terminal outcome, fresh-execution, exclusion, measured, measurement-bearing, zero-measurement, and measurement totals.
- Endpoint-specific `groups` remain separate for latency arithmetic. Tests prove a two-endpoint attempt counts once in `attemptGroups`, and a zero-measurement failure remains in failure/exclusion totals while producing no endpoint group.

### R4 — canonical semantic identity

- Recursive plain-object key sorting now produces canonical comparison/group keys. Ordering uses code-unit comparison rather than locale-dependent collation.
- Known strata/case/build/measurement identities are constructed field-by-field; ordered attempts and raw included sample order remain intact.
- Tests recursively reverse input property order, reverse record order, preserve one semantic group/reference, and still reject genuinely changed case/build values.

### R5 — bounded descriptor reads and hashes

- JSON reads and build hashes now use the checked regular-file descriptor, read at most `maxBytes + 1`, and compare descriptor/path identity, size, mtime, and ctime before accepting the capture.
- Invalid byte limits are rejected before file access. Leaf symlinks, initial oversize, replacement/type changes, mutation, and growth beyond the bound fail with stable codes. Handles close in `finally` on success and failure.
- Deterministic tests append after the first bounded chunk and replace the path after the first chunk, then verify failure cleanup by renaming/removing the files.
- Ordinary ancestor symlinks are resolved. A private symlink target outside Git is accepted; a target inside Git is rejected. The README documents this boundary.
- Build-spec file/evidence/toolchain/compiler-flag counts are checked before hashing; actual bounded bytes alone enter SHA-256.

### R6 — safe redacted identifiers

- Every caller-controlled ID that can reach successful build output or run-summary keys is replaced with a deterministic, namespace-bound SHA-256-derived identifier. Stable joins remain possible within `build-id`, `case-id`, `artifact-id`, `build-evidence-id`, `toolchain-name`, `measurement-endpoint`, and `measurement-clock`; equal raw strings do not join across namespaces.
- Redacted output functions use explicit allowlists. Unknown caller-added group fields do not pass through.
- Filename-shaped sentinel tests cover build ID, artifact ID, evidence ID, toolchain name, case ID, endpoint, clock, CLI success output, private input path failures, local paths, refs, notes, commands, and raw errors. No regex-only path scrub is used.

### R7 — schema/domain and bounded-statistics coverage

- Build commit claims accept exactly 40 or 64 lowercase hexadecimal digits. Available executable UUID claims require the 8-4-4-4-12 hexadecimal UUID shape; unavailable UUID remains explicit.
- Case/run schema availability wrappers now encode null ↔ unavailable-reason consistency. Run schema encodes method/evidence-level pairs, available-measurement evidence cardinality, terminal-status/reason consistency, and proven-fresh evidence cardinality. Runtime retains documented cross-record/cross-field rules that JSON Schema cannot express, including timestamp equality and evidence-reference kind lookup.
- Nested schema tests cover emitted build executable/artifact/toolchain/evidence/claim structures, case source/frame/config/viewport/verification/evidence structures, and run refs/attempt/strata/action/terminal/fresh/measurement/evidence structures, plus representative rejection vectors.
- Minimum/maximum calculation is an iterative bounded reduction, not spread arguments. A 200,000-value test passes; values above the accepted merged maximum, negative values, and nonfinite values fail.

### R8 — approved cohesion seams

- `validate-manifest.mjs` remains the import-compatible public facade and CLI.
- Shared constants, primitive checks, canonicalization, safe errors, and ID redaction live in `validation-primitives.mjs`; record domains are split across the three approved validators; descriptor and private-output policy lives in `private-files.mjs`.
- Synthetic fixtures are test-only. Record/schema, filesystem/privacy, and summarization/statistics tests occupy the three approved test modules.
- Validation constants and common provenance-evidence rules are shared rather than duplicated across record validators. No production dependency or framework was added.

## Focused and full gates

Focused profiling tests are deliberately separate from ordinary Vitest discovery.

- `node --test scripts/profiling/*.test.mjs` — **52 passed, 0 failed** (14 filesystem/privacy + 14 summary/statistics + 24 record/schema/API tests).
- `npm run test -- --run` — **21 files passed, 222 tests passed**. This is the unchanged ordinary Vitest count; it does not discover the 52 Node tests.
- `npm run check` — **0 errors, 2 accepted AUD-020 warnings** in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `cargo fmt --all -- --check` — passed.
- `cargo clippy --workspace --offline -- -D warnings` — passed.
- `cargo test --workspace --offline` — **50 passed, 0 failed**; doc tests 0.
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline` — **1 passed, 0 failed**.

Local runtime is `/opt/homebrew/bin/node` v26.8.1. No existing Node 20 executable was found under `/opt/homebrew/opt/node@20`, `/usr/local/opt/node@20`, `/opt/homebrew/Cellar/node@20`, or `/usr/local/Cellar/node@20`; Node 20 remains unrun. Nothing was installed or downloaded.

## New private A0 normalized projection

New additive directory, mode 0700:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/a1-normalized-round02.gyCm1Z`

All contained files are mode 0600. Older raw evidence and projections remain unchanged.

- `README.md` — `9321273d5c73c430798a91749e898f699e96dd1beb1d8654eb6b37dcbd6d5fe1`
- `build.v1.json` — `789d3e0364af703d8d9d59786385f0c495594ad1d258f852a19910f3f826d382`
- `case-config-canonical.json` — `7957a08446b63026c0111d7ac4098e0ce91f6993200be4d4ed95630829b4ef3b`
- `case.v1.json` — `20c20e6825f1a9d37c120fff45f9dd995342f2a8b99e71cdf5f7410690915c3b`
- `run.v1.json` — `56fe5e2fc334931451b8fa9a14117d9ee7ed81c1b2c603b9ee56951dee6dbc2f`
- `source-path-map.private.json` — `965acdef5d0a919bf891478a6477c86dbb34ee169b44c7f46d6571ed1048ef12`
- `summary.v1.json` — `2dd90b8c3790cdb3d9a5aee592bcdd55c8ae5c53bc95e26a6fc646ff0cb44013`
- `summary.redacted.v1.json` — `2dd90b8c3790cdb3d9a5aee592bcdd55c8ae5c53bc95e26a6fc646ff0cb44013`

Projection checks:

- Build, case, and run validate with the Round 02 CLI.
- `inputAttemptCount=31`; four attempt groups sum to exactly 31. This total is not obtained by summing endpoint groups.
- Nine endpoint groups remain. Requested 58.4163 s and achieved 58.421 s remain `unmatched`; decoded-frame digest remains unavailable.
- Warm/visible UI transcription: 6 eligible values `[93,95,104,94,100,93]`, median 94.5, min 93, max 104.
- Warm/visible app-log interval: 6 eligible values `[123,133,139,125,133,124]`, median 129, min 123, max 139.
- Hidden trial remains separate: one eligible UI value 95 and one eligible app-log value 132.
- Fresh-process attempt is proven executed but excluded as `wrong-source`; both endpoints have 0 eligible values. There is no valid fresh-process target sample.
- Four unavailable UI transcriptions remain null in a distinct precision-null group; they are not zero-duration values.
- The two separately generated redacted summaries are byte-identical. Sentinel scan for `/Users`, `Desktop`, the private source name, raw-error text, and command text is clean.

## Candid friction and residual limits

- The first split passed all 52 new tests, but self-review found two issues before submission: shared build/case provenance validation was still duplicated, and a generic spread in redacted summary groups could have forwarded an unknown caller field. Both were removed; common validation is now centralized and redaction is explicitly allowlisted.
- The schema pass initially documented quality and measurement pairing but did not encode every null/reason availability relation. The final schemas add a shared availability conditional and terminal/fresh cardinality constraints; focused tests were rerun afterward.
- Deterministic concurrent mutation tests use the production chunk callback seam to mutate the file after its checked descriptor is open. The implementation detects descriptor/path metadata changes, but it does not claim protection against an account owner deliberately restoring inode, size, and timestamps during capture.
- The new projection reuses byte-identical immutable build/case/run/config/path-map inputs from the earlier normalized A0 projection and regenerates only the Round 02 summary. This keeps the underlying observations stable while exercising the corrected summarizer.
- No Node 20 runtime was locally available, so CI-runtime confirmation remains a review/CI concern.

Stop point: review gate. No integration, commit, ticket completion, owner question, app trace, or further polling is authorized.
