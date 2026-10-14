# Functional shared-web/Tauri path scope report

Sol (implementation partner) -> Genga (Review Lead), 2026-10-14. This is the
single read-only report assigned by
[the functional-first verdict](functional-first-priority-verdict.md). It maps
current source at clean `main` `021c2fde22630e4f533827e5fbbd9ed796ccb9da`
(the verdict itself was written against parent `6300a65`). No source was built,
launched, captured, tested, or changed for this report. This report proposes
slice boundaries; it does not authorize implementation, ticket edits, commits,
hosting, or deployment.

## Outcome first

The shortest honest route to something usable is a **single-still Colors study
that runs in both a locally served browser and Tauri from the same renderer**.
That milestone is smaller than the whole redesign, but larger than the existing
UI ticket graph currently admits:

1. the reviewed-but-unimplemented UI foundation (`168 -> 169 -> 195`);
2. a new shared-runtime capability slice for browser file input, local
   off-main-thread color compute, and browser preferences;
3. one flat shell and one redesigned Colors composition; and
4. one real-browser plus one Tauri end-to-end proof using the same fixed still
   and resolved parameters.

The current app is not already a browser product. A normal browser can mount the
legacy Svelte shell and decode a dropped image into an RGBA `ImageDataset`, but
`getComputeBridge()` and `getFsBridge()` have only Tauri implementations. Values,
video, Batch composition, native-path exports, and preference persistence also
cross Tauri-only boundaries. `npm run build` can emit static renderer files; that
fact alone does not make the resulting page functional.

The existing EPIC-027 graph also couples the first Colors composition to the
three-layout preference (196) and new patch-label model (199), while UI-D3 and
UI-D4 are still open. Under the graph as written, those are prerequisites. Under
the owner's new functional-first priority, the lead should either settle them
now or explicitly split a first one-layout/current-label Colors acceptance from
later layout/label completion. They must not be bypassed implicitly.

Full IMP-202 profiling is not needed for this route. Correctness parity, worker
isolation, a fixed-fixture completion smoke, and an event-loop responsiveness
check are enough to catch gross regressions while the product becomes usable.

## Status vocabulary

- **EXISTS**: current `main` has a source path for the named behavior. This is a
  source observation, not a fresh runtime pass.
- **PARTIAL**: a useful seam exists, but the user cannot complete the flow on
  that target or the September redesign is absent.
- **MISSING**: no current production path supplies the capability.
- **PROPOSED**: recommended slice or check, subject to a lead ruling and ticket.
- **DECISION NEEDED**: the current record deliberately leaves the choice open.

## 1. Current product surface map

