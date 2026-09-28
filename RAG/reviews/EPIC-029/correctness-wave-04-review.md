# Correctness wave 04 — replacement identity pre-implementation review

Code Lead -> Review Lead, 2026-09-06. Governing brief SHA-256 `b19160132de1b5dc41026069c854bf534f912137502e6101dedda7a10888300d`; PROJECT-RECORD rev0.52 §§4–6 and 11.

Review state: **READY FOR A BOUNDED IMPLEMENTATION RULING, WITH SEMANTIC ADAPTATION REQUIRED. Do not cherry-pick either historical issue commit verbatim.** SWEEP-010, then SWEEP-017, then IMP-181 remains a workable provenance order, but acceptance is only at the three-issue tip. The smallest safe design is one renderer-local `contentRevision` on stored image entries, used by both Colors request identity and pinned-result invalidation. It is not a selection epoch, decode/request token, content hash, or independent Batch/export job authority.

## Outcome first

- Candidate identity is exact: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, branch `codex/correctness-wave-01-2026-09-05`, HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- Expanded status remains the expected 57 profiling paths, SHA-256 `062d3a169ed3010c6ef1b0eb485f7b069a8c212122e9b7da959307da1e46ad1a`. There is no unexpected candidate drift.
- Historical SWEEP-010 `42137f7451297c8bff52cb0ee73c83845979c14f` and SWEEP-017 `1e48deb6d3cac490096fc45cd1ca1fc1c1b1025a` are both absent from candidate ancestry. Their source-only hunks pass `git apply --check` independently against current candidate source. Each full commit fails only at its stale generated `RAG/INDEX.md` hunk. That is mechanical applicability, not semantic approval.
- The current same-path Colors defect is still present. `setFile` retains the old ID and Colors cache; the ingestion adapter cancels execution but not the runner's key; the key contains ID/settings but no content revision; therefore ready A -> same-path B with unchanged settings is deduplicated before a timer/native call.
- SWEEP-010's broad `preserveColorAnalysis: boolean` is not admissible. In the historical 010 -> 017 composition, `setFile` increments the entry revision and can then retain A's cached analysis under that new revision. The video seed also supplies only an ID, so adding revision to the runner alone would seed `undefined`/default identity.
- SWEEP-017's revision tracking is the right primitive for ready pinned content, but its historical tests stop at store invalidation. Current Batch policy returns to the selection state; the next explicit Analyze recomposes/recomputes. Automatic rerun would be a separate interaction-policy change and is not proposed here. In-flight Batch/export retained-job authority remains later work; wave04 must not claim it.
- Existing 400 ms scheduling, request-token ownership, B20 evidence, profiling schema, and native request behavior remain unchanged.

## Current failure chain

### Colors ready A -> same-path B

1. `file-ingestion.svelte.ts:92-125` advances its load token, calls `cancelPending()` at line 98, constructs the new entry, then calls `setFile` and immediately schedules analysis.
2. `image.ts:161-181` finds B by the same pathname, mutates B to A's ID, replaces the stored dataset/entry, and publishes the images update. At `:182` it invalidates only Values. At `:191-197` the still-present Colors result under A's retained ID makes the store ready again.
3. `analysis-runner.svelte.ts:81-110` cancels pending timer/execution authority but deliberately leaves `lastRequestKey`. `:141-153` builds that key from ID and analysis settings only. `:166-169` therefore returns for B before scheduling because B retained A's ID and settings.
4. The explicit ingestion schedule and `HomeView.svelte:521-545` reactive schedule converge on the same broken key; neither produces B work. This is the current-source equivalent of the previously executed zero-timer probe, not a historical-patch assumption.

### Old completion versus B

For the actual Home ingestion path, the current cancellation half is sound and should be preserved. `cancelPending()` advances the runner token at `analysis-runner.svelte.ts:95`, resets only its owned store token at `:96-99`, and clears scheduled/running timers. A late A response is rejected by the token check at `:234-240`; once B starts, the store token also belongs to B. The permanent regression must resolve A after B to prove A neither repopulates `analysisById[A.id]` nor satisfies B.

One adapter needs correction: non-restored video frame publication currently calls `setFile`, then only `clearLastRequestKey`, at `video-controller.svelte.ts:345-357`. Clearing a completed key does not revoke an already running Colors request. Add the existing runner cancellation capability to the video-controller dependency and invoke it before publishing a replacement frame. This is still renderer request-token ownership; it does not create selection-epoch or native cancellation semantics.

