---
node_id: AI-IMP-011
tags:
  - IMP-LIST
  - Implementation
  - Tauri
  - Svelte
  - Scaffold
kanban_status: completed
depends_on: [AI-EPIC-002-tauri_rust_compute_pivot]
confidence_score: 0.9
created_date: 2025-09-21
close_date: 2025-09-21
--- 

# AI-IMP-011-tauri-svelte-scaffold

## Summary of Issue #1
We need a clean, cross‑platform desktop foundation for the new app. This task scaffolds a Tauri + Svelte (Vite) project with local Fira Sans fonts, base routes (Home, Graphs, Exports), and shared UI primitives. Outcome: a runnable Tauri dev app (Linux/Windows) that shows the three Figma views with placeholder components and supports drag‑drop and File→Open wiring (no compute yet).

### Out of Scope 
- Rust compute core and IPC commands; exports logic; CSV generation; packaging artifacts.

### Design/Approach  
- Manually scaffold `tauri-app/` (Vite + Svelte + TS) with local assets to work in the restricted environment. Vendor Fira Sans under `src/assets/fonts/` (download script) and load via `@font-face`.
- Build Svelte pages reflecting Figma frames: Home (on‑boot + drag/drop), Graphs, Exports. Add a minimal store for UI params (K, stride, minLum, space, axis type).
- Add drag‑drop and File→Open using Tauri dialog APIs; stash file path in store.
- Establish theming tokens (colors/spacing) that match the design and ensure contrast.

### Files to Touch
- `tauri-app/src/App.svelte`, `src/lib/views/*.svelte`, `src/lib/stores/ui.ts`.
- `tauri-app/src/lib/stores/ui.ts` (params + last file path).
- `tauri-app/tauri.conf.json` (CSP, app metadata, icons placeholder).
- `tauri-app/src/assets/fonts/*` (Fira Sans).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] Initialize `tauri-app/` (Vite + Svelte + TS) scaffold (manual due to offline environment).
- [x] Add Fira Sans via local `@font-face` and helper download script.
- [x] Create stateful nav for Home, Graphs, Exports with shared layout.
- [x] Implement drag‑drop overlay and store dropped file path.
- [x] Wire File→Open via Tauri dialog helper (fallback to `<input type="file">`).
- [x] Add base parameter controls (clusters, stride, etc.).
- [x] Provide placeholder views (graphs/exports) linked to store data.
- [x] Document dev steps in `tauri-app/README.md` including font fetch script.

### Acceptance Criteria
**Scenario: App runs and opens files**
GIVEN a developer runs `tauri dev`
WHEN selecting an image via File→Open or drag‑drop
THEN the filename appears in the Home view and navigation to Graphs/Exports is available (compute disabled).

### Issues Encountered 
- Network access blocked; scaffold built manually and font download provided via helper script instead of running `npm create`. 
