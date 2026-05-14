---
node_id: AI-IMP-127
tags:
  - IMP-LIST
  - Implementation
  - ux
  - performance
  - P3
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-023-ux-polish-and-media-ergonomics]]
confidence_score: 0.85
date_created: 2026-03-13
date_completed: 2026-03-13
---

# AI-IMP-127-fix-library-sidebar-open-hitch

## Fix Library Sidebar Open Hitch

Opening the library rail hitches; closing is smooth. Root cause: `{#if $libraryDrawerOpen}` at `App.svelte:374` mounts `<MediaBucket />` which renders all thumbnails simultaneously during the CSS grid transition.

### Out of Scope

- Virtualizing the thumbnail list (separate optimization)
- Changing the sidebar collapse/expand animation

### Design/Approach

Replace `{#if $libraryDrawerOpen}` with a CSS visibility toggle so the DOM stays mounted. Use `visibility: hidden` + `overflow: hidden` when collapsed, `visibility: visible` when open. This avoids the mount cost during the open animation.

### Files to Touch

- `tauri-app/src/App.svelte`: replace `{#if}` with CSS-based visibility toggle
- `tauri-app/src/lib/components/MediaBucket.svelte`: ensure it handles hidden state gracefully
- `tauri-app/src/app.css`: add visibility utility if needed

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Replace `{#if $libraryDrawerOpen}` with always-mounted `<MediaBucket />`
- [x] Add CSS visibility toggle based on `$libraryDrawerOpen`
- [x] Verify open animation is smooth (no hitch)
- [x] Verify close animation remains smooth
- [x] Verify MediaBucket doesn't interfere with layout when hidden
- [x] Verify `npm run check && npm run lint` passes

### Acceptance Criteria

**Scenario:** User opens the library sidebar.
**GIVEN** the library sidebar is closed.
**WHEN** the user clicks the library toggle button.
**THEN** the sidebar opens with a smooth animation, no visible hitch or jank.

### Issues Encountered

<!-- This section is filled out post work as you fill out the checklists. -->
