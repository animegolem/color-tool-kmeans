---
node_id: AI-IMP-166
tags:
  - IMP-LIST
  - Implementation
  - defects
  - hygiene
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-028-audit-remediation]]
confidence_score: 0.85
date_created: 2026-07-09
date_completed: 2026-07-09
---

# AI-IMP-166-p4-sweep

## Summary of Issue #1

Audit P4 findings AUD-017, 018, 019, 021 (`RAG/AI-LOG/2026-07-09-LOG-AI-control-flow-and-defect-audit.md` — read the full finding text first): export timestamp centisecond rounding can emit `01s100`; `frameTimestamp: 0` is treated as "no frame" by `isRawVideo()`; Settings claims chart visibility applies to Batch but Batch ignores it; the RAG index shows IMP-099/112/124/154 open under completed epics and IMP-146 completed with an unchecked checklist. AUD-020 (accessibility warnings) is explicitly EPIC-021's — do not touch it.

**Done state:** all four fixed; the AUD-017 repro converted to a regression test; a new unit test covers AUD-018; AUD-019 resolved by either honest copy or actual Batch wiring (pick per Design); RAG front matter made consistent and index regenerated.

### Out of Scope

- AUD-020 (EPIC-021).
- Any Batch feature work beyond what AUD-019's chosen resolution needs.
- Other tickets' files.

### Design/Approach

- **AUD-017** (`colors-export-runner.svelte.ts` lines ~109–115): compute centiseconds from total milliseconds with proper carry (e.g. round to cs first, then derive m/s/cs), so 1.999 → `00m02s00`.
- **AUD-018** (`MediaBucket.svelte`): `isRawVideo()` must test `frameTimestamp == null` (or `typeof !== 'number'`), not truthiness.
- **AUD-019**: decide the cheaper-honest path: EITHER wire Batch visibility to the existing preference flags (`preferences.ts` hydration + `BatchView.svelte` conditional rendering — preferred if small), OR correct the Settings copy to say Colors only. State the choice and rationale in Issues Encountered.
- **AUD-021**: reconcile front matter — for IMP-099/112/124/154 under completed epics: set an accurate `kanban_status` (`deferred` where the epic archived them as deferred; confirm against each ticket body). For IMP-146: either check items that were genuinely done (verify claims against git history) or set status honestly (`cancelled`/`deferred`) with a note. Regenerate INDEX.md; zero mismatch warnings from `generate-index.sh`.

### Files to Touch

- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts` (AUD-017 — timestamp helper only; coordinate with IMP-164 which touches the same file's export-naming: keep edits to the `formatTimestamp`-style helper hunk)
- `tauri-app/src/lib/components/MediaBucket.svelte` (AUD-018)
- `tauri-app/src/lib/views/SettingsView.svelte` and/or `preferences.ts` + `BatchView.svelte` (AUD-019)
- `RAG/AI-IMP/AI-IMP-{099,112,124,146,154}-*.md` front matter (AUD-021)
- `tauri-app/src/lib/views/__tests__/audit-export-paths.spec.ts` (AUD-017 repro → regression) + new AUD-018 test

**Do NOT touch:** stores/`image.ts`, runners, scrubber, video-controller (IMP-162/163); ffmpeg.rs/cache (IMP-164); hooks/CI (IMP-165); `src-tauri/src/bin/*`.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] AUD-017 fixed with carry; repro converted; boundary cases (0.999→01s00, 59.999→01m00s00) tested.
- [x] AUD-018 fixed; unit test for `frameTimestamp: 0` pinning eligibility.
- [x] AUD-019 resolved (wiring or copy); choice documented; test or render assertion as applicable.
- [x] AUD-021: front matter reconciled against ticket bodies/git history; `generate-index.sh` reports no orphan/mismatch warnings; INDEX.md regenerated.
- [x] Full gates: `npm run test -- --run`, `npm run check`, `npm run lint`, `cargo fmt/clippy/test`.

### Acceptance Criteria

**WHEN** an export lands at second boundary 1.999. **THEN** its filename shows `00m02s00`.
**WHEN** a frame extracted at t=0 exists in the bucket. **THEN** it can be pinned like any other frame.
**WHEN** the user reads Settings. **THEN** what it claims about Batch is true.
**WHEN** `generate-index.sh` runs. **THEN** no status-mismatch or orphan warnings are emitted.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- **AUD-019 choice:** corrected the Settings copy to say chart visibility applies to the Colors view. Batch has independent parameters and renders all charts, so wiring a shared display preference would expand behavior beyond the cheaper honest-copy resolution.
- The original AUD-017 `it.fails` repro constructed a Svelte-runes runner under the Node Vitest environment and failed with `rune_outside_svelte` before its filename assertion. The positive regression now exercises an exported pure timestamp helper used directly by `baseName()`, plus both required carry boundaries.
- IMP-099, IMP-112, IMP-124, and IMP-154 already had accurate `deferred` front matter matching their ticket/epic bodies. IMP-146's implementation was verified in commits `3372b15` and `d6a46ae`; its stale checklist was reconciled without changing its accurate `completed` status.
- **AUD-021 resolution:** lead authorization expanded scope to `RAG/scripts/generate-index.sh`. The mismatch detector now treats deferred and cancelled child IMPs as compatible with completed parent epics while leaving orphan detection unchanged. Regeneration reduced status mismatches from 4 to 0, retained 0 orphan warnings, and two consecutive runs produced identical output.
- All required frontend and Rust gates passed. `npm run check` retained the two known AUD-020 accessibility warnings, which are explicitly out of scope.
