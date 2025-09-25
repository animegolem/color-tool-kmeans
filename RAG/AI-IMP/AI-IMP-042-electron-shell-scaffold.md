---
node_id: AI-IMP-042
tags:
  - IMP-LIST
  - Implementation
  - Electron
  - Security
  - Packaging
  - Epic-004
kanban_status: planned
depends_on: [AI-EPIC-004]
confidence_score: 0.84
created_date: 2025-09-25
close_date:
---

# AI-IMP-042-electron-shell-scaffold

## Summary of Issue #1
Scaffold an Electron desktop shell that hosts the existing Svelte 5 renderer with strict isolation and no network. Provide dev and build scripts, preload with a minimal fs dialog bridge, and package Linux AppImage and Windows portable artifacts. Done when `npm run electron:dev` opens the app and `npm run electron:build` produces installable binaries.

### Out of Scope
- Wasm compute build and renderer wiring (covered by 041/043).
- Export implementations (044).

### Design/Approach
- Use `electron-vite` or a minimal Vite + Electron config.
- Enable `contextIsolation: true`, disable `nodeIntegration`, expose only dialog/open/save via preload.
- Enforce offline by default (no remote URLs, CSP header for file:// scheme).
- Package with `electron-builder` and add CI jobs later in 045.

### Files to Touch
- `electron/` (new): `main.ts`, `preload.ts`, `index.html`, `vite.config.ts`.
- `package.json`: scripts `electron:dev`, `electron:build`.
- `.github/workflows/electron.yml` (later, 045).

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Scaffold Electron main/preload with isolation and no remote modules.
- [ ] Integrate renderer dev server (Vite) for HMR in `electron:dev`.
- [ ] Preload: expose `openFile()` and `saveFile()` only; validate paths.
- [ ] Add app menu basics (reload/toggle devtools in dev only).
- [ ] Configure `electron-builder` targets (AppImage, nsis/portable for Windows).
- [ ] Document run/build steps and security posture.

### Acceptance Criteria
**Scenario:** Dev server launches the Electron app
GIVEN a developer runs `npm run electron:dev`
WHEN the build completes
THEN the Electron window loads the Svelte renderer with HMR
AND `contextIsolation` is true and `nodeIntegration` is false.

### Issues Encountered
{LOC|20}

