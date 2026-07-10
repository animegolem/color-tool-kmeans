# Design Coverage Manifest — Notebook Redesign (EPIC-027)

Maintained by AI-IMP-167. Maps every UI lifecycle in the shipping app (plus EPIC-026 live mode) against the notebook design bundle (`RAG/Color Tool Design System.zip` — wireframe sections 3a/3b, 4a, 5a–5e, 6a, 7a–7c; `Code Change Notes.md` 1–12; 18 components). Verdicts: **COVERED** (implementable as-is), **PARTIAL** (spec exists, states missing), **MISSING** (needs new design artifacts).

Implementation tickets (IMP-168..177) each cite the lifecycles they own; design-blocked tickets name the artifact requests below.

---

## L1 — Ingestion & first-run

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| First run / nothing loaded | empty panel + upload affordance | 4a hatched placeholder + mono caption, `--hatch` tokens | COVERED |
| Drag-over (valid media) | highlight drop zone | drop-target dash (`--tab-active`), 5a | PARTIAL — dash spec'd; full-sheet overlay comp not drawn |
| Drop / browse → decoding | brief blocking decode | none (5a "ingestion" is layout, not progress) | MISSING |
| Unsupported format | error message | ErrorSlip: `unsupported format — sketch.heic` + `browse files` action | COVERED |
| Multi-file drop / clipboard paste | appends to bucket, opens rail | 3a bucket strip absorbs items; paste unaddressed | PARTIAL |

## L2 — Color analysis (Colors page)

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Params changed → debounce → pending | 350 ms debounce, delayed spinner, scroll lock | none — figures 01–04 drawn only in ready state | **MISSING (P1)** |
| Ready | charts + metrics + ledger | 4a + 6a, Figure/PaletteLedger | COVERED |
| Analysis error | error banner | ErrorSlip `analysis failed — worker timeout` + `retry` | COVERED |
| Stale (params changed, results old) | implicit | none | MISSING |
| Cancelled (view switch mid-run) | pending cleared (IMP-163) | n/a — returns to idle | COVERED by idle |

Needed: what does a figure look like *while computing*? (ink-wash fade? hatched chart area? pencil under-drawing?) and a subtle stale-results treatment. This idiom decision cascades to Values/Batch.

## L3 — Video transport & frame extraction

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Probe pending (just dropped) | brief blank | none | MISSING |
| Transport ready | scrub bar, step buttons, timestamp | Scrubber + `◂ ▸ step frames · drag to scrub` hint | COVERED |
| Frame decode pending (scrub) | settled-frame overlay (v1.0.2 fix) | none | **MISSING (P2)** |
| Strip generating (barcode/filmstrip) | pending flag, no visual | none — BucketStrip shows finished strips only | MISSING |
| Strip mode toggle | Settings pref | bracket selector implied | PARTIAL |
| Snapshot (✂) | frame → bucket | ✂ glyph reserved; interaction undrawn | PARTIAL |

## L4 — Live playback (EPIC-026) — net-new, post-dates the bundle

| State | Needed behavior (ADR-003) | Design ref | Verdict |
|---|---|---|---|
| Live mode engaged (play) | charts + ledger update per frame | none | **MISSING (P1)** |
| Effective-fps / drop indicator | quiet metrics line | interpunct metrics idiom exists | PARTIAL idiom only |
| Scene-cut recovery flicker | 1-frame quality dip | none | MISSING |
| Pause → settle to converged | charts settle | none | MISSING |
| Param change during playback | re-seed live loop | none | MISSING |

The single largest design gap. Questions the artifact must answer: do figures animate in place on the ruled paper? does the ledger reorder live or hold sort order? is there a "LIVE" stamp/indicator in the notebook voice? what does the playhead look like against `--tab-active`?

## L5 — Media bucket

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Recent strip (docked) | right rail today | 3a BucketStrip + tiles, folded corner | COVERED |
| Bucket page (view all) | n/a today (rail only) | 3b full page, `MEDIA BUCKET · 7 items` | COVERED |
| Empty bucket | rail placeholder | none | MISSING |
| Item ops (load, remove ✕, pin +) | context menu / buttons | tiles show ✕ and ▶ badges; pin flow undrawn | PARTIAL |
| Many items (scroll/overflow) | scrolling rail | 3b page implies grid; overflow behavior undrawn | PARTIAL |

