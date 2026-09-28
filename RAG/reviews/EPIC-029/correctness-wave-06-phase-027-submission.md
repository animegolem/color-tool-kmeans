# Correctness wave 06 — phase027 submission

Code Lead -> Review Lead, 2026-09-06. Adapted SWEEP-027 only; candidate changes remain uncommitted. No phase029, native protocol, ownership fields, registry, quota, app/package, live-cache/evidence, dependency, lock, or Git action was taken.

## Exact base, fence, and provenance

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base/current HEAD: `caf822526af273c3dafdb44a51f7c094fb3ebeb4` (`fix(values): isolate observed artifact generations [AI-IMP-180] [SWEEP-021] [loc-bypass]`). Candidate was clean at assignment and HEAD did not move.
- Normative brief: planning PROJECT-RECORD rev0.67 and `correctness-wave-06-phase-021-verdict-and-027-brief.md`.
- Historical source: `3640300831162cf530e61b9cfe6f0b82edf49c23` (`refactor(bridges): validate media IPC responses [SWEEP-027]`). I adapted its parser/bridge seam to the live Rust contract and strengthened the assigned real-bridge, domain, argument, projection, and error controls. No historical parent/tracking change was imported.
- Candidate status is exactly four allowed paths, 431 insertions/25 deletions. Status-list SHA-256: `ada1216806ce6039eaf15fca9e1ecb5227ca87745af88597526a52bfab829ce5`; four-path-list SHA-256: `2da6ef25d9bf50f16b1cf2164f513307255c548aeb8bb47275c4c3d6af6c64d8`; complete prepared-patch SHA-256 including both new files: `c9333981610fea61a7dd910bf0ed2b58f7731c191fb273ae2be73430833bb253`.

| Candidate path | Base | Prepared SHA-256 | Delta |
| --- | --- | --- | --- |
| `tauri-app/src/lib/bridges/video.ts` | `8dc6aaa62ba58685324c5907b5e3b996b10cdc0d1d6efadab837448dec9b7c8d` | `ad3b605d17b2d2c9df68e7ff9c33cb48e5fa212aa1ff8361ac81605813b73643` | 17 insertions/17 deletions |
| `tauri-app/src/lib/bridges/compose.ts` | `6577e90f2c0ccc47bf4e09304d3ddf971bd63e10e891b9aa6efc2020cf998a5f` | `2e7bb1bd5aa69aa2dadf2a752afffcf35620a38067c2f3e1f1dfb234b18a792f` | 7 insertions/8 deletions |
| `tauri-app/src/lib/bridges/ipc-contracts.ts` | absent | `5b9a1a5254a91bd96ac1aee87c86fb792134517edb4bd966ed050d0229caa8e1` | new, 93 lines |
| `tauri-app/src/lib/bridges/ipc-contracts.spec.ts` | absent | `bed4e17089e6d5d91e16bd638563a66ac8687419da44c2e19740d57940770a74` | new, 314 lines |

Installed Zod remains direct version 4.1.11. Package manifests, package locks, native manifests and root `Cargo.lock` are unchanged.

## Live contract and implementation

I inspected current `commands_types.rs` and command constructors before defining the schemas. Serde camelCase output is:

- `extract_video_frame`: required nonempty String `path` and required nonempty String `timestampUsed`;
- `probe_video`: required finite nonnegative f32 `duration`, plus required `fps` serialized as either null for Rust `None` or a finite positive number for `Some`;
- `extract_video_strip`: required nonempty String `path`;
- `compose_grid`: required nonempty String `path` and positive integer u32 `width`, `height`, `gridCols`, and `gridRows`.

`ipc-contracts.ts` now owns focused Zod schemas, inferred response types, command-specific parsers, and `IpcResponseError`. Invalid successful replies carry `code: 'invalid-response'`, the exact command, a first-issue field diagnostic, and the original Zod error as `cause`. Each real bridge awaits the unchanged `tauriInvoke`, then parses immediately. Native invoke rejection occurs before parsing and is propagated as the identical error object.

