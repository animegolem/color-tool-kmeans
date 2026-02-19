---
node_id: AI-IMP-111
tags:
  - IMP-LIST
  - Implementation
  - Debt
  - Cleanup
  - bridges
kanban_status: backlog
depends_on: []
parent_epic:
confidence_score: 0.90
date_created: 2026-02-18
date_completed:
---

# AI-IMP-111-bridge-legacy-cleanup

## Summary
Remove legacy browser bridge code from the Tauri-only app. The browser bridge in `fs.ts`, polling loops in `fs.ts` and `compute.ts`, and the `bridge.force` localStorage hack in `tauri.ts` are all remnants of EPIC-005 (Sept 2025, shell-agnostic era) when the app supported both browser and Tauri targets. The app is now Tauri-only.

Done means: `createBrowserFsBridge()` is removed, bridge selection functions are simplified to Tauri-only with a throw on missing API, polling hacks are removed, and CLAUDE.md no longer references `bridge.force`.

### Out of Scope
- Refactoring bridge interfaces themselves (just removing dead code paths).
- Any functional changes to Tauri bridge behavior.

### Design/Approach
- **`fs.ts`**: Remove `createBrowserFsBridge()` (~60 LOC) and its `input.multiple` / hidden input element logic. Remove 300ms polling from `ensureFsBridgeReady()`. Simplify `selectFsBridge()` to Tauri-only — throw if Tauri API not detected (match the pattern used in `compute.ts` bridge).
- **`compute.ts`**: Remove 300ms polling from `ensureBridgeReady()`. Simplify to direct Tauri detection + throw.
- **`tauri.ts`**: Remove `bridge.force` localStorage hack and any related branching.
- **`CLAUDE.md`**: Remove the line `Force native with localStorage.setItem('bridge.force','tauri')` from the Key Design Pattern note.

### Files to Touch
- `tauri-app/src/lib/bridges/fs.ts`: Remove browser bridge, polling, simplify selection
- `tauri-app/src/lib/bridges/compute.ts`: Remove polling from `ensureBridgeReady()`
- `tauri-app/src/lib/bridges/tauri.ts`: Remove `bridge.force` localStorage hack
- `CLAUDE.md`: Remove `bridge.force` guidance

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Remove `createBrowserFsBridge()` function and all browser-specific file handling from `fs.ts`
- [ ] Remove 300ms polling from `ensureFsBridgeReady()` in `fs.ts`
- [ ] Simplify `selectFsBridge()` to Tauri-only with throw on missing API
- [ ] Remove 300ms polling from `ensureBridgeReady()` in `compute.ts`
- [ ] Remove `bridge.force` localStorage hack from `tauri.ts`
- [ ] Update CLAUDE.md: remove `localStorage.setItem('bridge.force','tauri')` guidance
- [ ] Verify app launches and file dialogs work in `npm run tauri dev`
- [ ] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: App launches without browser bridge**
**GIVEN** the app is built and running as a Tauri native app
**WHEN** the user opens the app
**THEN** the app initializes without errors, using Tauri bridge directly without polling or fallback.

**Scenario: File dialog still works**
**GIVEN** the browser bridge code has been removed
**WHEN** the user clicks "Add media" (or equivalent upload button)
**THEN** the native Tauri file dialog opens normally.

**Scenario: Missing Tauri API throws**
**GIVEN** the Tauri API is not available (hypothetical)
**WHEN** the bridge selection runs
**THEN** a clear error is thrown instead of silently falling back to a non-functional browser bridge.

### Issues Encountered
<!-- Post-implementation notes go here -->
