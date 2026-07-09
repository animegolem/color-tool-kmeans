---
node_id: AI-IMP-162
tags:
  - IMP-LIST
  - Implementation
  - defects
  - video
  - stores
kanban_status: completed
depends_on:
parent_epic: [[AI-EPIC-028-audit-remediation]]
confidence_score: 0.7
date_created: 2026-07-09
date_completed: 2026-07-09
---

# AI-IMP-162-video-identity-and-values-races

## Summary of Issue #1

Audit findings AUD-001, 002, 004, 005, 007, 008, 009, 010 (`RAG/AI-LOG/2026-07-09-LOG-AI-control-flow-and-defect-audit.md` — read the full finding text before starting): frame/analysis identity in the Values view and the shared image store does not survive video switches, same-entry frame replacement, same-second file replacement, or concurrent decodes; strip metadata and stuck strip-pending states degrade Home; store dedup strands datasets. IMP-158 fixed this race class in Home only.

**Done state:** all eight findings fixed; their expected-failure repros in `src/lib/views/__tests__/audit-control-flow-races.spec.ts` and `src-tauri/tests/audit_value_cache.rs` are converted to passing positive regression tests; full gates green.

### Out of Scope

- Full Home/Values extraction unification (deferred IMP-124 — do not restructure, just fix).
- AUD-003/006 (IMP-163 owns those; do not touch `analysis-runner.svelte.ts` cancellation paths or `removeFile`).
- Any UI/visual change.

### Design/Approach

Per finding, the minimal-correct mechanism (adapt if the code suggests better; record deviations):

- **AUD-001**: bump/invalidate `decodeToken` (or capture path/name at request time) in `syncFromVideoState` so a completed extraction is attributed to the video it was requested for.
- **AUD-002**: add a request-generation or selected-path guard to the Values probe path so an older probe cannot overwrite newer `videoState`.
- **AUD-004**: `setFile()` replacing an existing entry must invalidate `valueAnalysisByKey` (and any error/state keyed on the entry).
- **AUD-005** (Rust): the freshness key must be strong enough that same-length content replaced within a coarse-mtime interval is detected. Acceptable: nanosecond mtime where the platform provides it, a content fingerprint (hash of file bytes or a sampled prefix), or a generation-unique source path. File length alone (or length + whole-second mtime) is NOT an acceptable fix. (Work-order review 2026-07-09.)
- **AUD-007**: make the frame output path unique per request (e.g. include a generation/timestamp in the filename) OR serialize decodes per frameId so a stale ffmpeg write can never land under an accepted path; clean up superseded files.
- **AUD-008**: cached-video activation restores `stripPath`/`stripId` alongside duration/fps/time/poster.
- **AUD-009**: strip-mode subscription must react to changes made while Home is unmounted (drop the skip-first-value trick or seed it with the current value), and `regenerateStrip()`'s pending-flag lifecycle must let the replacement request run (clear or transfer `videoStripPending` correctly).
- **AUD-010**: deduplicate by path BEFORE registering datasets/preview resources in `appendFile()`/`setFile()`, or release the resources on rejection.

Each fix flips its repro; rewrite that repro in place as a positive regression test (keep the file and AUD-ID reference in the test name).

### Files to Touch

- `tauri-app/src/lib/views/values/video-scrubber.svelte.ts` (AUD-001)
- `tauri-app/src/lib/views/values/file-ingestion-values.svelte.ts` (AUD-002, 008)
- `tauri-app/src/lib/stores/image.ts` (AUD-004, 010 — `setFile`/`appendFile` only; leave `removeFile` to IMP-163)
- `tauri-app/src/lib/stores/value-analysis.ts` (AUD-004 invalidation helper, if needed)
- `tauri-app/src-tauri/src/value_analysis.rs` (AUD-005)
- `tauri-app/src/lib/views/home/video-controller.svelte.ts` (AUD-007, 009)
- `tauri-app/src-tauri/src/commands.rs` (AUD-007, only if the unique-output approach needs the command to accept/return the generated name)
- `tauri-app/src/lib/views/HomeView.svelte` (AUD-009 subscription, minimal)
- `tauri-app/src/lib/views/__tests__/audit-control-flow-races.spec.ts`, `tauri-app/src-tauri/tests/audit_value_cache.rs` (repro → regression conversions)

**Do NOT touch:** `analysis-runner.svelte.ts`, `value-analysis-runner.svelte.ts` cancellation logic, `removeFile`/`switchToFile` (IMP-163); exports/batch code (IMP-164); CI/hooks (IMP-165); `src-tauri/src/bin/*`.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] AUD-001 fixed; repro converted to regression test.
- [x] AUD-002 fixed; repro converted.
- [x] AUD-004 fixed; repro converted.
- [x] AUD-005 fixed; Rust expected-panic repro converted to a passing freshness test.
- [x] AUD-007 fixed; add a regression test (unique path per request or serialized decode) — no repro existed.
- [x] AUD-008 fixed; repro converted.
- [x] AUD-009 fixed; repro converted; verify strip-mode change from Settings regenerates on Home remount.
- [x] AUD-010 fixed; repro converted; object-URL release verified.
- [x] Full gates: `npm run test -- --run`, `npm run check`, `npm run lint`, `cargo fmt --all -- --check`, `cargo clippy --workspace -- -D warnings`, `cargo test --workspace`.

### Acceptance Criteria

**Scenario:** Switching videos in Values mid-extraction.
**GIVEN** video A's frame extraction is in flight.
**WHEN** the user switches to video B before it resolves.
**THEN** A's frame is never stored or analyzed under B's identity, and B's probe result is never overwritten by A's slower probe.

**Scenario:** Scrubbing the same video entry.
**GIVEN** Values analysis is cached for frame at t=1.
**WHEN** the entry's frame is replaced at t=2 (including within the same wall-clock second).
**THEN** Values recomputes; no stale analysis or stale disk-cache hit is served, and no concurrent decode overwrites the accepted frame file.

**AND** all converted regression tests pass; zero expected-failure encodings remain **for this ticket's findings (AUD-001/002/004/005/007/008/009/010)**. The shared spec file also contains IMP-163's repros (AUD-003/006) — leave those untouched; they are converted by IMP-163 in parallel. (Work-order review 2026-07-09.)

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- **AUD-007 mechanism:** serialized Home decodes per logical frame ID, preserving the stable output path without allowing concurrent FFmpeg writers. This avoided changing `commands.rs` or adding superseded cache files.
- **Test harness surprise:** the audit controller repros' former `it.fails` wrappers were satisfied by Svelte's `rune_outside_svelte` guard before reaching their assertions. The converted test file now installs test-local `$state`/`$derived` shims so the positive controller regressions exercise the actual race behavior.
- **Formatting gate friction:** the repository's known AUD-015 `prettier.config.cjs` syntax defect prevented normal Prettier loading. Scoped frontend files were formatted with Prettier's `--config /dev/null` plus the repository's Svelte plugin, single-quote, semicolon, and ES5 trailing-comma options; the config itself remains untouched for IMP-165.
- **Boundary note:** `VideoState` does not type `stripId`, and its store module was outside this ticket's Files-to-Touch list. Values restores `stripId` in the runtime state through a structurally compatible local object, with a regression assertion covering the metadata.
- `npm run check` passed with the two pre-existing AUD-020 accessibility warnings in `VideoPanel.svelte` and `ValuesView.svelte`; no new warnings were introduced.
