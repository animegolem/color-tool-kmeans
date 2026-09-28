# Correctness wave 05 phase192 — canonical selection epoch submission round 02

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.58 and `correctness-wave-05-phase-192-amendment-01.md` A1–A3. Review state: **RESUBMITTED after amendment 01; uncommitted; not accepted; phase182 and phase183 not started.** The immutable round-01 submission remains unchanged.

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains the assigned clean base `41222c50001b7a02d516e7122b94f434ea073243`.
- Candidate status remains exactly the same eighteen authorized phase192 paths: fourteen tracked modifications and four new files. Status-list SHA-256 is `009cb9bfed5471c434475080268715116a25efc270abdb3819baa99296c9f39c`.
- The combined binary diff stream (`git diff --binary`, then each new file in the table order as a `/dev/null` no-index diff) has SHA-256 `620e6534fde5030ca1fd21226d0717c20b7e967b3df857bf7eb4ef7fdd461031`.
- Final payload is **1,854 additions, 185 deletions**: 1,006 tracked additions and 185 tracked deletions, plus exactly 848 lines across the four required new files (`102 + 269 + 275 + 202`). Round 01's 1,513/183 total was consistent with 665 tracked additions plus 848 new lines; only its statement that the four new files contained 1,101 lines was wrong.
- Amendment 01 changed only the three already-authorized A1/A2 files: `file-ingestion.svelte.ts`, `analysis-runner-revision.spec.ts`, and `audit-control-flow-races.spec.ts`. The other fifteen source hashes match round 01 exactly.
- No Git mutation, commit, staging, rebase, merge, branch/config/hook change, install, package change, app/browser/owner control, launch, capture, benchmark, native/core/bridge policy edit, profiling/timing/schema edit, Batch/export production edit, ticket/INDEX edit, phase182/183 implementation, artifact cleanup during this amendment, or release was performed.

## Exact files and hashes

