---
node_id: AI-IMP-052
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Home
  - Epic-005
kanban_status: planned
depends_on: [AI-EPIC-005, AI-IMP-051]
confidence_score: 0.85
created_date: 2025-09-29
close_date:
---

# AI-IMP-052-home-view-finalization

## Summary of Issue #1
Finalize the Home view with robust drag/drop + picker flows, debounce/spinner thresholds, clear state transitions, and error recovery using the shell-agnostic bridges. Done when Home consistently loads images, triggers compute, and surfaces metrics with no direct IPC imports.

### Out of Scope 
- Graph rendering polish (separate ticket).
- Export UI (separate ticket).

### Design/Approach  
- Keep runes-based state; ensure cancelation tokens prevent late results from clobbering UI.
- Normalize banner/notice and error overlays; ensure keyboard accessibility.
- Log concise debug lines (adapter, duration, iterations) gated behind `NODE_ENV=development`.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`
- `tauri-app/src/lib/stores/ui.ts`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Ensure bridge usage for analyze + file open.
- [ ] Confirm debounce/cancel logic; no spinner “stuck” states.
- [ ] Add keyboard focus handling for dropzone and buttons.
- [ ] Smoke test with bench assets; capture timings.

### Acceptance Criteria
GIVEN a user drops or selects any of the bench images
WHEN compute runs
THEN metrics render and the UI remains responsive; no dangling spinners or stale results.

### Issues Encountered 
{LOC|20}

