# EPIC-029 correctness wave 03 — implementation authorized

Review Lead to existing Code Lead Sol, 2026-09-05. Owner approved moving ahead after the fresh-build smoke. One sitting, two existing SWEEP issues under partial AI-IMP-180: video reset and settled-frame capture. Design and acceptance stay with the lead.

## Authority, reviewed basis and carrier

- Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
- Branch: codex/correctness-wave-01-2026-09-05.
- Required initial HEAD: 58880e0feb8baee754230be9d28acb8a683147ef, clean when checked. Preserve all five accepted local issue commits.
- Remote main rechecked at 5baa20e021855fbc57aebf48fa0f9b3374ded281. No fetch/rebase/ref movement by the implementer.
- Planning carrier: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan
- Read candidate AGENTS.md and CLAUDE.md; planning PROJECT-RECORD rev 0.15 sections 4–8; AI-IMP-180, sweep-adoption-manifest.md and prior Round 01/02 verdicts. Read IMP-182/183 as residual boundaries, not assigned implementation.
- The general pre-implementation review is already accepted. Lead independently re-read both exact historical patches and current callers before this assignment: resetVideoState leaves two cached-restore fields intact; Values captures runner.file.path with scrubber.currentTime and marks extracting only after debounce. No new general review round is requested. Verify this basis before edits and stop/report any materially different diagnosis or necessary fence expansion.
- Prior waves and IMP-201 are accepted locally only. Fresh bundle at this base is open for owner use. Do not rebuild, close, replace, or interact with that running app during this coding sitting.
- Reuse private installed dependencies, locked native graph and existing sidecars. No npm install/ci, lock/config edits, provisioning or cleanup. No commits/staging by any delegated agent.

## Issue order and binding scope

### 1. SWEEP-003 — reset cached seek ownership

Adapt source a09c834d0d2ac990bbed210ebbf206a3057ca665. On complete video reset, clear both _restoringFromSessionCache and _pendingSeekTime, so cached A's deferred seek/restoration mode cannot affect fresh B. Keep normal exact cached restore behavior intact.

Reproduce the historical cached-A-to-fresh-B failure, then prove the reset and a positive cached-restore control. Include direct reset/repeated reset coverage if useful. Do not expand this into exact-content cache validation: stepping during restoration and binding result reuse to source/frame/settings belong to IMP-182 after IMP-181/192. Preserve those known residuals in the report rather than claiming global cache correctness.

### 2. SWEEP-008 — snapshot settled frames

Adapt source 0857489c2f658c795c29df7f51aa2ba217cf7b65. Mark extraction pending synchronously when scheduling, covering the debounce interval. Derive one snapshot request from the settled ImageEntry path/name/frameTimestamp; both disabled state and capture handler consume that request. Never pair the old path with a newer playhead. Reset pending state on destruction without allowing stale completion to clear a newer request.

W3-1: strengthen the historical single happy-path regression within the same spec. Cover debounce, active extraction, coalesced seeks/stale completion, current-request rejection, path switch/destruction, and pure eligibility (null/missing path/timestamp, timestamp zero). Assert all three snapshot fields come from the same settled entry, even when the requested time differs. Use deferred promises/fake timers and restore rune descriptors after each test.

W3-2: this adoption does not establish a new timestamp convention or repair cross-view pending intent. Preserve existing frameTimestamp production semantics; do not relabel the bridge's timestampUsed string as a newly proven exact decoded-frame timestamp. IMP-183 owns successor reacquisition and related identity integration. On decode error, do not fabricate a new settled frame. Any previously settled capture must retain its own timestamp. No new automatic recovery UX.

No image/collection routing, removal policy, active-study preference or new UI control. Preserve Wave-01 Values disposal/listener changes when editing ValuesView. No full-file checkout from the later sweep tip.

## Exact source fence

Only these five paths in the candidate:

1. tauri-app/src/lib/views/home/video-controller.svelte.ts — reset fields only.
2. tauri-app/src/lib/views/home/video-controller-cache-reset.spec.ts — new focused regressions.
3. tauri-app/src/lib/views/ValuesView.svelte — settled snapshot import/derived request, capture and disabled wiring only; no unrelated markup/style/subscriptions.
4. tauri-app/src/lib/views/values/video-scrubber.svelte.ts — settled request helper and pending lifecycle only.
5. tauri-app/src/lib/views/values/video-scrubber-snapshot.spec.ts — new focused regressions.

All other files are fenced, especially HomeView, stores, native code, color-core, fixtures, package/config/lock files, main, design assets, IMP-178 and EPIC-026 worktrees, prior review reports and generated INDEX. Lead owns all ticket/log/record updates. Do not reserve new IDs. At most two disjoint writers if useful; you own self-review and one coherent submission. No destructive Git operations or cleanup.

## Validation

Run focused tests after each issue. Demonstrate the load-bearing regressions fail against the unchanged pre-fix behavior, then pass after the fix, without reverting user changes or using skips/it.fails. State exact before/after commands/counts and distinguish a true behavioral failure from a missing-import/harness error. If a negative control is unsafe, report it unexecuted rather than fabricating proof.

From tauri-app, run:

```text
npm run test -- --run src/lib/views/home/video-controller-cache-reset.spec.ts src/lib/views/values/video-scrubber-snapshot.spec.ts src/lib/views/__tests__/audit-control-flow-races.spec.ts src/lib/views/__tests__/audit-resource-integrity.spec.ts
npm run test -- --run
npm run check
npm run lint
npm run format:check
```

From tauri-app/src-tauri, run sequentially:

```text
cargo fmt --all -- --check
cargo clippy --workspace --locked --offline -- -D warnings
cargo test --workspace --locked --offline
cargo test -p color-core --no-default-features --test kmeans_snapshots --locked --offline
```

Run git diff --check and exact file-boundary checks. Baseline: 209 frontend / 50 native / 1 scalar tests, check zero errors and two known warnings. Do not force those counts; report actual added tests and outcomes. Use pipefail if piping; retain genuine failures. No fixture regeneration, generalized rune harness, package changes or new build. No validate-tickets.sh exists here. Native interaction/repackaging is the lead's next gate after source acceptance; Node 20/platform/owner acceptance stays open unless actually run.

## Submission and stop

Write only this new planning report: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/correctness-wave-03-submission.md.

Include base/head/branch and actual uncommitted state; per-issue source SHA → modified paths mapping; independent staging guidance for one issue commit each; negative/positive regression evidence; exact full/focused counts and verbatim gate outcomes; runtime/toolchain, W3-1/2 results, residuals, failures/recovery and candid friction notes. Proposed subjects carry SWEEP-003 or SWEEP-008 plus AI-IMP-180.

Notify Review Lead task 019f7c75-2b8b-7882-9df7-0cdc1e494671 with the report path and stop. No next wave, poll loop, merge, PR, release or design work. Lead independently reviews and creates the two commits.
