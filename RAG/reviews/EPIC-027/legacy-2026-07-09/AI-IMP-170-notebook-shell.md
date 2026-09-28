---
node_id: AI-IMP-170
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: planned
depends_on:
  - AI-IMP-169
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.65
date_created: 2026-07-09
date_completed:
---

# AI-IMP-170-notebook-shell

## Summary of Issue #1

EPIC-027 FR-4 / Code Change Note 6: the sidebar + header-bar shell becomes the desk + two-page spread + edge tabs. **Done state:** App.svelte renders desk (`--desk`), spread (left/right paper, spine, sheet shadow, ruled helpers), EdgeTabs (Colors/Values/Batch/Exports) riding the border; per-view header bar removed; existing views render inside the spread unstyled-but-functional; notebook tokens become the live token set.

### Out of Scope

- Restyling view contents (IMP-171..175).
- Settings placement (IMP-177 — keep Settings reachable via a temporary plain tab until the corner-affordance artifact lands).
- Reflow below 1100px (IMP-177) — desktop spread only; keep current narrow-mode behavior as a fallback.

### Design/Approach

App.svelte grid → desk/spread composition per 4a: spread centered with margins, left page hosts view's "input" region, right page the "output" region — but during this ticket views keep their own internal layout spanning the spread as one region (a `.spread-content` slot), so the app stays shippable. EdgeTabs replace nav store's `navCollapsed`/`libraryDrawerOpen` chrome (stores stay; MediaBucket rail temporarily floats until IMP-172). Swap `app.css`/token imports to notebook set; delete header bar and its stores' consumers carefully (view titles move into pages as mono page titles in later tickets).

### Files to Touch

- `tauri-app/src/App.svelte`, `app.css`, `lib/styles/*`
- `lib/stores/navigation.ts` (tab model)
- Light touches in each view's root element only

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Desk + spread + spine + shadow render per 4a at 1440×900 and 16″ MBP.
- [ ] EdgeTabs functional for all views incl. temporary Settings access.
- [ ] Header bar removed; Clear/file-label relocated (temporary placement documented).
- [ ] All five views functional inside the spread (manual smoke: load image, analyze, values, batch pin, export one artifact).
- [ ] Screenshots vs `ui_kits/notebook` in PR.
- [ ] Gates: full suites + `check`/`lint`/`format:check`.

### Acceptance Criteria

**WHEN** the app launches. **THEN** the notebook shell renders with working navigation and every existing workflow still completes.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->
