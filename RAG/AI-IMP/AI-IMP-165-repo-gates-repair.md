---
node_id: AI-IMP-165
tags:
  - IMP-LIST
  - Implementation
  - defects
  - ci
  - tooling
kanban_status: in-progress
depends_on:
parent_epic: [[AI-EPIC-028-audit-remediation]]
confidence_score: 0.85
date_created: 2026-07-09
date_completed:
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

- [ ] Prettier config loads (node smoke test) and `npm run format:check` exits 0 on a clean tree with `.prettierignore` in place.
- [ ] Mechanical `prettier --write` diff (if any) committed separately and re-verified.
- [ ] Pre-commit hook runs format:check and lint (deliberate-violation experiment documented in Issues Encountered, then reverted).
- [ ] CI workflow runs full frontend suites + full cargo test/clippy; job passes locally via `act` or by careful step-by-step shell replication (document which).
- [ ] Full gates: `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, `cargo fmt/clippy/test`.

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
