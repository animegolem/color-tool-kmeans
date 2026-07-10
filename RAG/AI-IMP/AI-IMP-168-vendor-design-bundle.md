---
node_id: AI-IMP-168
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.85
date_created: 2026-07-09
date_completed:
---

# AI-IMP-168-vendor-design-bundle

## Summary of Issue #1

The notebook design system lives in zips in `RAG/` — not greppable by agents, not diffable, fonts not vendored. EPIC-027 FR-1/FR-2. **Done state:** bundle extracted to `RAG/design-system/` (zips removed), Fira Code woffs vendored into the app, `lib/styles/tokens.css` replaced by the notebook tokens behind the existing custom-property names where they map (full-size values from `tokens/notebook.css`), CLAUDE.md refreshed (stale sections: BatchView/SettingsView/MediaBucket/stores absent today; add design-system pointer).

### Out of Scope

- Any component or view changes (tokens land dormant alongside current styles until IMP-169/170 consume them).
- The `-old ui` zip and `.fig` (archive to `RAG/archive/`).

### Design/Approach

Extract `Color Tool Design System.zip` → `RAG/design-system/` (drop `uploads/` duplication). Copy `assets/fonts/FiraCode-*.woff` → `tauri-app/src/styles/` fonts dir + `@font-face` in `fonts.css` (offline-first, no CDN). Add `tokens/notebook.css` under `lib/styles/` as new file; do NOT delete current tokens yet — IMP-170 swaps consumption. CLAUDE.md: correct architecture section against current tree; add RAG/design-system + DESIGN-COVERAGE pointers.

### Files to Touch

- `RAG/design-system/**` (new, extracted), zips removed/archived
- `tauri-app/src/styles/fonts.css` + font binaries
- `tauri-app/src/lib/styles/notebook-tokens.css` (new)
- `CLAUDE.md`

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Bundle extracted, committed, zips archived; `git grep "notebook"` finds the readme.
- [ ] Fira Code vendored + declared; app builds; no network font requests.
- [ ] Notebook tokens file added (dormant); documented mapping notes for IMP-170.
- [ ] CLAUDE.md refreshed and accurate against the current tree.
- [ ] Gates: `npm run build`, `npm test -- --run`, `format:check`, `lint`, `check`.

### Acceptance Criteria

**WHEN** an agent greps for a component/token name. **THEN** it hits `RAG/design-system/`, not a zip.
**AND** the packaged app renders Fira Code offline.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