### Completed-key seed/cancel inventory

| Adapter | Current behavior | Wave04 treatment |
| --- | --- | --- |
| Home initial/remount seed, `HomeView.svelte:198-205` | Passes the actual selected file; currently no revision exists. | Keep; after the store assigns revisions this is the positive eligible unchanged-restore seed. |
| Video cached-restore seed, `HomeView.svelte:249-259` and `video-controller.svelte.ts:345-352` | Casts only `{id}` and treats a fresh frame extraction as proven cache equality. | Remove this ID-only seed path for wave04. A re-extraction from a mutable source is a replacement unless later IMP-182 proves a complete RestoreIntent. Preserve cached seek, but recompute Colors. |
| File ingestion cancel, `file-ingestion.svelte.ts:96-99` | Revokes scheduled/running Home work before `setFile`; retains completed key. | Keep. New revision makes B's key distinct; retaining A's completed key is harmless. |
| New-video and bucket-video cancels, `HomeView.svelte:221-225, 415-436` | Revoke Home work before loading another video. | Keep. |
| No-active-file and destroy cancels, `HomeView.svelte:521-526, 512-515` | Revoke pending work and profiling observation. | Keep unchanged. |
| Retry clear, `HomeView.svelte:340-346` | Explicitly clears dedup after error. | Keep unchanged. |
| Non-restored video frame clear, `video-controller.svelte.ts:345-357` | Clears key but does not revoke a running request. | Cancel first, then publish/schedule the new revision; clearing may remain as a redundant local reset or be removed if tests prove the revision key sufficient. |

No other Colors key seed or clear adapter exists in current source. Colors export writes `analysisById` independently at `colors-export-runner.svelte.ts:112`; that retained-job/source contract belongs to later IMP-184 and must not be pulled into this wave.

## Minimal revision contract

Use `ImageEntry.contentRevision?: number` as a store-normalized renderer-local integer:

1. First accepted entry is revision 0 when the caller has no proven revision.
2. `setFile` matching an existing ID or path and `appendFile` matching an existing ID conservatively assign `existingRevision + 1` before publishing the new entry. Unknown equality means replacement.
3. A matched replacement invalidates both Colors and Values caches before downstream selection/readiness can treat the new entry as ready. An `appendFile` same-ID replacement must invalidate too; the historical SWEEP-017 patch increments its revision but leaves the old per-ID analysis caches intact.
4. Preview-only metadata updates keep the revision.
5. Do not add `preserveColorAnalysis: boolean`. The only positive unchanged restore in this wave is reuse of the already stored selected entry/cache, such as Home remount, seeded with that actual entry and its actual revision. A path/frame re-extraction is not proof of equal bytes and recomputes conservatively.
6. Add normalized revision to both `scheduleAnalysisWith` and `seedLastRequestKey` key construction. The execution token continues to answer "may this invocation publish?"; content revision answers "do these cached pixels match?"; later IMP-192 selection epoch answers "is this result still wanted?" They must not be substituted for one another.

This primitive also lets `multi-analysis.ts` snapshot `{pinned id -> contentRevision}` and reset ready pinned results when a revision changes. Pin IDs/order and independent Batch job authority stay unchanged. Current Batch UX requires a new explicit Analyze after invalidation; the regression should execute that real runner action and prove a second compose/analyze occurs. Do not promise automatic recomputation or stale in-flight Batch/export cancellation from this slice.

## Historical patch disposition

| Issue | Historical patch | Exact current disposition |
| --- | --- | --- |
| SWEEP-010 | Adds `SetFileOptions.preserveColorAnalysis`, invalidates Colors by default, preserves during cached video restore, adds two store tests. | **Adapt.** Keep matched Colors invalidation and lifecycle coverage. Reject the boolean preserve path; invalidate before ready publication; cancel running video-frame analysis; correct the cached-video test to recompute after re-extraction. |
| SWEEP-017 | Adds optional `contentRevision`, increments on matched `setFile`/same-ID `appendFile`, tracks pinned revisions, adds two store tests. | **Adapt.** Keep revision and ready-pin invalidation. Also invalidate old per-ID caches on same-ID append; retain preview-only positive coverage; explicitly label subsequent Batch recompute as user-triggered under current UX. |
| IMP-181 | No source patch yet. | Add revision to scheduled and seeded Colors keys, pass actual entries rather than ID-only casts, and prove store + ingestion + runner behavior, late-completion rejection, unchanged remount reuse, and profiling-observer parity. |

