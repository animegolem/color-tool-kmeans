# EPIC-027 Round 01 — Sol UI foundation review

Assignment: **review only**, prepared 2026-09-05 for the existing Code Lead task `01a06e5c-ac00-7761-884c-7ecca850de94`, using `gpt-5.6-sol` at the owner's request.

## Objective

Reconcile the refreshed UI foundation tickets against current source and return a pre-implementation review of **AI-IMP-168 → AI-IMP-169 → AI-IMP-195**. Determine whether their scope, proposed seams, tests and ordering are implementable without changing the active app. This is a new UI review, NOT EPIC-029 Round 03. Accepted EPIC-029 C1–C3 remain binding.

## Read first

- `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/PROJECT-RECORD.md`, rev 0.5, especially §4–7 and §9.
- `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/AI-EPIC/AI-EPIC-027-notebook-ui-redesign.md`.
- The three named tickets in `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/AI-IMP/`.
- `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/design-2026-09/README.md` and `coverage-and-waves.md`.
- Repository AGENTS.md and CLAUDE.md. The review-lead charter/pointers in the planning checkout do not transfer review authority to the Code Lead; your role is this bounded Code Lead review.
- Original ticket text is archived under `RAG/reviews/EPIC-027/legacy-2026-07-09/`; historical decorative requirements are superseded only as recorded in PROJECT-RECORD §9.

Source floor: `/Users/golem/git/color-tool-kmeans` main `5baa20e021855fbc57aebf48fa0f9b3374ded281`, freshly fetched and clean when prepared. Verify before relying on it. The documentation carrier at `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan` is deliberately dirty and still based on `2cc2000bce04ce2e6bda11a2853dd42595946980`. Do not pull, rebase, clean, reset, or switch either checkout.

## Review questions

1. Are 168's reference/token paths and 169's minimal primitives appropriate to the real Svelte structure? Fira is already vendored; do not treat old font-download instructions as work to redo.
2. Can scoped tokens, FigureFrame, native controls and DevStudyShowcase remain wholly dormant, without importing global CSS into the app or mounting a development route?
3. Can 195's pure visible-state contract describe provenance and only caller-supplied recovery actions, without owning jobs, timers, stores, caching or cancellation?
4. Are tests runnable under existing Vitest/Svelte constraints? Identify exact existing test patterns and any additional required file seam before changing ticket fences.
5. Is sequential 168 → 169 → 195 appropriate? Identify narrow blockers, useful simplifications, and specific downstream conflicts (196/197/199, shell and EPIC-029). Do not broaden this into an application-wide review.
6. What can be accepted mechanically, and which typography, copy, keyboard/reflow or other judgments still need the owner? Current prototype uses system serif; no asset or default approval should be inferred.
7. Propose the exact first implementation file list and validation plan, with one ticket per future lead-created commit, without implementing it.

## Authorized writes and prohibitions

**Only write:** `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-027/round-01-ui-foundation-review.md`.

Everything else is read-only. Do not edit assigned tickets, PROJECT-RECORD, INDEX, prior reports, source, dependencies, assets or other worktrees. No installation, Git mutation, commits, pushes, PRs or runtime app changes. No polling/watcher. Bounded read-only subagents are allowed if useful; consolidate their evidence into your one report.

Do not start coding after submitting. Wait for an explicit review-lead verdict and a bounded implementation assignment. The owner selected Sol; keep this task on Sol unless instructed otherwise.

## Submission format

Include:
- Assignment/round, exact inspected source revision and dirty planning-carrier distinction.
- Verdict: ready for bounded implementation, ready with numbered corrections, or blocked; this is your recommendation, not integration acceptance.
- Findings with file:line evidence, priority, proposed ticket/fence corrections and rationale.
- Proposed sequential file ownership and test plan for 168/169/195; no gratuitous component inventory.
- Downstream conflicts and owner decisions, separated from blockers for this dormant foundation.
- Files changed (the one report), read-only checks actually run, counts/outcomes, tests NOT run, deviations and candid friction notes.

Do not run expensive full application gates merely to review documentation. Future implementation gates remain PROJECT-RECORD §6: frontend test/check/lint/format and Rust fmt/clippy/workspace tests, plus applicable golden/snapshot/LOC/platform and real-interaction gates. Never claim those passed here unless actually executed on the named candidate.

Expected next step: review lead independently verifies the report, writes a numbered verdict and then issues a bounded implementation assignment. Nothing in this brief authorizes F1 coding.
