---
node_id:
  - epic: AI-EPIC-004
tags:
  - EPIC
  - Electron
  - Wasm
  - Rust
  - Svelte
  - Desktop
  - Performance
  - Offline
date_created: 2025-09-25
date_completed: 2025-09-29
kanban-status: completed 
AI_IMP_spawned: 6
---

# AI-EPIC-004-electron-wasm-pivot

## Problem Statement/Feature Scope
Native Wayland via Tauri/GTK is not reliable on stock Fedora (and other environments) due to GBM/DMA‑BUF initialization failures in WebKitGTK; disabling DMA‑BUF opens a window but degrades rendering quality. We need a desktop shell that avoids this class of GPU/Compositor issues, ships consistently across Linux/Windows (macOS later), and preserves the Rust compute core and Svelte 5 UI work.

## Proposed Solution(s)
Pivot the shell from Tauri to Electron while reusing:
- Rust compute core compiled to WebAssembly (wasm-bindgen / wasm-pack).
- Existing Svelte 5 renderer and stores (runes), unchanged.
- Current IPC/result contract (clusters[], iterations, durationMs, totalSamples).

Electron (Chromium) provides a stable GPU stack on Wayland/X11 and Windows. We expose the compute via a wasm bridge callable from the renderer, maintaining the same user experience and benchmarks. Packaging targets AppImage and Windows portable; DMG later.

## Success Metrics
- App launches and renders correctly on stock Fedora Wayland and Windows 11 without environment variables or degraded rendering.
- Performance parity: compute path (wasm) P50 ≤ 400 ms, P95 ≤ 800 ms for K=300 on reference samples (native Rust worker still used for bench/CLI).
- Packaging sizes: ≤ 90 MB Windows portable, ≤ 120 MB AppImage (approx.).
- No GPU- or compositor-specific instructions required in README to start the app.

## Requirements

### Functional Requirements
- [x] FR-1: Build Rust compute core to wasm module with JS wrappers for `analyzeImage(params)` → `{ clusters[], iterations, durationMs, totalSamples }`.
- [x] FR-2: Electron shell hosting the existing Svelte renderer; preload isolates access to fs only for file open/save dialogs.
- [x] FR-3: File open dialog + drag/drop wiring to feed wasm pipeline.
- [x] FR-4: Graphs/palette views driven by wasm results; exports (PNG/SVG/CSV) implemented in Chromium canvas/SVG.
- [x] FR-5: Preferences stored locally (no telemetry).

### Non-Functional Requirements
- Cross‑platform: Linux AppImage, Windows portable first; macOS later.
- Security: contextIsolation true; no remote code; wasm sandboxed.
- Offline‑only: no network access at runtime.
- Determinism: identical results across OS for seeded runs.

## Implementation Breakdown
- IMP-041-wasm-build-of-compute-core — wasm-bindgen wrapper + build scripts.
- IMP-042-electron-shell-scaffold — main/preload/renderer setup; isolation; packaging.
- IMP-043-renderer-bridge-to-wasm — replace Tauri IPC with wasm bridge; keep Svelte 5 UI and stores.
- IMP-044-exports-on-chromium — PNG/SVG/CSV exports using canvas/SVG APIs.
- IMP-045-ci-and-packaging — GitHub Actions building Linux/Windows artifacts; size checks.
- IMP-046-bench-wasm-variant (optional) — small harness to compare wasm vs native for sanity.

## Notes & Migration
- Survives as‑is: compute core (SIMD SoA), benchmark harness, fidelity metrics, Svelte 5 upgrade and stores.
- Replace: Tauri IPC and WebKit shell → Electron + wasm.
- Remove/Archive: Wayland environment notes and DMA‑BUF workarounds; Tauri plugins.

