# AI-EPIC
---
node_id: AI-EPIC-021
tags:
  - EPIC
  - AI
  - accessibility
  - keyboard
date_created: 2026-02-14
date_completed:
kanban_status: deferred
depends_on:
AI_IMP_spawned:
---

# AI-EPIC-021-accessibility-and-keyboard

## Problem Statement/Feature Scope
The app lacks systematic accessibility support. Interactive elements are missing ARIA roles, keyboard navigation is incomplete, focus management is inconsistent, and no keyboard shortcuts exist for common actions. Screen reader users cannot effectively operate the analysis workflow.

## Proposed Solution(s)
- Audit all views for ARIA roles, labels, and focus management
- Add keyboard shortcuts for primary actions (Upload, Export, view navigation)
- Ensure overlays and modals trap focus correctly and are announced to screen readers
- Establish visible, consistent focus styles across all interactive elements
- Run automated a11y linting and manual keyboard walkthroughs

## Path(s) Not Taken
- Full WCAG 2.1 AA compliance audit (future work, not initial scope)
- Per-locale localization of labels or shortcuts

## Success Metrics
1. All actionable controls are reachable via keyboard in logical tab order
2. Keyboard shortcuts for Upload and Export work in Tauri builds
3. Overlays use appropriate ARIA roles and do not trap focus behind them

## Requirements

### Functional Requirements
- [ ] FR-1: Keyboard-only navigation through all views with logical tab order
- [ ] FR-2: Keyboard shortcuts for Upload (Ctrl/Cmd+O) and Export (Ctrl/Cmd+E)
- [ ] FR-3: ARIA roles and labels on all interactive elements
- [ ] FR-4: Focus trapping in modal overlays with screen reader announcements

### Non-Functional Requirements
- [ ] NFR-1: Visible focus outlines consistent with app style guide
- [ ] NFR-2: No new Svelte a11y lint warnings introduced

## Implementation Breakdown

### Planned Tickets
- AI-IMP-068: Accessibility and keyboard shortcuts for graphs and exports

### Completed Tickets

## Notes
- Moved from EPIC-013 scope; a11y is cross-cutting and not tied to export redesign timeline
- Deferred status; will be prioritized after core export functionality is complete
