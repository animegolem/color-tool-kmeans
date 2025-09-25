---
node_id:
  - figma: My07xcwuyW4N03cbwWHjM5
tags:
  - EPIC
  - AI
  - Tauri
  - Svelte
  - Rust
  - Performance
  - Figma
date_created: 2025-09-22
date_completed:
kanban-status: In-Progress
AI_IMP_spawned: 10
---

# AI-EPIC-003-ui-integration-and-perf-phase

## Problem Statement/Feature Scope 
The pivot to Tauri + Rust is underway, but the renderer still mixes pre‑Svelte‑5 syntax and lacks finalized UI states from Figma. Compute exists for sampling only; k‑means and color conversions are incomplete, and we don’t yet have a measured path to the ≤150 ms P50 target for K≈300. We need to lock UI conventions, wire IPC, and stand up a performance‑focused compute path (native or crate‑backed) with deterministic outputs.

## Proposed Solution(s) 
Deliver a Svelte 5–based UI using semantic tokens sourced from Figma snapshots and implement Home/Graphs/Exports flows exactly as designed, including drag overlays, loading/error states, and export cards. Expose a stable `analyze_image` Tauri command and integrate it with UI thresholds (spinner >150 ms). Implement the Rust compute stack (color conversions + k‑means with warm‑starts and optional rayon) or adopt a vetted crate if it proves faster without sacrificing determinism. Add a benchmark harness and document results against the prior JS baseline.

## Path(s) Not Taken 
- Shipping Svelte 4 patterns in new UI work (migrates to Svelte 5 runes).
- Network services or remote fonts (offline only).
- GPU rewrite at this stage (re‑evaluate post‑MVP if CPU misses targets).

## Success Metrics 
- Latency: P50 ≤150 ms, P95 ≤300 ms for K=300 with adaptive sampling on reference images by RC.
- UI: All P0 overlays/states implemented and visually matched to Figma (delta ≤2 px, 120–160 ms fades) by beta.
- Tooling: Pre‑commit/CI guards reject legacy `on:` syntax; build and `svelte-check` green on main.
- Exports: ≥99% success on Linux/Windows for overview + circle + palette by RC.

## Requirements

### Functional Requirements
- [x] FR-1: Lock design via Figma snapshot + manifest with node IDs, sizes, checksums.
- [x] FR-2: Provide semantic tokens CSS and adopt in app shell, sliders, scrollbars.
- [x] FR-3: Enforce Svelte 5 runes and event syntax; add guard for `on:` DOM events.
- [ ] FR-4: Home overlays: drag fade overlay (drop anywhere), thresholded loading spinner (>150 ms), blocking error (decode/unsupported), multi‑file notice.
- [ ] FR-5: IPC `analyze_image(params)`; unify UI state transitions; debounce rapid param changes.
- [ ] FR-6: Graphs view placeholder -> real data: polar chart + palette rail; eyedropper active across image/graph; wheel zoom + drag pan.
- [ ] FR-7: Exports view states: invalid dir, saving (spinner), saved confirmation with “Open folder”, write failure.
- [x] FR-8: Performance harness (Criterion or manual) comparing: JS baseline vs. Rust native vs. crate option(s); record determinism.
- [x] FR-9: Crate evaluation: `kmeans` vs. `kmeans_colors` vs. in‑house; document trade‑offs (speed, determinism, init, warm‑starts, color space handling). Gate adoption by tests.
- [ ] FR-10: Preferences: last export dir, last params, active tab; no telemetry.

### Non-Functional Requirements 
- Performance: meet latency targets with warm‑starts/adaptive sampling.
- Determinism: identical outputs across OS; seeded k‑means results stable.
- Security: no network at runtime; strict Tauri isolation and input validation.
- Accessibility: focus‑visible, keyboard navigation, contrast via tokens.
- Footprint: small binaries; local fonts only; no heavy deps without value.

## Implementation Breakdown 
- AI-IMP-021-svelte5-upgrade-ui-runes-and-tooling — completed (toolchain + guards in place).
- AI-IMP-022-figma-snapshot-and-icons-inventory — completed (manifest + inventory + refreshed frames).
- AI-IMP-023-home-overlays-and-states — in‑progress (drag fade, loading threshold, notice/error overlays).
- AI-IMP-024-exports-states-wiring — planned (invalid dir, saving, saved, failure).
- AI-IMP-025-ipc-analyze-image-and-ui-integration — completed (IPC + preview wiring).
- AI-IMP-026-graphs-polar-and-palette-integration — planned (data wiring + basic interactions, eyedropper hook).
- AI-IMP-027-rust-color-conversions-and-tests — planned (depends on EPIC‑002 IMP‑013; integration here).
- AI-IMP-028-kmeans-core-or-crate-adoption — planned (compare in‑house vs `kmeans`/`kmeans_colors`; add warm‑start; optional rayon).
- AI-IMP-029-perf-harness-and-benchmark-report — planned (JS baseline vs Rust variants; report + defaults tuning).
- AI-IMP-030-preferences-and-packaging-polish — planned (export dir, params, AppImage/Windows portable notes).
