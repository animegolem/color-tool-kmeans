---
node_id: AI-IMP-134
tags:
  - IMP-LIST
  - Implementation
  - batch-analysis
  - store
  - frontend
kanban_status: planned
depends_on:
  - AI-IMP-133
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.9
date_created: 2026-03-18
date_completed:
---

# AI-IMP-134-multi-analysis-store

## Multi-analysis store — pin state, composite path, result cache

The batch analysis feature needs dedicated store state for: which images are pinned, the composited grid path, and the aggregate analysis result. This ticket adds the `multi-analysis.ts` store module, the `'batch'` view type in navigation, and re-exports through the `ui.ts` barrel.

### Out of Scope

- UI components (MediaBucket pin toggle, BatchView) — separate tickets.
- Persisting pin state across app restart — MVP is session-only.
- Values analysis state — colors only for MVP.

### Design/Approach

New store module `stores/multi-analysis.ts` following existing patterns from `analysis.ts` and `value-analysis.ts`:

- `pinnedImageIds: Writable<Set<string>>` — set of pinned image IDs
- `pinnedImages: Derived` — ordered array of pinned `ImageEntry` objects (reacts to both `images` and `pinnedImageIds`, filters out removed entries)
- `togglePin(id)` / `clearPins()` — mutation helpers
- `multiAnalysisResult: Writable<AnalysisResult | null>` — cached result
- `multiAnalysisState: Writable<'idle' | 'compositing' | 'analyzing' | 'ready' | 'error'>` — lifecycle state
- `multiAnalysisError: Writable<string | null>` — error message
- `multiCompositePath: Writable<string | null>` — path to cached composite PNG
- `resetMultiAnalysis()` — clears result/state/error/composite (called when pins change)

Navigation update: Add `'batch'` to the `View` type union in `navigation.ts`.

### Files to Touch

- `src/lib/stores/multi-analysis.ts`: new module (~80 LOC)
- `src/lib/stores/navigation.ts`: add `'batch'` to `View` type
- `src/lib/stores/ui.ts`: re-export multi-analysis stores

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create `src/lib/stores/multi-analysis.ts`
  - [ ] `pinnedImageIds` writable store (Set\<string\>)
  - [ ] `pinnedImages` derived store (ordered array, excludes removed images)
  - [ ] `togglePin(id)` — add if absent, remove if present; call `resetMultiAnalysis()`
  - [ ] `clearPins()` — clear all pins; call `resetMultiAnalysis()`
  - [ ] `multiAnalysisResult`, `multiAnalysisState`, `multiAnalysisError`, `multiCompositePath` writable stores
  - [ ] `resetMultiAnalysis()` — resets result/state/error/compositePath to defaults
  - [ ] Auto-cleanup: when `images` store changes, prune `pinnedImageIds` of any IDs no longer in `images`
- [ ] Add `'batch'` to `View` type in `navigation.ts`
- [ ] Re-export all multi-analysis stores/functions from `ui.ts`
- [ ] Validate: `npm run check && npm run lint && npm run test`

### Acceptance Criteria

**Scenario:** Toggling pin state
**GIVEN** images A, B, C are in the media bucket.
**WHEN** `togglePin('A')` is called, then `togglePin('B')`, then `togglePin('A')`.
**THEN** `pinnedImageIds` contains only B.
**AND** `pinnedImages` derived store returns `[entryB]`.

**Scenario:** Image removal cleans up pins
**GIVEN** images A and B are pinned.
**WHEN** image A is removed from the media bucket via `removeFile('A')`.
**THEN** `pinnedImageIds` no longer contains A.
**AND** `pinnedImages` returns `[entryB]`.

**Scenario:** Pin change resets analysis
**GIVEN** a multi-analysis result exists.
**WHEN** a pin is toggled.
**THEN** `multiAnalysisResult` is null, `multiAnalysisState` is 'idle'.

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
