---
node_id: AI-EPIC-023
tags:
  - EPIC
  - AI
  - ux
  - polish
  - media
date_created: 2026-03-13
date_completed: 2026-03-14
kanban_status: completed
AI_IMP_spawned:
  - AI-IMP-124
  - AI-IMP-125
  - AI-IMP-126
  - AI-IMP-127
  - AI-IMP-128
  - AI-IMP-129
  - AI-IMP-130
  - AI-IMP-131
---

# AI-EPIC-023-ux-polish-and-media-ergonomics

## Problem Statement/Feature Scope

Post-EPIC-022 codebase review and parking-lot items surfaced a cluster of UX friction and media ergonomic gaps: dual video extraction pipelines that can diverge, missing tooltips on parameter controls, library sidebar open hitch, limited container format support, and minor code duplication. These are individually small but collectively degrade the polish of the media workflow.

## Proposed Solution(s)

Bundle the P2–P4 follow-up items from the EPIC-022 parking lot and codebase review into a single polish epic:

1. **Unify frame extraction** (P2) — Store extracted frame path + timestamp in `videoState` so both views share a single extraction result.
2. **Remove video timestamps + frame label option** (P3) — Simplify HomeView video display, add timestamp/frame-number label setting.
3. **Explanatory tooltips** (P3) — Native `title` attrs on parameter controls and video transport buttons.
4. **Fix sidebar open hitch** (P3) — Replace `{#if}` conditional mount with CSS visibility toggle for MediaBucket.
5. **Expand container support** (P3) — Add `.mov` and `.webm` to video file detection.
6. **Fade selection for media bucket** (P3) — Dim deselected items in the media bucket.
7. **Deduplicate ValuesView utilities** (P4) — Import shared formatters from exports module.

## Path(s) Not Taken

- Animated GIF support: Requires animation detection + video pipeline routing. Deferred to a separate future ticket.
- Full reactive-only frame extraction: Imperative approach is more predictable per EPIC-022 ADR.

## Success Metrics

- No duplicate `extractVideoFrame()` calls for same scrub position across views.
- All parameter controls and video transport buttons have descriptive `title` attributes.
- Library sidebar open/close both animate smoothly (no mount hitch).
- `.mov` and `.webm` files load correctly through the media pipeline.
- Zero duplicated utility functions between ValuesView and exports module.

## Requirements

### Functional Requirements

- [ ] FR-1: Unify video frame extraction so both views share cached results (IMP-124)
- [x] FR-2: Remove timestamp display from HomeView video panel, add frame label setting (IMP-125)
- [x] FR-3: Add `title` tooltips to all parameter controls and video transport buttons (IMP-126)
- [x] FR-4: Fix library sidebar open hitch by keeping MediaBucket mounted (IMP-127)
- [x] FR-5: Support `.mov` and `.webm` in file dialogs and video detection (IMP-128)
- [x] FR-6: Fade deselected items in media bucket (IMP-129)
- [x] FR-7: Deduplicate ValuesView utility functions (IMP-130)

### Non-Functional Requirements

- Each IMP must pass `npm run check && npm run lint` and `cargo clippy` before completion.
- No user-visible regressions — each change is independently testable.
- P3 items are parallelizable with no inter-dependencies.

## Implementation Breakdown

**Architectural (do first)**
- IMP-124: Unify video frame extraction pipeline

**UX polish (parallel, no dependencies)**
- IMP-125: Remove video timestamps + frame label option
- IMP-126: Explanatory tooltips for controls
- IMP-127: Fix library sidebar open hitch
- IMP-128: Expand video container support (.mov, .webm)
- IMP-129: Fade selection for media bucket items

**Cleanup (low priority)**
- IMP-130: Deduplicate ValuesView utility functions
