---
node_id: AI-IMP-104
tags:
  - IMP-LIST
  - Implementation
  - settings
  - stores
  - bug-fix
kanban_status: completed
depends_on:
  - "[[AI-IMP-103]]"
parent_epic: [[AI-EPIC-010-values-tab-and-value-study-grid]]
confidence_score: 0.9
date_created: 2026-02-14
date_completed: 2026-02-14
---

# AI-IMP-104-settings-view-redesign-notan-fix

## Settings View Redesign + Notan Cache Key Fix

The current SettingsView duplicates every control already present in the main views (ParameterControls, ValuesView, ExportsView). Since main-view controls already auto-persist via store write-back, the duplication is unnecessary and confusing.

Additionally, `valueAnalysisNotanMode` is a writable store that can desync from the runner's `effectiveNotanMode = levels === 2`. When the user unchecks notan in Settings, the derived lookup key becomes `imageId:2:kmeans` while results were stored under `imageId:2:notan`, causing a cache miss and the level-2 result to disappear.

**Done when:** SettingsView shows only controls unique to settings (chart visibility, slider limits, export dir), the notan cache key mismatch is eliminated, and all new settings persist across relaunch.

### Out of Scope

- Reworking the ExportsView or its PNG scale slider
- Adding theme/appearance settings
- Changing the value analysis algorithm or backend

### Design/Approach

**Part A — Notan fix:** Convert `valueAnalysisNotanMode` from `writable<boolean>` to `derived(valueAnalysisLevels, l => l === 2)`. Both the write side (runner) and read side (derived lookups) will always compute the same key. Drop-in replacement — all subscribers continue working unchanged.

**Part B — New stores:** Add `showHistogram`, `showPolarChart`, `showHueLightness` to `AnalysisParams`. Add standalone stores `clusterMax`, `excludeTopMax`, `showSimplifiedTones`. Extend `PrefsV1` with `display` and `limits` sections. Wire hydration and write-back.

**Part C — View wiring:** Guard `<AnalysisCards>` in HomeView with chart visibility flags. Use `$clusterMax`/`$excludeTopMax` in ParameterControls. Wrap simplified tones section in ValuesView with `$showSimplifiedTones`.

**Part D — SettingsView rewrite:** Strip all duplicated controls. New layout: chart toggles, slider range limits, export dir picker, reset button (~150 LOC).

### Files to Touch

- `src/lib/stores/ui.ts`: notan → derived, new stores/fields, hydration, write-back
- `src/lib/stores/prefs.ts`: schema update (display, limits), remove notanMode
- `src/lib/views/SettingsView.svelte`: full rewrite
- `src/lib/views/HomeView.svelte`: chart visibility guards
- `src/lib/views/home/ParameterControls.svelte`: dynamic slider max
- `src/lib/views/ValuesView.svelte`: simplified tones toggle

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Convert `valueAnalysisNotanMode` from writable to derived in `ui.ts`
- [x] Remove notan write-back subscription from `ui.ts`
- [x] Remove `notanMode` from `hydrateFromPrefs` in `ui.ts`
- [x] Remove `notanMode` from `PrefsV1.valueAnalysis` and `DEFAULTS` in `prefs.ts`
- [x] Remove `notanMode` from `deepMerge` in `prefs.ts`
- [x] Update `savePrefs` valueAnalysis merge to drop notanMode
- [x] Add `showHistogram`, `showPolarChart`, `showHueLightness` to `AnalysisParams` in `ui.ts`
- [x] Add `clusterMax`, `excludeTopMax`, `showSimplifiedTones` stores to `ui.ts`
- [x] Add `display` and `limits` sections to `PrefsV1` and `DEFAULTS` in `prefs.ts`
- [x] Update `deepMerge` for new prefs sections
- [x] Update `savePrefs` for new prefs sections
- [x] Update `hydrateFromPrefs` for new stores/fields
- [x] Add write-back subscriptions for new standalone stores
- [x] Guard `<AnalysisCards>` in HomeView with chart visibility params
- [x] Replace hardcoded slider max in ParameterControls with `$clusterMax` / `$excludeTopMax`
- [x] Wrap simplified tones section in ValuesView with `{#if $showSimplifiedTones}`
- [x] Rewrite SettingsView: chart toggles, range limits, export dir, reset
- [x] Update `handleReset` to reset new stores (via `hydrateFromPrefs(DEFAULTS)`)
- [x] Verify `npm run build` passes
- [x] Verify `npm run check` passes

### Acceptance Criteria

**Scenario:** Notan cache key consistency
**GIVEN** the app is running with a loaded image
**WHEN** the user sets levels to 2 on the Values view
**THEN** `valueAnalysisNotanMode` is automatically `true`
**AND** the cache key matches the runner's write key (`imageId:2:notan`)

**Scenario:** Chart visibility toggles
**GIVEN** a color analysis result is displayed
**WHEN** the user unchecks "Cluster Histogram" in Settings
**THEN** the histogram card hides in the Colors view
**AND** polar and hue-lightness cards remain visible

**Scenario:** Slider range limits
**GIVEN** the user sets "Max clusters" to 500 in Settings
**WHEN** they navigate to the Colors view
**THEN** the clusters slider max is 500

**Scenario:** Simplified tones toggle
**GIVEN** a value analysis result is displayed
**WHEN** the user unchecks "Show simplified tones" in Settings
**THEN** the simplified tones section (levels slider + bucket strip + preview) is hidden

**Scenario:** Persistence across relaunch
**GIVEN** the user changes settings and quits
**WHEN** the app relaunches
**THEN** all settings are restored to their saved values

**Scenario:** Reset to defaults
**GIVEN** the user has changed various settings
**WHEN** they click "Reset to defaults"
**THEN** all toggles return to on, limits return to 2000/100, export dir cleared

### Issues Encountered
- No blockers. All checklist items completed in a single pass.
- `valueAnalysisNotanMode` derived conversion was a clean drop-in — ExportsView's `get()` calls and all derived store subscribers continued working unchanged.
- SettingsView reduced from 258 LOC (duplicated controls) to 220 LOC (settings-only controls + styles).
- Pre-existing ESLint `EACCES` on `.ffmpeg-build/` prevents `npm run lint` from running repo-wide; linted changed files individually — clean.
