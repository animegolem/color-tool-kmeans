# AI-EPIC
---
node_id: AI-EPIC-014
tags:
  - EPIC
  - AI
  - settings
  - persistence
date_created: 2026-01-22
date_completed: 2026-02-14
kanban_status: completed
AI_IMP_spawned:
---

# AI-EPIC-014-global-settings

## Problem Statement/Feature Scope
User preferences (default clusters, quality, save location, add/replace behavior) reset on app restart. Need persistent settings via tauri-plugin-store.

## Proposed Solution(s)
- Add tauri-plugin-store for persistent key-value storage
- Settings store synced to disk
- Settings tab/panel in UI for configuration
- Apply defaults on fresh image load

## Path(s) Not Taken
- JSON file in app directory (plugin handles this better)
- Per-image settings (global is simpler, per-image could be future enhancement)

## Success Metrics
1. Settings persist across app restarts
2. Default parameters applied automatically
3. User can modify settings through UI

## Requirements

### Functional Requirements
- [x] FR-1: Settings persist across app restarts
- [x] FR-2: Default clusters setting (applied on new image)
- [x] FR-3: Default quality setting
- [x] FR-4: Default save/export location
- [ ] FR-5: Add/replace behavior setting (for EPIC-010) — *deferred; current behavior is always-replace, add/replace toggle can be revisited under EPIC-010*
- [x] FR-6: Settings UI (tab or modal)
- [x] FR-7: Reset to defaults option

### Non-Functional Requirements
- [x] NFR-1: Settings load fast on app start (<100ms)
- [x] NFR-2: Settings save is non-blocking

## Implementation Breakdown

### Planned Tickets

### Completed Tickets
- [[AI-IMP-067]] — Preferences store & export view persistence (prefs.ts, hydration, write-back, initial SettingsView)
- [[AI-IMP-104]] — Settings view redesign + notan cache key fix (lean SettingsView, chart toggles, slider limits, derived notan)

## Notes
Key files:
- `tauri-app/src/lib/stores/prefs.ts` — PrefsV1 schema, LazyStore load/save/reset
- `tauri-app/src/lib/stores/ui.ts` — hydrateFromPrefs, write-back subscriptions, all persisted stores
- `tauri-app/src/lib/views/SettingsView.svelte` — settings-only controls (chart toggles, slider limits, export dir, reset)
- `tauri-app/src-tauri/Cargo.toml` — tauri-plugin-store
- `tauri-app/src-tauri/src/main.rs` — plugin registration

FR-5 (add/replace) is the only open FR — it's an EPIC-010 concern (image library) and can be addressed there when multi-image workflows are finalized.
