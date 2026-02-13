# Repository Guidelines

## Project Structure & Module Organization
- `RAG/AI-EPIC/` — epics; source of truth for scope and success metrics.
- `RAG/AI-IMP/` — implementation tickets; keep checklists and AC current.
- `figma/` — exported frames/assets (if available). No secrets.
- `tauri-app/` — desktop implementation (Svelte renderer + Tauri backend).

## RAG Process
- Epics are the core work order and must be broken into `RAG/AI-IMP/*` implementation tickets.
- After completing an IMP: update its state to `Closed`, check off AC/checklists, and note any issues/findings or follow-up work.
- After completing an Epic: update its state to `Closed`, reconcile the Implementation Breakdown, and record any deferred items with links to future work.

## Build, Test, and Development Commands
- App: `cd tauri-app && npm install`.
- Fonts (one-time): `cd tauri-app && ./scripts/fetch-fira.sh`.
- Dev: `cd tauri-app && npm run tauri dev` (native shell) or `npm run dev` (web-only).
- Build: `cd tauri-app && npm run build`.
- Packaging: `cd tauri-app && npm run tauri build` → platform artifacts. Node: 18.20.8.

## CI/DI & Git Hooks
- Enable hooks once: `git config core.hooksPath .githooks`.
- Pre‑commit runs format/lint if defined (per workspace) and a LOC warning (default 350 lines/file). It never edits code.
- CI (GitHub Actions) runs tests and a strict LOC check. To intentionally exceed the limit, include `[loc-bypass]` in the commit message or set `LOC_BYPASS=1` in the workflow step.

## Coding Style & Naming Conventions
- Language: TypeScript/JavaScript, 2‑space indent, semicolons, single quotes.
- Names: functions `camelCase`, classes `PascalCase`, constants `UPPER_SNAKE`, files `kebab-case.ts`.
- Layout: keep code modular — `tauri-app/src/lib/` (UI), `tauri-app/src-tauri/` (Rust backend), `tauri-app/src/lib/exports/` (export logic).
- Fonts: Fira Sans is the core UI font. Vendor locally under `tauri-app/src/assets/fonts`; never load from CDNs. Embed for SVG exports.
- Lint/format: Prettier + ESLint; run before PRs (`npm run lint && npm run format`).

## Testing Guidelines
- Unit tests: prefer Vitest. Name `*.spec.ts` next to source.
- Focus: color conversions, k‑means stability, worker message contract, export determinism.
- Manual smoke tests: image load, K up to 300, export PNG/SVG/CSV, drag‑drop, and overview composite on Linux/Windows.

## Commit & Pull Request Guidelines
- Conventional Commits (e.g., `feat: worker compute pipeline`, `fix: polar radius mapping`).
- PRs must include: description, linked Epic/IMP IDs, screenshots/GIFs for UI, OS + steps in a brief test log, and notes on offline compliance.
- Update relevant `RAG/AI-IMP/*` checklists and the epic’s Implementation Breakdown.

## Security & Configuration Tips
- Tauri: avoid remote content; prefer local assets and the configured CSP. Load local files via `file://` or the Tauri asset protocol as configured.
- Preferences: local-only storage (Tauri Store when added); no telemetry.
- Secrets: do not commit tokens. For Figma tooling, set `FIGMA_API_KEY` in your environment; exports go to `figma/`.

## Agent-Specific Notes
- Respect this document and any nested AGENTS.md. Keep changes minimal and focused. When adding assets or planning docs, place them in the directories above and keep the repo fully offline at runtime.
- Use `RAG/INDEX.md` as the single entry point for current status (auto-generated via pre-commit).

## Current Architecture Snapshot (IMP-101 Baseline)
- App shell is now a 3-column/2-row grid in `tauri-app/src/App.svelte` + `tauri-app/src/app.css`:
  - Columns: left nav, center channel, right library rail.
  - Rows: fixed in-app header + scrollable view body.
- Header controls are global and live in `App.svelte` (not per-view):
  - Left toggle collapses nav (`navCollapsed` store).
  - Center shows active view + selected media label + `Clear`.
  - Right toggle opens/closes library rail (`libraryDrawerOpen` store).
- `HomeView.svelte` was refactored into smaller modules under `tauri-app/src/lib/views/home/`:
  - `VideoPanel.svelte`, `AnalysisCards.svelte`, `ParameterControls.svelte`, `DevBanner.svelte`
  - Controller modules: `video-controller.svelte.ts`, `analysis-runner.svelte.ts`, `file-ingestion.svelte.ts`
- Library UI is scaffold-only in current state (placeholder sections); ingestion behavior remains tracked by IMP-097/098/099/100.
- Sidebar icon assets exist in both:
  - planning refs: `RAG/assets/layout-sidebar-*.svg`
  - runtime assets: `tauri-app/src/lib/assets/layout-sidebar-*.svg`

## Implementation Guardrails (Layout Work)
- Do not reintroduce the legacy floating toggle lane pattern from IMP-096.
- Keep header/body/rail reflow coupled via shared grid sizing; avoid overlay behavior that causes card overlap.
- When layout behavior changes, validate both:
  - wide desktop mode (two-column analysis cards)
  - narrow mode (cards stack without overlap/clipping).
