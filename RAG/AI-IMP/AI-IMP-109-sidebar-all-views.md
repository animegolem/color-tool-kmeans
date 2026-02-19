---
node_id: AI-IMP-109
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Layout
  - Epic-020
  - sidebar
kanban_status: planned
depends_on: [AI-EPIC-020, AI-IMP-100]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.82
date_created: 2026-02-18
date_completed:
---

# AI-IMP-109-sidebar-all-views

## Summary
The Library sidebar toggle and rail currently only render on the Colors (Home) view. Extend to all views (Colors, Values, Exports) so users can switch between media from any context.

Done means: the Library sidebar toggle button and rail are visible and functional on Colors, Values, and Exports views. Thin ticket — the sidebar content is the same across views; only the toggle visibility and grid column need extending.

### Out of Scope
- New sidebar content or sections (covered by IMP-099).
- View-specific sidebar behavior.

### Design/Approach
- Remove the `$currentView === 'home'` guard on the library rail rendering in `App.svelte`.
- Remove the view-conditional guard on the header toggle button (replace placeholder with real toggle on all views).
- Verify the CSS Grid layout works correctly on Values and Exports views with the sidebar open and closed.
- Verify responsive behavior: sidebar still auto-collapses at <980px on all views.

### Files to Touch
- `tauri-app/src/App.svelte`: Remove view-conditional guards on library rail and toggle button
- `tauri-app/src/app.css`: Verify grid behavior on Values/Exports views with sidebar open/closed

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Remove view-conditional guard on library rail rendering
- [ ] Remove view-conditional guard on header toggle button (replace placeholder with real toggle)
- [ ] Verify grid layout on Values view with sidebar open/closed
- [ ] Verify grid layout on Exports view with sidebar open/closed
- [ ] Responsive: sidebar still auto-collapses at <980px on all views
- [ ] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: Sidebar on Values view**
**GIVEN** the user is on the Values view with media loaded
**WHEN** the user clicks the Library toggle in the header
**THEN** the sidebar expands showing Media Bucket items.
**AND** clicking a different item switches the active media and triggers value re-analysis.

**Scenario: Sidebar on Exports view**
**GIVEN** the user is on the Exports view
**WHEN** the Library sidebar is open
**THEN** the grid layout accommodates the sidebar without breaking the export content.

**Scenario: Responsive collapse**
**GIVEN** the viewport is narrower than 980px
**WHEN** on any view (Colors, Values, Exports)
**THEN** the sidebar auto-collapses.

### Issues Encountered
<!-- Post-implementation notes go here -->
