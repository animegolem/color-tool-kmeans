# Correctness wave 06 phase022 — Windows fixture access Round 02

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.64 and `correctness-wave-06-phase-022-amendment-01.md` A1. Review state: **SUBMITTED; source/test uncommitted; not accepted; stop before phase019.**

## Outcome and preserved carrier

- Candidate remains `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, branch `codex/correctness-wave-01-2026-09-05`, exact HEAD `933d888880ee5507aa0ce4ee2b81bcdc3756e3ff`.
- Original submission remains unchanged at SHA-256 `64a1ba088f90529790028f52e2ade4b877e4b93f86f26909f544444b3abdd862`.
- Round 02 changes only `tauri-app/src-tauri/tests/audit_value_cache.rs`. The four production prepared hashes are byte-identical to Round 01.
- Candidate status remains exactly the original five authorized tracked modifications. Status-list SHA-256 remains `7174b3fcbddc21bd6b8e0b476482a60d3e635a699816a1697d2fee0e5806e800`.
- Updated combined `git diff --binary` SHA-256 is `2b46abe34ce040121591dfdf2e73121182bae440354653512919a82ffcf12fac`.
- Updated base-to-prepared payload is **174 additions, 55 deletions** across the same five files. Round 02 adds 36 test lines over Round 01 and changes no production line.
- No new file/dependency/environment, ticket/INDEX, config/lock, other prerequisite, quota/registry, app/build/package, runtime cache/evidence, Git staging/commit/config, main/ref, or release action occurred.

Exact `git status --short`:

```text
 M tauri-app/src-tauri/src/cache.rs
 M tauri-app/src-tauri/src/ffmpeg.rs
 M tauri-app/src-tauri/src/main.rs
 M tauri-app/src-tauri/src/value_analysis.rs
 M tauri-app/src-tauri/tests/audit_value_cache.rs
