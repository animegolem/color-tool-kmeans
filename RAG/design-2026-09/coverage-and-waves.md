# UI coverage and proposed waves — EPIC-027

Status: ticketed design candidates, 2026-09-05. Canonical contract: PROJECT-RECORD rev 0.5 §9. The only initial assignment is foundation **review**, not coding.

Round 01 update (PROJECT-RECORD rev 0.6): C2–C6 accepted with numbered clarifications; C1 is held for a focused test-harness compatibility proof. The installed Svelte plugin targets Vite 6/7, whereas Vitest uses Vite 5; a direct-plugin probe failed before rendering. Sol's next review is only UI-T1, not another whole-epic round. No implementation is authorized yet.

Round 02 update (rev 0.7, supersedes UI-T1 hold): the lead reproduced 2 files / 17 tests with the exact-.svelte compiler transform and unchanged rune audit. Test-seam design accepted; typed-config, Node 20, full suite and browser gates remain. No further review requested; a bounded implementation brief is next, not yet dispatched.

## Missing-surface walkthrough

| Surface | States now inspectable | Ticket ownership | Still open |
| --- | --- | --- | --- |
| Exports | E1 configure, E2 no source, E3 pending, E4 no components, E5 changed study, E6 saving, E7 receipt, E8 error, E9 picker cancelled | 174, 198–200; shared feedback 195 | Follow-current vs explicitly captured preview UX; overwrite and multi-output partial-success details. |
| Settings | Q1 full current inventory plus layout choice, Q2 reset proposal, Q3 persistence error | 196, 177 | Default layout, preference migration/reset scope, final icons and font. Some inventory rows are static labels, not functioning preference controls. |
| Collection management | M1 management context, M2 remove proposal, M4 clear proposal, M5 missing source | 172 | Routing, genuine undo vs confirmation, active successor, missing-source recovery. Confirm buttons are preview-only and remove nothing. |
| Batch detail | B5 aggregate/source set, B2 insufficient pins, B6 focused pin, B7 input failure | 175 | Contact-sheet geometry, failure recovery copy, keyboard/return behavior. |

These 20 views extend the earlier 34-frame storyboard; overlapping IDs are refinements, not 54 distinct covered lifecycle cases. The old storyboard register's 14 remaining branch-variant rows remain an acceptance checklist. Settings/error and batch-detail gaps now have sketches, not accepted implementations.

## Remaining decisions and evidence

- UI-D1 resolved (PROJECT-RECORD rev 0.10): collection selects shared app-wide study material and returns to the invoking study with controls preserved; later navigation retains that material. No Colors-only redirect or independent per-view image selection. Runtime proof remains pending; Batch pins and captured export jobs stay separate.
- UI-D2: removal/clear confirmation, real undo, and active successor. No decorative undo after resource cleanup.
- UI-D3: chosen layout default and full preference migration/reset contract.
- UI-D4: approved offline serif asset, patch label defaults and rounding precision.
- UI-D5: live video ledger/zoom/settling behavior; EPIC-026 remains separate.
- UI-D6: explicit captured preview versus following current study. Immutable save-job provenance is already binding.
- Branch close-ups still needed where geometry/action differs: mixed import and delayed failure, large collection, unavailable original, context loss while expanded, sidecar/probe failures, snapshot failure, live overload and compact video.
- Real keyboard/focus/scroll return, coarse-pointer targets, reduced motion and source-switch races require application tests. Browser mockups cannot close them.
- Error copy must reflect actual codec/recovery capabilities. No invented relink, cancellation, open-directory or undo implementation.

## Ticket map

Ten existing IDs are respecified in place; six new IDs are reserved and cut. IMP-167 remains historically completed, not reopened.

