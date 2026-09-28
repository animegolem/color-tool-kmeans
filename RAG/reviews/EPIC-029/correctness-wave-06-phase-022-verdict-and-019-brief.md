# Wave06 phase022 accepted; phase019 isolated grid outputs

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.65. Accept phase022 **locally as source/test preparation only**. Main, running app and retained profiling evidence remain unchanged.

## Acceptance receipt

Round02 report e0f6c65be32552ea74444b59c61627c9dbfefd4eb6f32c215679783da0241ad1 and original64a1ba08 are preserved. Lead matched all five hashes, binary diff2b46abe34ce040121591dfdf2e73121182bae440354653512919a82ffcf12fac and four unchanged production hashes. Corrected helper uses minimal attribute-write access and directory semantics; its real file/directory timestamp readback and byte control is normally discovered. No Windows run is inferred.

Lead reproduced frontend434/35, check0errors/two accepted AUD-020 warnings, lint/format, profiling Node88 including native emitter, event10, native fmt/clippy/workspace75 plus one intentional ignored emitter, scalar1 and core normal tree without Tauri. Full native suite includes audit3 and startup5; all pass. Actual candidate-local commit hooks repeated event/format/lint/Rustfmtclippy/index successfully without changing shared hook config.

Lead commit **5d22118d9a708b49181ff2e154d84c0bb090398b**, parent933d888880ee5507aa0ce4ee2b81bcdc3756e3ff. Exactly five source/test files174ins/55del plus generated INDEX: six files177ins/58del. Candidate clean after commit. Explicit LOC review retains cohesive ffmpeg406 and value_analysis740; both production files shrink, no artificial split. No lease/immutable-publication/native-lifetime/platform/owner or aggregate180 acceptance. Startup retention and explicit cleanup remain unchanged; session growth and removal races remain193/186.

## Phase019 exact assignment and fence

Use existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at clean **5d22118d9a708b49181ff2e154d84c0bb090398b**. Implement only AI-IMP-180 adapted SWEEP-019, historical source **84c8f88b85752303cfb3a4dce6f1670920bf7168**. Read current source and the retained native delta report; no further general preimplementation review required. Stop on unexpected base/dirty overlap.

Exactly these candidate paths may change:

- `tauri-app/src-tauri/src/compose_grid.rs`: collision-safe unique retained PNG writer and focused in-module regression tests only. Keep layout, gap, resizing, image decoding, argument/error behavior, tuple response and numeric output unchanged.
- `tauri-app/src-tauri/Cargo.toml`: move the existing tempfile3.10 requirement from dev-dependencies to normal dependencies, preserving its current compatible resolution and all other dependencies/features. No new framework or UUID dependency.
- **`Cargo.lock` at repository root**, only if Cargo requires dependency-metadata reconciliation for this promotion. This corrects the ambiguous/native-lock wording in the delta proposal: the live workspace has no src-tauri/Cargo.lock. Do not create one. No unrelated package/version/checksum churn; if root lock stays unchanged, report that as expected preservation. Use offline resolution, no broad cargo update.

No other candidate source/tests/config, manifest, lock, docs, ticket/INDEX, pruning, registry/quota, worker bridge, renderer, core math, profiling, exports or Batch runner change. Lead owns commits and planning projections. No new clone/branch/rebase, Git mutation, install, app/package/run, live artifact/cache action or cleanup of retained evidence. Ordinary test compilation and isolated TempDir fixtures are permitted.

## Binding implementation and regression requirements

1. Adapt the historical exclusive tempfile-in-cache strategy: an independently allocated path per invocation, explicit PNG encoding through the owned file, completion before returning a retained path, and no overwrite of any previously returned path. The retained artifact must survive local writer-handle drop. Use error propagation/RAII for unsuccessful temporary output; no pretend publication/lease layer.
2. Add the real producer concurrency regression before the production fix. Two barrier-coordinated red/blue compositions into the same isolated cache must return distinct paths and valid matching pixels after both workers finish. Record the failing fixed-name behavior before correction; a compile failure is not the intended negative assertion. Strengthen with a subsequent same-cache composition and exact-byte preservation of both prior results so later work cannot silently mutate accepted outputs.
3. Keep deterministic encoded bytes for identical inputs: random filenames do not authorize changed pixels/PNG bytes. Retain all existing layout, gaps, scaling and error controls; test repeat input in the same cache with distinct returned paths but equal bytes. Avoid timing sleeps and hardcoded random filenames. Do not change algorithm or test assertions to match a new encoding artifact.
4. Include bounded failure controls through the real producer for invalid input and an unusable cache destination, checking errors and preservation of unrelated fixture content. Do not create a generic injection architecture or claim hard-to-trigger sync/keep failure execution without evidence. Report residual failure-path limits honestly.
5. This only prevents shared-output overwrite. It does not introduce atomic group publication, trusted immutable source identity, cancellation, leases, ownership-aware reclamation or Batch generation retirement. New files may accumulate until186/193; do not compensate with pruning or choose storage policy. Preserve the newly accepted022 safety floor.

## Gates and return

Use installed dependencies. From native directory run focused compose tests, `cargo fmt --all -- --check`, `cargo clippy --workspace --offline -- -D warnings`, `cargo test --workspace --offline`, `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`, and `cargo tree -p color-core --offline --edges normal` with no Tauri in that normal tree. From tauri-app run `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, `node --test scripts/profiling/*.test.mjs`; from root run `node --test scripts/svelte-event-guard.test.mjs` and `git diff --check`. Use pipefail for pipelines. Keep two accepted warnings and any unrun Windows/Linux/Node20 gates explicit. No skipped or fails-marked regression.

Leave changes uncommitted and report exact base, source provenance, all prepared hashes/status, actual path count and dependency/lock delta, before-fix assertion, per-suite counts, preserved022 hashes, and candid friction/limits. Write only `RAG/reviews/EPIC-029/correctness-wave-06-phase-019-submission.md` in the planning carrier. Notify lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 with path/hash, then stop without polling. No021 before the next lead exact-base assignment. PressureF/O/limits and193 coding remain unapproved.
