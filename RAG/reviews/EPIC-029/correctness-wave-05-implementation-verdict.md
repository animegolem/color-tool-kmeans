# Wave05 implementation verdict — selection intent before settlement

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.57 §§3–8,11. Accept review SHA2565c8745132f0e4d329ec4ac9abea35c62221d7404a866034217b11a5fae1fcaf0 with binding clarifications below. No new general review is requested.

## Base and source review

Existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` remains clean **41222c50001b7a02d516e7122b94f434ea073243**. Lead read the complete review and current image/video stores, view-subscription carrier, App clipboard awaits, Home/Values handlers, probe/frame/strip guards and core analysis token boundaries. Independently reproduced focused29tests/3files. Both013/023 merge bases are28d9e84, not accepted tips. No source/Git/app action was needed to settle this ruling.

Order192 -> test-only182 ->183 remains accepted; source lifecycle acceptance only at the combined183 tip. **Implement192 now and stop for lead review/atomic commit before182.** Preserve wave04 and all profiling source/evidence. Do not cherry-pick historical013/023. Lead will record adapted013 provenance with192, test reconciliation with182 and adapted023 provenance with183.

## Binding design clarifications

**R1 — immutable freshness versus descriptive target.** Use one store-owned session-local monotonically increasing safe selection epoch; no reset on clear/remove, wraparound or per-ID retained history. Capture an immutable value/object, never a live mutable selection object whose epoch can change beneath a pending request. Same-ID/path return receives a new epoch. ContentRevision is only content admission identity, not proof of equal disk bytes or selection order. Existing view/request tokens remain independent and required.

The report's nullable mediaId needs an explicit admission rule: a direct clipboard/browser selection can start before its final normalized library ID is known. Bind/normalize current-intent media metadata under the same epoch on accepted settlement; do not make a valid captured epoch stale merely because null becomes an ID. Freshness validation is the captured epoch, not equality of a path/nullable descriptive ID. A selected video source ID and newly generated frame-output ID need not be identical; preserve the intended-source association explicitly. Do not silently equate whichever activeImageId happens to be displayed with latest intent.

**R2 — starts and non-starts.** Start only an actual activating selection. Stored still clicks, video clicks (including same target), supported paste acceptance, activating Home browser ingress, active-intent replacement/removal and clear revoke older selection work. Home ingestSelection(..., false), new library/Batch/snapshot append and inactive removal do not begin a new epoch or retarget a pending activating selection. When newer video A is pending while an older settled B remains displayed, removing/replacing B must not accidentally revoke A solely because B is still activeImageId. Removing/replacing the intended target does revoke. Current removal begins once, then selects its successor/none under that same new epoch.

**R3 — begin before waits, settle once.** Capture activated Home ingress after input acceptance and before browser dataset decode; clipboard after supported MIME validation and before imports/cache-directory/blob-buffer/native-save awaits. Capture video authority before probe. Ordinary synchronous setFile without an explicit authority begins a new selection after target-ID resolution. Same-intent setFile with authority validates before any revision/resource/store mutation, returns false on stale and true on acceptance, normalizes supplied/stored entry together, and never begins a second epoch. Current acceptance must preserve wave04 content invalidation/token behavior.

Before stale work can change shared state, check both local ownership and epoch; require acceptance before setActivePath, poster/video/cache publication, drawer/analysis follow-ups or success logs. Preserve Home runner cancellation before accepted frame publication, but do not let a stale frame cancel newer Home work. Success, rejection and finally/cleanup use the same ownership checks so an old error cannot clear current pending state. Local timers should be canceled where possible; cancellation of a native promise/output is not inferred.

**R4 — pending events and target continuity.** beginSelection revokes the existing150ms timer and pending event; switchToVideo begins once then publishes a captured epoch/media event. subscribePendingVideoSwitch validates before delivery, retains identity in Home/Values callbacks, and does not erase a newer event when consuming an obsolete one. Remove path-only same-video skips; dedupe only a current request under the same epoch/local generation. VideoState may carry selection and provisional metadata for the current probe in192; its missing metadata is not a successfully measured zero-duration video. Full successor reacquisition/disposal and requested/settled fields remain183 work, not claimed by this intermediate phase.

**R5 — job and resource boundary.** Bare selection epoch changes must not reset analysis/Batch/export job tokens or add epoch checks to independent job runners. Existing cache/view state changes at normal admission remain; this is not proof of fixed export descriptors or native retained inputs. Stale unadmitted blob preview releases use the existing tracked-URL-aware helper. Do not delete native clipboard/frame outputs after rejection: publication, aliasing and reclamation are193. No new source-generation/hash, native preemption, quota, timer change, numeric parameter or profiling schema.

**R6 — testable clipboard boundary.** Approve the review's App pre-await amendment, but require an executable production seam. Extract only the existing pasteImageBlob pipeline into new plain-TS `services/clipboard-ingestion.ts`; App delegates to it, preserving current supported MIME policy, save request/extension/naming policy, entry fields and accepted UI/log behavior. This is a cohesive async clipboard operation, not a generic ingestion/selection framework. Its new neighboring test uses real image-store selection authority and mocked IO/deferred saves to prove supported intent begins before waits, newer selection/second paste wins, stale success/error cannot alter current entry/path/state, current success/failure remains correct, and unsupported MIME does not revoke current selection. Guard any App follow-up after await using the returned current authority/result, not an unchecked boolean from an earlier accepted state. Do not modify the existing MIME helper or native filename/lifetime policy.

**R7 — test-only182 and later183.** Accept removing the original182 production premise: do not create RestoreIntent or revive preserveColorAnalysis/ID-only seeding. Next phase adds seek/step-during-debounce and active-IPC coverage plus the existing no-step fresh-extraction and cachedA->freshB positives.183 owns old-view disposal plus requested-playhead/accepted-settlement handoff, same-epoch exact stored-entry reuse, missing metadata probe reacquisition and settled-only snapshots. Requested timestamp evidence is not decoded PTS. Do not include183 implementation in192 to make the intermediate tip look complete.

## Exact192 file fence — eighteen paths

Eleven production paths:

- `tauri-app/src/lib/stores/image.ts`: canonical intent/epoch, begin/validate/same-intent acceptance, pending switch revocation, current-intent removal/replacement, blob rejection. Preserve wave04 revisions and cache behavior.
- `tauri-app/src/lib/stores/video.ts`: captured selection identity in state/cache interfaces only as needed for192; no settled-frame/183 workflow yet.
- `tauri-app/src/lib/services/view-subscriptions.ts`: epoch-bearing validated event delivery.
- `tauri-app/src/lib/views/HomeView.svelte`: retain/compare event authority, pass accepting store interface; no layout/profiling/scheduling changes.
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: activating pre-await intent and guarded settlement; non-activating append remains non-selection.
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: selection guards on probe/frame/strip success/error/finally and captured current load authority; no183 disposal/handoff implementation.
- `tauri-app/src/lib/views/ValuesView.svelte`: carry epoch to scrubber/ingestion, guard frame acceptance and all follow-up publication.
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts`: current epoch plus local generation for video probe/ingress; no183 view-disposal implementation yet.
- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts`: epoch plus local token frame checks and accepting callback; no183 requested/settled redesign yet.
- `tauri-app/src/App.svelte`: delegate only clipboard pipeline and carry accepted follow-ups; no navigation/picker/layout rewrite.
- `tauri-app/src/lib/services/clipboard-ingestion.ts` (new): R6 testable production clipboard operation.

Seven test paths:

- `tauri-app/src/lib/stores/image-video-switch-lifecycle.spec.ts` (new): adapt013 plus canonical current-intent/settlement/epoch/resource regressions.
- `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts`: actual pre-await Home ingress, stale decode success/error, non-activating append and preserved wave04 proof.
- `tauri-app/src/lib/views/values/file-ingestion-values-disposal.spec.ts` (new): selection probe success/error matrix in192; complete view-disposal/handoff part in183.
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`: actual canonical store/controller stale/current guards; existing token and independent-job boundaries retained.
- `tauri-app/src/lib/services/clipboard-ingestion.spec.ts` (new): executable R6 pipeline tests with real store authority.
- `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts`: **interface/authority fixture adaptation only** to the new accepting setFile/selection contract. Keep its current assertions;182 scenarios remain next phase.
- `tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts`: **interface/authority fixture adaptation only**; retain existing snapshot assertions.183 settlement assertions remain later.

