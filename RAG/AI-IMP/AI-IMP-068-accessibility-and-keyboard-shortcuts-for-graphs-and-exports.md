---
node_id: AI-IMP-068
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Accessibility
  - Epic-007
kanban_status: planned
depends_on: [AI-EPIC-007, AI-IMP-052, AI-IMP-053, AI-IMP-054, AI-IMP-065, AI-IMP-066, AI-IMP-067]
confidence_score: 0.83
created_date: 2025-11-21
close_date:
---


# AI-IMP-068-accessibility-and-keyboard-shortcuts-for-graphs-and-exports

## Summary of Issue #1
HomeView has basic a11y affordances (dropzone roles, overlay labels), but Graphs and Exports currently lack explicit roles, ARIA labelling, and keyboard shortcuts required by AI-EPIC-007. This ticket performs an accessibility and keyboard interaction pass across Home, Graphs, and Exports to ensure keyboard-only users can operate the app, that overlays are announced correctly, and that core shortcuts (Upload, Exports, Devtools) are present and documented. Done means we can tab through all actionable controls, trigger primary actions via the keyboard, and see no obvious a11y warnings in dev tooling.

### Out of Scope 
- Full screen-reader narrative authoring or exhaustive WCAG audits.
- Per-locale localization of labels or shortcuts.

### Design/Approach  
- Review existing markup in Home, Graphs, and Exports against the Figma walkthrough (`figma/ui-walkthrough.png`) and ensure interactive elements have semantic roles, labels, and visible focus states.
- Add keyboard shortcuts: Upload (Ctrl/Cmd+O), Exports (Ctrl/Cmd+E), and ensure existing devtools toggle shortcuts (F12, Ctrl/Cmd+Shift+I) are documented and conflict-free.
- Ensure overlays (loading, drag/drop, error dialogs) use appropriate ARIA roles (e.g., `role="dialog"` with `aria-label` or `aria-labelledby`) and that focus behavior is reasonable for keyboard users.
- Use Svelte a11y lints and manual keyboard walks to catch regressions; avoid introducing dependencies that require network access.

### Files to Touch
- `tauri-app/src/lib/views/HomeView.svelte`: verify/adjust roles, labels, focus handling for dropzone and overlays.
- `tauri-app/src/lib/views/GraphsView.svelte`: add roles/labels for graph interactions and palette rail, once implemented.
- `tauri-app/src/lib/views/ExportsView.svelte`: ensure buttons and status toasts are reachable and clearly labelled.
- `tauri-app/src/app.css` and `tauri-app/src/lib/styles/*`: ensure focus styles are visible and consistent.
- `tauri-app/src/main.ts`: extend/document keyboard shortcuts for Upload and Exports alongside existing devtools shortcuts.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Audit Home, Graphs, and Exports views for roles/labels/focus and update markup to be keyboard-friendly.
- [ ] Add keyboard shortcuts for Upload (Ctrl/Cmd+O) and Exports (Ctrl/Cmd+E) that work in Tauri dev and production builds.
- [ ] Validate overlay dialogs (loading, drag/drop notice, error overlays) use appropriate ARIA roles and labels.
- [ ] Ensure focus outlines are visible and consistent with the style guide across all interactive elements.
- [ ] Run Svelte a11y/lint tooling and fix any new warnings on target screens.
- [ ] Perform a manual keyboard-only walkthrough covering load, analyze, navigate to Graphs/Exports, and trigger exports.

### Acceptance Criteria
**Scenario: Keyboard-only navigation**
GIVEN a user operates the app using only the keyboard  
WHEN they tab through Home, Graphs, and Exports views  
THEN all actionable controls are reachable in a logical order  
AND focus is clearly visible on each control.

**Scenario: Keyboard shortcuts**
GIVEN the app is running in Tauri  
WHEN the user presses Ctrl/Cmd+O  
THEN the Upload action is triggered (native file dialog opens if available).  
WHEN the user presses Ctrl/Cmd+E  
THEN the Exports view is focused/activated.

**Scenario: Accessible overlays**
GIVEN a loading or error overlay is active  
WHEN a screen-reader user navigates the page  
THEN the overlay content is announced via appropriate ARIA roles/labels  
AND no hidden or background controls trap focus behind the overlay.

### Issues Encountered 
{LOC|20}

