# Correctness wave 06 — phase030 submission

Code Lead -> Review Lead, 2026-09-06. Adapted SWEEP-030 only; candidate changes remain uncommitted. No phase193, migration/fallback deletion, protocol, registry/session/ownership, pressure/quota, FFmpeg, cache/main, frontend, app, evidence, or Git action was taken.

## Exact base, fence, and provenance

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base/current HEAD: `f1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55` (`refactor(commands): place blocking native work off async workers [AI-IMP-180] [SWEEP-029] [loc-bypass]`). Candidate was clean at assignment and HEAD did not move.
- Normative brief: planning PROJECT-RECORD rev0.69 and `correctness-wave-06-phase-029-verdict-and-030-brief.md`.
- Historical source inspected, not imported: `e383b8812a68326fd7a0b0a7d4bbcc4edae4e59f` (`refactor(cache): unify collision-safe artifact IDs [SWEEP-030] [loc-bypass]`). I adapted its logical-ID digest only after extracting current production request builders and recording current producer-backed failures. No historical parent, same-file/atomic-copy work, or obsolete command context was imported.
- Current candidate status is exactly the seven allowed paths: 380 insertions/52 deletions. Status-list SHA-256: `d6f601ea69da4bfd5a08c260234fad5d033dc7b33b2ea564487ecccee38f8bc0`; seven-path-list SHA-256: `0fff6f97a9de1b1d5de5135e5675ea3b3ea0b0a4ab788e93bbe44843581d8b0c`; tracked six-file binary-diff SHA-256: `8bfafbe1bd94397625e55dc86f25bff59470a97635fb6c259941cfa7d37d2657`; complete prepared-patch SHA-256 including the new helper: `e745bb3d9c762c7e92459383dc49c484fcd39f15965d0838a15b5f7c62f986d5`.

| Candidate path | Base SHA-256 | Prepared SHA-256 | Delta | Purpose |
| --- | --- | --- | --- | --- |
| `Cargo.lock` | `e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454` | `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734` | +1/-0 | Adds only the existing `sha2` package to `tauri-app`'s direct dependency list |
| `tauri-app/src-tauri/Cargo.toml` | `5517c96aa3d13ab9e3a82ab6342b43622cf0d1142693d58901aceaa88d9ecf44` | `dae7699f97f24acfd077ef7e85c1bb790e6463f821ae7c21d69b518219cd319e` | +1/-0 | Direct `sha2 = "0.10"` dependency |
| `tauri-app/src-tauri/src/artifact_id.rs` | absent | `36d3072c45c145cbcbfede419fa78a558837621f9c510701da04dc790c3987d7` | new, 79 lines | Exact logical-ID UTF-8 to full SHA-256 component plus focused controls |
| `tauri-app/src-tauri/src/lib.rs` | `026ca7c71b5dd379335bb86bd08da976d8777fb3bd0048496389509c808508f7` | `837a5c30a626917a628b19ff223700077b2bafc11b99a434c7b193a124ea42d0` | +1/-0 | Exposes `artifact_id`; current `color_core` re-exports unchanged |
| `tauri-app/src-tauri/src/commands.rs` | `9f245c4634fa2177c22c80460427561766953855fbf6f5bfaf9b43e8fbb9aa4f` | `9dc3848a2ac8470d8954ab7e593725521020e42b925470797d3813f506304090` | +219/-30 | Production frame/strip builders, canonical names, and producer-backed tests |
| `tauri-app/src-tauri/src/value_analysis.rs` | `96cbd284106cadcddeb68d53071b2abd04b523a086204c0fda9408c0d7c3b9aa` | `21517274d783401341cc05d3360ad16fd589594445398c8b0a34c7181f2ec8a2` | +9/-20 | Canonical Values generation/removal roots and naming fixture correction |
| `tauri-app/src-tauri/tests/audit_value_cache.rs` | `31bd24135066a54430d0d1df74e979cc1fe8955533e5b3ba136fea2f8781e05d` | `88333aed4b9fc85ddade6367ad90445e9bae3fded1b3ec75f8c17ada26086d0c` | +70/-2 | Corrects the phase022 root and proves real removal isolation |

The manifest/lock binary diff SHA-256 is `8e64d300248547e4e41ce37009fa0956161fcf2d63f9babdac4156e63c115348`. Root `Cargo.lock` already contained `sha2 0.10.9`; its package version, checksum, and transitive dependency block are unchanged. The sole lock delta is one `"sha2"` line in the existing `tauri-app` dependency array. No native-local lock was created.

## Regression-first proof

I first extracted `build_frame_extract_request` and `build_strip_extract_request`, routed both production commands through them, and deliberately retained the two live lossy sanitizers. Three desired-behavior tests compiled against those actual builders and the real Values producer, then failed:

- same logical ID `shared/frame:id`: frame and strip embedded `sharedframeid`; Values embedded `shared_frame_id`;
- frame IDs `ab` and `a/b`: both built the same `video-frame-ab.png` path;
- Values IDs `a/b` and `a?b` with the same generated source: all three returned output paths were identical under `value-analysis/a_b/...`.

Command: `cargo test --bin tauri-app --offline sweep_030 -- --nocapture`; expected exit 101, 0 passed/3 failed/33 filtered. Transcript: `/tmp/color-tool-wave06-phase030-negative.log`, SHA-256 `4a6f93de2e34cf669069313aac1e652f0a42e0f78c9f84f7a7897935992f5c2f`. This is behavioral evidence from compiling production request builders and a real Values write, not a missing-helper/compiler failure.

