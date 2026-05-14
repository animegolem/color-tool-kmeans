---
node_id: ADR-002
tags:
  - architecture
  - tauri
  - ui
status: accepted
depends_on: none
created_date: 2025-10-10
---

# ADR-002-tauri-pivot

## Objective
Adopt a single-shell strategy centered on Tauri (Rust/JS/WebView) for the desktop app, retiring Electron-first assumptions and shell-agnostic bridge goals to reduce complexity and increase reliability.

## Context
Earlier epics pursued shell-agnostic bridges (Electron + WASM) and a generic UI. In practice, reliability issues stemmed from bridge races, API injection timing, and inconsistent dev packaging. The team has validated a stable native path with Tauri after refactors (async-ready bridges, improved detection, and strong diagnostics). Electron-specific work no longer aligns with current goals and adds maintenance overhead.

## Decision
- Standardize on Tauri as the only supported desktop shell.
- Keep WASM path only as a browser/demo fallback; not a primary target.
- Migrate remaining UI/graphs/exports requirements into a dedicated Tauri UI epic (AI-EPIC-007).
- Archive Electron-focused epics; fold any reusable UI requirements into the new epic.
- Strengthen the Tauri runtime with explicit error propagation, typed response validation, and first-class diagnostics.

## Consequences
- Pros: simpler runtime matrix, fewer bridge paths, higher reliability, faster iteration on UI and native compute.
- Cons: reduced portability for Electron, any Electron-only integrations will not be pursued.
- Testing: focused native-mode smoke tests on Linux/Windows; packaged build stability improvements take priority.

## Updates
- AI-EPIC-006 (Tauri reliability) remains active for diagnostics and native hardening.
- New AI-EPIC-007 (Tauri UI, Graphs, Exports) defines the remaining product work.
