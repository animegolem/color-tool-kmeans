# Correctness wave 05 phase183 — requested/settled video handoff submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.60 §§3–8,11 and `correctness-wave-05-phase-182-verdict-and-183-brief.md` H1–H4. Review state: **SUBMITTED; source and tests uncommitted; not accepted; combined wave stops here.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base and HEAD remain the exact accepted phase182 commit `8a8e13381410841674015ae27da9310c3c659fbe`.
- Candidate status is exactly ten authorized tracked modifications and the one authorized new handoff suite. Status-list SHA-256 is `55725cf326f0e05ce1ff3b4e83eafa5e8da466630f93ed790a1f7e2bc54c0dcc`.
- The combined binary diff stream (`git diff --binary`, then the new handoff suite as a `/dev/null` no-index diff) has SHA-256 `aae52998b7f188d1835078e778584a877963e0b069edbad88ef9050f344c1e17`.
- Payload is **1,621 additions, 290 deletions**: 1,060 tracked additions and 290 tracked deletions, plus 561 lines in the new suite.
- No file outside the exact six-production/five-test fence changed. There was no ticket/INDEX, native/core/bridge, profiling, dependency/lock, hook, timing policy, EPIC026, app/build, Git staging/commit/config, cleanup, owner-control, or release mutation.

Exact `git status --short`:

```text
 M tauri-app/src/lib/stores/video.ts
 M tauri-app/src/lib/views/HomeView.svelte
 M tauri-app/src/lib/views/ValuesView.svelte
 M tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts
 M tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts
 M tauri-app/src/lib/views/home/video-controller.svelte.ts
 M tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts
 M tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts
 M tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts
 M tauri-app/src/lib/views/values/video-scrubber.svelte.ts
?? tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts
```

## Exact files and hashes

| File | Base SHA-256 | Prepared SHA-256 | Base -> prepared LOC |
|---|---|---|---:|
| `tauri-app/src/lib/stores/video.ts` | `2dbea4c96e46b774d7449f2593244cece2d0c54493c0a88cd3aaf89fa396d799` | `11c29a172c7bfa937ea1990521cec10c1e458de17116b659831503ae25e8a761` | 39 -> 76 |
| `tauri-app/src/lib/views/HomeView.svelte` | `0c8c3abfd704e8f1f117b98f8d2390040586c844815c1c648ca22c7a3a855d30` | `32e837817fe27554ebf062f9ed9fc1c23b8e152a7a398c34f1b41609aa8a8b06` | 880 -> 887 |
| `tauri-app/src/lib/views/ValuesView.svelte` | `82d5bb705c1db64907808db49740bb2333498297e40f7a84b4a964579f5a94dc` | `ae097514f0eecda4256f922a1e333ddc1d13b607538df21f1cd233c6256b1e11` | 820 -> 860 |
| `tauri-app/src/lib/views/home/video-controller.svelte.ts` | `730f32f45e155e07a4a65b4a0f0f26c08d2587507a90f3657c3922562eabc39a` | `6756a52a3da5c416715acf97793bcdd71a697ec185f69628940cb586e451713d` | 896 -> 1,060 |
| `tauri-app/src/lib/views/values/video-scrubber.svelte.ts` | `ea7be3f372bcbc50961b7a7048c53ac4fe0f5995512331b2bcdc764235196e8c` | `0a2fc6eed19f77f8c42728dbac9312b985d8ad87521d1fc33c1df3af600abea3` | 234 -> 368 |
| `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts` | `795d6e62f7d9fd15b58a5e60565a707c09182cd1e061d1b84b64ceeec1b4655a` | `b7cff6ef3b5ea51af151488d50fc92f69c5d33ebf5d774fd7a9ace5749f1053b` | 209 -> 293 |
| `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts` | absent | `a8e34d876674a3a8aec775e2d088aa19dfa6818ccbe3a327be3586321d5ecb3a` | 0 -> 561 |
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | `c68ab09cd03d1350b4413034a04c00976d3df16c321bcbdc8474fa37334a6047` | `8cff3af3f8fb99c95dd9baafab30bc5046973265aa04b5b5cb21fa736f6b8b1a` | 480 -> 577 |
| `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts` | `4f52f5422ac3e47bd1f89dac1c28f71183b4de712bfef436ebb6ffbaf5644ff5` | `2528b614580b296aa7bc4e9740a1a74767f931dd70922a78d92d3f65bdd3a372` | 346 -> 385 |
| `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` | `23a94ce87ecdf193a393cb319f4681ab1c324c620e6a0e5cc06e91dac4317caf` | `b1a416c0c7c12c667d37261f2b898786cf74ce1743ff6554246fb16247334db0` | 275 -> 394 |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | `913f18f76fc121a7914884ce79b1208b026ef24752cc87f07226709bbdf9c713` | `50738b032a670515c01365b40fe30bfa8db16e25b5faa05341bd326e1083bbb1` | 1,220 -> 1,269 |

