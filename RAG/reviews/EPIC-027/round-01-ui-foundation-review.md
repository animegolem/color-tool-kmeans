# EPIC-027 Round 01 — UI foundation review

Date: 2026-09-05  
Assignment: Code Lead review of AI-IMP-168 → AI-IMP-169 → AI-IMP-195  
Review authority: Review Lead task `019f7c75-2b8b-7882-9df7-0cdc1e494671`  
Source inspected: `/Users/golem/git/color-tool-kmeans` at `5baa20e021855fbc57aebf48fa0f9b3374ded281`  
Planning carrier inspected: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan` at `2cc2000bce04ce2e6bda11a2853dd42595946980`, deliberately dirty  
Round type: review only; this is not EPIC-029 Round 03 and does not authorize implementation

## Verdict

**READY WITH CORRECTIONS C1–C6 for a bounded, sequential implementation.**

The foundation direction is implementable without changing the active app. The `168 → 169 → 195` order is appropriate: 168 fixes provenance and supplies a dormant, scoped visual vocabulary; 169 supplies only the minimum figure/control surface and the isolated proof carrier; 195 reuses that carrier for a pure feedback contract. No global remediation dependency is needed for these dormant artifacts, consistent with PROJECT-RECORD §9.6 (`RAG/PROJECT-RECORD.md:163-167`).

Do not dispatch implementation until the Review Lead incorporates or explicitly rules on the six corrections below. C1 and C2 are required to make the proposed evidence executable rather than nominal. The remaining corrections keep the implementation honest and narrow. This is a recommendation for the Review Lead, not integration acceptance.

## Findings and required corrections

### C1 — P1 — The proposed component specs are not runnable under the current Vitest configuration

Evidence:

- IMP-169 currently fences two `.svelte` component specs but no test configuration (`RAG/AI-IMP/AI-IMP-169-paper-primitives-library.md:34-43`). IMP-195 likewise fences `FeedbackState.svelte` plus a component spec (`RAG/AI-IMP/AI-IMP-195-shared-study-feedback-surfaces.md:34-42`).
- Current `tauri-app/vitest.config.ts:1-16` uses a Node environment and does not install the already-present Svelte Vite plugin. The application Vite configuration does install that plugin (`tauri-app/vite.config.ts:1-10`).
- The 16 current Vitest files do not render a `.svelte` UI component. The apparent `.svelte` imports resolve to `.svelte.ts` rune factories; `audit-control-flow-races.spec.ts` supplies explicit rune shims at lines 101-123 and restores them at lines 264-266.
- None of `jsdom`, `happy-dom`, `@testing-library/svelte`, or `@testing-library/dom` is installed. No package addition is needed for the recommended seam, but the current setup cannot supply DOM/layout/focus evidence.

Required ticket/fence correction for IMP-169:

1. Add `tauri-app/vitest.config.ts` to Files to Touch. Configure the already-installed `@sveltejs/vite-plugin-svelte` so `.svelte` components can be compiled for Node SSR component tests. First run all 16 pre-existing specs and confirm the rune-factory suites retain their baseline behavior; if the plugin changes `.svelte.ts` handling, stop and return a narrower test-config proposal rather than rewriting the audit suites.
2. Add `tauri-app/study-showcase.html` and `tauri-app/src/dev-study-showcase.ts` to Files to Touch. The HTML page should load only the dev entry. The dev entry should import the dormant study styles and mount `DevStudyShowcase.svelte`; it must not import `app.css`, `main.ts`, `App.svelte`, stores, runners, or bridges.
3. Use `svelte/server` rendering in `FigureFrame.spec.ts`, `DevStudyShowcase.spec.ts`, and later `FeedbackState.spec.ts` for deterministic structure, headings, labels, ARIA attributes, and the proof that render does not invoke an action callback. Use the separate Vite page for real browser reflow, keyboard, focus, pointer, and clipping evidence. SSR is not a substitute for those interaction checks.
4. Do not add a DOM library, browser runner, package script, or dependency within this range. If SSR compilation is not compatible with the existing suite, report the blocker to the Review Lead; do not replace component tests with source-text assertions.

Rationale: a source-text spec would make the checklist appear green without exercising Svelte compilation, while a Node SSR spec alone cannot prove layout or focus. The two-part seam uses dependencies already present and keeps the production entry graph unchanged.

### C2 — P1 — IMP-169's width checklist is narrower than the governing acceptance contract

Evidence:

- IMP-169 names 360, 736, and 1024 CSS pixels (`RAG/AI-IMP/AI-IMP-169-paper-primitives-library.md:53-57`).
- PROJECT-RECORD §6 requires 360/736/1024/**1440** evidence plus the supported desktop minimum and real keyboard/pointer testing (`RAG/PROJECT-RECORD.md:100-106`).
- The shipping Tauri window minimum is 720×600 (`tauri-app/src-tauri/tauri.conf.json:21-29`).

Required ticket correction: extend the IMP-169 checklist and acceptance evidence to 360, 736, 1024, 1440 CSS-pixel widths and 720×600. At each required width record overflow/clipping and native-control stacking; at 720×600 also record vertical reachability. Exercise Tab and Shift+Tab order, visible focus, native range/select/checkbox operation, `details` disclosure, pointer/coarse-target behavior, and reduced-motion behavior where motion is present. Do not satisfy this with browser zoom or a scaled fixed artboard.

### C3 — P2 — Dormancy is viable only with a separate import root and fully scoped CSS

Evidence:

- The shipping entry globally imports `app.css` and mounts only `App` (`tauri-app/src/main.ts:1-4`, `tauri-app/src/main.ts:64-72`). `app.css` globally imports the existing fonts, tokens, and inputs (`tauri-app/src/app.css:1-3`).
- Existing tokens use `:root` (`tauri-app/src/lib/styles/tokens.css:1-3`) and existing input styling begins with bare `input[type='range']` selectors (`tauri-app/src/lib/styles/inputs.css:1-17`). Repeating either pattern in the new study sheets would violate dormancy if imported accidentally.
- `App.svelte` imports the current views at lines 22-28 and selects only Home, Values, Batch, Settings, and Exports at lines 377-388. There is no development route seam to extend, and IMP-169 expressly forbids doing so (`RAG/AI-IMP/AI-IMP-169-paper-primitives-library.md:26-32`).

Required implementation rule:

- `study-tokens.css` must define namespaced `--study-*` properties under a showcase/consumer root such as `[data-study-surface]`; no `:root`, `html`, `body`, universal top-level reset, or current `--color-*` overrides.
- Every selector in `study-controls.css` must be rooted under the same marker; no bare control selector.
- Only `dev-study-showcase.ts` imports these two sheets in F1. `main.ts`, `app.css`, `App.svelte`, and `vite.config.ts` remain unchanged.
- The showcase root owns `data-study-surface`. The future shell will opt in explicitly in its own ticket.
- Verify both the source import graph and built production output. “Not mounted in App” is necessary but not sufficient if CSS is imported globally.

The active app can therefore remain unchanged. The dedicated HTML entry is a development proof carrier, not a route or production feature.

### C4 — P2 — IMP-195 needs two explicit provenance records, not one ambiguous source/settings tuple

Evidence:

- PROJECT-RECORD §4 separates selection, content/frame identity, and request execution authority and forbids relabeling old results as a new revision (`RAG/PROJECT-RECORD.md:54-60`).
- §9.2 permits shared presentation components but forbids invented progress, cancellation, retention, or retry guarantees; previous results must name their actual source/settings (`RAG/PROJECT-RECORD.md:141-143`).
- IMP-195's acceptance case is specifically “a previous result plus a pending new request” (`RAG/AI-IMP/AI-IMP-195-shared-study-feedback-surfaces.md:58-60`). A single `sourceLabel` plus `request/result settings label` in the current design sentence (`:30-32`) still permits accidental provenance collapse.

Required contract correction:

- Use an exhaustive discriminated union for `idle | empty | pending | previous | error | cancelled | saving | saved`.
- Any variant that displays an earlier result alongside a current request must carry separate caller-supplied records, for example `requestProvenance` and `visibleResultProvenance`, each with its own source and settings labels. Do not infer equality, freshness, identity, or authority from display strings.
- `pending` may carry an optional previous visible result. `previous` must state why it is not current without pretending that a job exists. Keep “current request phase” and “visible result provenance” distinguishable even if implemented as union variants rather than a generic two-axis object.
- Model recovery controls as caller-supplied action descriptors plus one caller callback, for example `{ key, label, emphasis? }[]` and `onAction(key)`. `FeedbackState` must not synthesize Retry, Cancel, Relink, Open Folder, Undo, or progress; it renders no action when none is supplied. Native buttons only.
- Copy should also be supplied by the caller or confined to clearly neutral state labels. The foundation may include illustrative showcase copy, but it must not establish product recovery promises.
- `feedback-state.ts` remains pure TypeScript: no runes, stores, timers, jobs, caches, bridges, request tokens, or cancellation ownership. Showing a caller-supplied `cancelled` state is presentation; initiating cancellation is outside this ticket.

Recommended accessibility contract: `pending` and `saving` expose `aria-busy`; changes that need announcement use a deliberate polite status region; errors use an error announcement; native action buttons remain in document order. Do not use an indiscriminate live region around the whole component.

### C5 — P2 — Preserve the hash-pinned references byte-for-byte and narrow “offline fallback” for the 3D prototype

Evidence:

- The design inventory calls these conversation fragments, not production pages, and explicitly says the 3D CDN is unapproved (`RAG/design-2026-09/README.md:7-23`).
- All eight listed source hashes match `RAG/design-2026-09/reference-sha256.txt` exactly.
- Seven references have no runtime network import. `oklab-gamut-volume.html` alone imports Three.js and OrbitControls from `https://esm.sh/three@0.180.0` at lines 71-83. Its catch path exposes a visible “3D view could not start” state at line 150.
- The true offline Three.js bundle and 2D fallback belong to IMP-197 (`RAG/PROJECT-RECORD.md:157-161`), not this archival ticket.

