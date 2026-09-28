# Correctness wave 04 phase017 — content revision submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.54 §§3–8,11 and `correctness-wave-04-phase-010-verdict-and-017-brief.md`. Review state: **SUBMITTED; uncommitted; not accepted; phase181 not started.**

## Outcome and carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains the assigned clean base `44d7f57cc9e09a66295a91544a2dffa04542b00f`.
- Candidate status is exactly the five permitted phase017 paths: three tracked modifications and two new tests. Status-list SHA-256 is `95b859fc0a7bcf1d6fe32f0a78a8bbc994b662455cf3ad8139ea9ad2801b4b0d`.
- The combined binary diff stream (`git diff --binary`, then each new file in the order listed below as a `/dev/null` no-index diff) has SHA-256 `413857ac470bac5747071ddca92734f1a7546cfb4ec73a6b76c10be7402b7313`.
- Prepared payload: **473 additions, 0 deletions**. No file exceeds 400 lines; no LOC bypass is needed.
- No Git mutation, commit, staging, rebase, merge, branch/config/hook change, install, app/browser/owner control, launch, capture, benchmark, native/core edit, runner-key/timing edit, Batch production edit, ticket/INDEX edit, phase181 work, or cleanup was performed.

## Exact files and hashes

| File | Before SHA-256 | Prepared SHA-256 | LOC |
|---|---|---|---:|
| `tauri-app/src/lib/stores/image.ts` | `a4b6c69ef41312c37b2347a9740ac9a887cbf8f9dbe4448202296224c31de658` | `1ead81fb3d8b7a7f43cd061b9c4c8fb1db3b97621e614fdc4ec78cc985708a64` | 399 |
| `tauri-app/src/lib/stores/multi-analysis.ts` | `31b5e9adaf3fd135d17e5551f3336443464d43a45a7ec8aae17f8cabde458a00` | `06440bb3cf54538e6a13afc1b1e1832e1360a97a33c774f59328a68358f5efa5` | 103 |
| `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts` | `3f123b2be9bc8bcc2d4b8ebc5142e82130e6f49fa953754bbaa2fe53967ef3bd` | `83529185206b97c691475382c2e4bc3e6a9781b472b8543df82b267635a7fa70` | 336 |
| `tauri-app/src/lib/stores/multi-analysis-lifecycle.spec.ts` | absent | `84515b2096b62da46ea6b880ddb0eaa113094cc6521fa4a7c628dcc063f24b79` | 152 |
| `tauri-app/src/lib/views/batch/batch-runner-revision.spec.ts` | absent | `8f983ea98720ac4f7f87e2951e97ff935b4c5bab2ebe0a78c9d168901b3ed684` | 161 |

## Implementation summary

- `ImageEntry` now has an optional public `contentRevision`. `image.ts` owns a module/session-local monotonic allocator; accepted `setFile` and `appendFile` admissions overwrite absent, forged, fractional, negative, nonfinite, and oversized caller values with a fresh positive safe integer.
- Allocation stops before exceeding `Number.MAX_SAFE_INTEGER`. `clearFile` does not reset the allocator, and there is no per-ID retention map, content hash, native protocol, source-generation field, selection epoch, or test-only counter control.
- `setFile` resolves the retained path ID and then normalizes both ID and revision onto the supplied object before content publication. The supplied scheduling entry and stored/selected entry therefore carry the same normalized identity. Same-ID append is also normalized in place.
- Distinct-ID duplicate-path append returns before revision allocation or resource registration, so a forged revision cannot alter admission/dedup behavior or consume an allocator value.
- Preview-only `updateEntryPreview` and stored-entry `switchToFile` do not admit content and preserve revision.
- `multi-analysis.ts` snapshots each pinned entry's revision as a primitive value. A revision change for an existing pinned ID resets aggregate state/result/error/composite while preserving pin IDs and insertion order. Unpinned changes and equal-revision preview updates do not reset. Existing removal pruning and explicit pin reset behavior remain.
- The same-object pinned replacement regression is intentional: admission mutates the caller/stored entry to its new revision before publishing, so an object-reference snapshot would silently rewrite history; the primitive snapshot still detects the change.

## Regression proof and test delta

Test delta: **+11 tests, +2 test files**. Five revision/admission regressions extend the existing image lifecycle suite; five new multi-analysis lifecycle tests cover pinned replacement, unpinned replacement, preview metadata, unchanged selection, and removal/pruning; one new Batch test uses the real stores and production Batch runner with only native bridges mocked.

The Batch test performs explicit Analyze, replaces pinned content, proves aggregate reset makes no automatic compose/native call, then explicitly Analyzes again. `composeGrid` and `analyze_image` are each invoked exactly twice and the second run publishes a distinct result with the second native identity.

Initial pre-production run: **7 failed, 8 passed across 15 tests**, plus one teardown fixture rejection. Revision assignment/path normalization/duplicate non-consumption/non-recycling/preview identity, pinned replacement, and Batch reset failed as expected. Unpinned, preview, unchanged selection, pruning, and all retained phase010 controls passed. The teardown rejection was test-only: the Batch `tauri` mock omitted `isTauriEnv`, which artifact cleanup reads. Adding `isTauriEnv: () => false` removed the unhandled rejection; it required no production change.

No test is skipped or marked expected-failure.

## Final validation receipts

All commands used installed dependencies.

1. Required seven-file focused Vitest command (phase010 five-file focus plus image/multi lifecycle and Batch revision, with image deduplicated):
   - `Test Files  7 passed (7)`
   - `Tests  60 passed (60)`
2. `npm run test -- --run`
   - `Test Files  30 passed (30)`
   - `Tests  351 passed (351)`
3. `npm run check`
   - `svelte-check found 0 errors and 2 warnings in 2 files`
   - The warnings are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
4. `npm run lint`
   - exit 0; no diagnostics.
5. `npm run format:check`
   - `All matched files use Prettier code style!`
6. `node --test scripts/profiling/*.test.mjs`
   - `tests 88`, `pass 88`, `fail 0`, `skipped 0`
7. From repository root, `node --test scripts/svelte-event-guard.test.mjs`
   - `tests 10`, `pass 10`, `fail 0`, `skipped 0`
8. `git diff --check`
   - exit 0; no diagnostics.

Expected console output: profiling-contract's invalid-response and invoke-failed tests emit their deliberate `[home] analysis failed TauriComputeError` stacks. Both tests pass; no unexpected final-run error output occurred.

## Deviations, friction, and remaining boundary

- Behavioral and file-fence deviations: none.
- The initial Batch test mock omission described above was the only friction. It was corrected within the authorized new test before production validation.
- Native/scalar gates were not rerun because native source is unchanged and the brief explicitly retains them for final-wave validation; historical counts are not claimed as a phase017 run.
- Aggregate invalidation is ready-state ownership only. A Batch/export native job already in flight retains its existing behavior and is not claimed safe against replacement by this phase.
- Replacement does not automatically recompose; only the next explicit Batch Analyze does. The test proves the absence of automatic compose/native calls.
- Revision-aware Colors scheduling/seeding, explicit/reactive dispatch convergence, and closure of the full replacement-dispatch defect remain phase181 work.
- No live app, mounted UI, native build, owner interaction, or final-wave acceptance was performed or implied.

Stop point: phase017 review gate. Candidate changes remain uncommitted. Review Lead owns review/commit and the exact-base phase181 dispatch.
