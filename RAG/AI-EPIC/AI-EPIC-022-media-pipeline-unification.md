---
node_id: AI-EPIC-022
tags:
  - EPIC
  - AI
  - tech-debt
  - refactor
date_created: 2026-02-25
date_completed:
kanban_status: backlog
AI_IMP_spawned:
---

# AI-EPIC-022-media-pipeline-unification

## Problem Statement/Feature Scope

Media ingestion (upload, drag-drop, clipboard, library-rail click) and analysis triggering are implemented independently across App.svelte, HomeView, ValuesView, and ExportsView. Each path handles file type detection, video probing, entry dedup, store mutations, and analysis kickoff with subtly different logic. This divergence is the root cause of repeated regressions when adding video support — a fix in one view's pipeline doesn't propagate to others, and competing reactive/imperative trigger paths create hard-to-diagnose races.

## Proposed Solution(s)

Consolidate media handling into shared services with view-specific rendering callbacks:

1. **Unified ingestion service** — One `createMediaIngestion()` factory used by all views. Accepts mode flags (`allowVideo`, `activateFirst`, `openDrawer`) rather than reimplementing per-view. Handles: file dialog, drag-drop, clipboard paste, library-rail selection, video detection, and entry creation.

2. **Single analysis trigger model per view** — Each view picks one trigger strategy (imperative or reactive), not both. HomeView uses imperative scheduling via `scheduleAnalysisWith`. ValuesView uses imperative via `ensureAnalysis` in `onFrameExtracted`. Remove the overlapping `$effect` fallback for video frames.

3. **URL revision helper** — A shared `assetUrl(path)` utility wrapping `convertFileSrc` with cache-busting for generated artifacts (neutral, preview, bucket-map, poster/thumbs). Prevents browser caching of overwritten files at stable paths.

4. **Unified event-channel consumers** — `pendingVideoSwitch` and `mediaLoadRequested` are currently handled with near-duplicate subscribers in Home and Values. Extract a shared handler with view-specific callbacks for rendering concerns only.

5. **Shared utility dedup** — Extract `maxDimensionForQuality` and `formatTime` into `utils/` to eliminate copy-paste instances.

## Path(s) Not Taken

- Full reactive-only architecture (removing all imperative analysis calls): Svelte 5 store subscription timing makes purely reactive chains unreliable for multi-step async workflows. Imperative calls after async operations are more predictable.
- Merging Home and Values analysis into one runner: The two views have fundamentally different backends (color k-means vs value/lightness k-means). Shared scheduling policy makes sense; shared runners do not.

## Success Metrics

- Zero duplicate ingestion code paths: one `createMediaIngestion()` factory, used by all views.
- Each view has exactly one analysis trigger path per input type (image vs video frame).
- No browser-cache staleness for any generated artifact URL.
- Regression test coverage: upload parity, video switch parity, single analysis invoke per scrub.

## Requirements

### Functional Requirements

- [ ] FR-1: Extract `createMediaIngestion()` from `file-ingestion.svelte.ts` + `ValuesView.svelte` upload logic into a shared factory in `lib/services/`.
- [ ] FR-2: Create `assetUrl(path: string): string` utility in `lib/utils/` that wraps `convertFileSrc` with `?t=` cache-busting. Use in ValuesView, HomeView poster URLs, and any future artifact display.
- [ ] FR-3: Remove `$effect`-based analysis trigger for video frames in ValuesView (keep imperative `ensureAnalysis` in `onFrameExtracted` only).
- [ ] FR-4: Unify `pendingVideoSwitch` and `mediaLoadRequested` subscribers into a shared handler module consumed by both Home and Values.
- [ ] FR-5: Extract `maxDimensionForQuality` to `lib/utils/quality.ts`.
- [ ] FR-6: Audit and remove dead code paths identified during review (confirm HomeView scrub handlers are still connected before removing).

### Non-Functional Requirements

- Each refactor phase must pass `npm run check && npm run lint` and `cargo clippy` before merge.
- No user-visible behavior changes — refactor only, not feature work.
- Each FR should be a separate IMP ticket and PR to limit blast radius.

## Implementation Breakdown

IMP tickets to be created when this epic moves to `in-progress`. Suggested phasing:

**Phase 1 — Low-risk extractions**
- `assetUrl` utility (FR-2)
- `maxDimensionForQuality` extraction (FR-5)
- Remove `$effect` video overlap (FR-3)

**Phase 2 — Event channel unification**
- Shared `pendingVideoSwitch` / `mediaLoadRequested` handler (FR-4)

**Phase 3 — Ingestion consolidation**
- `createMediaIngestion()` shared factory (FR-1)
- Dead code audit (FR-6)
