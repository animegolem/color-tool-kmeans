---
node_id: AI-IMP-051
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Bridge
  - Epic-005
kanban_status: planned
depends_on: [AI-EPIC-005, AI-IMP-041, AI-IMP-042, AI-IMP-043, AI-IMP-044]
confidence_score: 0.86
created_date: 2025-09-29
close_date:
---

# AI-IMP-051-shell-agnostic-compute-and-fs-bridges

## Summary of Issue #1
Define shell-agnostic bridges for compute and file I/O so Svelte views do not import Electron/Tauri/wasm specifics. Provide `computeBridge` (analyzeImage) and `fsBridge` (openFile/saveBinary/saveText) with adapters for Electron preload and wasm+browser. Done when views call only the bridges and both adapters work in dev.

### Out of Scope 
- Performance tuning of compute (handled by other tickets).
- New UI surfaces; this is wiring/abstraction only.

### Design/Approach  
- Define TS interfaces under `src/lib/bridges/` and provide two adapters: `electron` (preload IPC) and `wasm` (current module wrapper + DOM file picker).
- Provide a `selectBridge()` factory that picks Electron if `window.electronAPI` is present, else falls back to wasm+browser.
- Keep parameter/result shapes identical to prior IPC; add light runtime guards.

### Files to Touch
- `tauri-app/src/lib/bridges/compute.ts`: interface + factory.
- `tauri-app/src/lib/bridges/fs.ts`: interface + factory.
- `tauri-app/src/lib/compute/bridge.ts`: refactor to implement `computeBridge`.
- `tauri-app/src/lib/views/*`: replace direct imports with bridge calls (minimal edits).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add `ComputeBridge`/`FsBridge` interfaces and factories.
- [x] Implement Electron adapter (uses `window.electronAPI`).
- [x] Implement wasm+browser adapter (current wasm wrapper + DOM file input + download fallback).
- [x] Swap Home/Exports/Graphs to call bridges only.
- [ ] Smoke test in Electron and browser dev; log adapter choice.

### Acceptance Criteria
GIVEN the renderer runs in Electron and in the browser dev server
WHEN the user loads an image and exports files
THEN analysis succeeds and exports are written using the active bridge implementation with identical result shapes.

### Issues Encountered 
- None yet — plan includes wiring Zod-based schema validation alongside the bridges to harden cross-shell payloads.
