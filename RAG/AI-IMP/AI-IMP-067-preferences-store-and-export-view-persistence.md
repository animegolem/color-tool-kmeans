---
node_id: AI-IMP-067
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Preferences
  - Epic-014
kanban_status: planned
depends_on: [AI-EPIC-014]
parent_epic: [[AI-EPIC-014-global-settings]]
confidence_score: 0.84
date_created: 2025-11-21
date_completed:
---


# AI-IMP-067-preferences-store-and-export-view-persistence

## Summary of Issue #1
The application currently uses in-memory defaults for analysis parameters, export scale, and current view, with no persistence across sessions. AI-EPIC-007 requires a lightweight preferences store to remember last export directory, parameters, and last tab while maintaining strict offline behavior. This ticket will introduce a small preferences layer around these values (using a Tauri-friendly store and/or localStorage), apply them on boot, and expose minimal UI affordances where needed. Done means a user can tweak key parameters, switch views, perform exports, quit the app, and see those choices restored next time without network access.

### Out of Scope 
- Theme switching beyond any existing tokens; dark mode is not required unless driven by a separate epic.
- Complex per-project configuration or multiple profiles.
- Syncing preferences across devices or users.

### Design/Approach  
- Define a versioned preferences schema (e.g., `v1`) capturing: last selected view, analysis params (K, stride, minLum, color space, axis, symbol scale), and last-used export scale (and optionally last export directory path).
- Implement a small preferences module that can read/write JSON either via `tauri-plugin-store` or a hybrid of localStorage (for quick UI) and a Tauri store for filesystem paths, guarding against schema changes and missing data.
- On app boot, load preferences and hydrate the `currentView`, `params`, and any export-specific state before rendering primary views.
- Ensure invalid or corrupted preference data is safely ignored with sane defaults and logged for debugging.
- Keep the implementation minimal, with clear boundaries so future theme work can plug into the same store if needed.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`: integrate preferences for initial view and parameters.
- `tauri-app/src/lib/stores/prefs.ts`: new preferences module with load/save logic and schema versioning.
- `tauri-app/src/main.ts`: hydrate initial state from preferences before mounting, if needed.
- `tauri-app/src/lib/views/*`: minimal adjustments to write back preference changes when users modify parameters or export scale.
- `RAG/AI-EPIC/AI-EPIC-007-tauri-ui-graphs-exports.md`: note preferences implementation when complete.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Define a versioned preferences schema capturing view, analysis parameters, and export scale (and optionally last export dir).
- [ ] Implement `prefs` store helpers to load/save preferences in an offline-safe way (Tauri store and/or localStorage).
- [ ] Apply stored preferences on app boot to initialize `currentView` and `params` before primary views render.
- [ ] Wire parameter and export-scale changes to write back to the preferences store.
- [ ] Gracefully handle corrupted or missing preference data by falling back to defaults and logging once.
- [ ] Add minimal tests for preferences load/save behavior and schema upgrades.

### Acceptance Criteria
**Scenario: Parameters and view persistence**
GIVEN a user changes K, stride, minLum, and axis/symbol scale and switches to the Graphs or Exports tab  
WHEN they close and relaunch the app  
THEN the same view and parameter values are restored without errors.

**Scenario: Export scale persistence**
GIVEN a user sets a non-default PNG scale in the Exports view  
WHEN they relaunch the app and navigate back to Exports  
THEN the PNG scale control reflects the previously chosen value.

**Scenario: Robustness to corrupted preferences**
GIVEN the stored preferences JSON is missing fields or malformed  
WHEN the app starts  
THEN it falls back to sane defaults, logs a single diagnostic message,  
AND the UI remains usable without crash or blocking dialogs.

### Issues Encountered 
{LOC|20}