| Surface / flow                              | Current Tauri source                                                                                                                                                               | Current browser source                                                                                                                                                                                       | September redesign                                                                                        | First-path disposition                                                                                                                                                                                                     |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Startup, shell, navigation                  | **EXISTS**: `App.svelte` mounts Colors, Values, Batch, Exports, Settings, media drawer and zoom overlay; responsive sidebar behavior is present.                                   | **PARTIAL**: the same shell mounts, and navigation/layout are ordinary Svelte/DOM. Startup catches missing Tauri bridge and Store failures.                                                                  | **MISSING** in production. 168/169/195 have accepted design/test seams only; 170 is planned.              | Foundation, then a narrow 170 shell acceptance. Preserve every route even if only Colors is first functional browser content.                                                                                              |
| Still-image browse/drop/preview             | **EXISTS**: native dialog and asset-path preview; Home supports multiple selections.                                                                                               | **PARTIAL**: HTML drop decodes the first `File` through canvas into RGBA and creates a blob preview. Browse calls the Tauri-only FS bridge; multiple browser drops are deliberately skipped after the first. | 171 owns redesigned ingestion/Colors composition; honest shared feedback belongs to 195.                  | Add a browser file-input adapter (browse and drop) with one-still scope. Keep Blob/dataset identity; do not pretend a browser filename is a native path.                                                                   |
| Colors analysis                             | **EXISTS**: async Tauri IPC invokes `color-core` by active path and validates the response. Existing Home source has pending, previous-result, error/retry and ready presentation. | **MISSING**: `ComputeBridge.id` is only `tauri-native`; selection throws outside Tauri even though the decoded dataset already exists.                                                                       | 171 is planned, depending on 170/195/196/199. No production study composition exists.                     | First usable vertical. Browser compute must be local and off the UI thread, with parity against the accepted core contract. Tauri keeps a target-specific adapter behind the same renderer-facing contract.                |
| Parameter change and result ownership       | **EXISTS**: Colors runner debounces, token-checks, caches and rejects stale completion; current July AUD tests cover part of cancellation/ownership.                               | **PARTIAL**: store/runner logic is shared, but no browser compute can complete.                                                                                                                              | 195 defines honest pending/previous/error presentation; active consumer wiring remains unimplemented.     | Preserve current token semantics. Adapter completion may publish only through the existing/current corrected request boundary.                                                                                             |
| Shared active material / compact collection | **EXISTS**: persistent media drawer, active selection, pin/remove/clear actions, cached image/video state.                                                                         | **PARTIAL** for a dropped still in the in-memory session; no working browser browse path and no complete browser compute.                                                                                    | 172's compact strip/full collection is backlog. UI-D1 is settled; UI-D2 and IMP-188 remain holds.         | Do not block the one-still milestone on 172. A later complete Colors/collection-return slice must wait for 188 and the UI-D2 ruling.                                                                                       |
| Values                                      | **EXISTS** for native stills/video: levels/notan/range/histogram, cached results and video scrub flow. Its Rust implementation publishes cache files.                              | **MISSING**: `requestValueAnalysis()` explicitly rejects non-Tauri execution.                                                                                                                                | 173 is planned; shared lifecycle UI depends on 195.                                                       | Follow Colors. It needs a separate in-memory browser value-analysis design and cannot be described as a free reuse of the first WASM binding.                                                                              |
| Batch                                       | **EXISTS** for native paths: pin set, two-to-eight-image aggregate, pending/error/ready, charts and pin focus.                                                                     | **MISSING** end to end: file acquisition and `compose_grid` are native-path/Tauri operations.                                                                                                                | 175 is backlog and intentionally held behind 186 plus a real Batch surface ruling.                        | Later slice after native ownership/publication prerequisites and a browser in-memory composition contract.                                                                                                                 |
| Exports                                     | **EXISTS**: Colors/Values/Batch checklists, individual saves, PNG composites, SVG/PNG graph choice and CSV/ASE/JSON. Pure renderer generators have broad deterministic tests.      | **PARTIAL**: pure SVG/data generation can run once results exist, but save/copy is Tauri-only and upstream analysis is absent.                                                                               | 174/198/200 are backlog/planned with 184/197/199 prerequisites; no live preview builder is in production. | Later slice. Start with browser Blob download only after the captured-document/ownership contract is ready; do not create a browser-only preview clone.                                                                    |
| Settings and preference persistence         | **EXISTS** through Tauri Store, including current analysis/display/video/export controls and reset.                                                                                | **PARTIAL**: defaults load after the Tauri Store error is caught; subsequent writes fail quietly except for console warnings. Native export-directory browse is unavailable.                                 | 196 is planned; 177 is backlog; UI-D3 is open.                                                            | First milestone needs an explicit browser preference adapter or an explicit session-only contract. Local storage with the same versioned schema is the smallest durable option; export-directory UI stays target-specific. |
| 2D focus / zoom                             | **EXISTS** for current images/charts.                                                                                                                                              | **PARTIAL** where a browser has a preview/result; current result production is missing.                                                                                                                      | 176 is planned and depends on 171/197/188.                                                                | Keep current basic focus reachable; faithful redesigned focus follows collection and 188.                                                                                                                                  |
| True OKLab 3D                               | **MISSING**. Existing charts are deliberate 2D projections.                                                                                                                        | **MISSING**.                                                                                                                                                                                                 | 197 is planned; 198 owns captured raster export.                                                          | Not part of first usable milestone.                                                                                                                                                                                        |
| Desktop video                               | **EXISTS**: FFprobe/FFmpeg probe, frame extraction, scrub/step, settled-frame overlay and strip generation.                                                                        | **MISSING** as a complete flow: current probe/frame/strip bridges invoke Tauri commands and browser video admission still assumes paths.                                                                     | Video states in 171/173 remain incomplete; EPIC-026 live playback is separate.                            | Defer until still Colors and Values are sound. Browser media APIs require their own adapter and parity rules; never label them FFmpeg behavior.                                                                            |
| Live playback                               | **MISSING** on `main`; historical EPIC-026 work is separate and unmerged.                                                                                                          | **MISSING**.                                                                                                                                                                                                 | Explicitly outside the September bundle and still design-blocked.                                         | Last functional lane here, separately gated by EPIC-026.                                                                                                                                                                   |

