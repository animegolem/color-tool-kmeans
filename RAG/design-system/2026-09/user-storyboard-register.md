# Color studies — user-story storyboard register

Status: design review candidate, 2026-09-04. No production code or ticket status changed.

Companion visual: `user-storyboard.html` in this directory. It contains 34 frames across seven stories: six recaps of earlier sketches, 24 new proposals, and four frames with explicitly unresolved decisions. “Earlier sketch” does not mean implemented. “New proposal” does not mean approved or acceptance-tested.

## Scope and evidence

This is a design-state inventory for the agreed flatter study interface: interchangeable layouts, familiar 2D figures, an optional real OKLab gamut figure, an expanded palette index, and a compact collection strip opening a full media browser. It extends the collection story into the neighboring lifecycle states that otherwise leave holes in implementation. Exports are the next design review, not redesigned here.

Grounding inspected in the current checkout:

- [Design coverage manifest](/Users/golem/git/color-tool-kmeans/RAG/DESIGN-COVERAGE.md): L1–L12 and outstanding artifact requests. Its coverage judgments concern the older notebook bundle; they are not approval of these new frames.
- [Bucket implementation ticket](/Users/golem/git/color-tool-kmeans/RAG/AI-IMP/AI-IMP-172-bucket-page.md:21): planned bottom strip, full bucket, and selection returning to Colors.
- [Current MediaBucket](/Users/golem/git/color-tool-kmeans/tauri-app/src/lib/components/MediaBucket.svelte): item activation, separate pins, Shift-pin range, removal, and raw-video pin exclusion.
- [Current shell](/Users/golem/git/color-tool-kmeans/tauri-app/src/App.svelte:390): toggleable library rail rather than the proposed bottom strip.
- [Image selection and removal](/Users/golem/git/color-tool-kmeans/tauri-app/src/lib/stores/image.ts:265): removal releases resources and caches; removing the active item chooses an eligible remaining image or clears selection. Video selection follows a separate debounced path.
- [Pin store](/Users/golem/git/color-tool-kmeans/tauri-app/src/lib/stores/multi-analysis.ts): pins are separate from the active image; pin changes invalidate aggregate results, and removed entries are pruned.
- [Batch view](/Users/golem/git/color-tool-kmeans/tauri-app/src/lib/views/BatchView.svelte:140): fewer than two pins is an empty/not-enough-inputs state, not a ready aggregate.

## Story 1 — Bring media in

As an artist, I can bring references into the collection without losing successful imports or the study I already have open.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| I1 | Empty study and collection | First visit or last item removed; choose/drop/paste remain discoverable | New proposal; L1/L5 |
| I2 | Valid drag-over | Show the real drop destination; leaving the target restores the prior state | New proposal; L1 |
| I3 | Reading/decoding media | Identify ready/pending files; show counts only when known; do not invent progress | New proposal; L1 |
| I4 | Partial import success | Preserve usable files and identify rejected filenames with a recovery action | New proposal; L1/L12 |
| I5 | No usable input | Empty clipboard/unsupported content gets feedback; native-picker cancellation is silent | New proposal; L1/L12 |

Implementation question: the proposed “Cancel remaining” action needs an ingestion ownership/cancellation contract. It is not evidence that the present ingestion pipeline can cancel work already underway.

## Story 2 — Make a study

As an artist, I can tell whether a result belongs to my current source and settings, even while work is pending or fails.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| S1 | First analysis pending | Source is available; figures do not imply results already exist | New proposal; L2 |
| S2 | Ready study | Source, figures, expanded index, and collection refer to the same active media | Earlier sketch; L2 |
| S3 | Previous result / new settings pending | Label the old result as previous and identify the requested change | New proposal; L2/L6/L7 |
| S4 | Analysis error | Keep the source/parameters; offer retry or parameter adjustment | New proposal; L2/L12 |
| S5 | Cancelled or superseded work | A new active source owns the view; late old results must not repaint it | New proposal; L2 |

Shared visual idiom: use a quiet hatched pending surface and explicit text. Do not dim the entire app, animate a fake percentage, or present an old image’s result under the new image’s name. An optional previous result is safe only when its source/settings provenance stays visible. This is a proposal, not a new backend lifecycle implementation.

## Story 3 — Browse a collection

