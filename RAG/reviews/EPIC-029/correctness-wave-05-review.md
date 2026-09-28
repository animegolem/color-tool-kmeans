# Wave05 review — canonical selection authority and successor-owned frames

Code Lead -> Review Lead, 2026-09-06. Review-only result under PROJECT-RECORD rev0.56 §§4–6,11. The live source target was the clean candidate
`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
at **41222c50001b7a02d516e7122b94f434ea073243**. The planning carrier remains based at
`2cc2000bce04ce2e6bda11a2853dd42595946980`; its pre-existing dirty documents were not treated as committed source.

## Verdict

**READY FOR A SERIALIZED 192 -> TEST-ONLY 182 RECONCILIATION -> 183 IMPLEMENTATION RULING, WITH THE FILE-FENCE AMENDMENTS BELOW. Do not cherry-pick either historical sweep commit verbatim. Accept the lifecycle contract only at the combined 183 tip.**

The smallest coherent repair is one renderer-local, non-recycling selection authority owned by the image store; probe/frame/strip owners capture and validate it without advancing it. `contentRevision` remains the byte/pixel admission identity added by wave04. Home/Values view tokens remain execution ownership. A view handoff preserves selection authority but revokes the old view token and makes the successor reacquire any requested frame that has not settled.

AI-IMP-182 no longer needs production cache-preservation functionality. Wave04 deliberately removed the unsafe boolean branch and ID-only seed. Keep the conservative fresh-extraction path, add the missing seek/step regressions, and do not create a `RestoreIntent` until actual cross-request restoration exists. Same-selection view handoff may reuse the exact already-stored settled entry; selecting the video again is a new epoch and still recomputes from the mutable path.

Three amendments are required before coding:

1. Add `tauri-app/src/lib/views/HomeView.svelte` to AI-IMP-192. The bucket callback currently drops the event identity and skips solely by video path; same-path re-selection cannot be fixed only inside the controller.
2. Add `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`, `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts`, and `tauri-app/src/App.svelte` to AI-IMP-192. Home browser decode and app-level clipboard copy have awaits between accepted user intent and `setFile`; selection authority must begin before those awaits rather than only when bytes finally enter the store. The existing runner-revision test is the real ingestion seam. Ordinary synchronous `setFile` callers need no source change because the store begins a new selection by default.
3. Permit `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` in AI-IMP-183 as well as 192. Its historical test is specifically the old-owner half of SWEEP-023; the completed test must compose disposal with successor reacquisition rather than stop at “old owner did not publish.” No new production file or native file is needed.

`image.ts` is already 399 lines, `HomeView.svelte` 868, `ValuesView.svelte` 811, `video-controller.svelte.ts` 835, and the race audit 685 on this base. The lead will need reviewed `[loc-bypass]` handling for the cohesive existing files or a separately authorized extraction; this review does not recommend a new generic selection framework merely to move lines.

## Historical prerequisites versus the accepted tip

Neither prerequisite is an ancestor of `41222c5`; both merge with it only at
`28d9e8415736cc82154fbcc2dfb90b70157ac6cf`.

| Source                                               | Current status                                                                                                                                                                                                                             | Useful part                                                                                                                                                | Why it is insufficient / must be adapted                                                                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `94399faca4280b430675d25446c3ecb5259ca4d6` SWEEP-013 | Not in ancestry. Its new lifecycle spec is absent; current `image.ts:317-399` still leaves the debounce/event alive on still switch, set, active clear, and full clear.                                                                    | Central cancellation of the 150 ms timer and published event on every non-video selection; do not let an old frame settlement cancel a newer video switch. | It has no authority for an already-dispatched Values probe, no same-ID return protection, and was written before the store-owned content revision rules.                                   |
| `1546b79c6d75e5dfd6949ae8ce2763c06a8669c9` SWEEP-023 | Not in ancestry. `HomeView` does not call `video.dispose()`; the Home controller has no `dispose`; Values ingestion has no `dispose`; the historical Values disposal spec is absent. Values scrubber destruction is present independently. | Revoke local timers/tokens and reject probe/frame/strip/load callbacks after view disposal.                                                                | It prevents an old owner from publishing but loses a same-path pending playhead/probe. The successor sees only the old settled frame or no provisional video state and does not reacquire. |

Preserve both sweep tags in lead-owned commit provenance, but adapt them to the current store revision, token-owned runners, profiling hooks, and requested/settled model.

## Source-verified IMP-192 counterexample

The failure does not depend on a missing type name; authority is lost between the canonical bucket store and the Values-local generation.

1. Values calls `createValuesFileIngestion().handleVideoFile(A)` (`file-ingestion-values.svelte.ts:65-75`). It records only local generation 1 and dispatches `probeVideo(A)`.
2. The user chooses still B in the bucket. `MediaBucket.svelte:24-32` calls `switchToFile(B)`. Current `image.ts:317-336` sets `videoState` to null and activates B, but it neither cancels the published/debounced video event nor advances the Values-local generation.
3. Late A success passes the only guard at `file-ingestion-values.svelte.ts:51`, then writes A into global `videoState` at `:52-59`.
4. Values' real subscription (`ValuesView.svelte:193-203`) sees a video whose path differs from B and schedules a frame. That completion calls the real `setFile` at `ValuesView.svelte:59-82`; `setFile` activates A at `image.ts:196`. B is no longer current.
5. A -> B -> A is worse: local `pendingVideoRequest.path === A` can suppress the new request, while the old A completion becomes acceptable again because the only durable comparison is the repeated path. Home has the analogous same-path hole: its bucket callback skips solely when `videoSelection.path` matches (`HomeView.svelte:415-420`), and its probe/strip checks compare path without a selection epoch.

A late Values probe rejection currently does not replace B, but it still reports the error through `console.error` and clears the old local pending slot because B did not change `videoRequestGeneration`. That is not positive stale-error ownership. The repaired path must suppress stale error publication/cleanup just as it suppresses stale success, while a current request's rejection still reports and releases its own pending state.

Home's path and `videoDecodeToken` checks already reject many A -> different-path B cases incidentally. They are not canonical selection authority: they do not cover same-path return, store removal/re-add, delayed bucket delivery, or an old view whose selection remains globally current.

## Canonical selection boundary

Keep this renderer-only and store-owned in `stores/image.ts`; it is not a native source generation.

```ts
interface SelectionAuthority {
  epoch: number;
  mediaId: string | null;
}

