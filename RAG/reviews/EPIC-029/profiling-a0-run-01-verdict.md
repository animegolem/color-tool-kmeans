# Profiling A0 run 01 — lead verdict

Review Lead → Code Lead, 2026-09-05. AI-IMP-202. **Accept bounded nearby-frame diagnostic evidence; exact-case/fresh-process and full-interaction acceptance remain open. No next execution slice is assigned.**

## R1. Independent evidence checks

Candidate remains clean at 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Lead verified all five submitted run-artifact hashes, independently matched all 31 TSV pending/ready pairs to their raw log lines, verified their non-overlap and recomputed all intervals and summary statistics. Inspected actual caller/native bridge/store transitions: pending→new native call→accepted ready, with no native result cache at this call seam. Log source/frame identity stayed stable for measured K81/K82 reruns.

Seven transcribed UI kernel durations: 95, 93, 95, 104, 94, 100, 93 ms; median 95, range 93–104. Seven independently recomputed log pending→ready intervals: 132, 123, 133, 139, 125, 133, 124 ms; median 132, range 123–139. Visible-only six trials: UI median 94.5 ms and log-interval median 129 ms. Trial 1 remains included in complete accounting but separate in the visible-only view.

UI milliseconds/iterations/sample counts are Code Lead's recorded observations, not independently replayed by Review Lead. No retained screenshot is available to independently inspect them. Recomputed arithmetic is not reobservation of the live display. Raw logs corroborate execution and secondary intervals, not the exact displayed kernel values.

## R2. Nearby-frame stratum, not exact reproduction

Actual request/decode log time is 58.4210 s, versus admitted 58.4163 s. Accept the measured stratum only as an explicitly unmatched nearby-frame diagnostic. Do not call it an exact admitted target or pool it with future exact-case data. Same source plus a 4.7 ms timestamp difference does not prove identical decoded pixels without frame/content evidence.

The submission accurately preserves the delta; its opening phrase “admitted warm-process operation” and manifest label “matched-to-closest-ui-settle” must be read under this narrower ruling. Preserve original artifacts unchanged rather than rewriting the source record.

## R3. Keep endpoints and prior observation unchanged

The primary is displayed run_kmeans time. The secondary is observed app-log pending→ready, not calibrated input-to-presentation time and not every pipeline stage. It excludes the earlier debounce and is subject to event-log observation semantics.

Correction to submission prose: the owner's approximately 4000 ms observation was reported displayed/kernel time; it must not be relabeled as a separate four-second whole-app measurement. The approximately 4.579 s historical pending interval is a different observation. Today's optimized nearby-frame reruns are fast, but do not alone establish a debug-build causal ratio, numerical equivalence, release regression or absence of full-interaction delay.

## R4. Accept limited pilot only

No gross-slow marker appears in this nearby-frame warm-process sample. Host activity prevents an idle-condition claim. The hidden-webview interval/control incident must not be interpreted as a 38 s compute stall. Six visible trials and one hidden-interval trial remain distinguished.

Optional fresh-process target count is zero. Wrong-source screenshot observations are excluded; two-attempt stop respected. Final test app is reported running on the excluded source at PID 49097, not at the target. Runtime namespace verification and visual settings are reported operator evidence; this review did not relaunch or manipulate the app.

Missing screenshot artifacts, exact decoded-frame proof, fresh-process samples, CSS viewport/scale, calibrated presentation, full application symbols and historical comparator remain explicit. No IMP-202 aggregate checkbox closes.

## R5. Next direction, not blanket authorization

The next useful work is reproducible full-interaction evidence: deterministic material/frame selection and durable capture first, then bounded input/debounce/decode/native/renderer timing and profiling with adequate symbol coverage. Keep existing stage names: A1 is durable runner/manifest tooling; correlated source instrumentation is stage B. Do not silently authorize all B fences by calling it A1.

Do not add all-process recording, instrumentation, rebuilds, source changes or IMP-178 integration without a separate exact brief. Current evidence does not justify a numerical optimization patch. Code Lead retains artifacts and stops without polling; lead will select the next bounded implementation/capture slice.

## Provenance

Submission SHA-256: d07d50b84fd56f6687a02841f5a2e38967dc6aac97edace51f479643735ecf4b.
Run-manifest SHA-256: 9f99bfe53e515ab0df4dbcac3e0e33296fc96befe0eed7c72147cf1b2e2e74b3.
Private root: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/run-01.hilHbt.
No source/build/Git changes or new runtime observation by lead.

