---
node_id: AI-IMP-152
tags:
  - IMP-LIST
  - Implementation
  - settings
  - batch
  - persistence
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-024-road-to-v1-polish]]
confidence_score: 0.8
date_created: 2026-03-19
date_completed:
---

# AI-IMP-152-persist-batch-settings

## Persist batch settings between sessions

Batch view analysis parameters (cluster count, quality, merge threshold, etc.) are preserved within a running session but reset to defaults on app restart. The global analysis params already persist via a preferences layer. Batch params should be wired into the same persistence mechanism so users don't have to reconfigure batch settings each time they launch the app.

### Out of Scope

- Persisting pin selections between sessions.
- Persisting batch analysis results/cache between sessions.
- Adding a "reset to defaults" button for batch params.

### Design/Approach

Identify the existing persistence layer used by the global `params` store (likely `localStorage`, Tauri `Store` plugin, or a JSON file). Wire `batch-params.ts` into the same mechanism: load saved values on init, subscribe to changes and write back. Ensure the batch params store falls back to sensible defaults if no saved state exists or if the saved schema is outdated.

### Files to Touch

- `src/lib/stores/batch-params.ts`: add persistence read/write
- `src/lib/stores/prefs.ts` or equivalent persistence layer: register batch params

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Identify existing persistence mechanism for global params
- [ ] Add persistence read on batch-params store initialization
- [ ] Add persistence write on batch-params store changes (debounced)
- [ ] Handle schema migration / missing keys gracefully (fall back to defaults)
- [ ] Test: change batch params → restart app → params restored
- [ ] `npm run check && npm run lint && npm run test`

### Acceptance Criteria

**Scenario:** Batch params persist across restart
**GIVEN** the user changes batch analysis parameters (e.g., clusters to 12).
**WHEN** the app is closed and reopened.
**THEN** the batch parameters reflect the previously saved values.

**Scenario:** Graceful fallback on first launch
**GIVEN** no saved batch params exist.
**WHEN** the app starts.
**THEN** batch params use sensible defaults without errors.

### Issues Encountered

<!--
This section is filled out post work.
-->