```

## Updated manifest and production preservation

| File | Base SHA-256 | Round 01 prepared | Round 02 prepared | Prepared LOC |
|---|---|---|---|---:|
| `tauri-app/src-tauri/src/cache.rs` | `f3e952345e2b8c4be8519e25ff3fcafee505a1f79f403984f36c0995fc878e4b` | `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994` | `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994` | 358 |
| `tauri-app/src-tauri/src/main.rs` | `5c889a8dbd119875ad36d4b2b158b355f177bd03de981373fa262bb7af4e77e0` | `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb` | `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb` | 206 |
| `tauri-app/src-tauri/src/ffmpeg.rs` | `c966e0dd79c078e9c09ce326a48e20aec9d7e68f68135d47477dc6e57a49d80a` | `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c` | `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c` | 406 |
| `tauri-app/src-tauri/src/value_analysis.rs` | `998d0c154f0de4278de08398c399114de57489b3a2dac184161f581a1d81037c` | `f4ff591cde6ce9319c521fbf18764eaac8c7c37ed58b42b0a573f0d2f041ff85` | `f4ff591cde6ce9319c521fbf18764eaac8c7c37ed58b42b0a573f0d2f041ff85` | 740 |
| `tauri-app/src-tauri/tests/audit_value_cache.rs` | `d9d86407a3d3ff7bf216139ec362c4480bfc0d32945dc38c0985821335958bb6` | `aea737a679cf0a44e985ed59cfc2274925f6d691b7054e402a493af91f81a22b` | `d66ceec7e822407cc8ae15eb102801b583c0a1793c1f48aa9e1ee0367ea34271` | 200 |

The four equal Round 01/Round 02 production hashes are the direct preservation proof. The production pruning adaptation, retention values, explicit cleanup, call-site inventory and real producer negative/positive evidence remain exactly as reported in Round 01.

## A1 correction

- The Windows helper no longer calls `.read(true)`. It uses `OpenOptionsExt::access_mode(FILE_WRITE_ATTRIBUTES_ACCESS)` where the named local constant is the minimal Win32 `FILE_WRITE_ATTRIBUTES` value `0x0000_0100`.
- It retains the separately named `FILE_FLAG_BACKUP_SEMANTICS` value `0x0200_0000`, required to open a directory through `CreateFile`.
- `access_mode` overrides `CreateFile.dwDesiredAccess`; requesting only attribute-write access avoids arbitrary file-data write rights. Default `OpenOptions` still uses existing-file-only behavior: no create, create-new, truncate, append or data-write option is enabled.
- The same `File` handle is passed to stable `File::set_times`. The non-Windows helper remains unchanged.

Source/API basis: Rust's Windows [`OpenOptionsExt::access_mode`](https://doc.rust-lang.org/std/os/windows/fs/trait.OpenOptionsExt.html#tymethod.access_mode) contract and [Rust 1.90 Windows implementation](https://github.com/rust-lang/rust/blob/1.90.0/library/std/src/sys/fs/windows.rs#L233); Microsoft's [`SetFileTime`](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfiletime) and [file-access-right](https://learn.microsoft.com/en-us/windows/win32/fileio/file-access-rights-constants) documentation. This corrects the source-proven access contract but is not a claimed Windows reproduction.

## Permanent helper control

New `sweep_022_timestamp_helper_updates_file_and_directory_without_altering_bytes` is discovered normally on every platform. It:

1. creates one real directory and a six-byte regular file beneath it;
2. invokes the production test helper separately on the file and directory with the exact integral-second timestamp `UNIX_EPOCH + 24h`;
3. reads both modified times back through filesystem metadata and requires exact equality; and
4. rereads and requires the original six file bytes unchanged.

This exercises the actual platform branch rather than a source-string assertion. On Windows it covers both the minimal timestamp access and directory-opening flag under normal `audit_value_cache` discovery. The existing real Values producer regression and AUD-005 test bodies were not weakened or replaced; all three audit tests pass locally.

## Final validation receipts

All commands used installed dependencies and offline Cargo resolution. Host/toolchain: macOS 26.6.2 (25G83), Node v26.8.1, npm 11.19.0, rustc 1.90.0, cargo 1.90.0.

1. Focused `cargo test --offline --test audit_value_cache`: **3 passed, 0 failed, 0 ignored**: helper file/directory readback plus unchanged bytes, real Values prior-byte survival plus valid new outputs, and unchanged AUD-005 freshness.
2. Focused `cargo test --offline cache::tests::`: **5 passed, 0 failed, 0 ignored**.
3. Focused Values size-policy control: **1 passed, 0 failed**.
4. `cargo fmt --all -- --check`: exit 0; no diagnostics.
5. `cargo clippy --workspace --offline -- -D warnings`: exit 0; no diagnostics.
6. `cargo test --workspace --offline`: **75 passed, 0 failed, 1 intentionally ignored**. The ignored profiling emitter is exercised by the passing Node interoperability suite.
7. `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`: **1 passed, 0 failed**.
8. `cargo tree -p color-core --offline --edges normal`: no Tauri dependency matched.
9. `npm run test -- --run`: **35 files passed, 434 tests passed**.
10. `npm run check`: **0 errors and 2 warnings in 2 files**; both are the accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
11. `npm run lint`: exit 0; no diagnostics.
12. `npm run format:check`: `All matched files use Prettier code style!`
13. From `tauri-app/`, `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**; native writer interoperability ran.
14. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
15. `git diff --check`: exit 0; no diagnostics.

## Evidence limits and stop point

- `rustup target list --installed` reports only `aarch64-apple-darwin`; no Wine/Windows runtime is present. No toolchain or runtime was installed. The Windows branch was therefore not compiled or executed here.
- Local file/directory behavior is executed evidence. Windows correctness is bounded source/API evidence plus a normally discovered platform-specific runtime control for CI; it is not an executed Windows failure or pass.
- Round 01's limitations remain: no app launch/build/package, actual cache cleanup, mounted timer/FFmpeg run, native artifact-lifetime stress, leases, concurrency-safe explicit deletion, bounded growth, admission/pressure policy, registry, owner interaction, Windows/Linux/Node20 CI, merge, release or aggregate AI-IMP-180 acceptance.
- Existing touched 406-line `ffmpeg.rs` and 740-line `value_analysis.rs` remain production-identical to Round 01; lead-owned commit handling retains the historical `[loc-bypass]` consideration.
- Source-fence deviation: none. Round 02 changes one authorized test path only. Candidate remains uncommitted on `933d888`; no phase019 work began.

Stop point: phase022 Round 02 review gate. Review Lead owns independent review, issue commit/integration and any next exact-base assignment.
