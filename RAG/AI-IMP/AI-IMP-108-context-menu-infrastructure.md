---
node_id: AI-IMP-108
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Exports
  - Context-Menu
  - Epic-013
kanban_status: completed
depends_on: [AI-EPIC-013]
parent_epic: [[AI-EPIC-013-export-redesign]]
confidence_score: 0.75
date_created: 2026-02-14
date_completed: 2026-02-18
---


# AI-IMP-108-context-menu-infrastructure

## Summary
Native WebKit context menus on images and video elements exposed "Save Image", "Copy Image", "Download" actions that bypass the app's export pathing and settings. This ticket suppresses those menus globally in production builds via a single `contextmenu` event listener in `main.ts`. Dev mode retains the browser context menu for devtools access.

## Implementation
A global `contextmenu` event listener with `preventDefault()` is added in `tauri-app/src/main.ts`, guarded by `!import.meta.env.DEV` so developers retain right-click → Inspect Element in dev mode.

### Files Changed
- `tauri-app/src/main.ts`: Add global contextmenu suppression (~3 LOC)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add global `contextmenu` event listener with `preventDefault()` in `main.ts`.
- [x] Guard with `!import.meta.env.DEV` so dev mode retains browser context menu.
- [x] Run `npm run lint`, `npm run check` successfully.

### Acceptance Criteria
**Scenario: No context menu in production**
GIVEN the app is running in a packaged (non-dev) build
WHEN the user right-clicks on any image, video, or chart element
THEN no context menu appears.

**Scenario: Dev mode retains context menu**
GIVEN the app is running in dev mode (`npm run tauri dev`)
WHEN the user right-clicks on any element
THEN the browser context menu appears (devtools accessible).

## Descoped: Original Scope
The original plan called for `tauri-plugin-menu` integration with native popup menus offering "Save as PNG" / "Save as SVG" on chart elements. This was descoped because:
- The Exports view already provides full coverage for all export actions.
- The plugin integration had moderately high lift (Cargo dependency, Rust command, JS bridge, per-view handlers) for low incremental value.
- Suppressing the leaking WebKit menus addresses the actual UX problem (confusing native save/copy options in packaged builds).

### Issues Encountered
{LOC|20}