As an artist, I can choose another reference and return directly to the study, without keeping a large browser open.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| C1 | Compact strip with overflow | Fit real thumbnail slots; “N more” counts all items not currently shown | Earlier interaction sketch; L5/L11 |
| C2 | Full collection | Open from overflow/View all; preserve active item separately from pins | Earlier interaction sketch; L5 |
| C3 | Select and return | Open one item, return to the study with the new source identified, then show loading/ready/error honestly | Earlier interaction sketch; L5 |
| C4 | Few items or narrow width | Reflow; selected item remains represented; retain View all even when nothing overflows | New proposal; L5/L11 |

Interaction invariants:

- Compact thumbnails activate media; full collection holds management controls.
- Clicking a media tile returns to a study. Pin/remove actions do not activate the media or dismiss the collection.
- Back/Escape does not change the selected image. Return keyboard focus to a meaningful origin/active item; preserve the invoking study's scroll position in the production implementation.
- The collection's underlying order remains stable. If an off-strip item is activated, adjust the visible window without changing collection order.
- Resizing changes visible capacity and hidden count, not active media, analysis, pins, or camera.
- A selected item is not necessarily analyzed or successfully decoded. The return view needs S1/S4 or the video equivalent.

Routing decision still needed: the old ticket explicitly returns to Colors. The new collection story suggests returning to the invoking compatible study (Colors or Values). Raw video may require Colors. Batch pinning must stay a separate operation. Do not silently alter the ticket's routing rule in implementation.

## Story 4 — Manage references

As an artist, I can prepare a batch or remove references without accidentally navigating or deleting source files.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| M1 | Pin selection in collection | Toggle/Shift-pin without dismissing the collection; raw clips remain ineligible | Earlier interaction sketch; L5/L7 |
| M2 | Remove one confirmation | Explicit collection-only removal; do not promise Undo after resource disposal | Decision needed; L5 |
| M3 | Active item removed | Communicate the new eligible active source, or no selection if none remains | Decision needed; L5 |
| M4 | Clear collection confirmation | Clear entries/pins, not original files; last item leads to I1 | Decision needed; L5 |

Decisions to settle:

1. Confirm each removal, or develop real undo/deferred cleanup? Current resource cleanup makes a decorative Undo button misleading.
2. Preserve current first-eligible-image successor, choose nearest eligible neighbor, or clear active selection? The storyboard intentionally does not select a new algorithm.
3. Pin/removal affordances on coarse pointers and keyboard, including Shift-range anchor behavior after removal.

## Story 5 — Arrange and inspect

As an artist, I can rearrange or inspect a study without creating a second copy of its data or losing my position.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| P1 | Layout preference | Three named layout icons change arrangement only; automatic responsive reflow remains | New proposal; L9/L11 |
| P2 | Linked palette selection | Index/figure selection highlights the same cluster; no analysis rerun | New proposal; L2/L10 |
| P3 | Focused 3D | Expand inline gamut view; return with camera, selection, and position preserved | Earlier 3D/flow sketch; L10 |
| P4 | 3D unavailable | Show a clear limitation and keep 2D analysis usable | New proposal; L10/L12 |
| P5 | Source or 2D figure zoom | Local fit/zoom controls and explicit return; not confused with layout preference | New proposal; L10 |

The small P1 pictograms are positional placeholders, not approved final icons. Labels/accessible names remain essential. The full Settings sheet (all current preferences, validation, defaults, and persistence behavior) is still undrawn. P1 covers layout preference only.

## Story 6 — Values and batch

As an artist, I can study tonal structure and compare references without confusing per-image settings, batch settings, and selection.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| B1 | Values ready | Same active source; distinct tonal controls and result; use shared pending/error variants | New proposal; L6 |
| B2 | Fewer than two pins | Explain required inputs; open collection or add images | New proposal; L7 |
| B3 | Batch selection/settings | Eligible pinned sources and separately scoped batch controls | New proposal; L7 |
| B4 | Aggregate pending | Separate composing/analyzing status; cancellation retains collection and pins | New proposal; L7 |
| B5 | Aggregate ready / pin inspection | Source provenance remains visible; pin detail returns to the same aggregate | New proposal; L7/L10 |

This is a state storyboard, not a replacement for the real BatchView design review required by the coverage manifest. Contact-sheet geometry and the full pin-detail overlay are not final comps.

## Story 7 — Desktop video

As an artist, I can inspect moving color and preserve a useful frame while knowing which frame the results describe.

