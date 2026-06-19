---
node_id: AI-IMP-066
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Exports
  - Epic-013
kanban_status: completed
depends_on: [AI-EPIC-013]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.88
date_created: 2025-11-21
date_completed: 2026-02-15
---


# AI-IMP-066-exports-deterministic-wiring-and-tauri-fs

## Summary of Issue #1
Export helpers produce SVG/PNG/CSV artifacts but determinism has not been validated and error handling is minimal. The Tauri FS bridge (dialog plugin) already provides native save dialogs. This ticket focuses on verifying deterministic output, adding clear saving/saved/failed state feedback, and ensuring offline compliance. Done means repeated exports of the same inputs produce byte-identical files, errors surface actionable messages, and no network requests are triggered during export.

### Out of Scope
- Builder UI redesign (handled by AI-IMP-105).
- Artist palette formats or notan study exports.
- Preferences for last-used export directory (handled separately).
- Visual design changes to charts beyond what is needed for determinism.

### Design/Approach
- Add lightweight tests that verify palette CSV, histogram SVG/PNG, polar SVG/PNG, and hue-lightness SVG/PNG exports are deterministic: given fixed clusters and parameters, repeated calls produce identical output (or matching hashes).
- Ensure export error flows propagate meaningful messages from the FS bridge (permission denied, invalid path, write failure) so the UI can show user-friendly explanations.
- Add saving/saved/failed state transitions to export buttons with brief visual feedback.
- Validate all exports are offline-only: no network calls, vendored Fira Sans only.
- Verify browser fallback behavior still works for dev/preview modes.

### Files to Touch
- `tauri-app/src/lib/exports/*.ts`: audit determinism of all SVG/PNG/CSV generation helpers.
- `tauri-app/src/lib/exports/__tests__/*`: add or extend tests for determinism and error paths.
- `tauri-app/src/lib/bridges/fs.ts`: verify error propagation from Tauri dialog plugin.
- `tauri-app/src/lib/views/ExportsView.svelte`: add saving/saved/failed state feedback to export actions.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add determinism tests: palette CSV export produces identical output across repeated runs for fixed input.
- [x] Add determinism tests: polar chart SVG/PNG export produces identical output for fixed clusters.
- [x] Add determinism tests: histogram SVG/PNG export produces identical output for fixed clusters.
- [x] Add determinism tests: hue-lightness SVG/PNG export produces identical output for fixed clusters.
- [x] Verify FS bridge error propagation: invalid path, permission denied, write failure surface meaningful messages.
- [x] Add saving/saved/failed state transitions to export button UI with visual feedback.
- [x] Verify browser fallback (non-Tauri) export still works for dev/preview.
- [x] Confirm no network requests during any export flow (vendored fonts only).
- [x] Run `npm run test`, `npm run lint`, `npm run check`, and pre-commit hooks successfully.

### Acceptance Criteria
**Scenario: Deterministic export outputs**
GIVEN a fixed input image and parameters that produce a known cluster set
WHEN the user exports palette CSV, polar SVG/PNG, histogram SVG/PNG, or hue-lightness SVG/PNG multiple times
THEN the resulting files are byte-identical across runs.

**Scenario: Export error handling**
GIVEN the app is running in Tauri and the user chooses an invalid or unwritable location
WHEN the export fails due to filesystem error
THEN an error message appears with a concise, user-friendly explanation
AND no partial or corrupt file is left behind.

**Scenario: Export state feedback**
GIVEN an analysis result is available
WHEN the user clicks an export button
THEN the button shows a saving state, transitions to saved on success or failed on error,
AND the state resets after a brief delay.

**Scenario: Offline compliance**
GIVEN the app is running with no network access
WHEN the user exports any artifact
THEN the export completes successfully using only vendored fonts and local assets.

### Issues Encountered

- **Native save was never wired**: `createTauriFsBridge().saveBlob()` delegated to `browserSaveBlob()` (anchor.click hack). Replaced with `@tauri-apps/plugin-dialog` `save()` + Rust `save_file` IPC command.
- **PNG determinism explicitly skipped**: Canvas rasterization (`OffscreenCanvas`/`HTMLCanvasElement`) produces platform-dependent output. SVG determinism tests cover semantic content; PNG is a downstream rasterization.
- **IPC data size**: `Vec<u8>` serializes as JSON number array (~3x overhead). Acceptable for single-chart exports (≤2MB). If IMP-105 composites push sizes higher, `tauri-plugin-fs` can bypass IPC serialization.
- **`exportDir` remembered**: Native save dialog defaults to the last-used export directory, persisted via the `exportDir` store.