## Implementation and evidence levels

### H1 — requested playhead and accepted settlement

- `VideoState.currentTime` remains the requested playhead. Required `settledFrame` separately records selection epoch, admitted image ID and store-assigned content revision, output/video path, requested timestamp and extraction size. Optional strip identity preserves cached-strip ownership without claiming frame settlement.
- Home and Values publish the requested time synchronously before their existing debounce/native work. Only a locally current token/owner and epoch may continue, and settlement is constructed only after `setFile` accepts and normalizes the entry. Stale success, rejection and `finally` paths cannot clear or overwrite newer work.
- Probe completion merges measured duration/FPS into same-epoch state. It preserves a newer requested time, accepted settlement, poster/strip hints and strip identity rather than publishing hard-coded provisional fields.

### H2 — exact reuse or successor acquisition

- The shared pure matcher requires current epoch, path, requested timestamp, extraction size and exact selected-entry ID/revision/path/videoPath/frameTimestamp. Poster/cache metadata alone is never settlement.
- Both controllers deduplicate their local request tuple. Exact same-epoch settlement reuses the admitted entry/revision once while allowing destination-mode analysis; removed, replaced, mismatched or different-size state schedules successor-owned extraction. New selection epochs still take the conservative fresh-extraction path from phase182.
- Home restoration takes the logical ID from settlement/selection and cannot borrow an unrelated selected still. Missing metadata is probed under the retained epoch even when a poster hint exists; frame reacquisition follows after that probe settles.

### H3 — terminal local lifetime

- Home controller and Values ingestion now have idempotent terminal disposal; Values scrubber destruction remains terminal. Disposal cancels timers and local probe/frame/strip/load ownership and detaches controller element/subscription references without clearing the durable global selection or handoff state.
- Home and Values lifecycle cleanup invokes local disposal alongside the existing runner/profiling/listener cleanup. Generic analysis effects now require an exact selected video settlement and reconcile when actual selected-entry identity changes, preventing either destination from analyzing a still or stale frame as the requested video frame.
- Disposed promise success, rejection and `finally` cannot mutate global state/cache/analysis/errors or a successor's pending flags. Native promises may continue; this is renderer ownership evidence only.

### H4 — snapshots

- Values snapshot requests and Home's existing `videoPosterPath` seam are exposed only when the current epoch, requested/settled tuple, selected store entry and extraction size match exactly, with no pending mismatch. Debounce, IPC, handoff, failure, replacement and size-change states return null.
- The visual poster hint remains available internally; it does not grant snapshot eligibility.

## Permanent regression evidence

The full renderer suite grows from **34 files / 413 tests** at the accepted base to **35 files / 431 tests**: **+18 runtime tests**, with no skipped or expected-failure cases.

- New `video-view-handoff.spec.ts`: **10 tests** using real image/video stores, both production controller factories and Values ingestion with deferred mocked native IO. The matrix covers both debounce directions; disposed active-IPC success/rejection before and after successor completion; exact reuse with destination analysis; same-ID replacement reacquisition; Values pending-probe handoff; and Home pending-probe handoff with an unrelated selected still. This is factory/store integration, not mounted Svelte proof.
- `video-controller-cache-reset.spec.ts`: **+3 tests** (7 -> 10) for exact reuse/snapshot eligibility and idempotent terminal disposal across late frame success/rejection. All phase182 timing races remain.
- `file-ingestion-values-disposal.spec.ts`: **+4 tests** (11 -> 15) for overlapping probe/frame merge, late disposed probe success/rejection and successor probe reacquisition.
- `audit-control-flow-races.spec.ts`: **+1 test** (29 -> 30) proving a new same-path selection epoch clears cached settlement and extracts afresh. Independent-job, phase192 and phase182 matrices remain.
- `video-scrubber-snapshot.spec.ts` remains **10 tests** but now directly exercises structured settlement, request-before-debounce, stale/current completion, exact reuse, removed/replaced/output/size controls and terminal destroy. The SWEEP-008 timestamp-zero and coalescing positives remain executable.

