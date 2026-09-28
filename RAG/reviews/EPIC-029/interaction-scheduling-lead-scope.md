# Gesture-aware scheduling — lead scope, not implementation

2026-09-06, PROJECT-RECORD rev0.52 §11. Owner authorizes careful responsiveness improvement alongside resumed correctness. This note frames the first implementation question; it is not a dispatched coding ticket and does not alter the400ms policy.

## Current candidate source

Examined correctness candidate8bf3187 plus accepted57 profiling paths, not the older planning checkout's renderer.

- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts`: fixed ANALYZE_DEBOUNCE_MS400. scheduleAnalysisWith stores lastRequestKey before starting the timeout; equal keys are ignored except error status. There is no explicit flush of a queued identical request. Scheduled and seeded keys currently identify imageID but not content revision, motivating wave04 before modifying this surface.
- `tauri-app/src/lib/views/HomeView.svelte`: handleScrubStart sets isScrubbing, and the main effect skips scheduling during a pointer scrub. handleScrubEnd schedules through the ordinary400ms timer. Pointerup/cancel are installed both locally and at window level; the isScrubbing guard prevents repeated end handling. These are existing mechanisms to preserve, not a reason to add another pointer event system.
- `ParameterControls.svelte`: four analysis-affecting sliders and the visual-only symbol-size slider share scrub handlers. Number input has no commit handler; checkbox snapToReal is discrete. Six profiling input hooks use capture phase because the installed Svelte binding order mattered in B12/B13. Profiling callback failures are explicitly observational and must not control normal input behavior.
- `analysis-runner.svelte.ts`: cancellation revokes renderer/store publication authority and timers. The shown runAnalysis path awaits analyzeImage; renderer token invalidation is not evidence that dispatched native computation stops. Faster dispatch therefore needs explicit concurrency accounting; dropping old results is not equivalent to avoiding obsolete CPU work.

## Proposed smallest experiment

Start with **flush-on-commit**, not a blanket shorter debounce and not continuous native analysis during drag:

1. Keep coalescing for typing and keyboard autorepeat. Preserve validation and incomplete numeric-input behavior; no synthetic0/NaN native request.
2. Evaluate immediate admission after a genuine committed control change: pointer release, explicit Enter for a valid numeric value, and discrete snap checkbox. Verify actual bound-value/event order in the installed Svelte version before deciding exact handlers. Pointercancel/blur are not automatically identical to a successful commit; document their current value semantics before choosing behavior.
3. Flushing an already scheduled identical request must run once, clear its timer, retain its captured source/config and associated input action, and not admit a second request from the subsequent effect. A visual-only control must never trigger native work.
4. If native work is still running, first decide and test a bounded latest-pending policy. Do not accumulate committed requests or silently invent native cancellation. That policy is a separately reviewed behavioral change if needed; the initial scope may remain idle-worker flush only.

## Acceptance before adoption

- Production runner tests: commit before timeout, after timeout, duplicate local/window/end events, unchanged value, invalid/incomplete number, retry, replacement/removal/unmount, rapid alternating inputs, and one in-flight request followed by several edits.
- Test real compiled component binding/commit ordering, not a harness that directly invokes callbacks in the intended order. Cover mouse, keyboard and cancellation/focus loss where the event semantics differ.
- Preserve numerical request parameters and deterministic result/output fixtures; no lowered iterations/sample budget/quality. Profiling on/off must not change scheduling; loss/association integrity cannot be relaxed to make traces pass.
- A bounded real-app before/after interaction uses the same build-source lineage, material, config and declared host conditions. Compare input-to-visible result and request counts; do not substitute displayed kernel duration. A normal78ms owner screenshot is useful feedback but is not that comparison.

## Sequencing and fences

Wave04 replacement identity is active separately; do not edit its runner/controller files concurrently. Selection/frame identity and native lifetime work remain separately ticketed. No new full profiler project is needed to answer the first scheduling question. Lead will issue the exact ticket, policy and file fence after wave04 integration/source review; this note grants no candidate, app, Git or dependency mutation.
