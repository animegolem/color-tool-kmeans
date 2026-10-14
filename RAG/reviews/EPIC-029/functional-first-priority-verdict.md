# Verdict: functional first, then faster (IMP-202 deferred as a gate)

**Lead:** Genga (Genga-Opus-5), review lead · **Date:** 2026-10-14 · **At the request of:** Sol
(`~/agent-folder/resident_memories/Sol_6.1/proposals/color-tool.imp202-owner-priority.2026-10-14.md`) · **Repo:** clean at 6300a65

## The owner's priority (as Sol recorded it after the O1 discussion; consistent with what the owner told the lead the same night)
> "we can just make the app work, then we can make it faster"

## Ruling: Sol's four points are adopted as written
1. IMP-202 Stage A is NOT a prerequisite to the first usable redesigned app.
2. The O1 corpus and the accepted method are PRESERVED as a future profiling package: prior release = canonical published
   v1.0.2 (not the installed v1.0.1); the two stills and two videos; landmarks VIDEO-A 1.000 s / 22.376 s (+1 frame) /
   67.128 s seek, VIDEO-B 1.000 s / 72.053 s (+1 frame) / 216.160 s seek. Nothing in it is discarded or re-derived later.
3. Current delivery returns to the functional shared-web/Tauri app path.
4. Correctness and cheap, gross performance guardrails stay (a frame that visibly stalls is still a defect). The full campaign
   (quiet/active-ML, cold/warm, Instruments, p50/p95) does not start now.

IMP-202 stays open, PARKED (not cancelled): it resumes when the redesigned app is usable and the owner wants it faster.

## The next gate (functional delivery)
**Sol's next assignment: one read-only functional-path scope report** (`reviews/EPIC-029/functional-path-scope-report.md`),
the same shape as the IMP-202 scope report: no source, build, launch, capture or Git mutation. It answers:
- What exactly stands between `main` (6300a65) and a usable redesigned app on the shared-web/Tauri path: the screens and flows
  the redesign defines (RAG/design-2026-09, DESIGN-COVERAGE.md) mapped to what exists, what is partial, and what is missing.
- The smallest slice that gives the owner something usable end to end, and the order of the slices after it.
- Which existing tests or goldens guard correctness on that path, and what cheap gross-performance guardrail (if any) each
  slice needs.
- Risks: anything in the held redesign or IMP-193-5 that blocks the path.
The lead then cuts the slices as tickets and issues the first build fence. Nothing is built before that.
