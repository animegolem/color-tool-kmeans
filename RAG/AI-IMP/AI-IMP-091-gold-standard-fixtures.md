---
node_id: AI-IMP-091
tags:
  - IMP-LIST
  - Implementation
  - testing
  - color-science
  - fixtures
kanban_status: planned
depends_on: AI-EPIC-018
parent_epic: [[AI-EPIC-018-color-math-test-harness]]
confidence_score: 0.53
date_created: 2026-02-01
date_completed:
---

# AI-IMP-091-gold-standard-fixtures

## Add gold-standard color conversion fixtures for OKLab/OKLCH/HSV
We need external, authoritative fixtures so conversions are tested against a reference implementation (not our own math). Done when JSON fixtures exist and both Rust and TS validate against them with documented tolerances.

### Out of Scope
- Property-based fuzzing (IMP-090).
- K-means and gamut boundary snapshots (IMP-092).

### Design/Approach
- Generate a JSON fixture set using a reference library (e.g., Python `colour-science` or Björn Ottosson’s implementation).
- Include ~100 samples spanning primaries, secondaries, grays, near-gamut edges, and hue wrap.
- Store fixtures under a neutral path shared by Rust and TS tests.
- Add tests that compare Rust/TS outputs to fixture values with fixed tolerances.

### Files to Touch
- `scripts/generate-color-fixtures.py`: new generator script (optional, committed).
- `tauri-app/src-tauri/tests/fixtures/color_golden.json`: new fixture file.
- `tauri-app/src-tauri/tests/color_goldens.rs`: Rust test reader/validator.
- `tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts`: TS test reader/validator.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Define fixture schema (RGB input + OKLab/OKLCH/HSV outputs).
- [ ] Generate fixture JSON using external reference math.
- [ ] Add Rust test that loads fixture JSON and validates outputs with tolerance.
- [ ] Add TS test that loads the same fixture JSON and validates outputs.
- [ ] Document tolerance values and reference source in test header.
- [ ] Ensure fixtures are deterministic and committed (offline-friendly).

### Acceptance Criteria
**Scenario:** Gold-standard validation.
**GIVEN** the fixture JSON generated from an external reference.
**WHEN** Rust and TS tests run conversions on the fixture inputs.
**THEN** all values match within the documented tolerance.

### Issues Encountered
{LOC|20}
