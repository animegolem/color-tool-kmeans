---
node_id: AI-IMP-132
tags:
  - IMP-LIST
  - Implementation
  - cleanup
  - dead-code
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.95
date_created: 2026-03-14
date_completed: 2026-03-14
---

# AI-IMP-132-pre-merge-dead-code-cleanup

## Pre-merge dead code and duplicate cleanup

The `epic-7-and-8` branch carries a large delta (412 files, ~24k additions) spanning EPICs 7–23. Before merging to main, a precautionary sweep for dead code, duplicated patterns, and incomplete refactor artifacts is needed. The app works well visually — this is hygiene only.

The codebase is surprisingly clean for a branch this size. No broken imports, no orphaned Rust commands, no TODO/FIXME/HACK markers, and no stale references to removed modules. Findings are all low-severity.

### Out of Scope

- Duplicate color-space helpers in `histogram.ts`/`hue-lightness.ts` (~5 lines each, file-local — not worth extracting)
- Color conversion exports in `polar-chart.ts` (used by test files)
- Refactoring `preferences.ts` debounce patterns (functional, risk of regressions pre-merge)

### Design/Approach

Remove dead exports and consolidate duplicated SVG helpers. All changes are deletion or un-export — no new logic introduced.

### Files to Touch

- `tauri-app/src/lib/compute/image-loader.ts`: remove dead `fileToDataset`, `bufferToDataset`
- `tauri-app/src/lib/views/home/video-controller.svelte.ts`: remove `formatTime` from return object
- `tauri-app/src/lib/exports/value-analysis.ts`: remove `blobToDataUrl`, replace duplicate `serializeAttrs`/`escapeAttr` with imports from `svg.ts`
- `tauri-app/src/lib/exports/svg.ts`: export `serializeAttrs`, `escapeAttr`, `escapeText`
- `tauri-app/src/lib/bridges/compute.ts`: un-export `selectComputeBridge`
- `tauri-app/src/lib/bridges/fs.ts`: un-export `selectFsBridge`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Remove `fileToDataset` and `bufferToDataset` from `image-loader.ts`
- [x] Remove `formatTime` from `video-controller.svelte.ts` return object
- [x] Remove `blobToDataUrl` from `value-analysis.ts`
- [x] Replace duplicate `serializeAttrs`/`escapeAttr` in `value-analysis.ts` with imports from `svg.ts`
- [x] Export `serializeAttrs`, `escapeAttr`, `escapeText` from `svg.ts`
- [x] Un-export `selectComputeBridge` in `compute.ts`
- [x] Un-export `selectFsBridge` in `fs.ts`
- [x] `npm run check` passes (0 errors, 2 pre-existing a11y warnings)
- [x] `npm run lint` passes
- [x] `npm run test` passes (152/152)

### Acceptance Criteria

**Scenario:** Pre-merge cleanup removes dead code without regressions.
**GIVEN** the `epic-7-and-8` branch with all features working.
**WHEN** dead exports are removed and duplicate helpers consolidated.
**THEN** `npm run check`, `npm run lint`, and `npm run test` all pass.
**AND** no runtime regressions in image analysis, video playback, or export workflows.

### Issues Encountered

No issues encountered. All changes were straightforward deletions or un-exports with no downstream consumers.
