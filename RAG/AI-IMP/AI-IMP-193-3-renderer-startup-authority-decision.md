---
node_id: AI-IMP-193-3
tags:
  - IMP-LIST
  - Implementation
  - ownership
kanban_status: completed
depends_on:
  - AI-IMP-193-2
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.75
date_created: 2026-09-07
date_completed: 2026-09-08
---

# AI-IMP-193-3-renderer-startup-authority-decision

## Decide the renderer startup-authority boundary

First proposed next-sprint ticket. Determine whether the remaining initial-empty-document premise can be supported on the exact locked stack, or whether the product needs a narrower lifecycle contract or a different mechanism. Deliver one source-backed recommendation and explicit go/no-go decision input; do not start another general protocol review or a sequence of unbounded harness refinements. PROJECT-RECORD §§5,6,12.3 governs.

2026-09-08 / rev0.90: owner approved proceeding. Assigned to Sol under [the focused brief](../reviews/EPIC-029/imp-193-3-startup-authority-brief.md), report-only; no implementation, build or runtime. No acceptance item is checked by dispatch.

### Out of Scope

Implementation, dependency/feature changes, app/harness launch, visible UX, new cache policy, ordinary callback-routing experiments and production193-B.

### Design/Approach

Reuse the accepted source findings and finite run. Inspect only the unresolved bootstrap/initial-document boundary and map each assumption to source evidence, a counterexample or an explicit remaining gap. Present alternatives and their actual product consequences to the Review Lead/owner. One focused source-review submission is the sprint gate; an evidence-backed no-go is a valid deliverable, not permission to keep broadening experiments.

### Files to Touch

On assignment, the sole Code Lead deliverable is RAG/reviews/EPIC-029/imp-193-3-startup-authority-decision.md plus this ticket's validation/issues entries. Candidate source and installed framework source are read-only. PROJECT-RECORD and design rulings are Review Lead-owned. No report or source work is dispatched by ticket creation.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] State the exact unresolved premise and reuse existing findings without re-auditing settled C1–C3.
- [x] Trace the relevant locked native/init/IPC path with precise evidence and counterexample conditions.
- [x] Recommend go, constrained go or no-go; identify any owner choice and exact follow-on fence.
- [x] Obtain a numbered Review Lead decision and record limits without treating finite success as proof.

### Acceptance Criteria

**GIVEN** the completed hidden experiment, **WHEN** the focused source decision is reviewed, **THEN** there is a documented basis to authorize a narrowly scoped next step or stop that direction. Unknowns cannot be silently relabelled accepted.

### Issues Encountered

2026-09-08 / rev0.91: Review Lead accepted the source-decision deliverable under [193-3-D1..D5](../reviews/EPIC-029/imp-193-3-startup-authority-verdict.md). Ticket complete as reviewed research; trusted-local/single-document/fail-stop replacement contract remains proposed for owner approval. Process-replacement detection coverage and production recovery are requirements, not established capabilities.193-4 remains planned/unassigned;193-5 backlog. No source, test, runtime or production acceptance follows.

<!--
The comments under the Issues Encountered heading must not be removed.
Record failed approaches, deviations, blockers and missing tests honestly.
-->

Assigned report-only on2026-09-08. Startup-authority uncertainty remains open. If the source cannot support a stronger guarantee, return that result and the bounded alternatives; no automatic feature enablement or new runtime work.

2026-09-08 validated report-only submission: `RAG/reviews/EPIC-029/imp-193-3-startup-authority-decision.md` recommends **constrained go for IMP-193-4 preparation only**. The fixed report-before-bootstrap path and nonrenewable per-child tuple make unresolved initial-empty/IPC/commit ordering a fail-closed startup-liveness risk under a trusted packaged-local main-frame model; they do not provide hostile-renderer or native-frame authentication. The proposed contract requires a unique child per authority-bearing document and terminal retire/poison on navigation, reload, process replacement, contradiction or ambiguous startup. Current candidate remains unchanged and has no startup-authority adapter. No build, test, runtime, feature, dependency, candidate, epic, PROJECT-RECORD, INDEX or other ticket work was performed. Review Lead decision remains deliberately unchecked.

Friction: locked Wry creates the `WKWebView` before adding user scripts even though Apple's public guidance describes adding them to the configuration before web-view creation; installed source therefore does not settle implicit initial-empty-document injection. Tauri's navigation callback supplies URL only, not frame/navigation identity. These gaps are retained explicitly rather than inferred away from the finite successful run.