After canonical wiring, `cargo test --offline sweep_030 -- --nocapture` passes all nine new controls: 3 helper + 5 command/producer + 1 integration remover, with no skip/fails marking. Transcript: `/tmp/color-tool-wave06-phase030-positive.log`, SHA-256 `1d722f6b8f1995269fc0d808e12de499809433b1ef1c478538613afbef773a3b`.

## Implementation and executable evidence

- `canonical_artifact_id` hashes the original string's exact UTF-8 bytes with SHA-256 and emits `aid-` plus all 64 lowercase hex digits. It does not trim, case-fold, normalize Unicode, or hash file contents.
- Helper controls include the exact `abc` vector, repeated stability, fixed 68-character/lowercase-hex structure, one safe component for Unicode, slash/backslash, punctuation, traversal-shaped, Windows-reserved-looking, dot, and long inputs, plus case/leading-space/trailing-space/composed-vs-decomposed-Unicode and historical collision distinctions.
- Frame and strip commands still reject empty or whitespace-only IDs with exact `Invalid frame id` / `Invalid strip id` errors; `trim` is used only for that validity check. Nonblank punctuation/Unicode and leading/trailing-space-bearing IDs are accepted, with every original byte contributing to the digest.
- The two private builders are called by the production commands and construct the actual `FrameExtractRequest` / `StripExtractRequest`. Tests assert output names, input paths, timestamp/duration floors, frame low/high dimension clamps, filmstrip count/width/height clamps and mode, and barcode count/one-pixel-width/height clamps and mode.
- The shared-ID test executes both production builders plus real `generate_value_analysis` over a generated 8x8 PNG and extracts each produced class component. Frame, strip, and Values all equal the one canonical component. This is request-construction and real Values-producer evidence; it does not execute an FFmpeg subprocess or Tauri `AppHandle` transport.
- Values generation and `remove_value_analysis_artifacts` both hash the original logical ID once beneath `value-analysis`; existing `k{levels}-{mode}` and phase021 observed-source-generation subdirectories are unchanged.
- The real removal test generates both formerly colliding IDs against the same source, verifies their three paths differ and first bytes survive later generation, removes one using its original logical ID, verifies only its three paths disappear, preserves the other three byte-for-byte plus an unrelated sentinel, and verifies repeated removal returns false.
- Source inspection confirms unchanged `video-frame-` / `video-strip-` prefixes remain covered by startup pruning and that the unchanged managed-frame allowlist accepts a root-level `video-frame-*.png`. No confinement, symlink, ownership, or deletion claim is inferred from that source-only compatibility check.

## Full gates

Toolchain: macOS Darwin 25.6.0 arm64; rustc 1.90.0, cargo 1.90.0, Node v26.8.1, npm 11.19.0.

- `npm run test -- --run`: 473/473 passed across 36 files, including phase027 IPC contracts 39/39.
- `npm run check`: 0 errors; the two accepted AUD-020 noninteractive-tabindex warnings remain in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `node --test scripts/profiling/*.test.mjs`: 88/88 passed.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --offline -- -D warnings`: passed.
- `cargo test --workspace --offline`: 92 passed, 0 failed, 1 intentional ignored native emitter. This includes the three unchanged phase029 worker/profiling tests, 7/7 `audit_value_cache` tests (AUD-005 plus phase021/022/030), and all 9 new phase030 tests.
- `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`: 1/1 passed.
- `cargo tree -p color-core --offline --edges normal`: passed; the normal dependency tree contains no Tauri dependency.
- `node --test scripts/svelte-event-guard.test.mjs`: 10/10 passed.
- `git diff --check`: passed. The new untracked helper is also rustfmt/clippy compiled and covered by the native tests.

## Limits, transition, and friction

- Existing old sanitized cache locations are not migrated, scanned, read as fallback, or deleted by the new logical-ID mapping. Removal by logical ID now addresses only the canonical root. Retirement/restart remains phase193 policy.
- Equal original logical IDs now yield equal components, but Home, strip, and Values callers can supply different IDs. This is not immutable source/content identity, PTS identity, source-generation authority, atomic publication, lease/ownership, cancellation, admission, quota, symlink-safe confinement, or mathematical collision-impossibility proof.
- FFmpeg subprocess/AppHandle transport, the app, Node 20, Windows, and Linux were not run. Current macOS source/build/test evidence is reported at its actual level.
- `commands.rs` is now 705 lines (base 516) and `audit_value_cache.rs` is 499 lines (base 434); both are cohesive command/producer regression units and require the lead's explicit LOC review/bypass. `value_analysis.rs` remains 755 lines but shrank by 11 net lines. The new helper is 79 lines.
- One initial static-gate invocation used the repository root for the profiling glob and failed before running with zsh `no matches found`; it was rerun from `tauri-app` and passed 88/88. One manifest-only shell attempt accidentally reused zsh's special `path` variable, so command lookup failed; the shell was ephemeral, no source changed, and the manifest was rerun with a safe variable to produce the hashes above.
- No implementation deviation or out-of-fence requirement was found. Candidate remains uncommitted at the exact base HEAD with only the seven assigned paths modified/untracked.
