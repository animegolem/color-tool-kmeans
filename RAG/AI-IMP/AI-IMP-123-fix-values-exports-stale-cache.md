---
node_id: AI-IMP-123
tags:
  - IMP-LIST
  - Implementation
  - bug
  - P1
  - exports
  - cache
kanban_status: completed
depends_on: []
parent_epic:
confidence_score: 0.95
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-123-fix-values-exports-stale-cache

## Fix values exports using stale cached artifacts

`values-export-runner.svelte.ts:69-70` uses `convertFileSrc()` for `neutral` and `preview` paths. `ValuesView.svelte:79,84` uses `assetUrl()` (cache-busted) for the same artifacts. When a frame is re-analyzed after scrubbing, the backend overwrites files in place, but exports embed browser-cached stale versions because `convertFileSrc()` produces a stable URL with no cache-busting parameter.

**Fix**: Replace `convertFileSrc()` with `assetUrl()` in `values-export-runner.svelte.ts`.

### Out of Scope

- Changing how ValuesView renders previews (already correct with `assetUrl`)
- Modifying the backend file overwrite behavior

### Design/Approach

Surgical fix: import `assetUrl` from `../../utils/asset-url` and replace all `convertFileSrc()` calls with `assetUrl()`. Remove the now-unused `convertFileSrc` import. Found 8 total occurrences across the file (not just 2 as initially scoped).

### Files to Touch

- `tauri-app/src/lib/views/exports/values-export-runner.svelte.ts`: replace `convertFileSrc` → `assetUrl` (lines 69-70), update import

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Replace `convertFileSrc` import with `assetUrl` import from `../../utils/asset-url`
- [x] Replace all 8 `convertFileSrc()` calls with `assetUrl()` (lines 69-70, 108-109, 154, 215, 315, 327)
- [x] Verify no `convertFileSrc` usage remains in the file
- [x] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** User scrubs video and exports value analysis.
**GIVEN** a video is loaded and analyzed in Values view.
**WHEN** the user scrubs to a new frame, re-analyzes, and exports the value study.
**THEN** the exported SVG/PNG contains the current frame's neutral and preview images, not stale cached versions.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
