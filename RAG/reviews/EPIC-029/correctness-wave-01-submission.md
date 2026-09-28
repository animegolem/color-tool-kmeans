# EPIC-029 correctness wave 01 — Code Lead submission

Submitted by Sol to the Review Lead on 2026-09-05. This is an uncommitted implementation submission for independent review. It does not claim ticket completion, merge, PR, release, or human acceptance.

## Candidate state

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base and current HEAD: `5baa20e021855fbc57aebf48fa0f9b3374ded281`
- State: nine fenced source files changed, all uncommitted and unstaged. No Git mutation was performed.
- `git diff --check`: exit 0.
- Final touched-file comparison: exactly the nine paths authorized by the implementation brief; no tracked dependency, configuration, native, color-core, design, ticket, PROJECT-RECORD, or INDEX delta exists in the candidate.

## 1. AI-IMP-179 — canonical renderer golden fixture path

Provenance: reproduced exactly the one-line renderer fixture-path correction already present as an uncommitted diff in `/Users/golem/.codex/visualizations/2026/09/04/01a06e41-5fbc-7d80-a106-606e924ac497/color-tool-kmeans-perf`, as specified by the brief. No numeric optimization from that checkout was used.

Changed file:

- `tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts`
  - Replaced the removed native fixture URL with `../../../../../color-core/tests/fixtures/color_golden.json`.
  - Numerical assertions and fixture bytes are unchanged; no fixture was copied or regenerated.

Before/after proof:

- Pre-fix `npm run test -- --run src/lib/exports/__tests__/color-goldens.spec.ts`: exit 1; 1 file failed, 1 test failed. The failure was `ENOENT` for the removed path `tauri-app/src-tauri/tests/fixtures/color_golden.json`.
- Post-fix same command: exit 0; 1 file passed, 1 test passed.

Proposed commit subject for the lead:

`test(exports): restore canonical color golden fixture [AI-IMP-179]`

## 2. SWEEP-004 — partial AI-IMP-180 adoption

Source provenance: reviewed source commit `362b4a4a9327040682944e89ddbb8fd3d138932c`. Its exact SWEEP-004 patch was inspected and adapted to the current candidate. No other sweep patch or RAG/INDEX delta was imported. This submission is only partial adoption and does not complete AI-IMP-180.

Changed files:

- `tauri-app/src/lib/services/async-listener.ts` (new)
  - Adds the shared `mountAsyncListener` lifecycle helper.
  - Reports synchronous registration throws and asynchronous registration rejections.
  - Releases a registration that resolves after disposal.
  - Makes repeated disposal idempotent and reports cleanup exceptions.
- `tauri-app/src/lib/services/drag-drop.ts`
  - Makes sequential listener registration failure-atomic.
  - Rolls back already acquired listeners in reverse order after a later failure.
  - Continues rollback/normal teardown if an individual cleanup callback throws.
  - Makes returned normal teardown idempotent.
- `tauri-app/src/lib/services/drag-drop.spec.ts` (new)
  - Adds three focused SWEEP-004 tests for async failure rollback, synchronous registration throw, repeated normal disposal, and cleanup-throw isolation.
- `tauri-app/src/lib/views/HomeView.svelte`
  - Uses the shared helper and an explicit Home drag/drop setup error reporter.
- `tauri-app/src/lib/views/ValuesView.svelte`
  - Uses the shared helper and an explicit Values drag/drop setup error reporter.
- `tauri-app/src/lib/views/BatchView.svelte`
  - Owns Batch drag/drop setup/cleanup through the shared helper and an explicit error reporter.
- `tauri-app/src/lib/views/batch/batch-drop.svelte.ts`
  - Removes the duplicated lifecycle implementation and returns `setupTauriDragDrop` directly; batch selection/pinning logic is unchanged.
- `tauri-app/src/lib/views/__tests__/audit-resource-integrity.spec.ts`
  - Moves the helper import to the shared service.
  - Retains and strengthens the late-registration-after-unmount regression.
  - Adds async rejection, synchronous throw, and repeated normal-disposal regressions.

Failure-path evidence:

- Later async listener registration rejection releases every earlier listener.
- Rollback is reverse-order and continues when one cleanup throws; both earlier cleanup spies are observed once.
- A synchronous registration throw rejects setup and releases the already acquired listener.
- Unmount before async registration resolves releases the late registration once, even after repeated disposal.
- Normal resolved disposal releases once after repeated cleanup calls.
- Registration errors are consumed by the explicit reporter; no `it.fails`, skips, or harness changes were added.