The requested 010 -> 017 -> 181 ordering can remain for provenance. SWEEP-010 and SWEEP-017 are prerequisites whose individual intermediate tips do not close the user-visible defect; only the IMP-181 tip is an acceptable behavior gate. IMP-180 stays open.

## Smallest implementation fence

No native, dependency, schema, export, Batch production runner, or scheduling-delay file is needed.

| Path | Purpose |
| --- | --- |
| `tauri-app/src/lib/stores/image.ts` | Normalize/increment revision before publication; invalidate matched Colors/Values caches for set/same-ID append. |
| `tauri-app/src/lib/stores/multi-analysis.ts` | Track pinned revisions and invalidate ready pinned aggregate state. |
| `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` | Include normalized revision in scheduled and seeded request keys; preserve tokens and 400 ms behavior. |
| `tauri-app/src/lib/views/home/video-controller.svelte.ts` | Revoke running Colors work before replacement publication; remove ID-only post-extraction reuse. |
| `tauri-app/src/lib/views/HomeView.svelte` | Wire video cancellation and remove the ID-only seed adapter while preserving profiling hooks. |
| `tauri-app/src/lib/stores/image-analysis-lifecycle.spec.ts` (new) | SWEEP-010/revision store cases. |
| `tauri-app/src/lib/stores/multi-analysis-lifecycle.spec.ts` (new) | SWEEP-017 ready-pin and preview-only cases. |
| `tauri-app/src/lib/views/home/analysis-runner-revision.spec.ts` (new) | Real store + ingestion + runner revision/dedup/late-completion cases with rune shims. |
| `tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts` | Replace the unsafe post-extraction reuse expectation; assert cached seek plus conservative recompute and cancellation. |
| `tauri-app/src/lib/views/batch/batch-runner-revision.spec.ts` (new) | Using the real stores and runner, prove explicit Analyze recomposes after pinned revision invalidation. |
| `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` | Update controller dependency fixtures and retain token-race coverage. |
| `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` | Prove a new revision is not observationally labeled as production-deduped and same-revision repeats still are. |

`file-ingestion.svelte.ts` is inspected and already has the required cancellation/order; no production edit is currently justified. It should be exercised by the new integration test. `analysis.ts`, profiling coordinator/trace/schema, BatchView/runner production, Values, exports, native code, package/lock files, and all RAG tracking remain outside the Code Lead source fence unless the lead returns a numbered amendment.

Estimated change: five existing production files, three existing test files, four new focused test files; roughly 45–75 production lines and 180–280 test lines. Three lead-owned issue commits plus the separate profiling-baseline decision; no native build or migration.

## Ordered regression map

### SWEEP-010 adaptation

1. Ready Colors A at ID `retained`, path `/same.png`; `setFile` B with a fresh ID and the same path. Assert retained ID, B revision, A Colors/Values caches removed, and state idle.
2. Same-ID `appendFile` replacement increments revision and removes old per-ID Colors/Values cache; duplicate-path/different-ID append remains rejected without changing revision/resources.
3. Cached video seek restoration followed by a fresh extraction keeps the seek but does not seed old analysis; it cancels old Home work and schedules one replacement analysis.

### SWEEP-017 adaptation

4. Two pinned inputs have a ready aggregate; replace one under its retained ID/path. Assert revision advances and aggregate result/composite/error/state invalidate.
5. Preview-only update and an unchanged stored entry do not advance revision or invalidate the ready aggregate.
6. Invoke the real Batch runner's explicit Analyze before and after replacement with mocked native bridges. Assert two compose/analyze operations and a final ready result for the second action. Do not label this automatic rerun or retained-job proof.

### IMP-181

