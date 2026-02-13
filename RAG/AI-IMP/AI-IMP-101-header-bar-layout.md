---
node_id: AI-IMP-101
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Layout
  - Epic-010
kanban_status: planned
depends_on: [AI-EPIC-010, AI-IMP-096]
parent_epic: [[AI-EPIC-010-multi-image-input]]
confidence_score: 0.62
date_created: 2026-02-12
date_completed:
---

# AI-IMP-101-header-bar-layout

## Summary of Issue #1
The right sidebar toggle pattern is still unstable and visually awkward. We will move the controls into a global in-app header bar that sits below the native window chrome, with symmetric left/right toggle icons and a centered file indicator. This should eliminate the “toggle lane” layout issues and keep the right sidebar aligned to the app frame.

### Out of Scope
- Implementing library ingestion behaviors (handled by IMP-097/098/099/100).
- Replacing the native OS titlebar with a custom titlebar.

### Design/Approach
- Add a fixed header bar inside the app shell (global across views).
- Left side: mode title aligned with main content grid edge.
- Center: selected file/video label + Clear action.
- Right side: sidebar toggle icon (mirrors left for symmetry).
- When the sidebar opens, the header and main content reflow together so the right rail consumes space instead of overlaying.
- Remove the floating/overlay toggle lane behavior from IMP-096; toggles live in header endcaps.
- Right sidebar must be fully right-justified and full-height (visual mirror of left nav when open).
- Closed state must not reserve a visual rail inside the content viewport.
- At narrow widths, chart cards must reflow/stack (no overlap); sidebar width remains bounded and content shrinks responsively.
- Use the VS Code SVGs already in `RAG/assets` for toggle icons and add attribution.
- Reuse existing stores (`selectedFile`, `videoState`) for header state wiring; avoid introducing a new global media store in this IMP.
- Perform a quick `HomeView.svelte` extraction audit during implementation, but treat larger component refactors as follow-up work unless they are required to complete this layout safely.

### Files to Touch
- `tauri-app/src/App.svelte`: add header bar markup, move toggle controls to header.
- `tauri-app/src/app.css`: layout grid for header + content + right rail; ensure shared column sizing.
- `tauri-app/src/lib/views/HomeView.svelte`: remove any duplicated selection/clear UI from body if moved to header.
- `ATTRIBUTIONS.md`: add icon attribution if SVGs are reused.
- `RAG/assets/*`: reference source SVGs for toggle icons.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add global header bar structure and wiring in `App.svelte`.
- [ ] Render mode title, file label, and Clear action in the header.
- [ ] Add left/right toggle icons in the header, wired to `libraryDrawerOpen`.
- [ ] Convert shell layout to a header + body grid so header and body share column sizing.
- [ ] Ensure main content scrolls while header and side rails stay fixed.
- [ ] Remove legacy floating toggle lane styles/markup from `App.svelte` + `app.css`.
- [ ] Make right sidebar fully right-justified + full-height; no content overlap at any width.
- [ ] Add/verify responsive breakpoints so analysis cards stack before overlap.
- [ ] Update/remove any redundant file label/clear UI from `HomeView.svelte`.
- [ ] Record `HomeView.svelte` extraction candidates as follow-up items if encountered during implementation.
- [ ] Add attribution for the SVG icons.

### Acceptance Criteria
**Scenario: Header toggle**
**GIVEN** the Colors view is visible
**WHEN** the user clicks the header toggle icon
**THEN** the right sidebar opens or closes without shifting scroll position.

**Scenario: Header layout**
**GIVEN** a long page with scrollable content
**WHEN** the user scrolls
**THEN** the header and toggle icons stay fixed and centered.

**Scenario: Reflow**
**GIVEN** the sidebar is open
**WHEN** the window is resized
**THEN** the header, main content, and sidebar reflow together without overlap.

**Scenario: Narrow window**
**GIVEN** the app width is reduced below the two-column layout threshold
**WHEN** content reflows
**THEN** cards stack into a single-column flow and remain fully visible without clipping/overlap.

**Scenario: Right rail anchoring**
**GIVEN** the library is open
**WHEN** the user scrolls or resizes
**THEN** the right rail stays fully right-justified, full-height, and does not float over main content.

### Issues Encountered
{LOC|20}
