# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Color analysis tool for artists using k-means clustering in OKLab/OKLch. Native desktop app: **Tauri 2 + Svelte 5 + Rust** (`tauri-app/`). Shipped as v1.0.x (macOS dmg + Windows msi, unsigned). Offline-first: no network requests at runtime, all assets vendored.

Current work tracks (see `RAG/INDEX.md` for live status — never trust a hardcoded list here):
- **EPIC-026** — live video playback analysis (GO per `RAG/ADR/ADR-003`; warm-start + fixed-iteration-budget k-means over a persistent ffmpeg rawvideo pipe)
- **EPIC-027** — notebook UI redesign (app as a paper spread on a desk; design bundle in `RAG/`, lifecycle gaps tracked in `RAG/DESIGN-COVERAGE.md`)

## Core Architecture

### App Shell (`tauri-app/src/App.svelte`)

CSS Grid: left nav + header bar + view-container + MediaBucket right rail. Routes Colors (Home) / Values / Batch / Exports / Settings. Narrow mode below 1080px collapses sidebars. **EPIC-027 replaces this shell** (desk + two-page spread + edge tabs) — check ticket state before investing in the current layout.

### Views (`tauri-app/src/lib/views/`)

- `HomeView.svelte` — Colors: orchestration shell wiring submodules in `home/`:
  - `video-controller.svelte.ts` — video state, playback, scrubbing, frame decode (serialized per frame ID), strip generation, probe
  - `analysis-runner.svelte.ts` — debounce, spinner, error mapping, token-owned cancellation
  - `file-ingestion.svelte.ts` — dialog, drag-drop, decoding, preview URLs
  - `VideoPanel.svelte`, `AnalysisCards.svelte`, `ParameterControls.svelte`, `DevBanner.svelte`
- `ValuesView.svelte` — value/lightness analysis; submodules in `values/`: `value-analysis-runner.svelte.ts`, `file-ingestion-values.svelte.ts`, `video-scrubber.svelte.ts`, `VideoScrubber.svelte`
- `BatchView.svelte` — multi-image aggregate analysis; submodules in `batch/`: `batch-runner.svelte.ts`, `batch-drop.svelte.ts` (exports `mountAsyncListener` — unmount-safe async listener registration), `PinExpandOverlay.svelte`
- `ExportsView.svelte` — export UI; runners in `exports/`: `colors-export-runner.svelte.ts` (exports `formatTimestamp`), `values-export-runner.svelte.ts`, `batch-export-runner.svelte.ts`
- `SettingsView.svelte` — preferences

### Stores (`tauri-app/src/lib/stores/`)

`ui.ts` is a **barrel re-export**; the real modules are: `navigation`, `analysis`, `value-analysis`, `image`, `video`, `zoom`, `exports`, `preferences`, `multi-analysis`, plus `batch-params` and `prefs`. Import from `./stores/ui` in views (existing convention) but edit the specific module.

Key invariants (from the 2026-07 audit remediation — regression-tested in `views/__tests__/audit-*.spec.ts`):
- Analysis pending state is **token-owned**: `setAnalysisPending()`/`setValueAnalysisPending()` return tokens; cancellation/success/error must pass them so a stale request can't clobber a newer one.
- `invalidateValueAnalysisForImage()` drops caches AND pending tokens for an image.
- `setFile`/`appendFile` dedup by path BEFORE registering datasets/object URLs; `removeFile` never promotes a raw video to `selectedFile`.

### Services (`tauri-app/src/lib/services/`)

`media-ingestion.ts` (shared `ingestFileAsEntry` for all views), `drag-drop.ts`, `active-image.ts` (owns the active-path global), `frame-snapshot.ts`, `artifact-cleanup.ts` (disk-artifact removal on entry removal/clear), `view-subscriptions.ts` (shared event-channel consumer factories). See `RAG/DATA-FLOW.md` for the full ingestion/analysis/video flow map.

### Components (`tauri-app/src/lib/components/`)

`ZoomOverlay.svelte` (pan/zoom modal), `MediaBucket.svelte` (right-rail media library; becomes strip + page in EPIC-027), `ContextMenu.svelte`, `SnapshotButton.svelte`.

### Bridges (`tauri-app/src/lib/bridges/`)

`tauri.ts` (detection/invoke), `compute.ts`, `fs.ts` (dialogs, `sourceImageExportName`), `video.ts`, `ffmpeg.ts`, `compose.ts` (grid composition), `log.ts`, `value-analysis.ts`. Pattern: detection-based bridge selection; native Tauri API required.

### Exports (`tauri-app/src/lib/exports/`)

Chart SVG: `polar-chart.ts`, `hue-lightness.ts`, `histogram.ts`, `values-histogram.ts`. Palettes: `palette.ts`, `palette-ase.ts`, `palette-web.ts`. Composites: `compositor.ts`, `color-study-compositor.ts`, `value-study-compositor.ts`, `notan-study.ts`. Shared: `svg.ts`, `png.ts`, `font-embed.ts`, `chart-save.ts`, `value-analysis.ts`. **Export output must stay deterministic** — fixtures in `exports/__tests__/`.

### Native Backend (`tauri-app/src-tauri/src/`)