beginSelection(mediaId: string | null): SelectionAuthority
isCurrentSelection(authority: SelectionAuthority): boolean
setFile(entry, dataset, { selection }?): boolean
```

Concrete names may vary, but these semantics are required:

- The epoch is a session-local monotonic safe integer and never resets on `clearFile`. `beginSelection` also revokes the old 150 ms `pendingVideoSwitch`; `switchToVideo` begins first and then installs its new epoch-bearing pending event.
- `setFile` with no authority is a new still/replacement selection: normalize duplicate-path ID first, begin the selection, allocate a new `contentRevision`, publish pixels, and activate. `setFile` with captured authority is probe/frame settlement: validate before any resource/store mutation, allocate the new frame content revision, publish, and return true without advancing the selection epoch. Return false on stale settlement so callers cannot schedule analysis, set poster/active path, push video state, or cache afterward.
- A rejected blob entry releases its unadmitted preview URL. Native frame artifact reclamation remains IMP-193; do not claim renderer rejection deletes an in-flight native output safely.
- `switchToFile`, `switchToVideo`, accepted file-dialog/clipboard/drag still selection, active same-ID replacement, current-entry removal, `clearActiveSelection`, and `clearFile` begin a new authority. Removing an inactive entry and appending a genuinely new non-active library/snapshot/Batch entry do not.
- Current-entry removal advances once, then settles its chosen still successor or none under that same authority. Do not call a public begin-on-switch helper a second time from the removal path.
- `pendingVideoSwitch` carries the captured authority through `subscribePendingVideoSwitch`; the subscriber validates before callback. Home/Values direct video ingestion begins one itself. A current probe/frame/strip completion validates that same authority and its local request/view token. Success/error/finally paths all use the same two checks.
- A user choosing the same ID/path again always receives a new epoch. A late completion from the earlier visit cannot become current when the target string repeats. Choosing an already-stored still likewise receives a new selection epoch but preserves its existing `contentRevision`.
- `contentRevision` is allocated only for accepted new pixels. It does not change on bucket return to a stored entry, does not order user intent, and is never compared as the selection epoch. A successful frame settlement can retain epoch E while receiving new content revision R.
- View disposal does not advance the epoch. It revokes only that controller/ingestion/scrubber owner. Navigation is not a new user selection, so the successor resumes E and must not make the old owner current by sharing E.

The current source's starts/settlements map to that boundary as follows:

| Path                                                                          | New selection?                            | Required authority behavior                                                                                                                              |
| ----------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MediaBucket.handleClick -> switchToFile`                                     | Yes, including same-ID click              | Begin in store, cancel pending video event, activate stored entry without changing its content revision.                                                 |
| `MediaBucket.handleClick -> switchToVideo`                                    | Yes                                       | Begin before 150 ms debounce; payload carries epoch/media ID. A still, replacement, removal, clear, or newer video revokes it before and after dispatch. |
| `setFile` from App/global picker, Values still ingestion, Batch's first still | Yes, default form                         | Store begins after synchronous accepted entry construction. Batch runner/export job tokens remain untouched.                                             |
| App clipboard paste                                                           | Yes                                       | Begin after supported MIME acceptance and before native save/copy awaits; pass authority to `setFile`.                                                   |
| Home `ingestSelection`                                                        | Yes                                       | Begin before browser dataset decode/native admission window; existing `loadToken` still owns execution. Pass authority to `setFile`.                     |
| Home/Values direct video import                                               | Yes                                       | Begin before probe; publish a provisional epoch-bearing video selection immediately so another view can resume a pending probe.                          |
| Home/Values probe, frame, and strip completion                                | No; same-intent settlement                | Validate epoch plus local generation/token/view owner. `setFile(..., {selection})` returns acceptance before analysis/state/cache publication.           |
| Matched `appendFile` replacement                                              | Only when it is the selected-intent media | Advance epoch and invalidate data caches. Ordinary new library append, snapshot append, and non-active replacement do not retarget the active selection. |
| Current removal / clear                                                       | Yes                                       | Revoke synchronously, then settle successor/none once. Inactive removal does not advance. Clear never resets either monotonic allocator.                 |
| Home/Values disposal                                                          | No                                        | Revoke old view tokens/timers; preserve global epoch and requested state for the successor.                                                              |

