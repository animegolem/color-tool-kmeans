---
node_id: AI-IMP-073
tags:
  - Implementation
  - cli
  - bench
  - compute
kanban_status: completed
depends_on:
  - AI-EPIC-008
  - AI-IMP-070
  - AI-IMP-071
confidence_score: 0.55
date_created: 2026-01-19
date_completed: 2026-01-19
---

# AI-IMP-073-cli-bench-alignment-or-deprecation

## Summary of Issue #1
CLI and bench tools still assume multi-space options and legacy conversions. Outcome: update them to the OKLab golden path or explicitly mark them deprecated with clear guardrails.

### Out of Scope 
- UI or export changes.
- Performance tuning beyond parity checks.

### Design/Approach  
- Update `compute_cli` to use OKLab sampling + chroma-compressed RGB output.
- Update `bench_runner` to use the OKLab pipeline and remove obsolete color-space flags.
- If alignment is too costly, mark tools deprecated with a warning and update docs accordingly.

### Files to Touch
- `tauri-app/src-tauri/src/bin/compute_cli.rs`
- `tauri-app/src-tauri/src/bin/bench_runner.rs`
- `tauri-app/README.md` (if deprecating CLI/bench)

### Implementation Checklist
<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 
- [x] Deprecate compute CLI with a clear warning and an opt-in guard.
- [x] Deprecate bench runner with a clear warning and an opt-in guard.
- [x] Update help text/docs to reflect the deprecation status.
- [x] Smoke test CLI/bench deprecation path.

### Acceptance Criteria
**Scenario:** CLI deprecation
**GIVEN** the CLI is invoked without an opt-in guard
**WHEN** it starts
**THEN** it emits a deprecation warning and exits without processing.

**Scenario:** Bench deprecation
**GIVEN** bench runner execution without an opt-in guard
**WHEN** running with default flags
**THEN** it prints a clear deprecation notice and exits.

### Issues Encountered 
Deprecated legacy CLI/bench paths with an opt-in env guard to avoid accidental usage.
