---
node_id: AI-IMP-013
tags:
  - IMP-LIST
  - Implementation
  - Rust
  - Color
  - Math
kanban_status: planned
depends_on: [AI-EPIC-002-tauri_rust_compute_pivot, AI-IMP-012]
confidence_score: 0.8
created_date: 2025-09-21
close_date:
--- 

# AI-IMP-013-rust-color-spaces

## Summary of Issue #1
We must convert between RGB and HSL/YUV/CIELAB/CIELUV accurately and efficiently for clustering and visualization. Scope: add Rust implementations with tests and consistent D65/sRGB assumptions. Outcome: `rgb_to_*` and `*_to_rgb` functions with tolerances verified against known references.

### Out of Scope 
- K‑means algorithm; IPC; UI formatting of values.

### Design/Approach  
- Implement sRGB companding, XYZ (D65), CIELAB and CIELUV transforms; YUV BT.601.
- Provide HSV/HSL helpers for chart mapping.
- Ensure numeric stability and define tolerated deltas; prefer `f32` for speed, `f64` where necessary for reference conversions.

### Files to Touch
- `src-tauri/crates/core/src/color.rs` (new module).
- `src-tauri/crates/core/tests/color_spaces.rs` (round‑trip + known vectors).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Implement sRGB↔linear helpers; RGB↔XYZ (D65).
- [ ] Implement RGB↔CIELAB, RGB↔CIELUV with documented formulas.
- [ ] Implement RGB↔YUV (BT.601) and RGB↔HSL/HSV.
- [ ] Add benches for hot paths (optional) and property tests for ranges.
- [ ] Document assumptions (white point, matrix, gamma).

### Acceptance Criteria
**Scenario: Round‑trip accuracy**
GIVEN sample RGB colors
WHEN converting to LAB/LUV and back
THEN per‑channel error ≤2 for typical colors; ≤4 for extremes.

### Issues Encountered 
To be filled during implementation.

