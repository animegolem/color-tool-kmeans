---
node_id: AI-IMP-070
tags:
  - Implementation
  - oklab
  - color
kanban_status: completed
depends_on:
  - AI-EPIC-008
confidence_score: 0.7
date_created: 2026-01-19
date_completed:
---

# AI-IMP-070-oklab-oklch-conversions-and-gamut-mapping

## Summary of Issue #1
We need OKLab/OKLCH conversions and a perceptually stable gamut mapping for centroid display colors. Outcome: new conversion helpers in the Rust color module and chroma-compression that keeps L and h fixed while reducing C until in-gamut.

### Out of Scope 
- UI/bridge updates and rendering changes.
- Sampling strategy or k-means logic changes.

### Design/Approach  
- Implement sRGB <-> linear RGB <-> OKLab conversions in `color.rs` (D65).
- Add OKLab <-> OKLCH helpers (h in degrees, C in OKLab units, L in 0..1 or 0..100 but consistent).
- Add `oklab_to_srgb8_gamut_mapped(lab)` that preserves L and h and reduces C via binary search (or stepped) until RGB is in-gamut.
- Provide a fast `is_in_gamut_rgb([f32; 3])` check.
- Add unit tests for known OKLab reference values and gamut mapping behavior.

### Files to Touch
- `tauri-app/src-tauri/src/color.rs`

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Add OKLab conversion helpers (sRGB <-> OKLab) with clear units.
- [x] Add OKLCH helpers (OKLab <-> OKLCH) and angle normalization.
- [x] Implement chroma-compression gamut mapping and in-gamut checks.
- [x] Add unit tests for round-trip and known OKLab values.
- [x] Add tests that verify out-of-gamut colors map in-gamut without hue flips.

### Acceptance Criteria
**Scenario:** OKLab conversion matches reference
**GIVEN** a known sRGB sample
**WHEN** converting to OKLab
**THEN** L, a, b are within expected tolerances.

**Scenario:** Gamut mapping preserves hue
**GIVEN** an out-of-gamut OKLab value
**WHEN** mapping to sRGB with chroma compression
**THEN** the resulting RGB is in-gamut and OKLCH hue remains stable.

### Issues Encountered 
None.