Independent Colors export and Batch authority must not import, store, validate, or be canceled by this epoch. Their existing request/job tokens continue independently. Selection of B may change what a later job captures, but must not retarget a job already started for A. This slice does not claim IMP-184's immutable export descriptor or IMP-193's retained native inputs; it only avoids coupling those owners to active-view selection.

## IMP-182 reconciliation after wave04

The original unsafe branch is gone. The rejected historical SWEEP-010 design used `preserveColorAnalysis: boolean` while replacing frame pixels and could seed an ID-only completed key. Accepted wave04 instead does all of the following:

- `video-controller.svelte.ts:483-519` restores cached playhead/visual metadata but always schedules a fresh extraction.
- Accepted frame publication at `:327-347` cancels current Colors work, clears its completed key, calls store `setFile`, and schedules fresh analysis.
- `image.ts:169-211` invalidates matched Colors and Values data before publishing a new store-owned content revision.
- `analysis-runner-revision.spec.ts:240-270` proves an actual stored entry/remount can reuse the identical revision while a new admission dispatches again.
- `image-analysis-lifecycle.spec.ts:313-334` proves preview updates and stored-entry bucket return preserve revision.

Therefore the specific “cached A analysis is preserved onto freshly extracted B pixels” failure is removed and no separate production feature is needed for 182. What remains unproved is execution coverage, not a missing restore API:

1. Cached A at t7, step/seek during the 250 ms restore debounce: only requested B extracts and analyzes.
2. Cached A at t7, first extraction already in IPC, then step/seek: A completion cannot publish or clear B; the serialized successor extracts/analyzes B.
3. Cached A then fresh video B: cached seek/poster/restore state does not leak; the existing SWEEP-003 test covers this positive transition and stays green.
4. No step: cached playhead t7 is freshly extracted and analyzed exactly once. This is the current positive control, not cached analysis reuse.

Add cases 1–2 to `views/home/video-controller-cache-reset.spec.ts` using deferred `extractVideoFrame` and the real controller token/queue. Retain the existing 3 tests and wave04's stored-entry positives. Do not add transient decode/request tokens to reusable frame equality and do not reintroduce `preserveColorAnalysis`, `seedAnalysisKey`, or ID-only cache reuse.

## IMP-183 requested/settled handoff

Current `VideoState` has one ambiguous `currentTime` plus `posterPath`. Home updates `currentTime` before its 250 ms decode; Values updates it only after decode. Neither state records whether the poster/selected pixels settled for that requested time.

The exact Home -> Values loss is:

1. Home displays t0, steps to t1, immediately pushes `videoState.currentTime = t1`, and schedules decode.
2. Home unmount currently does not dispose its controller. Values synchronizes t1, but its subscription schedules only when `runner.file.videoPath !== videoState.path` (`ValuesView.svelte:194-198`). The stored t0 entry has the same path, so Values does not reacquire.
3. Values now shows a t1 playhead with t0 pixels/analysis. The old Home completion may also publish after unmount.

