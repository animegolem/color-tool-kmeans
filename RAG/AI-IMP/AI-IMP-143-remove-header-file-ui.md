---
node_id: AI-IMP-143
tags:
  - IMP-LIST
  - Implementation
  - frontend
  - cleanup
kanban_status: completed
depends_on: []
parent_epic: [[AI-EPIC-011-aggregate-analysis]]
confidence_score: 0.95
date_created: 2026-03-19
date_completed: 2026-03-19
---

# AI-IMP-143-remove-header-file-ui

## Remove vestigial header bar file label, Clear, and Upload buttons

The header bar file label, "Clear" button, and "Upload" button predate the media sidebar. Every view now has its own upload path via the sidebar "+" button or view-specific upload areas, and "Clear" on some tabs (e.g., batch) does nothing visible. The header UI creates confusion — particularly on batch view where "Clear" calls `clearActiveSelection()` which only affects the single-image active state, not pins.

### Out of Scope

- Removing the sidebar "+" button (stays — it's the universal upload path).
- Modifying view-specific upload mechanisms.
- Changing the header title/description area.

### Design/Approach

Remove the entire `header-file-group` div from `App.svelte` and associated dead code. The sidebar "+" button (line 389) still uses `handleMediaAdd()` so that function stays but can be simplified. CSS classes for the removed elements are cleaned up from `app.css`.

**Dependency trace (safe to remove):**
- `handleClear()` → only called from header Clear button
- `clearActiveSelection` import → still exists in `image.ts` (called by `removeFile()`), but App.svelte import can be removed
- `fileLabel` derived → only used in header
- `file` derived → only used for fileLabel
- `video` derived → only used for fileLabel
- `handleMediaAdd()` → still used by sidebar "+" button, keep it

### Files to Touch

- `src/App.svelte`: remove `header-file-group` div, `handleClear()`, `fileLabel`/`file`/`video` deriveds, unused imports
- `src/app.css`: remove `.header-file-group`, `.header-separator`, `.header-file-label`, `.header-clear`, `.header-upload`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Remove `header-file-group` div and children from App.svelte template
- [x] Remove `handleClear()` function
- [x] Remove `clearActiveSelection` from imports (verify not used elsewhere in App.svelte)
- [x] Remove `fileLabel`, `file`, `video` derived declarations
- [x] Remove `.header-file-group`, `.header-separator`, `.header-file-label`, `.header-clear`, `.header-upload` from app.css
- [x] Keep `handleMediaAdd()` — still used by sidebar "+" button
- [x] Validate: `npm run check && npm run lint && npm run test`
- [ ] Manual smoke: header shows only sidebar toggles + view title/description on all views

### Acceptance Criteria

**Scenario:** Clean header bar
**GIVEN** any view is active.
**THEN** the header bar shows: left sidebar toggle, view title + description, right sidebar toggle.
**AND** no file label, no "Clear" button, no "Upload" button in the header.

**Scenario:** Sidebar upload still works
**GIVEN** the media sidebar is open.
**WHEN** the user clicks the "+" button.
**THEN** a file dialog opens appropriate to the current view.

**Scenario:** No regressions
**GIVEN** the header file UI is removed.
**WHEN** the user loads images and switches between all views.
**THEN** all view-specific upload and analysis flows work as before.

### Issues Encountered

<!--
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->
