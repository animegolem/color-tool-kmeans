# AI-EPIC
---
node_id: AI-EPIC-013
tags:
  - EPIC
  - AI
  - exports
  - multi-image
date_created: 2026-01-22
date_completed:
kanban-status: planned
depends_on:
  - AI-EPIC-011
AI_IMP_spawned:
---

# AI-EPIC-013-export-redesign

## Problem Statement/Feature Scope
Current exports are individual artifacts (PNG chart, SVG chart, CSV data). Users need composite exports combining original image with analysis graphs, and multi-image grid exports for comparing sets of images.

## Proposed Solution(s)
- Composite export: original image + analysis graphs in single PNG
- Multi-image grid export: tile all loaded images (up to 16) with their data
- Layout TBD (awaiting mockup)

## Path(s) Not Taken
- PDF export (complexity, offline font embedding challenges)
- Video export for image sequences (out of scope)

## Success Metrics
1. Single-click export produces shareable composite image
2. Multi-image export tiles images in readable grid (up to 4x4)
3. All graph types exportable in composite

## Requirements

### Functional Requirements
- [ ] FR-1: Composite export combines image + graphs (layout per mockup)
- [ ] FR-2: Multi-image export tiles up to 16 images in grid
- [ ] FR-3: All graph types exportable (polar, hue-lightness, histogram)
- [ ] FR-4: Export includes palette strip
- [ ] FR-5: Configurable export resolution

### Non-Functional Requirements
- [ ] NFR-1: Export latency reasonable (<3s for 16-image grid)
- [ ] NFR-2: Embedded fonts (Fira Sans) for any text

## Implementation Breakdown

### Planned Tickets
(TBD - awaiting mockup for layout decisions)

### Completed Tickets

## Notes
Layout options to explore:
- Horizontal strip: image | graphs stacked
- 2x2 grid: image, polar, hue-lightness, histogram
- User will provide mockup before implementation