The reverse loss is earlier: Values changes its local `currentTime` but does not update global state until extraction succeeds (`video-scrubber.svelte.ts:117-125`). Disposal revokes its token, so Home remount sees only t0 and cannot know t1 was requested.

Use the existing `VideoState.currentTime` as the requested playhead for compatibility, but add required `selection` and a structured settled field:

```ts
interface SettledVideoFrame {
  imageId: string;
  contentRevision: number;
  path: string;
  timestamp: number;
  maxDimension: number;
}

interface VideoState {
  // existing path/name/duration/fps/strip fields
  selection: SelectionAuthority;
  currentTime: number; // requested playhead
  settledFrame: SettledVideoFrame | null;
}
```

`settledFrame` is renderer-session evidence: it identifies the exact accepted image-store entry/output for the request and extraction size. It is not an actual decoded PTS, a native lease, a source-generation ID, or cross-reload byte equality. Current native `timestampUsed` is only the requested seek rounded to three decimals; no exact-media-sample claim belongs in this wave.

Required behavior:

- Home and Values write requested `currentTime` plus the retained settled frame immediately on step/scrub commit, before the 250 ms timer/IPC. The Values scrubber gets an explicit requested-time callback; it no longer waits for success to publish intent.
- Frame success first validates view token + selection, then calls accepting `setFile`. Only after that boolean succeeds may it construct `settledFrame` from the normalized entry (including the store-assigned `contentRevision`), update poster/state/cache, and schedule analysis.
- A same-epoch successor compares `{selection, currentTime}` with `settledFrame` and the actual selected entry. Exact same-epoch stored settlement may be reused. Missing/mismatched settlement causes a new successor-owned decode even when `videoPath` is unchanged and a poster exists.
- A new video selection gets a new epoch. Session-cache poster/current-time data may be shown as a hint, but `settledFrame` is null for the new authority until fresh extraction succeeds. Do not relabel a mutable-path extraction with the old settled entry's revision.
- Direct video selection publishes provisional `VideoState` before its probe. A successor that sees missing metadata reacquires the probe under its own owner but the same selection epoch. This prevents a Values-started probe from disappearing when navigation consumes the one-shot bucket event.
- Adapt all of SWEEP-023's disposal checks: Home probe/frame/strip/load callbacks and Values ingestion probe reject after disposal; Values scrubber already revokes its decode token. Old owner disposal must occur before successor subscription work can accept callbacks. Do not clear global requested state on view disposal.
- Snapshot eligibility is `selection current && requested frame == settledFrame && selected entry matches settledFrame`, not merely “IPC boolean is false.” During debounce, active IPC, handoff, or a failed current decode that leaves requested != settled, snapshots remain unavailable. Once settled, the path and timestamp come from one accepted settled identity. Home can preserve its current `VideoPanel` API by exposing `videoPosterPath` only when this invariant holds; no `VideoPanel.svelte` amendment is required.

The existing queue-by-frame-ID in Home may remain. Queue serialization controls output-path overwrite; epoch/view token controls publication. Neither substitutes for the other, and native immutable artifact ownership remains IMP-193.

## Exact phased file fence

### Phase 192 — SWEEP-013 plus canonical active-selection authority

Production:

- `tauri-app/src/App.svelte` (amendment: clipboard intent before awaits only)
- `tauri-app/src/lib/stores/image.ts`
- `tauri-app/src/lib/stores/video.ts`
- `tauri-app/src/lib/services/view-subscriptions.ts`
- `tauri-app/src/lib/views/HomeView.svelte` (amendment: carry/compare authority)
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts` (amendment: intent before decode only)
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/ValuesView.svelte`
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`

Permanent tests:

- `tauri-app/src/lib/stores/image-video-switch-lifecycle.spec.ts` (new on this candidate; adapt SWEEP-013)
- `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts` (amendment; real pre-await ingestion settlement)
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` (new on this candidate; selection success/error matrix first, disposal completed in 183)
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`

Do not touch analysis/value-analysis runner semantics, profiling, export/Batch runners, native bridge/schema, debounce durations, numeric parameters, or artifact cleanup in this phase.

### Phase 182 — regression reconciliation only

- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` only if the real-store cached-A/fresh-B composition cannot stay entirely in the focused controller test.

No production file is required. If a new production restore branch appears necessary during implementation, stop 182 and request a source-specific ruling; do not infer permission from old ticket prose.

### Phase 183 — SWEEP-023 plus successor-owned requested/settled handoff