No archived or mutated source tree was used for a pre-edit negative. The required structured settlement/disposal APIs did not exist at `8a8e133`, and the final behavior spans both successor factories; inventing a partial historical harness would not be honest evidence. The accepted-base count and source hashes are recorded instead.

## Final validation receipts

All successful commands used installed dependencies. Host evidence: macOS 26.6.2, Node v26.8.1, npm 11.19.0; Node 20 and other platforms were not run.

1. Five directly changed regression suites: **5 files passed, 75 tests passed** (`10 + 15 + 10 + 10 + 30`).
2. Original expanded twelve-file phase192/182 set plus new handoff suite: **13 files passed, 150 tests passed**.
3. `npm run test -- --run`: **35 files passed, 431 tests passed**.
4. `npm run check`: `svelte-check found 0 errors and 2 warnings in 2 files`; both are the accepted noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
5. `npm run lint`: exit 0; no diagnostics.
6. `npm run format:check`: `All matched files use Prettier code style!`
7. From `tauri-app/`, `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**; the production Rust writer interoperability case ran.
8. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
9. `git diff --check`: exit 0; no diagnostics.
10. From `tauri-app/src-tauri/`, `cargo fmt --all -- --check`: exit 0; no diagnostics.
11. `cargo clippy --workspace -- -D warnings`: exit 0; no diagnostics.
12. `cargo test --workspace`: **72 passed, 0 failed, 1 intentionally ignored**. The ignored `profiling_tests::emit_native_interop_fixture` is reserved for explicit test-owned output and is exercised through the passing Node interoperability suite.
13. `cargo test -p color-core --no-default-features --test kmeans_snapshots`: **1 passed, 0 failed**.
14. `cargo tree -p color-core --edges normal`: no Tauri dependency matched.

## Deviations, friction and remaining boundary

- **Source-fence deviation: none.** Only the eleven assigned candidate paths changed; the planning worktree receives only this submission report.
- The first implementation reached green at **13 files / 148 tests** expanded and **35 files / 429 tests** full, but late self-review found two uncovered convergence holes: Values probe success could overwrite an overlapping requested/settled frame, and Home could skip a pending probe because of a poster hint then choose an unrelated selected still's ID. Review also tightened Home/Values analysis effects to exact settlement/selected-entry changes and moved Home requested-state publication ahead of timer scheduling. Two permanent regressions were added before final receipts.
- The first full/expanded rerun after those corrections each exposed the same retained AUD-008 cached-strip identity regression: full was **430 passed / 1 failed** and expanded **149 passed / 1 failed**. Adding optional `VideoState.stripId` and carrying it through cache/restore fixed the real regression without treating strip identity as settlement.
- Two overly broad follow-up patch contexts temporarily placed `state.stripId` in `regenerateStrip` and then fresh-load initialization. Targeted audit runs exposed `ReferenceError: state is not defined` with **4 failures**, then **2 failures**, before the assignments were corrected: fresh/regenerated strips allocate new IDs; restoration alone reuses `state.stripId`. The audit suite then passed 30/30 and every final gate above was rerun at the corrected tip.
- During finalization, two guessed script paths produced `MODULE_NOT_FOUND` (`test-profile-event-contract.mjs` and `check-tauri-event-listeners.mjs`). These were command-path errors, not product failures; the repository-documented profiling and event-guard commands were then run and passed 88/88 and 10/10.
- Existing cohesive large files remain visible. Current LOC is Home 887, Values 860, controller 1,060, new handoff suite 561, controller suite 577 and audit suite 1,269. These are direct assigned integration/control matrices, not hidden generic infrastructure. Lead-owned commit handling requires explicit LOC review and likely `[loc-bypass]`.
- No app build/launch/capture, mounted Svelte/browser navigation, real ffmpeg output lifetime/reclamation, native cancellation/immutable-byte/decoded-PTS proof, Windows/Linux/Node20 CI, long-running playback, owner interaction, merge, release or final acceptance was performed or implied. Native frame-output ownership remains phase193; playback/timer/numeric policy remains separately owned.

Stop point: combined correctness-wave-05 review gate. Candidate source and tests remain uncommitted on `8a8e133`. Review Lead owns independent review, acceptance, commit/integration and any later assignment.