Required ticket/implementation clarification:

- Copy the eight reviewed files byte-for-byte into a dated, searchable carrier and produce a checksum file for the copies. Do not rewrite the pinned fragments to make them standalone and then claim the original hashes.
- Make the carrier README identify the seven offline-inspectable references and the one preserved prototype-only 3D reference. For IMP-168, “no-network fallback” means the non-3D walkthrough remains fully inspectable and the 3D reference fails visibly and honestly offline. It does not authorize vendoring Three.js, creating production 3D, or claiming visual fallback acceptance.
- Preserve all three existing archive zip files unchanged. The current archives contain 104, 137, and 12 entries respectively; extraction should exclude duplicate upload payloads as the ticket already says.
- If the Review Lead intends IMP-168 to provide an actual visual 2D gamut fallback rather than an explicit prototype limitation, that is a scope decision and must be assigned to IMP-197 or separately fenced. Do not improvise it in the provenance copy.

### C6 — P2 — Font inventory and the Svelte 5 composition seam need explicit narrow rulings

Evidence:

- Ten font binaries are already present under `tauri-app/src/assets/fonts/`. All six names duplicated by `RAG/Color Tool Design System.zip`—three Fira Code WOFF files and three Fira Sans WOFF2 files—are byte-identical by SHA-256.
- The font README still says to download Fira Sans (`tauri-app/src/assets/fonts/README.md:1`), contradicting the refreshed ticket's “do not download” rule (`RAG/AI-IMP/AI-IMP-168-vendor-design-bundle.md:19-31`).
- Current `fonts.css` declares only Fira Sans 400/500/700 (`tauri-app/src/styles/fonts.css:1-23`). Fira Code files exist but are not declared there. No local Fira license/OFL file was found in the inspected source or current design archive.
- IMP-169 asks for named slots (`RAG/AI-IMP/AI-IMP-169-paper-primitives-library.md:30-32`), while current source is Svelte 5 `$props`/event-property style (for example `tauri-app/src/lib/components/SnapshotButton.svelte:1-27`) and contains no existing `Snippet`, `{@render}`, or `<slot>` precedent.

