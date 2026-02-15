# AI-EPIC
---
node_id: AI-EPIC-013
tags:
  - EPIC
  - AI
  - exports
  - builder
  - compositor
date_created: 2026-01-22
date_completed:
kanban_status: planned
depends_on:
AI_IMP_spawned:
---

# AI-EPIC-013-export-redesign

## Problem Statement/Feature Scope
The Exports view offers only individual artifact downloads (single PNG, SVG, or CSV). Users need a builder-style interface that lets them select which charts and data to include, then compose them into shareable composite images. Coverage gaps exist: histogram and hue-lightness charts are generated but not wired into exports. Artist palette formats (.ase) are missing, and value analysis has no dedicated notan study export.

## Proposed Solution(s)
- Builder UI with checkbox sections (Colors, Values, Data) where users select items for inclusion
- Compositor engine that arranges selected tiles into an adaptive grid and renders to PNG
- Per-item download icons for quick single-chart exports alongside composite export buttons
- Artist palette export in Adobe Swatch Exchange (.ase) format for Photoshop and Clip Studio Pro
- Notan study export: 2x2 grid of value levels 2/3/4/5 with tone bars and percentages
- PNG scale slider for configurable output resolution

## Path(s) Not Taken
- PDF export (complexity, offline font embedding challenges)
- Multi-image grid export (deferred with EPIC-011)
- Video export for image sequences (out of scope)
- Procreate .swatches format (JSON-in-zip, separate future work)

## Success Metrics
1. Builder UI allows selecting any combination of charts and composing into a single PNG
2. All chart types (polar, histogram, hue-lightness) are exportable individually and in composite
3. .ase palette files import correctly in Photoshop and Clip Studio Pro
4. Notan study export produces a clear 2x2 grid of simplified tone levels

## Requirements

### Functional Requirements
- [ ] FR-1: Builder UI with checkbox sections (Colors, Values, Data) for selecting export inclusions
- [ ] FR-2: Composite export composes selected items into single PNG with adaptive grid layout
- [ ] FR-3: All color charts exportable (histogram, polar, hue-lightness) individually and in composite
- [ ] FR-4: Artist palette export in .ase format, importable by Photoshop and Clip Studio Pro
- [ ] FR-5: Values composite includes original + neutral + range finder + histogram + notan study
- [ ] FR-6: Notan study export as 2x2 grid of levels 2/3/4/5 with tone bars and percentages
- [ ] FR-7: Per-item download icons for quick single-chart exports
- [ ] FR-8: Configurable PNG scale (existing)
- [ ] FR-9 (stretch): Native context menus on chart elements for direct save

### Non-Functional Requirements
- [ ] NFR-1: Export latency <3s for single-image composites
- [ ] NFR-2: Embedded fonts (Fira Sans) in SVG exports
- [ ] NFR-3: Deterministic output (same inputs produce identical bytes)

## Implementation Breakdown

### Planned Tickets
- AI-IMP-066: Exports deterministic wiring and Tauri FS (foundational)
- AI-IMP-105: ExportsView Builder + Compositor (main rewrite)
- AI-IMP-106: Artist Palette Export (.ase)
- AI-IMP-107: Values Notan Study Export
- AI-IMP-108: Context Menu Infrastructure (stretch)

### Completed Tickets

## Notes
- IMP-068 (accessibility) moved to AI-EPIC-021 as it is cross-cutting, not export-specific
- Multi-image exports deferred with EPIC-011; this epic focuses on single-image workflows
- Compositor pattern: array of tiles (SVG strings or image data URLs) → adaptive grid → single SVG → PNG
