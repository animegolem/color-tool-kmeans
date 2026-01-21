# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Color analysis tool using k-means clustering. Primary implementation:
- **Tauri app** (`tauri-app/`) — native desktop app (Svelte + Rust)

## Core Architecture

### Tauri App (Primary Implementation)

**Renderer** (`tauri-app/src/`):
- **Bridges** (`lib/bridges/`) — platform abstraction layer
  - `tauri.ts` — native Tauri API detection/invocation
  - `compute.ts` — compute backend selection (native-only)
  - `fs.ts` — filesystem abstraction
- **Compute** (`lib/compute/`) — analysis orchestration
  - `bridge.ts` — routes to native (`analyze_image` command)
  - `image-loader.ts` — image decode with HTMLImage fallback
- **Views** (`lib/views/`) — Svelte UI components
- **Exports** (`lib/exports/`) — PNG/SVG/CSV export logic

**Native Backend** (`tauri-app/src-tauri/src/`):
- `lib.rs` — core module exports
- `kmeans.rs` — k-means clustering (SIMD-enabled via `wide` feature)
- `color.rs` — OKLab/OKLch color space conversions (perceptual)
- `image_pipeline.rs` — image sampling and analysis entry point
- `main.rs` — Tauri commands: `analyze_image`, `open_image_dialog`
- **Binaries** (`bin/`) — CLI tools: `compute_cli`, `kmeans_baseline`, `rmpc_theme_gen`

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
  - Files: `kebab-case.ts`
- **Svelte**: Use runes (`$state`, `$derived`, `onclick`) not legacy reactivity/`on:` syntax
- **Font**: Fira Sans (vendor locally, no CDNs)

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

- **Epics**: `RAG/AI-EPIC/` — active epics (006-009); archived in `RAG/AI-EPIC-ARCHIVED/`
- **Tickets**: `RAG/AI-IMP/` — implementation checklists & acceptance criteria
- **Design**: `figma/` — exported frames (Figma is visual source of truth; fetch updates before UI work)
- **Logs**: `RAG/AI-LOG/` — development session notes
- **Runbooks**: `TAURI-NATIVE-RUNBOOK.md` — Tauri-specific troubleshooting

## Key Technical Notes

### Tauri-Specific Issues (see `TAURI-NATIVE-RUNBOOK.md`)
- Native analysis requires filesystem path → Upload button preferred over drag-drop
- Dev sessions may not inject Tauri API globals; force with `localStorage.setItem('bridge.force','tauri')`
- Packaged debug builds default to `devUrl` → run Vite first or use release bundle

### Security (Tauri)
- IPC bridge only; load local files via `file://`
- No secrets in commits; Figma tooling uses `FIGMA_API_KEY` env var

### Offline-First
All runtime dependencies must be vendored. No CDN fonts, no network requests at runtime.
