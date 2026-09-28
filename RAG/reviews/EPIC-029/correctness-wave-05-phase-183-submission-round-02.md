# Correctness wave 05 phase183 — amendment01 submission round 02

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.61 and `correctness-wave-05-phase-183-amendment-01.md` A1–A3. Review state: **RESUBMITTED after amendment01; source and tests uncommitted; not accepted; combined wave stops here.** Original submission `8826aa57279e6beabbecc6a98a36e5e056c41010fff32e56439c668346149763` remains byte-identical.

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base and HEAD remain the accepted phase182 commit `8a8e13381410841674015ae27da9310c3c659fbe`.
- Candidate status remains exactly ten authorized tracked modifications and the one authorized new handoff suite. The path-only status SHA-256 remains `55725cf326f0e05ce1ff3b4e83eafa5e8da466630f93ed790a1f7e2bc54c0dcc`.
- The amended combined binary diff stream (`git diff --binary`, then the new handoff suite as a `/dev/null` no-index diff) has SHA-256 `b5b8e179482faf1a18ef0e7ca52c82aab07adf96a94fe6e9df2e719938a1696e`.
- Final payload is **1,786 additions, 294 deletions**: 1,174 tracked additions and 294 tracked deletions, plus 612 lines in the new suite. Relative to round 01, amendment01 adds 165 lines and removes 4 across exactly two production and two test paths.
- No HomeView amendment was needed. The other seven authorized paths retain their round-01 prepared hashes exactly. No path outside the original six-production/five-test fence changed.
- No ticket/INDEX, image store, VideoPanel, runner, native/core/bridge, profiling, dependency/lock, hook, timer duration/policy, EPIC026, app/build, Git staging/commit/config, cleanup, owner-control, next-ticket, or release mutation occurred.

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

## Exact final hashes

| File | Base SHA-256 | Round-02 SHA-256 | Base -> round-02 LOC | Amendment state |
|---|---|---|---:|---|
| `tauri-app/src/lib/stores/video.ts` | `2dbea4c96e46b774d7449f2593244cece2d0c54493c0a88cd3aaf89fa396d799` | `11c29a172c7bfa937ea1990521cec10c1e458de17116b659831503ae25e8a761` | 39 -> 76 | unchanged from round 01 |
| `tauri-app/src/lib/views/HomeView.svelte` | `0c8c3abfd704e8f1f117b98f8d2390040586c844815c1c648ca22c7a3a855d30` | `32e837817fe27554ebf062f9ed9fc1c23b8e152a7a398c34f1b41609aa8a8b06` | 880 -> 887 | unchanged from round 01 |
| `tauri-app/src/lib/views/ValuesView.svelte` | `82d5bb705c1db64907808db49740bb2333498297e40f7a84b4a964579f5a94dc` | `ae097514f0eecda4256f922a1e333ddc1d13b607538df21f1cd233c6256b1e11` | 820 -> 860 | unchanged from round 01 |
| `tauri-app/src/lib/views/home/video-controller.svelte.ts` | `730f32f45e155e07a4a65b4a0f0f26c08d2587507a90f3657c3922562eabc39a` | `6627211a039c7659bee5194ea0b491b486ed5de3935de9d19c3beda4fa07d091` | 896 -> 1,061 | amended; round-01 hash `6756a52a3da5c416715acf97793bcdd71a697ec185f69628940cb586e451713d` |
| `tauri-app/src/lib/views/values/video-scrubber.svelte.ts` | `ea7be3f372bcbc50961b7a7048c53ac4fe0f5995512331b2bcdc764235196e8c` | `0a2fc6eed19f77f8c42728dbac9312b985d8ad87521d1fc33c1df3af600abea3` | 234 -> 368 | unchanged from round 01 |
| `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts` | `795d6e62f7d9fd15b58a5e60565a707c09182cd1e061d1b84b64ceeec1b4655a` | `916711984ad704bd87c160f4a6674995c8a13d229ef8579dcf1f66548b85f6b5` | 209 -> 296 | amended; round-01 hash `b7cff6ef3b5ea51af151488d50fc92f69c5d33ebf5d774fd7a9ace5749f1053b` |
| `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts` | absent | `73f62332886ff0682e062292a226c5e10db9cf381a683ecd06e4fd5ae6e1da51` | 0 -> 612 | amended; round-01 hash `a8e34d876674a3a8aec775e2d088aa19dfa6818ccbe3a327be3586321d5ecb3a` |
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | `c68ab09cd03d1350b4413034a04c00976d3df16c321bcbdc8474fa37334a6047` | `f6c7a5a4e56e539eb7bdb2dda00c517ac7a8142bf6d3dc83972cef93c1957dbc` | 480 -> 683 | amended; round-01 hash `8cff3af3f8fb99c95dd9baafab30bc5046973265aa04b5b5cb21fa736f6b8b1a` |
| `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts` | `4f52f5422ac3e47bd1f89dac1c28f71183b4de712bfef436ebb6ffbaf5644ff5` | `2528b614580b296aa7bc4e9740a1a74767f931dd70922a78d92d3f65bdd3a372` | 346 -> 385 | unchanged from round 01 |
| `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` | `23a94ce87ecdf193a393cb319f4681ab1c324c620e6a0e5cc06e91dac4317caf` | `b1a416c0c7c12c667d37261f2b898786cf74ce1743ff6554246fb16247334db0` | 275 -> 394 | unchanged from round 01 |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | `913f18f76fc121a7914884ce79b1208b026ef24752cc87f07226709bbdf9c713` | `50738b032a670515c01365b40fe30bfa8db16e25b5faa05341bd326e1083bbb1` | 1,220 -> 1,269 | unchanged from round 01 |

