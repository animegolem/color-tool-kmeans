---
title: Global Conventions — Locked v1
review_cadence: per-sprint (first working day)
last_updated: 2025-09-25
owners: [app, design, compute]
status: active
---

Purpose: prevent drift across UI, Rust compute, and packaging. These conventions are binding for new code; exceptions require a short note in the PR description.

## Scope & Versions
- App shell: Tauri 2.x.
- UI: Svelte target = 5 (runes). If a workspace still uses Svelte 4, keep changes minimal and file an upgrade ticket in `RAG/AI-IMP`.
- Compute: Rust stable; fmt via `rustfmt`, lint via `clippy` (deny warnings in CI where practical).
- Node toolchain: use the repo’s `package.json` and lockfile; do not pin a global Node version here.

## Naming, Casing, Files
- TypeScript/JS modules: kebab-case filenames (e.g., `color-utils.ts`).
- Svelte components: PascalCase `.svelte` (e.g., `HomeView.svelte`).
- Svelte stores/helpers: kebab-case `.ts` under `src/lib`.
- Rust modules/crates: snake_case per Rust conventions.
- Constants: `UPPER_SNAKE`; functions: `camelCase`; classes/types/interfaces: `PascalCase`.

## Svelte 5 Fundamentals
- State: use `$state` for reactive state; never destructure reactive proxies.
- Derived: use `$derived` (or `$derived.by`) for pure computations. Temporary overrides allowed; they revert on dependency change.
- Effects: `$effect` for side effects only; always return cleanup where needed. Use `$effect.pre` only for pre‑DOM cases.
- Props: `$props()` for inputs; defaults via destructuring; use `$props.id()` for unique IDs; don’t mutate props.
- Bindability: `$bindable()` when two‑way is explicitly required; otherwise one‑way data flow.
- Events: DOM events use `onclick`, `oninput`, etc. (no `on:` syntax).
- Tooling guard: pre-commit and CI run `rg` checks to block `on:` DOM syntax; use runes-style `onclick` etc.
- Composition: prefer `{#snippet}` and `{@render ...}` instead of legacy slots.
- Async (optional, guarded): if enabling `experimental.async` in `svelte.config.js`, wrap UI with `<svelte:boundary>` including `pending` and `failed` snippets.

## UI Architecture (Tauri Renderer)
- Project layout: keep UI code under `tauri-app/src` with subfolders: `lib/components`, `lib/stores`, `lib/styles`, `routes` (if any), and `assets/`.
- Tokens: define semantic CSS variables in `src/lib/styles/tokens.css`. Changes must reference a Figma snapshot date and node IDs in a comment block.
- Fonts: vendor Fira Sans (UI) and Fira Code (select vertical labels only). No CDN usage. Embed font-family via `@font-face` under app assets.
- Accessibility: all interactive elements keyboard‑reachable; focus ring visible; IDs via `$props.id()`; alt text for images; contrast validated against tokens.
- Transitions: default to non-distracting fades for state unload/load on Home. Design provides exact durations/easings; implement via CSS class toggles (no global JS timers).

## Home View (Initial Patterns)
- Drop-anywhere overlay is cosmetic; actual drop target = window. Overlay shows on dragenter, hides on dragleave/drop.
- View state example (illustrative):
  - `ui = $state({ image: null, dragging: false, loading: false, error: null })`.
  - Fade out image on unload; fade in drop banner.
- Eyedropper is app-wide; image and circle graph both respond when active.
- Close (×) unloads image and restores upload banner with a short transition.
- Loading throbbers indicate pending compute/exports; avoid blocking the UI.

## IPC & Security (Tauri)
- No network at runtime. All processing is local.
- Enable isolation; expose minimal Tauri commands. Validate file paths and sizes. Map Rust errors to user-safe messages.
- Data contract for `analyze_image` (baseline from EPIC): parameters `{ K, stride, minLum, space, tol, maxIter, seed, maxSamples }`; result `{ clusters[], iterations, durationMs }`.

## Rust Compute
- Parallelism via `rayon` where beneficial; avoid nondeterminism in floating‑point reductions where determinism is required for exports.
- Unit tests for color conversions and sampling; deterministic seeds for k‑means tests.

## Figma as Source of Truth
- Always refresh assets via MCP before UI work. Keep image exports in `figma/` and structured snapshots in `figma/snapshots/`.
- Snapshot manifest: `figma/manifest.json` must include node IDs, sizes, and checksums for referenced frames.
- Asset slicing: prefer SVG for icons/controls; PNG only for effects not preserved in SVG. Place under `figma/home/` for Home screen assets.

## Lint, Format, Tests
- JS/TS/Svelte: ESLint + Prettier; CI checks `lint`, `format:check`, `svelte-check` where applicable.
- Rust: `cargo fmt --check`, `cargo clippy -D warnings`, `cargo test` in CI.
- UI unit tests: Vitest where meaningful (pure logic, store reducers). Snapshot tests allowed for deterministic SVG output.

## Commits & PRs
- Conventional Commits. Link relevant EPIC/IMP IDs. Include OS, steps, and screenshots/GIFs for UI changes.
- If intentionally exceeding LOC policy, include `[loc-bypass]` or set `LOC_BYPASS=1` in CI.

## Versioning & Telemetry
- No telemetry. Preferences stored locally only. Any future schema changes must include a migration note in PR.

## Svelte 5 Upgrade Note
- Current scaffold may reference Svelte 4 packages. New UI code MUST use Svelte 5 runes. File `AI-IMP` an upgrade ticket to bump `svelte` and `@sveltejs/vite-plugin-svelte` and to enable runes across the renderer.

---
Review checklist (per sprint)
- [ ] Tokens match latest Figma snapshot (date, node IDs).
- [ ] UI code uses runes ($state/$derived/$effect/$props/$bindable).
- [ ] No `on:` event syntax remains.
- [ ] Eyedropper works across image and circle graph.
- [ ] Unload/Load transitions follow design durations.
- [ ] IPC shape matches EPIC; error messages user‑safe.
- [ ] CI lint/format/tests pass; no network usage.