7. Through real `createFileIngestion` + image store + `createAnalysisRunner`, seed ready A, ingest same-path B with unchanged settings, advance exactly 400 ms, and assert exactly one B invocation despite explicit plus reactive-equivalent duplicate scheduling.
8. Start deferred A; ingest B; start/complete B; resolve A last. Assert B alone occupies `analysisById[retainedId]`, A cannot change ready/error state, and store/runner tokens remain owned.
9. Seed an actual stored selected file/revision on remount and schedule the same revision/settings twice. Assert zero native work and stable cached result. Then schedule the same ID/path/settings with revision + 1 and assert one invocation.
10. Profiling-enabled equivalent: `observeSchedule` receives two different opaque key strings for revisions A/B, reports B as not production-deduped, and retains existing delivered/admitted/store/DOM schema behavior. Same-revision repeated effect remains one bound action and one native call.

These cases are negative and positive through production store/runner APIs; a hand-built key-function assertion alone is insufficient.

## Profiling baseline integration ruling required before edits

Two proposed production files already contain preserved, uncommitted profiling work: `analysis-runner.svelte.ts` and `HomeView.svelte`; `profiling-contract.spec.ts` is itself one of the untracked profiling paths. The current runner passes its opaque production key to `trace.observeSchedule` at `analysis-runner.svelte.ts:154-165`; the trace persists only schedule disposition, while `imageRuntimeId`, expected path, native request, measurements, and evidence schema remain unchanged.

Adding revision inside that opaque key is the minimal correct integration. Do **not** add `contentRevision` to the accepted profiling wire/schema, relabel old B14 traces, or weaken association to make a test pass. Existing B20 artifacts remain historical evidence for their exact source.

Before any Code Lead source edit, the Review Lead must choose one atomic base treatment:

- preferred if the instrumentation is now source-approved: land the already reviewed 57-path profiling baseline as its own lead-owned prerequisite commit, unchanged, then apply 010 -> 017 -> 181 and the profiling parity regression; or
- if profiling remains evidence-only: create/select a clean `8bf3187` successor for wave04 and leave the dirty57/B14 evidence source untouched. Do not partially stage overlapping runner/Home hunks into issue commits while claiming the intermediate commits reproduce either baseline.

That is an integration/commit ruling, not an owner blocker. No debounce change belongs in either option.

## Validation performed and implementation commands

Read-only review validation performed on the exact dirty57 candidate:

`npm run test -- --run src/lib/views/__tests__/audit-control-flow-races.spec.ts src/lib/views/home/video-controller-cache-reset.spec.ts src/lib/views/__tests__/profiling-contract.spec.ts src/lib/views/__tests__/profiling-svelte.spec.ts`

Result: **4 files passed, 44 tests passed**, exit 0. Expected console error logs from two error-classification tests were present. No test source was changed.

Recommended focused implementation gate:

`npm run test -- --run src/lib/stores/image-analysis-lifecycle.spec.ts src/lib/stores/multi-analysis-lifecycle.spec.ts src/lib/views/home/analysis-runner-revision.spec.ts src/lib/views/home/video-controller-cache-reset.spec.ts src/lib/views/batch/batch-runner-revision.spec.ts src/lib/views/__tests__/audit-control-flow-races.spec.ts src/lib/views/__tests__/profiling-contract.spec.ts src/lib/views/__tests__/profiling-svelte.spec.ts`

Then run the normal full frontend/static gates at the final three-issue tip. Rust gates are unchanged and may be retained as required integration evidence, but no native source is in this fence.

## Candid friction and stop point

- The historical source hunks apply, which makes a blind replay look attractive. The unsafe boolean restore and missing append-cache invalidation are semantic failures that an apply check cannot detect.
- The existing cached-video positive test uses mocked `setFile` plus `hasAnalysisForImage(id)` and therefore proves only ID reuse after a fresh extraction, not immutable input equality. Its assertion must change under the accepted Round02 identity rule.
- SWEEP-017's ready-store invalidation is not automatic recomputation and does not cancel an independent in-flight Batch/export job. This report intentionally does not absorb IMP-184/186 ownership.
- The 57-path profiling carrier is expected, not drift, but it overlaps two load-bearing wave04 files. Atomic base treatment must be explicit before implementation.
- No private repro was needed: current source, historical patch diff, existing executed SEP-02 evidence, and focused current tests resolved the relevant ambiguity.

Only this report was written. Candidate/source/build/Git/app/evidence state was not mutated. Stop for the Review Lead's implementation/base ruling; no owner decision is pending.