Production:

- `tauri-app/src/lib/stores/video.ts`
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/views/ValuesView.svelte`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`

Permanent tests:

- `tauri-app/src/lib/views/__tests__/video-view-handoff.spec.ts` (new)
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` (amendment)
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`

No `VideoPanel.svelte`, frame-snapshot service, full extraction unification, EPIC-026 playback, native registry, export/Batch, or scheduling-policy file is required by this design.

## Permanent regression matrix

| Issue           | Required executable cases                                                                                                                                                                                                                                                                                                                                                                                                     | Positive controls                                                                                                                                                                                                                                                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 192 / SWEEP-013 | Dispatched Values probe A -> actual store `switchToFile(B)` -> late A success; same with rejection. Repeat B as replacement, active removal, clear, and newer video. A -> B -> same-ID/path A rejects the first A. Cover both 150 ms pre-dispatch cancellation and post-dispatch authority. Home probe/frame/strip same-path return validates epoch. Stale `setFile` must not allocate/publish/activate or schedule analysis. | Current probe success settles metadata and frame under the same epoch; current rejection owns only its error/finally. Stored still selection advances epoch while preserving content revision. New library/snapshot append and active selection leave independent Batch/export tokens untouched.                                                  |
| 182             | Cached A -> step B during 250 ms debounce; cached A IPC active -> step B and resolve A first; cached A -> fresh video B. Assert exact extracted timestamps, accepted `setFile`/analysis counts, pending state, and no A cache preservation.                                                                                                                                                                                   | No-step cached playhead performs one fresh extract/analyze; wave04 stored-entry/remount reuse still performs no native analysis.                                                                                                                                                                                                                  |
| 183 / SWEEP-023 | Home t0 -> request t1 -> Values during debounce; repeat during active IPC with old completion first. Reverse Values -> Home at both boundaries. Include pending metadata probe handoff. Dispose old owners and prove they cannot publish, clear successor pending state, or overwrite errors. Repeat same path/ID.                                                                                                            | Same-epoch settled t0 handoff makes no redundant decode. Successor t1 completion publishes one store revision/analysis/state. Snapshot unavailable from request through handoff; available only after settlement with exactly the settled path/timestamp/revision. Current decode rejection leaves requested != settled and snapshot unavailable. |

`video-view-handoff.spec.ts` should use the actual `image`/`video` stores, both real controller factories, real `setFile`, and deferred mocked bridge promises. Rune shims are acceptable; a mocked `isStale` boolean is not. Assert store-visible selected entry, content revision, `VideoState`, request counts, and snapshot helper output, not only callback spies.

## Evidence run and unrun acceptance

Focused executable evidence on clean `41222c5`, installed dependencies, Node v26.8.1:

```text
npm run test -- --run \
  src/lib/views/__tests__/audit-control-flow-races.spec.ts \
  src/lib/views/home/video-controller-cache-reset.spec.ts \
  src/lib/views/values/video-scrubber-snapshot.spec.ts

3 files passed; 29 tests passed
  audit-control-flow-races: 16
  video-controller-cache-reset: 3
  video-scrubber-snapshot: 10
```

That run proves existing different-video frame rejection, local probe generation ordering, Home token/queue ordering, conservative cached-frame recomputation, and current settled-snapshot token behavior. It does **not** contain the canonical bucket-still counterexample, same-ID return, Values probe disposal, Home controller disposal, cross-view successor reacquisition, provisional-probe handoff, or requested-versus-settled store identity. The two historical spec files are absent from this candidate; no result from their source branch was relabeled as current execution.

Unrun/unproved: mounted Svelte `onMount`/cleanup/subscription ordering; actual Tauri/FFmpeg probe and decode overlap; browser drag/drop and native picker/clipboard timing; native output overwrite/reclamation; exact decoded PTS; Node 20; Windows/Linux; packaged-app rapid Home/Values handoff; owner acceptance. No full gates, build, app control, native smoke, temporary repro, source edit, Git mutation, or ticket/INDEX edit was performed. After implementation, run the complete §6 renderer/Rust/scalar/static gates and retain the mounted/native gaps until separately observed.

## Lead ruling requested

Issue the exact three-phase fence above on clean `41222c5`, with acceptance only at the combined tip and lead-owned atomic provenance for 192 / 182 / 183 plus adapted SWEEP-013 / SWEEP-023. Approve the three file amendments explicitly. If the lead declines pre-await App/Home intent capture, record that as a bounded known gap rather than claiming every file-dialog/clipboard selection begins at user acceptance.
