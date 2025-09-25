# AI-EPIC 
---
node_id:
  - figma: My07xcwuyW4N03cbwWHjM5
  - home_onboot: "2:5054"
  - home_dragdrop: "2:4910"
  - home_loaded: "2:4664"
  - graphs: "3:298"
  - exports: "3:282"
tags: 
  - EPIC
  - AI
  - Tauri
  - Rust
  - Svelte
  - Desktop
  - Performance
  - Offline
date_created: 2025-09-21
date_completed: 2025-09-25
kanban-status: Cancelled
AI_IMP_spawned: 5
---

# AI-EPIC-002-tauri_rust_compute_pivot

## Problem Statement/Feature Scope 
The Electron/JS worker prototype does not meet interactivity needs: K≈300 on 12–24 MP images takes seconds, causing a poor user experience. The UI also inherits brittle drag‑and‑drop/open flows from an older web app. We need a fast, reliable, offline desktop application with consistent file handling and export features across Linux/Windows (macOS later).

## Proposed Solution(s) 
Build a Tauri desktop app with a Rust compute core and a Svelte UI. The Rust core performs image decode/downscale, pixel sampling, color‑space transforms (RGB/HSL/YUV/LAB/LUV), and k‑means (k‑means++ init, warm‑starts, optional mini‑batch) using rayon for parallelism. The UI (Svelte) mirrors the Figma flows (on‑boot, drag‑drop, manual Open, graphs/exports) and reuses our canvas/SVG renderers for the polar chart and palette bar. Exports (PNG/SVG/CSV) remain client‑side and deterministic. Preferences (export dir, last settings) persist via Tauri storage. Packaging targets AppImage and Windows portable first; DMG later.

## Path(s) Not Taken 
- Continuing in Observable/JS compute only (fails latency target).
- Electron + Node for native modules (heavier runtime, larger artifacts).
- GPU/WebGL rewrite of k‑means (complexity not justified initially).
- Mobile/web deployment (offline desktop is the requirement).

## Success Metrics 
- P50 recompute ≤150 ms and P95 ≤300 ms for K=300 with capped samples on reference hardware by beta.
- Export success rate ≥99% (PNG/SVG/CSV) across Linux/Windows by RC.
- App cold start ≤1.5 s; drag‑drop or File→Open to first result ≤500 ms for typical images.
- Package sizes: ≤25 MB Windows portable, ≤15 MB AppImage (approx.)

## Requirements

### Functional Requirements
- [ ] FR-1: Open images via File→Open and drag‑drop; support common formats (PNG/JPEG/WebP, large JPGs).
- [ ] FR-2: Rust command `analyze_image` computes clusters with params {K, stride, minLum, space, tol, maxIter, seed, maxSamples}.
- [ ] FR-3: Return clusters [{count, share, rgb, hsv, centroidSpace}], iterations, durationMs.
- [ ] FR-4: Polar chart render with HSL/HLS axes, labels, stroke toggle, symbol scale.
- [ ] FR-5: Palette bar render with sort by hue/share asc/desc.
- [ ] FR-6: Exports: circle graph PNG/SVG, palette PNG/SVG, palette CSV (rank, space c1..c3, r,g,b, hex, pixels, share).
- [ ] FR-7: Overview composite export (image + circle + right rail list).
- [ ] FR-8: Preferences: last export dir, last params, active tab.
- [ ] FR-9: Errors for unsupported/huge files; graceful degradation via adaptive sampling.
- [ ] FR-10: i18n‑ready strings (EN at launch).

### Non-Functional Requirements 
- Performance: meet the above latency budgets with warm‑starts and adaptive sampling.
- Cross‑platform: Linux AppImage, Windows portable; macOS DMG later.
- Security: no network at runtime; Tauri isolation; validate file paths.
- Footprint: small binaries; no remote fonts/CDNs (local Fira Sans).
- Determinism: same inputs produce identical outputs across OS.
- Accessibility: keyboard navigation; adequate contrast; font sizes per Figma.

## Implementation Breakdown 
- IMP-011: Scaffold Tauri + Svelte app (Vite, routing, Fira Sans, base pages).
- IMP-012: Rust crate for image decode/downscale + stride/reservoir sampling.
- IMP-013: Rust color‑space conversions (RGB/HSL/YUV/LAB/LUV) with tests.
- IMP-014: Rust k‑means core (k‑means++, warm‑start, mini‑batch, rayon).
- IMP-015: Tauri commands + IPC contract; JSON schema and error mapping.
- IMP-016: Svelte components: wrap polar chart/palette; state management; Figma flows.
- IMP-017: Exports wiring (SVG/PNG/CSV) + file dialogs + prefs.
- IMP-018: Packaging for Linux AppImage and Windows portable; app icons.
- IMP-019: Perf/QA pass with synthetic + real images; benchmark report.
- IMP-020: macOS DMG follow‑up (optional after parity).
