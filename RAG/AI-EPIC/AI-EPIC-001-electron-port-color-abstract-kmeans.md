# AI-EPIC 
---
node_id:
  - figma: My07xcwuyW4N03cbwWHjM5
  - graphs: "3:298"
  - exports: "3:282"
  - home_onboot: "2:5054"
  - home_dragdrop: "2:4910"
  - home_loaded: "2:4664"
tags:
  - EPIC
  - AI
  - Electron
  - Color-Analysis
  - KMeans
  - Figma-UI
  - Linux
  - Windows
  - Offline
  - Performance
date_created: 2025-09-20
date_completed:
kanban-status: Planned
AI_IMP_spawned: 4
---

# AI-EPIC-001-electron_port_color_abstract_kmeans

## Problem Statement/Feature Scope 
The current color-analysis workflow lives in an Observable notebook that is slow (>60s recompute), awkward to use, and online-bound. Users need a fast, offline desktop app for Linux and Windows to analyze images, visualize polar color distributions, curate palettes, and export assets (PNG/SVG/CSV/overview) reliably. The tool must tolerate large images and high cluster counts while remaining responsive and self-contained.

## Proposed Solution(s) 
Ship a local Electron application that:
- Loads images via drag‑drop or file dialog and renders a 2D polar symbols chart with adjustable axes (HLS/HSL), labels, and stroke.
- Computes k‑means (K up to ~400) across RGB/HSL/YUV/CIELAB/CIELUV using a Web Worker with typed arrays, centroid warm‑starts, and stride/downscale controls.
- Presents a palette “barcode”/bar graph with live sorting (by hue or pixel share asc/desc) and copyable color values (RGB/HEX/space‑specific).
- Exports: circle graph (PNG/SVG), bar graph (PNG/SVG), palette CSV, and an Overview composite (image + polar chart + right rail list), matching Figma.
- Persists light preferences (last export dir, sampling/K, active tab) via electron‑store; no telemetry and no network at runtime.
- Packages for Linux (AppImage) and Windows (portable .exe); DMG is a follow‑on once core is stable.
If JS performance is insufficient for extreme cases, replace the worker’s core with a Rust/WASM module behind the same message contract.

## Path(s) Not Taken 
- Keeping the Observable runtime as the execution engine.
- Web-hosted/cloud service; offline operation is mandatory.
- 3D visualization features from the prior app.
- GPU/WebGL k‑means rewrite at initial release.
- Mobile apps or live camera capture workflows.

## Success Metrics 
- P50 recompute latency ≤150 ms for K=300 on typical 12–24 MP JPEGs on mid‑range CPUs (Linux/Windows) by public beta.
- P95 memory usage ≤1.5 GB under extreme settings; typical steady‑state ≤1.0 GB.
- Export success rate ≥99% across PNG/SVG/CSV/Overview on Win10/11 and Ubuntu/Fedora by RC.
- Cold start ≤2.0 s; drag‑drop file handoff ≤300 ms.
- Zero network requests at runtime (verified in logs/instrumentation).

## Requirements

### Functional Requirements
- [ ] FR-1: Load images via File→Open and drag‑drop anywhere in window.
- [ ] FR-2: Render 2D polar symbols chart (HLS/HSL axes, optional labels/stroke).
- [ ] FR-3: Compute k‑means with K up to 400; default 10; user adjustable.
- [ ] FR-4: Support color spaces: RGB, HSL, YUV, CIELAB, CIELUV (toggle).
- [ ] FR-5: Controls for sampling step, min luminosity, and “main colors excluded”.
- [ ] FR-6: Live updates with centroid warm‑start after control changes.
- [ ] FR-7: Palette bar graph (“barcode”) view with sorting by hue and by share (asc/desc).
- [ ] FR-8: Copy color values (RGB, HEX, and space‑specific triplets) to clipboard.
- [ ] FR-9: Export circle graph to PNG and SVG at chosen scale.
- [ ] FR-10: Export bar graph to PNG and SVG at chosen scale.
- [ ] FR-11: Export palette CSV with columns: rank, space, c1,c2,c3, r,g,b, hex, pixels, share.
- [ ] FR-12: Export Overview composite (image + polar + palette rail) matching Figma.
- [ ] FR-13: Persist last export directory, sampling/K, and current UI tab (electron‑store).
- [ ] FR-14: Localized strings framework (EN at launch; FR ready via keys).
- [ ] FR-15: Error states for unsupported types, oversized images, or memory pressure.
- [ ] FR-16: Keyboard shortcuts: Open (Ctrl/Cmd+O), Export (Ctrl/Cmd+E), Zoom toggle.
- [ ] FR-17: Image zoom/thumbnail behavior per “Image Zoom Workflow”.
- [ ] FR-18: Strict offline mode; no external URLs/CDNs at runtime.
- [ ] FR-19: Deterministic exports across OS given same inputs.
- [ ] FR-20: Diagnostics log for errors only; no telemetry.

### Non-Functional Requirements 
- Performance: ≤150 ms P50 recompute at K≈300; no main‑thread jank.
- Memory: P95 ≤1.5 GB; adaptive stride/downscale when needed.
- Security: `contextIsolation: true`, `nodeIntegration: false`, IPC‑only privileged ops.
- Packaging: AppImage (Linux), portable .exe (Windows); DMG as follow‑up.
- Accessibility: Keyboard focus order; contrast adheres to design palette.
- Portability: Fully self‑contained; no remote assets or system libs required.
- Licensing: New code under ISC; upstream content retains original licenses with attribution.
- Code quality: JS/TS 2‑space + semicolons; repo ESLint/Prettier configs.
- Observability: Minimal debug toggles; perf overlay available in dev builds only.

## Implementation Breakdown 
- AI-IMP-001: Worker compute pipeline (image decode, sample, colorspace, k‑means). See RAG/AI-IMP/AI-IMP-001-worker-compute-pipeline.md
- AI-IMP-002: Polar chart renderer (canvas) with axes/labels/stroke. See RAG/AI-IMP/AI-IMP-002-polar-chart-renderer.md
- AI-IMP-003: Palette bar graph with sorting + interactions. See RAG/AI-IMP/AI-IMP-003-palette-bar-graph.md
- AI-IMP-004: CSV export (schema and generation) + copy helpers. See RAG/AI-IMP/AI-IMP-004-palette-csv-export.md
- AI-IMP-005: PNG/SVG export for charts (scaling, DPR, fonts).
- AI-IMP-006: Overview composite export (layout + rendering pipeline).
- AI-IMP-007: Electron shell (menus, dialogs, drag‑drop, IPC, prefs via electron‑store).
- AI-IMP-008: Packaging for Linux AppImage and Windows portable.
- AI-IMP-009: Perf hardening (warm‑starts, iteration caps, adaptive stride/downscale).
- AI-IMP-010: Optional Rust/WASM core behind existing worker contract.
