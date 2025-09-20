# Repository Guidelines

## Project Structure & Module Organization
- `RAG/AI-EPIC/` — epics; source of truth for scope and success metrics.
- `RAG/AI-IMP/` — implementation tickets; keep checklists and AC current.
- `figma/` — exported frames/assets (pulled via Figma MCP). No secrets.
- `pkgs/src/` — Observable notebook export (reference only).
- `pkgs/proportions-et-relations-colorees/` — prior Electron app (reference: drag‑drop, exports, packaging).
- `electron-app/` — new desktop implementation (worker + renderer + main). Create this when coding starts.

## Build, Test, and Development Commands
- Notebook reference: `cd pkgs/src && npx http-server` (local preview).
- Prior Electron app: `cd pkgs/proportions-et-relations-colorees/color-analyzer-electron && npm ci && npm start`.
- New app (once present): `cd electron-app && npm ci && npm start`.
- Packaging (new app): `npm run build` → platform artifacts. Node: 18.20.8.

## Coding Style & Naming Conventions
- Language: TypeScript/JavaScript, 2‑space indent, semicolons, single quotes.
- Names: functions `camelCase`, classes `PascalCase`, constants `UPPER_SNAKE`, files `kebab-case.ts`.
- Layout: keep code modular — `src/worker/`, `src/renderer/`, `src/main/`, `src/shared/`.
- Fonts: Fira Sans is the core UI font. Vendor locally under `electron-app/assets/fonts`; never load from CDNs. Embed for SVG exports.
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
- Electron: `contextIsolation: true`, `nodeIntegration: false`; IPC bridge only. Load local files via `file://`.
- Preferences: `electron-store`; no telemetry.
- Secrets: do not commit tokens. For Figma tooling, set `FIGMA_API_KEY` in your environment; exports go to `figma/`.

## Agent-Specific Notes
- Respect this document and any nested AGENTS.md. Keep changes minimal and focused. When adding assets or planning docs, place them in the directories above and keep the repo fully offline at runtime.

