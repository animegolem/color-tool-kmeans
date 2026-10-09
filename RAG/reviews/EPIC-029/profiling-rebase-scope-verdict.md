# IMP-202 profiling: the scope ruling and the next bounded assignment (Review Lead, 2026-10-09)

**Asked by:** Sol (Code Lead, w7:p2), after the reboot. Sol relays that the owner reviewed the paused IMP-202 objective today and said
that if relevant work remains, it can start. Sol's read-only audit: IMP-202 is in progress with all seven aggregate checklist items open.
B20 is accepted as diagnostic only (ACQUISITION_NOT_VERIFIED), with no eligible benchmark import.

**The question:** should profiling keep the historical matrix (known-good, Wave 03, without IMP-178, with IMP-178) exactly, or rebase
acquisition and instrumentation on the current deliverable while keeping the historical evidence?

## Ruling: rebase on the current deliverable, keep the §10 method whole, and keep one historical arm

1. **The method doesn't change.** PROJECT-RECORD §10 binds in full: provenance binding, staged real-app cases, explicit cold and warm,
   randomized order with a recorded seed, quiet versus owner-coordinated active-ML strata, p50/p95 with counts and uncertainty, no
   discarded stalls, disabled-overhead proof, criteria defined before confirmation, and no invented internal spans.
2. **The matrix is rebased to two arms:**
   - **Arm A: the current deliverable.** That is `main` as identified by its commit hash, the Tauri and Svelte app that rev0.98 makes
     the shared web app's base. It replaces "Wave 03 without IMP-178": main descends from that arm with the later correctness waves
     and still without IMP-178, so it answers the same question for what actually ships.
   - **Arm B: the identified known-good prior release,** as the regression baseline for the owner's observation (about 20–60 ms
     remembered, against seconds in the Wave 03 debug runs). It enters as an immutable binary for end-to-end observations only, per
     §10.1. A recompiled historical tree would be a separately identified arm, and isn't authorized now.
   - **IMP-178 stays out of IMP-202's scope,** as §10.1 and the ticket already say. Its comparison arm needs its own authorization.
3. **The historical evidence stays as it is.** B11–B20 and the owner's Wave 03 debug observations are preserved and cited. B20 remains
   diagnostic only, ACQUISITION_NOT_VERIFIED, with no benchmark import.
4. **Instrument for the redesign.** The redesign (one web application serving both browser and desktop) is held for the owner's
   conversation with Astra and Sol. Spans therefore go where they will survive it, first of all color-core's stages, the IPC boundary,
   store publication and presentation. The report marks which proposed spans survive the redesign and which belong only to the
   current shell.
5. **Pin the toolchain for every build arm.** CI's unpinned stable toolchain went red on a Clippy change on 2026-10-02 (fixed in
   e11320f, verified on Rust 1.99). A profiling build that floats on stable isn't reproducible.

## The next bounded assignment (Sol): one read-only scope report

**Authority:** read only. No source edits, builds, captures, runs or Git changes. Write one new report and the ticket evidence lines.

**Write `RAG/reviews/EPIC-029/profiling-rebase-scope-report.md` with:**
1. **The two-arm matrix with provenance.**
   - Arm A's identity.
   - Arm B's exact identification: tag or binary, hashes, where it's preserved and what is missing.
   - The pinned toolchain and lock for any future build.
2. **The case list** (still import; video initial, frame step and seek; a representative parameter change; navigation and switching),
   each mapped to the §10.3 stages on Arm A. For each span, mark whether it EXISTS or NEEDS instrumentation, and whether it SURVIVES
   the redesign.
3. **The experimental design.**
   - Cold and warm definitions.
   - Repeats per case, and the randomization scheme with its seed.
   - The quiet and active-ML strata.
   - The exact request to the owner for the varied Desktop set: stable IDs, private paths and nothing committed.
4. **Metrics and criteria, before any data.**
   - p50/p95 with estimator and uncertainty.
   - The parity and disabled-overhead controls.
   - A threshold proposal, marked exploratory and kept separate from a later confirmation, for the owner to adopt or not.
5. **The owner's time,** stated exactly: which sessions, how long, and what they do.
6. **What you'd cut** if the owner's time is scarce, in order.

**Then:** the lead reviews the report and issues Stage A, the matched quiet optimized-build sanity comparison of §10.1, as its own
fence.

— Genga (原画), Review Lead (PROJECT-RECORD §2.1)
