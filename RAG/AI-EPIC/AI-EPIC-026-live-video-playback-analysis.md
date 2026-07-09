---
node_id: AI-EPIC-026
tags:
  - EPIC
  - AI
  - feature
  - video
  - performance
date_created: 2026-07-09
date_completed:
kanban_status: planned
AI_IMP_spawned:
---

# AI-EPIC-026-live-video-playback-analysis

## Problem Statement/Feature Scope

Video analysis today is frame-at-a-time: scrub to a frame, wait for extraction + analysis, look at the charts. The compelling use for our animation-focused audience is different — drop in a clip (e.g. a downloaded Sakugabooru cut) and *play* it while the color analysis runs live: histogram, polar chart, and palette ledger animating in sync with the footage at the clip's native rate (24 fps target; we explicitly do not chase 60). That turns the tool from a still-frame inspector into an instrument for studying color scripting across a cut.

**Gate cleared 2026-07-09: EPIC-025 delivered a GO** (see ADR-003). Measured on real anime clips: every k ∈ {64,128,300} sustains >24 fps with a warm-started, fixed-4-iteration budget; quality within 1.5–6% of converged. No k ceiling needed.

## Proposed Solution(s)

A **live mode** for loaded videos, built on the architecture ADR-003 fixes:

1. **Rust live-analysis loop** — a dedicated task owning a persistent ffmpeg rawvideo stream at 320×180 (`flags=area`); per frame: LUT + rayon OKLab conversion → k-means warm-started from the previous frame's centroids with a **fixed 4-iteration budget (tol=0)**, not convergence-to-tol → emit a cluster-result event. Single-stage (no pipelining — measured unnecessary). Scene cuts detected via inertia jump get extra iterations that frame. Start/stop/seek/params-change commands from the frontend; loop lifecycle tied to the loaded clip.
2. **Event-driven frontend** — playback UI subscribes to analysis events instead of request/response `analyze_image` per frame. Charts update per event; warm-start continuity means clusters are temporally stable (no flicker/reshuffle between frames).
3. **Transport integration** — live mode rides the existing VideoPanel transport (play/pause/scrub); scrubbing while paused keeps today's single-frame path. Parameter changes (k, quality) re-seed the loop.
4. **Degradation policy** — if a frame misses budget (high k, large clip), drop analysis frames rather than stall playback; surface effective analysis fps quietly in the metrics line.
5. **Analysis-vs-display split** — display continues at native resolution; analysis consumes the ~320×180 stream. The two never contend.

Exact k/quality ceilings for live mode come from EPIC-025's measurements.

## Path(s) Not Taken

- **In-app URL fetching (paste a Sakugabooru link)** — the app is offline-first ("no network requests at runtime"); ingestion stays file-based (drag-drop / browse a downloaded clip). A URL-fetch affordance would be its own scoped decision, not smuggled in here.
- **60 fps** — animation is largely on 2s/3s and held cels; 24 fps is the honest target and warm start exploits exactly that.
- **Live value/notan analysis** — Colors-view clustering only in v1 of live mode; ValuesView live analysis is a possible follow-on.
- **Recording/exporting the live analysis as video** — out of scope; exports remain still-based.

## Success Metrics

- Load a real 24 fps animation clip, press play: charts + ledger update live at ≥24 analysis fps at the k/quality ceiling established by EPIC-025 (target k≤128), no dropped *display* frames on the M1.
- Cluster identity is temporally stable across held cels (no visible chart reshuffle between near-identical frames).
- Pause/scrub/param-change round-trips back into live playback without stale results or orphaned ffmpeg processes.
- Stills path and existing video scrubbing behavior unchanged (regression: existing vitest + manual smoke).

## Requirements

### Functional Requirements

_Provisional — to be firmed against EPIC-025 findings before IMPs are cut._

- [ ] FR-1: Rust live-analysis loop (persistent rawvideo stream → convert → warm-started k-means → Tauri event per frame) with start/stop/seek/reconfigure commands.
- [ ] FR-2: Frame-drop policy under budget pressure; effective analysis fps reported in the result event.
- [ ] FR-3: Frontend live-mode state + event subscription wired into VideoPanel transport (play = live analysis; pause = existing single-frame path).
- [ ] FR-4: Charts (histogram, polar, hue×lightness) and palette ledger render from streamed results with stable cluster ordering.
- [ ] FR-5: Parameter changes during playback re-seed the loop without restart glitches.
- [ ] FR-6: Lifecycle hygiene — loop and ffmpeg child torn down on clip switch, view change, window close.

### Non-Functional Requirements

- 24 fps sustained on M1 at the spike-validated ceiling; playback never stalls on analysis.
- Deterministic stills behavior untouched; live mode is additive.
- No runtime network access; ingestion remains local files.
- Gates: `npm run check && npm run lint`, vitest, `cargo clippy`/`fmt`, manual smoke on macOS.

## Implementation Breakdown

_Blocked on EPIC-025 go/no-go. To be filled when IMPs are cut._
