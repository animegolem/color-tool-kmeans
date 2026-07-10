---
node_id: AI-IMP-167
tags:
  - IMP-LIST
  - Implementation
  - design
  - ui
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-027-notebook-ui-redesign]]
confidence_score: 0.9
date_created: 2026-07-09
date_completed: 2026-07-09
---

# AI-IMP-167-design-coverage-manifest

## Summary of Issue #1

The notebook design bundle covers the happy-path surfaces; an app is mostly lifecycles (pending, error, empty, in-transition), and EPIC-026's live mode post-dates the bundle entirely. Implementation tickets need to know, per lifecycle, whether the design exists — and the owner needs a concrete artifact list for Claude Design sessions.

**Done state:** `RAG/DESIGN-COVERAGE.md` exists — 12 lifecycles (L1–L12) mapped state-by-state against wireframe sections/components with COVERED/PARTIAL/MISSING verdicts, and a priority-ordered artifact shopping list, each item naming its receiving ticket.

### Out of Scope

- Producing the design artifacts (owner, in Claude Design).
- Any implementation.

### Design/Approach

Walk every view/service lifecycle in the shipping app (ingestion, color analysis, video transport, live playback per ADR-003, bucket, values, batch, exports, settings, zoom, reflow, error taxonomy) against the bundle's wireframes (3a/3b, 4a, 5a–5e, 6a, 7a–7c), Code Change Notes 1–12, and the 18 components. Record verdicts and derive the shopping list.

### Files to Touch

- `RAG/DESIGN-COVERAGE.md` (new)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] 12 lifecycles enumerated with per-state verdicts and design refs.
- [x] Artifact shopping list, priority-ordered (P1 ×3, P2 ×3, P3 ×4), each mapped to a receiving ticket.
- [x] Live-mode (EPIC-026) design needs captured as L4/P1-2.

### Acceptance Criteria

**GIVEN** the owner opens `RAG/DESIGN-COVERAGE.md` before a Claude Design session.
**THEN** every MISSING/PARTIAL state names what to draw and which ticket consumes it.
**AND** each implementation ticket (IMP-168..177) cites its lifecycles.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

Executed by lead at cut time so the owner's artifact production could start immediately. The manifest is a living document: implementation tickets should update verdicts as artifacts land.
