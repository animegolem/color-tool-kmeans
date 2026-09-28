---
node_id: AI-IMP-201
tags:
  - IMP-LIST
  - Implementation
  - build
kanban_status: in-progress
depends_on:
  - AI-IMP-179
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.9
date_created: 2026-09-05
date_completed:
---

# AI-IMP-201-reproducible-native-build

## Produce a reproducible current native candidate

Current-main packaging rejects resolved Rust Tauri/plugin versions versus the locked JavaScript packages. The root Cargo.lock is ignored, permitting native resolution drift. The owner explicitly authorizes a new build and hands-on testing; PROJECT-RECORD §5–6 governs. This issue is separate from SWEEP adoption.

### Out of Scope

Broad upgrades, redesign, math changes, mismatch-check bypass, replacing the installed app, release/notarization, other worktrees and platform claims without execution.

### Design/Approach

Binding amendment B1 (before packaging): Sol's diagnosis and independently read official CLI changelog show custom-protocol is not required in Tauri 2. Remove the lead's provisional feature/minor-cap edits before building. Keep the minimum four-file repair: .gitignore, Cargo.lock, package.json and package-lock.json. Tracking the resolved native graph supplies exact versions; optional all-family minor caps, CLI upgrade and Store patch upgrade are not necessary to clear the demonstrated mismatch and are deferred. The earlier proposal below is retained as history, superseded where it mentions Cargo.toml/features.

Lead-owned bounded repair on cf4c344. Preserve the candidate's already-tested Rust resolution (Tauri 2.11.5, dialog 2.7.3; main had 2.7.2) by tracking its root lock. Align JS API to 2.11.1 and dialog to 2.7.3, versions verified directly in the npm registry. Restrict the corresponding Rust minor ranges; keep other dependencies unchanged. Use npm 10 for lock regeneration and private candidate installation only. Add the conventional custom-protocol feature needed for a self-contained packaged app, explicitly enabled in the debug package command. Check actual feature behavior against Sol's read-only diagnosis. No ignored-version check.

### Files to Touch

- .gitignore — stop ignoring root Cargo.lock.
- Cargo.lock — retain the resolved workspace graph; machine-generated lock changes only.
- tauri-app/src-tauri/Cargo.toml — provisional changes removed under B1; no resulting diff authorized.
- tauri-app/package.json and package-lock.json — two named JS version alignments only, npm-10 compatible.
- This ticket and a lead build/acceptance report; generated INDEX through its script. Lead owns PROJECT-RECORD/epic synchronization separately.

Do NOT touch app/source behavior, fixtures, bundler security config, other dependency versions deliberately, installed application or other worktrees. Any additional prerequisite requires an explicit numbered lead amendment with evidence before editing.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Align the two version pairs and preserve reproducible lockfiles.
- [x] Run frontend/native/static/scalar gates after alignment.
- [x] Package a self-contained macOS app without bypassing checks and record identity/hash.
- [x] Launch that exact app and record bounded native workflow evidence and remaining gaps.

### Acceptance Criteria

GIVEN the reviewed candidate and tracked lockfiles, WHEN the documented locked packaging command runs, THEN version checks pass and the exact resulting app launches without a dev server. Native interaction observations are recorded separately from unit-test counts and owner/release acceptance. Main and the installed app remain intact.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove.
Document failed approaches, blockers, deviations, and missing tests.
-->

Initial current-main build stopped on Tauri 2.11.5/API 2.9.1 and dialog 2.7.2/JS 2.6.0. The candidate's ignored lock instead resolves dialog 2.7.3, concrete evidence of drift. No bypass or broad upgrade was performed. Sol's separate read-only diagnosis and the later lead build report retain exact evidence. Node 20, Windows/Linux and owner testing remain unexecuted.

Local engineering acceptance: fresh-build-runtime-acceptance.md records successful locked packaging, 209 frontend / 50 native / 1 scalar tests, applicable static gates, exact app/lock hashes, native two-image Colors/Values selection, unpinned Batch, and a visually checked composite PNG. Status stays in-progress pending integration; full native regression and owner/release acceptance remain separate. Four-file B1 scope held; optional feature/cap edits were removed before building.
