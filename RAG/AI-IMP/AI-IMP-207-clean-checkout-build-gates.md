---
node_id: AI-IMP-207
tags:
  - IMP-LIST
  - Implementation
  - CI
  - Epic-029
kanban_status: completed
depends_on:
  - AI-IMP-205
  - AI-IMP-206
parent_epic: [[AI-EPIC-029-control-flow-remediation]]
confidence_score: 0.98
date_created: 2026-10-17
date_completed: 2026-10-17
---

# AI-IMP-207 — clean-checkout build prerequisites and RNG lint

## Make the accepted F1 inputs reproducible from a checkout

Minted and integrated by Genga (review lead), 2026-10-17. Base: `8c076d6`.
The 2026-10-17 Genga fence is normative:
`interchange/genga-to-astra.color-tool-ci-fence-207.2026-10-17.md`.
Hosted run 38559892652 exposed an untracked root lock, absent WASM bindings
in Windows packaging, and the `chunks_exact_to_as_chunks` Clippy failure.
This repair tracks the accepted F1 lock, makes the renderer build own its WASM
prerequisite, and preserves PortableRng output while satisfying strict Clippy.

### Out of Scope

- Rust or npm dependency/version changes, lock re-resolution, CLI changes.
- F2/AI-IMP-208, profiling, runtime behavior, design and other worktrees.
- Commits, merges, pushes, releases, installs, or claiming hosted CI green.
- The reproduced Tauri/Store/Dialog mismatch: separately fenced as AI-IMP-201 B2.

### Design/Approach

- Track the exact F1 root lock, SHA-256
  `ed8b50c13f72f8ace2b15ffddff9c3a717dc2ba75e4ea72cb24fc02bd995bc51`.
- Run `wasm:build` before TypeScript/Vite in `build`; remove Playwright's
  duplicate invocation. Leave `dev` unchanged.
- Provision wasm32 and wasm-bindgen-cli 0.2.128 before Windows packaging.
  Browser CI already provisions both. Run real clean-build regressions in that
  provisioned browser job; ordinary hook regressions run the five light checks.
- Iterate fixed `[u8; 8]` chunks and decode them with the same little-endian
  conversion. No RNG algorithm or seed changes.
- Tests export indexed bytes into private temporary checkouts, excluding ignored
  locks and binding trees. Dependency packages are reused read-only with local
  cache directories. Real builds prove missing/restored lock behavior, cold
  binding generation, and warm-output failure when wasm-bindgen is absent.

### Files to Touch

- `.gitignore`: stop ignoring the root lock.
- `Cargo.lock`: exact accepted F1 bytes, no resolution changes.
- `tauri-app/package.json`: build prerequisite only.
- `tauri-app/playwright.config.ts`: remove duplicate prerequisite.
- `.github/workflows/ci.yml`: provision Windows inputs; run clean-build checks.
- `color-core/src/rng.rs`: fixed-size chunk iteration.
- `scripts/ci/wasm-build.test.mjs`: five light and three real-build regressions.
- `RAG/AI-IMP/AI-IMP-207-clean-checkout-build-gates.md`: this draft and evidence.

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [x] Track and hash-check the exact F1 lock; reproduce rejection without it and
      successful locked WASM compilation with it.
- [x] Make `build` own the prerequisite once; reproduce cold-build failure
      before and success after the fix.
- [x] Prove warm generated output cannot mask a missing binding tool.
- [x] Provision Windows before packaging; prove late/absent provisioning fails
      the ordering check and retain every aggregate gate.
- [x] Replace RNG chunks, reproduce strict Clippy red/green, retain the native
      SmallRng oracle and native/scalar/WASM parity controls.
- [x] Run frontend tests/types/lint/format/build and real Chromium coverage.
- [x] Receive independent lead review, ticket mint/index generation and commit.
- [x] Observe hosted aggregate success after the separately fenced B2 repair.
      Observed 2026-10-17 on GitHub at b4046ff, which carries this ticket's dc9b253 and
      B2's f61c81e (the head of the EPIC-029 pull request #5). Push run 39021031601 and
      pull_request run 39021045416 both succeeded with all six jobs green: build-windows
      on windows-latest; hook-regressions, frontend-quality, rust-quality, browser-e2e and
      the build-test aggregate on ubuntu-latest. ci.yml has no macOS job, so no macOS claim.

