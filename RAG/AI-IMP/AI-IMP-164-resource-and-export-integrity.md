---
node_id: AI-IMP-164
tags:
  - IMP-LIST
  - Implementation
  - defects
  - exports
  - resources
kanban_status: in-progress
depends_on:
parent_epic: [[AI-EPIC-028-audit-remediation]]
confidence_score: 0.75
date_created: 2026-07-09
date_completed:
---

# AI-IMP-164-resource-and-export-integrity

## Summary of Issue #1

Audit findings AUD-011, 012, 013, 014 (`RAG/AI-LOG/2026-07-09-LOG-AI-control-flow-and-defect-audit.md` — read the full finding text first): unbounded session-time disk-cache growth; TIFF/GIF sources exported with `.png` names but original bytes; async drag/drop listener registration leaks when a view unmounts before registration resolves; barcode strips can omit the tail of >30 fps clips.

**Done state:** all four fixed; the AUD-012 repro in `audit-export-paths.spec.ts` converted to a regression test; new regression tests for 013/014 (011 may close on a source-invariant rationale plus a prune-path test); full gates green.

### Out of Scope

- IMP-162/163 files (stores, scrubber, runners' cancellation) — coordinate only through merge.
- Redesigning the cache layout or export UI.

### Design/Approach

- **AUD-011**: add a session-time retention pass — reuse the startup pruning (`cache.rs` / `main.rs`) mechanics: invoke pruning after each value-analysis/frame-extraction write (cheap size/age check), and delete per-entry artifacts when their owning media entry is removed. Keep policy conservative (age/size cap), document constants. **Removal hook (work-order review 2026-07-09):** entry-removal cleanup lives in a NEW `lib/services/artifact-cleanup.ts` service covering all three artifact classes (value-analysis cache dirs, clipboard images, frame snapshots). You are authorized to add ONE-LINE hook calls to that service from `removeFile()` and `clearFile()` in `stores/image.ts` — hook calls only, no other logic changes there (IMP-162/163 own that file's logic; the lead resolves merge overlap).
- **AUD-012**: source export must either (a) name the file with its true extension for recognized-but-unconverted formats (tiff→`.tif`, gif→`.gif`), or (b) convert to PNG before save. Prefer (a) — honest and cheap; the Rust `image` crate already decodes both if (b) is chosen later.
- **AUD-013**: registration helpers must handle unmount-before-resolve: after `await`, check a `disposed` flag and immediately unlisten if set (pattern per view: Home, Values, batch-drop).
- **AUD-014** (Rust `ffmpeg.rs`): use the real probed fps (from `ffprobe_details`) when deciding the fps filter; fall back to `count/duration` ONLY when the probe reports no usable fps. Tail coverage must hold for 60 fps clips. (Aligned with the checklist per work-order review 2026-07-09.)

### Files to Touch

- `tauri-app/src-tauri/src/main.rs` / `cache.rs` (AUD-011 session prune hook)
- `tauri-app/src/lib/services/artifact-cleanup.ts` (NEW — AUD-011 entry-removal cleanup, all three artifact classes)
- `tauri-app/src/lib/stores/image.ts` — ONE-LINE hook calls from `removeFile()`/`clearFile()` into artifact-cleanup only (see Design)
- `tauri-app/src-tauri/src/value_analysis.rs` — artifact removal helper only if needed for AUD-011 (do NOT touch cache-freshness logic — IMP-162 owns it)
- `tauri-app/src/lib/services/frame-snapshot.ts` (AUD-011 lifecycle)
- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts` (AUD-012 naming)
- `tauri-app/src/lib/bridges/fs.ts` (AUD-012, extension mapping if placed here)
- `tauri-app/src/lib/views/HomeView.svelte`, `ValuesView.svelte`, `views/batch/batch-drop.svelte.ts` (AUD-013)
- `tauri-app/src-tauri/src/ffmpeg.rs` (AUD-014)
- `tauri-app/src/lib/views/__tests__/audit-export-paths.spec.ts` (repro → regression) + new tests

**Do NOT touch:** `image.ts` beyond the two one-line cleanup hook calls authorized above; `video-scrubber.svelte.ts`, `file-ingestion-values.svelte.ts`, `video-controller.svelte.ts`, analysis runners (IMP-162/163); CI/hooks (IMP-165); `src-tauri/src/bin/*`. In `value_analysis.rs`, only add artifact-removal helpers; the mtime/freshness code belongs to IMP-162.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] AUD-011: session-time prune + `artifact-cleanup.ts` entry-removal service covering value-analysis dirs, clipboard images, and frame snapshots; hook calls wired from `removeFile()`/`clearFile()`; Rust test or documented invariant for the prune path.
- [ ] AUD-012: TIFF/GIF exports carry honest extensions (or are converted); repro converted to regression test.
- [ ] AUD-013: all three registration sites are unmount-safe; regression test for the resolve-after-cleanup path.
- [ ] AUD-014: fps filter decision uses real fps; 60 fps arithmetic covered by a unit test on the filter-construction logic.
- [ ] Full gates: `npm run test -- --run`, `npm run check`, `npm run lint`, `cargo fmt/clippy/test`.

### Acceptance Criteria

**Scenario:** Long editing session.
**GIVEN** repeated Values extractions and clipboard imports.
**WHEN** artifacts exceed the retention policy or their entries are removed.
**THEN** cache size is bounded without restart.

**Scenario:** Exporting a TIFF source.
**WHEN** source export runs. **THEN** the saved file's extension matches its bytes.

**Scenario:** 60 fps clip barcode.
**WHEN** a strip is generated. **THEN** sampling covers the full duration, not the first 30,000 frames.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
