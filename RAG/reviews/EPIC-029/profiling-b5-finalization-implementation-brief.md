# AI-IMP-202 B5 profiling-only Finish capture implementation

Review Lead -> Code Lead, 2026-09-05. PROJECT-RECORD rev 0.33 §10.12.

## Assignment

Implement the smallest operator finalization control against profiling-b4-finalization-verdict.md F1–F5. It must synchronously stop new observation, let existing actions reach honest terminals, serialize/drain every append, refuse sealing after any known renderer loss/persistence failure, and show a strictly validated native finalization receipt. This is an internal profiling tool, not the notebook redesign or a performance optimization.

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, branch codex/correctness-wave-01-2026-09-05, HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus53 accepted dirty paths. Preserve the pre-change identity using /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/attempt-02/source-hashes.before.sha256 and immutable accepted-dirty53-source.tar. Do not modify that archive, B2 bundle or any runtime/evidence directory.

Normative sources: AGENTS.md/CLAUDE.md, PROJECT-RECORD §§4/6/10.8/10.12, B1 V1–V7 and C1–C8/D1–D4 where applicable, and B4 verdict F1–F5. This brief supersedes the prior report-only source fence only for these exact files and validation.

## Exact files to touch

Production, existing unless marked new:

1. tauri-app/src/lib/bridges/profiling.ts
2. tauri-app/src/lib/profiling/trace.ts
3. tauri-app/src/lib/profiling/trace-types.ts — typed finalization state/dependency injection only
4. tauri-app/src/lib/components/ProfileCaptureControl.svelte — new
5. tauri-app/src/App.svelte — import/mount and minimal local integration only

Tests and test utility:

6. tauri-app/src/lib/bridges/profiling.spec.ts — new
7. tauri-app/src/lib/profiling/trace.spec.ts
8. tauri-app/src/lib/profiling/trace-dom.spec.ts
9. tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts
10. tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts
11. tauri-app/src/lib/profiling/trace-fixtures.ts — typed finalizer injection/queue-aware shared fixture only

Plus one new submission at /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b5-round-01-submission.md. The lead owns record/ticket/log/index and any later Git operations. Do not edit other files. Stop and report a genuinely required fenced change, not an opportunistic extraction. In particular all native/main/capability/core, Home/runner/coordinator, importer/A1, app.css, export fixtures, locks/config/dependencies and independent worktrees are fenced.

## Binding behavior

- Place admission gate before startDeliveredAction supersession/allocation/loss counters. Do not cancel or rewrite existing observations merely because Finish was pressed. Ordinary production supersession/unmount still reaches its existing terminal.
- Single-flight Finish: quiesce immediately; inspect open actions; if any are open, report their renderer count without sealing and allow explicit retry. Once terminal, wait for each action's actual serialized persistence; recheck all actions and sticky session failure/drop state after awaits, then call native. No timers/polling or fabricated terminal on timeout.
- Append batches retain event snapshots/timestamps/outcomes and monotonically assigned order. Actual append starts in that order, not concurrent fire-and-forget. Later queue completion never clears earlier failure. Preserve per-action getPersistence semantics; do not call a failed batch successful merely to advance the queue.
- Add exact tauriInvoke('profile_finalize', { req: { sessionId } }) wrapper and strict receipt parser. Same-session identity, nonnegative safe integer counters, positive native record/byte totals, boolean sealed, nullable bounded/allowlisted error code and coherent state are required. Treat thrown/unknown/malformed responses as fixed safe error codes, not success.
- Native pending is only unsealed + profiling-actions-open + positive open count. Other errors are terminal. Clean local seal requires sealed + open0 + error null + dropped0 + expected lastBatchSequence. Preserve native receipt on loss/unexpected sequence, while surfacing not-usable/continuity-unverified. Do not equate native sealing with complete renderer history or importer eligibility.
- Same-instance repeated success reuses its receipt without a new invoke; double clicks share a promise. Failed finish cannot reopen admission or auto-retry. Manual retry is only for honest renderer/native open-action pending; an unresolved append remains visibly in progress without blocking app navigation.
- Persistent App-header component, no DOM/status slot when disabled, one shared cached initialization. Use $state.raw where retaining class/immutable object identities matters; no new per-input work in ordinary disabled launches. Respect the established one-time bootstrap exception.
- Exact action/status wording and single-renderer-lifetime boundary are in F2–F4. Initial launch-enabled text does not claim actively recording after reload. No resume, sequence reset, renderer ownership inference, localStorage/sessionStorage marker or native status expansion. First acquisition will separately prove uninterrupted ownership; any replacement makes that run ineligible even if native returns a seal.
- Keep component styling local, compact and shrinkable. Preserve header navigation/library controls and ordinary disabled layout. No export/download action or guessed trace path.

