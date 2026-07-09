---
node_id: AI-IMP-165
tags:
  - IMP-LIST
  - Implementation
  - defects
  - ci
  - tooling
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-028-audit-remediation]]
confidence_score: 0.85
date_created: 2026-07-09
date_completed: 2026-07-09
---

# AI-IMP-165-repo-gates-repair

## Summary of Issue #1

Audit findings AUD-015/016 plus a lead-verified third defect (`RAG/AI-LOG/2026-07-09-LOG-AI-control-flow-and-defect-audit.md`): (1) `prettier.config.cjs` uses ESM `export default` — `npm run format:check` exits 2; on this machine it ALSO fails with `EACCES`/expansion on the untracked `tauri-app/.ffmpeg-build/` directory, so both the config and the ignore list need repair; (2) CI runs only 1 of 14 frontend test files and one Rust integration test — no full `npm test`/`check`/`lint`/`format:check`/`cargo test`; (3) the pre-commit hook prints `tauri-app -> no format:check script; skipping` even though `package.json:12` defines it — its script-detection logic is broken, which is why the broken Prettier config went unnoticed.

**Done state:** `npm run format:check` exits 0 from a clean tree; pre-commit demonstrably runs format+lint; CI runs the full suites; merged FIRST among the EPIC-028 tickets.

### Out of Scope

- Fixing formatting violations beyond what `prettier --write` produces mechanically (if the diff is large, report it and format only; do not hand-edit).
- CI release workflows (`release.yml`) and the Windows preview workflow.
- LOC-check policy changes.

### Design/Approach

- **Prettier config**: rename to `prettier.config.mjs` (keep ESM) or convert to `module.exports` in `.cjs` — pick whichever the installed prettier version documents; verify plugin resolution (`prettier-plugin-svelte`) still works. Add a `.prettierignore` covering `.ffmpeg-build/`, `src-tauri/target/`, `dist/`, and other generated/vendored trees so `--check .` is deterministic regardless of local build debris.
- **Pre-commit detection**: find why the hook reports "no format:check script" (likely a `grep`/`jq`-style script lookup or wrong cwd in `.githooks/pre-commit`); fix so `format:check` and `lint` actually run and fail the commit on error. Confirm by introducing a deliberate violation and watching the hook block.
- **CI**: extend `.github/workflows/ci.yml` to run `npm ci`, `npm run format:check`, `npm run lint`, `npm run check`, `npm test -- --run`, and full `cargo test --workspace` + `cargo clippy -- -D warnings` (keep the existing golden/snapshot steps). Mind Linux ffmpeg needs: cargo tests must not require the vendored sidecars — verify and, if any test does, gate it appropriately.
- If `prettier --check` now flags files, run `prettier --write` mechanically and commit separately from the config fix.

### Files to Touch

- `tauri-app/prettier.config.cjs` → `.mjs` (or CJS-ified), `tauri-app/.prettierignore` (new)
- `.githooks/pre-commit`
- `.github/workflows/ci.yml`
- Possibly broad mechanical `prettier --write` diff (separate commit)

**Do NOT touch:** application source except mechanical formatting; other tickets' files' *logic*; `src-tauri/src/bin/*` logic.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Prettier config loads (node smoke test) and `npm run format:check` exits 0 on a clean tree with `.prettierignore` in place.
- [x] Mechanical `prettier --write` diff (if any) committed separately and re-verified. *(Committed by lead — sandbox cannot commit.)*
- [x] Pre-commit hook runs format:check and lint (deliberate-violation experiment documented in Issues Encountered, then reverted).
- [x] CI workflow runs full frontend suites + full cargo test/clippy; job passes locally via `act` or by careful step-by-step shell replication (document which).
- [x] Full gates: `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, `cargo fmt/clippy/test`.

### Acceptance Criteria

**GIVEN** a clean checkout with hooks enabled.
**WHEN** a commit introduces a formatting violation.
**THEN** pre-commit blocks it, and CI would fail the same violation on push.
**AND** `npm run format:check` exits 0 on the clean tree.
**AND** CI executes all 14 frontend test files and the full Rust workspace suite.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- AUD-015 had no audit repro test to convert. Its positive regression invariant is executable: the Node smoke test imports `prettier.config.mjs`, confirms `prettier-plugin-svelte`, confirms the obsolete `.cjs` file is absent, and checks the required generated-tree ignores and CLI exclusions; `npm run format:check` then exercises the loaded configuration over the repository. Test count: 0 converted, 0 added.
- AUD-016 had no audit repro test to convert, and the strict Files-to-Touch list excludes adding a workflow test. Its positive regression invariant parses `ci.yml` as YAML and asserts the full frontend test/check/lint/format commands, full Rust workspace test/clippy commands, deterministic `npm ci`, and retained focused gamut/snapshot commands. Test count: 0 converted, 0 added.
- The lead-verified hook defect had no audit repro. Replacing the invalid jq lookup with an exact Node `package.json` script-key lookup made a clean hook run print and execute both `tauri-app -> npm run format:check` and `tauri-app -> npm run lint`. A deliberate spacing violation in `prettier.config.mjs` made the hook exit 1 at `format:check`; the violation was then reverted and the full clean hook exited 0.
- The repaired gate exposed 89 files with pre-existing Prettier violations. `npm run format` was applied mechanically with no application-logic edits; `src/lib/compute/image-loader.ts` required one second targeted Prettier write before the full check became stable. The mechanical diff is re-verified but intentionally remains uncommitted because this environment explicitly forbids commits; the corresponding checklist item remains unchecked for the lead to complete as a separate commit.
- The first permission-denied debris probe exposed a failed assumption in the ticket's proposed approach: installed Prettier 3.6.2 expands the explicit `.` argument before applying `.prettierignore`, so the ignore file alone still exited 2 on an unreadable `.ffmpeg-build` child. The necessary minimal boundary deviation is `tauri-app/package.json`: both formatting scripts now pass negative generated-directory globs during expansion, while `.prettierignore` remains the file-filter source. Repeating the same EACCES probe then passed with exit 0.
- CI was validated by careful step-by-step local shell replication, not `act`. The environment instruction prohibited `npm ci`, so the already-installed dependency tree was used; GitHub-only dependency/sidecar installation steps were inspected rather than rerun. The workflow YAML and required command invariants passed.
- Gate outcomes: `npm run test -- --run` passed 14 files and 166 tests; the retained focused gamut test passed 1/1; `npm run check` passed with 0 errors and the 2 known AUD-020 accessibility warnings; `npm run lint` passed; `npm run format:check` passed; `cargo fmt --all -- --check` passed; `cargo clippy --workspace -- -D warnings` passed; `cargo test --workspace` passed all workspace targets (41 tests total, 0 failures); the retained no-default-features k-means snapshot passed 1/1.
- A clean-hook validation used an isolated temporary Git index to prevent staging. The hook's index generator consequently omitted its tracked-file size section; `RAG/INDEX.md` was restored byte-for-byte and is not part of this ticket's diff.
