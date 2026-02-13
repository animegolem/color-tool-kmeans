# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Color analysis tool using k-means clustering. Primary implementation:
- **Tauri app** (`tauri-app/`) — native desktop app (Svelte 5 + Rust)

## Core Architecture

### Tauri App (Primary Implementation)

**App Shell** (`tauri-app/src/App.svelte`):
- CSS Grid layout: left nav + header bar + view-container + library rail (right sidebar)
- Grid columns: `var(--nav-width) 1fr var(--library-width)` with CSS var transitions for collapse/expand
- Header bar spans columns 2-3, contains: left sidebar toggle, view title, file label + Clear, right sidebar toggle
- Left nav: 200px collapsible via `navCollapsed` store, routes between Colors/Values/Exports views
- Library rail: toggleable right sidebar for image library (placeholder content), auto-collapses <980px
- ZoomOverlay: modal pan/zoom for images and SVG charts

**Views** (`tauri-app/src/lib/views/`):
- `HomeView.svelte` — orchestration shell (~600 LOC): wires submodules, owns lifecycle/store subscriptions, renders layout with subcomponents
- `ValuesView.svelte` — value/lightness analysis with multi-level k-means bucketing (~700 LOC)
- `ExportsView.svelte` — SVG/PNG/CSV export UI (~300 LOC)

**HomeView Submodules** (`tauri-app/src/lib/views/home/`):
- `video-controller.svelte.ts` — video state, playback, scrubbing, frame decode, strip generation, probe logic
- `analysis-runner.svelte.ts` — analysis debounce, spinner lifecycle, error mapping, scroll lock
- `file-ingestion.svelte.ts` — file dialog, drag-drop, image decoding, preview URL building
- `VideoPanel.svelte` — video preview + transport controls + filmstrip
- `AnalysisCards.svelte` — histogram + polar + hue-lightness chart cards (conditionally rendered)
- `ParameterControls.svelte` — k-means parameter sliders and checkboxes
- `DevBanner.svelte` — development-mode Tauri detection summary

**Utilities** (`tauri-app/src/lib/utils/`):
- `zoom.ts` — shared `openImageZoom`, `openSvgZoom`, `handleZoomKeydown` (used by HomeView and ValuesView)

**Stores** (`tauri-app/src/lib/stores/ui.ts`):
- **Navigation**: `currentView`, `libraryDrawerOpen`, `navCollapsed`
- **Image management**: `images` (array), `activeImageId`, `selectedFile` (derived), `hasFile` (derived)
- **Analysis params**: `params` (clusters, quality, ignoreTopN, mergeThreshold, symbolScale, chart options)
- **Color analysis**: `analysisState`, `analysisById` (cached by image ID), `analysisResult` (derived), `analysisError`
- **Value analysis**: `valueAnalysisLevels`, `valueAnalysisNotanMode`, `valueAnalysisByKey` (cached by composite key), derived state/result/error
- **Zoom overlay**: `zoomOverlay`, `openZoomOverlay`, `closeZoomOverlay`
- **Video**: `videoState`, `setVideoState`

**Components** (`tauri-app/src/lib/components/`):
- `ZoomOverlay.svelte` — pan/zoom modal for images and SVG charts

**Bridges** (`tauri-app/src/lib/bridges/`):
- `tauri.ts` — native Tauri API detection/invocation
- `compute.ts` — compute backend selection (native-only)
- `fs.ts` — filesystem abstraction (image + video file dialogs)
- `video.ts` — video frame extraction, strip generation, probing (via ffmpeg)
- `ffmpeg.ts` — ffmpeg version check
- `log.ts` — event logging bridge
- `value-analysis.ts` — value/lightness analysis Tauri bridge
- `value-study.ts` — legacy value study Tauri bridge (unused, retained for backend compatibility)

**Compute** (`tauri-app/src/lib/compute/`):
- `bridge.ts` — routes to native (`analyze_image` command)
- `image-loader.ts` — image decode with HTMLImage fallback

**Exports** (`tauri-app/src/lib/exports/`):
- `polar-chart.ts` — OKLCH/OKHSV/HSV polar chart SVG generation
- `hue-lightness.ts` — hue x lightness scatter SVG
- `histogram.ts` — cluster histogram SVG
- `value-analysis.ts` — value analysis export
- `value-study.ts` — legacy value study export
- `palette.ts`, `svg.ts`, `png.ts`, `font-embed.ts` — shared export utilities

**Assets** (`tauri-app/src/lib/assets/`):
- Sidebar toggle SVG icons (VS Code Codicons, CC BY 4.0)

