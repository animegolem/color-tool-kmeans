# EPIC-029 correctness wave 03 — Code Lead submission

Submitted by Sol to the Review Lead on 2026-09-05. This is an uncommitted implementation submission for independent review. It does not claim ticket completion, merge, PR, release, a rebuilt app, native interaction, or owner acceptance.

## Candidate state

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Required base and current HEAD: `58880e0feb8baee754230be9d28acb8a683147ef`
- Initial precondition: branch and HEAD matched the brief; `git status --porcelain=v1 -uall | wc -l` returned `0` before edits.
- All five accepted local commits above main remain unchanged: IMP-179, SWEEP-004, SWEEP-009, SWEEP-011, and IMP-201. No ref movement occurred.
- Actual final candidate state: three modified tracked source files and two new untracked spec files, all unstaged and uncommitted.
- Final source comparison is exactly the five paths authorized by the Wave 03 brief. No lock, package, configuration, native, color-core, store, fixture, generated INDEX, ticket, record, prior report, design, build, or running-app delta exists in the candidate.
- `git diff --check`: exit 0.

## 1. SWEEP-003 — reset cached seek ownership

Source provenance: adapted reviewed source commit `a09c834d0d2ac990bbed210ebbf206a3057ca665`. Result is an uncommitted patch; no resulting commit SHA is claimed.

Independent staging group for the lead:

1. `tauri-app/src/lib/views/home/video-controller.svelte.ts`
2. `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` (new)

Implementation:

- Complete `resetVideoState()` now clears `_restoringFromSessionCache` and `_pendingSeekTime` alongside the existing video identity, timers, and presentation state.
- A fresh video therefore starts at zero and analyzes its decoded frame instead of inheriting cached A's seek or analysis-reuse mode.
- Normal exact cached restore remains unchanged: the cached seek is assigned after reset, restoration mode is set after the cached state is installed, and a matching cached analysis still seeds the request key instead of re-running analysis.
- No step-during-restore identity behavior, cache-content equality, store state, or result-key semantics were changed; those remain IMP-182 after IMP-181/192.

Regression evidence:

- Pre-fix command: `npm run test -- --run src/lib/views/home/video-controller-cache-reset.spec.ts`.
- Pre-fix result: exit 1; 1 file / 1 test failed behaviorally. Cached A at 7 seconds caused fresh B's `videoCurrentTime` to be 7 (`expected 0, received 7`). This was not a missing import or harness failure.
- Post-fix issue focus: exit 0; 1 file / 3 tests passed.
- The three permanent cases prove cached-A-to-fresh-B reset, a positive exact cached seek/analysis-reuse control, and repeated full reset followed by a fresh zero-time decode.

Test delta for this issue: 3 frontend tests in the new focused spec.

Proposed lead commit subject:

`fix(video): reset cached seek ownership [SWEEP-003] [AI-IMP-180]`

## 2. SWEEP-008 — snapshot settled frames

Source provenance: adapted reviewed source commit `0857489c2f658c795c29df7f51aa2ba217cf7b65`, strengthened for W3-1 and bounded by W3-2. Result is an uncommitted patch; no resulting commit SHA is claimed.

Independent staging group for the lead, after the preceding SWEEP-003 commit:

