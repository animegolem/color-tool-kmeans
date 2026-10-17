---
node_id: AI-IMP-208
tags:
  - IMP-LIST
  - Implementation
  - ui
  - Browser
  - Tauri
  - Epic-029
kanban_status: planned
depends_on:
  - AI-EPIC-029
  - AI-IMP-168
  - AI-IMP-169
  - AI-IMP-195
  - AI-IMP-204
  - AI-IMP-205
  - AI-IMP-206
  - AI-IMP-207
  - AI-IMP-201
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.86
date_created: 2026-10-17
date_completed:
draft_key: F2
---

# AI-IMP-208-first-usable-shell-colors

Minted by the Review Lead (Genga) on 2026-10-17 from Sol's F2 draft
(`RAG/reviews/EPIC-029/f2-first-usable-shell-colors-ticket-draft.md`, sha256
8cb7ded2…), unchanged apart from the two lead rulings and the test (b)
correction recorded under Lead rulings below. Implementation is fenced to Sol
on base `main` f61c81e (after AI-IMP-207 and AI-IMP-201 B2). F2 acceptance
still requires the implementation head's aggregate gate to be green, which
needs the hosted run.

## Make one Colors study usable in both browser and Tauri

F0 and F1 are complete on inspected clean `main` `8c076d6`: the dormant study
foundation exists, and one shared renderer now has browser file input, durable
preferences, worker/WASM compute, exact current-core parity, runtime target
selection, and a required Playwright gate. The shipping shell and Colors view
still use the pre-September composition and do not consume the accepted study
primitives.

Activate one restrained shell and one still-image Colors composition without
changing analysis behavior. Done means a user can open either the locally
served browser build or the Tauri app, choose or drop the same supported still,
understand decode/pending/previous/error states, and use the source preview,
palette index, histogram, polar chart, hue-lightness chart, and existing
analysis controls end to end. Both flows must bind to the same canonical digest
and remain responsive under the existing A4 gross-hang alarm.

This ticket combines the first functional acceptance of AI-IMP-170 and
AI-IMP-171 under the functional-first split. It does not mark either ticket's
later full redesign contract complete.

### Out of Scope

- Multiple-file collection management, the compact strip/full collection, and
  select-and-return behavior (F3 / AI-IMP-172 / AI-IMP-188).
- Values, Batch, Exports, or Settings completion beyond already-working Colors
  preference persistence; browser-unavailable surfaces remain honest.
- The three-layout preference and migration contract (AI-IMP-196), new
  semantic/HEX palette labels (AI-IMP-199), true 3D (AI-IMP-197), or 3D capture.
- Video, live playback, clipboard ingestion, native export-directory work,
  browser downloads, hosting, service workers, uploads, accounts, or telemetry.
- Numeric, sampling, seed, worker, cancellation, cache, native IPC, Rust/core,
  or export-format changes.
- IMP-202 profiling, Instruments, percentiles, performance comparisons, or a
  latency SLA. The A4 thresholds are freeze/hang alarms only.
- CI repair work owned in Astra's separate lane. F2 acceptance still requires
  the implementation head's required aggregate gate to be green.

### Design/Approach

#### Initial reviewed layout: A / Workbench

Use **A / Workbench** from
`RAG/design-system/2026-09/app-layout-studies.html` as the one initial layout.
That reference starts selected as `data-layout="desk"` and arranges source,
figures, and palette index side by side, with a two-column intermediate reflow
and a single-column compact stack. The durable reference is a conversation
fragment, not production source; `RAG/design-2026-09/README.md` says its named
icon positions are placeholders.

Adapt only that composition:

- flat top navigation keeps Colors, Values, Batch, Exports, and Settings
  reachable without remounting active study state;
- the Colors workspace presents source/ingestion and existing parameters,
  current 2D figures, and the palette index as one study;
- wide layout follows `source | figures | index`, then reflows without losing
  controls, results, focus, or scroll access;