| Ticket | Scope | Declared dependencies |
| --- | --- | --- |
| [168](../AI-IMP/AI-IMP-168-vendor-design-bundle.md) | Preserve design provenance and add dormant study tokens | None |
| [169](../AI-IMP/AI-IMP-169-paper-primitives-library.md) | Minimal flat study surface primitives | 168 |
| [170](../AI-IMP/AI-IMP-170-notebook-shell.md) | Flat study shell with preserved navigation | 169, 195 |
| [171](../AI-IMP/AI-IMP-171-colors-spread.md) | Colors study composition and expanded palette index | 170, 195, 196, 199 |
| [172](../AI-IMP/AI-IMP-172-bucket-page.md) | Responsive media strip and full collection browser | 171, 188 |
| [173](../AI-IMP/AI-IMP-173-values-spread.md) | Values study surface and shared lifecycle feedback | 170, 195 |
| [174](../AI-IMP/AI-IMP-174-exports-sheet.md) | Existing export controls with composed live preview | 170, 195, 198, 199, 200 |
| [175](../AI-IMP/AI-IMP-175-batch-spread.md) | Batch contact sheet and focused pin detail | 170, 195, 186 |
| [176](../AI-IMP/AI-IMP-176-zoom-and-chart-ground.md) | Focused source and figure inspection with faithful return | 171, 197, 188 |
| [177](../AI-IMP/AI-IMP-177-reflow-motion-settings.md) | Complete Settings placement and cross-surface reflow acceptance | 170, 172, 173, 174, 175, 176, 196 |
| [195](../AI-IMP/AI-IMP-195-shared-study-feedback-surfaces.md) | Shared pending stale empty and error presentation | 169 |
| [196](../AI-IMP/AI-IMP-196-study-presentation-layout-preference.md) | Three presentation layouts over one study | 169 |
| [197](../AI-IMP/AI-IMP-197-true-oklab-color-volume.md) | True sRGB gamut volume in OKLab | 169 |
| [198](../AI-IMP/AI-IMP-198-color-volume-export-capture.md) | Camera-bound 3D raster export tile | 197, 200 |
| [199](../AI-IMP/AI-IMP-199-shared-palette-patch-labels.md) | Consistent readable patch labels in app and exports | None |
| [200](../AI-IMP/AI-IMP-200-export-document-preview-contract.md) | One captured export document for preview and save | 184 |

Dependencies are necessary, not sufficient authorization. Every active consumer also requires its relevant EPIC-029 correctness patches and current-base tests. In particular: scroll/media return needs 188; Batch publication needs 186; export preview needs retained-input provenance 184 (and its own upstream prerequisites). Preserve the accepted Values185 → export184 → Batch186 integration ordering where ownership code overlaps.

## Proposed review / implementation sequence

1. **F0, now: review 168 → 169 → 195.** Preserve references, dormant scoped tokens, minimal FigureFrame/native controls, pure feedback model and an unmounted showcase. No active shell, runners, stores, native changes, fonts download or package install. Review reports seam corrections before implementation.
2. **F1, after verdict: bounded foundation implementation.** Separate current-main candidate, sequential overlap in showcase, one lead-created commit per ticket after verification. An implementation verdict must explicitly authorize this.
3. **F2, separately assigned:** 196 layout preference, 197 true gamut primitive, 199 label model. These are independent lanes only after foundation acceptance and file-boundary review. 197 conversion-helper extraction and dependency choice require review; 199 deliberately changes only specified visual exports, not CSV.
4. **F3, integration:** 170 shell then 171 Colors / 173 Values / 172 collection / 175 Batch as their runtime prerequisites and owner choices settle. Preserve current controls until replacements are accepted. Do not wait until 177 to support narrow widths.
5. **F4, export contract then builder:** 200 after 184; 198 after 197+200; 174 after its component dependencies. Snapshot one document, show and save that same captured document. No renderer-only clone pretending to retain native bytes.
6. **F5, focus and acceptance:** 176 after 171+197+188, then 177 whole-app reflow, Settings compatibility and real-interaction acceptance. Static mock screenshots are not completion.

These are planning lanes, not six dispatched waves. No ticket is marked completed from a sketch.

## Prior effort checkpoint

Fetched origin on September 5: main/origin main `5baa20e`; sweep `f427ff4` diverges 4/33, with 33 sweep commits absent from main. EPIC-029 Round 02 was accepted as design basis with C1–C3; Code Lead was idle awaiting a bounded assignment. No remediation implementation was performed in that review task.

IMP-178 performance work remains uncommitted in its independent worktree and includes the fixture correction tracked as 179; adopt that repair once. EPIC-026's four live-video commits remain a separate feature track. PR4's September 4 conflicting status is historical, not rechecked here.

The planning carrier remains dirty on `codex/remediation-planning-2026-09-04`, base `2cc2000`. It was not rebased or cleaned. Production work must use fresh reviewed main, not mistake this documentation base for the new code floor.
