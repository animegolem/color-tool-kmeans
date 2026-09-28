# Correctness wave 06 — phase029 submission

Code Lead -> Review Lead, 2026-09-06. Adapted SWEEP-029 only; candidate change remains uncommitted. No phase030/193, atomic copy/publication, FFmpeg/protocol, dependency/lock, app/package, profiling evidence, live-cache, registry/quota, or Git action was taken.

## Exact base, fence, and provenance

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base/current HEAD: `3d35787a5df857e095a96c31a8a5e8588b13db70` (`refactor(bridges): validate media IPC responses [AI-IMP-180] [SWEEP-027]`). Candidate was clean at assignment and HEAD did not move.
- Normative brief: planning PROJECT-RECORD rev0.68 and `correctness-wave-06-phase-027-verdict-and-029-brief.md`.
- Historical source: `489c3627d264b67e9789f0bb25ac5d41a525f5df` (`refactor(commands): offload blocking native work [SWEEP-029] [loc-bypass]`). I adapted its worker boundary to current `color_core::analyze`, current Values/grid implementations, unchanged copy behavior, and current profiling sequencing. No historical parent, inline engine, atomic-copy helper, or tracking change was imported.
- Candidate status contains exactly the one allowed file. Status-list SHA-256: `8f35fd87374b0407739faea0b757cafafaf071366df7b6667520f8e6e16e8bc1`; path-list SHA-256: `a6ca9c22ab7bde47bb000fc623938b84dcf5d9745faece6411805dfe3f7e6163`; binary-diff SHA-256: `55fab88a84c3ecafdbd6ad89d263e902d13c2cb387ff0c8eb14df3444b2450ba`.

| Candidate path | Base SHA-256 | Prepared SHA-256 | Delta |
| --- | --- | --- | --- |
| `tauri-app/src-tauri/src/commands.rs` | `4c4571a98df1881f327ade5181d21348166b71832cef16f9d55468ab394e4d59` | `9f245c4634fa2177c22c80460427561766953855fbf6f5bfaf9b43e8fbb9aa4f` | 250 insertions/7 deletions; worker helpers/routing and three in-module tests only |

No other source, test, manifest, dependency, lock, profiling module, command type, or registration path changed.

## Placement and behavior

Private generic `run_blocking` accepts `Send + 'static` owned work/results, awaits `tauri::async_runtime::spawn_blocking`, returns the closure's `Result<T, String>` unchanged, and maps join failure/panic to `<Operation> worker failed: <join error>`. It is never fire-and-forget.

Source review of all five actual routes confirms:

- `analyze_image` admits profiling first, then `run_profiled_analysis` awaits `run_blocking("Analyze image", ...)` around current `color_core::analyze(&req, ImageSource::Path(&path))` and its unchanged `to_string` domain mapping.
- `value_analysis` preserves empty-path/image-ID validation and AppHandle cache resolution before moving the owned request/cache PathBuf into `run_blocking("Value analysis", ...)`; generation and full response construction execute in the worker with existing clamps/mappings.
- `save_file` moves directory creation, write and response construction into `run_blocking("Save file", ...)` without changing strings or path display.
- `copy_file` moves directory creation, current `std::fs::copy`, and response construction into `run_blocking("Copy file", ...)`. No historical atomic-copy behavior was imported.
- `compose_grid` preserves AppHandle cache resolution and default 800 outside the worker boundary as applicable; the owned request/cache path enter `run_blocking("Compose grid", ...)`, where current grid decode/composition and response mapping execute.

Logging and all already-async frame/probe/strip/version commands are byte-unchanged. These route claims are source inspection plus compilation/full-suite evidence; only the generic worker and shared analysis/profiling path receive direct in-module execution below. No AppHandle/Tauri IPC transport test was added or claimed.

## Profiling sequencing

`analyze_image` now delegates to a private shared `run_profiled_analysis` seam used by the real command and tests. It calls `begin_native` before worker submission, awaits success/domain error/join error without `?`, captures the existing aggregate endpoint after the await and before return-event serialization/IO, then calls `finish_native` exactly once. Empty path remains `No file selected`/`no-file-selected`; any nonempty-path domain or worker failure remains `analysis-failed`; successful analysis remains `success` with no error code. Missing/disabled profiling remains a no-op.

The aggregate retains its receive-to-return meaning and now includes queue/await scheduling plus synchronous analysis. It is not relabelled kernel time and no timing improvement or comparison with retained evidence is claimed.

## Regression-first and executable proof

I first staged the private helper with inline execution and the permanent typed thread test, then ran:

