# IMP-202 A1 — durable profiling records and summarizer submission

Code Lead → Review Lead, 2026-09-05. PROJECT-RECORD rev 0.22 §10.7. Implemented against `profiling-a1-implementation-brief.md` on candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, branch `codex/correctness-wave-01-2026-09-05`, clean base `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`. Changes remain uncommitted for lead review. This is a partial AI-IMP-202 slice, not issue closure.

## Boundary

Exactly eight new candidate files, all under `tauri-app/scripts/profiling/`:

1. `README.md`
2. `build-manifest.mjs`
3. `validate-manifest.mjs`
4. `summarize-runs.mjs`
5. `schema/build-manifest.schema.json`
6. `schema/case-manifest.schema.json`
7. `schema/run-record.schema.json`
8. `profiling-tools.test.mjs`

`git ls-files --others --exclude-standard` reports those eight files only. `git diff --check` passes. No existing candidate file changed. No app/core/native/config/package/lock/fixture/CI file, dependency, build, Git state, instrumented source, IMP-178 surface or other worktree was touched. No app was controlled or launched by Code Lead during A1.

## Implementation

### Record and schema choices

- Three strict v1 JSON record types use `additionalProperties: false` and matching runtime validators. Build/case/run versions and kinds are fixed; unknown fields and versions fail.
- Build identity separates claims from proof. Commit is an exact 40–64 digit hexadecimal identity. Dirty may be true, false or explicitly unavailable; unknown cannot become clean. UUID, profile, compiler flags and toolchain values carry `asserted`, `verified-file`, `external-reference` or `unavailable` status with evidence-kind matching. Executable and explicit lock/symbol/source-map/sidecar artifacts require SHA-256-matching hash evidence. Symbol artifact identity does not imply lookup correctness; lookup proof remains an external evidence reference.
- `collectBuildManifest()` hashes only explicitly named absolute regular files. It has finite count/size limits, rejects relative paths and symlinks, and performs no scan, network request, build, launch or shell execution. The CLI is `--spec FILE [--output FILE]`; stdout is redacted when no destination is given.
- Case records use opaque source IDs plus digest. Private path mapping is a separate opaque reference. Requested/achieved seconds, `exact|unmatched|unverified` status and optional decoded-frame digest are independent. Full analysis/render config uses typed `{value, unavailableReason}` fields; missing never becomes zero. CSS viewport width/height/scale use the same availability contract. Source and runtime-config verification states are separate.
- Run records bind full build/case/source/config/frame identities, then retain ordered attempts. Each attempt has unique attempt/action/terminal IDs, one terminal, role, action, fresh-execution evidence, process/cache/workload/visibility strata, measurements and an enumerated exclusion reason. Fresh execution and eligibility are deliberately independent: a proven new request can still be wrong-source and excluded.
- Measurement identity retains endpoint, unit, clock, method, precision and evidence level. UI transcription, app log, instrumentation and presented evidence remain distinct. Nonfinite/negative values, duplicate measurement identities and durations attached to non-completed terminals fail. Timeout durations remain null/censored.

### Summarization and privacy

- `summarizeRunRecords()` validates inputs, rejects duplicate run/attempt IDs across inputs and rejects one opaque build/case ID resolving to mixed identities.
- Group keys prevent pooling across build, case/source/config, requested/achieved frame and frame status, operation, process/cache/workload/visibility, endpoint/unit/clock/method/precision/evidence level.
- Each group reports attempt, role, terminal, fresh-execution and exclusion counts; measured/eligible/unavailable counts; raw eligible values; median/min/max. Only completed measured attempts with proven execution, no exclusion and an available value enter arithmetic. Warmups, resets, setup, hidden, cache, dedupe, stale, cancelled, failed, timeout, unverified and wrong-source outcomes remain counted. No p95, ratio, SLA, regression, overhead or cross-clock derivation exists.
- Redacted outputs are constructed from allowlists. They omit paths, source basenames, evidence refs, notes, commands, toolchain versions, compiler flag values and raw log/error text. CLI failures expose stable codes only.
- Explicit JSON inputs must be finite regular files and may not be symlinks. Private output requires an existing mode-private directory whose resolved ancestry is outside any Git worktree. The writer refuses symlink ancestry into worktrees and existing destinations, creates mode `0600` with `wx`, and never alters source evidence. Default output is redacted stdout.
- `README.md` documents the record model, exact CLI syntax, privacy/write contract and explicit Node test command. Module imports have no CLI side effects.

## Tests and gates

All commands ran on the final candidate tip unless noted.

From `tauri-app/`:

