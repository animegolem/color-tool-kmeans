---
node_id: AI-IMP-098
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
  - clipboard
kanban_status: completed
depends_on: [AI-EPIC-020, AI-IMP-096, AI-IMP-097]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.68
date_created: 2026-02-03
date_completed: 2026-02-24
---

# AI-IMP-098-clipboard-paste-images

## Summary
Support pasting images via clipboard (Ctrl/Cmd+V) so users can quickly bring in references without a file picker. Pasted images should be added to the Media Bucket. Uses `addFile()` from IMP-097.

### Out of Scope
- Video paste handling.
- Folder tree browsing (IMP-099).
- Active switching/removal behavior (IMP-100).

### Design/Approach
- Global `paste` event listener in `App.svelte` (not HomeView) — works from any view.
- Guard: skip if focused element is editable (`<input>`, `<textarea>`, `contenteditable`) using existing `isEditableTarget()` helper.
- Extract first `image/*` blob from clipboard, save to temp file in app cache dir via `save_file` Tauri command (native pipeline requires filesystem path).
- Build `ImageEntry` with path-based source and `convertFileSrc` preview URL.
- Activation policy: if no active item → `setFile()` + set `__ACTIVE_IMAGE_PATH__`; else → `appendFile()` (no switch).
- Open library drawer after paste. Log event.
- Non-Tauri: early return (clipboard paste requires native backend for temp file write and analysis).

### Files to Touch
- `tauri-app/src/App.svelte`: paste event listener, `pasteImageBlob()` handler

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Add global paste listener in App.svelte `onMount` with cleanup on destroy
- [x] Guard: skip if Tauri not available or focused element is editable
- [x] Extract first `image/*` blob from `clipboardData.items`
- [x] Save blob to temp file via `save_file` Tauri command (`appCacheDir/clipboard/paste-*.png`)
- [x] Build `ImageEntry` with path-based source and `convertFileSrc` preview URL
- [x] Activation policy: `setFile()` if no active item, `appendFile()` otherwise
- [x] Open library drawer after paste
- [x] Handle empty/unsupported clipboard contents gracefully (silent no-op)
- [x] Run `npm run check`, `npm run lint`

### Acceptance Criteria
**Scenario: Paste image**
**GIVEN** the app is focused
**WHEN** the user pastes an image via Ctrl/Cmd+V
**THEN** it appears in the Media Bucket.

### Issues Encountered
- Implemented in `App.svelte` rather than `HomeView.svelte` so paste works from any view (Colors, Values, Exports, Settings).
- Clipboard images saved as temp PNG files in app cache dir — the native analysis pipeline requires a filesystem path. Future optimization: consider base64 IPC for large images to avoid the temp file round-trip.
