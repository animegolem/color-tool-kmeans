---
node_id: AI-IMP-206
tags:
  - IMP-LIST
  - Implementation
  - Browser
  - Runtime
  - Playwright
  - CI
  - Epic-029
kanban_status: planned
depends_on: [AI-EPIC-029, AI-IMP-204, AI-IMP-205]
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.86
date_created: 2026-10-14
date_completed:
---

# AI-IMP-206 (F1c) — runtime target selection and real-browser harness

> Minted by the Review Lead 2026-10-14 from Sol's draft `reviews/EPIC-029/f1c-target-selection-browser-harness-ticket-draft.md` (kept unchanged as the review record). Symbolic names in the body: F1a = AI-IMP-204, F1b = AI-IMP-205, F1c = AI-IMP-206.

## Lead amendments (binding; functional-path F1 verdict, 2026-10-14)

- **A4, the gross-hang alarm:** the fixed parity still must complete within **60 s** in Playwright Chromium, and while
  compute is pending the main-thread heartbeat must never show a gap over **1,000 ms**. Both are alarms against a frozen
  renderer, not performance claims, SLAs or benchmarks.

The Review Lead assigns the final AI-IMP number and replaces `F1a`/`F1b` with
their minted dependencies. This draft is not an implementation fence.

## Select one honest runtime and prove it in a real browser

Bridge factories currently detect Tauri independently and normal browser
startup logs a caught bridge failure. There is no browser E2E runner, and
native-only routes/controls can fail after interaction. Add one startup target
and capability record, make every F1 adapter consume it, render honest
unavailable states for later browser capabilities, and add a required
Playwright Chromium gate.

Done means absence of Tauri selects a normal browser target without warning,
Colors file/prefs/worker capability works in a real browser with exact digest
and heartbeat evidence, unsupported capabilities never invoke Tauri, and the
new CI job is required by the aggregate gate.

### Out of Scope

- F2 shell/Colors redesign, layout choice, label completion, or Tauri E2E proof.
- Implementing Values, Batch, export download, browser video, native zoom, or
  File System Access.
- Public hosting, service worker/offline caching, CSP, origin/update trust, or
  Tauri remote loading.
- Performance percentiles, fixed SLA, Instruments, cross-browser matrix, or
  IMP-202.
- npm packages other than `@playwright/test` and its npm-10 lock closure.

### Design/Approach

Follow `f1-shared-runtime-design.md` §§6–7. Resolve an immutable `tauri` or
`browser` target once at startup. The target record names file, compute,
preference, save, Values/Batch, video, and zoom capability. Bridge factories
take the record; they do not independently fall through after selection.
Startup emits one structured log and `data-runtime-target` marker.

Browser navigation retains every route. Colors and Settings consume their F1
capabilities. Values, Batch, and Exports render a shared accessible unavailable
surface without mounting native consumers. Settings replaces the native export
directory picker with an explanatory unavailable row. Browser video selection
is rejected before ingestion. Tauri retains every current route/control.

Add Playwright as a dev dependency with npm 10 only. Run production Vite source
on loopback in Chromium, install no runtime network dependency, use the existing
parity PNG, and add `browser-e2e` as a required CI/aggregate leg. The heartbeat
and timeout are gross-stall alarms, not benchmark thresholds.

### Files to Touch

- `tauri-app/src/lib/runtime/target.ts` (new): pure detector, immutable target,
  and capability record.
- `tauri-app/src/lib/runtime/target.spec.ts` (new): Tauri/browser detection and
  complete capability matrix.
- `tauri-app/src/lib/bridges/fs.ts`: select the F1a adapter from the target.
- `tauri-app/src/lib/bridges/preferences.ts`: select the F1a adapter from the
  target.
- `tauri-app/src/lib/bridges/compute.ts`: select the F1b adapter from the target.
- `tauri-app/src/lib/components/TargetUnavailable.svelte` (new): accessible
  route/capability explanation.
- `tauri-app/src/lib/components/TargetUnavailable.spec.ts` (new): SSR content,
  role, and no-action contract.
- `tauri-app/src/lib/views/SettingsView.svelte`: hide/replace native directory
  selection on browser target.
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: consume runtime
  capability for browser video rejection rather than re-detecting Tauri.
- `tauri-app/src/lib/views/HomeView.svelte`: omit native-save chart context
  actions on the browser target.
- `tauri-app/src/App.svelte`: keep routes, gate later browser surfaces, and
  avoid native-only header actions.
- `tauri-app/src/main.ts`: resolve/report target once and initialize the three
  adapters from it.
- `tauri-app/package.json`: add exact Playwright dev dependency and browser test
  scripts.
