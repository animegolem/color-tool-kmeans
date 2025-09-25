---
node_id: AI-IMP-045
tags:
  - IMP-LIST
  - Implementation
  - CI
  - Packaging
  - Electron
  - Epic-004
kanban_status: planned
depends_on: [AI-IMP-042, AI-IMP-043]
confidence_score: 0.82
created_date: 2025-09-25
close_date:
---

# AI-IMP-045-ci-and-packaging

## Summary of Issue #1
Add CI jobs to build Electron artifacts for Linux and Windows, enforce LOC/lint/format checks, and publish build artifacts on pull requests. Done when GitHub Actions produce downloadable AppImage and Windows portable files with size checks and basic smoke validations.

### Out of Scope
- Bench harness execution (optional follow-up).

### Design/Approach
- Use `actions/setup-node` and `electron-builder` in matrix jobs.
- Archive build outputs as artifacts; enforce size thresholds.
- Reuse existing LOC guard and add `npm run check`.

### Files to Touch
- `.github/workflows/electron-build.yml` (new).
- `package.json` scripts for CI convenience.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Create workflow with Linux/Windows matrix; install dependencies and build.
- [ ] Upload artifacts; include SHA256 sums.
- [ ] Add a minimal headless sanity check (app starts/stops in CI where feasible).
- [ ] Document CI outputs and how to fetch artifacts.

### Acceptance Criteria
**Scenario:** CI produces artifacts
GIVEN a push or PR
WHEN the workflow runs
THEN artifacts for Linux and Windows are attached, with checks passing and sizes under thresholds.

### Issues Encountered
{LOC|20}

