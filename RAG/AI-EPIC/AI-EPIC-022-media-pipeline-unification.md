---
node_id: AI-EPIC-022
tags:
  - EPIC
  - AI
  - tech-debt
  - refactor
date_created: 2026-02-25
date_completed: 2026-03-13
kanban_status: completed
AI_IMP_spawned:
  - AI-IMP-113
  - AI-IMP-114
  - AI-IMP-115
  - AI-IMP-116
  - AI-IMP-117
  - AI-IMP-118
  - AI-IMP-119
  - AI-IMP-120
---

# AI-EPIC-022-media-pipeline-unification

## Problem Statement/Feature Scope

Media ingestion (upload, drag-drop, clipboard, library-rail click) and analysis triggering are implemented independently across App.svelte, HomeView, ValuesView, and ExportsView. Each path handles file type detection, video probing, entry dedup, store mutations, and analysis kickoff with subtly different logic. This divergence is the root cause of repeated regressions when adding video support — a fix in one view's pipeline doesn't propagate to others, and competing reactive/imperative trigger paths create hard-to-diagnose races.

Additionally, `ui.ts` is a 646-LOC monolith mixing 8 logical groups, and deprecated CLI binaries (bench_runner.rs, compute_cli.rs) total 2,157 LOC of dead code.

## Proposed Solution(s)

Consolidate media handling into shared services with view-specific rendering callbacks:

1. **Unified ingestion service** — Shared `ingestFileAsEntry()` factory in `lib/services/media-ingestion.ts` used by all views. **(Done — HomeView, ValuesView, and App.svelte all rewired.)**

2. **Single analysis trigger model per view** — Each view picks one trigger strategy (imperative or reactive), not both. HomeView uses imperative scheduling via `scheduleAnalysisWith`. ValuesView uses imperative via `ensureAnalysis` in `onFrameExtracted`. Review the overlapping `$effect` fallback for video frames.

3. **URL revision helper** — A shared `assetUrl(path)` utility wrapping `convertFileSrc` with cache-busting for generated artifacts. 9 inline instances across 3 files.

4. **Unified event-channel consumers** — `pendingVideoSwitch` and `mediaLoadRequested` are currently handled with near-duplicate subscribers in Home and Values. Extract shared factories.

5. **Shared utility dedup** — `maxDimensionForQuality` **(done)**, `formatTime` (2 copies), `buildPreviewUrl` **(done)**.

6. **Global state abstraction** — `__ACTIVE_IMAGE_PATH__` is mutated 13 times (9 writes + 4 deletes) across 6 files with inconsistent patterns. Centralize into a service.

7. **Store modularization** — Split `ui.ts` (646 LOC) into 8 focused modules with barrel re-export for backward compatibility.

8. **Dead code removal** — Delete deprecated bench_runner.rs (1,943 LOC) and compute_cli.rs (214 LOC), clean Cargo.toml and CLAUDE.md.

9. **Data flow documentation** — Create `RAG/DATA-FLOW.md` mapping all ingestion, analysis, and video state flows to prevent future drift.

## Path(s) Not Taken

- Full reactive-only architecture (removing all imperative analysis calls): Svelte 5 store subscription timing makes purely reactive chains unreliable for multi-step async workflows. Imperative calls after async operations are more predictable.
- Merging Home and Values analysis into one runner: The two views have fundamentally different backends (color k-means vs value/lightness k-means). Shared scheduling policy makes sense; shared runners do not.
- Updating all import paths during store split: Barrel re-export preserves backward compat with zero consumer changes.

## Success Metrics

- Zero duplicate ingestion code paths: `ingestFileAsEntry()` used by all 3 entry points (Home, Values, App).
- Each view has exactly one analysis trigger path per input type (image vs video frame).
- No browser-cache staleness for any generated artifact URL (all use `assetUrl()`).
- `ui.ts` reduced to a barrel re-export; each store module under 200 LOC.
- INDEX.md size watch: bench_runner.rs removed from list, ValuesView below 800 LOC.

## Requirements

### Functional Requirements

- [x] FR-1: Extract `ingestFileAsEntry()` + `buildPreviewUrl()` + `maxDimensionForQuality()` into `lib/services/media-ingestion.ts`. Rewire HomeView and ValuesView.
- [x] FR-2: Create `assetUrl(path)` utility in `lib/utils/asset-url.ts`. Replace 9 inline cache-bust patterns. **(IMP-114)**
- [x] FR-3: Review `$effect`-based analysis trigger for video frames in ValuesView. **Reviewed: the `$effect` at line 312 IS needed — it handles initial image analysis for non-video files and correctly skips video frames (handled by `onFrameExtracted`).**
- [x] FR-4: Unify `pendingVideoSwitch` and `mediaLoadRequested` subscribers into shared factory functions. **(IMP-119)**
- [x] FR-5: Extract `maxDimensionForQuality` to shared service. **(Done — in media-ingestion.ts)**
- [x] FR-6: Rewire App.svelte `globalChooseMedia()` to use `ingestFileAsEntry()`. **(IMP-116)**
- [x] FR-7: Split `ui.ts` into 8 focused store modules with barrel re-export. **(IMP-120)**
- [x] FR-8: Centralize `__ACTIVE_IMAGE_PATH__` management into `lib/services/active-image.ts`. **(IMP-118)**
- [x] FR-9: Delete deprecated bench_runner.rs, compute_cli.rs, bench-crate feature. Clean CLAUDE.md stale refs. **(IMP-113)**
- [x] FR-10: Create `RAG/DATA-FLOW.md` documenting all data flows. **(Done)**
- [x] FR-11: Extract `formatTime()` to `lib/utils/time.ts`. **(IMP-115)**
- [x] FR-12: Extract drag-drop payload parsing to `lib/services/drag-drop.ts`. **(IMP-117)**

### Non-Functional Requirements

- Each refactor phase must pass `npm run check && npm run lint` and `cargo clippy` before merge.
- No user-visible behavior changes — refactor only, not feature work.
- Each FR should be a separate IMP ticket and PR to limit blast radius.

## Implementation Breakdown

**Phase 0 — Documentation & dead code (done first)**
- EPIC-022 update + DATA-FLOW.md (FR-10)
- Dead code removal (FR-9)

**Phase 1 — Low-risk utility extractions**
- `assetUrl` utility (FR-2) → IMP-114
- `formatTime` dedup (FR-11) → IMP-115
- App.svelte ingestion consolidation (FR-6) → IMP-116

**Phase 2 — Service extractions**
- Drag-drop unification (FR-12) → IMP-117
- `__ACTIVE_IMAGE_PATH__` abstraction (FR-8) → IMP-118
- Event channel handlers (FR-4) → IMP-119

**Phase 3 — Store modularization (do last)**
- `ui.ts` store split (FR-7) → IMP-120
