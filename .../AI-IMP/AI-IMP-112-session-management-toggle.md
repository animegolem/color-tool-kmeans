---
node_id: AI-IMP-112
tags:
  - IMP-LIST
  - Implementation
  - UI
  - UX
  - Epic-020
  - session-management
kanban_status: deferred
depends_on: [AI-EPIC-020, AI-IMP-097]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.50
date_created: 2026-02-18
date_completed:
---

# AI-IMP-112-session-management-toggle

## Summary
Add a MKVToolNix-style session management toggle that lets users choose between "add to current session" and "start new session" when loading files. Currently, new files always activate (IMP-097 default). This ticket adds a first-time dialog and a persistent toggle in settings.

Done means: users can choose whether new file ingestion replaces the current session or appends to it, with the preference persisted across app restarts.

### Out of Scope
- The core multi-file ingest pipeline (IMP-097).
- Session persistence across app restarts (state remains ephemeral).
- Undo/redo for session operations.

### Design/Approach
- Add a "Session mode" toggle to Global Settings (EPIC-014 settings view).
- Options: "Always add to session" (default, current behavior) vs. "Ask each time" (shows a dialog on ingest).
- When "Ask each time" is active and files are loaded, show a modal: "Add to current session" / "Start new session" / "Cancel".
- "Start new session" clears the Media Bucket before ingesting.
- Persist preference via the existing settings store.

### Files to Touch
- `tauri-app/src/lib/stores/ui.ts`: Add session mode preference
- `tauri-app/src/lib/views/home/file-ingestion.svelte.ts`: Check session mode before ingest, show dialog if needed
- `tauri-app/src/lib/components/SessionDialog.svelte`: New dialog component (if modal approach)
- Settings view: Add toggle option

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add session mode preference to settings store
- [ ] Implement session mode toggle in settings view
- [ ] Create session dialog component (modal)
- [ ] Wire dialog into file-ingestion flow
- [ ] "Start new session" clears Media Bucket before ingest
- [ ] Persist preference across app restarts
- [ ] Run `npm run check`, `npm run lint`, `npm run test`

### Acceptance Criteria

**Scenario: Default behavior unchanged**
**GIVEN** the session mode is set to "Always add to session" (default)
**WHEN** the user loads new files
**THEN** files are added to the existing Media Bucket without any dialog.

**Scenario: Ask each time — add to session**
**GIVEN** the session mode is set to "Ask each time"
**WHEN** the user loads new files and selects "Add to current session"
**THEN** files are appended to the existing Media Bucket.

**Scenario: Ask each time — start new session**
**GIVEN** the session mode is set to "Ask each time" and the Media Bucket has 3 items
**WHEN** the user loads new files and selects "Start new session"
**THEN** the Media Bucket is cleared, then the new files are ingested.

### Issues Encountered
<!-- Post-implementation notes go here -->
