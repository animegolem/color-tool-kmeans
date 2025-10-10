---
node_id: AI-IMP-061
tags:
  - Implementation
  - tauri
  - bridge-architecture
  - validation
  - diagnostics
kanban_status: review
depends_on:
  - AI-EPIC-006
  - AI-IMP-059
  - AI-IMP-060
confidence_score: 0.85
created_date: 2025-10-09
close_date:
---

# AI-IMP-061-tauri-compute-response-validation

## Validate Tauri `analyze_image` Response & Emit Typed Errors

The Tauri compute bridge currently trusts whatever structure comes back from `analyze_image`. When the Rust command returns malformed data (or an empty object on error), the UI quietly renders zeros. FR-7 requires us to validate the payload and throw meaningful errors.

### Goals
- Parse and validate the Tauri compute response using `zod`, mirroring the electron bridge rigor.
- Throw `TauriComputeError` with a typed `code` and human-readable message when validation fails or invoke rejects.
- Ensure failures surface up to `analyzeImage()` so HomeView can display actionable error text (FR-4 follow-up ticket will handle UI copy).

### Scope
- `tauri-app/src/lib/bridges/compute.ts`
  - Introduce `TauriComputeResponseSchema` and `normalizeTauriCluster()` helpers.
  - Wrap `tauriInvoke` call in try/catch, mapping errors to `TauriComputeError` (`invoke-failed`, `invalid-response`, `missing-clusters`, etc.).
  - Validate key fields (`clusters`, `iterations`, `durationMs`, `totalSamples`, `variant`) and centroid arrays (length 3).
  - Ensure numeric values are finite and non-negative.
- `tauri-app/src/lib/bridges/compute.ts` tests will be deferred; manual checks via existing smoke runs.
- No Rust changes in this ticket; command stays the same.

### Out of Scope
- Updating HomeView messaging (handled in future FR-4/FR-9 ticket).
- Adding Vitest coverage (follow-up QA ticket).
- Modifying electron or wasm bridges.

### Acceptance Criteria
1. Invalid payload (e.g., missing `clusters`) causes `TauriComputeError` with message `Invalid analyze_image response: clusters missing or empty` and `code='invalid-response'`.
2. If `tauriInvoke` rejects, error is wrapped with `code='invoke-failed'` and original error attached.
3. Valid payload passes through unchanged; existing cluster mapping still works, but data is now validated.
4. Console logging from AI-IMP-060 remains intact (no duplicate logging added here).

### Validation
- `npm run build`.
- `npm run tauri dev` smoke test: confirm valid analysis works; manually simulate bad payload via console patch to ensure error bubbles (document steps in log).

### Notes
- Support both `centroidSpace` and legacy `centroid_space` field names to remain compatible with existing Rust serde output.
- Include helper `isFiniteNumber()` to reject `NaN`/`Infinity` values.


## Implementation Notes

- Added `TauriComputeError` with codes (`missing-path`, `invoke-failed`, `invalid-response`).
- Normalized and validated Tauri response via Zod transforms (`tauriComputeResponseSchema`).
- Updated compute bridge to wrap `tauriInvoke`, surface typed errors, and map validated clusters.
- Removed legacy eslint-disable hints; lint/build pipelines updated to ensure coverage.

## Validation

- `npm run lint`
- `npm run build`
- Manual Tauri dev smoke: awaiting confirmation (user to retest).
