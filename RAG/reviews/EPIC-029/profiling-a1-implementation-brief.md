# IMP-202 A1 — durable profiling records and summarizer

Review Lead → Code Lead, 2026-09-05. PROJECT-RECORD rev 0.22 §10.7. Owner authorizes proceeding with full-interaction measurement. This is the first implementation slice of the already reviewed A1 design, not another general review. Source instrumentation remains B, separately fenced.

## Worktree and fence

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, branch codex/correctness-wave-01-2026-09-05, clean base 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Recheck before editing; stop on overlapping work.
Allowed new files only, under tauri-app/scripts/profiling/:
- README.md
- build-manifest.mjs
- validate-manifest.mjs
- summarize-runs.mjs
- schema/build-manifest.schema.json
- schema/case-manifest.schema.json
- schema/run-record.schema.json
- profiling-tools.test.mjs

One planning output: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-a1-submission.md.
No app/core/native/config/package/lock/fixture/CI edits, installs, builds, app interaction, profiler capture, Git mutations or changes to other worktrees. Lead independently works on native capture/control proof using the immutable A0 bundle; you must not control any app. Lead owns tickets/record/index and commits. No new agent needed; retain changes uncommitted.

## Scope and domain contract

Node standard library only, compatible with Node 20; explicit node --test test discovery, not Vitest outside src. Existing source-verified Round 01 and P1–P8/R1–R5 verdicts are normative supplements.

Implement small importable functions plus CLI entrypoints: build-manifest captures exact explicitly named local build files/metadata, validate-manifest validates v1 build/case/run records, summarize-runs validates and summarizes explicit input records. No GUI runner or instrumented spans in this slice. Shared validation code may export from validate-manifest; no extra helper file beyond fence. Choose documented narrow CLI syntax; unknown arguments fail, import has no side effects.

Three strict versioned schemas describe:
1. Build: exact commit/dirty status (unknown is not clean), executable digest/UUID/profile/flags, explicitly supplied locks/symbols/source-map/sidecar references, toolchain, evidence provenance and unavailable reasons. Do not infer symbol correctness from matching strings, or optimized codegen from directory name. Report caller assertions as asserted, hash-checked file evidence as verified, lookup proof as an external evidence reference. Collector never builds, launches, shells out arbitrary commands or scans for inputs.
2. Case: opaque case ID, source digest with private path mapping separate from shareable record, requested and achieved frame with explicit exact/unmatched/unverified status, full resolved analysis/render config, viewport and source-vs-runtime verification. Missing values require reason. Same source+close timestamp never automatically means same decoded frame.
3. Run: build/case reference, process/cache/workload/visibility strata, ordered uniquely identified attempts (setup, reset, warmup, measured), action/terminal outcomes, proven-new-execution evidence, measurements with endpoint/unit/clock/method/precision and evidence level. UI transcription, app log, instrumentation and presented evidence are distinct. Failed/cancelled/stale/cache/deduped/timeout/unverified records are counted, not silently removed. Null unavailable is not zero. Every completed attempt has one terminal; reject duplicate IDs/conflicting terminals/negative or nonfinite durations/unknown fields or versions.

Keep schemas and runtime validation consistent; explicit domain checks are fine, do not build a general JSON Schema framework or add a dependency. Preserve schema tests demonstrating their agreement for emitted documents. Reject duplicate attempt IDs across merged inputs and mixed references disguised as one run. Don't compute cross-clock durations unless explicitly calibrated; A1 primarily consumes recorded durations and does not invent spans.

Summaries:
- Never pool builds, source/config, requested/achieved-frame status, operation, warm/fresh/cache, workload, endpoint/method or visibility strata. Group keys must preserve those differences; do not make hidden trial 1 an invisible exclusion.
- Per group report all attempt/outcome counts, measured/eligible count, raw included values, median/min/max. Numeric UI transcription arithmetic is not independent visual validation.
- Only successful measured attempts with established fresh-execution proof enter a fresh-analysis latency summary. Preserve excluded warmups/resets/unknown/cache/failures alongside reasons. Censored timeouts are not completed durations.
- No p95/causal ratios/regression SLA or overhead verdict in this slice; future threshold study is separate.
- Deterministic output order/format; no current timestamp injected unless explicitly supplied.
- Redacted output is allowlisted, not path-string regex cleanup. No absolute paths, source basename, freeform private notes, commands or raw log/error content in it. Use opaque IDs/digests/enumerated states; local full records remain private.

Filesystem safety:
Only read explicit inputs, finite size/count limits and normal regular files; no recursive Desktop/home/repo scanning, network or shell execution. New output must be explicitly requested in an owner-private directory outside the Git worktree. Resolve ancestry/symlinks and reject output inside actual Git worktree (including other worktrees/linked paths), refuse overwrites; don't use string-prefix-only confinement. No deletion or modification of source evidence. Tests use their own temporary directories and clean only exact test-owned files. Defaults should emit to stdout only if redacted; private output requires explicit file destination. Error messages for redacted mode must not leak input paths/content.

## A0 proof and tests

Use existing /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/run-01.hilHbt as read-only real evidence. In a NEW private output directory, create an explicit normalized v1 projection (authored via apply_patch is fine; no need permanent legacy importer). Preserve original hashes and label transcribed endpoints; 58.4210 remains unmatched to58.4163. Prove visible 6 UI values median94.5/range93–104, visible log median129/range123–139; hidden trial1 remains a separate counted stratum. Do not claim combined7 is a quiet/visible exact-case group. Retain 31 attempts, zero valid fresh-process target samples, all setup/reset/warmup/wrong-source outcomes. Historical ~4000 remains reported kernel time.

Unit tests cover all above domain/privacy/write-safety/stratification constraints, known vectors, malformed inputs, nonfinite JS API values, collisions, symlink paths, unavailable handling, deterministic summaries and no import side effects. Synthetic fixtures must be embedded in the test file, no real private filenames/content committed.

Run:
- node --test scripts/profiling/profiling-tools.test.mjs (from tauri-app)
- all four existing renderer gates (test -- --run, check, lint, format:check)
- Rust workspace fmt, clippy -D warnings, tests and scalar golden test per AGENTS; use existing dependencies/offline, record exact counts. No new build bundle.
- Explicit Node20 validation if locally available, no download/install; otherwise report unrun.
Use existing local prettier for the eight touched files. Stop/report if lint inclusion needs a config fence; do not silently expand scope.

Submit file list, implementation summary, exact tests/counts/gates, normalized A0 proof/output paths and hashes, candid deviations/failed approaches. This partial IMP-202 slice is not an issue closure. Lead reviews/commits after acceptance; no atomic commit by delegate. Notify lead and stop. Owner bell only for a concrete blocker requiring owner action, not a normal review handoff.

