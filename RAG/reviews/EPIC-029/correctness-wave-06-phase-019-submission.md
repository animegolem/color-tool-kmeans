# Correctness wave 06 — phase019 submission

Code Lead -> Review Lead, 2026-09-06. Adapted SWEEP-019 only; candidate changes remain uncommitted. No phase021, registry, quota, reclamation, publication, lease, app, package, live-cache, evidence, or Git action was taken.

## Exact base, fence, and source provenance

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base/current HEAD: `5d22118d9a708b49181ff2e154d84c0bb090398b` (`fix(cache): retain active-session artifacts [AI-IMP-180] [SWEEP-022] [loc-bypass]`). The candidate was clean at assignment and HEAD did not move.
- Normative brief: planning PROJECT-RECORD rev0.65 and `correctness-wave-06-phase-022-verdict-and-019-brief.md`.
- Historical behavior source: `84c8f88b85752303cfb3a4dce6f1670920bf7168` (`fix(batch): isolate concurrent grid generations [SWEEP-019]`). I adapted its independently retained tempfile writer to the live base and expanded the real-producer proof required by rev0.65; I did not cherry-pick its obsolete stack or tracking changes.
- Candidate status contains exactly two allowed paths, 126 insertions/10 deletions. Status-list SHA-256: `16f1f43ca2563cf2d8096030862da1d1e4fac12b46305df46b73e23523a16731`; changed-path-list SHA-256: `8dca0428a196994be90094499d063a95aa01a42e6273e5fc2bf30dda9c07e3d4`; binary-diff SHA-256: `e0d8fa568b1b9b333e70604d5bc602b2c844e02f17af3eb9f520990acafc8416`.

| Candidate path | Prepared SHA-256 | Delta and fence account |
| --- | --- | --- |
| `tauri-app/src-tauri/src/compose_grid.rs` | `c8fd9c946aa3b3ddc91e535cc19bdffecec06304a06d58d226f6539897297edc` | 126 insertions/8 deletions; unique retained writer plus focused in-module regressions only |
| `tauri-app/src-tauri/Cargo.toml` | `5517c96aa3d13ab9e3a82ab6342b43622cf0d1142693d58901aceaa88d9ecf44` | zero insertions/2 deletions: removed only the section boundary so the existing `tempfile = "3.10"` requirement moves from dev to normal dependencies |

`Cargo.lock` at repository root remains byte-identical to the base at SHA-256 `e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454`; Cargo required no metadata rewrite because `tempfile` was already a resolved direct package dependency. `cargo tree -p tauri-app --offline --edges normal --depth 1` now shows direct `tempfile v3.27.0`, preserving the compatible resolution. No `tauri-app/src-tauri/Cargo.lock` exists or was created. No other candidate path changed.

## Implementation and executable proof

`compose_grid` now asks `tempfile::Builder` for an exclusive `batch-grid-*.png` inside the supplied cache. It encodes the unchanged RGBA canvas explicitly as PNG through that owned file, calls `sync_all`, and only then `keep`s the tempfile and returns the retained path. An error before retention drops the temporary owner through RAII. The returned tuple, dimensions/layout/gap/scaling/image decoding/argument behavior, and PNG encoding remain otherwise unchanged.

Regression-first receipt: after adding the barrier-coordinated real-producer test but before changing the writer, this compiled and ran:

`cargo test -p tauri-app sweep_019_concurrent_compositions_retain_unique_immutable_outputs --offline -- --nocapture`

It failed 0 passed/1 failed/15 filtered because both completed red and blue workers returned the same `batch-grid.png` path; the `assert_ne!` showed identical left/right paths. This is the intended fixed-name behavioral counterexample, not a compile failure. Preserved transcript SHA-256: `2b592d8a2fa4780e9f8fd88be81fd882c273327c084db490b7b615f3fa759e57`.

After the production correction, focused `compose_grid::tests` passes 11/11. The proof now covers:

- two barrier-released red/blue real compositions into one TempDir returning different paths and decoding to their matching pixels after both workers join;
- a third same-cache green composition returning another path, followed by exact rereads proving both earlier byte vectors remain unchanged;
- repeated identical input in the same cache returning distinct paths with byte-identical PNG payloads;
- existing layout, transparent-gap, scaling, count-bound, and unreadable-input behavior;
- unreadable input and an existing regular file used as the cache destination both return errors while unrelated fixture bytes remain exact.

The retained outputs are reopened after the producer-local file handle is dropped. Tests use no sleeps or assumed random filename. No skipped or fails-marked regression was added.

## Gate receipt

Executed on Darwin arm64 with Rust 1.90.0 and installed Node 26.8.1:

- Focused native: `cargo test -p tauri-app compose_grid::tests --offline` — 11 passed, 0 failed, 5 filtered in the library target; ancillary targets contained no selected failures.
- `cargo fmt --all -- --check` — pass.
- `cargo clippy --workspace --offline -- -D warnings` — pass.
- `cargo test --workspace --offline` — 77 passed, 0 failed, 1 intentional ignored native profiling emitter. The total is two above phase022's 75 because this phase adds the concurrency regression and unusable-cache control.
- `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots` — 1 passed.
- `cargo tree -p color-core --offline --edges normal` — pass; no Tauri dependency in the normal tree.
- `npm run test -- --run` — 35 files, 434 tests passed.
- `npm run check` — 0 errors and the same two accepted AUD-020 noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` — pass.
- `npm run format:check` — pass.
- `node --test scripts/profiling/*.test.mjs` — 88 passed, 0 failed/skipped; includes the explicit native emitter interop execution.
- Root `node --test scripts/svelte-event-guard.test.mjs` — 10 passed.
- Root `git diff --check` — pass.

Windows, Linux, and Node20 were not available/run; no cross-platform or installed-app acceptance is claimed. Test/build outputs and isolated TempDir fixtures only were created.

## Phase022 preservation and honest limits

The five phase022 paths remain at the accepted hashes: `cache.rs` `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994`; `main.rs` `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb`; `ffmpeg.rs` `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c`; `value_analysis.rs` `f4ff591cde6ce9319c521fbf18764eaac8c7c37ed58b42b0a573f0d2f041ff85`; `audit_value_cache.rs` `d66ceec7e822407cc8ae15eb102801b583c0a1793c1f48aa9e1ee0367ea34271`.

This proves collision-safe retained Batch grid outputs and deterministic encoded payloads on the exercised local paths. It does not prove or implement atomic group publication, trusted immutable source identity, cancellation, leases, ownership-aware reclamation, generation retirement, quotas, or storage-pressure policy. Successful files intentionally accumulate until later IMP-186/193 ownership work. Invalid-input and unusable-cache failures are exercised; output encode, `sync_all`, and `keep` failures are not deterministically injected, so only their propagation/RAII structure is source-confirmed. The cohesive in-module file is now 415 lines and should receive an explicit lead LOC review rather than an out-of-fence split.

No implementation blocker or scope deviation remains. Lead owns review, commit, and any later exact-base assignment; phase021 was not started.