`cargo test -p tauri-app sweep_029_run_blocking_moves_typed_work_off_the_calling_thread --offline -- --nocapture`

The helper and test compiled. The selected binary test failed behaviorally because caller and worker were both `ThreadId(2)`; zero other tests failed and the helper's temporary production-unused state emitted only a dead-code warning. Transcript SHA-256: `862931b175779ae9981314f0eb8ef3c5785c9da165c27d644d1238ed20314db9`. Final clippy has no warning.

After replacing only the helper body and routing production, focused `commands::tests` passes 3/3:

- typed `(ThreadId, u32)` success returns from a thread distinct from the caller; `Err("domain failure")` remains exactly equal;
- a worker panic is caught at the awaited join and becomes an error starting `Copy file worker failed:` rather than panicking the command future (Rust's panic hook still prints the worker panic during `--nocapture`, while the test and awaiting future pass);
- an enabled test-owned `ProfileState` and generated two-color PNG exercise the same profiled-analysis function as the command. Real analysis success, empty path, nonempty missing source and injected worker panic each produce exactly one correlated receive/return pair: eight native records total with success/no error, error/no-file-selected, and two error/analysis-failed returns. Every return retains the renderer clock and a native aggregate. The panic is mapped with `Analyze image worker failed:` and still receives its return event. A missing context adds no record, and a disabled state creates no profiling artifact while preserving the domain result.

The panic closure is a private test seam argument to shared sequencing, not a production runtime injection or new protocol path. No sleep, skipped/fails-marked case, or timing assertion was added.

## Gate receipt

Executed on Darwin arm64 with Rust 1.90.0 and installed Node 26.8.1:

- Focused `cargo test -p tauri-app commands::tests --offline -- --nocapture` — 3 passed.
- `cargo fmt --all -- --check` — pass.
- `cargo clippy --workspace --offline -- -D warnings` — pass.
- `cargo test --workspace --offline` — 83 passed, 0 failed, 1 intentional ignored native emitter; three tests above phase027's 80.
- `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots` — 1 passed.
- `cargo tree -p color-core --offline --edges normal` — pass; no Tauri normal dependency.
- `npm run test -- --run` — 36 files, 473 tests passed.
- `npm run check` — 0 errors and the same two accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` and `npm run format:check` — pass.
- `node --test scripts/profiling/*.test.mjs` — 88 passed, 0 failed/skipped; explicit native emitter interop included.
- Root `node --test scripts/svelte-event-guard.test.mjs` — 10 passed.
- Root `git diff --check` — pass.

Node20, Windows, Linux, AppHandle/Tauri transport, installed app and real-interaction timing were not run. No improved responsiveness/performance, bounded worker admission, cancellation, or platform acceptance is inferred. Only ordinary build/test outputs and isolated fixtures were created.

## Preservation and residuals

Phase027 remains exact: `video.ts` `ad3b605d17b2d2c9df68e7ff9c33cb48e5fa212aa1ff8361ac81605813b73643`; `compose.ts` `2e7bb1bd5aa69aa2dadf2a752afffcf35620a38067c2f3e1f1dfb234b18a792f`; `ipc-contracts.ts` `5b9a1a5254a91bd96ac1aee87c86fb792134517edb4bd966ed050d0229caa8e1`; `ipc-contracts.spec.ts` `bed4e17089e6d5d91e16bd638563a66ac8687419da44c2e19740d57940770a74`. Phase021 remains `value_analysis.rs` `96cbd284106cadcddeb68d53071b2abd04b523a086204c0fda9408c0d7c3b9aa` and `audit_value_cache.rs` `31bd24135066a54430d0d1df74e979cc1fe8955533e5b3ba136fea2f8781e05d`. Phase019 remains `compose_grid.rs` `c8fd9c946aa3b3ddc91e535cc19bdffecec06304a06d58d226f6539897297edc`, native `Cargo.toml` `5517c96aa3d13ab9e3a82ab6342b43622cf0d1142693d58901aceaa88d9ecf44`, and root lock `e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454`. Phase022 `cache.rs` `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994`, `main.rs` `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb`, and `ffmpeg.rs` `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c` remain exact.

Placement increases possible concurrency but does not solve same-generation output/copy races, immutable input capture, atomic publication, leases, cancellation, worker admission bounds, reclamation or pressure policy. `commands.rs` is now a cohesive 516-line command/worker/test module and needs explicit lead LOC review/commit annotation rather than an out-of-fence split. No blocker or scope deviation remains. Lead owns review/commit and the next exact-base assignment; phase030/193 were not started.
