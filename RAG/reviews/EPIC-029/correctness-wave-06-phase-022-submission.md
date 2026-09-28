# Correctness wave 06 phase022 — startup-only retention submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.63 §§3–8,11 and `correctness-wave-06-delta-verdict-and-022-brief.md`. Review state: **SUBMITTED; source and tests uncommitted; not accepted; stop after phase022.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base and HEAD remain the exact assigned commit `933d888880ee5507aa0ce4ee2b81bcdc3756e3ff`.
- Adapted issue: AI-IMP-180 / SWEEP-022, historical source `dd73c6ba370de1d14d527b85bfecda1387004ce2` (`fix(cache): prune artifacts only before session ownership [SWEEP-022] [loc-bypass]`). Source behavior was adapted rather than importing the historical parent, obsolete RAG INDEX, or stale module shape.
- Candidate status is exactly the five authorized tracked modifications. Status-list SHA-256 is `7174b3fcbddc21bd6b8e0b476482a60d3e635a699816a1697d2fee0e5806e800`.
- The combined `git diff --binary` stream SHA-256 is `d4f6147ee17a21e104ae6792dbb9129de3d92b3acf124c8f1bd5949cd755e877`.
- Payload is **138 additions, 55 deletions** across exactly five files. No dependency, manifest, lock, config, ticket, generated INDEX, core math, other SWEEP, registry/quota/policy, app/build/package, runtime cache, profiling evidence, Git staging/commit/config, main/ref, or release action occurred.

Exact `git status --short`:

```text
 M tauri-app/src-tauri/src/cache.rs
 M tauri-app/src-tauri/src/ffmpeg.rs
 M tauri-app/src-tauri/src/main.rs
 M tauri-app/src-tauri/src/value_analysis.rs
 M tauri-app/src-tauri/tests/audit_value_cache.rs
```

## Exact five-file manifest

| File | Base SHA-256 | Prepared SHA-256 | Base -> prepared LOC |
|---|---|---|---:|
| `tauri-app/src-tauri/src/cache.rs` | `f3e952345e2b8c4be8519e25ff3fcafee505a1f79f403984f36c0995fc878e4b` | `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994` | 312 -> 358 |
| `tauri-app/src-tauri/src/main.rs` | `5c889a8dbd119875ad36d4b2b158b355f177bd03de981373fa262bb7af4e77e0` | `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb` | 210 -> 206 |
| `tauri-app/src-tauri/src/ffmpeg.rs` | `c966e0dd79c078e9c09ce326a48e20aec9d7e68f68135d47477dc6e57a49d80a` | `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c` | 446 -> 406 |
| `tauri-app/src-tauri/src/value_analysis.rs` | `998d0c154f0de4278de08398c399114de57489b3a2dac184161f581a1d81037c` | `f4ff591cde6ce9319c521fbf18764eaac8c7c37ed58b42b0a573f0d2f041ff85` | 741 -> 740 |
| `tauri-app/src-tauri/tests/audit_value_cache.rs` | `d9d86407a3d3ff7bf216139ec362c4480bfc0d32945dc38c0985821335958bb6` | `aea737a679cf0a44e985ed59cfc2274925f6d691b7054e402a493af91f81a22b` | 82 -> 164 |

## Before-fix proof

The permanent regression was added before any production edit. It creates a real prior Values result through `generate_value_analysis`, records all three artifact byte sequences, recursively fixes that generated artifact tree to `UNIX_EPOCH + 24h`, then invokes a second real `generate_value_analysis` for an unrelated source/ID. It does not call the startup pruner directly and does not sleep for the retention window or allocate quota-sized data.

Pre-fix command:

```text
cargo test --offline --test audit_value_cache sweep_022_values_generation_preserves_unrelated_prior_artifact_bytes -- --exact --nocapture
```

Observed pre-fix result: **0 passed, 1 failed, 1 filtered out**. The exact failing assertion was `prior artifact must survive generation: Os { code: 2, kind: NotFound, message: "No such file or directory" }`, demonstrating that completion of the second real Values generation deleted the unrelated aged result.

After the production correction, the same test passes. It verifies exact bytes for prior `neutral.png`, `preview.png`, and `bucket-map.png`; verifies all three new paths exist and decode as images; and checks the new result's 8x8 dimensions and 64-entry bucket map.

## Implementation

- `cache.rs`: removes the 60-second runtime interval constant; names the retained entry point `prune_startup_cache`; documents its pre-renderer/startup-only boundary; preserves the existing frame/strip/age/byte values and explicit removal helper. Adds an actual startup-entry-point positive control for 80 frames, 10 strips, current clipboard/snapshot bytes, and unrelated cache/data paths. Renames the direct flat-directory size test from runtime to startup terminology without weakening its assertion.
- `main.rs`: invokes `prune_startup_media_artifacts` only in existing Tauri setup before managed renderer state and command exposure. Removes only the periodic media-prune thread. Event-log pruning, the ten-second logging heartbeat, profiling/session setup, window logging, explicit removal command, plugins and all command registration remain intact.
- `ffmpeg.rs`: removes only post-success frame/strip sibling pruning and its dead helper. FFmpeg/FFprobe command construction and binary discovery, arguments, timestamps, errors, output paths/names and successful return values remain unchanged.
- `value_analysis.rs`: removes only the generation-completion call to `prune_value_analysis_cache`. Startup/public pruning helpers, retention policy, metadata/freshness behavior, explicit per-ID removal, rendering and numeric results remain unchanged.
- `audit_value_cache.rs`: adds the one real producer-boundary regression described above. Existing AUD-005 same-second replacement coverage remains unchanged and passes alongside it. The timestamp helper is std-only and includes Windows directory-open semantics; no new dependency is needed.

