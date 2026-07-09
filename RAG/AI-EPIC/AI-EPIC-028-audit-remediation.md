---
node_id: AI-EPIC-028
tags:
  - EPIC
  - AI
  - defects
  - reliability
date_created: 2026-07-09
date_completed:
kanban_status: in-progress
AI_IMP_spawned:
  - AI-IMP-162
  - AI-IMP-163
  - AI-IMP-164
  - AI-IMP-165
  - AI-IMP-166
---

# AI-EPIC-028-audit-remediation

## Problem Statement/Feature Scope

An external control-flow audit (Sol, 2026-07-09 — `RAG/AI-LOG/2026-07-09-LOG-AI-control-flow-and-defect-audit.md`) validated 21 defects in the shipping v1.0.2 app: 7 P2 (video-switch races, stale caches, stuck pending states), 9 P3 (leaks, unbounded cache growth, export mislabeling, broken repo gates), 5 P4 (minor correctness/copy/hygiene). Twelve findings carry executable expected-failure repro tests, now ingested at `tauri-app/src/lib/views/__tests__/audit-*.spec.ts` and `src-tauri/tests/audit_value_cache.rs`. Verification during ingestion added a 22nd defect: the pre-commit hook's script detection is broken ("no format:check script; skipping" despite the script existing), so the formatting gate has been silently skipped locally.

## Proposed Solution(s)

Fix all P2/P3 findings and the actionable P4s, grouped into five parallelizable tickets by subsystem. The audit repros are the verification mechanism: **each fix flips its expected-failure repro red, and the ticket converts that repro into a positive regression test in place.** AUD-020 (accessibility warnings) attaches to deferred EPIC-021 per the audit and is not re-ticketed.

- **IMP-162 — video identity & Values race/cache correctness**: AUD-001, 002, 004, 005, 007, 008, 009, 010. Frame/analysis identity must survive video switches, same-entry frame replacement, same-second file replacement, and concurrent decodes; store dedup stops leaking datasets. Informs deferred IMP-124's reprioritization.
- **IMP-163 — cancellation state & media-type promotion**: AUD-003, 006. Canceling analysis clears pending state; removing the active image never promotes a raw video into the still pipeline.
- **IMP-164 — resource & export integrity**: AUD-011, 012, 013, 014. Session-time cache retention, TIFF/GIF source-export honesty, async drop-listener lifecycle, barcode tail sampling.
- **IMP-165 — repository gates**: AUD-015, 016, + pre-commit detection bug. Prettier config valid, pre-commit actually runs its checks, CI runs the full suites. Lands first in merge order so later fixes pass through working gates.
- **IMP-166 — P4 sweep**: AUD-017, 018, 019, 021. Timestamp carry, `frameTimestamp: 0` truthiness, Settings copy vs Batch behavior, RAG index status inconsistencies.

All five delegated to GPT Sol (xhigh) instances in isolated clones per the delegation workflow; lead reviews, merges, and re-runs gates.

## Path(s) Not Taken

- **IMP-124's full Home/Values extraction unification** — IMP-162 fixes the concrete correctness failures; the structural dedup remains its own deferred ticket, now better informed.
- **AUD-020 accessibility warnings** — belongs to EPIC-021 (deferred accessibility program), per the audit's own instruction.
- **Redesign-adjacent fixes** — anything cosmetic waits for EPIC-027; this epic is correctness only.

## Success Metrics

- All 12 audit repros converted to passing positive regression tests; zero expected-failure encodings remain.
- Findings without repros (AUD-007, 011, 013, 014, 016, 018, 019, 021) closed with either a new regression test or a documented source-invariant rationale in the ticket.
- `npm run format:check` exits 0; pre-commit output shows format/lint actually running; CI executes full `npm test`, `check`, `lint`, `format:check`, and `cargo test`.
- Full gates green on main after each merge; INDEX.md status inconsistencies resolved.

## Requirements

### Functional Requirements

- [ ] FR-1: Values frame extraction, probe ordering, and analysis caching are race-free across video switches (IMP-162).
- [ ] FR-2: Frame and analysis identity is invalidated on entry replacement, same-second file replacement, and concurrent decode (IMP-162).
- [ ] FR-3: Store dedup never strands datasets/object URLs (IMP-162).
- [ ] FR-4: Cancellation clears pending analysis state in Colors and Values; Exports auto-analyze recovers (IMP-163).
- [ ] FR-5: Removing the active image never activates a raw video as a still (IMP-163).
- [ ] FR-6: Session-time pruning/removal lifecycle for value-analysis, clipboard, and snapshot artifacts (IMP-164).
- [ ] FR-7: Source exports carry honest extensions or are converted (IMP-164).
- [ ] FR-8: Drag/drop listener registration is cancel-safe (IMP-164).
- [ ] FR-9: Barcode generation samples the full duration regardless of clip fps (IMP-164).
- [ ] FR-10: Prettier config loads; pre-commit runs its checks; CI runs full suites (IMP-165).
- [ ] FR-11: P4 corrections: timestamp carry, frameTimestamp 0, Settings copy or Batch wiring, RAG index consistency (IMP-166).

### Non-Functional Requirements

- No behavior changes beyond the audited defects; UI appearance untouched (EPIC-027 owns that).
- Every fix ships with its regression test in the same commit.
- Gates per merge: `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check` (post-IMP-165), `cargo fmt/clippy/test`.

## Implementation Breakdown

Cut 2026-07-09. All five tickets delegated to GPT Sol xhigh instances in parallel isolated clones; merge order: IMP-165 first, then 162/163/164/166 as they land (lead resolves any `image.ts` hunk overlap between 162 and 163).