Schemas do not coerce numeric strings, add defaults, accept snake_case aliases, or trim/rewrite strings. Zod object projection removes undeclared reply fields. Grid numerics reject zero, negatives, fractions, nonfinite numbers, and values above u32 max. No filesystem/path-confinement, PTS, source-byte, artifact, group, escrow, or ownership claim is made.

## Regression-first and positive proof

I created the parser module and complete compiling test module while leaving both real bridges unhooked, then ran:

`npm run test -- --run src/lib/bridges/ipc-contracts.spec.ts -t 'real bridge'`

The file compiled and ran 39 discovered tests; the four selected real-bridge cases all failed behaviorally while 35 were filtered. The existing bridges resolved malformed data instead of rejecting: frame omitted `timestampUsed`, probe returned infinite duration, strip returned an empty path, and grid omitted `gridRows`. Transcript SHA-256: `2888470b3d6b60127b723b34dafab798cc32be243be9656552cbe7fa9c86e349`.

After bridge hookup, the focused file passes 39/39. It covers:

- all four malformed payloads through the actual bridge functions;
- primitive, array, null, missing-field, wrong-type and empty-string shapes;
- numeric strings, NaN/infinities, negative duration, zero/negative/nonfinite fps, and invalid grid integer/u32 domains;
- valid frame timestamp, strip reply, duration zero, fps null, fps positive, and complete grid reply;
- exact frame/probe/strip/grid invoke command and argument shapes, including compose's null default and explicit max dimension;
- declared-field-only projection on all four reply types and exact preservation of nonempty path bytes, including surrounding spaces;
- identical propagation of native invoke failures for all four commands, distinct from `IpcResponseError` on malformed successful data.

The stricter inferred types compile against all current callers without any out-of-fence fixture or source change. No skipped/fails-marked case was added.

## Gate receipt

Executed on Darwin arm64 with installed Node 26.8.1, Zod 4.1.11 and Rust 1.90.0:

- Focused `ipc-contracts.spec.ts` — 39 passed.
- `npm run test -- --run` — 36 files, 473 tests passed (39 above phase021's 434).
- `npm run check` — 0 errors and the same two accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` and `npm run format:check` — pass.
- `node --test scripts/profiling/*.test.mjs` — 88 passed, 0 failed/skipped; explicit native emitter interop included.
- Root `node --test scripts/svelte-event-guard.test.mjs` — 10 passed.
- `cargo fmt --all -- --check` and `cargo clippy --workspace --offline -- -D warnings` — pass.
- `cargo test --workspace --offline` — 80 passed, 0 failed, 1 intentional ignored native emitter.
- `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots` — 1 passed.
- `cargo tree -p color-core --offline --edges normal` — pass; no Tauri normal dependency.
- Root `git diff --check` — pass.

Node20, Windows, Linux, installed-app/native interaction and actual Rust-to-JavaScript emission were not run. Tests mock transport and use hand-authored JavaScript objects grounded by source inspection; they prove renderer boundary behavior, not serialization parity. Only ordinary build/test outputs were created.

## Preservation and limits

The accepted native slices remain exact: phase021 `value_analysis.rs` `96cbd284106cadcddeb68d53071b2abd04b523a086204c0fda9408c0d7c3b9aa` and `audit_value_cache.rs` `31bd24135066a54430d0d1df74e979cc1fe8955533e5b3ba136fea2f8781e05d`; phase019 `compose_grid.rs` `c8fd9c946aa3b3ddc91e535cc19bdffecec06304a06d58d226f6539897297edc`, native `Cargo.toml` `5517c96aa3d13ab9e3a82ab6342b43622cf0d1142693d58901aceaa88d9ecf44`, root lock `e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454`; phase022 `cache.rs` `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994`, `main.rs` `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb`, and `ffmpeg.rs` `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c`.

Known-field projection intentionally discards unexpected fields rather than retaining them. That is schema compatibility policy, not proof the native side emitted the expected fields. No newly required artifact/group/escrow fields were introduced; those remain later protocol work. No blocker, scope amendment, or LOC bypass is required. Lead owns review/commit and the next exact-base assignment; phase029 was not started.