- `tauri-app/package-lock.json`: npm-10-only lock closure for that exact package
  change.
- `tauri-app/playwright.config.ts` (new): Chromium, loopback web server, trace on
  first retry, and bounded timeouts.
- `tauri-app/tests/browser/f1-shared-runtime.spec.ts` (new): target, browse/drop,
  worker parity/race/heartbeat, reload persistence/failure, and unavailable
  surfaces.
- `.github/workflows/ci.yml`: add the required `browser-e2e` job and aggregate
  result.
- `scripts/ci/ci-gates.test.mjs`: require and execute the amended aggregate
  contract.

No other package, lock, workflow, application, test, or RAG file is authorized.
`@playwright/test` is the sole package addition. Regenerate only
`tauri-app/package-lock.json` with `npx -y npm@10 install --package-lock-only`;
review the complete manifest/lock delta and prove `npx -y npm@10 ci --dry-run`.
Playwright browser binaries, WASM packages, traces, screenshots, and reports are
generated/ignored artifacts and must not be committed.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add a pure detector that selects exactly `tauri` or `browser` once and
      returns the complete ruled capability matrix.
- [ ] Make file, compute, and preference bridge selection consume that record;
      remove normal-browser caught-failure logging.
- [ ] Emit one structured startup target record and root data marker without
      exposing paths, files, preferences, or credentials.
- [ ] Preserve all routes while rendering the shared unavailable surface for
      browser Values, Batch, and Exports instead of mounting native consumers.
- [ ] Replace browser export-directory interaction with an honest unavailable
      explanation, omit chart-save context actions, and reject browser video
      before ingestion.
- [ ] Prove Tauri still selects all existing native adapters/routes/controls.
- [ ] Add exactly `@playwright/test`; regenerate only the npm lock with npm 10
      and inspect every changed package entry.
- [ ] Configure Chromium against a loopback Vite server whose startup builds the
      F1b WASM package with the lead-pinned toolchain.
- [ ] Test browser target/adapter IDs and absence of a Tauri error/warning.
- [ ] Test both file chooser and DataTransfer drop with the fixed parity PNG;
      assert Blob authority, no path, ready result, and exact digest.
- [ ] Start a successor parameter request while its predecessor is pending;
      assert only the successor result/error/finally becomes visible.
- [ ] Prove a RAF/timer heartbeat fires while worker compute is pending and the
      fixed case terminates under a generous lead-recorded hang timeout; publish no
      percentile or performance claim.
- [ ] Persist an approved preference across reload and inject localStorage write
      denial to assert the accessible warning.
- [ ] Visit every target-only browser route/control and assert honest unavailable
      content plus zero Tauri invocation attempts.
- [ ] Add a required `browser-e2e` CI job with Node 20, Rust/wasm target, pinned
      WASM tool, npm ci, Chromium install, and the browser suite.
- [ ] Add `browser-e2e` to aggregate `needs`, environment results, shell loop,
      and executable CI regression tests; no continue-on-error/path skip.
- [ ] Run every AGENTS.md frontend/Rust gate, F1b WASM/parity gates, Playwright,
      npm-10 dry run, RAG generator review, and real staged hook; record exact
      counts/tool versions/warnings and retain failure traces outside Git.

### Acceptance Criteria

**Scenario: Normal browser startup**  
**GIVEN** no Tauri globals  
**WHEN** the production renderer starts  
**THEN** target `browser` selects `browser-file`, `browser-worker-wasm`, and
`browser-local-storage`  
**AND** absence of Tauri is not reported as an error  
**AND** the same target is observable in the structured log/root marker.

**Scenario: Real browser Colors capability**  
**GIVEN** Chromium and the fixed parity PNG  
**WHEN** the user browses or drops it and supersedes one pending request  
**THEN** only the newest request reaches ready/error publication  
**AND** its canonical digest matches the native fixture  
**AND** a heartbeat fires during pending compute  
**AND** the generous timeout detects only a hang, not an SLA breach.

**Scenario: Browser persistence and unavailable capabilities**  
**GIVEN** browser target selection  
**WHEN** a preference is changed/reloaded, storage is denied, and each later
route/control is visited  
**THEN** successful data persists under the v1 key  
**AND** denial renders the accessible warning  
**AND** Values, Batch, Exports, export directory, video, and native zoom are
honestly unavailable without any Tauri call.

**Scenario: CI authority**  
**GIVEN** any browser-e2e failure, cancellation, skip, or missing result  
**WHEN** the aggregate job runs  
**THEN** `build-test` fails  
**AND** the executable CI regression covers that outcome.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

None yet; implementation has not begun. The build fence must replace draft
dependencies, pin the WASM tool version, and record the generous hang timeout.
