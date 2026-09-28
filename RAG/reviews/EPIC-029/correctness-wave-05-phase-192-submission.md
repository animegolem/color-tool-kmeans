# Correctness wave 05 phase192 — canonical selection epoch submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.57 §§3–8,11 and `correctness-wave-05-implementation-verdict.md` R1–R7. Review state: **SUBMITTED; uncommitted; not accepted; phase182 and phase183 not started.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains the assigned clean base `41222c50001b7a02d516e7122b94f434ea073243`.
- Candidate status is exactly the eighteen authorized phase192 paths: fourteen tracked modifications and four new files. Status-list SHA-256 is `009cb9bfed5471c434475080268715116a25efc270abdb3819baa99296c9f39c`.
- The combined binary diff stream (`git diff --binary`, then each new file in the order listed below as a `/dev/null` no-index diff) has SHA-256 `79b4ecb8636f90c2d5f6994567051edd20ce6630d3b168c87436d660bce5dd0c`.
- Prepared payload: **1,513 additions, 183 deletions** including 1,101 lines across the four required new files. Existing cohesive files remain large: `App.svelte` 433 -> 408 LOC, `image.ts` 399 -> 507, `HomeView.svelte` 868 -> 880, `ValuesView.svelte` 811 -> 820, `video-controller.svelte.ts` 835 -> 896, and `audit-control-flow-races.spec.ts` 685 -> 773. The new store lifecycle is the only production file newly crossing 400 LOC; lead-owned commit handling may need `[loc-bypass]` under the existing verdict. No minification or unrelated extraction was used to hide size.
- No Git mutation, commit, staging, rebase, merge, branch/config/hook change, install, package change, app/browser/owner control, launch, capture, benchmark, native/core/bridge policy edit, profiling/timing/schema edit, Batch/export production edit, ticket/INDEX edit, phase182/183 implementation, artifact cleanup, or release was performed.

## Exact files and hashes

| File | Before SHA-256 | Prepared SHA-256 | LOC |
|---|---|---|---:|
| `tauri-app/src/lib/stores/image.ts` | `1ead81fb3d8b7a7f43cd061b9c4c8fb1db3b97621e614fdc4ec78cc985708a64` | `d0037da81628c4cf8efadd2ace066f19e8528cf62904e42017956df5d5dd2f25` | 507 |
| `tauri-app/src/lib/stores/video.ts` | `4dff520f38c9beee5e129f62b96f4ee99f942ebe319203b2178964a632811a6f` | `2dbea4c96e46b774d7449f2593244cece2d0c54493c0a88cd3aaf89fa396d799` | 39 |
| `tauri-app/src/lib/services/view-subscriptions.ts` | `d2c65f0e4a988be9a5faee5e0d1c2c9e1f20386c484cbc439a8ffd550a8802cc` | `2ff6621d091c857f48a6e539202f99bcefb7490f77f8e6e9de8a5c030c455a4b` | 44 |
| `tauri-app/src/lib/views/HomeView.svelte` | `3578674e0a3dc4b63d154ecf53add0acb824c9804204f0e873c31b71c355a5f2` | `0c8c3abfd704e8f1f117b98f8d2390040586c844815c1c648ca22c7a3a855d30` | 880 |
| `tauri-app/src/lib/views/home/file-ingestion.svelte.ts` | `c99a9990da36118c3c766525898c965436745a134c3bf683a904df6501bcdcee` | `3fa2ba8966effc4976c2eb202b5a5be0290f5cac35e5ee0a34aab41de4da08fc` | 240 |
| `tauri-app/src/lib/views/home/video-controller.svelte.ts` | `4942f9192dff4c76b4b6f17fa53eaee13140bbad74aacc8abf01e57c42591445` | `730f32f45e155e07a4a65b4a0f0f26c08d2587507a90f3657c3922562eabc39a` | 896 |
| `tauri-app/src/lib/views/ValuesView.svelte` | `f71cbd1da9f566859ec4ce2532153ed254870cb67d42b6a7e19f325f0cfbe5db` | `82d5bb705c1db64907808db49740bb2333498297e40f7a84b4a964579f5a94dc` | 820 |
| `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts` | `a76870a3f644fc2c33d75cfbebc406816b2afccc8a3466a124ac992f6e343996` | `795d6e62f7d9fd15b58a5e60565a707c09182cd1e061d1b84b64ceeec1b4655a` | 209 |
| `tauri-app/src/lib/views/values/video-scrubber.svelte.ts` | `c7908bfc059febc945c6d9c71c3dd77ef74c5b5ec736a4d5f38553224ab54509` | `ea7be3f372bcbc50961b7a7048c53ac4fe0f5995512331b2bcdc764235196e8c` | 234 |
| `tauri-app/src/App.svelte` | `c07dd0d9ffc8f5d78d077c81cf5a17ecf69e801afa0deafb000841236bdce820` | `74a159f23049b8aeb6f6a4f9a3169d33d76a4e27e2c89470f6f13ba9ed7bf423` | 408 |
| `tauri-app/src/lib/services/clipboard-ingestion.ts` | absent | `11ff85ff3d2f59a1c25facc9894ff1016212db94f50fb83237e7322d089698f4` | 102 |
| `tauri-app/src/lib/stores/image-video-switch-lifecycle.spec.ts` | absent | `19e1c8dc4c473055bce366fb008cee83509de0036617535342a7fd0c8b458aa5` | 269 |
| `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts` | `8711237178d0980a063f7d9a337642a3b485da2e2d906f2fb8511291f15f9061` | `c96b216c7d5b1df2e9b88b97a91b14507c41f72e33d4cb60a0fca50ccb129b86` | 355 |
| `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` | absent | `23a94ce87ecdf193a393cb319f4681ab1c324c620e6a0e5cc06e91dac4317caf` | 275 |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | `bef0dc50964c98e354ca8cb4bf86aaf471ef8485fa7a793835f74b4267ae7b4d` | `de7f13717d8e2dd0a889447d6e88b8133a5bb2df2e34d1dd0a43c74b4aa4becc` | 773 |
| `tauri-app/src/lib/services/clipboard-ingestion.spec.ts` | absent | `7bc00ada793decdc1bb9b649c780e67eca4e6005cb483c8c4ae5e8f506694499` | 202 |
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | `f860e26ef1eb402361b2de13b331655f48252c829359b98bef4cab5d1cc3bb4d` | `0bf6913198baadbddcbc9569914457b0757f22b8ef475c8209650ae772d123bd` | 269 |
| `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts` | `38d6542d4b3223c43d9a68f1cd624d99e69a372b8d08af7b493164685d6471e3` | `4f52f5422ac3e47bd1f89dac1c28f71183b4de712bfef436ebb6ffbaf5644ff5` | 346 |