- the reference's collection row is omitted until F3, and its reserved color
  volume is omitted until AI-IMP-197;
- placeholder title, collection count, semantic color names, and HEX labels are
  not copied into production.

The palette index uses the current information contract only: dominance rank,
swatch, RGB triplet, pixel count, and share. It does not infer color names or
adopt AI-IMP-199's still-open shared label/precision contract.

Import the accepted `study-tokens.css`, `study-controls.css`, `FigureFrame`, and
`FeedbackState` into the production composition without changing their F0
contracts. Map actual store/runner state into caller-supplied feedback:

- decoding and compute pending are explicit;
- a previous visible result remains visibly attributed to its source and
  settings while a newer request is pending;
- only the current request may replace the visible result or publish an error;
- unsupported/decode/compute failures have an action the current implementation
  can really perform (choose again, retry, or dismiss), never a synthetic
  cancel/relink/undo promise.

Preserve every existing analysis control, default, chart mode, zoom action, and
target-specific save affordance. Presentation-only chart changes must not
trigger analysis. Analysis-affecting changes keep the current 400 ms successor
debounce and token revocation fixed by AI-IMP-206.

#### Same-run digest evidence

AI-IMP-205 requires every compute response to contain `resultDigest`, but the
current `toAnalysisResult()` conversion validates and then drops it. F2 should
retain that already-computed value as optional renderer provenance, expose it
on the Colors root as `data-result-digest`, and include it in the existing
structured ready event used by the native receipt. It is not displayed as
product copy and does not alter clustering or serialization.

The shared `AnalysisResult` type is also constructed by Batch, so the field may
remain optional for those non-F2 constructors. A mounted Colors `ready` state is
not accepted without it: both compute adapters already reject a response whose
digest is absent or invalid, and the F2 tests require the exact value.

The F2 fixed case is the checked-in
`test-patterns/hsl_ligthness.png`, source SHA-256
`b1ed9e6c45c8d2b1a91216171a0fdacab7bf29ff28db3f3e2bc0cc9aba63aa43`,
with the seed and fully resolved parameters in
`color-core/tests/fixtures/f1-parity.json`. Both mounted target flows must report
that record's exact digest
`e50479b91d9ea898a29934b71d21adf8b1510228d8a59ed786028bb316f31d8b`.
A standalone core/WASM parity command remains a required control, but cannot by
itself substitute for the mounted browser or Tauri flow.

#### Practical validation

Playwright runs the production browser build on loopback and proves chooser and
drop, all visible surfaces, supersession/provenance, actionable errors, durable
preferences, the exact mounted digest, compact reflow, keyboard reachability,
and A4: ready within 60 seconds with no pending heartbeat gap over 1,000 ms.

The native proof uses one fresh, exact unsigned debug `.app` built from the
implementation head, not an installed copy or an arbitrary process. Record the
source SHA, bundle/executable hashes, PID/start time, `tauri://localhost`, target
`tauri`, fixed-input hash, resolved parameters, ready-event digest, and absence
of a `renderer:stall` alarm during the bounded case. Through the native picker,
exercise pending -> ready, one successor parameter change, an actionable
temporary-file failure followed by retry without relaunch, and preference
reload. Record the initial preference, restore it after the persistence check,
and do not install the app or alter owner source files. The native smoke is
macOS evidence only, not Windows/Linux, release, or owner visual acceptance.

#### Lead rulings (2026-10-17)

Both rulings bind. Where they are stricter than the text above, they win.

**Ruling 1: the mounted-digest seam is approved as drafted.** `resultDigest`
rides on `AnalysisResult` as an optional field; Batch and the other
constructors stay untouched. A mounted Colors `ready` requires the digest. It
is exposed only as `data-result-digest` and in the ready event, never as
product copy. Clustering and serialization are unchanged. Tests, each seen red
first:

