# Repository Guidelines

## Project Structure & Module Organization
- `RAG/AI-EPIC/` — epics; source of truth for scope and success metrics.
- `RAG/AI-IMP/` — implementation tickets; keep checklists and AC current.
- `figma/` — exported frames/assets (pulled via Figma MCP). No secrets.
- Treat Figma as the visual source of truth. Always confirm layouts/controls against the latest exports (and fetch updates before UI work). When unsure about behavior, escalate to the project owner before making assumptions.
- `pkgs/src/` — Observable notebook export (reference only).
- `pkgs/proportions-et-relations-colorees/` — prior Electron app (reference: drag‑drop, exports, packaging).
- `electron-app/` — new desktop implementation (worker + renderer + main). Create this when coding starts.

## Build, Test, and Development Commands
- Notebook reference: `cd pkgs/src && npx http-server` (local preview).
- Prior Electron app: `cd pkgs/proportions-et-relations-colorees/color-analyzer-electron && npm ci && npm start`.
- New app (once present): `cd electron-app && npm ci && npm start`.
- Packaging (new app): `npm run build` → platform artifacts. Node: 18.20.8.

## CI/DI & Git Hooks
- Enable hooks once: `git config core.hooksPath .githooks`.
- Pre‑commit runs format/lint if defined (per workspace) and a LOC warning (default 350 lines/file). It never edits code.
- CI (GitHub Actions) runs tests and a strict LOC check. To intentionally exceed the limit, include `[loc-bypass]` in the commit message or set `LOC_BYPASS=1` in the workflow step.

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
- Keep `figma/` exports in sync with current UI work (home boot, drag/drop, loaded states, graphs, exports). Refresh assets whenever the design changes so future contributors reference the right visuals.

## Agent-Specific Notes
- Respect this document and any nested AGENTS.md. Keep changes minimal and focused. When adding assets or planning docs, place them in the directories above and keep the repo fully offline at runtime.

# Svelte Documentation for LLMs
Please use the following documentation liberally to guide the implementation. You may pull it using curl at any time. All of the following documentation is LLM optimized. 

## Documentation Sets

- [Abridged documentation](https://svelte.dev/llms-medium.txt): A shorter version of the Svelte and SvelteKit documentation, with examples and non-essential content removed
- [Compressed documentation](https://svelte.dev/llms-small.txt): A minimal version of the Svelte and SvelteKit documentation, with many examples and non-essential content removed
- [Complete documentation](https://svelte.dev/llms-full.txt): The complete Svelte and SvelteKit documentation including all examples and additional content

## Individual Package Documentation

- [Svelte documentation](https://svelte.dev/docs/svelte/llms.txt): This is the developer documentation for Svelte.
- [SvelteKit documentation](https://svelte.dev/docs/kit/llms.txt): This is the developer documentation for SvelteKit.
- [the Svelte CLI documentation](https://svelte.dev/docs/cli/llms.txt): This is the developer documentation for the Svelte CLI.

## Notes

- The abridged and compressed documentation excludes legacy compatibility notes, detailed examples, and supplementary information
- The complete documentation includes all content from the official documentation
- Package-specific documentation files contain only the content relevant to that package
- The content is automatically generated from the same source as the official documentation
