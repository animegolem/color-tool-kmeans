---
node_id: AI-IMP-090
tags:
  - IMP-LIST
  - Implementation
  - testing
  - color-science
  - oklab
  - hsv
kanban_status: completed
depends_on: AI-EPIC-018
parent_epic: [[AI-EPIC-018-color-math-test-harness]]
confidence_score: 0.56
date_created: 2026-02-01
date_completed: 2026-02-01
---

# AI-IMP-090-roundtrip-property-tests

## Add property-based round-trip tests for core color conversions
We need deterministic, automated checks that RGB ↔ OKLab/OKLCH and RGB ↔ HSV conversions do not drift or explode at boundaries. Done when Rust and TS both run property-based tests that fail on round-trip error beyond documented tolerances.

### Out of Scope
- Full visual snapshot testing (handled in IMP-092).
- Gold-standard fixture generation (handled in IMP-091).

### Design/Approach
- Rust: add `proptest` tests for `srgb -> oklab -> srgb` and `srgb -> hsv -> srgb` (if HSV exists in Rust) with epsilon tolerance.
- TS: add `fast-check` tests under Vitest for `rgb -> hsv -> rgb` and `rgb -> oklab -> rgb` parity where TS implementations exist.
- Ensure boundary cases are explicitly included (pure primaries, black/white, near 0/360 hue wrap).
- Document tolerance constants in test files for reproducibility.

### Files to Touch
- `tauri-app/src-tauri/src/color.rs`: expose/verify conversion helpers used by tests.
- `tauri-app/src-tauri/tests/color_roundtrip.rs`: new property tests (proptest).
- `tauri-app/src/lib/exports/polar-chart.ts`: ensure HSV/OKLab helper parity (if TS-only).
- `tauri-app/src/lib/exports/__tests__/color-roundtrip.spec.ts`: new fast-check tests.
- `tauri-app/package.json`: add `fast-check` dev dependency.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `proptest` dev-dependency in `tauri-app/src-tauri/Cargo.toml`.
- [x] Create `tauri-app/src-tauri/tests/color_roundtrip.rs` with RGB↔OKLab round-trip property tests.
- [x] Add HSV round-trip tests in Rust if HSV conversion helpers exist; otherwise document why not.
- [x] Add `fast-check` dev dependency to `tauri-app/package.json`.
- [x] Create `tauri-app/src/lib/exports/__tests__/color-roundtrip.spec.ts` using Vitest + fast-check.
- [x] Include explicit boundary fixtures (pure primaries, black/white, hue wrap).
- [x] Define tolerance constants and assert on max channel error (documented).
- [x] Run tests locally (Rust + Vitest) to confirm stability.

### Acceptance Criteria
**Scenario:** Round-trip conversion stability.
**GIVEN** randomized RGB inputs and boundary colors.
**WHEN** conversions run through OKLab/HSV and back to RGB.
**THEN** the output matches the input within the documented tolerance.
**AND** tests fail on hue wrap or NaN edge cases.

### Issues Encountered
- Cargo test required network access for the new proptest dependency; ran with elevated permissions.
- Vitest CLI does not support `--runTestsByPath`; used `vitest run <path>` instead.
