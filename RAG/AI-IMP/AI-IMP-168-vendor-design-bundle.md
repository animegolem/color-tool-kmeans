---
node_id: AI-IMP-168
tags:
  - IMP-LIST
  - Implementation
  - ui
  - design-review
kanban_status: planned
depends_on: []
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.8
date_created: 2026-07-09
date_completed:
assignee: Code Lead (Sol)
---

# AI-IMP-168-vendor-design-bundle

## Preserve design provenance and add dormant study tokens

Replace the zip-only design handoff with a searchable, provenance-preserving September study-design carrier and a dormant token sheet. Existing Fira Sans/Fira Code assets are already vendored; do not duplicate them. Archive references by copying, never delete the supplied archives.

Normative basis: PROJECT-RECORD rev 0.5 §9.1, §4 and §6. Visuals: RAG/design-2026-09/README.md. September rescope preserves this ticket ID; the full prior text is archived under RAG/reviews/EPIC-027/legacy-2026-07-09/. Status is a plan, not implementation authorization. First assignment is review-only.

### Out of Scope

No runtime UI, dependencies, font replacement, old-zip deletion, analysis, export output, or IPC changes.

### Design/Approach

Follow PROJECT-RECORD rev 0.6 §9.7 and Round 01 verdict V3/V5/V6. Preserve all eight pinned references byte-for-byte in a dated carrier; record source/copy hashes separately from any generated preview wrappers. Six non-3D HTML fragments plus the Markdown register have no runtime network imports; the preserved 3D HTML is a network-dependent prototype with an honest limitation, not an offline visual fallback. Three.js vendoring/fallback belongs to IMP-197. Add study-tokens.css under [data-study-surface] with only --study-* variables and no production import. Record nine font binaries plus README, six archive matches, and absent in-repo license evidence truthfully; download nothing and keep all archive/font bytes unchanged. Serif remains an unapproved proposal.

### Files to Touch

Paths below are repository-root relative. New-file seams are hypotheses to verify in Round 01; do not silently widen them.

- RAG/design-system/** (new reference-only extraction, excluding duplicate uploads)
- RAG/design-2026-09/** (provenance/portable previews only; do not rewrite normative decisions)
- tauri-app/src/lib/styles/study-tokens.css (new, dormant)
- tauri-app/src/assets/fonts/README.md (inventory only)
- CLAUDE.md and AGENTS.md (design pointers only)
- This ticket's checklist and Issues Encountered after authorized implementation only.

Do NOT touch unrelated tickets, RAG/PROJECT-RECORD.md, prior review reports, native code/color-core, or other worktrees unless specifically named above. The lead owns INDEX regeneration and all Git commits/merges under repository rules.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Inventory all reference sources, dates, licensing, and hashes; keep originals unchanged.
- [ ] Verify already-vendored font files; do not download or add fonts without a licensing ruling.
- [ ] Add dormant scoped tokens with no main-entry import or effect on current rendering.
- [ ] Keep the non-3D references inspectable offline; explicitly identify the preserved Three.js prototype's network limitation without claiming a bundled fallback. Generated wrappers require separately declared paths and never replace pinned sources.
- [ ] Reproduce the applicable gates in PROJECT-RECORD §6; report exact counts, baseline failures, platform gaps and human acceptance still outstanding.

### Acceptance Criteria

GIVEN current main and the design carrier, WHEN a developer opens the references offline, THEN they can identify current versus superseded designs and inspect the non-3D walkthrough, AND the shipping UI and source behavior are unchanged.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
-->

Planning: source/visual reconciliation only. No implementation or new application tests have run. Unresolved policy and EPIC-029 prerequisites remain explicit gates.
