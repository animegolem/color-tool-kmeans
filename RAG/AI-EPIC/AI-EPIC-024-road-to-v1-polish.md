---
node_id: AI-EPIC-024
tags:
  - EPIC
  - AI
  - polish
  - batch
  - ux
date_created: 2026-03-19
date_completed:
kanban_status: planned
AI_IMP_spawned:
  - AI-IMP-144
  - AI-IMP-145
  - AI-IMP-146
  - AI-IMP-147
  - AI-IMP-148
  - AI-IMP-149
  - AI-IMP-150
  - AI-IMP-151
  - AI-IMP-152
  - AI-IMP-153
  - AI-IMP-154
  - AI-IMP-155
  - AI-IMP-156
---

# AI-EPIC-024-road-to-v1-polish

## Problem Statement/Feature Scope

The core batch analysis, media bucket, and multi-view architecture are functional but lack the polish expected for a v1 release. Users encounter visual inconsistencies (button styling, fading behavior), missing interaction patterns (drag-and-drop on batch, context menu exports), performance gaps (sidebar image caching, zoom scaling), and incomplete wiring (batch settings persistence, video frame capture). This epic consolidates the remaining UX, performance, and feature completeness work needed before v1.

## Proposed Solution(s)

A series of targeted IMP tickets addressing: analysis validation (hue x lightness frequency), video frame capture UX, settings review, drag-and-drop unification, media bucket performance, batch pin management, session persistence, export context menus, zoom behavior, and visual consistency fixes. Each ticket is independently shippable and ordered by confidence/complexity.

## Path(s) Not Taken

- Values-in-batch (tabbed batch analysis for value/color modes) — deferred to separate planning.
- Media bucket multi-select (shift-click to select ranges for bulk operations) — uncertain scope, not ticketed.
- Resizable media bucket sidebar with dynamic column reflow — uncertain scope, not ticketed.
- Reorganizing clear/pin buttons in media bucket — uncertain scope, not ticketed.

## Success Metrics

- All 13 IMP tickets completed and verified.
- No visual inconsistencies between batch, home, values, and settings views.
- Batch view settings persist across app restarts.
- Export context menus functional on all chart types.
- Zero regressions on existing analysis pipelines.

## Requirements

### Functional Requirements

- [ ] FR-1: Hue x lightness frequency sizing validated or chart removed if non-functional.
- [ ] FR-2: Video frames can be captured to media bucket via overlay interaction.
- [ ] FR-3: All settings labels reviewed and updated for multi-view context.
- [ ] FR-4: Video frame click guarded during processing with visual feedback.
- [ ] FR-5: Drag-and-drop pathways evaluated and unified where beneficial.
- [ ] FR-6: Drag-and-drop on batch view loads and pins dropped files.
- [ ] FR-7: Media bucket sidebar images cached to prevent repeated loading.
- [ ] FR-8: Batch pin thumbnails support click-to-expand and dismiss.
- [ ] FR-9: Batch analysis parameters persist between sessions.
- [ ] FR-10: Right-click context menus on graphs for direct PNG/SVG export.
- [ ] FR-11: OS zoom scales only center content, not navigation/sidebars.
- [ ] FR-12: Media bucket thumbnails properly faded on settings tab.
- [ ] FR-13: Clear pins button styled consistently with app design language.

### Non-Functional Requirements

- No new runtime dependencies (offline-first constraint).
- All changes pass existing test suites and pre-commit hooks.
- No file exceeds 700 LOC without documented justification.

## Implementation Breakdown

| Status | Ticket | Title |
|--------|--------|-------|
| planned | AI-IMP-144 | Validate hue x lightness frequency sizing |
| planned | AI-IMP-145 | Video frame snapshot to media bucket |
| planned | AI-IMP-146 | Review settings phrasings for new views |
| planned | AI-IMP-147 | Guard video frame click during processing |
| planned | AI-IMP-148 | Evaluate and unify drag-and-drop pathways |
| planned | AI-IMP-149 | Drag-and-drop on batch view (load + pin) |
| planned | AI-IMP-150 | Media bucket sidebar image caching |
| planned | AI-IMP-151 | Batch pin management UX |
| planned | AI-IMP-152 | Persist batch settings between sessions |
| planned | AI-IMP-153 | Direct export context menus for graphs |
| planned | AI-IMP-154 | OS zoom content-only scaling |
| planned | AI-IMP-155 | Settings tab media bucket fading |
| planned | AI-IMP-156 | Clear pins button styling alignment |