Required clarifications:

- IMP-168 updates the font README to an inventory/provenance record and removes the download instruction. It may honestly record “license evidence not present in this repository; no new font admitted.” It must not mark licensing verified without evidence and must not fetch fonts. This missing record does not block dormant F1 because no new font or type default is required.
- Early styles use the already-declared Fira Sans/system fallback. Do not assume Fira Code is loaded merely because its files and a fallback token exist. Do not add a serif face or make serif the default.
- Express `FigureFrame` composition in Svelte 5 terms: a required textual heading/title and typed optional `Snippet` props for controls, content, and caption, rendered with `{@render}`. This preserves heading semantics and avoids reviving a legacy named-slot idiom. Keep one component; do not recreate the old eighteen-component bundle.

## Sequential implementation ownership

The sequence remains **168 → 169 → 195**, one Review-Lead-created commit per accepted ticket. The same `DevStudyShowcase.svelte` is intentionally sequential overlap: 169 creates it, 195 only adds feedback examples after the 169 commit is accepted. Do not parallelize these three tickets against the same showcase.

### AI-IMP-168 — exact first file set

New reference carrier:

- `RAG/design-system/README.md`
- `RAG/design-system/2026-09/reference-sha256.txt`
- `RAG/design-system/2026-09/ui-surface-walkthrough.html`
- `RAG/design-system/2026-09/user-storyboard.html`
- `RAG/design-system/2026-09/user-storyboard-register.md`
- `RAG/design-system/2026-09/app-layout-studies.html`
- `RAG/design-system/2026-09/media-collection-flow.html`
- `RAG/design-system/2026-09/oklab-gamut-volume.html`
- `RAG/design-system/2026-09/third-primitive-flows.html`
- `RAG/design-system/2026-09/color-studies.html`

