---
node_id: AI-IMP-163
tags:
  - IMP-LIST
  - Implementation
  - defects
  - stores
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-028-audit-remediation]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed: 2026-07-09
---

# AI-IMP-163-cancellation-and-media-promotion

## Summary of Issue #1

Audit findings AUD-003 and AUD-006 (`RAG/AI-LOG/2026-07-09-LOG-AI-control-flow-and-defect-audit.md` — read the full finding text first): (1) canceling Colors/Values analysis only invalidates local tokens, leaving global/per-key state permanently `pending` — Exports then refuses to auto-analyze and a remounted Values view skips the entry; (2) `removeFile()` blindly activates the first remaining entry, so a raw video can be promoted into the still-image pipeline.

**Done state:** both findings fixed; their three expected-failure repros in `audit-control-flow-races.spec.ts` converted to passing regression tests; full gates green.

### Out of Scope

- AUD-001/002/004/005/007/008/009/010 (IMP-162 owns `setFile`/`appendFile`, scrubber, probes, Rust cache — do not touch those paths).
- Restructuring runner factories; fix the state lifecycle only.

### Design/Approach

- **AUD-003**: cancellation must reset the corresponding pending state — Colors: clear global `analysisState` pending (back to idle) when `cancel()` invalidates an in-flight request; Values: clear the per-key pending entry in `valueAnalysisByKey`/state map. Take care to only clear state the canceled request owns (compare tokens/keys) so a legitimately newer in-flight request isn't clobbered.
  **Repro adequacy (work-order review 2026-07-09):** the existing AUD-003 repros set global pending state manually without a runner-owned request, so a blanket reset would pass them while clobbering newer requests. When converting them, STRENGTHEN them: start a real runner-owned analysis request, cancel it, assert pending clears; AND add an ownership test — start request A, start newer request B, cancel A, assert B's pending state survives.
- **AUD-006**: `removeFile()`'s successor selection must skip raw-video entries when choosing a new *active image* (or route through the proper video-selection flow). A raw video may remain in the bucket; it must not become `selectedFile` for the still pipeline.

Convert the three repros in place (keep AUD-ID references in test names).

### Files to Touch

- `tauri-app/src/lib/views/home/analysis-runner.svelte.ts` (AUD-003 Colors)
- `tauri-app/src/lib/views/values/value-analysis-runner.svelte.ts` (AUD-003 Values)
- `tauri-app/src/lib/stores/analysis.ts` / `value-analysis.ts` (reset helpers if needed)
- `tauri-app/src/lib/stores/image.ts` — `removeFile`/`switchToFile` ONLY (AUD-006)
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts` (repro → regression, 3 tests)

**Do NOT touch:** `setFile`/`appendFile` in `image.ts`, `video-scrubber.svelte.ts`, `file-ingestion-values.svelte.ts`, `video-controller.svelte.ts`, `value_analysis.rs` (IMP-162); exports runners beyond reading (AUD-003's Exports symptom resolves via the store fix); CI/hooks (IMP-165); `src-tauri/src/bin/*`.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] AUD-003 Colors: cancel clears owned pending global state; token-guarded so newer requests survive; repro converted AND strengthened to use a runner-owned request.
- [x] AUD-003 Values: cancel clears owned per-key pending state; repro converted AND strengthened likewise.
- [x] AUD-003 ownership: newer-request-survives-cancellation regression test added (cancel A while B in flight; B's pending state intact).
- [x] Verify the Exports symptom: with pending cleared, `colors-export-runner` auto-analyze proceeds (assert via existing/new test).
- [x] AUD-006: `removeFile()` never activates a raw video as the still image; repro converted.
- [x] Full gates: `npm run test -- --run`, `npm run check`, `npm run lint`, `cargo fmt/clippy/test` (Rust untouched but gates run anyway).

### Acceptance Criteria

**Scenario:** Navigating away mid-analysis.
**GIVEN** a Colors or Values analysis request is in flight.
**WHEN** the view unmounts and cancellation runs.
**THEN** global/per-key state is not left `pending`; returning to the view (or opening Exports) triggers analysis normally.

**Scenario:** Removing the active image with a raw video in the bucket.
**GIVEN** the active image is removed and the first remaining entry is a raw `.mp4`.
**WHEN** `removeFile()` selects a successor.
**THEN** the raw video is not set as `selectedFile`; a valid image is chosen or none.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- The positive runner regressions initially exposed `rune_outside_svelte`: this repository's Node-only Vitest config does not transform `.svelte.ts` runes, while the former `it.fails` wrappers had treated that setup exception as an expected failure. Scoped `$state`/`$derived` shims in the authorized audit test now let the runner factories execute without changing test configuration.
- Running Cargo clippy and tests concurrently caused expected build-directory lock contention. Both were rerun sequentially and passed; no Rust source changed.
- `npm run check` passed with the two pre-existing AUD-020 accessibility warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- The strengthened in-place audit coverage brings `audit-control-flow-races.spec.ts` above the 350-line CI threshold. Per the repository policy, the eventual commit will need `[loc-bypass]`; CI/hooks were intentionally not changed.
- The checked-out branch reports `imp-163-cancellation`, rather than the longer branch name stated in the work order. No branch operation was attempted.