## Implementation summary

- `image.ts` now owns one immutable, session-local, monotonically increasing safe selection epoch. `beginSelection` cancels both the 150 ms timer and published pending event; clear never resets the allocator. Same-ID/path returns advance. A null descriptive target can bind to the normalized stored ID on accepted settlement without mutating the captured authority or advancing its epoch.
- Ordinary `setFile` is an activating selection after retained-path ID normalization. Captured-authority `setFile` validates before revision/resource/store mutation, returns accepted/stale, releases only an untracked rejected blob preview, and preserves wave04 invalidation/content-revision behavior. Accepted frame pixels receive a new content revision under the same selection epoch.
- Stored still/video clicks, supported paste, activating Home ingress, active-intent replacement/removal, and clear revoke older work. New/inactive append and inactive removal do not. Current removal chooses a valid still successor or none under one new epoch. Removing old displayed B while newer video A is pending clears B's active display/path without revoking A.
- Pending video events carry their captured authority. Delivery validates currentness and consumes by object identity so obsolete consumption cannot clear a different event. Home and Values retain that authority rather than reducing it back to a path.
- Home captures still intent before browser decode, keeps activating and non-activating local ownership separate, and suppresses stale success/error. Inactive append no longer cancels current analysis or publishes an active-image decode error. The Home controller captures direct video intent before probe, checks epoch plus local frame/strip tokens on success/error/finally, accepts store frame settlement before poster/path/analysis/state/cache follow-ups, guards delayed `video.load()`, and explicitly clears `frameDecoding` on reset. Accepted transitions still snapshot retiring-video cache state synchronously.
- Values video ingestion combines a local generation with the canonical epoch, publishes explicit provisional epoch-bearing metadata before probe, removes path-only same-video suppression, and guards cached/current probe success and rejection. Still activation revokes the probe. The scrubber adds epoch beside its decode token and requires accepting frame publication before state/cache updates.
- App delegates the existing supported-image paste pipeline to plain TypeScript `clipboard-ingestion.ts`. The helper validates MIME before selection, begins with nullable media metadata before cache/buffer/save/convert awaits, preserves path/name/extension/save policy, binds the final ID only at accepted store admission, suppresses stale success/error/follow-ups, leaves native output reclamation to phase193, and lets current failures remain observable. App drawer/log follow-ups revalidate the returned authority.
- `VideoState.selection` is required. Duration `0` plus null FPS is deliberately provisional, not a measured zero-duration result. Requested/settled frame identity, successor reacquisition, and view disposal remain phase183.

## Regression proof and test delta

