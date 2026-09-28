# Wave06 phase029 accepted; phase030 canonical artifact naming

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.69. Accept worker placement as bounded local source/test preparation, not measured responsiveness, cancellation or native ownership.

## Acceptance receipt

Submission `correctness-wave-06-phase-029-submission.md` SHA-256 `c78bba983c454ccc7bc7700a09329896c0de9bf359ce0917f1ccaec82c34d091` fully reviewed. Sole source `commands.rs` prepared SHA-256 `9f245c4634fa2177c22c80460427561766953855fbf6f5bfaf9b43e8fbb9aa4f` and binary diff `55fab88a84c3ecafdbd6ad89d263e902d13c2cb387ff0c8eb14df3444b2450ba` match. Lead reviewed all five awaited routes, unchanged domain response mappings and shared profiled-analysis sequencing. The three tests cover thread displacement/typed results/domain error, worker panic mapping, and actual analysis plus four paired profiling outcomes including worker panic. All earlier source/manifest/lock hashes verified unchanged.

Lead reproduced renderer473/36, check zero errors/two accepted warnings, lint/format, profiling Node88, event10, native fmt/clippy/workspace83 plus one intentional ignored emitter, scalar1 and core normal dependency tree without Tauri. The generic worker and shared analysis sequence have executable coverage; AppHandle transport and the four other command routes have source/compile coverage. No platform/app/timing result is inferred.

Lead commit **f1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55**, parent `3d35787a5df857e095a96c31a8a5e8588b13db70`: commands.rs250 insertions/7 deletions plus generated INDEX, two paths251 insertions/7 deletions. Candidate clean and actual candidate-local hooks passed. The516-line command/worker/in-module-test unit is deliberately kept cohesive and receives the explicit LOC annotation; no out-of-fence split. Main, running app, bundles and retained evidence unchanged.

## Exact phase030 assignment and fence

Use existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at clean **f1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55**. Adapt only AI-IMP-180 / SWEEP-030, historical **e383b8812a68326fd7a0b0a7d4bbcc4edae4e59f**. The accepted delta review and current lead source review already establish the inconsistent lossy sanitizers. Do not start another general protocol review. Verify base and current source before editing; unexpected overlap returns to lead.

Exactly seven candidate paths may change:

- `tauri-app/src-tauri/Cargo.toml`: add direct sha2 only.
- Root `Cargo.lock`: only the resulting direct-dependency edge/resolution required by the above.
- New `tauri-app/src-tauri/src/artifact_id.rs`: canonical helper and focused tests.
- `tauri-app/src-tauri/src/lib.rs`: expose that module, preserve current core re-exports.
- `tauri-app/src-tauri/src/commands.rs`: frame/strip naming and small production request-builder seams/tests only; preserve029 workers/profiling and unrelated command behavior.
- `tauri-app/src-tauri/src/value_analysis.rs`: matching generated/removal directory naming and necessary in-module fixtures/tests only; preserve021 observed-generation subdirectories and022 pruning changes.
- `tauri-app/src-tauri/tests/audit_value_cache.rs`: correct the existing `value-analysis/prior-artifact` hardcoded root in the022 retention regression and add focused real producer/remover regressions if needed. Keep timestamp helper, AUD-005 and all021/022 assertions meaningful and intact.

Installed root lock already contains sha2 **0.10.9** transitively. Add direct `sha2 = "0.10"`; reconcile offline without broad dependency updates or a new native-local lock. No same-file dependency/atomic-copy import from historical parents. If lock resolution changes anything beyond the existing sha2 package's direct edge, report why before broadening it.

Do not edit FFmpeg, cache/main, command types/protocol, frontend/bridges, profiling modules/evidence, core, grid, registry/session/ownership, quotas, spike binaries or other RAG in candidate. An out-of-fence requirement must be reported with its exact path before editing. No app/package build or launch, live cache operation, Git, owner controls, evidence mutation or030-to193 automatic continuation.

## Naming and compatibility ruling