Existing planning/source records allowed by the refreshed ticket:

- `RAG/design-2026-09/README.md` — replace external-only carrier directions with the durable relative paths while retaining candidate/prototype limitations.
- `RAG/design-2026-09/reference-sha256.txt` — retain source-input hashes and distinguish them from copied-carrier verification if both remain.
- `tauri-app/src/lib/styles/study-tokens.css` — new, dormant, root-scoped `--study-*` tokens only.
- `tauri-app/src/assets/fonts/README.md` — inventory/hashes/provenance gaps; no download.
- `CLAUDE.md` and `AGENTS.md` — one concise design-system pointer each, no process rewrite.
- `RAG/AI-IMP/AI-IMP-168-vendor-design-bundle.md` — checklist/Issues Encountered only after authorized implementation.

Do not modify or delete `RAG/Color Tool Design System.zip`, `RAG/Color Tool Design System -old ui.zip`, `RAG/UI review and feedback.zip`, `RAG/Colors Tool.fig`, any font binary, `app.css`, or existing global token/input sheets.

### AI-IMP-169 — exact first file set, including C1 fence amendment

- `tauri-app/src/lib/components/study/FigureFrame.svelte`
- `tauri-app/src/lib/components/study/FigureFrame.spec.ts`
- `tauri-app/src/lib/styles/study-controls.css`
- `tauri-app/src/lib/views/DevStudyShowcase.svelte`
- `tauri-app/src/lib/views/DevStudyShowcase.spec.ts`
- `tauri-app/study-showcase.html`
- `tauri-app/src/dev-study-showcase.ts`
- `tauri-app/vitest.config.ts`
- `RAG/AI-IMP/AI-IMP-169-paper-primitives-library.md` — checklist/Issues Encountered only after authorized implementation.

`App.svelte`, `main.ts`, `app.css`, package files, normal views, stores/runners/bridges, exports, and Rust remain fenced out.

### AI-IMP-195 — exact first file set

- `tauri-app/src/lib/components/study/feedback-state.ts`
- `tauri-app/src/lib/components/study/feedback-state.spec.ts`
- `tauri-app/src/lib/components/study/FeedbackState.svelte`
- `tauri-app/src/lib/components/study/FeedbackState.spec.ts`
- `tauri-app/src/lib/views/DevStudyShowcase.svelte` — feedback examples only.
- `RAG/AI-IMP/AI-IMP-195-shared-study-feedback-surfaces.md` — checklist/Issues Encountered only after authorized implementation.

No additional CSS file is necessary unless the 169 controls sheet cannot express feedback layout under the study root. If a new file is genuinely required, stop for a fence amendment rather than hiding feedback styles in an unrelated component.

## Future validation plan

### Commit 168 — provenance and dormant tokens