Test delta: six new focused test cases (three in `drag-drop.spec.ts`, three added to `audit-resource-integrity.spec.ts`) and one existing late-registration regression adapted/strengthened.

Proposed commit subject for the lead:

`fix(events): make drag registration failure-atomic [SWEEP-004] [AI-IMP-180]`

## Validation at combined uncommitted tip

Frontend, from `tauri-app`:

- Golden focused post-fix: exit 0; 1 file passed, 1 test passed.
- `npm run test -- --run src/lib/services/drag-drop.spec.ts src/lib/views/__tests__/audit-resource-integrity.spec.ts src/lib/views/__tests__/audit-control-flow-races.spec.ts`: exit 0; 3 files passed, 23 tests passed (3 + 5 + 15).
- `npm run test -- --run`: exit 0; 17 files passed, 185 tests passed.
- `npm run check`: exit 0; 0 errors and 2 existing accepted warnings (`VideoPanel.svelte:33`, `ValuesView.svelte:265`, both noninteractive `tabindex`).
- `npm run lint`: exit 0.
- `npm run format:check`: exit 0; all matched files use Prettier formatting.
- Local Prettier was run only on the nine fenced source paths.

Native, from `tauri-app/src-tauri`:

- `cargo fmt --all -- --check`: exit 0.
- `cargo clippy --workspace -- -D warnings`: final exit 0.
- `cargo test --workspace`: exit 0; 48 tests passed, 0 failed, 0 ignored (26 color-core tests and 22 tauri-app/probe/audit tests; doc-test suites contain 0 tests).
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline`: exit 0; 1 test passed.
- Additional bounded `cargo test -p color-core --offline`: exit 0; 26 tests passed across unit/integration suites.
- Additional bounded `cargo clippy -p color-core --offline -- -D warnings`: exit 0.
- `cargo tree -p color-core --edges normal`: exit 0; the normal dependency tree contains no Tauri dependency.

Final scope checks:

- `git diff --check`: exit 0.
- `git status --short`: exactly seven modified tracked files and two new untracked files, matching the nine-file fence.
- Candidate branch and HEAD reverified after all gates and remain unchanged.

## Toolchain and platform

- macOS/Darwin 25.6.0 arm64.
- Node v26.8.1.
- npm 11.19.0.
- rustc 1.90.0 (`1159e78c4 2025-09-14`).
- cargo 1.90.0 (`840b83a10 2025-07-30`).

Node 20 and Windows/Linux evidence were not executed in this submission.

## Friction, environment artifacts, and deviations

- The first combined `apply_patch` attempt failed atomically because one trailing-comma context did not match; it changed no file. The same bounded edits were then applied in smaller patches.
- The first workspace clippy attempt used permitted `--offline` and exited 101 before compilation because cached crate `cc v1.4.5` was missing. Retrying the required online command downloaded missing registry/cache material, reached the Tauri build script, and exited 101 because the private FFmpeg sidecars had been provisioned one directory too deep at `src-tauri/bin/bin/`.
- The Review Lead corrected provisioning by copying the exact two gitignored binaries to `src-tauri/bin/`, preserving executable permissions and verifying destination hashes against the nested copies and main. After that environment-only correction, the exact required workspace clippy and test commands passed. Redundant nested copies remain for the lead to clean up; this submission did not modify them.
- Cargo updated/downloaded local registry/cache material and produced normal `target/` build outputs. `cargo tree` printed `Locking 499 packages to latest compatible versions`, but final status confirms no tracked `Cargo.lock` or manifest delta.
- Pre-existing private `node_modules` was used. No `npm install` or `npm ci` ran.
- The full app was not launched. Native drag/drop behavior and general UI behavior remain outstanding human acceptance checks, as allowed by the brief.
- No ticket checklist/status or Issues Encountered field was changed. No validate-tickets script was claimed. No INDEX regeneration was attempted.

## Final file list

1. `tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts`
2. `tauri-app/src/lib/services/async-listener.ts`
3. `tauri-app/src/lib/services/drag-drop.ts`
4. `tauri-app/src/lib/services/drag-drop.spec.ts`
5. `tauri-app/src/lib/views/HomeView.svelte`
6. `tauri-app/src/lib/views/ValuesView.svelte`
7. `tauri-app/src/lib/views/BatchView.svelte`
8. `tauri-app/src/lib/views/batch/batch-drop.svelte.ts`
9. `tauri-app/src/lib/views/__tests__/audit-resource-integrity.spec.ts`

Ready for independent Review Lead reproduction and the lead-owned two-commit split. No further wave work was started.
