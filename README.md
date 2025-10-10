## Color Tool — Native K‑Means Palette Analyzer (Tauri)

Desktop tool for analyzing images and extracting color palettes with K‑Means. The app runs natively via Tauri (Rust + WebView), with a Svelte 5 UI and offline‑friendly exports.

**Why Tauri**
- Native file I/O and compute with Rust, better perf vs. browser/WASM.
- Small bundles and solid offline story (no CDNs, local fonts only).

**Current Status (October 2025)**
- Tauri native path is stable in dev: image selection, native analysis, and top‑8 cluster preview render in the UI.
- Bridges are async‑ready and self‑diagnosing; invoke logging pinpoints the active path.
- Response validation guards native results (typed errors instead of silent zeros).
- In progress: error surfacing UX, dev diagnostics banner, graph/exports parity with Figma.

## Quick Start

Prereqs
- Node 18.20.8, Rust (stable), and the Tauri CLI (`npm i -g @tauri-apps/cli`)
- Linux/NVIDIA note: for packaged runs set `WEBKIT_DISABLE_DMABUF_RENDERER=1` (see Troubleshooting)

Dev Run
```
cd tauri-app
npm ci
npm run tauri dev
```

Packaged Build
```
cd tauri-app
npm run build           # build renderer
npm run tauri build     # bundle native app
```
Linux (Wayland/NVIDIA) first‑run stability:
```
WEBKIT_DISABLE_DMABUF_RENDERER=1 ./src-tauri/target/release/tauri-app
```

Fonts (offline)
- We vendor Fira Sans locally. If fonts are missing at runtime, run:
```
cd tauri-app && bash scripts/fetch-fira.sh
```

## What You Can Do Today
- Upload an image (native file dialog) and see the native analysis with the top clusters.
- Tweak parameters (K, stride, min lum, space) and re‑run analysis.
- Inspect bridge selection and env in the console (dev banner + `[tauri-invoke]` logs).

## Roadmap (Focused)
- Home UX polish: native‑mode badge, clearer drag/drop copy, actionable error toasts.
- Dev diagnostics: one‑time detection banner, force‑override warning, DevTools hotkey.
- Circle graph render (Figma parity) and palette rail.
- Exports: Circle PNG/SVG and palette CSV with embedded fonts; deterministic bytes.
- Preferences: last dir/parameters/view via Tauri store; no telemetry.
- Accessibility: overlay roles/labels, keyboard paths for Upload/Export.

See RAG epics/tickets for live status:
- `RAG/AI-EPIC/AI-EPIC-006-tauri-bridge-reliability-and-native-mode-fixes.md`
- `RAG/AI-EPIC/AI-EPIC-007-tauri-ui-graphs-exports.md`
- Recent work logs under `RAG/AI-LOG/`.

## Architecture (Short)
- Renderer (Svelte 5): `tauri-app/src` (Home, Graphs, Exports views).
- Bridges: `tauri-app/src/lib/bridges/` select FS/compute at first use; Tauri is preferred when present.
  - Diagnostics: `[tauri-invoke]` logs which resolver handled a command.
  - Validation: native compute responses are schema‑checked; errors become typed `TauriComputeError`s.
- Native (Rust): `tauri-app/src-tauri/src/main.rs`
  - Commands: `open_image_dialog`, `analyze_image` (sampling → k‑means → palette).

## Repository Structure
- `tauri-app/` — Tauri desktop app (renderer + Rust); main development target
- `figma/` — exported frames/assets (source of UI truth)
- `RAG/` — epics, implementation tickets, and session logs
- `archive/` — legacy or experimental code (e.g., Electron app, WASM compute)

## Troubleshooting
- “Could not connect to localhost” in packaged debug: start the dev server (`npm run dev`) or use the release bundle.
- Linux/NVIDIA crash on first run: use `WEBKIT_DISABLE_DMABUF_RENDERER=1` (and optionally `GDK_BACKEND=x11`).
- Forcing native path: in DevTools, `localStorage.setItem('bridge.force', 'tauri'); location.reload();`

## Credits
- K‑Means core, color conversions, and sampling are adapted from prior work in this repository’s Rust modules (`color.rs`, `kmeans.rs`, `image_pipeline.rs`).
- Attributions are listed in `ATTRIBUTIONS.md`.

## License
MIT — see `LICENSE`.
