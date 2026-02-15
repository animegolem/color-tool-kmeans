---
node_id: AI-IMP-106
tags:
  - IMP-LIST
  - Implementation
  - Exports
  - Palette
  - Epic-013
kanban_status: planned
depends_on: [AI-EPIC-013, AI-IMP-105]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.90
date_created: 2026-02-14
date_completed:
---


# AI-IMP-106-artist-palette-ase

## Summary of Issue #1
Users cannot export extracted color palettes in a format importable by professional art software. This ticket adds Adobe Swatch Exchange (.ase) export, a well-documented binary format natively supported by Photoshop and importable by Clip Studio Pro. Done means users can save a .ase file from the Data section and import it into Photoshop or Clip Studio Pro to use extracted colors as swatches.

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
  - 3× 4-byte float (big-endian IEEE 754): R, G, B values normalized to 0.0–1.0
  - 2-byte color type: `0x0002` (spot color) or `0x0000` (global)

Implementation uses `DataView` on an `ArrayBuffer` for binary encoding. Swatch names derived from cluster hex values (e.g., `#A3422C`).

### Files to Touch
- `tauri-app/src/lib/exports/palette-ase.ts`: new file, .ase binary encoder (~100-120 LOC).
- `tauri-app/src/lib/exports/__tests__/palette-ase.spec.ts`: unit tests for binary format correctness.
- `tauri-app/src/lib/views/ExportsView.svelte`: add "Save .ase" button in Data section.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Implement `generateAseBlob(clusters)` function that produces a valid .ase binary blob from cluster data.
- [ ] Write header bytes: `ASEF`, version 1.0, block count.
- [ ] Write per-swatch blocks: type, length, UTF-16BE name, RGB model, float color values, color type.
- [ ] Add unit tests verifying: correct header, valid block structure, proper UTF-16BE encoding, float precision.
- [ ] Add unit test: generated .ase file byte structure matches known-good reference for a fixed palette.
- [ ] Wire "Save .ase" button in ExportsView Data section using FS bridge save dialog with `.ase` filter.
- [ ] Verify exported .ase imports correctly in Adobe Photoshop (manual test).
- [ ] Verify exported .ase imports correctly in Clip Studio Pro (manual test).
- [ ] Run `npm run test`, `npm run lint`, `npm run check`, and pre-commit hooks successfully.

### Acceptance Criteria
**Scenario: Export .ase palette**
GIVEN color analysis results are available with extracted clusters
WHEN the user clicks "Save .ase" in the Data section
THEN a native save dialog appears with `.ase` filter
AND a valid Adobe Swatch Exchange file is saved to disk.

**Scenario: Import in Photoshop**
GIVEN a .ase file exported from the app
WHEN the user imports it via Photoshop's Swatches panel (Load Swatches)
THEN all extracted colors appear as named swatches with correct RGB values.

**Scenario: Import in Clip Studio Pro**
GIVEN a .ase file exported from the app
WHEN the user imports it via CSP's color set import
THEN all extracted colors appear with correct RGB values.

**Scenario: Deterministic output**
GIVEN the same cluster data
WHEN .ase is exported multiple times
THEN the resulting files are byte-identical.

### Issues Encountered
{LOC|20}