## 2. The shared-runtime gap

### What can be reused now

- The Svelte renderer, stores, current-request tokens, charts, palette/data
  serializers, and most visual export builders are target-neutral source.
- Browser drag/drop already proves that a `File` can become an RGBA
  `ImageDataset` and a blob preview without native filesystem access.
- `color-core` is Tauri-free and has deterministic byte/path, color golden,
  round-trip, and k-means snapshot tests. Its public analysis currently accepts
  encoded bytes as well as paths.
- The bridge interfaces already provide a place to choose target-specific
  implementations, even though their ID unions and factories currently admit
  only Tauri.

### What must be added before any browser claim

1. **File adapter.** Browser browse/drop returns `File`/Blob identity and a
   dataset; it never fabricates native-path authority. Browser save later uses
   Blob downloads (or a separately ruled File System Access enhancement).
2. **Compute adapter.** Local browser color analysis runs in a Web Worker and
   returns the same validated renderer contract as native compute. The worker
   consumes encoded bytes or decoded RGBA under an explicit shared contract.
3. **Preference adapter.** Tauri Store remains desktop-specific. Browser storage
   must use a versioned local adapter or be explicitly session-only for the
   first proof; silent failed saves are not acceptance.
4. **Capability selection.** Startup reports the chosen target without treating
   absence of Tauri as an error. Target-only controls (export directory, native
   zoom, sidecars) are hidden or honestly unavailable, not allowed to fail after
   interaction.
5. **Real-browser acceptance.** The repository has no current browser E2E
   runner. The accepted exact-`.svelte` SSR seam proves component structure,
   not file input, workers, focus, layout, hydration, or responsiveness.

### WASM is a reuse lead, not a restored solution

AI-IMP-041 and the parent of removal commit `01077ea` show that a wasm-bindgen
crate, build helper and browser harness previously worked. That code was removed
during the Tauri-only pivot. It cannot be restored verbatim:

- it duplicates its own color and k-means modules rather than sharing current
  `color-core`;
- its default analysis space is CIELAB, not the current OKLab contract; and
- current `color-core` uses unconditional Rayon, so a browser build needs a
  reviewed sequential/worker feature boundary or another explicit sharing
  design.

**PROPOSED default:** expose the current accepted color behavior to a dedicated
Web Worker through a wasm-bindgen adapter that reuses shared core logic and has a
non-Rayon browser feature. The exact encoded-byte versus decoded-RGBA boundary
is a lead architecture decision after a small source design. A server upload is
not the default: it would weaken the local/offline/privacy model and would not
make a self-contained browser app. A main-thread WASM call is also not the
default because it makes gross UI stalls likely even if its kernel is fast.

### Hosting and desktop loading remain separate decisions

PROJECT-RECORD §2/§13 supersedes EPIC-027's old “no web deployment” sentence:
the deliverable is one web application usable in browsers and Tauri. It still
leaves hosting, compute location, file adapters, and how Tauri loads the app
open.

The first milestone can prove the product contract with a locally served static
browser build and the same renderer code bundled by Tauri. That does **not**
settle public hosting, service-worker/offline policy, remote versus bundled Tauri
loading, update trust, CSP, or deployment. Those need a later architecture
ruling; they do not need to block local functional proof.

## 3. Smallest usable end-to-end milestone

### User-visible acceptance

A milestone is usable when all of the following are true on both targets:

1. Open the browser build or Tauri app and reach the same flat Colors study.
2. Browse for or drop one supported still image.
3. See an honest decoding/pending state, then the source preview, palette index,
   histogram, polar chart and hue-lightness chart from that exact input.
4. Change an existing analysis control and receive only the newest result, with
   previous/current provenance represented honestly.
