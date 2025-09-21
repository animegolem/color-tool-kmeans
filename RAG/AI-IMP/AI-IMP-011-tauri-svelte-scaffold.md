---
node_id: AI-IMP-011
tags:
  - IMP-LIST
  - Implementation
  - Tauri
  - Svelte
  - Scaffold
kanban_status: planned
depends_on: [AI-EPIC-002-tauri_rust_compute_pivot]
confidence_score: 0.9
created_date: 2025-09-21
close_date:
--- 

# AI-IMP-011-tauri-svelte-scaffold

## Summary of Issue #1
We need a clean, cross‑platform desktop foundation for the new app. This task scaffolds a Tauri + Svelte (Vite) project with local Fira Sans fonts, base routes (Home, Graphs, Exports), and shared UI primitives. Outcome: a runnable Tauri dev app (Linux/Windows) that shows the three Figma views with placeholder components and supports drag‑drop and File→Open wiring (no compute yet).

### Out of Scope 
- Rust compute core and IPC commands; exports logic; CSV generation; packaging artifacts.

### Design/Approach  
- Create `tauri-app/` using `create-tauri-app` (Vite + Svelte + TS). Configure strict CSP, no remote resources. Vendor Fira Sans under `src/assets/fonts/` and load via `@font-face`.
- Build Svelte pages reflecting Figma frames: Home (on‑boot + drag/drop), Graphs, Exports. Add a minimal store for UI params (K, stride, minLum, space, axis type).
- Add drag‑drop and File→Open using Tauri dialog APIs; stash file path in store.
- Establish theming tokens (colors/spacing) that match the design and ensure contrast.

### Files to Touch
- `tauri-app/src/routes/+layout.svelte`, `+page.svelte` (Home), `graphs/+page.svelte`, `exports/+page.svelte`.
- `tauri-app/src/lib/stores/ui.ts` (params + last file path).
- `tauri-app/tauri.conf.json` (CSP, app metadata, icons placeholder).
- `tauri-app/src/assets/fonts/*` (Fira Sans).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Initialize `tauri-app/` (Vite + Svelte + TS) and verify `pnpm|npm run tauri dev` runs.
- [ ] Add Fira Sans locally; confirm no network fonts requested.
- [ ] Create routes: `/` (Home), `/graphs`, `/exports` with nav.
- [ ] Implement drag‑drop overlay per Figma on Home; store dropped file path.
- [ ] Wire File→Open via Tauri dialog; update store.
- [ ] Add base param controls (disabled until compute exists).
- [ ] Add simple e2e smoke task: open image → see filename and preview.
- [ ] Document dev steps in `README.md`.

### Acceptance Criteria
**Scenario: App runs and opens files**
GIVEN a developer runs `tauri dev`
WHEN selecting an image via File→Open or drag‑drop
THEN the filename appears in the Home view and navigation to Graphs/Exports is available (compute disabled).

### Issues Encountered 
To be filled during implementation.