1. `tauri-app/src/lib/views/ValuesView.svelte`
2. `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
3. `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts` (new)

Implementation:

- `scheduleFrameExtract()` marks `extracting` synchronously before the 250 ms timer, so snapshot eligibility is false throughout both debounce and active extraction.
- The existing decode token remains the completion owner. A stale completion cannot clear a newer request's pending state because the `finally` block still compares its token to the live token.
- Path changes already revoked the prior token and pending timer; destruction now also resets `extracting` immediately after revocation.
- New pure `settledFrameSnapshotRequest()` accepts only a non-pending `ImageEntry` with a non-empty path and a non-null/undefined `frameTimestamp`. Timestamp zero remains valid.
- The helper constructs `framePath`, `name`, and `timestamp` from the same settled entry. `ValuesView` derives this request once and uses it for both SnapshotButton disabled state and the capture handler.
- `captureFrame()` no longer combines `runner.file.path` with mutable `scrubber.currentTime`.
- Wave 01 Values listener/disposal code is unchanged.

W3-1 proof:

- Pre-fix command: `npm run test -- --run src/lib/views/values/video-scrubber-snapshot.spec.ts` with the load-bearing debounce regression only.
- Pre-fix result: exit 1; 1 file / 1 test failed behaviorally. Immediately after scheduling, `extracting` was false (`expected true, received false`). This was not a missing import or harness failure.
- Post-fix issue focus: exit 0; 1 file / 10 tests passed.
- Permanent coverage includes four pure ineligible inputs (null file, empty path, missing timestamp, pending decode), timestamp zero eligibility, debounce plus active extraction, exact three-field settled-entry provenance, coalesced seeks, stale active completion, current-request rejection, path switching, and destruction.
- The rejection case keeps a prior frame at timestamp 0.5 while the requested playhead advances to `1 + 1/24 + 1/24`, proving the surviving request still uses the prior settled entry's path/name/timestamp rather than the newer playhead.
- Deferred promises, fake timers, and after-each rune descriptor restoration are local to the focused spec. No skip, `it.fails`, source-text proxy, or generalized harness was added.

W3-2 boundary:

- Existing `frameTimestamp` production semantics remain request-time based. The bridge's `timestampUsed` string is logged as before and is not promoted to a new decoded-frame identity contract.
- The provenance test deliberately returns `timestampUsed: '9.999'`; the settled entry retains the existing request-time value. This proves no convention change is implied.
- Decode rejection does not call `onFrameExtracted`, fabricate an entry, or replace the prior settled capture. No automatic recovery UX was added.
- Successor-owned cross-view reacquisition and requested-versus-settled identity integration remain IMP-183; no claim is made that navigation during pending decode now converges.

Test delta for this issue: 10 frontend tests in the new focused spec.

Proposed lead commit subject:

`fix(values): snapshot only settled frames [SWEEP-008] [AI-IMP-180]`

## Combined validation at the uncommitted tip

Frontend, from `tauri-app`:

- Required four-file focus command: `npm run test -- --run src/lib/views/home/video-controller-cache-reset.spec.ts src/lib/views/values/video-scrubber-snapshot.spec.ts src/lib/views/__tests__/audit-control-flow-races.spec.ts src/lib/views/__tests__/audit-resource-integrity.spec.ts`.
- Required focus result: exit 0; 4 files / 33 tests passed (3 cache reset + 10 settled snapshot + 15 control-flow audit + 5 resource-integrity audit).
- `npm run test -- --run`: exit 0; 21 files / 222 tests passed.
- `npm run check`: exit 0; 0 errors and the same 2 accepted existing noninteractive-`tabindex` warnings (`VideoPanel.svelte:33`, `ValuesView.svelte:267` in current diagnostics).
- `npm run lint`: exit 0.
- `npm run format:check`: exit 0; all matched files use Prettier formatting.
- Local bundled Prettier was run only on the five fenced renderer paths; no install was attempted.

Native, run sequentially from `tauri-app/src-tauri`:

- `cargo fmt --all -- --check`: exit 0.
- `cargo clippy --workspace --locked --offline -- -D warnings`: exit 0; finished the dev profile with no warning/error.
- `cargo test --workspace --locked --offline`: exit 0; 50 tests passed, 0 failed, 0 ignored (26 color-core plus 24 tauri-app/probe/audit/cache tests; doc-test suites contain 0 tests).
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --locked --offline`: exit 0; 1 test passed.
- `cargo tree -p color-core --edges normal --locked --offline`: exit 0; no Tauri dependency appears in the normal color-core tree.

Final scope and identity checks:

- Branch and HEAD reverified after validation: `codex/correctness-wave-01-2026-09-05` at `58880e0feb8baee754230be9d28acb8a683147ef`.
- `git status --porcelain=v1 -uall`: exactly three modified and two new paths matching the five-file Wave 03 fence.
- `git diff --check`: exit 0.
- No Git staging, commit, reset, checkout, cleanup, fetch, rebase, or ref mutation ran.

## Toolchain and platform

- macOS 26.6.2 arm64.
- Node v26.8.1.
- npm 11.19.0.
- rustc 1.90.0 (`1159e78c4 2025-09-14`).
- cargo 1.90.0 (`840b83a10 2025-07-30`).

Node 20 and Windows/Linux CI/packaging evidence were not executed.

## Residuals, failures, recovery, and friction

- The two deliberate pre-fix regressions failed for their intended behavioral reasons and were retained as passing permanent coverage after implementation.
- The first expanded post-fix snapshot run passed 9/10 cases; one test compared mathematically equivalent but binary-distinct floating expressions (`1 + 2/24` versus the controller's sequential `1 + 1/24 + 1/24`). The assertion was corrected to mirror actual sequential stepping. The focused snapshot suite then passed 10/10, the required focus passed 33/33, and the final full suite passed 222/222. No production behavior changed for that test correction.
- Exact cached content/frame/settings eligibility during step or seek remains IMP-182. Cross-view pending intent/successor reacquisition remains IMP-183. Neither residual is claimed closed by this reset/snapshot slice.
- Native video interaction, rapid source/view switching, actual snapshot copy behavior, Node 20, cross-platform CI/packaging, and owner listening/acceptance were not run by Sol. The already open smoke-tested bundle was not rebuilt, closed, replaced, inspected, or interacted with.
- Normal existing Cargo `target/` output was updated by native gates. Private installed dependencies, locked native graph, caches, sidecars, and the running bundle were left in place. No package installation, provisioning, dependency update, fixture regeneration, or cleanup ran.
- No ticket/checklist/status, PROJECT-RECORD, INDEX, prior report, or CLAUDE file was edited. AI-IMP-180 remains partial; no aggregate checklist item is claimed complete.

## Final source file list

1. `tauri-app/src/lib/views/home/video-controller.svelte.ts`
2. `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
3. `tauri-app/src/lib/views/ValuesView.svelte`
4. `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
5. `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`

Ready for independent Review Lead reproduction and the lead-owned two-commit split. No further wave work was started.