5. Receive an actionable error for unsupported/decode/compute failure and retry
   without reloading the whole app.
6. Reload and retain approved browser/Tauri preferences, or show an explicitly
   approved session-only browser behavior; no silent persistence failure.
7. Complete the fixed parity still without a visibly frozen renderer. Browser
   compute occurs off the main thread.

The same fixed still, seed, resolved parameters and canonical result digest (or
lead-approved numeric tolerance where target arithmetic requires it) bind the
browser and Tauri proof. “Looks similar” is not parity.

### Deliberately excluded

- multiple-file collection management and select/return;
- Values, Batch, Exports and Settings completion beyond preferences needed by
  Colors;
- video, live playback, clipboard, native export directory, 3D and 3D capture;
- public hosting, service worker, account/server storage, uploads or telemetry;
- IMP-202's quiet/active-ML campaign, percentiles, Instruments and old-release
  comparison.

### Current dependency problem

The usable milestone is not one existing ticket. Foundation 168/169/195 is
already review-ready but dormant. Active Colors 171 depends on 196 and 199;
196's layout default/migration is UI-D3, and 199's label defaults/precision are
UI-D4. Neither browser compute nor browser file/preferences support has a current
ticket.

**PROPOSED functional-first ruling:**

- keep 168 -> 169 -> 195 intact;
- cut browser/shared-capability tickets before active view integration;
- choose one already-reviewed layout as the initial presentation and retain the
  current palette information in the first Colors acceptance;
- amend 171's first acceptance accordingly, while leaving 196/199 open for the
  full three-layout and label contract; or, if the lead wants the existing graph
  unchanged, settle UI-D3/D4 and implement 196/199 before 171.

This is a scheduling choice, not permission to weaken 196/199 silently.

## 4. Proposed functional slices and cheap guardrails

| Order | Slice                                | Product result                                                                                                                                                         | Existing correctness evidence to retain                                                                                                                       | Cheap gross-performance guardrail                                                                                                                                                                              |
| ----- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F0    | 168 -> 169 -> 195 foundation         | Searchable design provenance, dormant tokens, minimal study components, honest feedback model and isolated showcase. No active app yet.                                | Accepted Round 01/02 conditions; exact `.svelte` SSR transform; all existing suites unchanged; production-entry exclusion.                                    | **None for compute.** Confirm the dormant foundation adds no shipping import/runtime work; exercise showcase widths/interactions only.                                                                         |
| F1    | Shared still-image capability plane  | Browser file input, worker compute, browser preferences and target selection; Tauri adapters retain native behavior behind matching contracts. No redesign wiring yet. | New adapter contract tests; current core byte/path equivalence, color goldens/round-trips and k-means snapshots; response-schema rejection tests.             | One fixed small still must complete before a generous hang timeout, and a main-thread heartbeat/RAF callback must fire while browser compute is pending. Treat this as a stall alarm, not an SLA or benchmark. |
| F2    | First usable shell + Colors          | One flat shell and one still-image Colors study in browser and Tauri, end to end.                                                                                      | 170/171/195 component and runner tests; AUD cancellation/current-token cases; browser/native canonical result parity; unsupported/decode/compute error cases. | Real-browser and Tauri smoke: input -> pending -> correct ready; no event-loop stall over the lead's gross threshold. No p50/p95 campaign.                                                                     |
| F3    | Complete Colors collection/return    | Compact strip, full browser, select-and-return with controls/current source preserved.                                                                                 | IMP-188 revocation tests first; active-source versus pin invariants; remove/successor/error cases; UI-D1 route contract.                                      | Fixed synthetic collection at an approved practical size: open, select, return and remove without a gross long task or unbounded thumbnail/resource growth.                                                    |
| F4    | Values still-image study             | Same still opens in Values; levels/notan/range/histogram work on both targets with in-memory browser outputs.                                                          | Existing Values token/race tests; native value-cache audit; new browser/native numeric and image-dimension/content parity.                                    | Worker/async heartbeat remains live during one fixed Values case; generous completion timeout only detects hangs.                                                                                              |
| F5    | Zoom and optional true 3D            | Faithful focus/return; later actual sRGB-in-OKLab volume and fallback.                                                                                                 | 176 return/focus cases; 197 gamut-boundary numeric containment and WebGL-fallback tests.                                                                      | Mount/interact/dispose smoke catches a frozen frame and leaked repeated resources; no frame-rate optimization campaign.                                                                                        |
| F6    | Batch                                | Pin set, aggregate/contact sheet and detail work on both targets with honest ownership.                                                                                | 185 -> 184 -> 186 native prerequisites; pin/source separation, current aggregate and stale-completion tests; browser/native aggregate parity.                 | One fixed two-to-four-image batch keeps the main thread responsive and terminates; no throughput target yet.                                                                                                   |
| F7    | Captured-document Exports            | Browser download and Tauri save show/save the same captured document; existing formats remain deterministic.                                                           | 184/200 ownership/provenance; current compositor, golden, deterministic, CSV/ASE/JSON and honest-extension suites; preview/save identity tests.               | Repeated fixed document generation remains byte-deterministic and terminates without a gross main-thread stall. No export speed SLA.                                                                           |
| F8    | Settings/reflow whole-app acceptance | Full settings placement, migration/reset, and all supported widths/routes.                                                                                             | 177 viewport, keyboard, focus, reduced-motion and persistence matrix; target-specific unavailable controls.                                                   | Route/width sweep detects hangs and runaway layout work only; visual and interaction acceptance dominate.                                                                                                      |
| F9    | Video, then EPIC-026 live            | Target-specific video adapters, correct frame/strip semantics, later live updates.                                                                                     | Existing AUD video race/resource suites plus requested/settled frame identity and target-specific decode parity.                                              | Fixed seek/+1-frame cases keep input feedback responsive and terminate. Full video performance work remains IMP-202/EPIC-026 territory.                                                                        |