**Native Backend** (`tauri-app/src-tauri/src/`):
- `lib.rs` — core module exports
- `kmeans.rs` — k-means clustering (SIMD-enabled via `wide` feature)
- `color.rs` — OKLab/OKLch color space conversions (perceptual)
- `image_pipeline.rs` — image sampling and analysis entry point
- `main.rs` — Tauri commands: `analyze_image`, `open_image_dialog`
- `value_analysis.rs` / `value_study.rs` — value/lightness analysis
- `ffmpeg.rs` — video frame extraction via ffmpeg CLI
- **Binaries** (`bin/`) — CLI tools: `compute_cli`, `kmeans_baseline`, `rmpc_theme_gen`, `bench_runner`

**Key Design Pattern**: Detection-based bridge selection. Native Tauri API required. Force native with `localStorage.setItem('bridge.force','tauri')`.

## Development Commands

### Tauri App (Primary Workflow)

```bash
cd tauri-app

# Development (launches Vite automatically)
npm run tauri dev

# Build renderer + package
npm run build
npm run tauri build              # release bundle
npm run tauri build -- --debug   # debug symbols

# Linting & formatting
npm run lint
npm run format
npm run format:check
npm run check        # svelte-check

# Tests
npm run test         # vitest
```

**Environment**: Node 18.20.8

**Linux/NVIDIA/Wayland stability** (required for WebKit crashes):
```bash
WEBKIT_DISABLE_DMABUF_RENDERER=1 npm run tauri dev
# or for packaged binary:
WEBKIT_DISABLE_DMABUF_RENDERER=1 ./src-tauri/target/release/tauri-app
```

### Rust Backend

```bash
cd tauri-app/src-tauri

# Format & lint
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings

# Run CLI tools
cargo run --bin compute_cli -- <args>
cargo run --bin rmpc-theme-gen -- <args>
```

## Git Hooks & CI

Enable hooks once:
```bash
git config core.hooksPath .githooks
```

**Pre-commit**:
- Blocks Svelte `on:` syntax (use runes: `onclick`, `oninput`)
- Runs `format:check` and `lint` if available
- Rust: `cargo fmt --check` and `cargo clippy`
- LOC warning (default 350 lines/file, non-blocking)

**CI**: Strict LOC check. To bypass: commit message `[loc-bypass]` or set `LOC_BYPASS=1` in workflow.

## Code Style

- **Language**: TypeScript/JavaScript + Rust
- **Formatting**: 2-space indent, semicolons, single quotes
- **Naming**:
  - Functions: `camelCase`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE`
  - Files: `kebab-case.ts`, Svelte components: `PascalCase.svelte`
- **Svelte**: Use runes (`$state`, `$derived`, `onclick`) not legacy reactivity/`on:` syntax
- **Font**: Fira Sans (vendor locally, no CDNs)
- **Module extraction pattern**: Use `create*()` factory functions returning reactive objects with `$state` getters/setters for extracting logic from Svelte components (see `views/home/*.svelte.ts`)

## Testing

- **Unit tests**: Vitest, `*.spec.ts` next to source
- **Focus areas**: color conversions, k-means stability, worker contracts, export determinism
- **Manual smoke**: K=300, drag-drop, exports (PNG/SVG/CSV), overview composite on Linux/Windows

## Commits & PRs

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, etc.
- **PRs must include**:
  - Description with Epic/IMP IDs (`RAG/AI-EPIC/*`, `RAG/AI-IMP/*`)
  - Screenshots/GIFs for UI changes
  - OS + brief test log
  - Update relevant checklists in `RAG/AI-IMP/*`

## Project Documentation

- **Epics**: `RAG/AI-EPIC/` — active: EPIC-010 through EPIC-014; completed: EPIC-006 through EPIC-009, EPIC-015 through EPIC-019 (archived in `RAG/AI-EPIC-ARCHIVED/`)
- **Tickets**: `RAG/AI-IMP/` — implementation checklists & acceptance criteria
- **Design**: `figma/` — exported frames; reference designs in `RAG/assets/`
- **Logs**: `RAG/AI-LOG/` — development session notes
- **Runbooks**: `TAURI-NATIVE-RUNBOOK.md` — Tauri-specific troubleshooting

## Known Tech Debt

- **Legacy bridge**: `bridges/value-study.ts` and `exports/value-study.ts` are unused by the renderer but retained for backend compatibility. The backend `value_study` Tauri command still exists.

## Key Technical Notes

### Tauri-Specific Issues (see `TAURI-NATIVE-RUNBOOK.md`)
- Native analysis requires filesystem path — Upload button preferred over drag-drop
- Dev sessions may not inject Tauri API globals; force with `localStorage.setItem('bridge.force','tauri')`
- Packaged debug builds default to `devUrl` — run Vite first or use release bundle

### Security (Tauri)
- IPC bridge only; load local files via `file://`
- No secrets in commits; Figma tooling uses `FIGMA_API_KEY` env var

### Offline-First
All runtime dependencies must be vendored. No CDN fonts, no network requests at runtime.