| File | Clean-base SHA-256 | Round-02 SHA-256 | LOC |
|---|---|---|---:|
| `tauri-app/src/lib/stores/image.ts` | `1ead81fb3d8b7a7f43cd061b9c4c8fb1db3b97621e614fdc4ec78cc985708a64` | `d0037da81628c4cf8efadd2ace066f19e8528cf62904e42017956df5d5dd2f25` | 507 |
| `tauri-app/src/lib/stores/video.ts` | `4dff520f38c9beee5e129f62b96f4ee99f942ebe319203b2178964a632811a6f` | `2dbea4c96e46b774d7449f2593244cece2d0c54493c0a88cd3aaf89fa396d799` | 39 |
| `tauri-app/src/lib/services/view-subscriptions.ts` | `d2c65f0e4a988be9a5faee5e0d1c2c9e1f20386c484cbc439a8ffd550a8802cc` | `2ff6621d091c857f48a6e539202f99bcefb7490f77f8e6e9de8a5c030c455a4b` | 44 |
| `tauri-app/src/lib/views/HomeView.svelte` | `3578674e0a3dc4b63d154ecf53add0acb824c9804204f0e873c31b71c355a5f2` | `0c8c3abfd704e8f1f117b98f8d2390040586c844815c1c648ca22c7a3a855d30` | 880 |
| `tauri-app/src/lib/views/home/file-ingestion.svelte.ts` | `c99a9990da36118c3c766525898c965436745a134c3bf683a904df6501bcdcee` | `5f518d0b3e26ec751c9c31cfafbfb6f52c8c67b25adac3448ca1035a569830c7` | 241 |
| `tauri-app/src/lib/views/home/video-controller.svelte.ts` | `4942f9192dff4c76b4b6f17fa53eaee13140bbad74aacc8abf01e57c42591445` | `730f32f45e155e07a4a65b4a0f0f26c08d2587507a90f3657c3922562eabc39a` | 896 |
| `tauri-app/src/lib/views/ValuesView.svelte` | `f71cbd1da9f566859ec4ce2532153ed254870cb67d42b6a7e19f325f0cfbe5db` | `82d5bb705c1db64907808db49740bb2333498297e40f7a84b4a964579f5a94dc` | 820 |
| `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts` | `a76870a3f644fc2c33d75cfbebc406816b2afccc8a3466a124ac992f6e343996` | `795d6e62f7d9fd15b58a5e60565a707c09182cd1e061d1b84b64ceeec1b4655a` | 209 |
| `tauri-app/src/lib/views/values/video-scrubber.svelte.ts` | `c7908bfc059febc945c6d9c71c3dd77ef74c5b5ec736a4d5f38553224ab54509` | `ea7be3f372bcbc50961b7a7048c53ac4fe0f5995512331b2bcdc764235196e8c` | 234 |
| `tauri-app/src/App.svelte` | `c07dd0d9ffc8f5d78d077c81cf5a17ecf69e801afa0deafb000841236bdce820` | `74a159f23049b8aeb6f6a4f9a3169d33d76a4e27e2c89470f6f13ba9ed7bf423` | 408 |
| `tauri-app/src/lib/services/clipboard-ingestion.ts` | absent | `11ff85ff3d2f59a1c25facc9894ff1016212db94f50fb83237e7322d089698f4` | 102 |
| `tauri-app/src/lib/stores/image-video-switch-lifecycle.spec.ts` | absent | `19e1c8dc4c473055bce366fb008cee83509de0036617535342a7fd0c8b458aa5` | 269 |
| `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts` | `8711237178d0980a063f7d9a337642a3b485da2e2d906f2fb8511291f15f9061` | `dd33d7a4182b1e46d4976aa7af876dfc6a6138da3b7bd1cd11d6eb5a25df8fa7` | 426 |
| `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` | absent | `23a94ce87ecdf193a393cb319f4681ab1c324c620e6a0e5cc06e91dac4317caf` | 275 |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | `bef0dc50964c98e354ca8cb4bf86aaf471ef8485fa7a793835f74b4267ae7b4d` | `75e4ae8f1dd86de4b66d96b13d19431df8e635c1c5228ed4d5424c65c7262013` | 1,040 |
| `tauri-app/src/lib/services/clipboard-ingestion.spec.ts` | absent | `7bc00ada793decdc1bb9b649c780e67eca4e6005cb483c8c4ae5e8f506694499` | 202 |
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | `f860e26ef1eb402361b2de13b331655f48252c829359b98bef4cab5d1cc3bb4d` | `0bf6913198baadbddcbc9569914457b0757f22b8ef475c8209650ae772d123bd` | 269 |
| `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts` | `38d6542d4b3223c43d9a68f1cd624d99e69a372b8d08af7b493164685d6471e3` | `4f52f5422ac3e47bd1f89dac1c28f71183b4de712bfef436ebb6ffbaf5644ff5` | 346 |

## Amendment implementation and regression proof

### A1 — Home decode-error ownership

- The stale-error assertion was added before the production correction. Against the round-01 source, the focused command produced **1 failed, 6 skipped across 7 tests**. The failure was `expected "error" to not be called at all, but actually been called 1 times`; the captured call was `['[home] Failed to decode image', Error: stale decode failed]` at the stale diagnostic assertion.
- `ingestSelection` now computes current activating-error ownership before any error diagnostic. A superseded activating rejection returns silently; a current activating rejection retains its console diagnostic and shared analysis-error publication. A non-activating append rejection retains a local console diagnostic without publishing shared active-analysis error state.
- The permanent suite spies on both console diagnostics and shared error publication for stale activating, current activating, and inactive append cases. The post-fix file suite passed **9/9**.

### A2 — actual Home controller epoch isolation

