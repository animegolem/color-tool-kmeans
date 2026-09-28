---
node_id: AI-IMP-194
tags:
  - IMP-LIST
  - Implementation
  - remediation
  - optional
kanban_status: backlog
depends_on:
  - AI-IMP-184
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.95
date_created: 2026-09-04
date_completed:
---

# AI-IMP-194-preserve-snapshot-export-name-provenance

## Preserve dotted snapshot labels and frame timestamps

SEP-12: extensionless snapshot labels such as `clip.v1 @ 00m01s` are treated as filenames, so the extension-stripping regex reduces snapshots at different times to `clip`. Success preserves source version and time in the captured export name. No overwrite or data loss was demonstrated; this is optional naming/provenance correction.

Evidence: [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing contract: [PROJECT-RECORD](../PROJECT-RECORD.md) section 4. This planning ticket does not authorize implementation in Round 01.

### Out of Scope

Renaming existing user files, changing export bytes, broad serializer refactors and new source metadata schemas.

### Design/Approach

Distinguish a display label from an actual source filename before stripping extensions. Use captured source kind/name/timestamp from IMP-184; do not guess that every final dot introduces an extension. Reuse the existing timestamp formatter and keep sanitization safe. Serialize work with optional IMP-189/190 because the export runners overlap.

### Files to Touch

- `tauri-app/src/lib/services/frame-snapshot.ts`
- `tauri-app/src/lib/views/exports/colors-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/values-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/batch-export-runner.svelte.ts`
- `tauri-app/src/lib/views/exports/export-job.ts`
- `tauri-app/src/lib/views/exports/export-name.spec.ts` (new).
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Files outside the fence require a lead amendment. Do not modify the active performance worktree, source images, output format definitions or unrelated helper behavior. No commit authority is granted.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add table-driven cases for dotted/extensionless still names, video snapshot labels, timestamps including 0, Unicode and safe sanitization.
- [ ] Verify snapshots at 1 and 2 seconds from clip.v1 retain distinct expected frame names.
- [ ] Verify captured naming does not change after source selection changes mid-export.
- [ ] Verify PNG/SVG/palette extensions and deterministic payloads are unchanged; run applicable gates.
- [ ] Report exact files, tests, gate outcomes and any changed naming examples.

### Acceptance Criteria

**GIVEN** snapshots from `clip.v1` at distinct times, **WHEN** export basenames are captured, **THEN** both source version and frame time survive and no display-label suffix is mistaken for a file extension.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. Optional after export-job provenance; no demonstrated data loss is claimed.
