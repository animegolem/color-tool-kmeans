# Phase183 amendment01 — preserve playhead, current snapshots and scrub policy

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.61. **AMEND; no183 acceptance/commit and no combined-wave acceptance yet.** Keep original submission8826aa57279e6beabbecc6a98a36e5e056c41010fff32e56439c668346149763 immutable. Source remains at8a8e13381410841674015ae27da9310c3c659fbe plus the same11 submitted paths.

## Reviewed evidence

Lead matched all11 prepared hashes and10modified/1new fence. Independently reproduced431tests/35files, expanded150/13, Node88/event10, check0errors/2accepted warnings, lint/format/diff; native fmt/clippy, workspace72pass+1intentional ignored, scalar1 and color-core normal tree without Tauri. Native ignored emitter remains exercised by Node. Lead read all six production diffs, the new handoff harness and targeted regressions. Passing these gates does not cover the three source-visible gaps below. No source/Git/app/evidence action by lead.

## A1 — Values new-selection cached playhead is lost

`values/file-ingestion-values.svelte.ts` handleVideoFile publishes currentTime0, then the cached arm of probeAndSetVideoState now spreads that provisional state without restoring cached.currentTime. The prior accepted implementation restored the cached playhead. The new metadata-merge correction correctly protects an overlapping same-epoch request, but accidentally changes a new cached selection to t0. Existing AUD008 asserts strip identity, not retained playhead, so it misses this regression.

Initialize cached playhead/poster/strip hints at new-selection admission, before its synchronous state publication can trigger subscriber extraction. Keep settledFrame null under the new epoch and require fresh extraction; do not revive cached analysis. Preserve newer same-epoch requested/settled state at subsequent probe completion exactly as H1 requires. Add a real-store Values regression: cached t7 -> new activating selection retains requested7, has no inherited settlement, and the subscribed scrubber issues only the fresh t7 extraction (no provisional t0 dispatch). Retain the overlapping probe/frame merge positive and cached strip identity. Use existing Values ingestion disposal and/or handoff suite only.

## A2 — Home snapshot getter compares the old epoch to itself

`home/video-controller.svelte.ts` videoPosterPath calls matchesSettledVideoFrame(currentVideoState(), videoSelectionAuthority, ...). Both state and comparison authority are the controller's captured epoch; the getter never checks deps.isCurrentSelection/ownsSelection. After beginSelection for a newer target, before its150ms event or accepted entry changes, the old selected entry and old local state still match, so this getter can authorize a stale snapshot. Values separately passes current selection validity; Home needs the corresponding canonical check, not merely structural tuple equality.

Require current canonical authority at the Home snapshot seam. Regression: seed exact settlement and verify positive path; begin a different selection without resetting/restoring the old controller or replacing its displayed entry; snapshot getter must immediately return null. Keep exact same-epoch reuse/current snapshot positive and new-epoch fresh extraction. Ensure actual capture-time access uses this guard; a stale rendered enable state must not grant capture. Do not broaden the image store or VideoPanel fence for this fix; if required, report exact evidence before asking for an amendment.

## A3 — reconciliation must not dispatch during active scrub

The new HomeView effect calls video.ensureSettledFrame; that aliases scheduleVideoFrameDecode. The function reads reactive videoCurrentTime but does not check videoScrubbing. Therefore reconciliation invoked after scrub input can install the250ms decode while the pointer remains down, changing the previous end-of-scrub policy. H1 explicitly retained gesture scheduling, and no timing-policy change was authorized.

Make the controller reconciliation/scheduling boundary respect active scrubbing. Add an executable regression through the actual controller: start from an exact settled frame, begin scrub, change requested time, invoke ensureSettledFrame as the view effect does, advance beyond250ms with pointer still down and verify no new extraction/analysis or snapshot eligibility; release then verify exactly one final requested extraction. Retain step, quality-size mismatch, metadata reacquisition and182 debounce/IPC behavior. Do not solve this by disabling the quality/entry reconciliation feature, delaying requested-time publication, or changing250/400ms durations. Distinguish this factory-level effect-call test from unrun mounted reactivity proof. Check reconciliation of an already pending request remains deduplicated and never relabels old settlement as the drag target.

## Fence and return

Original183 six-production/five-test fence and H1–H4 remain binding; no new files besides a new planning report. Primary correction paths are Values ingestion and Home controller with existing ingestion/handoff/controller tests; HomeView may change only if needed for its assigned wiring. No image store/VideoPanel/runner/native/profiling/timing-policy/Git/app/cleanup/next-ticket work.

Before correcting production, add the three regression assertions against current submitted source and record meaningful failures. Then fix and run the full original18313-file expanded set, full renderer/static/Node/event/diff gates, and native fmt/clippy/workspace/scalar/core-tree gates on the final amended tip. Preserve original report and candid earlier transient failures. Return `RAG/reviews/EPIC-029/correctness-wave-05-phase-183-submission-round-02.md` with exact prepared hashes/fence/counts, failure receipts and remaining mounted/native-output/platform/owner gaps; source stays unstaged/uncommitted8a8e133. Notify lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 immediately, then stop without polling. No owner blocker; lead owes next review.
