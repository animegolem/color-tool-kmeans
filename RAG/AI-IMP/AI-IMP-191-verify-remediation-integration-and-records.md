---
node_id: AI-IMP-191
tags:
  - IMP-LIST
  - Implementation
  - remediation
kanban_status: planned
depends_on:
  - AI-IMP-179
  - AI-IMP-180
  - AI-IMP-181
  - AI-IMP-182
  - AI-IMP-183
  - AI-IMP-184
  - AI-IMP-185
  - AI-IMP-186
  - AI-IMP-187
  - AI-IMP-188
  - AI-IMP-192
  - AI-IMP-193
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.90
date_created: 2026-09-04
date_completed:
---

# AI-IMP-191-verify-remediation-integration-and-records

## Verify the integrated remedy and reconcile project records

Independent acceptance must distinguish adopted patches from tested, integrated remedies. Success is a current-tip evidence bundle mapping all 22 defects and required residuals to observed gates; optional work is explicitly accepted or deferred.

Trace: **EPIC-029 release acceptance**; priority **acceptance**. Evidence and trigger are in [September register](../AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md). Governing invariants: [PROJECT-RECORD](../PROJECT-RECORD.md) sections 4–6. Status is a planning reservation, not implementation authorization.

### Out of Scope

Production fixes discovered during acceptance: assign or reopen the responsible ticket; no quiet implementation inside a documentation acceptance commit.

### Design/Approach

Review lead reruns decisive boundary tests and full gates after code-lead self-review. Update architecture paths and completion records only from observed code. Regenerate INDEX twice and compare. Keep historical logs immutable except an explicit dated correction if necessary.

### Files to Touch

All paths below are repository-relative. `(new)` denotes a proposed new file, not an existing source.

- `CLAUDE.md`
- `RAG/PROJECT-RECORD.md`
- `RAG/DATA-FLOW.md`
- `RAG/AI-EPIC/AI-EPIC-029-control-flow-remediation.md`
- `RAG/AI-IMP/AI-IMP-179-*.md through AI-IMP-194-*.md (status/evidence only)`
- `RAG/reviews/EPIC-029/*.md (numbered submissions/verdicts)`
- `RAG/AI-LOG/2026-09-04-LOG-AI-remediation-reconciliation.md (append acceptance evidence only)`
- `RAG/INDEX.md (generated only)`
- This ticket's checklist and Issues Encountered section.

### Do NOT Touch

Any file outside the list requires a numbered lead scope amendment before editing. Sibling ticket changes are restricted to the explicitly listed status/evidence updates. Do not edit generated INDEX manually, active IMP-178 worktree, EPIC-026 feature branch, design assets, or spike binaries. No production edits during the review-only first round. Delegated agents do not commit unless the owner/lead explicitly supersedes that restriction for a later implementation assignment.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Run all renderer and Rust workspace gates at the exact integration tip; record counts/platform/toolchain.
- [ ] Run core scalar snapshots and inspect normal dependency tree for no Tauri.
- [ ] Run native smoke scenarios for replacement, cross-view pending frame, pin/reanalysis, concurrent/canceled export, removal and cache pressure.
- [ ] Obtain Windows packaging and Linux CI evidence before release approval; do not infer from macOS.
- [ ] Verify the issue/commit/test map and deterministic generated INDEX; report every unresolved exception.
- [ ] Record exact base/head, files, regression counts, gate outcomes, and all deviations; leave unrun acceptance checks open.

### Acceptance Criteria

**GIVEN** a submitted implementation candidate, **WHEN** independent review completes, **THEN** each required issue has current-base evidence, no unreviewed core/feature changes are included, and release status truthfully reflects outstanding platform gates.

All applicable gates in PROJECT-RECORD section 6 pass at the submitted tip; optional tickets do not block the required path unless explicitly admitted. No temporary probe or source trace substitutes for the permanent regressions requested above.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
This section is filled out post work as you fill out the checklists.
Document failed approaches, blockers, deviations, and missing tests.
-->

Not started. September evidence is review input, not a completed implementation.