- (a) a mutant `toAnalysisResult` that drops the digest turns the F2 tests red;
- (b) the bridges' existing rejection of a malformed digest stays and is seen
  red: missing, wrong length, uppercase, non-hex. A schema-valid wrong digest
  (one hex character changed) cannot be rejected by the bridges without
  recomputing, which would be an unlisted compute-contract change; the
  mounted-digest test catches it instead, as a fixture mismatch against the
  expected `e50479b9…`;
- (c) both mounted targets report exactly
  `e50479b91d9ea898a29934b71d21adf8b1510228d8a59ed786028bb316f31d8b` for
  `test-patterns/hsl_ligthness.png` with the f1-parity parameters.

**Ruling 2: the direct native receipt replaces the absent runbook,
strengthened.**

- One launch: a fresh unsigned debug `.app` built from the implementation head.
  Record the source SHA, the sha256 of the bundle and the executable, and the
  PID with its process start time. Record a launch nonce in that process's
  first log line; every receipt line must come after the nonce, from that
  launch. A log file the launch didn't create proves nothing.
- Ready: the ready event from that launch carries `e50479b9…`, with the
  fixed-input hash and the resolved parameters.
- Stall coverage is positive, not an absence: the window stays visible
  throughout and `visibilityState` is recorded; that launch's
  `renderer:heartbeat` lines span the bounded case at their 5 s cadence (record
  the count and the first and last times); and no `renderer:stall` line
  appears between the case's start and ready.
- The watchdog is seen red once: the browser leg runs the same `App.svelte`
  code, where a forced main-thread block over 1,000 ms must produce
  `renderer:stall` as a planted control. Native proves liveness with the
  heartbeats; the browser proves the detector fires.
- The dangling pointer: `CLAUDE.md` names the absent `TAURI-NATIVE-RUNBOOK.md`.
  Replace that one line with a pointer to this ticket's native receipt.

### Files to Touch

Paths are repository-root relative. Every implementation path is listed; the
lead must amend this list before any additional path is edited.

- `tauri-app/src/App.svelte`: flat Workbench shell, preserved routes, settings
  affordance, and transitional media access.
- `tauri-app/src/app.css`: import the accepted study styles and new shell sheet;
  remove only superseded shell rules.
- `tauri-app/src/lib/styles/study-shell.css` (new): scoped Workbench grid,
  intermediate/compact reflow, focus, and coarse-pointer rules.
- `tauri-app/src/lib/stores/analysis.ts`: retain the already-validated digest as
  nonvisual Colors result provenance; no token/state behavior change.
- `tauri-app/src/lib/bridges/compute.ts`: preserve parsed `resultDigest` in the
  renderer result instead of dropping it.
- `tauri-app/src/lib/bridges/compute.spec.ts`: prove both target adapters retain
  the validated digest and still reject a malformed digest (missing, wrong
  length, uppercase, non-hex), per Lead ruling 1 (b).
- `tauri-app/src/lib/views/HomeView.svelte`: Workbench composition; actual
  feedback/provenance mapping; palette index; mounted digest marker/ready event.
- `tauri-app/src/lib/views/home/AnalysisCards.svelte`: render current charts in
  accepted `FigureFrame` surfaces without changing generators or modes.
- `tauri-app/src/lib/views/home/ParameterControls.svelte`: place all existing
  controls in the source study zone without changing bindings/defaults.
- `tauri-app/src/lib/components/study/PaletteIndex.svelte` (new): current
  rank/swatch/RGB/count/share index over the visible result.
- `tauri-app/src/lib/components/study/PaletteIndex.spec.ts` (new): deterministic
  order/labels, empty handling, semantics, and no invented name/HEX contract.
- `tauri-app/src/lib/views/__tests__/study-shell.spec.ts` (new): route parity,
  active-state preservation, reflow structure, and keyboard semantics.
- `tauri-app/src/lib/views/__tests__/study-colors.spec.ts` (new): mounted
  empty/pending/previous/error/ready composition, provenance, control binding,
  latest-only publication, digest marker, and retry actions.
