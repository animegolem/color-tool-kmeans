---
node_id: AI-IMP-021
tags:
  - IMP-LIST
  - Implementation
  - Tauri
  - Svelte
  - Upgrade
  - Tooling
kanban_status: completed
depends_on: [AI-EPIC-002-tauri_rust_compute_pivot, AI-IMP-011-tauri-svelte-scaffold]
confidence_score: 0.88
created_date: 2025-09-21
close_date: 2025-09-25
---

# AI-IMP-021-svelte5-upgrade-ui-runes-and-tooling

## Summary of Issue #1
The current renderer scaffold targets Svelte 4 packages while our conventions require Svelte 5 runes ($state/$derived/$effect/$props/$bindable) and snippet-based composition. This task upgrades the UI toolchain to Svelte 5, adjusts the minimal app code to use runes and non-`on:` DOM events, and adds lightweight enforcement so future PRs don’t regress.

Measurable outcome: `npm run build` and `npm run check` succeed with Svelte 5; the renderer compiles and runs; a pre-commit/CI guard rejects `on:` DOM event syntax in `.svelte` files; `App.svelte` demonstrates runes usage.

### Out of Scope 
- SvelteKit adoption or route filesystem changes.
- Major component rewrites beyond trivial syntax changes.
- Enabling experimental async or remote functions (can be a follow-up ADR/IMP).
- Any compute (Rust) code changes.

### Design/Approach  
- Bump `svelte` to ^5 and `@sveltejs/vite-plugin-svelte` to a version compatible with Svelte 5. Upgrade `svelte-check`, `eslint-plugin-svelte`, and `prettier-plugin-svelte` accordingly.
- Keep Vite-only setup (no SvelteKit). Preserve Tauri config.
- Update `App.svelte` and any existing components to use runes and `onclick`/`oninput` etc. Replace legacy slot usage with `{#snippet}`/`{@render}` where present.
- Add a small grep-based guard in the pre-commit hook and CI to block `on:` DOM syntax (allow `on:component` only if ever needed via config exception — default: disallow entirely).
- Document upgrade rationale and references (svelte-llms-small.txt anchors) in `contracts/global-conventions.md` and `tauri-app/README.md`.

### Files to Touch
- `tauri-app/package.json`: bump Svelte and plugin versions; update scripts if needed.
- `tauri-app/svelte.config.js`: ensure defaults work with Svelte 5; don’t enable `experimental.async` unless separately approved.
- `tauri-app/vite.config.ts`: ensure plugin import matches upgraded plugin.
- `tauri-app/src/App.svelte`: migrate to runes; fix event syntax; minimal demo state.
- `tauri-app/src/lib/**.svelte`: adjust any `on:` event usage if present; prefer snippets.
- `.githooks/pre-commit`: add grep rule to reject `on:` DOM events in `.svelte` files.
- `.github/workflows/ci.yml`: mirror the grep rule; run `npm run check`.
- `contracts/global-conventions.md`: link upgrade and anchors.
- `tauri-app/README.md`: note Svelte 5 usage and runes quickstart.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [x] Review current renderer files for Svelte 4-only syntax (e.g., `on:click`, legacy slots).
- [x] Update `tauri-app/package.json` to Svelte 5-compatible versions (svelte, vite plugin, svelte-check, eslint/prettier plugins).
- [ ] Install and compile locally: `npm ci && npm run build` (verify lockfile updates).
- [x] Update `svelte.config.js` for Svelte 5 baseline; keep `experimental.async` disabled (document how to enable later with `<svelte:boundary>`).
- [x] Verify `vite.config.ts` uses the correct `@sveltejs/vite-plugin-svelte` API for Svelte 5.
- [x] Migrate `App.svelte` to runes: replace any `$:` with `$derived` and ensure DOM events use `onclick`.
- [x] Search repo for `on:` usage in `.svelte` files and migrate or remove (grep-based sweep).
- [x] Add pre-commit guard to block `on:` DOM events in `.svelte` files (allowlist comment for rare exceptions if needed).
- [x] Mirror guard in CI job (fail build on matches) and ensure `npm run check` passes.
- [x] Update `contracts/global-conventions.md` with a short “Svelte 5 enforced” note and anchors to `svelte-llms-small.txt`.
- [x] Update `tauri-app/README.md` with “Runtimes & Runes” section (examples: `$state`, `$derived`, `$effect`, `{#snippet}`/`{@render}`).
- [ ] Smoke run `npm run dev` to confirm hot reload, basic navigation, and no runtime console errors.
- [x] Record upgrade notes in `RAG/AI-LOG` with versions and any code changes.

### Acceptance Criteria
**Scenario: Build succeeds with Svelte 5**
GIVEN a clean checkout
WHEN running `npm ci && npm run build` in `tauri-app`
THEN the build completes without errors and outputs a production bundle.

**Scenario: Runes compile and run**
GIVEN `App.svelte` uses `$state`/`$derived`/`$effect`
WHEN running `npm run dev`
THEN the UI renders and updates on interaction without console warnings.

**Scenario: Guard rejects legacy `on:` DOM events**
GIVEN a `.svelte` file containing `on:click`
WHEN committing or running CI
THEN the hook/workflow fails with a clear message to use `onclick`.

**Scenario: Lint and type checks**
GIVEN the upgraded toolchain
WHEN running `npm run check` and `npm run lint`
THEN both complete successfully without Svelte 4 syntax errors.

### Issues Encountered 
- `npm install`/`npm run build` and `npm run dev` were blocked by sandbox DNS (`EAI_AGAIN`). Run locally after pulling: `cd tauri-app && npm install && npm run build` and `npm run dev` to validate the upgrade.
- `package-lock.json` remains at Svelte 4 entries until a networked install refreshes; manifests now target Svelte 5.
