# Electron Shell Scaffold

## Overview
This package hosts the Electron wrapper for the color abstraction desktop app. It uses `electron-vite` to bundle the main, preload, and renderer processes and `electron-builder` to produce distributable artifacts (Linux AppImage, Windows portable). The renderer is a Svelte 5 app that will be wired to the wasm compute bridge in follow-up tickets.

## Prerequisites
- Node.js ≥ 18.20.8
- npm ≥ 9 (pnpm/yarn also work if aligned with the repo tooling)
- `wasm-pack` (only required when working on the wasm compute layer)

Install dependencies:

```bash
cd electron-app
npm install
```

## Development

The dev command compiles main/preload bundles, starts the Svelte renderer with Vite HMR, and launches Electron in dev mode with `contextIsolation` enabled.

```bash
npm run electron:dev
```

- Renderer dev server: http://127.0.0.1:5175 (same port enforced in production build)
- Dev tools: automatically opened; use the **View → Toggle Developer Tools** menu to close

## Production Build

Bundle and package release artifacts:

```bash
npm run electron:build
```

Outputs land in `electron-app/release/`:
- Linux: `.AppImage`
- Windows: portable `.exe`

The intermediate bundles (`dist/`) are retained for inspection.

## Security Defaults
- `contextIsolation: true`, `nodeIntegration: false`, no remote modules.
- Preload exposes only `openFile()` / `saveFile()` via `contextBridge`.
- CSP is inherited from the generated `index.html`; update before shipping to production.
- All compute happens in-process; network access remains disabled unless explicitly added.

## Next Steps
- IMP-043 wires the renderer to the wasm compute bridge (`analyzeImage` contract).
- IMP-044 adds export surfaces (PNG/SVG/CSV) using Chromium canvas and renderer helpers.