- `node --test scripts/profiling/profiling-tools.test.mjs` — **34 passed, 0 failed**. Coverage includes accepted build/case/run vectors, schema/runtime top-level agreement, unknown fields/versions, unavailable-vs-zero, config types, exact-frame conflict, dirty unknown, exact commit IDs, evidence-kind matching, duplicate attempt/evidence/action/terminal identities, terminal conflicts, negative/nonfinite values, censored timeout, fresh proof versus exclusion, known medians/ranges, all terminal outcomes, every non-pooling dimension, close-timestamp frame-status separation, merged-reference collisions, deterministic output, privacy allowlists, explicit file hashing, relative/symlink/unknown collector inputs, finite input limits, exclusive private writes, Git/symlink ancestry, CLI arguments, import side effects and redacted errors.
- `npm run test -- --run` — **21 files, 222 tests passed**.
- `npm run check` — **0 errors, 2 accepted AUD-020 accessibility warnings** in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` — pass, no output beyond command banner.
- `npm run format:check` — pass, all matched files use Prettier style.

From `tauri-app/src-tauri/`:

- `cargo fmt --all -- --check` — pass, no output.
- `cargo clippy --workspace --offline -- -D warnings` — pass; finished dev profile.
- `cargo test --workspace --offline` — **50 passed, 0 failed** across workspace/unit/integration/bin suites; doc tests 0/0.
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline` — scalar path **1 passed, 0 failed**.

Local `node` is v26.8.1. Targeted checks found no installed `/opt/homebrew/opt/node@20`, `/usr/local/opt/node@20` or Homebrew `node@20` binary, so explicit Node 20 execution was **unavailable and not downloaded or installed**. The implementation uses Node APIs available in Node 20 (`node:test`, `structuredClone`, fs/promises, async stream iteration) and declares no dependency.

## Real A0 normalized proof

Original evidence remained read-only at:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/run-01.hilHbt`

New owner-private projection root, mode `0700`:

`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/a1-normalized-run01.EVayAy`

Authoritative projection artifacts:

- `build.v1.json` — SHA-256 `789d3e0364af703d8d9d59786385f0c495594ad1d258f852a19910f3f826d382`
- `case.v1.json` — SHA-256 `20c20e6825f1a9d37c120fff45f9dd995342f2a8b99e71cdf5f7410690915c3b`
- `case-config-canonical.json` — SHA-256 `7957a08446b63026c0111d7ac4098e0ce91f6993200be4d4ed95630829b4ef3b`
- `run.v1.json` — SHA-256 `56fe5e2fc334931451b8fa9a14117d9ee7ed81c1b2c603b9ee56951dee6dbc2f`
- `summary.final.v1.json` — SHA-256 `a2a38c54e72a58deae97545f44cacfdb1b7012a80dc19a91baf05b83b16fce42`, mode `0600`
- `source-path-map.private.json` — SHA-256 `965acdef5d0a919bf891478a6477c86dbb34ee169b44c7f46d6571ed1048ef12`

All three v1 records pass the new CLI validator. The run retains **31 attempts**. Case status is explicitly `unmatched`: requested 58.4163 s, achieved 58.4210 s, decoded-frame digest unavailable/not-collected. It does not assert pixel identity.

The generated summary has nine non-pooled groups:

- warm / visible / UI transcription: six eligible measured values `93, 95, 104, 94, 100, 93`; median **94.5**, min **93**, max **104** ms
- warm / visible / app-log interval: six eligible values `123, 133, 139, 125, 133, 124`; median **129**, min **123**, max **139** ms
- warm / hidden: trial 1 remains a separate counted/eligible group, UI `95` ms and log `132` ms; it is not invisibly discarded or pooled with visible trials
- warm / mixed: warmup 1 remains counted and excluded
- fresh / visible wrong-source: one completed attempt remains counted for each endpoint, exclusion `wrong-source`, **zero eligible fresh-process target samples**
- setup, unmatched-frame, reset and warmup attempts remain in role/exclusion counts; four unavailable UI transcriptions form a separate precision-null group rather than zeros

The private run evidence preserves the historical owner report as approximately 4000 ms **displayed `run_kmeans` time**, not whole-app duration and not an A0 attempt. Redacted summary output contains no `/Users`, Desktop/source basename, command, note or raw-error content.

## Deviations and friction

- Node 20 was not locally available; explicit Node 20 validation is the sole unrun requested environment check.
- The first focused test run had two incorrect test expectations: hard-coded SHA vectors and macOS `/var` versus canonical `/private/var`. Both were corrected; no implementation workaround was needed.
- The first real A0 validation exposed an over-strict rule that equated proven fresh execution with eligibility. That would have rejected the genuinely executed wrong-source fresh-process diagnostic. The rule now keeps proof and exclusion orthogonal, with regression coverage.
- `summary.v1.json` in the private projection root is a retained superseded tool outcome created before the normalized build claims were tightened from caller assertion to external-reference evidence and the resulting build digest was rebound. Write safety correctly refused overwrite. `README.md` in that directory labels it non-authoritative; `summary.final.v1.json` is the submission artifact.
- Strict LOC requires lead handling: `validate-manifest.mjs` is 1,015 lines and `profiling-tools.test.mjs` is 932 lines. The exact eight-file fence leaves no additional helper/test-file seam; use `[loc-bypass]` if accepted rather than silently changing the fence. Other new files are under 400 lines.
- No screenshot, profiler capture, app interaction, new bundle or instrumentation was produced in this slice. Lead-owned native-control proof is separate and did not change this fence.
