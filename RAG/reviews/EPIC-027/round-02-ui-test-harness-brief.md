# EPIC-027 Round 02 — focused test-harness compatibility addendum

Read the complete Round 01 verdict at:
`/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-027/round-01-ui-foundation-verdict.md`.

This is only V1/C1 compatibility work; C2–C6 are accepted with the verdict's clarifications. Do not repeat the whole UI review or reopen EPIC-029.

## Objective and source

Main source remains /Users/golem/git/color-tool-kmeans at 5baa20e; verify before relying on it. Planning carrier remains dirty at 2cc2000. Installed root Vite 7.3.1 / Svelte plugin 6.2.1 and nested Vitest Vite 5.4.21 are incompatible with the proposed direct-plugin config. The lead reproduced failure before SSR loading at hot-update.js:56.

Find and execute the smallest SSR component-test seam with the installed toolchain, without changing production or existing audit behavior. Show how the future FigureFrame/Showcase/FeedbackState specs will run under the real test command. Existing node_modules source is available; use source inspection before proposing package changes.

## Allowed work

- Read-only source/config/lock/package inspection and finite diagnostic commands.
- Create one task-specific temporary directory outside all repositories; place disposable configuration, small Svelte fixtures and diagnostics there. Use apply_patch for manual files. Keep Vite caches/output there, never under the main checkout. Do not alter installed packages.
- Run targeted compatibility probes against existing installed packages; close non-listening servers in finally blocks. If a listening local server is genuinely needed, first identify and report a free task-specific port, bind loopback only and stop it after the probe.
- Demonstrate actual SSR markup and zero render-time callback invocation through the selected test route. Record exact versions, commands, counts and failure cases. Verify the proposed filter/scope leaves .svelte.ts rune factories untouched or explicitly report any interaction.
- Sole durable repository write: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-027/round-02-ui-test-harness-review.md`.

Do not edit source, tickets, PROJECT-RECORD, INDEX, package/config files, prior reports or other worktrees; no dependency installs/upgrades, permanent tests, commits, Git mutation, heavy builds/full Rust gates or polling. Do not run the whole application suite merely to settle this focused probe. Do not patch plugin internals or synthesize missing Vite environment objects.

## Submission

Recommend one route with proof, precise proposed future file fence, tradeoffs and ordinary CI-command discoverability. Include failed alternatives, temp paths, any leftover resources, source cleanliness and tests not run. An isolated root-Vite-7 harness or a narrow test-only Svelte compiler transform are candidates, not predetermined answers. If neither is sensible, propose a separate tooling decision and stop; do not widen scope.

Preserve the first report and lead verdict. On submission stop, notify this review-lead task and await its explicit verdict. Nothing here authorizes foundation implementation.