### Acceptance Criteria

**Scenario: A clean source checkout contains its inputs**  
**GIVEN** only indexed source bytes and installed build tools  
**WHEN** a locked WASM build is requested  
**THEN** the tracked F1 lock admits it without a lock rewrite  
**AND** removing that lock fails the otherwise identical command.

**Scenario: Warm output does not conceal a missing tool**  
**GIVEN** the actual package build command  
**WHEN** generated bindings are absent  
**THEN** it generates them before compiling the renderer  
**AND** a missing wasm-bindgen fails even when bindings already exist.

**Scenario: Correctness is unchanged**  
**GIVEN** the same seed and parity fixtures  
**WHEN** native, scalar and WASM compute run with fixed-size RNG chunks  
**THEN** the SmallRng oracle and exact PNG/JPEG digests remain unchanged.

### Issues Encountered

<!--
The comments under the 'Issues Encountered' heading are the only comments you MUST not remove
This section is filled out post work as you fill out the checklists.
You SHOULD document any issues encountered and resolved during the sprint.
You MUST document any failed implementations, blockers or missing tests.
-->

- Evidence root: `/tmp/color-tool-207.dXN9od/evidence/`. All red controls are
  retained separately from green replays. The first lock negative expected a
  particular Cargo diagnostic; offline resolution rejected the missing lock
  earlier. The corrected test compares the same command with/without the lock
  and demands a successful positive. No missing input was supplied silently.
- New checks: 8/8 green with real builds enabled. Ordinary hook/CI run: 79 pass,
  0 fail, 3 deliberately skipped real-build cases, all three separately passed.
- Frontend: 30 files / 252 tests; check 0 errors / 2 known AUD-020 warnings;
  lint, format and production build pass. Chromium: 6/6 pass, no retries.
- Rust: fmt, strict workspace Clippy, SmallRng oracle, workspace 55 tests,
  scalar snapshot and Tauri-free dependency boundary pass. Fixed native and
  WASM PNG/JPEG digests match the F1 record; scalar digest replay is retained.
- Native packaging STOP: `tauri build --debug --no-bundle` exits 1 for Rust/JS
  Tauri 2.12.3/2.9.1, Store 2.5.0/2.4.2, Dialog 2.8.2/2.6.0. No bypass or version
  edits. Genga received this and fenced B2 separately, after 207's commit.
- Local Node is explicitly 20.20.2. Rust lint/native tests use installed stable
  1.99.0; WASM uses installed default 1.90.0 with its wasm32 target. No toolchain
  install or default changes. Existing shared Cargo target cache was used for
  native validation; clean-source regressions have their own target directory.
- Canonical dependencies lacked Playwright. First browser command exited 127;
  replay reused the existing F1 1.64.0 packages read-only, without installation.
  Initial root-cwd Prettier could not resolve the Svelte plugin; rerunning from
  `tauri-app/` passed. Vite retains its known mixed-import warnings.
- Canonical main and Sol's F2 draft are unchanged by this work. The lead mints
  this draft and owns RAG generation; no unlisted INDEX edit was made. The new
  5,124-line Cargo.lock is generated dependency data, not a cohesive source-file
  refactoring request. Hosted Linux/Windows and owner acceptance remain unrun.
- Lead review (Genga): an independent verifier re-checked the hashes and the 8-path boundary. It ran the final regression
  file against baseline 8c076d6 (6 red, 2 green by design) and isolated tests 4 and 8 with two mutations. It then re-ran
  every gate in a fresh clone: vitest 252/252, Rust 55/55, CI 79 pass / 3 skipped, real builds 8/8, strict Clippy 0. The
  packaging STOP reproduced. Chromium was not re-run. Integration: main's untracked, ignored root lock (fc69255a) blocked
  `git apply`, so it was moved aside with a copy kept, never deleted. The applied index is byte-identical to the patch
  (432f5ec0).
- Hosted run (Genga, 2026-10-17): the box left open at the mint is checked. Both runs at b4046ff passed every job
  (push 39021031601, pull_request 39021045416). The implementer's line above, "Hosted Linux/Windows and owner
  acceptance remain unrun", is history for the hosted part; owner acceptance is still separate.