1. Verify the eight copied references against both the source directory and the recorded SHA-256 list: 8/8 exact matches.
2. Open all seven non-3D references with networking unavailable. Confirm the 3D fragment reports its prototype/network limitation and is not presented as an offline production implementation.
3. Search the copied/current HTML for remote URLs; allow only the recorded preserved Three.js prototype occurrence. Record it, do not “fix” it under 168.
4. Verify all archive zips and font binaries are unchanged. Re-run the six duplicate-font hash comparisons.
5. Search `main.ts`, `app.css`, `App.svelte`, and the application import graph for `study-tokens.css`: expected zero production imports.
6. Check the token sheet for no `:root`, `html`, `body`, bare element selector, or un-namespaced variable.

### Commit 169 — primitive, SSR proof, and real browser proof

1. Run the pre-existing 16 Vitest files immediately after the test-config change; preserve baseline counts and rune-factory behavior.
2. Run focused SSR specs for FigureFrame and DevStudyShowcase. Verify semantic heading structure, labeled native controls, correct optional-region omission, and no nested interactive controls.
3. Serve `study-showcase.html` with Vite. Record real screenshots/observations at 360, 736, 1024, 1440, and 720×600. Check horizontal overflow, figure clipping, control stacking, long text, and vertical reachability.
4. Exercise Tab/Shift+Tab and native keyboard operation. Verify visible focus, no focus trap, at least 44px coarse-pointer targets where required, and no motion dependency.
5. Verify `main.ts` and `App.svelte` are unchanged and contain no showcase import/route. Run the normal production build and inspect output/imports to confirm the showcase HTML/entry and study CSS are absent from the shipping graph.
6. Verify no package or lockfile delta and no current global-style delta.

### Commit 195 — pure feedback contract and isolated examples

1. Unit-test every discriminant and illegal/missing provenance case in pure TypeScript. Include pending-with-previous-result where request and result source/settings differ.
2. SSR-test the component's busy/status/error semantics, explicit provenance labels, absence of unsupplied actions, and zero callback invocations during render.
3. In the browser showcase, invoke each supplied native action and confirm exactly one caller event per activation. Confirm no Cancel/Retry/Relink/Open Folder/Undo control appears unless explicitly supplied.
4. Exercise transition examples without timers: idle, empty, pending, pending with previous result, previous, error, cancelled, saving, and saved. No fake percentage or simulated job ownership.
5. Search the new model/component for imports from stores, runners, bridges, cache/native/job modules, and timer APIs: expected zero.

### Full candidate gates after each ticket and at the three-commit tip

From `tauri-app/`:

```text
npm run test -- --run
npm run check
npm run lint
npm run format:check
```

From `tauri-app/src-tauri/`:

```text
cargo fmt --all -- --check
cargo clippy --workspace -- -D warnings
cargo test --workspace
cargo test -p color-core --no-default-features --test kmeans_snapshots
cargo tree -p color-core --edges normal
```

Record exact candidate tip, platform/toolchain, suite/test counts, the two accepted AUD-020 warnings, snapshot/golden status, LOC warnings, and any platform gaps. Windows packaging and Linux CI remain later release evidence; do not infer them from macOS. No full gate was run in this review.

## Downstream coordination — not blockers for dormant F1

- **IMP-196 / layout preference:** 169 may show the three arrangements illustratively, but must not create a preference, select a default, migrate `compactSidebars`, or duplicate study state. UI-D3 remains owner-held (`RAG/PROJECT-RECORD.md:116-121`). The future consumer imports the study surface explicitly.
- **IMP-197 / true 3D:** 168 preserves the CDN prototype as evidence only. No Three.js dependency, conversion helper, WebGL lifecycle, or fallback implementation belongs in F1. IMP-197 must separately review an offline dependency, reuse pure conversion math, and own the 2D fallback (`RAG/PROJECT-RECORD.md:157-161`).
- **IMP-199 / patch labels:** FigureFrame and feedback must not bake patch labels, HEX/share defaults, inferred names, or precision. Those defaults remain UI-D4, and visual/export fixture changes are confined to 199 (`RAG/PROJECT-RECORD.md:155-155`).
- **IMP-170 / shell:** no App route, navigation, current view, preference, or global stylesheet is changed here. 170 becomes the first explicit production consumer after 169 and 195 are accepted.
- **EPIC-029 / active lifecycle wiring:** the dormant presentation type must not acquire ownership semantics. Any active Colors/Values/Batch/Exports integration waits for the named source identity, restore, retained-job, and publication seams in §9.6 (`RAG/PROJECT-RECORD.md:163-165`). EPIC-029 Round 02 C1–C3 remain accepted unchanged.

