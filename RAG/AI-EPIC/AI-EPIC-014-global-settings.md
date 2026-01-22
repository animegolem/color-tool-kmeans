# AI-EPIC
---
node_id: AI-EPIC-014
tags:
  - EPIC
  - AI
  - settings
  - persistence
date_created: 2026-01-22
date_completed:
kanban-status: planned
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
- [ ] FR-1: Settings persist across app restarts
- [ ] FR-2: Default clusters setting (applied on new image)
- [ ] FR-3: Default quality setting
- [ ] FR-4: Default save/export location
- [ ] FR-5: Add/replace behavior setting (for EPIC-010)
- [ ] FR-6: Settings UI (tab or modal)
- [ ] FR-7: Reset to defaults option

### Non-Functional Requirements
- [ ] NFR-1: Settings load fast on app start (<100ms)
- [ ] NFR-2: Settings save is non-blocking

## Implementation Breakdown

### Planned Tickets
(TBD)

### Completed Tickets

## Notes
Key files:
- New: `tauri-app/src/lib/stores/settings.ts`
- `tauri-app/src-tauri/Cargo.toml` - add tauri-plugin-store
- `tauri-app/src-tauri/src/main.rs` - register plugin

Can be worked in parallel with other epics since it's foundational.