- `tauri-app/tests/browser/f2-first-usable-colors.spec.ts` (new): full fixed
  browser flow, exact digest, error/retry, persistence, responsive interaction,
  and A4 alarms.
- `CLAUDE.md`: one line only, replacing the dangling `TAURI-NATIVE-RUNBOOK.md`
  pointer with a pointer to this ticket's native receipt (Lead ruling 2).
- The lead-minted ticket's checklist and Issues Encountered after authorized
  implementation only.

Do NOT touch `study-tokens.css`, `study-controls.css`, `FigureFrame.svelte`,
`FeedbackState.svelte`, `feedback-state.ts`, `DevStudyShowcase.svelte`,
`navigation.ts`, `MediaBucket.svelte`, the file-ingestion or analysis-runner
factories, other views, chart/export generators, F1 worker/runtime/preference
adapters, package/lock/config/workflow files, Rust/color-core, design carriers,
prior review records, PROJECT-RECORD, or other worktrees. RAG index generation,
ticket minting, commits, and merges remain lead-owned.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Import the accepted scoped study tokens/controls and add only the new
      Workbench shell sheet to the shipping entry.
- [ ] Replace the sidebar-heavy shell with flat top navigation while preserving
      all five routes, target-unavailable behavior, media access, zoom, and
      active study state.
- [ ] Compose source/ingestion, all existing parameters, histogram, polar,
      hue-lightness, and palette index in A / Workbench at wide width.
- [ ] Reflow to two columns and then one column without clipping, horizontal
      page overflow, lost focus, or remounting/reanalysis caused by layout.
- [ ] Render deterministic dominance-order palette rows with rank, swatch, RGB,
      count, and share only; link selection only if it uses current proven state
      and does not trigger analysis.
- [ ] Map real empty, decoding, pending-without-result,
      pending-with-previous-result, error, and ready states through the accepted
      feedback model with honest source/settings provenance.
- [ ] Preserve the previous result during a successor request and prove only
      the newest store token may publish result, error, or final cleanup.
- [ ] Retain `resultDigest` through the compute conversion, expose it only as a
      nonvisual validation marker/ready receipt, and reject missing/invalid
      bridge digests as before.
- [ ] Show Lead ruling 1's tests red first, then green: (a) the digest-dropping
      mutant; (b) malformed-digest rejection in both bridges, and the
      one-hex-changed digest as a mounted fixture mismatch; (c) the exact
      digest from both mounted targets.
- [ ] Keep every current analysis/display control, default, chart toggle/mode,
      zoom path, and target-specific save affordance behaviorally unchanged.
- [ ] Prove unsupported/decode/compute failures provide only real recovery
      actions and retry succeeds without an app reload.
- [ ] Prove an approved preference persists across browser reload and native
      reload; surface persistence failure rather than failing silently.
- [ ] Extend real-browser coverage with the fixed fixture, exact digest, chooser
      and drop, latest-only successor, feedback/provenance, reflow, keyboard,
      retry, persistence, and A4 assertions.
- [ ] Build one exact unsigned debug macOS app and execute the bounded native
      fixed-fixture/error/retry/persistence/A4 smoke with identity and event-log
      receipts bound by Lead ruling 2 (launch nonce, positive heartbeat
      coverage, no stall); restore the changed preference afterward.
- [ ] Plant the browser-leg watchdog control: a forced main-thread block over
      1,000 ms produces `renderer:stall` (Lead ruling 2).
- [ ] Replace the dangling runbook line in `CLAUDE.md` (Lead ruling 2).
- [ ] Run `npm run test -- --run`, `npm run check`, `npm run lint`, and
      `npm run format:check` from `tauri-app/`; record exact counts and the two
      accepted AUD-020 warnings if still present.
- [ ] Run `cargo fmt --all -- --check`,
      `cargo clippy --workspace -- -D warnings`, and `cargo test --workspace`
      from `tauri-app/src-tauri/`, using `--offline` only if needed.
