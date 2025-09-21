---
node_id: AI-IMP-010
tags:
  - IMP-LIST
  - Implementation
  - CI
  - DI
  - Precommit
  - Quality
kanban_status: planned
depends_on: []
confidence_score: 0.86
created_date: 2025-09-21
close_date:
--- 

# AI-IMP-010-ci_di_and_precommit

## Summary of Issue #1
We need consistent local and remote checks to keep the codebase healthy as we pivot stacks. Scope: add a GitHub Actions CI workflow (lint/test/LOC guard), lightweight DI build stubs, and local Git hooks for formatting/lint warnings. Add a warning for large changes (>350 LOC per file) with a bypass token when necessary. Outcome: contributors get fast feedback locally; CI enforces the same rules without altering business logic.

### Out of Scope 
- Changing the scientist’s original algorithms or porting large upstream files.
- Packaging/release pipelines (tracked in app‑specific IMPs).

### Design/Approach  
- Local: add `.githooks/pre-commit` that runs “if present” scripts (format/lint) in each workspace (Electron/Tauri/Rust) and a LOC checker that warns for files >350 LOC. Hooks never modify content; they only warn/fail fast.
- Remote: add `.github/workflows/ci.yml` to run Node tests (electron-app), Rust fmt/clippy/test when `src-tauri` exists, and a strict LOC check that fails the job unless commit message contains `[loc-bypass]` or env `LOC_BYPASS=1` is set.
- LOC policy: default threshold 350 lines per file; exclusions for vendor/images/build artifacts. The rule is advisory locally, enforced in CI with an explicit, auditable bypass.

### Files to Touch
- `.githooks/pre-commit` — run format/lint/test if available; run LOC warning.
- `scripts/loc-check.sh` — shared LOC logic (warning mode by default).
- `scripts/ci/loc-enforce.js` — CI‑only strict mode with bypass token.
- `.github/workflows/ci.yml` — Node + optional Rust jobs; LOC enforcement.
- `AGENTS.md` — add one‑time command to enable hooks path.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**? 
</CRITICAL_RULE> 

- [ ] Add `.githooks/pre-commit` to run:
  - JS/TS: `npm run format:check` and `npm run lint` if defined (per workspace).
  - Rust (if `src-tauri/` exists): `cargo fmt -- --check` and `cargo clippy -- -D warnings`.
  - LOC warning via `scripts/loc-check.sh` (threshold 350).
- [ ] Add `scripts/loc-check.sh` (warn only; exit 0).
- [ ] Add `scripts/ci/loc-enforce.js` (fail >350 unless commit has `[loc-bypass]` or `LOC_BYPASS=1`).
- [ ] Add `.github/workflows/ci.yml` with matrix: Node tests (electron-app), conditional Rust checks, LOC enforcement.
- [ ] Update `AGENTS.md` with `git config core.hooksPath .githooks` instruction and LOC policy.

### Acceptance Criteria
**Scenario: Local pre‑commit warns on large files**
GIVEN a contributor stages a file >350 LOC
WHEN committing locally
THEN the hook prints a clear warning with bypass instructions and still allows the commit.

**Scenario: CI enforces LOC unless bypassed**
GIVEN a push with a file >350 LOC
WHEN CI runs
THEN the LOC job fails with guidance, unless the latest commit message contains `[loc-bypass]` or the workflow sets `LOC_BYPASS=1`.

### Issues Encountered 
To be filled during implementation.

