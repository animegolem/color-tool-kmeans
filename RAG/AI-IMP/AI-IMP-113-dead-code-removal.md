---
node_id: AI-IMP-113
tags:
  - IMP-LIST
  - Implementation
  - tech-debt
  - rust
  - cleanup
kanban_status: completed
depends_on: [AI-IMP-073]
parent_epic: [[AI-EPIC-022-media-pipeline-unification]]
confidence_score: 0.95
date_created: 2026-02-25
date_completed: 2026-02-25
---

# AI-IMP-113-dead-code-removal

## Summary
Delete deprecated `bench_runner.rs` (1,943 LOC) and `compute_cli.rs` (214 LOC). Remove the `bench-crate` feature and its associated dependencies from `Cargo.toml`. Clean stale binary references in `CLAUDE.md` (`rmpc_theme_gen`, `compute_cli`, `bench_runner`). IMP-073 deprecated these tools on 2026-01-19.

Done means: the two deprecated binaries are deleted, the bench-crate feature is gone, Cargo builds cleanly, and CLAUDE.md accurately reflects the remaining binaries.

### Out of Scope
- `kmeans_baseline.rs` (still useful, not deprecated).
- Refactoring any remaining CLI tools.

### Design/Approach
Straightforward deletion and cleanup. Remove the two binary source files, strip the `bench-crate` feature flag and any optional dependencies gated exclusively behind it (`kmeans_colors`, `palette`), and update documentation. Verify with `cargo clippy` and `cargo build`.

### Files to Touch
- `tauri-app/src-tauri/src/bin/bench_runner.rs`: delete
- `tauri-app/src-tauri/src/bin/compute_cli.rs`: delete
- `tauri-app/src-tauri/Cargo.toml`: remove bench-crate feature and exclusive deps
- `CLAUDE.md`: update bin/ section to remove stale references

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Delete `src-tauri/src/bin/bench_runner.rs`
- [x] Delete `src-tauri/src/bin/compute_cli.rs`
- [x] Remove `bench-crate` feature from `Cargo.toml` `[features]` table
- [x] Remove `kmeans_colors` and `palette` optional deps if only used by bench-crate
- [x] Remove `[[bin]]` entries for bench_runner and compute_cli in `Cargo.toml`
- [x] Update `CLAUDE.md` bin/ description to remove references to `rmpc_theme_gen`, `compute_cli`, `bench_runner`
- [x] Run `cargo fmt --all -- --check`
- [x] Run `cargo clippy --workspace -- -D warnings`
- [x] Run `cargo build`

### Acceptance Criteria

**Scenario: Clean build after deletion**
**GIVEN** bench_runner.rs and compute_cli.rs are deleted and Cargo.toml is updated.
**WHEN** `cargo build` is run.
**THEN** the build succeeds with no errors.
**AND** `cargo clippy --workspace -- -D warnings` passes with no warnings.

**Scenario: No stale references**
**GIVEN** the deletions are complete.
**WHEN** the codebase is searched for references to `bench_runner`, `compute_cli`, or `bench-crate`.
**THEN** no references remain in source files or documentation.

### Issues Encountered
<!-- Post-implementation notes go here -->
