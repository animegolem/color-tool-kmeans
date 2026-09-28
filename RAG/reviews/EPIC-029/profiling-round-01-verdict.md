# Profiling Round 01 — lead verdict

Review Lead → Code Lead, 2026-09-05. AI-IMP-202. **Accepted as design basis with binding amendments P1–P8. Only A0 build preparation is authorized now.**

Reviewed submission: profiling-round-01-review.md, SHA-256 a4281d29e4fe03e04bb9a8a420882795ab0e8e2b05d7ecf1b10a7e3f5a6cdda0. Preserve it unchanged. Candidate independently rechecked clean at 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2.

## P1. Split preparation from measurement

Proceed under profiling-a0-build-brief.md: preserve an isolated optimized Wave 03 bundle, matching symbols and build provenance. Do not launch or record the app in this assignment. Actual measurements wait for the exact owner-confirmed file, video frame intent and resolved configuration, plus a coordinated quiet run. Likely clip identity, quality 2 inferred from 180,000 samples, and default K=45/snap=true are hypotheses, not case data. The owner has been asked for the exact case; no further broad media inventory is authorized.

A0 does not implement the durable system or close IMP-202. A1 tooling, B instrumentation and C IMP-178 integration remain separate assignments. End-to-end profiling remains the objective even if the release kernel is fast.

Before dispatch, Sol supplied a correction from app-owned logs: t=58.4163 s, K=82, quality=2; pending→ready took approximately 4.579 s. Associated persisted settings specify ignoreTopN=2, mergeThreshold=0 and snapToReal=true. Preserve the exact private source/path/hash details in the build submission as reported evidence, without rereading media/preferences. This supersedes the default-K inference above, not the need to verify full resolved configuration and coordinate a quiet run. A settings-file mtime is not proof that every value was active during the historical action.

## P2. Record only endpoints actually observed

A0 has no source instrumentation. Displayed durationMs is run_kmeans time, not total analysis or input-to-presentation time. Other internal stages, RAF2 and correctness fingerprints remain unavailable unless their actual external observation is demonstrated and separately approved. Missing values carry an unavailable reason, never zero or reconstructed guesses. Operator notes or video-derived intervals must name their observation method and uncertainty.

For future B, use an explicit approximate terminal such as ready_correct_raf2. Reserve presented_correct for independent actual-presentation evidence. RAF2 does not prove compositor/display presentation. Separate outcome correctness from observation precision.

## P3. Require a newly executed analysis

Before any measured repetition, document how it establishes a fresh native analysis rather than a deduped attempt, restored session or reused displayed timing. Fresh-process runs and warm runs are different conditions. Do not change cache policy or erase user data merely to force work. A sequence may change away and back to the exact target configuration, but must account for debounce, stale work and cache behavior. If the uninstrumented app cannot establish execution, mark the repetition unverified and do not pool it into fresh-analysis statistics.

## P4. Keep comparisons and thresholds honest

A0's proposed 2 warm-ups, 7 warm observations and optional 3 fresh-process observations are a pilot proposal to finalize with the case, not permission to begin. Report all observations and failures, median and range; no stable p95 claim from that budget. The proposed 500 ms median / repeated 1 s values can flag a grossly slow release case, not define an SLA or establish cause.

One release run cannot causally quantify a debug-build effect or explain the owner anecdotes. A matched controlled debug comparison would be a separate diagnostic arm. Historical 20–60 ms remains recollection until its binary/configuration is identified. A1/B overhead and regression thresholds remain provisional for a later measurement-plan verdict; small-tail estimates and bootstrap intervals must not overstate precision.

## P5. Build identity and symbols are acceptance gates

Use the exact isolated artifact root and new bundle identifier in the A0 brief. Product name alone does not isolate preferences/cache. Their expected namespace absence has been checked; actual runtime resolution remains unverified until a later authorized launch.

Lead checked installed Tauri build help and official Cargo profile/environment documentation. Release code generation plus line tables is a supported direction, not yet a successful build. Preserve actual compiler flags, executable/dSYM UUID equality and at least one application/core symbol resolving to a real source line. UUID equality alone is insufficient. No optimization, iteration/sample, dependency, feature, lock or source changes; no IMP-178. References: [Cargo profiles](https://doc.rust-lang.org/cargo/reference/profiles.html), [Cargo configuration](https://doc.rust-lang.org/cargo/reference/config.html).

## P6. Correct future test discovery before A1

The proposed scripts/profiling/profiling-tools.spec.ts is outside current Vitest src/**/*.spec.ts discovery. Future A1 must use an explicitly executed Node test path/command (for example a .test.mjs with node --test) or request a separately approved discovered test/config fence. No new test/configuration is authorized now, and ordinary Vitest must not be claimed to discover that proposed path.

## P7. Retain the privacy deviation accurately

The report discloses an earlier broad Desktop metadata/type/hash inventory before the later no-scan brief was read. Preserve that chronology; do not retroactively label it a breach of a not-yet-read later brief. Hashing does read file bytes, even if no visual content was opened. Do not repeat the inventory, redistribute its paths or treat inferred inventory matches as owner-confirmed case authority. Exact owner-selected files may be admitted by a later run brief. No public traces or media uploads.

## P8. Future architecture is direction, not a blanket fence

Accept observational IDs separate from authority, bounded events, terminal/drop accounting, cross-clock uncertainty, concurrent spans and explicit native/FFmpeg/WebContent coverage as the design basis. Future source fences and validation commands need their own bounded assignment. No tracing in hot pixel/centroid loops, changed production response contracts, core Tauri dependency, fabricated progress or numerical shortcuts.

## Disposition

No additional general review requested. Execute A0 build preparation, submit profiling-a0-build-submission.md and stop. Lead owns independent review, ticket/record edits and all Git mutations. No merge, release, app replacement, source instrumentation or IMP-178 integration is authorized.