## Startup and explicit-cleanup controls

- Retention values are byte-for-byte unchanged: video frames **80**, strips **10**, flat artifact age **30 days**, clipboard **512 MiB**, snapshots **1 GiB**, and Values **512 MiB / 30 days**.
- `cache::tests::` ran **5 passed**: the new actual startup entry point; existing flat-directory size cap; managed-root rejection; supported clipboard removal; and preservation of unowned/unsupported clipboard paths.
- `value_analysis::tests::aud_011_value_cache_prune_enforces_the_size_cap` ran **1 passed** through the actual Values policy helper. `value_analysis::tests::aud_011_entry_removal_deletes_owned_value_artifacts` also passes in the full native workspace.
- `audit_value_cache` ran **2 passed**: the new SWEEP-022 generation/retention proof and unchanged AUD-005 source-freshness proof.
- Fresh clipboard/snapshot artifacts remain subject to the same startup retention pass; there is no blanket startup deletion. Explicit `remove_media_artifacts`, `remove_managed_artifact`, and `remove_value_analysis_artifacts` behavior was not broadened.

## Final prune call-site inventory

Source inventory after the fix finds:

- `main.rs`: `prune_startup_media_artifacts` calls `prune_startup_cache` and `prune_value_analysis_cache`, and its sole production invocation is in `.setup(...)`.
- `cache.rs`: `prune_startup_cache` calls `prune_video_cache`; the only other call is the in-module startup control.
- `value_analysis.rs`: the public startup policy calls the internal policy helper; the only other direct policy-helper call is the in-module size control.
- No `RUNTIME_PRUNE_INTERVAL`, `prune_runtime_cache`, `prune_sibling_pngs`, periodic media-prune thread, FFmpeg frame/strip completion prune, or Values-generation prune call remains.

This is source/call-site and isolated helper evidence, not a mounted timer or FFmpeg lifetime test.

## Final validation receipts

All successful commands used installed dependencies and offline Cargo resolution. Host/toolchain: macOS 26.6.2 (25G83), Node v26.8.1, npm 11.19.0, rustc 1.90.0, cargo 1.90.0. Node 20, Windows and Linux were not run.

1. Focused `cargo test --offline --test audit_value_cache`: **2 passed, 0 failed, 0 ignored**.
2. Focused `cargo test --offline cache::tests::`: **5 passed, 0 failed, 0 ignored**.
3. Focused Values size-policy control: **1 passed, 0 failed**.
4. `cargo fmt --all -- --check`: exit 0; no diagnostics on the exact prepared bytes.
5. `cargo clippy --workspace --offline -- -D warnings`: exit 0; no diagnostics.
6. `cargo test --workspace --offline`: **74 passed, 0 failed, 1 intentionally ignored**. The ignored `profiling_tests::emit_native_interop_fixture` requires explicit test-owned output and is exercised by the passing Node interoperability suite.
7. `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`: **1 passed, 0 failed**.
8. `cargo tree -p color-core --offline --edges normal`: no Tauri dependency matched.
9. `npm run test -- --run`: **35 files passed, 434 tests passed**.
10. `npm run check`: `svelte-check found 0 errors and 2 warnings in 2 files`; both are the accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
11. `npm run lint`: exit 0; no diagnostics.
12. `npm run format:check`: `All matched files use Prettier code style!`
13. From `tauri-app/`, `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**; native writer interoperability ran.
14. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
15. `git diff --check`: exit 0; no diagnostics.

## Deviations, friction and remaining boundary

- **Source-fence deviation: none.** Exactly the five assigned candidate paths changed; the planning carrier receives only this report.
- The historical patch removed the top-level `std::fs` import together with its old sibling-prune helper. Current `ffmpeg.rs` also uses `fs::read_dir` for binary discovery, so the first focused compile failed with unresolved module `fs`. The live dependency was restored; no binary-discovery behavior changed.
- A final native pass first stopped at `cargo fmt --all -- --check` after the new valid-image assertion needed rustfmt wrapping. `cargo fmt --all` changed only that formatting, then fmt, clippy, the full native workspace, scalar and dependency-tree gates were rerun successfully on the exact manifest above.
- A manifest loop initially used zsh's special `path` variable and consequently lost command lookup. It changed no files; the manifest was rerun with a neutral variable and independently followed by `git diff --check` and the hashes above.
- Existing touched cohesive files remain over the strict 400-line threshold: `ffmpeg.rs` 406 and `value_analysis.rs` 740. The change shrinks each by 40 and 1 lines respectively; lead-owned commit handling should preserve the historical `[loc-bypass]` treatment rather than force an out-of-scope split.
- This phase removes one unsafe blind-deletion mechanism. It does **not** establish leases, immutable publication, cancellation, response/ACK recovery, safe explicit remove/clear under concurrency, multi-process ownership, bounded session growth, admission limits, overflow behavior, or the later IMP-193 registry. No quota or pressure policy was selected.
- No app launch, build/package, actual cache cleanup, mounted timer/FFmpeg run, native artifact-lifetime stress, owner interaction, Windows/Linux/Node20 CI, merge, release or aggregate AI-IMP-180 acceptance was performed or implied.

Stop point: phase022 review gate. Candidate source/tests remain uncommitted at `933d888`; no phase019 work has begun. Review Lead owns independent review, issue commit/integration and any next exact-base assignment.
