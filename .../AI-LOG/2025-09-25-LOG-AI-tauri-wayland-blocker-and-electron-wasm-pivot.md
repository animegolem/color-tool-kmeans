---
node_id: AI-LOG-2025-09-25-pivot
tags:
  - AI-log
  - development-summary
  - pivot
  - wayland
  - tauri
  - electron
  - wasm
closed_tickets: [AI-IMP-021, AI-IMP-025, AI-IMP-034]
created_date: 2025-09-25
related_files:
  - RAG/AI-EPIC/AI-EPIC-002-tauri-rust-compute-pivot.md
  - RAG/AI-EPIC/AI-EPIC-003-ui-integration-and-perf-phase.md
  - RAG/AI-EPIC/AI-EPIC-004-electron-wasm-pivot.md
  - tauri-app/src/lib/views/HomeView.svelte
  - tauri-app/src/lib/tauri.ts
  - tauri-app/vite.config.ts
  - tauri-app/src-tauri/src/main.rs
confidence_score: 0.86
---

# 2025-09-25-LOG-AI-tauri-wayland-blocker-and-electron-wasm-pivot

## Work Completed
- Upgraded the renderer to Svelte 5 (runes), added guards, and rewired IPC to a clean contract. Fixed a number of Svelte a11y and compile issues and stabilized the dev server.
- Implemented Tauri IPC returning real compute results; added browser‑only mocks for pure UI development.
- Investigated Wayland crashes on stock Fedora: window killed before app init due to WebKitGTK DMA‑BUF/GBM failure. Verified fallback (`WEBKIT_DISABLE_DMABUF_RENDERER=1`) opens a degraded window.
- Concluded native Wayland via WebKitGTK is not viable for our release target; created a new epic to pivot to Electron + wasm while preserving Rust compute and the Svelte UI.
- Opened implementation tickets for wasm build, Electron shell, renderer bridge, exports, CI/packaging, and a small wasm vs native bench.
- Marked Tauri epics as Cancelled (for history) and tagged Tauri-specific IMPs as deprecated.

## Session Commits
- Svelte 5 migration, IPC wiring, and fixes: `18f1ff8`, `ef37238`, `8a431ee`, `ee71ebd`, `bb82c62`, `78a7cef`, `bc8d784`, `d83e32f`.
- Tauri dev ergonomics and cleanup: `7011425` (default-run, svelte config), `78a7cef` (vite optimize exclude).
- New epic and tickets; deprecations and cancellations: `e037546`.

## Issues Encountered
- Native Wayland window fails with `Failed to create GBM buffer` and `Protocol error dispatching to Wayland display`; this occurs before app init. Disabling DMA‑BUF opens a window but produces unacceptable rendering quality.
- We confirmed this is environmental (WebKitGTK/GBM path) and not a code compile/runtime issue in our repo. Expectation is that other stock distros/GPUs may also hit this; we will not ship with env var workarounds or XWayland dependency.
- Decision: pivot to Electron shell and wasm compute to avoid this class of failures while maintaining performance and portability.

## Tests Added
- No new automated tests in this session; focus was on stabilization and environment investigation. Bench harness remains available; a wasm vs native mini‑bench is planned under IMP‑046.

## Next Steps
- Execute Epic‑004:
  - Start with IMP‑041 (wasm build of compute core), then IMP‑042 (Electron shell), and IMP‑043 (renderer bridge).
  - Keep UI iteration in the browser while scaffolding Electron; once the shell is stable, wire exports (IMP‑044) and CI (IMP‑045).
- Reassess performance once wasm is live; if single‑threaded wasm misses targets, consider enabling Wasm threads (COOP/COEP) in Electron, or evaluate a native addon as a follow‑up.