F0 and a lead-reviewed F1 source design can proceed independently if their file
fences do not overlap. F2 must consume both; a visually redesigned shell that
still throws outside Tauri is not a usable shared-web milestone.

## 5. Existing test and golden map

### Directly useful now

- `color-core/tests/analyze_bytes.rs`: deterministic byte analysis and byte/path
  palette equivalence. This is the strongest current starting point for a
  browser/native color-compute contract.
- `color-core/tests/color_goldens.rs` and renderer
  `exports/__tests__/color-goldens.spec.ts`: current color conversion fixture.
- `color-core/tests/color_roundtrip.rs` and renderer
  `color-roundtrip.spec.ts`: RGB/OKLab and RGB/HSV round trips.
- `color-core/tests/kmeans_snapshots.rs`: seeded clustering snapshots.
- `views/__tests__/audit-control-flow-races.spec.ts`: 15 current runner/store
  tests covering Values/video races, Colors/Values cancellation, cache
  invalidation, resource deduplication and raw-video promotion.
- `audit-resource-integrity.spec.ts`, `audit-export-paths.spec.ts` and
  `audit-p4-regressions.spec.ts`: resource cleanup/listener, extension/timestamp,
  pin-zero and Settings-copy regressions.
- The renderer's twelve export-focused spec files cover compositor structure,
  color/value/notan compositions, deterministic SVG/data output, palette
  CSV/ASE/JSON, hue-lightness behavior and the gamut-boundary helper.
- `src-tauri/tests/audit_value_cache.rs` and Rust unit tests cover current native
  value-cache behavior. They are desktop evidence, not a browser implementation.

### What they do not prove

- No test executes a production browser compute adapter, because none exists.
- No current real-browser E2E test exercises file input/drop, worker messaging,
  browser persistence, responsive layout, focus, or download.
- The accepted foundation SSR seam is still a design/proof verdict; the actual
  168/169/195 production candidate has not been implemented.
- Current audit tests protect only the July `main` behaviors. They do not import
  the later unmerged correctness-wave candidates or close 184/185/186/188.
- Pure export determinism does not prove immutable source ownership, preview/save
  identity, save-dialog success, or target integration.

### Minimum new evidence for F1/F2

1. One bridge contract suite runs the same fixture/parameters against native
   response fixtures and the browser worker result, including invalid response,
   cancellation/stale result, empty pixels and unsupported input.
2. One canonical digest/tolerance record proves current `color-core` behavior is
   preserved; no independent old-WASM numeric implementation is accepted by
   self-consistency alone.