## Test-first failure receipt

The three amendment regressions were added before either production correction. The first two-file run produced **4 failed / 19 passed across 23 tests**. Three failures were the intended source gaps; the fourth was an existing later handoff test polluted because the deliberately failing cached-playhead case exited before disposing its subscription. Test cleanup was corrected without touching production.

The clean submitted-source negative rerun then produced **3 failed / 20 passed across 23 tests**, one failing runtime test per amendment:

1. A1 received `currentTime: 0` instead of `7`; the only extraction had `timestamp: 0` instead of `7`, and settlement recorded `0`.
2. A2 received `'/cache/settled.png'` after `beginSelection('new-target')` where the Home snapshot getter was required to return null.
3. A3 received one `extractVideoFrame({ timestamp: 8, ... })` while the scrub pointer was still down, where no extraction or analysis was allowed.

This is direct current-submission failure evidence, not a fabricated historical mutation. No skipped/`it.fails` case remains.

## Amendment implementation and evidence

### A1 — cached playhead before synchronous subscriber dispatch

- `handleVideoFile` now reads the existing cache before its first `setVideoState` and initializes duration, FPS, requested `currentTime`, poster/strip hints and strip ID in that new-epoch provisional state. `settledFrame` remains explicitly null.
- The existing probe/cache merge still reads and spreads the current same-epoch state, so later metadata completion cannot erase a newer request or settlement. The change restores t7 only for new intent initialization and does not revive cached analysis or old settlement.
- The new real-store handoff regression mounts the production Values ingestion and subscribed production scrubber. It proves synchronous publication is t7 with cached hints and null settlement, no immediate native call, then exactly one fresh t7 extraction after 250 ms and an accepted t7 settlement. No provisional t0 dispatch occurs.

### A2 — current canonical Home snapshot authority

- Home's `videoPosterPath` getter now calls the existing `ownsSelection` guard before structural settlement matching. That guard includes terminal disposal, controller authority and `deps.isCurrentSelection`, so a captured old epoch cannot authorize capture after canonical intent advances.
- `VideoPanel.captureFrame` already re-reads this getter at invocation time. The regression proves the positive exact-settlement path first, advances canonical selection without resetting the old controller/entry, then observes null immediately. No VideoPanel or image-store amendment was needed.

