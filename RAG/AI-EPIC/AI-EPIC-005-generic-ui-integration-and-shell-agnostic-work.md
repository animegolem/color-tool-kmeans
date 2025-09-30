---
node_id:
  - epic: AI-EPIC-005
tags:
  - EPIC
  - UI
  - Shell-agnostic
  - Svelte
  - Electron
  - Tauri
  - Wasm
  - Desktop
date_created: 2025-09-29
date_completed:
kanban-status: Planned
AI_IMP_spawned: 0
---

# AI-EPIC-005-generic-ui-integration-and-shell-agnostic-work

## Problem Statement/Feature Scope
Design and implement the product UI so it is independent of the host shell (Electron, Tauri, browser dev). We need a consistent Svelte 5 experience for loading images, previewing clusters, adjusting parameters, exporting artifacts, and managing preferences, without coupling to any specific IPC/compute transport. This reduces churn while we evaluate runtime options (native vs wasm vs node addon) and ensures progress on user‑visible functionality.

## Proposed Solution(s)
Create a shell‑agnostic renderer layer in Svelte 5 using runes with a narrow bridge boundary for compute, file dialogs, and saves. The renderer runs the same code in three contexts: (1) Electron with preload APIs; (2) browser dev server with mock fallbacks; (3) Tauri (legacy) kept only for reference. UI components (Home, Graphs, Export screens) consume an abstract `computeBridge` and `fsBridge` interface so the host can be swapped without touching views. Preferences are stored locally (renderer) and applied uniformly. Exports use canvas/SVG paths that work in Chromium and fall back in pure browser dev.

## Path(s) Not Taken
- Binding the UI directly to a specific IPC (e.g., Tauri commands) — previously caused churn and blocked dev on platform issues.
- Committing to wasm‑only compute for all OSes before validating performance — current wasm build is scalar and slower; keep options open.

## Success Metrics
- P50 interactive preview in the renderer ≤ 400 ms on bench images using current compute path (native or wasm preview caps). Measured weekly.
- Exports (PNG/SVG/CSV) deterministic content across OS (hash/size within tolerance) for a fixed seed — checked in CI on every PR.
- Zero shell‑specific imports in view components (enforced by a simple grep rule) — 100% compliance.

## Requirements

### Functional Requirements
- [ ] FR‑1: Image load via drag‑drop and file picker; show preview banner and selected filename.
- [ ] FR‑2: Parameters panel (K, stride, minLum, space, axis, symbol scale) with debounced compute.
- [ ] FR‑3: Compute bridge abstraction with two adapters: wasm (renderer) and native (Electron/CLI or addon). Same JSON contract.
- [ ] FR‑4: Preview surface with cluster list, basic metrics (ms, iterations, samples), and error overlays.
- [ ] FR‑5: Exports — circle graph PNG/SVG, palette CSV — using shared helpers; progress and success/error toasts.
- [ ] FR‑6: Preferences stored locally (theme, default K/stride/space, export scale); loaded at boot.
- [ ] FR‑7: Accessibility — keyboard reachable controls, focus ring, roles/labels on drop target and buttons.
- [ ] FR‑8: Basic unit tests for CSV determinism and bridge wiring stubs; smoke instructions for manual PNG/SVG validation.

### Non-Functional Requirements
- Renderer must run fully offline; no remote URLs/CDNs.
- No shell‑specific code inside Svelte views; use narrow `bridge` modules only.
- Fonts vendored locally; consistent typography across OS.
- CI builds artifacts and runs renderer tests; LOC and lint rules enforced.

## Implementation Breakdown
- IMP‑051: Define `computeBridge` and `fsBridge` TypeScript interfaces; adapters for Electron (preload) and wasm; mocks for browser dev.
- IMP‑052: Home view finalization — drag‑drop, file select, spinner threshold, error flows; parameter store polish.
- IMP‑053: Graphs view polish — axis toggles, symbol scaling, layout verification against tokens.
- IMP‑054: Exports integration — wire buttons to helpers; success/error UI; small CSV/PNG/SVG unit tests.
- IMP‑055: Preferences store (localStorage) — theme + default params; boot apply; minimal UI.
- IMP‑056: A11y pass — roles, labels, and keyboard ops on interactive surfaces.
- IMP‑057: CI renderer checks — `svelte-check`, vitest, LOC/lint gates; artifact attach notes.
(Ticket numbers are tentative; create/close under RAG/AI‑IMP and link back to this epic.)

