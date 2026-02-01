# AI-EPIC
---
node_id: AI-EPIC-018
tags:
  - EPIC
  - AI
  - testing
  - color-science
  - oklab
  - hsv
  - kmeans
date_created: 2026-02-01
date_completed:
kanban_status: planned
AI_IMP_spawned: AI-IMP-090, AI-IMP-091, AI-IMP-092
---

# AI-EPIC-018-color-math-test-harness

## Problem Statement/Feature Scope
Current color-space math, polar projections, and k-means outputs are validated mostly by visual inspection, which is subjective and prone to regressions (e.g., hue gaps, gamut boundary drift, or centroid collapse). We need deterministic, automated tests that catch math errors and front/back-end mismatches before UI review.

## Proposed Solution(s)
Introduce a tiered test harness: (1) property-based round-trip tests for critical conversions, (2) gold-standard fixtures generated from an external reference for OKLab/OKLCH/HSV values, (3) data snapshot tests for k-means outputs on fixed images, and (4) gamut boundary integrity checks to ensure valid sRGB points lie inside the drawn boundary. This shifts validation from “looks right” to measurable invariants.

## Path(s) Not Taken
- Only adding UI snapshot tests (too brittle and not math-focused).
- Relying on manual visual validation alone.

## Success Metrics
1. CI fails if any conversion round-trip exceeds tolerance for 10k randomized samples.
2. Gold-standard fixture tests pass across all supported platforms.
3. K-means snapshots for reference images are stable across builds (seeded).
4. Random sRGB samples never fall outside the computed gamut boundary.

## Requirements

### Functional Requirements
- [ ] FR-1: Add property-based round-trip tests for RGB↔OKLab and RGB↔HSV/OKHSV as defined.
- [ ] FR-2: Add gold-standard fixtures (JSON) generated from an external reference and validate conversion outputs.
- [ ] FR-3: Add deterministic k-means snapshot tests on reference images with fixed seed/config.
- [ ] FR-4: Add gamut boundary integrity tests (valid sRGB samples must lie inside the boundary).

### Non-Functional Requirements
- [ ] NFR-1: Tests must run offline with deterministic outputs.
- [ ] NFR-2: Total CI runtime impact < 3 minutes.
- [ ] NFR-3: Tolerances must be documented and consistent across Rust/TS.

## Implementation Breakdown
- AI-IMP-090: Round-trip property tests (Rust + TS parity)
- AI-IMP-091: Gold-standard fixtures and verification tests
- AI-IMP-092: K-means snapshots + gamut boundary integrity tests
