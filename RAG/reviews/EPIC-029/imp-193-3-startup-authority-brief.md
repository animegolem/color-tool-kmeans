# EPIC-029 sprint: IMP-193-3 startup-authority decision

Review Lead -> Sol / existing Code Lead, 2026-09-08. PROJECT-RECORD rev0.90. Owner approved proceeding with the proposed sprint. **Only IMP-193-3 is assigned now: one focused read-only source decision and report.** IMP-193-4 is the conditional next stage;193-5 remains backlog. No new general C1–C3 review, implementation or runtime authority.

## Ticket and baseline

Read `RAG/AI-IMP/AI-IMP-193-3-renderer-startup-authority-decision.md`, PROJECT-RECORD §§2.2,5,6,7,12.3 and the current epic map.

Planning root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan`.

Read-only candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, independently clean **6e12a73783c7119dae9b6add947e1b5085abe003**; root Cargo.lock **05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734**. Native metadata kernel is accepted; production unstable/session integration is absent.

Read-only experimental source: sibling `color-tool-c1-retained-window.PEEpxt`, frozen Round03 source in sibling `color-tool-c1-retained-review-r3.iuWPrw`. Locked tauri2.11.5/runtime-wry2.11.4/Wry0.55.1; verify these from the actual lock and installed source, not another cached version.

Reuse `correctness-wave-07-c1-retained-window-run-01-result.md` (SHA256 **7fce8facd661d0be5fd01c7ee682e85ab5f6c47131c3cc2ed534eeeae030ccdf**), its linked preparation and source-feasibility records. Result is44 pure tests plus one actual hidden run:198rows/6cases/43receipts/exit0. Same native parent across seven children and exact resize were observed. No initial about:blank/contradictory document was observed; pending ordinary command-response delivery and visible UX are untested.

## Focused question and required analysis

Can this application's actual trusted-local initialization path establish that the native-pre-minted child authority is used only by its intended local document, or does an unresolved initial-document ordering premise still prevent adoption?

1. State the exact supported claim and threat/lifecycle model. Distinguish a real ordering counterexample with our actual initialization/IPC code from a hypothetical renderer arbitrarily fabricating every diagnostic field. Neither matching href/nonce nor calling them untrusted settles that question by itself. Do not silently strengthen or weaken the accepted C1 invariant.
2. Trace the exact locked child construction, initialization script execution scope (including initial empty document/main-frame/subframe behavior where relevant), navigation/PageLoad callbacks and actual bootstrap/receipt command path. Identify which facts source guarantees, which are only observed and which remain unknown. Cite concrete file/version/symbol/lines.
3. Check the present fixed initialization script: it captures original href/nonce and submits document-start before bootstrap; H25 observes contradictions and preserves poison. Determine what this genuinely excludes and what it does not. Do not assume the old renewing challenge/eval adapter and new nonrenewable per-child mechanism have identical counterexamples. Preserve known-session versus unacknowledged-original distinctions and exact-original idempotence.
4. If a counterexample remains, give the smallest feasible event sequence and the assumption it requires. If the actual code excludes it, explain the exclusion without claiming native frame authentication that the API does not provide. Do not infer universal proof from the finite run.
5. Recommend **go**, **constrained go**, or **no-go**, with a short claim/assumption/evidence table and product consequences. A constrained go must identify the proposed invariant/feature contract change for Review Lead/owner approval, not quietly adopt it. If unsupported, state that once and present at most two bounded alternatives; do not initiate more harness refinements.
6. Specify whether193-4 visible test preparation is meaningful next and what its narrow prerequisite/fence would be. Do not design193-5 production implementation or assign it.

## Authority and file fence

Allowed writes only:

- Planning `RAG/reviews/EPIC-029/imp-193-3-startup-authority-decision.md` (fresh report; do not overwrite prior reviews).
- Planning `RAG/AI-IMP/AI-IMP-193-3-renderer-startup-authority-decision.md`: validated evidence/checklist entries and Issues Encountered only. Leave the Review Lead decision item unchecked.

All source, prior reports, binaries, ledgers, main/candidate refs, manifests/locks, application/runtime state, epic/PROJECT-RECORD, other tickets and generated INDEX are read-only. No code/tests/build/installation, binary/App/WebView launch, feature/private-API enablement, cleanup, commit, merge, task creation or polling. Existing read-only local source and relevant primary-source documentation may be inspected. No new subagent or broad audit is needed for this one seam. Additional scope requires a report before action.

The owner's atomic-per-IMP implementation-commit workflow remains the default for future coding assignments. This ticket's deliverable is a decision report; do not manufacture a code commit or take over the planning branch to mimic implementation.

## Validation and handoff

Recheck candidate HEAD/status/root lock and exact cited source versions. Confirm the allowed two-path delta and preserve prior hashes. Run `git diff --check` in planning; report any limitation of that check for new untracked report content. No application gates need rerunning for read-only research. Do not claim new test counts from old evidence.

Return report path/SHA256, the recommendation, smallest unresolved assumption or source-supported exclusion, exact citations and candid friction. This is one focused submission, not an open-ended research loop. Send it to Review Lead and stop without polling; Review Lead owns the ruling and any193-4 preparation assignment. Owner approval to start the sprint does not approve production adoption or an unreviewed visible launch.