The last two fixture allowances explicitly prevent an interface change from forcing silent out-of-fence edits; do not weaken old tests or allow undefined mocked setFile returns to stand in for acceptance. No other files may change. In particular no analysis/value runner, profiling coordinator/fixtures/schema, native/bridge, artifact cleanup, export/Batch production, dependency/config/hook, UI design, ticket/INDEX or timings. Outside-fence need returns exact path and reason before editing. Existing ui.ts barrel already exports image/video APIs and needs no amendment.

## Regression and validation gate

The review's192 matrix remains required, strengthened by R1–R6: actual bucket switch after dispatched Values probe, stale success/rejection across replacement/removal/clear/newvideo/same-ID return; pending-event pre-dispatch and delivery suppression; Home same-path probe/frame/strip; current success/error/finally; own accepted frame retains epoch while contentRevision advances; rejected settlement allocates nothing and preserves resources/current path/cache; inactive library work preserves current intent; removing old displayed B while newer A is pending preserves A; bare epoch changes leave independent jobs untouched. Execute real factories/store APIs with proper rune shims and deferred IO, not a mocked isStale boolean. Preserve earlier wave04 positives.

Before production edits, reproduce meaningful new negatives where practical. No skipped/it.fails regressions. From tauri-app run all seven named test files plus existing image-analysis-lifecycle, multi-analysis-lifecycle, Batch runner revision, profiling-contract and profiling-svelte suites; then full npm test -- --run, check, lint, format:check and node --test scripts/profiling/*.test.mjs. Root event-guard Node tests and git diff --check also required. Installed dependencies only; no install/build/app run. Native full/scalar gates remain required at final183 tip, not repeated for each renderer phase.

Large existing files remain cohesive for this bounded work; do not minify or add an unrelated framework to hide LOC. Report actual size and cohesion changes for lead-owned commit handling. No blanket LOC exemption, hook bypass or delegated commit.

## Submission and stop

Write only planning report `RAG/reviews/EPIC-029/correctness-wave-05-phase-192-submission.md`, with exact base/head/status/before/prepared hashes, eighteen-path fence accounting, regression delta, actual negative/final counts and candid remaining183/native/mounted gaps. Candidate source remains uncommitted. Notify Review Lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 immediately, then stop without polling. Lead owns review and an atomic192 commit carrying adaptedSWEEP013 provenance before releasing182 at a named new base. No owner question, bell, app/browser control, capture, Git mutation, merge/release, native policy, cleanup or next-wave work.
