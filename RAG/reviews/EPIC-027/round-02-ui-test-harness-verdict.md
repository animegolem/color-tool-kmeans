---
submission: epic-027-ui-test-harness
verdict: accepted
branch: codex/remediation-planning-2026-09-04
commit: 5baa20e021855fbc57aebf48fa0f9b3374ded281
planning_commit: 2cc2000bce04ce2e6bda11a2853dd42595946980
round: 2
reviewed: 2026-09-05
acceptance_scope: test-seam-design-and-local-executable-proof
implementation_authorized: false
submission_sha256: f18cf32f3a96d2b5d0f8b4495ec21732d93603b42aa76a7657352a8dc8515845
---

# EPIC-027 Round 02 verdict — compatible test seam accepted

**ACCEPT. UI-T1 is resolved for bounded implementation planning.** The exact-suffix, test-only Svelte compiler transform replaces the rejected direct Svelte Vite plugin approach. Round 01 V2–V6 remain binding. Both reports remain unchanged.

## Independent verification

Read all six final inputs under /tmp/color-tool-ui-harness.h3lVhQ and reproduced their reported hashes. The final project-root config overrides the earlier external-root aliases and uses temporary cache plus only the proof and real race audit.

Executed from /Users/golem/git/color-tool-kmeans/tauri-app:

`npm run test -- --run --config /tmp/color-tool-ui-harness.h3lVhQ/vitest.project-root.config.mjs`

Observed Node v26.8.1 / Vitest 1.6.1: **2 files passed, 17 tests passed, exit 0**, duration 357ms. This comprises two proof tests and the 15 unchanged audit-control-flow-races tests. Transform output named ProbeShowcase.svelte and ProbeFrame.svelte only. Nested typed Snippet markup rendered, the caller callback remained uninvoked, and .svelte.ts retained rune-shim behavior. Main/HEAD/origin main stayed 5baa20e and main remained clean.

This is local compatibility proof, not a full application run. Other existing spec files, Node 20, typed-config check/lint/format, production build, real browser, native/golden/platform and owner acceptance were not executed. Known IMP-179 remains separate, neither fixed nor waived.

## Numbered acceptance conditions

### R2-1 — Exact filter and public compiler boundary

Permit the small transform only in tauri-app/vitest.config.ts. Strip query suffix and match filenames ending exactly in .svelte; never match .svelte.ts by substring. Use the installed public svelte/compiler API with generate: server, filename, code/maps and propagated compile errors. Resolve from the candidate's package boundary using createRequire(import.meta.url) and runtime dynamic import as proved.

Do not copy absolute proof paths, diagnostic logs, external-root aliases, relaxed filesystem allowlists or temporary include globs into the real config.

### R2-2 — One test seam, unchanged dependencies and production

Retain the existing Node environment, src/**/*.spec.ts discovery, coverage and @ alias. No new helper framework, package, lockfile, setup file, alternate CI command, server lifecycle, plugin-internal patch or Svelte Vite plugin inside Vitest. IMP-195 reuses this seam rather than duplicating it.

Foundation components use Svelte-native erasable TypeScript and plain CSS. Non-native preprocessing requires a separate ruling if actually needed, not a speculative expansion.

### R2-3 — SSR and browser evidence remain distinct

SSR proves compilation, structure, labels/actions/provenance and no action on render. It does not prove client events, focus, layout, hydration or accessibility feel. Keep the separate isolated browser showcase and all Round 01 V2 widths/interaction gates.

### R2-4 — Reproduce in the typed candidate and supported runtime

Future implementation must validate the typed in-repo config with check/lint/format, all existing/new tests and Node 20.19-or-newer CI-runtime evidence, then the applicable production/browser/full candidate gates. The external .mjs proof on Node 26 does not close those checks. Commands run inside the assigned isolated candidate, not by modifying main. Preserve known failures; no audit weakening, it.fails or unrelated fixture repair under IMP-169.

## Channel state

Expand IMP-169's planned file fence by vitest.config.ts for R2-1..R2-4. The isolated HTML/dev entry was already approved in principle. PROJECT-RECORD rev 0.7 and settled tickets/map synchronize after this verdict.

No further pre-implementation review is requested. Next is a separately issued bounded foundation implementation brief on a fresh-main isolated candidate: 168 → 169 → 195, one lead-created commit per accepted ticket. No implementation, completion, commit, merge, cleanup or polling is authorized by this compatibility verdict. Sol retains evidence and waits for that assignment.
