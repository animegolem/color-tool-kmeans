---
submission: epic-027-ui-foundation
verdict: amend
branch: codex/remediation-planning-2026-09-04
commit: 5baa20e021855fbc57aebf48fa0f9b3374ded281
planning_commit: 2cc2000bce04ce2e6bda11a2853dd42595946980
round: 1
reviewed: 2026-09-05
implementation_authorized: false
accepted_scope: C2-C6-with-numbered-clarifications
submission_sha256: 0ab07380e23e270eb52136ba1c115fca7d4e2080b9a03f9dd2717bf130e59e48
---

# EPIC-027 Round 01 verdict — narrow test-harness amendment

Sol's direction and sequential 168 → 169 → 195 decomposition are sound. C2–C6 are accepted as design-basis corrections with the clarifications below. **C1's proposed direct plugin installation into Vitest is not accepted:** the existing dependency graph contains a concrete Vite-generation mismatch. No code is authorized by this verdict.

The Round 01 report remains unchanged. This is not another whole UI review and does not reopen EPIC-029 C1–C3.

## Independently verified evidence

- Main/HEAD/origin main still equal 5baa20e; main is clean. Planning remains deliberately dirty at 2cc2000.
- Current Vitest config has Node tests and no Svelte plugin; exactly 16 existing spec files. Four named DOM/testing packages are absent.
- Installed/locked Vitest 1.6.1 resolves its own Vite 5.4.21; root Vite is 7.3.1. Svelte plugin 6.2.1 declares peer Vite ^6.3.0 || ^7.0.0. Lock evidence: tauri-app/package-lock.json around 1135, 4103, 5238.
- The installed plugin uses server.environments in src/plugins/hot-update.js:55–58 and this.environment.config in component/module transforms. These are not supplied by the Vite 5 server.
- Executed one bounded, non-listening diagnostic using the exact installed plugin plus Vitest's exact Vite server, intending to SSR-load the existing SnapshotButton.svelte. It failed during createServer, before rendering, with `Cannot convert undefined or null to object` at hot-update.js:56 (Object.values(server.environments)). The command's exit was 0 because the diagnostic caught/reported the failure; the outcome was **failed**, not passed. Disposable witness: /tmp/color-tool-ui-ssr-review.qjztKc/probe.mjs. No project file or dependency was changed.
- Tauri minimum is 720×600; current entry/global CSS use the import/selector structure reported.
- Eight reference hashes match; all three zip entry counts reproduce: 104/137/12. Six same-name archived/current fonts match byte-for-byte.
- Correction to C6's count: **nine font binaries plus README**, not ten binaries. No license record was found in the inspected font directory/current design archive. This does not establish upstream legal status.
- One reference has two runtime Three.js imports. Its visible catch path is source-confirmed, not exercised offline by this verdict. Other HTTP strings include an SVG namespace and a source-attribution comment; a URL grep match alone is not a network request.
- No application suite, build, real browser/offline proof, native test, platform acceptance or owner acceptance ran in this review. Historical golden failure IMP-179 remains separate; it must not be hidden or repaired in the UI test-config ticket.

## Numbered rulings

### V1 — AMEND C1: prove a compatible SSR seam before expanding the test-config fence

The diagnosis (component tests need compilation plus independent real-browser evidence) is accepted. The suggested mechanism (put the installed svelte() plugin directly into Vitest's Vite 5 config) fails the bounded diagnostic and cannot be prescribed as a runnable seam.

Return a **focused Round 02 test-harness addendum only**. Find the smallest executable approach using already installed packages, preserving the existing 16 specs and rune-shim handling. Possibilities to assess include an isolated root-Vite-7 SSR harness or a narrowly filtered test-only Svelte compiler transform; do not assume either is proven. Avoid a general custom framework, monkey-patching plugin environment objects, upgrading dependencies, or disabling existing tests.

Prove the selected route with a disposable test/fixture outside the repository, actual Svelte SSR rendering and a caller callback that remains uninvoked. Explain how the normal CI test command will discover/run the component specs. A standalone compiler success alone does not establish Vitest compatibility. Specify exact proposed files, disposal behavior and validation commands. If no compatible no-dependency-change seam is practical, report that fact and a separately fenced tooling choice rather than installing/upgrading anything.

The isolated study-showcase.html + src/dev-study-showcase.ts browser entry is approved in principle. The final test-config/helper file scope remains held until the addendum and verdict. The production Vite config and shipping entry stay unchanged.

### V2 — ACCEPT C2: full responsive and interaction evidence

169 must cover 360/736/1024/1440 CSS-pixel widths and 720×600. Verify long labels, overflow, clipping, control stacking and vertical reachability, then Tab/Shift+Tab, native controls, focus, coarse-pointer targets and applicable reduced motion. Use actual layout, not browser zoom. SSR proves structure, not these behaviors.

### V3 — ACCEPT C3: strictly dormant CSS and entry graph

Use root-scoped [data-study-surface] selectors and --study-* variables, no global resets or current-token overrides. Only the isolated dev entry imports study styles. Verify source imports and normal production build exclusion. main.ts, App.svelte, app.css and vite.config.ts remain unchanged.

### V4 — ACCEPT C4: two explicit provenance records and caller-owned actions

Current request and visible result have separate caller-supplied source/settings descriptions. Display strings never establish equality, freshness or authority. Pending may coexist with a previous visible result; previous alone does not invent an active job. Pure discriminated types, caller-supplied copy/actions, no action on render, deliberate busy/status/error semantics. No job, token, bridge, store, timer, retry or cancellation ownership.

### V5 — ACCEPT C5 with archival precision

Copy eight pinned source references byte-for-byte into a dated RAG reference carrier, with source and copy hashes distinguished. Six non-3D HTML fragments plus one Markdown register have no runtime network imports; preserve the seventh HTML (3D) as the explicitly network-dependent prototype. Generated standalone wrappers, if required to inspect fragments, are separate from the immutable sources and need a bounded declared path; do not claim a fragment renamed .html is a self-contained portable site.

“No-network fallback” for 168 means offline inspection of non-3D references plus an honest 3D limitation. No Three.js vendoring or new visual fallback in 168. Never modify/delete the three zips, Fig file or font binaries. Distinguish runtime resource URLs from namespaces and attribution.

### V6 — ACCEPT C6 with inventory and font-loading precision

Nine binaries plus README; six duplicate archive matches. Update stale README truthfully, record missing in-repo license evidence without claiming a legal conclusion, fetch nothing. Early tokens may use existing Fira Sans/system fallback; an isolated dev page does not inherit the shipping page's @font-face declarations. Use system fallback or explicitly import the existing local fonts.css in that dev entry if needed; do not change that sheet, add a font or claim Fira Code loaded merely because a binary exists.

FigureFrame uses a required textual title/heading and typed optional Svelte 5 Snippet props for controls/content/caption, rendered with {@render}. No legacy slots and no eighteen-component framework.

## Channel state

C2–C6 synchronize into PROJECT-RECORD rev 0.6 and the three settled tickets. C1 remains a named hold. The next authorized write for Sol is only round-02-ui-test-harness-review.md; disposable diagnostics are permitted by its separate brief. No coding, commits, merges, dependency changes, ticket edits or polling. Review Lead issues the next bounded verdict after executable evidence.
