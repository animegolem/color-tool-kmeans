# AI-EPIC 
---
node_id: AI-EPIC-007
tags: 
  - EPIC
  - AI
  - tauri
  - ui
  - exports
date_created: 2025-10-10
date_completed: 
kanban-status: backlog
AI_IMP_spawned: 
---

# AI-EPIC-007-tauri-ui-graphs-exports

## Problem Statement/Feature Scope 
Users need a stable, offline desktop experience to load an image, run native analysis, preview cluster outputs, and export circle graphs and palettes per the design system. We have a working native pipeline (AI‑EPIC‑006) but lack the polished UI, diagnostics, a11y, and export parity shown in Figma.

## Proposed Solution(s)
- Finalize HomeView native UX: spinner, native‑mode badge, drag/drop notice, and actionable error toasts.
- Implement GraphsView circle graph to match style‑guide; surface top‑N palette.
- Wire exports (PNG/SVG/CSV) with deterministic outputs and embedded local fonts.
- Persist lightweight preferences (dirs, parameters, last view) with offline compliance.
- Ensure accessibility and basic keyboard shortcuts.

## Path(s) Not Taken
- Multi‑shell support (Electron) — retired by ADR‑002. WASM remains demo‑only.
- Online font/CDN usage — offline only; local assets embedded in bundles/exports.

## Success Metrics
1. HomeView shows native badge and correct spinner behavior on first run; errors surface as toasts/dialogs with remediation.
2. Circle graph renders within budget and matches Figma visuals (axes/labels/stroke/typography).
3. Exports generate deterministic PNG/SVG/CSV for the same inputs across runs, with embedded Fira Sans for SVG.
4. A11y smoke: tab order sensible; overlays have ARIA roles/labels; basic shortcuts work.
5. No runtime network access (verified with offline tooling / code audit).

## Requirements

### Functional Requirements
- [ ] FR-A: Show a “Native mode” badge when Tauri/native is active and disable drag/drop with guidance text.
- [ ] FR-B: Display spinner per spec with threshold to avoid flicker; not visible when analysis < threshold.
- [ ] FR-C: Render circle graph per style‑guide with axis labels; show top‑N palette rail.
- [ ] FR-D: Export circle graph (PNG/SVG) and palette (CSV) with deterministic content and embedded fonts.
- [ ] FR-E: Persist last export dir, parameters, and last tab via `electron-store` equivalent for Tauri (e.g., `tauri-plugin-store`).
- [ ] FR-F: A11y pass: role/label coverage for overlays; keyboard shortcuts for Upload (Ctrl/Cmd+O), Exports (Ctrl/Cmd+E).

### Non‑Functional Requirements
- [ ] NFR-A: No runtime network calls; fonts/assets resolved locally only.
- [ ] NFR-B: Export latency budget: 2k SVG <1s; 2k PNG <2s on baseline host.
- [ ] NFR-C: Determinism: same input → identical SVG/CSV bytes across runs (allowing timestamp-less outputs).

## Implementation Breakdown

### Planned Tickets
- AI-IMP-062: HomeView error propagation, native badge, drag/drop notice (ties to EPIC‑006 FR‑4/FR‑11) 
- AI-IMP-065: Circle Graph renderer parity with Figma + offline font embedding for SVG (FR‑C, FR‑D partial)
- AI-IMP-066: Exports wiring (PNG/SVG/CSV) deterministic outputs + tests (FR‑D)
- AI-IMP-067: Preferences store (dir/params/view) with offline backend (FR‑E)
- AI-IMP-068: Accessibility + keyboard shortcuts (FR‑F)

### Completed Tickets

## Future Follow‑up
- Consider a minimal “Overview” composite export after graph/export parity is stable.
