# Profiling evidence tools

These Node 20, standard-library-only tools create and check durable profiling evidence records. They do not build or launch the app, invoke a profiler, scan for inputs, run shell commands, or infer unavailable measurements.

## Record model

All records are version 1 and reject unknown fields.

- `build` binds an opaque build ID to an exact executable digest, commit and dirty-state claims, explicit compiler/profile claims, explicitly named lock/symbol/source-map/sidecar files, toolchain claims, and evidence provenance. `null` dirty state means unknown; it is never interpreted as clean. A matching UUID or symbol filename is only the caller's stated evidence level. Symbol lookup proof belongs in a separate external evidence reference.
- `case` binds an opaque case ID to a shareable source digest. Any source path mapping is a separate private artifact referenced only by opaque ID. Requested and achieved timestamps and `exact`, `unmatched`, or `unverified` status are explicit. `exact` requires two available equal timestamps, but timestamp equality never proves identical decoded pixels. Still-image or otherwise unavailable timestamps use `unverified` with `not-applicable`; two nulls are not exact. Analysis quality is the app's integer preset domain 0–4. Analysis, render, viewport, source verification, and runtime verification are resolved fields. Missing values are `null` with an enumerated reason.
- `run` references one build and case, then records ordered attempts. Every attempt has a unique action, exactly one terminal outcome, fresh-execution status, process/cache/workload/visibility strata, and typed measurements. Each measurement method has one matching evidence level and evidence kind; an available value requires a nonempty reference to matching evidence. This checks record consistency, not the truth of caller-supplied evidence content. UI transcription and app-log evidence cannot be promoted to presented evidence. Timeout, cache, dedupe, stale, failed, cancelled, and unverified outcomes remain in the record.

The JSON schemas under `schema/` document the wire shape. Runtime validation adds cross-field checks such as evidence reference integrity, exact-frame consistency, unique IDs, one terminal per attempt, finite nonnegative values, unavailable-vs-zero semantics, and fresh-analysis eligibility.

## Commands

Run commands from `tauri-app/`. Unknown or repeated single-value arguments fail.

Validate one explicit record:

```sh
node scripts/profiling/validate-manifest.mjs \
  --kind run \
  --input /explicit/private/run-record.json
```

Collect a build manifest from one explicit JSON specification:

```sh
node scripts/profiling/build-manifest.mjs \
  --spec /explicit/private/build-spec.json \
  --output /explicit/private-output/build-manifest.json
```

The build specification supplies `version`, `id`, commit/dirty claims, an executable object with `path`, UUID/profile/compiler-flag claims, four explicit artifact arrays (`locks`, `symbols`, `sourceMaps`, `sidecars`), toolchain claims, and evidence. Each file reference is `{ "id": "opaque-id", "path": "/absolute/path" }`. The collector hashes only those named regular files. It rejects symlink inputs, relative paths, excessive counts, and oversized files. With no `--output`, it prints an allowlisted redacted manifest to stdout; full manifests require an explicit safe private destination.

Summarize one or more explicit run records:

```sh
node scripts/profiling/summarize-runs.mjs \
  --input /explicit/private/run-01.json \
  --input /explicit/private/run-02.json \
  --output /explicit/private-output/summary.json
```

With no `--output`, the summarizer prints allowlisted redacted JSON to stdout. It never emits input paths, source basenames, freeform notes, commands, or raw log/error content. CLI failures expose a stable code rather than private input details.

The summarizer never pools differences in build, case/source/config identity, requested or achieved frame, frame status, operation, process state, cache state, workload, visibility, endpoint, unit, clock, method, precision, or evidence level. `attemptGroups` count each attempt exactly once without an endpoint, including attempts with no measurements. Endpoint-specific `groups` report the attempts carrying that endpoint, measured and eligible counts, unavailable count, raw included values, median, minimum, and maximum. Summing endpoint group counts is not an attempt total. Only successful measured attempts with proven fresh execution and an available measurement enter latency arithmetic. It does not calculate p95, causal ratios, regression thresholds, SLAs, cross-clock spans, or overhead verdicts.

## Filesystem and privacy rules

Input readers accept only explicit finite-size regular-file leaves and reject leaf symlinks. On platforms exposing `O_NONBLOCK`, descriptor admission is nonblocking so a checked leaf replaced by a FIFO cannot stall before regular-file verification. Reads and hashes are bounded on the opened descriptor and fail if file identity or size changes during capture. Ordinary ancestor symlinks are resolved: a private target outside Git is allowed, while a target inside a Git worktree is rejected. Output parents must already exist, resolve outside every Git worktree, and deny group/other permissions. Output files are created with exclusive mode `0600`; existing destinations are never overwritten. No source evidence is modified or deleted.

The redacted forms are recursive allowlists, not path scrubbing. Caller-supplied IDs are replaced with deterministic namespace-bound SHA-256-derived join keys; the same ID remains joinable within a namespace but not across namespaces. Case, availability, strata, measurement, and enum-keyed count objects are rebuilt from their known semantic fields, including when the redactor is called directly on an in-memory summary. Content digests and schema-defined enums remain visible. Private paths, raw caller identifiers, evidence references, notes, and unknown nested fields remain only in private records.

## Tests

The profiling tests are deliberately outside Vitest discovery and must be invoked explicitly:

```sh
node --test scripts/profiling/*.test.mjs
```

Fixtures are synthetic and shared only by the profiling test modules. Tests create only uniquely named temporary directories and remove only those exact test-owned paths.