- The audit suite now drives two real controller instances with the same video path and separately deferred native frame/strip calls. Starting the second controller advances only the canonical epoch; the first controller's local path and tokens remain unchanged.
- Frame success proves the old callback cannot admit pixels, cancel or clear analysis ownership, schedule analysis, mutate active path/poster, or publish state/cache, while the newer frame remains observably pending and then completes through the current positive path.
- Frame rejection proves stale failure is silent and cannot clear the newer pending request; the current rejection remains observable and clears its own `frameDecoding` state through `finally`.
- Parameterized strip success/rejection proves stale work cannot publish strip/state/cache/error or clear the newer controller's observable pending state. The current success publishes URL/state/cache, while the current rejection emits its owned diagnostic and clears pending through `finally`.
- A current probe-rejection control verifies its owned error event and `videoProbePending` cleanup. The pre-existing same-path probe success and combined still-switch regression remain executable.
- The first full audit run after adding these controls produced **23 passed, 1 failed across 24 tests**. The sole failure was a test expectation that omitted the production cache-busting `?t=<timestamp>` suffix from the current strip URL; production code was unchanged. After correcting the expectation, the direct audit suite passed **24/24**.

Amendment test delta is **+7 logical tests** over round 01: two Home decode-error-policy controls and five controller controls (frame success/current success, frame stale/current rejection, two strip cases, and current probe rejection). No skipped or expected-failure test remains.

## Final validation receipts

All successful commands used the candidate's installed dependencies.

1. Full original phase192 expanded suite: **12 files passed, 123 tests passed**.
2. `npm run test -- --run`: **34 files passed, 404 tests passed**.
3. `npm run check`: `svelte-check found 0 errors and 2 warnings in 2 files`. Both are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
4. `npm run lint`: exit 0; no diagnostics.
5. `npm run format:check`: `All matched files use Prettier code style!`
6. From `tauri-app/`, `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**. The production Rust writer interoperability test ran.
7. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
8. `git diff --check`: exit 0; no diagnostics.

## Deviations, friction, and remaining boundary

- **Corrected cleanup-fence deviation from round 01:** the exact-base negative temporary tree was originally `/tmp/color-tool-wave05-negative.q9VyJI`, and `/usr/bin/trash` moved it to Trash during the original phase192 sitting. That was an artifact-cleanup action and contradicted round 01's `no artifact cleanup` claim. The verbatim **3 failed, 1 passed across 4 tests** receipt remains in the original phase192 Code Lead task transcript; the immutable round-01 report retains its summarized receipt. The current physical Trash path is unknown: read-only Spotlight lookup returned no match, and direct read-only listing of `/Users/golem/.Trash` returned `Operation not permitted`. Nothing was deleted, moved, restored, or recreated while checking or during this amendment.
- Test-first deviation remains as recorded in round 01: the broader canonical tests followed API wiring. Amendment A1 did obtain the required pre-fix failing diagnostic receipt before changing production source. A2 used the submitted production seam; its only red after construction was the cache-busting URL expectation described above.
- The first profiling invocation in this amendment was issued from repository root, where zsh reported `no matches found: scripts/profiling/*.test.mjs`. It was rerun from the correct `tauri-app/` directory and passed 88/88. No source or dependency state changed.
- The 18-path source fence has no deviation. The planning worktree receives only this new round-02 report. Candidate ticket/checklist and generated INDEX remain untouched.
- Existing cohesive files above 400 LOC remain visible rather than hidden by unrelated extraction; `audit-control-flow-races.spec.ts` is now 1,040 LOC due to the amendment's explicitly assigned actual-controller matrix. Lead-owned commit handling may require `[loc-bypass]`.
- Phase192 still does not implement old-view disposal, requested-versus-settled frame state, successor handoff/reacquisition, exact stored-frame reuse, or missing-metadata handoff; those remain phase183. Native clipboard/frame output aliasing and reclamation remain phase193.
- Native workspace/scalar gates remain reserved for the final phase183 tip because no native/core source changed. No live app, mounted Svelte/browser test, Windows/Linux CI, owner interaction, or final-wave acceptance was performed or implied.

Stop point: phase192 amendment-01 review gate. Candidate changes remain uncommitted. Review Lead owns review, acceptance or further amendment, the atomic AI-IMP-192/adapted-SWEEP-013 commit, and any exact-base phase182 dispatch.