- `main.rs` (setup, plugin init, command registry), `commands.rs` / `commands_types.rs`
- `kmeans.rs` — k-means++ with SIMD (`wide`), `warm_start` and `mini_batch` support
- `color.rs` — OKLab/OKLch conversions; `image_pipeline.rs` — decode/downscale/sample; `value_analysis.rs` — value analysis + disk cache (freshness = ns-mtime + length, cache v6)
- `merge.rs`, `compose_grid.rs`, `cache.rs` (startup + session pruning), `ffmpeg.rs` (CLI frame/strip extraction; strip fps uses probed rate)
- **Bench binaries** (`src/bin/`, not shipped): `kmeans_baseline`, `kmeans_framesim` (warm-start frame sequences), `live_pipe_probe` (rawvideo pipe + LUT conversion), `live_loop_probe` (end-to-end live-analysis loop). Results/architecture: `RAG/ADR/ADR-003`.

## Development Commands

```bash
cd tauri-app
npm run tauri dev              # development (launches Vite)
npm run build                  # renderer build
npm run tauri build            # release bundle (-- --debug for symbols)
npm run lint / format / format:check / check   # eslint / prettier / svelte-check
npm test -- --run              # vitest

cd src-tauri
cargo fmt --all -- --check && cargo clippy --workspace -- -D warnings
cargo test --workspace
cargo run --release --bin kmeans_baseline      # (or kmeans_framesim / live_pipe_probe / live_loop_probe)
```

**Node 20** is the CI runtime. **package-lock.json must stay npm-10 compatible** — if you touch dependencies, regenerate with `npx -y npm@10 install --package-lock-only` and verify `npx -y npm@10 ci --dry-run` (a lockfile written by npm 11 breaks CI's `npm ci`).

Vendored binaries: ffmpeg/ffprobe sidecars in `src-tauri/bin/` are **gitignored** — fresh clones/worktrees fail the Tauri build script until you copy them from the main checkout or run `tauri-app/scripts/install-ffmpeg-sidecars.sh`. Fonts: `tauri-app/scripts/fetch-fira.sh` (one-time; vendored under `src/assets/fonts`).

Linux/NVIDIA/Wayland: `WEBKIT_DISABLE_DMABUF_RENDERER=1 npm run tauri dev` (WebKit crashes).

## Git Hooks & CI

Enable once: `git config core.hooksPath .githooks`.

- **Pre-commit**: blocks Svelte `on:` syntax (runes only); runs `format:check` + `lint` (node-based script detection — actually runs, failures block); `cargo fmt --check` + clippy; LOC warning at 400 lines/file (non-blocking); regenerates `RAG/INDEX.md`.
- **CI** (`.github/workflows/ci.yml`): `npm ci`, format:check, lint, check, full vitest, full `cargo test --workspace`, fmt/clippy, golden/snapshot gates, Windows build. Strict LOC check — bypass with `[loc-bypass]` in the commit message.
- Prettier config is `prettier.config.mjs` + `.prettierignore`; `format`/`format:check` carry negative globs for generated trees.

## Code Style

- TypeScript/JavaScript + Rust; 2-space indent, semicolons, single quotes
- Functions `camelCase`, classes `PascalCase`, constants `UPPER_SNAKE`, files `kebab-case.ts`, components `PascalCase.svelte`
- **Svelte 5 runes only** (`$state`, `$derived`, `onclick`) — `on:` syntax is blocked by the hook
- Module extraction pattern: `create*()` factory functions returning reactive objects with `$state` getters/setters (see `views/home/*.svelte.ts`)
- Fonts: Fira Sans (UI) + Fira Code (mono, notebook design); vendored, never CDN

## Testing

- Vitest, `*.spec.ts` next to source; audit regression suites in `views/__tests__/` (keep AUD-IDs in test names)
- **Rune trap**: plain vitest does not transform `$state`/`$derived` in `.svelte.ts` files imported into node tests — constructing a runner factory throws `rune_outside_svelte`. Use the test-local rune shims pattern (see `audit-control-flow-races.spec.ts` `installRuneShims`) or test pure functions.
- Focus areas: color conversions, k-means stability/determinism, store race invariants, export determinism
- Manual smoke: K=300, drag-drop, video switch in Values, exports (PNG/SVG/CSV/ase), batch aggregate

## Work Tracking (RAG/)

- **`RAG/INDEX.md`** — generated kanban, single source of truth for epic/ticket status. Never edit by hand; regenerate via `RAG/scripts/generate-index.sh` (pre-commit does it).
- Epics `RAG/AI-EPIC/`, tickets `RAG/AI-IMP/` (templates in `RAG/templates/` are mandatory), session logs `RAG/AI-LOG/`, decisions `RAG/ADR/`.
- Check ticket checklist items only after implemented AND validated; fill Issues Encountered honestly.
- `RAG/DATA-FLOW.md` — media/analysis data-flow map. `RAG/DESIGN-COVERAGE.md` — UI lifecycle vs design-bundle coverage (EPIC-027). Design bundle: `RAG/Color Tool Design System.zip` until IMP-168 vendors it to `RAG/design-system/`.

## Key Technical Notes

- **Tauri runbook**: `TAURI-NATIVE-RUNBOOK.md` — native analysis needs a filesystem path; packaged debug builds default to `devUrl`.
- **Security**: IPC bridge only; local files via asset protocol; no secrets in commits (`FIGMA_API_KEY` env for Figma tooling).
- **Offline-first**: all runtime dependencies vendored; no CDN, no runtime network.
