---
node_id: AI-IMP-092
tags:
  - IMP-LIST
  - Implementation
  - testing
  - kmeans
  - gamut
  - snapshots
kanban_status: completed
depends_on: AI-EPIC-018
parent_epic: [[AI-EPIC-018-color-math-test-harness]]
confidence_score: 0.49
date_created: 2026-02-01
date_completed: 2026-02-01
---

# AI-IMP-092-kmeans-snapshots-and-gamut-tests

## Add k-means snapshot tests and gamut boundary integrity checks
We need deterministic snapshots for k-means output (to catch centroid regressions) and tests that verify valid sRGB points lie inside our drawn gamut boundary. Done when CI fails on any centroid drift or out-of-gamut boundary mismatch.

### Out of Scope
- Property-based conversion fuzzing (IMP-090).
- Gold-standard fixture tests (IMP-091).

### Design/Approach
- K-means snapshots: run analysis on fixed test images with a fixed seed/config; compare output JSON to committed snapshots.
- Gamut boundary checks: build the UI boundary (OKLCH outline from RGB cube edges) and validate random sRGB samples fall within the polygon.
- Use the existing `test-patterns/` assets for repeatable inputs.
- Run snapshot assertions in Linux CI only to avoid cross-arch SIMD drift; other platforms can skip snapshot checks.

### Files to Touch
- `test-patterns/`: reference images used for snapshots.
- `tauri-app/src-tauri/tests/kmeans_snapshots.rs`: run k-means, serialize output JSON, compare to snapshot files.
- `tauri-app/src-tauri/tests/snapshots/*.json`: committed k-means outputs.
- `tauri-app/src/lib/exports/__tests__/gamut-boundary.spec.ts`: TS test to validate boundary containment for random sRGB points.
- `tauri-app/src/lib/exports/polar-chart.ts`: expose boundary helper or add test-only export if needed.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Select 1–2 reference images in `test-patterns/` and document them in the test file.
- [x] Add Rust snapshot test that runs k-means with fixed seed and compares output JSON.
- [x] Commit snapshot JSON files with centroid list + counts/shares.
- [x] Add TS gamut-boundary test that samples random sRGB colors and asserts inside polygon.
- [x] Document tolerance / boundary sampling density used in the test.
- [x] Gate snapshot verification to Linux CI (x86_64) to avoid SIMD drift.
- [x] Run tests locally to confirm deterministic outputs.

### Acceptance Criteria
**Scenario:** K-means regression detection.
**GIVEN** fixed input images and seeded k-means config.
**WHEN** the snapshot tests run.
**THEN** the output JSON matches committed snapshots exactly.

**Scenario:** Gamut boundary integrity.
**GIVEN** random valid sRGB inputs.
**WHEN** they are converted to OKLCH and tested against the boundary polygon.
**THEN** all points lie inside the boundary within tolerance.

### Issues Encountered
- Image decoder does not include GIF support; snapshot set uses `hsl_ligthness.png` only.
- Snapshots are generated with `--no-default-features` (SIMD disabled) and `SNAPSHOT_FORCE=1` for cross-arch stability.
