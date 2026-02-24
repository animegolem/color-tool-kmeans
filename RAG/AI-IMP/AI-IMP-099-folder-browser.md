---
node_id: AI-IMP-099
tags:
  - IMP-LIST
  - Implementation
  - UI
  - Input
  - Epic-020
  - folder-browser
  - stretch
kanban_status: deferred
depends_on: [AI-EPIC-020, AI-IMP-096, AI-IMP-097]
parent_epic: [[AI-EPIC-020-multi-image-input]]
confidence_score: 0.50
date_created: 2026-02-03
date_completed:
---

# AI-IMP-099-folder-browser

## Summary
Add an optional "Folder Browser" section to the top of the Library sidebar. Users select a root folder via native dialog; the app renders an IDE-style collapsible file tree showing directories and image files. Image files show thumbnail previews. Clicking an image imports it into the Media Bucket. Session-scoped only (no persistence).

**Stretch feature — may be deprecated if lift is disproportionate.**

### Out of Scope
- Persistent roots across sessions.
- Multi-root trees.
- Advanced search or filtering beyond basic type filter.
- Video thumbnail generation in the tree.

### Design/Approach
- **Tauri FS plugin**: Requires `tauri-plugin-fs` with `readDir` permission scoped to user-selected paths. This is a new plugin dependency.
- **Folder state**: Session-scoped store holding the root path and a lazy-loaded tree structure. Nodes expand on click, loading children on demand.
- **Thumbnails**: For image files, generate small thumbnails (e.g., 48x48) — either via Rust (image crate resize) or by loading preview URLs client-side with CSS sizing.
- **Tree component**: New `FolderTree.svelte` component in `lib/components/`. Recursive tree nodes with expand/collapse, file type icons, click-to-import.
- **Filtering**: Optional toggle to show only images or include videos.

### Risk Assessment
- **High lift**: New Tauri plugin, recursive FS reads, tree UI component, thumbnail generation, permission scoping.
- **Platform variance**: macOS/Linux/Windows path handling differences.
- **Large directories**: Need pagination or virtual scrolling for folders with 1000+ items.
- **Security**: Tauri's security model requires explicit FS scope grants.

### Files to Touch
- `tauri-app/src-tauri/Cargo.toml`: Add `tauri-plugin-fs`
- `tauri-app/src-tauri/capabilities/main.json`: Add fs read permission
- `tauri-app/src-tauri/src/commands.rs`: Add `read_directory` command (or use plugin directly)
- `tauri-app/src/lib/stores/ui.ts`: Add folder browser state (root path, tree data)
- `tauri-app/src/lib/components/FolderTree.svelte`: New tree component
- `tauri-app/src/App.svelte`: Wire folder browser into Library sidebar

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add `tauri-plugin-fs` and configure read permissions
- [ ] Add "Open Folder" action in Library sidebar
- [ ] Store selected root path in session state
- [ ] Implement lazy directory reading (expand on click)
- [ ] Render collapsible tree with directory/file nodes
- [ ] Show image thumbnails for image files
- [ ] Click image file → import into Media Bucket via `addFile()`
- [ ] Handle large directories gracefully (limit or virtualize)
- [ ] Test cross-platform (macOS, Linux, Windows paths)
- [ ] Add optional image/video filter toggle

### Acceptance Criteria

**Scenario: Select root folder**
**GIVEN** the Library sidebar is open
**WHEN** the user clicks "Open Folder" and selects a directory
**THEN** a collapsible tree appears showing subdirectories and image files.

**Scenario: Import from tree**
**GIVEN** a folder tree is displayed
**WHEN** the user clicks an image file in the tree
**THEN** it is imported into the Media Bucket via `addFile()`.

**Scenario: Large directory**
**GIVEN** a folder with 1000+ files
**WHEN** the user expands it in the tree
**THEN** the UI remains responsive (pagination or virtualization).

### Issues Encountered
<!-- Post-implementation notes go here -->
