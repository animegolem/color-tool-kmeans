# AI-IMP-202 B13 capture-phase input implementation

Review Lead -> existing Code Lead, 2026-09-06. PROJECT-RECORD rev 0.42 §10.21.
**Implement now under B12 verdict R1-R5. No further general review round. Source/test gates only.**

## Worktree and baseline

CANDIDATE: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01

PLAN: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan

Branch codex/correctness-wave-01-2026-09-05; HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2; 57 prepared paths.
Before editing, verify all57 against sibling color-tool-profile-b10.h6bbb9/accepted-source-hashes.sha256 and exact -uall status against its b11-capture-01.1X95GF/source-status.after.txt.

Read AGENTS.md, CLAUDE.md, PROJECT-RECORD §§4/6/10.12/10.20/10.21, B12 report and profiling-b12-input-ordering-verdict.md. The verdict corrects report overclaims and native recipe; it is binding.

## Exact authored source fence

1. tauri-app/src/lib/views/home/ParameterControls.svelte — only six existing profiling oninput -> oninputcapture attribute changes.
2. tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts — accurate surrogate labeling, old literal-source assertion update, compiler regression per R3.

One new report: PLAN/RAG/reviews/EPIC-029/profiling-b13-input-capture-implementation-submission.md.

No other authored files. Lead owns record/ticket/log/index. Preserve the other55 baseline files byte-for-byte, and retain exact57-path status set. Do not rewrite accepted earlier work already in these two files.

Fenced: HomeView, coordinator, runner/debounce/dedup, trace collector/config/DOM/types, stores/bridges/native/math/video/cache/export, dependencies/locks/configs, B12 fixtures/evidence, all B10/B11/B6/B7/B2/A0 artifacts/runtime and independent worktrees. No new dependencies, installs, packaging, app/browser control, performance experiments, Git mutation/commit, cleanup, merge or release.

## Required tests

Use existing installed compiler; no new test platform. Assert all six direct input hooks have capture=true and precede the SAME element's value/checked binding, cover clusters(range+number), quality, ignoreTopN, mergeThreshold and snapToReal, preserve six value/three checked binding counts, and exclude input from delegated tail without suppressing pointer delegation.

Run the same assertion against an in-memory old-hook transformation and require rejection. Keep the existing null/conversion/native-transport-stub test passing but name/comment its synthetic-order limitation accurately. Do not replace it with skipped/failing tests or describe compiler output as browser execution.

## Validation

From candidate tauri-app:

    npm run test -- --run src/lib/views/__tests__/profiling-svelte.spec.ts
    node --test scripts/profiling/*.test.mjs
    npm run test -- --run
    npm run check
    npm run lint
    npm run format:check

From candidate tauri-app/src-tauri:

    cargo fmt --all -- --check
    cargo clippy --workspace --offline -- -D warnings
    cargo test --workspace --offline
    cargo test -p color-core --no-default-features --test kmeans_snapshots --offline

Format only the two touched files. Run focus first, then all gates. Last accepted baseline: Node82, Vitest334/27 files, native72 plus intentional ignored emitter explicitly exercised by Node, scalar1; two existing Svelte warnings accepted. Report actual counts, not expected counts. Cargo test artifacts are allowed; do not execute guessed native target/deps binaries. Preserve logs for failures and final runs; use pipefail with pipes.

## Delivery and next gate

Submit exact two-file patch summary, before/after hashes,55 preserved hash results/exact57 status, red-old/green-new contract proof, test counts/exits and candid friction/unrun gates. Flag LOC issues without gratuitous splits. Hash the whole report in the delivery message; do not embed its self-hash.

Send immediately to the existing Review Lead and stop for source acceptance. Do not silently launch/build B14 or treat this as native/performance acceptance. Lead will then assign the fresh build/control capture with honest superseded intermediates. The owner is waiting for the real end-to-end flame graph; no owner decision is presently required.