## L6 — Values analysis

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Ready (stacked previews + scrubber) | 2-up today → stacked per Note 10 | 5b | COVERED |
| Levels / notan bracket | slider + toggle | bracket selector idiom | COVERED |
| Value analysis pending | spinner | none (same gap as L2) | MISSING (shares L2 idiom) |
| Error | banner | ErrorSlip | COVERED |

## L7 — Batch

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Contact sheet + aggregate | grid + pinned aggregate | 5d — **flagged "approximate" by the bundle itself** | **PARTIAL (P2)** |
| Empty (no pins) | hint text | none | MISSING |
| Aggregate computing | spinner | none (L2 idiom) | MISSING |
| Pin expand overlay | PinExpandOverlay.svelte | pinned-card idiom plausible; undrawn | PARTIAL |
| Batch params vs Colors params divergence | separate store | undrawn | MISSING |

5d must be redrawn against the real BatchView before IMP-175 starts.

## L8 — Exports

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Packing list + stamps | checklists + buttons | 5c single sheet, StampButton | COVERED |
| Nothing loaded / no analysis | auto-analyze or hint | none | MISSING |
| Saving in progress | async save | none | MISSING |
| Saved confirmation | silent today | none — a stamped "SAVED" thunk? receipt line? | **MISSING (P3, fun one)** |
| Save error | message | ErrorSlip | COVERED |

## L9 — Settings & preferences

| State | Current app behavior | Design ref | Verdict |
|---|---|---|---|
| Settings placement | nav view today | "likely a corner affordance" — **explicitly undecided** | **MISSING (P1)** |
| Settings sheet layout | SettingsView form | none | MISSING |
| Chart ground toggle (flat/pinned) | Note 11 pref | 6a toggle on the desk | COVERED |

## L10 — Zoom overlay

| State | Design ref | Verdict |
|---|---|---|
| Open/close, chrome, fit, % readout | 7a/7b + Note 12, pin-hole ghost | COVERED |
| Histogram bar hover → ledger row | Note 12 | COVERED |
| Zooming video preview (paused frame) | undrawn | PARTIAL |
| Zoom during live playback (L4) | undrawn | MISSING (defer with L4) |

## L11 — Responsive reflow & motion

| State | Design ref | Verdict |
|---|---|---|
| Spread → column below ~1100px (Colors) | 5e + reflow study A (crossfade+re-stack) | COVERED |
| Compact layouts for Values/Exports/Batch/bucket | 5e covers Colors primarily | **PARTIAL (P3)** |
| Page-turn animation (view change) | fold spec'd (`--fold-duration`); scope undecided | PARTIAL |
| Zoom lift/return motion | Note 12 | COVERED |

## L12 — Errors & empty states (cross-cutting)

ErrorSlip covers the *form*; the *taxonomy* needs one pass: unsupported format, analysis failed, video decode failed, probe failed, ffmpeg missing (first-run on stripped systems), save failed, clipboard empty. Each needs its lowercase copy + action verb per the brand-voice card. **P3 — copy sheet, not comps.**

---

## Artifact shopping list (for Claude Design sessions)

Priority order; each item names the receiving ticket.

**P1 — blocks implementation phases:**
1. **Analysis-pending idiom** — one decision, used everywhere: figure/chart "computing" state + stale-results treatment on ruled paper. → IMP-171/173/175 (L2/L6/L7)
2. **Live playback mode** — Colors spread during 24 fps streaming: live indicator, ledger behavior, playhead, effective-fps metrics line, pause-settle. → EPIC-026 UI tickets (L4)
3. **Settings placement + sheet** — corner affordance decision and the preferences sheet in notebook idiom. → IMP-177 (L9)

**P2 — blocks specific tickets:**
4. **Batch spread redraw** — 5d verified against real BatchView: contact sheet, aggregate, pin expand, empty state, computing state. → IMP-175 (L7)
5. **Ingestion overlay states** — full-sheet drag-over, decode progress, paste feedback. → IMP-171 (L1)
6. **Video pending states** — probe pending, frame-decode-in-flight (settled-frame treatment), strip generating. → IMP-171/173 (L3)

**P3 — polish, can trail:**
7. **Exports feedback** — saving / saved-confirmation ("stamp thunk"?) / nothing-loaded. → IMP-174 (L8)
8. **Bucket edge states** — empty bucket, overflow, pin flow on tiles. → IMP-172 (L5)
9. **Compact reflow finals** — Values/Exports/Batch/bucket at column width. → IMP-177 (L11)
10. **Error copy sheet** — L12 taxonomy in the brand voice (text deliverable, not comps).