Permanent test delta: **+41 logical tests, +3 test files**. The four new files contribute 35 tests: 17 store/event/resource cases, 11 Values probe cases, and 7 clipboard IO cases. Existing authorized suites add six cases: three Home pre-await/non-activating cases and three audit controller/independent-job cases. The two compatibility suites retain all 13 prior assertions with truthful accepting fixtures and required selection state.

The store matrix covers immutable/null binding, current settlement with advancing content revision, stale resource/path/cache-safe rejection, same-ID return, stored revision preservation, inactive append/removal, six pre-dispatch cancellation starts, current and stale event delivery, old displayed B removal while A is pending, one-epoch successor removal, and independent analysis-token survival. Values executes real store switches/replacement/removal/clear/new-video/same-path return around deferred probe success/rejection. Home executes browser decode pre-await races plus real controller same-path probe and frame revocation. Clipboard waits until the mocked native save is actually dispatched before superseding it, including second-paste, stale/current success/error and unsupported MIME.

Actual clean-base negative: a temporary `git archive` of assigned base `41222c5` with the historical SWEEP-013 lifecycle spec from `94399faca4280b430675d25446c3ecb5259ca4d6` and candidate-installed dependencies produced **3 failed, 1 passed across 4 tests**: newer `setFile` did not cancel a debounced video, stored still selection replayed an already-published event, and active/full clears did not cancel timer/event. The isolated temporary tree was moved to Trash after the receipt. This proves the adapted pre-dispatch defect on the exact base; the broader canonical dispatched-probe cases depend on the new API and were not back-ported into a temporary old-source harness.

The first seven-file candidate regression run after implementation produced **8 failed, 66 passed across 74 tests**, plus one unhandled rejection. One failure exposed a real production omission: controller reset did not clear `frameDecoding`; it is fixed and permanently asserted. The other seven were test-construction defects: a missing `switchToFile` import, an expectation that assumed a generated browser ID, two missing Tauri test mocks, insufficient async settlement in one audit assertion, and clipboard tests superseding/rejecting before the deferred save had actually been consumed. The final tests now wait for save dispatch and contain no unhandled rejection. No test is skipped or marked expected-failure.

## Final validation receipts

All commands used installed dependencies.

1. Required seven-file phase192 Vitest command: **7 files passed, 74 tests passed**.
2. Required phase192 plus image/multi lifecycle, Batch revision, profiling-contract, and profiling-svelte: **12 files passed, 116 tests passed**.
3. `npm run test -- --run`: **34 files passed, 397 tests passed**.
4. `npm run check`: `svelte-check found 0 errors and 2 warnings in 2 files`. Both are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
5. `npm run lint`: exit 0; no diagnostics.
6. `npm run format:check`: `All matched files use Prettier code style!`
7. `node --test scripts/profiling/*.test.mjs`: **88 passed, 0 failed, 0 skipped**. The production Rust emitter interoperability test ran in this suite.
8. From repository root, `node --test scripts/svelte-event-guard.test.mjs`: **10 passed, 0 failed, 0 skipped**.
9. `git diff --check`: exit 0; no diagnostics.

## Deviations, friction, and remaining boundary

- File-fence deviation: none. The candidate contains exactly the eighteen authorized paths. The planning worktree receives only this submission report. Candidate ticket/checklist and generated INDEX remain untouched under the binding stop instruction.
- Test-first deviation: the broader new canonical tests were written after the production API was wired. The exact-base historical negative above supplies real pre-fix evidence for SWEEP-013, but no claim is made that every new dispatched-probe case was observed failing on old source. The first candidate run and corrections are reported verbatim above.
- A first attempt to run the isolated negative from the candidate root invoked a package without a root test script; rerunning from the temporary `tauri-app/` produced the stated 3/1 receipt. It did not modify candidate state.
- The retiring-video cache snapshot is an explicit synchronous exception to ordinary epoch validation: once the incoming authority is validated, transition code records the outgoing settled cache before reset. Async probe/frame/strip cache publication remains epoch-guarded.
- Phase192 does not implement old-view disposal, requested-versus-settled frame state, successor handoff/reacquisition, exact stored-frame reuse, or missing-metadata handoff; those remain phase183. The new `file-ingestion-values-disposal.spec.ts` contains only the assigned phase192 probe matrix and is intentionally incomplete for its later phase183 amendment.
- Native clipboard/frame output aliasing and reclamation remain phase193. Stale renderer work does not delete native outputs. No immutable native source generation, hash, quota, preemption, or registry is claimed.
- Native/scalar gates were not rerun because the verdict explicitly retains them for the final phase183 tip and no native/core source changed. No live app, mounted Svelte/browser test, Windows/Linux CI, owner interaction, or final-wave acceptance was performed or implied.

Stop point: phase192 review gate. Candidate changes remain uncommitted. Review Lead owns review, the atomic AI-IMP-192/adapted-SWEEP-013 commit, and any exact-base phase182 dispatch.