3. One real-browser flow covers browse and drop, pending/previous/ready/error,
   preference reload and a parameter change while a prior request is pending.
4. One Tauri flow repeats the same user-visible case and verifies target
   selection. Browser evidence cannot substitute for native IPC, and Tauri
   evidence cannot substitute for workers/Blob handling.
5. The ordinary frontend/Rust gates from AGENTS.md remain mandatory on every
   implementation candidate. The cheap performance smoke supplements them; it
   does not replace them or start IMP-202.

## 6. Holds and blockers

### Blocks the first usable milestone

1. **No ruled shared-runtime architecture.** PROJECT-RECORD fixes the product
   destination but deliberately leaves compute, file adapters, hosting and
   Tauri loading open. F1 needs an explicit architecture/ticket fence.
2. **No browser compute or FS/prefs adapter.** This is the direct functional
   blocker, not a performance issue.
3. **Foundation implementation is not authorized.** Review and test-seam design
   are accepted; 168/169/195 remain planned and absent from production.
4. **171's dependency coupling.** UI-D3/UI-D4 or an explicit functional-first
   split must be ruled before a smaller Colors slice can claim ticket
   conformance.
5. **No real-browser acceptance route.** A bounded harness/tool choice needs its
   own dependency/config fence; SSR alone is insufficient.

### Does not block the one-still milestone, but blocks later slices

- **IMP-188** blocks full collection/focus return, not a one-still uploader and
  Colors result.
- **IMP-193-5** is a backlog production renderer-session adapter. A stateless
  browser worker and the current one-request Tauri still analysis do not publish
  retained native generated artifacts, so 193-5 need not gate F1/F2. It becomes
  relevant when a chosen desktop-loading/restart contract or native artifact
  lifecycle actually requires renderer-incarnation ownership.
- **IMP-185 -> 184 -> 186** block truthful retained Values outputs, captured
  export jobs and Batch reclamation. They therefore block F4/F6/F7 native
  completion, not F2.
- **UI-D2** blocks destructive collection behavior; **UI-D5** blocks live video;
  **UI-D6** blocks final export follow/freeze behavior.
- 197/198/200 and their upstream dependencies block 3D/export completion, not
  basic still Colors.

### Risks to keep explicit

- A worker boundary avoids UI blocking but does not guarantee fast compute. The
  first criterion is correct termination with responsive input; IMP-202 later
  establishes distributions and bottlenecks.
- Browser and native image decode may produce different pixel bytes for some
  formats. The parity fixture must bind decoded dimensions/pixels or explicitly
  classify decode differences before comparing clusters.
- Browser memory owns File/Blob/dataset lifetime; native paths and generated
  artifacts have different ownership. One interface must not erase that
  distinction.
- A locally served proof is not hosted-product security. Public deployment later
  needs CSP, asset/offline, origin, update and trust rulings.
- Historical WASM success lowers packaging uncertainty but increases the risk of
  accidentally reviving obsolete CIELAB/duplicated numeric behavior.

## 7. Recommended lead actions

1. Accept or amend this map and rule the **F1 compute/file/prefs architecture**.
2. Issue the already-reviewed **F0 foundation build fence** on current `main`,
   preserving one ticket/commit in 168 -> 169 -> 195 order.
3. Cut narrowly separated F1 tickets: browser file/preferences capability;
   worker/WASM current-core compute and parity; target selection plus real-browser
   harness. Name exact files and package/lock authority.
4. Decide whether functional-first means a one-layout/current-label first Colors
   acceptance or full 196/199 prerequisites. Record the choice as a ticket/verdict
   amendment before F2.
5. Issue F2 only after F0 and F1 contracts are accepted. Require the same-still
   browser/Tauri proof and the cheap responsiveness alarm.
6. Keep 188 and 185 -> 184 -> 186 in their own correctness order before the
   collection/Values/Batch/export slices that consume them.
7. Leave public hosting, Tauri remote/bundled loading, video/live and the full
   IMP-202 campaign outside the first build fence.

No owner input is required to begin F0 or to have the lead rule a proposed F1
architecture. Owner attention is needed only if the lead cannot select the
initial layout/label staging or final hosting/loading trust model from the
existing product direction.
