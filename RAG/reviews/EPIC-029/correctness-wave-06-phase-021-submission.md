# Correctness wave 06 — phase021 submission

Code Lead -> Review Lead, 2026-09-06. Adapted SWEEP-021 only; candidate changes remain uncommitted. No phase027, canonical ID, atomic publication, registry, quota, pruning, app, package, live-cache/evidence, or Git action was taken.

## Exact base, fence, and provenance

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base/current HEAD: `575868c697e67fb7331ae3df3ae39fc5069efca8` (`fix(batch): isolate retained grid outputs [AI-IMP-180] [SWEEP-019] [loc-bypass]`). Candidate was clean at assignment and HEAD did not move.
- Normative brief: planning PROJECT-RECORD rev0.66 and `correctness-wave-06-phase-019-verdict-and-021-brief.md`.
- Historical source: `0f15c8e5697613586cabc6d8f1e203fa92f3615b` (`fix(values): isolate native artifact generations [SWEEP-021] [loc-bypass]`). I adapted only its observed-generation directory to the live source and expanded the rev0.66 real-producer proof; no old parent stack or tracking change was imported.
- Candidate status has exactly the two allowed files, 260 insertions/3 deletions. Status-list SHA-256: `5ef8c5468f1132ad6d379be543d63048390d991ad6d734564a697f27a2daa754`; changed-path-list SHA-256: `678e57b981893ce501b3f07cc0b0ab86d0d46d3a017ef9238c80351c4dc6b2e1`; binary-diff SHA-256: `5df8cd2b23c57ecd7b83c51e6a07547ecf0c500e07d1522f7cc31d8fcb85a5ce`.

| Candidate path | Base SHA-256 | Prepared SHA-256 | Delta |
| --- | --- | --- | --- |
| `tauri-app/src-tauri/src/value_analysis.rs` | `f4ff591cde6ce9319c521fbf18764eaac8c7c37ed58b42b0a573f0d2f041ff85` | `96cbd284106cadcddeb68d53071b2abd04b523a086204c0fda9408c0d7c3b9aa` | 28 insertions/2 deletions; generation directory and boundary comment/helper only |
| `tauri-app/src-tauri/tests/audit_value_cache.rs` | `d66ceec7e822407cc8ae15eb102801b583c0a1793c1f48aa9e1ee0367ea34271` | `31bd24135066a54430d0d1df74e979cc1fe8955533e5b3ba136fea2f8781e05d` | 232 insertions/1 deletion; test import replacement plus helpers and three real-producer tests |

No manifest, dependency, or lock path changed.

## Implementation boundary

The source observation now occurs before output-path construction. Below the existing `value-analysis/<sanitized-image-id>/k<levels>-<mode>` directory, `source_generation_tag` adds `<source-path-DefaultHasher>-<mtime-nanoseconds>-<length>`, with all three fields rendered as fixed-width hex. The existing `neutral.png`, `preview.png`, `bucket-map.png`, and `meta.json` names remain inside that generation directory. Numeric analysis, metadata/result schema, cache-validity tuple, path response API, explicit removal, and startup policy are unchanged.

The production comment explicitly records that this tuple only separates observed generations: equal metadata can hide changed bytes, same-observed-generation writers can overlap, and the output group is still written directly rather than atomically published. The tag is not a content digest, immutable input capability, or externally stable artifact identity.

## Regression-first and positive proof

Before the production edit, the new barrier-coordinated real producer test compiled and ran with:

`cargo test -p tauri-app --test audit_value_cache sweep_021_concurrent_observed_generations_retain_distinct_artifacts --offline -- --nocapture`

It failed 0 passed/1 failed/3 filtered at the intended assertion: completed dark and light workers returned the identical `value-analysis/same-logical-frame/k3-kmeans/neutral.png` path. This was the fixed-generation overwrite behavior, not a compile failure. Transcript SHA-256: `8fd07d05b11f3850ad3f1be033579d516e010eb238152600fb70ee2a0fb9c327`.

After correction, focused `audit_value_cache` passes 6/6 and the current in-module Values policy/removal suite passes 4/4. The three added cases prove:

