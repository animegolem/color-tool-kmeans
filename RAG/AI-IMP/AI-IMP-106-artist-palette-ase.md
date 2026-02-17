---
node_id: AI-IMP-106
tags:
  - IMP-LIST
  - Implementation
  - Exports
  - Palette
  - Epic-013
kanban_status: completed
depends_on: [AI-EPIC-013, AI-IMP-105]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.90
date_created: 2026-02-14
date_completed: 2026-02-16
---


# AI-IMP-106-artist-palette-ase

## Summary of Issue #1
Users cannot export extracted color palettes in formats importable by professional art software or structured for web development. This ticket adds:
1. **Adobe Swatch Exchange (.ase) export** — binary format natively supported by Photoshop and importable by Affinity Photo and Clip Studio Pro.
2. **JSON palette export** — structured data with hex, rgb, oklch, and share per color for web developers.

Both export from the Data section of ExportsView.

### Out of Scope
- Procreate `.swatches` format (JSON-in-zip, separate future work).
- Adobe Color Table (.act) or GIMP palette (.gpl) formats.
- Palette editing or reordering before export.

### Design/Approach
Adobe Swatch Exchange (.ase) binary format specification:
- 4-byte header: `ASEF` (ASCII)
- 2-byte version: `0x0001 0x0000` (version 1.0)
- 4-byte block count (big-endian uint32)
- Per color swatch block:
  - 2-byte block type: `0x0001` (color entry)
  - 4-byte block length (big-endian uint32)
  - 2-byte name length (UTF-16 character count including null terminator)
  - Name as UTF-16BE string with null terminator
  - 4-byte color model: `RGB ` (ASCII, space-padded)
  - 3x 4-byte float (big-endian IEEE 754): R, G, B values normalized to 0.0-1.0
  - 2-byte color type: `0x0000` (global/process)

Implementation uses `DataView` on an `ArrayBuffer` for binary encoding. Swatch names derived from cluster hex values (e.g., `#A3422C`).

JSON palette format:
- Pretty-printed JSON with `palette` array and `count` field
- Each entry: `rank`, `hex`, `rgb` (array), `oklch` (array), `share`
- Deterministic output (no timestamps)

### Files to Touch
- `tauri-app/src/lib/exports/palette-ase.ts`: new file, .ase binary encoder (~90 LOC).
- `tauri-app/src/lib/exports/__tests__/palette-ase.spec.ts`: unit tests for binary format correctness.
- `tauri-app/src/lib/exports/palette-web.ts`: new file, JSON palette generator (~50 LOC).
- `tauri-app/src/lib/exports/__tests__/palette-web.spec.ts`: unit tests for JSON format.
- `tauri-app/src/lib/bridges/fs.ts`: add `json` extension label.
- `tauri-app/src/lib/views/ExportsView.svelte`: add "Save .ase" and "Save JSON" buttons in Data section.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Implement `generateAseBlob(clusters)` function that produces a valid .ase binary blob from cluster data.
- [x] Write header bytes: `ASEF`, version 1.0, block count.
- [x] Write per-swatch blocks: type, length, UTF-16BE name, RGB model, float color values, color type.
- [x] Add unit tests verifying: correct header, valid block structure, proper UTF-16BE encoding, float precision.
- [x] Add unit test: generated .ase file byte structure matches known-good reference for a fixed palette.
- [x] Implement `generatePaletteJson(clusters)` function for JSON palette export.
- [x] Add unit tests for JSON format: valid JSON, field presence, value correctness, determinism, edge cases.
- [x] Wire "Save .ase" button in ExportsView Data section using FS bridge save dialog with `.ase` filter.
- [x] Wire "Save JSON" button in ExportsView Data section using FS bridge save dialog with `.json` filter.
- [x] Verify exported .ase imports correctly in Affinity Photo (manual test).
- [x] Verify exported .ase imports correctly in Clip Studio Pro (manual test).
- [x] Run `npm run test`, `npm run lint`, `npm run check`, and pre-commit hooks successfully.

### Acceptance Criteria
**Scenario: Export .ase palette**
GIVEN color analysis results are available with extracted clusters
WHEN the user clicks "Save .ase" in the Data section
THEN a native save dialog appears with `.ase` filter
AND a valid Adobe Swatch Exchange file is saved to disk.

**Scenario: Export JSON palette**
GIVEN color analysis results are available with extracted clusters
WHEN the user clicks "Save JSON" in the Data section
THEN a native save dialog appears with `.json` filter
AND a valid JSON file is saved with palette entries containing hex, rgb, oklch, and share.

**Scenario: Import in Affinity Photo**
GIVEN a .ase file exported from the app
WHEN the user imports it via Affinity Photo's palette import
THEN all extracted colors appear as named swatches with correct RGB values.

**Scenario: Import in Clip Studio Pro**
GIVEN a .ase file exported from the app
WHEN the user imports it via CSP's color set import
THEN all extracted colors appear with correct RGB values.

**Scenario: Deterministic output**
GIVEN the same cluster data
WHEN .ase or JSON is exported multiple times
THEN the resulting files are byte-identical / string-identical.

### Issues Encountered
No issues. .ase imports validated in Affinity Photo and Clip Studio Pro without problems.