## Mechanical evidence versus owner judgment

Mechanically reviewable in F1:

- exact reference and font hashes;
- current-versus-historical labeling and absence of archive deletion;
- zero production imports/routes/dependencies;
- CSS root scoping and namespaced variables;
- Svelte compilation, semantic markup, exhaustive TypeScript cases, and no callback on render;
- real recorded browser behavior at the required widths, keyboard order, focus visibility, pointer targets, clipping, and overflow;
- unchanged deterministic suites and full repository gates.

Still requires owner judgment or a later explicit ruling:

- editorial serif selection, licensing approval, and whether it becomes a default;
- visual quality of spacing, crispness, hierarchy, and the three arrangements;
- final feedback/recovery copy and any claim that an operation is actually available;
- layout preference default/migration/reset behavior;
- patch-label fields, rounding, and precision;
- 3D dependency/camera/fallback interaction;
- final human keyboard/reflow acceptance. Passing mechanical checks does not check the owner-acceptance box.

## Read-only checks performed

- Verified `HEAD`, `main`, and `origin/main` are all `5baa20e021855fbc57aebf48fa0f9b3374ded281`; source checkout status is `## main...origin/main` with no changes.
- Verified the planning carrier is `2cc2000bce04ce2e6bda11a2853dd42595946980` and deliberately dirty. It was not cleaned, switched, rebased, or modified except for this authorized report.
- Read the assignment brief, AGENTS.md, CLAUDE.md, PROJECT-RECORD rev 0.5, refreshed EPIC-027, tickets 168/169/195, September design inventory/coverage/checksums, and the archived July 168/169 ticket text.
- Inspected current Svelte entry/routing, global styles, component style, Vitest/Vite/package configuration, installed test-related packages, font declarations/assets, and Tauri minimum window settings.
- Enumerated 16 existing Vitest specs. Found no direct UI-component render test and no installed DOM/test-rendering library among the four checked packages.
- Verified 8/8 September reference hashes. Found one reference with runtime network imports: two imports from one pinned Three.js CDN version in the 3D prototype; the other seven had none.
- Enumerated the three design archives: 104, 137, and 12 entries. Compared the six same-name archived/current Fira files: 6/6 SHA-256 matches.
- Searched for local Fira licensing evidence and found none in the inspected font directory/current design archive. This is absence in the inspected repository, not a claim about the fonts' upstream license.
- Commands were limited to `git rev-parse/status/worktree`, `rg`, `find`, `nl`, `sed`, `wc`, `shasum`, `unzip -l/-p`, and read-only shell tests.

## Tests not run

- No Vitest, Svelte check, ESLint, Prettier, Vite build, Cargo, snapshot/golden, Tauri runtime, browser interaction, Windows, or Linux gate was run.
- No application was launched. No claim of rendering, accessibility, keyboard, reflow, production-build dormancy, or owner acceptance is made by this review.

## Files changed

- `RAG/reviews/EPIC-027/round-01-ui-foundation-review.md` — this report only.

## Deviations and friction

- No production source, ticket, dependency, PROJECT-RECORD, INDEX, prior report, asset, archive, or other worktree was edited. No installation, Git mutation, commit, push, PR, polling, or notification occurred.
- The current ticket fences cannot support the promised component tests or real browser evidence; C1 is therefore a precondition, not optional polish.
- The existing font README is stale and no in-repo license record was found. The bounded remedy is truthful inventory, not a network fetch or guessed license assertion.
- The hash-pinned 3D reference is intentionally not offline-capable beyond its visible error state. Treating 168 as dependency-vendoring or 3D implementation would collapse the planned boundary with 197.

## Requested next step

Review Lead independently verifies this report and writes a numbered verdict on C1–C6. If accepted, issue a new bounded F1 implementation assignment from fresh reviewed main, preserve one lead-created commit per ticket, and keep the `168 → 169 → 195` order. Do not infer coding authorization from this submission.
