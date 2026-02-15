# AI-EPIC
---
node_id: AI-EPIC-011
tags:
  - EPIC
  - AI
  - analysis
  - multi-image
date_created: 2026-01-22
date_completed:
kanban_status: deferred
depends_on:
  - AI-EPIC-010
AI_IMP_spawned:
---

# AI-EPIC-011-aggregate-analysis

## Problem Statement/Feature Scope
When analyzing color across multiple reference images (e.g., frames from an episode, scene references), users need to see common palette threads. Currently each image is analyzed independently with no cross-image view.

## Proposed Solution(s)
- Add "Multi-image" tab/view that appears when 2+ images loaded
- "Sample of samples" meta-clustering: run k-means on combined centroids from all loaded images
- Combined visualization showing cross-image palette relationships
- Supports use cases like analyzing color range across episode or scene

## Path(s) Not Taken
- Merging raw pixels from all images (too expensive, loses per-image context)
- Simple centroid concatenation without re-clustering (doesn't find common threads)

## Success Metrics
1. Multi-image tab appears automatically when 2+ images loaded
2. Aggregate analysis reveals common colors across image set
3. Visualization clearly shows which colors span multiple images

## Requirements

### Functional Requirements
- [ ] FR-1: "Multi-image" tab appears when 2+ images loaded
- [ ] FR-2: Aggregate analysis runs k-means on combined centroids
- [ ] FR-3: Visualization shows cross-image color relationships
- [ ] FR-4: User can configure target K for meta-clustering
- [ ] FR-5: Shows which source images contribute to each meta-cluster

### Non-Functional Requirements
- [ ] NFR-1: Aggregate analysis completes quickly (centroids only, not raw pixels)
- [ ] NFR-2: Clear visual distinction from per-image analysis

## Implementation Breakdown

### Planned Tickets
(TBD - will spawn when EPIC-010 complete)

### Completed Tickets

## Notes
Concept:
1. Each image has individual k-means (e.g., K=120 clusters each)
2. Aggregate view takes all centroids and runs meta-clustering
3. Shows common palette threads across the image set

May need Rust backend extension for meta-clustering or can run on frontend with centroid data.
