# IMP-193-4: visible replacement — bounded pre-implementation plan

Review Lead -> Sol / existing Code Lead, 2026-09-08. PROJECT-RECORD rev0.92. One ticket, one report-only submission. The owner approved the proposed restart contract and proceeding to the visible-test plan. This brief assigns technical preparation planning, not implementation or a launch.

## Binding owner ruling:193-4-D1

The owner accepts trusted packaged-local startup, one authority-bearing document per unique native child, and fail-stop/fresh-child recovery within the retained OS window after document reload/navigation, process loss, contradiction or ambiguous startup. Never renew authority in the same child. Native-owned work/data remain independent; ordinary image loading, repaint and Svelte view changes are not document replacement. Transient renderer input/focus preservation is to be tested, not promised.

This resolves the contract choice in193-3-D3/D4, not the evidence limits in193-3-D1/D2/D5. Complete process-replacement detection, startup liveness, ordinary pending command-response routing, other platforms and production integration remain unestablished. No new general C1-C3 review or hidden-harness refinement is requested.

## Ticket, sources and baseline

- Ticket: `RAG/AI-IMP/AI-IMP-193-4-visible-interface-replacement-acceptance.md`. Read PROJECT-RECORD §§2.2,5,6,7,12.3 and `imp-193-3-startup-authority-verdict.md` SHA256 `697cc31e2ba22700aa88da96202a515c0ecb69b9041a3bd234a5f07dc203d05b`.
- Planning root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan`.
- Read-only candidate: sibling `color-tool-kmeans-correctness-wave-01`, independently clean `6e12a73783c7119dae9b6add947e1b5085abe003`; root Cargo.lock SHA256 `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`. Main independently clean `5baa20e021855fbc57aebf48fa0f9b3374ded281`.
- Read-only frozen experimental baseline: sibling `color-tool-c1-retained-review-r3.iuWPrw`. Do not modify it or sibling `color-tool-c1-retained-window.PEEpxt`. Existing run-result `correctness-wave-07-c1-retained-window-run-01-result.md` SHA256 `7fce8facd661d0be5fd01c7ee682e85ab5f6c47131c3cc2ed534eeeae030ccdf` retains historical44 pure tests /198 rows /6 cases /43 receipts. Do not present those as new tests.
- Exact locked stack remains Tauri2.11.5 / runtime-wry2.11.4 / Wry0.55.1 on macOS. Retain the previously isolated public unstable child-WebView route; no private API, production feature enablement or framework migration.

## Lead-owned test shape

One small local editable interface, not a Color Tool redesign: a text field with selection, a local view toggle, a visible current-child identifier, a native-retained state indicator, and explicit replacement/recovery controls. Keep fixture data synthetic and offline. No owner files, media imports or app caches. Do not build a general test framework.

Plan a compact owner session with these six cases:

1. Initial appearance and ordinary typing/selection/Tab/shortcuts; distinguish application focus, window focus and first responder.
2. Ordinary local view interaction without document replacement; child identity must stay unchanged.
3. Explicit fresh-child replacement while typing or holding selection; same OS window, native-owned state retained, report actual input/focus/first-paint continuity or loss.
4. Reload or forced invalidation followed by fresh-child recovery, never renewal. Separate real navigation from simulated process loss; do not label simulated loss a crash-detector test. If an actual isolated process-loss test requires extra authority or an unavailable public hook, report it as deferred/untested.
5. Resize and move before/after replacement; record parent position/size, child bounds and visible coverage. Compare target values, not merely equality of old snapshots.
6. Relevant fullscreen/Spaces/minimize/restore and close behavior, explicitly separating cases the owner performs from automated observations. No system preference changes or manipulating unrelated windows.

The plan must state expected behavior, observable failure, evidence source and owner action for each case. Owner-only feel judgments stay unchecked until the owner actually uses the artifact. A failure or an untested platform case is an honest result; do not add retries or repeated source research to force acceptance.

## Required technical plan

Return one report with:

- Smallest adaptation from the frozen baseline, citing current source seams. Preserve the fixed pre-mint/report-before-bootstrap/context-poison/exact-original retry rules. Explain how the finite driver becomes an owner-controlled session without invalidating shutdown/trace boundaries.
- Proposed exact future file list and purpose, dependency/feature delta (prefer none beyond the already isolated experiment), fresh namespace requirements, and artifact/run-output naming. Review Lead will reserve the actual new root and approve exact paths later; do not create directories or take identifiers yourself.
- Scenario matrix above, what is instrumented versus visually observed, transient state policy for the test, and explicit residuals. Do not promise state restoration that is not implemented.
- Exact future preparation commands for syntax, pure regressions, fmt/check/clippy/build, locked/offline resolution and artifact hashes, as applicable. No build/test command is authorized now. Reuse validated machinery rather than reopening its settled protocol design.
- Bounded launch/quit plan: visibly identified experimental app/window, no app launch at startup, no automatic focus stealing/replacement loop, owner-triggered interactions, timeout/failure handling and explicit ordinary quit. Explain source/preparation review, separate binary launch gate, and owner verdict handoff.
- Corrections or blockers that actually affect this plan, with minimal source citations. Stop for new design authority rather than silently changing the contract.

## Current write fence

Only these two existing planning-tree paths may be authored:

1. Fresh `RAG/reviews/EPIC-029/imp-193-4-visible-replacement-plan.md`.
2. `RAG/AI-IMP/AI-IMP-193-4-visible-interface-replacement-acceptance.md`, validated evidence/Issues entries only. Do not change its status or check owner/runtime/preparation acceptance from a proposed plan.

All other files are read-only, including PROJECT-RECORD, epic, parent/other tickets, generated INDEX, prior reports/evidence, candidate/main, experimental source, manifests/locks and binaries. No source edits, builds, tests, installs, feature changes, App/Window/WebView launches, browser/desktop interaction, directory allocation, commit/merge/ref operation, cleanup, new task/subagent or polling. No implementation round follows automatically.

## Validation and handoff

Recheck candidate HEAD/status/root-lock hash and prior verdict/run-result hashes read-only. Check only your two allowed paths and preserve existing planning dirt. Run `git diff --check`; for new untracked report content also inspect `git diff --no-index --check /dev/null <report>`, distinguishing normal difference exit1 from whitespace diagnostics. This repo has no ticket-validator script; check legal frontmatter/status, preserved CRITICAL_RULE/Issues comments and unchanged acceptance checkboxes directly. Do not run the index generator; Review Lead owns it.

Return report path/SHA256, proposed file list, six-case matrix, exact future preparation/run gates, residuals and candid friction. Experimental planning is a report deliverable, not a fictitious code commit. Later assigned implementation retains the owner's per-IMP atomic-commit workflow where applicable. Send the report to Review Lead and stop without polling.
