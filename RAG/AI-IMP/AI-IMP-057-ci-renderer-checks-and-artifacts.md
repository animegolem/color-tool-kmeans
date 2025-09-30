---
node_id: AI-IMP-057
tags:
  - IMP-LIST
  - Implementation
  - CI
  - Renderer
  - Epic-005
kanban_status: planned
depends_on: [AI-EPIC-005, AI-IMP-045]
confidence_score: 0.84
created_date: 2025-09-29
close_date:
---

# AI-IMP-057-ci-renderer-checks-and-artifacts

## Summary of Issue #1
Augment CI to run renderer checks (svelte-check, vitest) and attach a tiny renderer-only build artifact for quick manual verification. Ensure LOC/lint gates apply to UI code.

### Out of Scope 
- Native/Rust benches (covered elsewhere).

### Design/Approach  
- Reuse existing CI; add steps in `electron-build.yml` or `ci.yml` to run renderer tests; upload a zipped `dist/renderer` directory as an artifact.

### Files to Touch
- `.github/workflows/*.yml` (update jobs)
- `tauri-app/package.json` (ensure `check` and `test` scripts stable in CI)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Add renderer checks to CI matrix.
- [ ] Attach renderer `dist/renderer` as artifact.
- [ ] Ensure LOC/lint gates include UI files.

### Acceptance Criteria
GIVEN a PR opens
WHEN CI runs
THEN renderer tests pass and a small artifact is available for pull-down.

### Issues Encountered 
{LOC|20}