- Barrier-released black/white producers share image ID, levels, mode and cache but use distinct source paths/observed tuples. Each of neutral, preview and bucket-map paths differs across results; decoded neutral/preview pixels and p10 statistics match the owning source after both workers join. A later same-ID gray generation uses three new paths, after which exact byte vectors for all six earlier outputs still match.
- One equal-size 8x8 BMP is replaced at the same path. The helper sets exact deterministic mtimes one day apart and verifies both values plus equal lengths. The second observation gets three distinct output paths, dark/light rendered values and statistics remain correct, and all three first-generation byte vectors survive.
- An unchanged source is generated twice with the same ID/parameters/schema. The source mtime/length are checked unchanged; all three paths and bytes are reused. Before the second call, each output receives an exact controlled fixture mtime; all three mtimes remain exact afterward, proving the producer did not rewrite the cached outputs.

Existing AUD-005 same-second/equal-length replacement, phase022 prior-artifact survival, and the corrected Windows file/directory timestamp helper remain normally discovered and pass. No sleep, skipped test, fails marker, helper-only cache claim, or fake equal-metadata acceptance was added.

## Gate receipt

Executed on Darwin arm64 with Rust 1.90.0 and installed Node 26.8.1:

- Focused `cargo test -p tauri-app --test audit_value_cache --offline` — 6 passed.
- Focused `cargo test -p tauri-app value_analysis::tests --offline` — 4 passed in the selected library suite; current prune/removal tests included.
- `cargo fmt --all -- --check` — pass.
- `cargo clippy --workspace --offline -- -D warnings` — pass.
- `cargo test --workspace --offline` — 80 passed, 0 failed, 1 intentional ignored native profiling emitter; three tests above phase019's 77.
- `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots` — 1 passed.
- `cargo tree -p color-core --offline --edges normal` — pass; no Tauri normal dependency.
- `npm run test -- --run` — 35 files, 434 tests passed.
- `npm run check` — 0 errors and the same two accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` and `npm run format:check` — pass.
- `node --test scripts/profiling/*.test.mjs` — 88 passed, 0 failed/skipped; includes explicit native emitter interop.
- Root `node --test scripts/svelte-event-guard.test.mjs` — 10 passed.
- Root `git diff --check` — pass.

Windows, Linux and Node20 were not available/run. The Windows timestamp helper is source-preserved and locally executes its non-Windows branch only; no cross-platform or installed-app acceptance is claimed. Only build outputs and isolated TempDir fixtures were created.

## Preservation, output layout, and limits

Phase019 remains exact: `compose_grid.rs` `c8fd9c946aa3b3ddc91e535cc19bdffecec06304a06d58d226f6539897297edc`; native `Cargo.toml` `5517c96aa3d13ab9e3a82ab6342b43622cf0d1142693d58901aceaa88d9ecf44`; root `Cargo.lock` `e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454`. The other unchanged phase022 production files remain exact: `cache.rs` `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994`; `main.rs` `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb`; `ffmpeg.rs` `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c`.

The old output layout was `value-analysis/<id>/kN-mode/{four files}`. The prepared layout is `value-analysis/<id>/kN-mode/<observed-generation>/{four files}`. Removal still deletes the whole image-ID directory, while startup size/age accounting recursively includes the additional level; both behaviors are covered by the preserved policy tests.

Residuals remain explicit: a source may mutate between metadata observation and decode; equal path/mtime/length can hide different bytes; concurrent same-observed-generation calls can still write the same three finals/meta; a failure can leave a partial group; `DefaultHasher` supplies a local directory discriminator, not a cross-version public identifier; and old generations accumulate until unchanged startup/explicit policy acts. Atomic private staging/publication belongs IMP-185, retained-input identity/leases belong IMP-193, and canonical IDs belong SWEEP-030. No global invalidation, unconditional recomputation, quota, or runtime pruning was introduced.

Both touched files are cohesive but exceed the local 400-line warning after this proof (`value_analysis.rs` 766; `audit_value_cache.rs` 431); lead LOC review/commit annotation is required rather than an out-of-fence split. No blocker or scope deviation remains. Lead owns review, commit, and the next exact-base assignment; phase027 was not started.