### A3 — preserve end-of-scrub dispatch

- The common Home frame scheduling boundary now returns while `videoScrubbing` is true. This covers direct reconciliation calls without disabling entry/quality mismatch reconciliation when idle, delaying requested-time publication, or changing the 250/400 ms timings.
- The production-controller regression starts at an exact settled frame, begins scrub, publishes requested t8, invokes `ensureSettledFrame` exactly as the Home effect does, and advances 300 ms. It proves zero extraction/analysis and null snapshot eligibility while down. Scrub end then produces exactly one t8 extraction, one admission and one analysis schedule.
- Existing phase182 debounce/active-IPC cases, exact reuse, new-epoch fresh extraction, Values metadata handoff and round-01 disposal matrices remain green in the final expanded set.

## Final validation receipts

All successful commands used installed dependencies. Host remains macOS 26.6.2, Node v26.8.1 and npm 11.19.0; Node 20 and other platforms were not run.

1. Post-fix amended suites after Prettier: **2 files passed, 23 tests passed** (`video-controller-cache-reset` 12; `video-view-handoff` 11).
2. Original phase183 expanded set: **13 files passed, 153 tests passed**.
3. Full renderer: **35 files passed, 434 tests passed**. This is exactly +3 runtime tests over round 01's 431.
4. `npm run check`: `svelte-check found 0 errors and 2 warnings in 2 files`; both are the accepted noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
5. `npm run lint`: exit 0; no diagnostics.
6. `npm run format:check`: `All matched files use Prettier code style!`
7. From `tauri-app/`, `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**; production Rust writer interoperability ran.
8. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
9. `git diff --check`: exit 0; no diagnostics.
10. From `tauri-app/src-tauri/`, `cargo fmt --all -- --check`: exit 0; no diagnostics.
11. `cargo clippy --workspace -- -D warnings`: exit 0; no diagnostics.
12. `cargo test --workspace`: **72 passed, 0 failed, 1 intentionally ignored**. The ignored `profiling_tests::emit_native_interop_fixture` is reserved for explicit test-owned output and remains exercised through the passing Node interoperability suite.
13. `cargo test -p color-core --no-default-features --test kmeans_snapshots`: **1 passed, 0 failed**.
14. `cargo tree -p color-core --edges normal`: no Tauri dependency matched.

## Deviations, friction and remaining boundary

- **Source-fence deviation: none.** Amendment source changed only the primary two production and two test paths; the full candidate remains exactly the original eleven-path fence. The planning worktree receives only this new round-02 report, while the round-01 report remains byte-identical at its recorded hash.
- The initial negative run's fourth failure was test-harness cleanup, not a fourth product defect: a hard assertion prevented `values.dispose()`, leaving a live subscriber for the next case. Disposal was moved before the soft failure assertions, producing the clean one-to-one 3-failure receipt before production changed.
- Round 01's full implementation history and its earlier strip-ID/patch-context/command-path friction remain preserved in the immutable original submission and are not rewritten here.
- Existing cohesive large files remain visible. Current LOC is Home 887, Values 860, controller 1,061, new handoff suite 612, controller suite 683 and audit suite 1,269. These remain direct assigned integration/control matrices. Lead-owned commit handling requires explicit LOC review and likely `[loc-bypass]`.
- No app build/launch/capture, mounted Svelte/browser navigation, real ffmpeg output lifetime/reclamation, native cancellation/immutable-byte/decoded-PTS proof, Windows/Linux/Node20 CI, long-running playback, owner interaction, merge, release or final acceptance was performed or implied. Native frame-output ownership remains phase193; other playback/timing/numeric work remains separately owned.

Stop point: phase183 amendment01 combined-wave review gate. Candidate source and tests remain unstaged/uncommitted on `8a8e133`. Review Lead owns independent review, acceptance, commit/integration and any later assignment.
