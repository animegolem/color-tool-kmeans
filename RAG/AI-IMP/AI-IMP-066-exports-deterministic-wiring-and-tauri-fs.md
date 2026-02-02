---
node_id: AI-IMP-066
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Exports
  - Epic-013
kanban_status: planned
depends_on: [AI-EPIC-013, AI-IMP-051]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.86
date_created: 2025-11-21
date_completed:
---


# AI-IMP-066-exports-deterministic-wiring-and-tauri-fs

## Summary of Issue #1
The Exports view currently wires buttons to SVG/PNG/CSV helpers but relies on browser-style downloads even in Tauri, and we have not validated determinism or error behavior for offline desktop exports. This ticket will finalize the Exports view wiring against a true Tauri-native FS bridge, ensure deterministic output for circle graph PNG/SVG and palette CSV across runs for the same inputs, and provide clear success/error messaging aligned with the design states in `figma/exports_*.png`. Done means users can reliably save all three formats on macOS/Windows/Linux with consistent bytes and actionable errors when something goes wrong (e.g., invalid directory, write failure).

### Out of Scope 
- Preferences for last-used export directory or scale (handled by AI-IMP-067).
- Any changes to the circle graph or palette visual design beyond what is needed for determinism.
- CI artifact publishing of built bundles.

### Design/Approach  
- Enhance the `FsBridge` to use Tauri-native save dialogs and file writes when running under Tauri, while retaining the browser fallback for dev/preview.
- Revisit `ExportsView.svelte` to make sure success/error toasts match the Figma states for saving, saved, invalid directory, and write failure; keep messaging concise and offline-focused.
- Add lightweight tests that verify palette CSV and circle graph SVG/PNG exports are deterministic: given a fixed set of clusters and parameters, repeated calls produce identical outputs (or hashes).
- Ensure export flows propagate meaningful error messages back from the FS bridge (e.g., permission denied, invalid path) so the UI can show user-friendly explanations.
- Keep all export work strictly offline: no network calls, and no external font/CDN dependencies.

### Files to Touch
- `tauri-app/src/lib/bridges/fs.ts`: implement Tauri-native save dialogs and file writes, preserving browser fallback behavior.
- `tauri-app/src/lib/views/ExportsView.svelte`: refine wiring to the updated FS bridge, align status messages with Figma exports states.
- `tauri-app/src/lib/exports/*`: ensure helpers expose stable, deterministic outputs; add utilities for hashing or byte comparison in tests if needed.
- `tauri-app/src/lib/exports/__tests__/*`: add or extend tests to cover determinism and error handling for CSV/SVG/PNG exports.
- `.github/workflows/ci.yml`: optional, ensure export tests run as part of the existing lint/check job.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Extend `FsBridge` so that in Tauri it uses native save dialogs and file write APIs instead of browser download hacks.
- [ ] Keep and verify browser fallback behavior for dev/preview modes.
- [ ] Update Exports view messaging to match `figma/exports_*.png` states (saving, success, invalid directory, write failure).
- [ ] Add tests to verify palette CSV and circle graph SVG/PNG exports are deterministic for fixed inputs.
- [ ] Ensure exports never trigger network requests and rely only on local fonts/assets.
- [ ] Run `npm run test`, `npm run lint`, `npm run check`, and pre-commit hooks successfully.

### Acceptance Criteria
**Scenario: Native export success**
GIVEN an analysis result is available and the app is running in Tauri  
WHEN the user saves a circle graph PNG/SVG or palette CSV  
THEN a native Save dialog appears, the file is written successfully to disk,  
AND a success toast appears consistent with the Figma “saved” state.

**Scenario: Export error handling**
GIVEN the app is running in Tauri and the user chooses an invalid or unwritable location  
WHEN the export fails due to filesystem error  
THEN an error toast appears with a concise, user-friendly explanation  
AND no partial or corrupt file is left behind.

**Scenario: Deterministic export outputs**
GIVEN a fixed input image and parameters that produce a known cluster set  
WHEN the user exports palette CSV or circle graph SVG/PNG multiple times  
THEN the resulting files are byte-identical across runs (ignoring any explicitly documented non-deterministic metadata).

### Issues Encountered 
{LOC|20}
