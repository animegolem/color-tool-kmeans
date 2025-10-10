---
title: Tauri Native — Dev/Packaged Runbook and Findings
date: 2025-10-07
owners: app, compute
status: draft
---

Summary
- Goal: run the UI natively under Tauri (WebKit) and bypass browser decode/compute issues seen under Flatpak/Toolbox.
- Current: Tauri dev sessions on Fedora Atomic (toolbox/podman, Flatpak browsers) frequently load a bundle that selects wasm/browser bridges; native invoke is not available in that WebView. Packaged debug runs sometimes target `devUrl`, showing “Could not connect to localhost”. Release bundle opens but image analysis does not complete yet.

Environment Notes
- Host: Fedora Atomic + toolbox/podman; NVIDIA GPU; Wayland.
- WebKit/NVIDIA: requires `WEBKIT_DISABLE_DMABUF_RENDERER=1` to avoid crashes; optionally `GDK_BACKEND=x11` for stability.
- Flatpak browsers: HTML decode path (createImageBitmap) returns zero‑dimension images for some PNG/JPEGs.

What We Changed (key files)
- Force native compute path in Tauri or when forced:
  - `tauri-app/src/lib/compute/bridge.ts` — analyzeImage calls native `analyze_image` via `tauriInvoke` when Tauri is present or `bridge.force=tauri` override is set; otherwise falls back to bridges.
  - `tauri-app/src/lib/views/HomeView.svelte` — Upload uses native `open_image_dialog` first and sets `__ACTIVE_IMAGE_PATH__`; drag‑drop is disabled in native mode; ingest skips browser decode in native/forced mode.
  - `tauri-app/src/lib/bridges/tauri.ts` — robust detection and `tauriInvoke` fallback chain (globals → `@tauri-apps/api` root/core → `@tauri-apps/api/core`).
  - `tauri-app/src/lib/bridges/{compute,fs}.ts` — adapters still exist; selection prefers Tauri when detected; logs detection info.
  - `tauri-app/src/main.ts` — best‑effort preload of `@tauri-apps/api` for dev bundlers.
- Tauri Rust side:
  - `tauri-app/src-tauri/src/main.rs` — added `open_image_dialog` using the v2 callback API (no Tokio required).
- Decode hardening:
  - `tauri-app/src/lib/compute/image-loader.ts` — ImageBitmap→HTMLImage fallback and logs (kept for browser runs only).

How To Run — Dev (prefers native)
1) Stop any running Vite/Electron.
2) In `tauri-app`:
   - `rm -rf node_modules/.vite`
   - `npm i @tauri-apps/api`
   - `npm run tauri dev` (do not run Vite separately; Tauri launches it).
3) In the Tauri window console, you may force native selection:
   - `localStorage.setItem('bridge.force','tauri'); location.reload();`
4) Click Upload (native dialog). Drag‑drop is disabled in native mode by design.

How To Run — Packaged (no devUrl)
- Build renderer + bundle:
  - `npm run build`
  - `npm run tauri build` (or `npm run tauri build -- --debug` for debug symbols)
- Run with NVIDIA/Wayland stability:
  - `WEBKIT_DISABLE_DMABUF_RENDERER=1 ./src-tauri/target/release/tauri-app`
  - or `GDK_BACKEND=x11 WEBKIT_DISABLE_DMABUF_RENDERER=1 ./src-tauri/target/release/tauri-app`
- If using a debug binary against dev assets, ensure Vite is up (or prefer the bundled release to avoid `devUrl`).

Why Upload Instead of Drag‑Drop in Tauri
- Native analysis takes a filesystem path. Browser drag‑drop yields a Blob; decoding those via HTML in this environment is unreliable. We intentionally disable drop in native mode to avoid decode flakiness.

Troubleshooting
- “Could not connect to localhost” in packaged debug builds:
  - You launched a binary built with `devUrl`. Either start Vite (`npm run dev`) first or run the release bundle which embeds `frontendDist`.
- WebView selects wasm/browser in dev:
  - Force native: `localStorage.setItem('bridge.force','tauri')` then reload; Upload should trigger native compute regardless of bridge logs.
  - Verify detection: console logs include `[bridges] tauri detection { ... }` when the Tauri adapter is selected.
- Crash on start (Wayland/NVIDIA):
  - Use `WEBKIT_DISABLE_DMABUF_RENDERER=1` and optionally `GDK_BACKEND=x11`.
- No metrics after Upload in packaged run:
  - Check the Tauri terminal logs (`npm run tauri dev` for dev or run the binary from a shell) for Rust sampling/IO errors.

Open Items / Suspicions
- Dev sessions sometimes serve a bundle that lacks Tauri API injection (globals absent), even though `@tauri-apps/api` can resolve; likely Vite reuse or devUrl caching. The forced‑native path is implemented to mitigate this until we stabilize dev injection.
- Flatpak browser HTML decode returning zero dimensions appears environment‑specific; keeping decode fallback but native should be the baseline.

Proposed Stabilization Patches (optional)
- Bake env vars on Linux before Tauri builder:
  - In `src-tauri/src/main.rs` before `Builder::default()`:
    - `std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");`
    - Optionally `std::env::set_var("GDK_BACKEND", "x11");`
- Add a small startup banner printing detection + selected compute path.

Related Files (quick index)
- Renderer
  - `tauri-app/src/lib/compute/bridge.ts`
  - `tauri-app/src/lib/views/HomeView.svelte`
  - `tauri-app/src/lib/bridges/tauri.ts`
  - `tauri-app/src/lib/bridges/compute.ts`
  - `tauri-app/src/lib/bridges/fs.ts`
  - `tauri-app/src/lib/compute/image-loader.ts`
  - `tauri-app/src/main.ts`
- Tauri
  - `tauri-app/src-tauri/src/main.rs`
  - `tauri-app/src-tauri/tauri.conf.json`
- Logs
  - `RAG/AI-LOG/2025-10-07-LOG-AI-epic5-bridges-tauri-native-and-home-decode.md`

Hand‑Off (for second set of eyes)
- Validate packaged release run with `WEBKIT_DISABLE_DMABUF_RENDERER=1` on host (no toolbox) and Upload an image. Expect native metrics with no browser decode.
- If dev runs must be used, force native via `bridge.force=tauri` and confirm Upload triggers native analysis.
- If Tauri API globals are still absent in dev, consider tightening devUrl usage or migrating fully to packaged runs for day‑to‑day until injection is consistent.