| Frame | Visible state | Trigger and required outcome | Provenance |
| --- | --- | --- | --- |
| D1 | Probe pending | Clip identity is visible; probe failure has a recovery path | New proposal; L3 |
| D2 | Seek/decode pending | Label the shown settled frame separately from the requested timestamp | New proposal; L3 |
| D3 | Filmstrip/barcode generating | Missing thumbnail/strip work does not block usable playback | New proposal; L3 |
| D4 | Live analysis | Readable playback state, stable ledger identity/order, quiet throughput/drop feedback | Decision needed; L4 |
| D5 | Pause-to-settle | Identify the live estimate until still-frame refinement is ready | New proposal; L4 |
| D6 | Snapshot added | Timestamped frame enters collection, retains clip context, and can be pinned for batch | New proposal; L3/L5 |

Images-only web hosting remains a tentative product split. D1–D6 are desktop-only in this storyboard; this does not authorize removing desktop video or implementing a web port. Live playback frames are design proposals, not a claim that the pending live-mode epic has landed.

## Remaining branch variants — not separate full drawings yet

These remain explicit design/acceptance work. Reusing a status idiom is not proof that every state is resolved.

| Variant | Parent frame | What still needs definition or a close-up |
| --- | --- | --- |
| Unsupported file, corrupt file, empty clipboard, mixed-file partial success | I4/I5 | Exact copy and retry/replacement actions; do not hard-code unsupported extensions without codec verification |
| Duplicate import, thumbnail failure, missing original file | I3/I4/C2 | Existing dedup behavior, placeholder/relink/retry policy; relink is not assumed implemented |
| Pending import cancelled, delayed errors after navigating away | I3/S5 | Honest ownership and delivery location of feedback |
| Previous result plus failed recomputation | S3/S4 | Keep explicit old-result provenance alongside error; decide export eligibility in the exports pass |
| Keyboard focus, reduced motion, close/return scroll restoration | C2/C3/P3/P5 | Real interaction validation, beyond artboard/reflow screenshots |
| Very large full collection | C2 | Full-grid scrolling/virtualization and optional search threshold; no new search feature adopted here |
| Remove pinned item, active clip, or last eligible image | M2/M3 | Pin count, aggregate invalidation, safe successor, and clear empty-active state |
| Batch pin limit, invalid source, compositing error, aggregate error | B2/B3/B4 | Specific copy and actions; do not silently drop failed batch sources |
| Full Settings and persistence | P1 | Inventory current controls, storage failures, scope/defaults, icon labels |
| 3D context loss after expansion | P4 | Preserve selection and return route; retry without recreating analysis |
| Video decode/probe/sidecar error | D1/D2 | Distinguish retryable media errors from missing ffmpeg/setup failures |
| Scene cut, live parameter change, overload, zoom during live | D4/D5/P5 | Ledger ordering/identity contract and focused-view behavior; no fake FPS values |
| Snapshot pending/failure and strip generation failure | D3/D6 | Feedback and retry placement; do not add a phantom usable image |
| Compact Values/Batch/Settings/video compositions | B1/B5/P1/D4 | These storyboard cards reflow; the real application layouts still need dedicated compact comps |

## Next review — exports, deliberately not drawn here

Inspect current export controls and outputs before deciding whether their visuals need a refresh. The next storyboard should cover:

1. Nothing loaded; source loaded without the required analysis.
2. Selected image versus pinned set versus aggregate versus extracted frame.
3. Format/figure selection and parameter-dependent availability.
4. Pending/stale results and any pre-export analysis.
5. Destination picker, user cancellation, and overwrite handling.
6. Saving, success receipt/open destination, and retryable failure.
7. Multi-output partial success and accurate filenames/extensions.
8. Compact reflow, keyboard flow, and byte-deterministic existing exports.

No export format, serialization, renderer, or output artifact has been changed by this storyboard.

## Review gates

- Owner reviews the new proposals and resolves routing/removal/live-ordering choices.
- Reconcile adopted decisions into the relevant tickets; do not mark the legacy coverage manifest complete from these sketches.
- Draw the remaining branch close-ups and full Settings/Batch/compact compositions that actually need distinct geometry.
- Implementation must test async ownership, file/video routing, pin invalidation, and cancellation; screenshots cannot establish these behaviors.
- Check real interaction and reflow on the implementation, not just this storyboard.
