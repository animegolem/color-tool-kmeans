# Wave05 preflight — canonical selection and pending-frame handoff

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.56 §§4–6,11. Focused pre-implementation review only; prior architecture rulings remain binding. Owner has authorized resumed correctness work; no further owner decision blocks this review.

## Base, documents and scope

Current candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01` at clean **41222c50001b7a02d516e7122b94f434ea073243**. Read wave04 verdict first. New canonical contentRevision is store-owned admission identity; it does not replace selection intent or per-request tokens. Current production source, not the old planning renderer, is the review target.

Read planning tickets AI-IMP-192-canonical-selection-epoch-for-probe-completion, AI-IMP-182-bind-cached-restore-to-frame-identity, AI-IMP-183-reacquire-pending-frame-across-views and the relevant Round01/02 identity rulings. Verify prerequisite historicalSWEEP01394399faca4280b430675d25446c3ecb5259ca4d6 andSWEEP0231546b79c6d75e5dfd6949ae8ce2763c06a8669c9 against ancestry/current behavior; do not assume present or copy them wholesale. Other historical patches may be cited only where directly necessary to explain a caller boundary.

## Required review result

1. Source-verify192's dispatched Values video-probe A -> bucket still B -> late A success/error counterexample through actual canonical caller/store paths. Inventory selection starts (still/video/bucket/replacement/removal/clear), legitimate same-intent settlement and view disposal, including Home/Values frame acquisitions. Identify exact authority loss now, not merely missing type names.
2. Propose the smallest coherent canonical selection-epoch boundary, with self-settlement distinguishable from a new selection. Same-ID return must not revive obsolete completion; new content revision must not be misused as selection epoch. Independent export/Batch authority must not be canceled by active-view selection. Return exact affected production and permanent test files, API/callers, issue ordering and compatibility risks before coding.
3. Reconcile182 with wave04's removal of the loose cached-preservation branch. Determine which original failure is removed, which regressions remain to prove, and whether any separate functionality is actually required. Do not reintroduce cached-result reuse on mutable-path extraction merely to implement old ticket prose. Frame content equality excludes transient decode/request tokens; stored-entry reuse and fresh extraction remain distinct.
4. Verify183's pending playhead versus settled pixels on Home->Values and reverse disposal/handoff, at debounce and active IPC boundaries. Identify prerequisite limits in current SWEEP023 adoption and a minimal requested/settled identity plus successor ownership design. Keep settled-only snapshots accurate and old-owner publication rejected. No full extraction unification or EPIC026 playback work.
5. Give issue-granular permanent regression plan, including both stale success/error and positive current completion/own settlement, pre-dispatch cancellation/unmount, cached-A->fresh-B, seek/step during restore, same-ID re-admission, and snapshot availability. Separate existing executable test evidence, source inference, and unrun mounted/native acceptance. Use real stores/controllers where possible; do not satisfy the plan with mocked stale booleans.

A bounded private in-memory/temp repro with installed dependencies is allowed if needed to resolve an actual ambiguity. Existing focused tests may run; do not repeat every full gate or create a new app build just for preflight. Return one actionable scope/ruling request promptly; do not restart the general audit, native registry design or numeric optimization review.

## Writes and fences

Write only `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/correctness-wave-05-review.md`, plus one newly named private temporary repro directory if necessary. No candidate/source/Git/build/app/browser edits or controls, commits, schema/dependency/lock changes, ticket/INDEX/record edits, capture/benchmark, owner notification or polling. Do not alter other worktrees, preserved profiling evidence, independent performance or live-playback lanes. Lead owns source verdict, ticket reconciliation and integration.

Send report path/hash to Review Lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 as soon as ready, then stop. Lead owes the exact next implementation fence; no owner question is pending. Gesture-aware scheduling remains separate lead work and must not enter this source scope.