1. Canonical component is `aid-` followed by all64 lowercase hexadecimal SHA-256 digits of the **exact logical ID UTF-8 bytes**, matching the historical design. This is stable fixed-length cross-platform-safe naming, not a content digest. Do not trim/case-fold/Unicode-normalize before hashing or truncate the digest. Distinct-case and canonically equivalent but byte-distinct Unicode strings remain distinct.
2. Frame/strip command boundaries reject empty or whitespace-only logical IDs using trim solely as a validity check, preserving `Invalid frame id`/`Invalid strip id`. Nonempty Unicode/punctuation IDs become admissible and safely encoded. Values command already rejects whitespace-only image IDs; preserve that behavior without adding a new policy to the lower-level helper. Valid leading/trailing whitespace bytes remain part of the hash. Do not invent a new IPC contract or alter request IDs on the renderer.
3. Actual frame and strip producers use the shared component inside existing `video-frame-{component}.png` / `video-strip-{component}.png` class names. Values generation and `remove_value_analysis_artifacts` use the same component beneath `value-analysis`, retaining settings and source-generation suffixes. Do not hash an already canonical component again in a producer-to-remover handoff: all these entry points accept the original logical ID.
4. Do not add migration, legacy fallback deletion, startup pruning or broad filesystem scanning. Existing old-format cache locations are not automatically mapped to the new identity. Disclose this naming transition and any residual legacy ambiguity; only test-owned roots may be exercised. Actual retirement/restart policy stays193. Class prefixes/directories remain compatible with existing startup name filters and explicit frame-path allowlisting by source inspection; do not claim symlink-safe root confinement or ownership from a digest.
5. Shared-ID parity means equal original logical IDs yield the same component across producers. Home, Values and strip callers can supply different IDs, so this does not establish that their artifacts represent the same frame/content. Hashing logical IDs does not satisfy C3 immutable input identity, PTS, leases, publication, source-generation authority, collision impossibility, or native cancellation/admission bounds.

## Regression-first proof

The historical three-calls-to-one-helper test is insufficient producer parity evidence. Keep small private frame/strip **request-building functions actually called by the production commands** in commands.rs; they must construct the concrete FFmpeg request including output path and retain existing input/timestamp/dimension/duration/mode/clamp semantics. Tests execute these two production builders plus the real `generate_value_analysis` producer on generated image bytes in a test-owned temporary root, then compare the embedded logical components. This proves production request construction and the real Values writer; it does not claim FFmpeg subprocess or AppHandle transport execution. Do not alter FFmpeg to manufacture test coverage.

Before replacing the production sanitizers, run compiling producer-backed cases showing inconsistent same-ID class components and distinct IDs collapsing to one path. Helper-only or missing-module/compiler failures do not count. An optional first extraction of request builders must preserve the old naming until these failures are recorded.

Permanent controls must include:

- Known SHA-256 vector (for example exact ASCII `abc`) and stable repeated results; fixed68-character `aid-` plus lowercase-hex structure; raw Unicode, slash/backslash, punctuation, traversal-shaped IDs, Windows-reserved-looking IDs and long inputs cannot introduce path components. Preserve case/whitespace/Unicode byte distinctions.
- The two actual production request builders plus real Values output agree for the same supplied ID. Explicitly test frame-sanitizer collision pair `ab`/`a/b` and Values-sanitizer collision pair `a/b`/`a?b` or `a_b`; changed IDs remain distinct through the actual producer paths. Blank frame/strip rejection and valid nonempty Unicode/space-byte cases retain exact validation intent.
- Real Values generation and removal for two formerly colliding logical IDs: output paths differ; later generation does not overwrite the earlier three PNGs; removing one original logical ID removes only its own generated directory and leaves the other's three bytes readable and unchanged; repeated removal reports false. No deletion beyond those test-owned artifacts.
- Preserve029 worker/profiling tests,027 boundary tests,021 unchanged-source no-rewrite and changed-observation retention,022 old-artifact retention/timestamp-helper controls. Correct only naming assumptions where necessary; do not remove an assertion just because paths changed.

## Gates and handoff

From candidate `tauri-app/`: `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, `node --test scripts/profiling/*.test.mjs`. From native directory: `cargo fmt --all -- --check`, `cargo clippy --workspace --offline -- -D warnings`, `cargo test --workspace --offline`, `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`, `cargo tree -p color-core --offline --edges normal`. From root: `node --test scripts/svelte-event-guard.test.mjs` and `git diff --check`. Preserve prior tests; no skips/fails-marked cases. Report exact counts/toolchain and any cohesive LOC threshold crossing for lead handling.

Leave candidate uncommitted. Write only planning `RAG/reviews/EPIC-029/correctness-wave-06-phase-030-submission.md` with exact base/status, complete seven-path-or-smaller hash manifest/diff, minimal lock changes, behavioral before/after proof, actual producer versus transport evidence, removal isolation, preserved regressions and candid naming-transition/platform limits. Notify lead task `019f7c75-2b8b-7882-9df7-0cdc1e494671` with path/hash, then stop without polling. Registry193 remains behind separate accepted prerequisites, numbered topology amendment and owner pressure ruling; no automatic implementation.