## Required tests

Implement the B4 report matrix with deterministic promises/counters and actual collector/runner paths where feasible. Specifically cover:

- Disabled/rejected bootstrap has no control/finalize/timer and shares the cached status; compiled Svelte preserves intended identity and header mounting. Clearly label source/compiled tests versus later mounted browser proof.
- Empty collector; open debounce; native wait/late return; DOM tick/RAF; navigation/unmount; legitimate production input after Finish. Open observations stay pending or end with their existing truthful terminal.
- Serial append invocation with deferred first receipt, later terminal queue, and failure followed by a successful later append. Finish waits every known persistence and cannot clear sticky failure.
- Missing per-action persistence, unresolved append, collector session loss (including capacity sentinel/refusals), dropped/tainted append receipt; never invoke native finalize after known loss/failure.
- Double click, explicit renderer-pending retry, native-pending retry, cached sealed result and terminal errors. Gate before collector supersession so direct post-quiesce admission has no side effect.
- Native wire shape/session, unsafe/fractional counters, contradictory sealed/error/open states, dropped sealed receipt, unknown error code, invoke rejection and unexpected existing sequence. Sealed status must not imply eligible/correct measurement.
- Document and test the limit of a newly constructed collector: no same-session reload recovery or sequence rebasing; an existing native sequence must be continuity-unverified. Do not use a mock to pretend all renderer replacement is automatically detected.

Retain all old regressions. Await newly serialized persistence where old tests relied on immediate mock append calls; don't delete/skip/weaken assertions. B1 tests and Node producer→consumer checks rerun unchanged outside the fence.

## Validation

Use existing dependencies, no installs. From tauri-app:

    node --test scripts/profiling/*.test.mjs
    npm run test -- --run
    npm run check
    npm run lint
    npm run format:check

Format touched files with the installed Prettier only. From tauri-app/src-tauri:

    cargo fmt --all -- --check
    cargo clippy --workspace --offline -- -D warnings
    cargo test --workspace --offline
    cargo test -p color-core --no-default-features --test kmeans_snapshots --offline

Use Cargo for actual test discovery/execution; never execute guessed target/deps app binaries. Baseline is Node73, Vitest276/26 files, native68 plus one intentional emitter ignore explicitly exercised by Node, scalar1, static gates and two accepted Svelte warnings. Record actual new counts, don't assume them. Node20/Windows remain unrun unless actually available without setup; no platform claim.

No app build/package, launch/attach/UI control, profiling capture, source-map generation, injection, performance experiment, owner workload/media/preferences change or Git mutation. Normal test-generated artifacts are allowed only in their existing ignored/private temporary test locations. Preserve running B2 untouched.

## Submission and stop

One immutable report: exact files and per-file hashes, old/new test counts and verbatim gate outcomes, F1–F5/matrix mapping, source versus executed versus unrun evidence, narrow deviations/friction and unchanged-carrier receipt. Verify every accepted53 path outside the allowed existing changes against B2's hash list; list new files explicitly. Flag cohesive LOC growth without minification or automatic bypass.

Report whole-file SHA separately in the delivery message, not embedded in its own bytes. Leave source prepared/uncommitted. Send report to this lead and stop; no polling/watchers/owner bell or subsequent build/capture until reviewed.
