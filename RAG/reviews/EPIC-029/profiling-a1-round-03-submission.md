# A1 Round 03 implementation submission

Code Lead → Review Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.24. Review state: **SUBMITTED; uncommitted; not accepted; no ticket completion.**

Assignment: R9–R10 from `profiling-a1-round-02-verdict.md`. Candidate remains `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2` on `codex/correctness-wave-01-2026-09-05`.

## Boundary and hashes

Compared recursively against the frozen Round 02 source at `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/a1-review-round02.GELvOM/profiling`, exactly the five authorized files differ:

- `tauri-app/scripts/profiling/README.md` — `3b02aa2212762844dd1c705cfc967177a5b9332262cb3f679b85dff7da7c2a9c`
- `tauri-app/scripts/profiling/private-files.mjs` — `e0219b141581e747567b799840c10a28e3c70549967b1976c29fab787b5f834e`
- `tauri-app/scripts/profiling/summarize-runs.mjs` — `f52c5ff9e12cdb8149c043167fcf24f73fff7ca6c915cfd3a77188c71a575f7b`
- `tauri-app/scripts/profiling/profiling-files.test.mjs` — `0b3776484aa15f8eaa957e2c8c71d5e2a32fcd18824edc86d1922ba545cfa630`
- `tauri-app/scripts/profiling/profiling-summary.test.mjs` — `8cdfd7d4156f9eb56a99ddf6ac861c6d97422de285444981a68e40b8ab7fdca5`

The other eleven A1 files are byte-identical to the frozen snapshot. All 16 remain untracked; `git diff --stat` is empty and HEAD is unchanged. No new helper or diagnostic file was created. No tracked source, app/core, configuration, dependency, lock, fixture, ticket/index/record, IMP-178, Git index/ref/history, app control, package build, trace, media observation, or owner-workload change was made. No commit was attempted.

## R9 — bounded pre-open nonregular replacement

Implementation:

- Descriptor admission now adds `O_NONBLOCK` when the platform exposes it, before descriptor `fstat` verifies the leaf is still a regular file.
- Existing `O_NOFOLLOW`, actual-byte limit, path/descriptor identity and metadata checks, stable error codes, and `finally` close behavior remain unchanged.
- On a regular file, `O_NONBLOCK` does not change read semantics. A substituted FIFO opens without waiting for a writer and is rejected as `INPUT_CHANGED` by the existing descriptor-type check.
- A narrow `afterInitialStat` callback seam interposes the deterministic test after the accepted regular-file `lstat` and before `open`; ordinary callers do not provide it. Like the existing chunk callback, it has no effect when absent.

Regression evidence:

- Before the fix, the isolated child reproduced the issue exactly: it retained the two-byte regular-file stat, replaced that exact test-owned leaf with a FIFO via `/usr/bin/mkfifo`, blocked in `open`, and was killed by the test's 1500 ms `SIGKILL` timeout. The targeted test failed with 0 passes / 1 failure rather than hanging the parent suite.
- After adding nonblocking admission, the same bounded child returned `INPUT_CHANGED` in approximately 45 ms; the targeted test passed 1/1.
- The final focused run passed this test in approximately 45 ms and removed its exact temporary directory/FIFO through the parent fixture's `finally` cleanup.
- Platform receipt: tested on `darwin` with Node `fs.constants.O_NONBLOCK=4`. The test declares an explicit skip on Windows or when Node does not expose `O_NONBLOCK`; ordinary regular-file tests remain portable.

## R10 — nested exported-summary redaction

Implementation:

- `redactRunSummary` now rebuilds case, availability-wrapper, strata, measurement, and build-key objects from explicit known fields.
- Role, outcome, fresh-execution, and exclusion count maps are filtered to their schema-defined enum keys while preserving the generated map's insertion order and numeric values.
- Attempt-group and endpoint-group semantic fields, namespace-bound redacted IDs, included-value sample order, and ordinary serialized key order remain unchanged.
- The current CLI was already protected by strict run validation; this closes the direct exported-API contract without changing schema or grouping behavior.

Regression evidence:

- The direct API test starts from a valid generated summary, then injects private fields into both attempt and endpoint groups: build, case, requested/decoded availability wrappers, strata, measurement, plus unknown keys in all four count-map kinds.
- Before the fix, the filename-shaped sentinel survived and the targeted test failed 0/1.
- After the recursive allowlists, the sentinel is absent and the targeted test passes 1/1.
- Top-level/group allowlists and prior namespace-bound identifier tests continue to pass.

## Unchanged A0 bytes

The existing Round 02 run was summarized directly to stdout/in memory; no new corpus, projection, or diagnostic file was written.

- Recomputed stdout SHA-256: `2dd90b8c3790cdb3d9a5aee592bcdd55c8ae5c53bc95e26a6fc646ff0cb44013`
- Existing `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/a1-normalized-round02.gyCm1Z/summary.v1.json` SHA-256: `2dd90b8c3790cdb3d9a5aee592bcdd55c8ae5c53bc95e26a6fc646ff0cb44013`

The bytes are identical. The already verified 31 attempts, four attempt groups, nine endpoint groups, 94.5/129 ms visible medians, separate hidden 95/132 ms values, and zero eligible fresh-process targets are therefore unchanged.

## Focused and full gates

- `node --test scripts/profiling/*.test.mjs` — **54 passed, 0 failed, 0 skipped** (15 filesystem/privacy + 15 summary/statistics + 24 record/schema/API tests).
- `npm run test -- --run` — **21 files passed, 222 tests passed**. Ordinary Vitest does not discover the 54 Node tests.
- `npm run check` — **0 errors, 2 accepted AUD-020 warnings** in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `cargo fmt --all -- --check` — passed.
- `cargo clippy --workspace --offline -- -D warnings` — passed.
- `cargo test --workspace --offline` — **50 passed, 0 failed**; doc tests 0.
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline` — **1 passed, 0 failed**.

Local Node remains v26.8.1. Node 20 remains unrun; no runtime was installed or downloaded.

## Size and friction

- `summarize-runs.mjs` grew from 364 to 427 lines because the exported redactor now owns explicit recursive allowlists for its summary domain. This is a 27-line size exception over the local 400-line warning. The correction fence forbids a new helper, and moving these domain rules into filesystem or test modules would reduce cohesion; no minification or automatic LOC bypass was used. Review Lead should decide any later split or commit-message treatment.
- The deterministic FIFO proof needs an interposition point after initial `lstat`; without it, reproducing the TOCTOU window is probabilistic. The child timeout remains the outer safety boundary so a future regression cannot hang the Node suite.
- `O_NONBLOCK` is a supported-platform admission defense, not a claim to eliminate arbitrary hostile mutation or add cross-platform FIFO facilities. The test explicitly reports its platform skip policy.
- Recursive count-map filtering preserves valid generated insertion order so the A0 bytes remain stable. Unknown keys are omitted rather than echoed; this is deliberate for the redactor's output contract.

Stop point: review gate. No acceptance, integration, commit, issue completion, B-stage instrumentation, owner question, or polling is authorized.
