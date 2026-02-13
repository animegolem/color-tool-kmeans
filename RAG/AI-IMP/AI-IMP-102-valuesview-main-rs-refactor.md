---
node_id: AI-IMP-102
tags:
  - IMP-LIST
  - Implementation
  - Refactor
kanban_status: completed
depends_on: []
parent_epic:
confidence_score: 0.95
date_created: 2026-02-13
date_completed: 2026-02-13
---

# AI-IMP-102-valuesview-main-rs-refactor

## ValuesView Component Extraction, Dead Code Removal, and main.rs Split

Post-IMP-101 LOC reduction pass targeting three hotspots: ValuesView.svelte (770 LOC), dead `value_study` code across frontend and backend, and monolithic `main.rs` (917 LOC).

**Outcomes:**
1. ValuesView orchestration logic extracted into `value-analysis-runner.svelte.ts` factory module, matching the HomeView `create*()` pattern.
2. All `value_study` dead code removed (frontend bridges, exports, Rust module, Tauri command).
3. `main.rs` split into 5 focused modules: `main.rs` (setup), `commands.rs`, `commands_types.rs`, `merge.rs`, `cache.rs`.

### Out of Scope
- Extracting presentation helpers from ValuesView (bucket/label utilities, histogram computation)
- Splitting `color.rs`, `kmeans.rs`, `value_analysis.rs`, or `ffmpeg.rs`
- `bench_runner.rs` (test code, excluded by convention)

### Design/Approach
- **Phase 1** follows the established `create*()` factory pattern from `views/home/*.svelte.ts`. Store subscriptions, lifecycle, and analysis orchestration move to a reactive factory; derived computations and presentation stay in the component.
- **Phase 2** is a straight deletion confirmed by full codebase trace — no imports reference `value-study.ts` or `value_study` from the frontend.
- **Phase 3** splits by concern: DTOs, command handlers, merge algorithm, and cache/logging each get their own module. Binary-crate `mod` declarations keep these out of `lib.rs`.

### Files to Touch
`tauri-app/src/lib/views/values/value-analysis-runner.svelte.ts`: new factory module
`tauri-app/src/lib/views/ValuesView.svelte`: import runner, remove extracted logic
`tauri-app/src/lib/bridges/value-study.ts`: delete
`tauri-app/src/lib/exports/value-study.ts`: delete
`tauri-app/src-tauri/src/value_study.rs`: delete
`tauri-app/src-tauri/src/lib.rs`: remove `pub mod value_study`
`tauri-app/src-tauri/src/main.rs`: reduce to setup + registration + tests
`tauri-app/src-tauri/src/commands.rs`: new — command handlers
`tauri-app/src-tauri/src/commands_types.rs`: new — request/response DTOs
`tauri-app/src-tauri/src/merge.rs`: new — cluster merge algorithm
`tauri-app/src-tauri/src/cache.rs`: new — event log + cache pruning
`CLAUDE.md`: update architecture docs

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Create `views/values/` directory and `value-analysis-runner.svelte.ts` with `createValueAnalysisRunner()` factory
- [x] Refactor `ValuesView.svelte` to consume the runner; remove extracted state, subscriptions, effects, `ensureValueAnalysis`, `updateLevels`
- [x] Delete `bridges/value-study.ts`
- [x] Delete `exports/value-study.ts`
- [x] Delete `src-tauri/src/value_study.rs`
- [x] Remove `pub mod value_study` from `lib.rs`
- [x] Remove `ValueStudyRequest`, `ValueStudyResponse`, `value_study` command handler, and invoke registration from `main.rs`
- [x] Extract `commands_types.rs` — all request/response DTOs and default value functions
- [x] Extract `merge.rs` — `RawCluster`, `MergeCluster`, `merge_clusters_by_threshold`, `centroid_distance`
- [x] Extract `cache.rs` — `EventLog`, `build_log_path`, `prune_event_logs`, `prune_video_cache`
- [x] Extract `commands.rs` — all `#[tauri::command]` handler implementations
- [x] Reduce `main.rs` to setup, `mod` declarations, invoke handler, and integration tests
- [x] Update `CLAUDE.md` — new module docs, remove legacy bridge/tech debt notes
- [x] `cargo build` passes
- [x] `cargo clippy --workspace -- -D warnings` clean
- [x] `cargo fmt --all -- --check` clean
- [x] `svelte-check` passes (0 errors)
- [x] `npm run build` passes

### Acceptance Criteria

**Scenario:** Rust backend compiles after value_study removal and main.rs split
**GIVEN** the refactored backend modules.
**WHEN** `cargo build` and `cargo clippy --workspace -- -D warnings` are run.
**THEN** both pass with zero errors and zero warnings.

**Scenario:** Frontend builds after ValuesView extraction and dead code removal
**GIVEN** the refactored ValuesView and deleted bridge/export files.
**WHEN** `svelte-check` and `npm run build` are run.
**THEN** both pass with zero errors.

**Scenario:** Values analysis flow is unchanged
**GIVEN** the app is running with refactored code.
**WHEN** a user uploads an image on the Values view.
**THEN** analysis runs, preview pair renders, histogram/range/buckets display correctly.
**AND** switching levels triggers re-analysis with correct results.

### Issues Encountered
None. All phases completed without blockers. Pre-existing ESLint/Prettier permission error on `.ffmpeg-build/` directory is unrelated to this work.