- [ ] Run the F1 WASM build/parity commands, the full Playwright Chromium suite,
      required CI-contract tests, `git diff --check`, RAG generation after the
      lead-minted ticket update, and the real staged hook; report exact versions,
      counts, warnings, generated-index delta, and unrun platform/owner gates.
- [ ] Confirm all unlisted source/config/dependency/design files are byte-identical
      and flag the cohesive over-400-LOC files as advisory rather than silently
      refactoring them under F2.

### Acceptance Criteria

**Scenario: Both targets open the same first usable study**  
**GIVEN** the production renderer selects either `browser` or `tauri`  
**WHEN** the app opens at Colors  
**THEN** both targets show the A / Workbench flat shell and one Colors study  
**AND** Colors, Values, Batch, Exports, and Settings remain reachable  
**AND** target-unavailable capabilities remain honest and inert.

**Scenario: One supported still becomes one attributable result**  
**GIVEN** the fixed parity PNG, seed, and resolved parameters  
**WHEN** the user browses for or drops the image  
**THEN** decoding and compute pending are represented honestly  
**AND** the exact source preview, palette index, histogram, polar chart, and
hue-lightness chart reach ready  
**AND** rank/RGB/count/share describe the same visible result  
**AND** the mounted target reports the exact canonical digest
`e50479b91d9ea898a29934b71d21adf8b1510228d8a59ed786028bb316f31d8b`.

**Scenario: A control change supersedes prior work**  
**GIVEN** a visible result and an existing analysis-affecting control  
**WHEN** request B supersedes pending request A  
**THEN** the previous visible result is explicitly attributed to its old source
and settings while B is pending  
**AND** A cannot replace the result or publish error/final cleanup  
**AND** only B's result, provenance, and digest become current.

**Scenario: Failure is actionable without relaunch**  
**GIVEN** an unsupported input, decode failure, compute failure, or preference
persistence failure  
**WHEN** that failure occurs on the active target  
**THEN** the study identifies the failed operation without hiding the prior
result's provenance  
**AND** it offers only a supported choose-again/retry/dismiss action  
**AND** a valid retry can reach ready without reloading the whole app.

**Scenario: Preferences remain honest**  
**GIVEN** an approved Colors preference is changed  
**WHEN** the browser page or exact Tauri app reloads  
**THEN** the approved value is retained under the target's F1 adapter  
**OR** a real persistence failure appears in the accessible warning surface.

**Scenario: A4 catches a gross freeze, not ordinary variation**  
**GIVEN** the fixed parity case in the mounted browser or Tauri flow  
**WHEN** compute is pending  
**THEN** the case reaches its exact ready digest within 60 seconds  
**AND** no observed main-thread heartbeat gap exceeds 1,000 ms  
**AND** the result is reported only as a hang/freeze alarm, not a benchmark,
percentile, SLA, or performance comparison.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

Drafting found one evidence gap: AI-IMP-205 validates `resultDigest`, but
`toAnalysisResult()` currently discards it before the mounted Colors result. The
proposed narrow `analysis.ts` / `compute.ts` / `compute.spec.ts` seam above makes
the same-run browser/Tauri proof inspectable without changing compute. The
Review Lead must confirm that widening before issuing the fence; otherwise the
lead must name an equally direct mounted-runtime digest receipt rather than
substituting the standalone parity control.

`CLAUDE.md` names `TAURI-NATIVE-RUNBOOK.md`, but that file is absent on the
inspected base. This draft therefore specifies the native receipt directly and
does not rely on the missing document.

Lead rulings, 2026-10-17 (Genga): the evidence seam above is approved (ruling
1). Test (b) was corrected after Astra showed that a schema-valid wrong digest
can't be rejected by the bridges. The native receipt replaces the absent
runbook (ruling 2). The rulings went to Astra and Sol by house letter; this
ticket is their canonical form.
