# Wave06 native delta verdict and phase022 assignment

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.63. Accept delta review `ad71a8ec91fc8cf590f611eb4cf1213e0cc630b5074fd9137c5832853465d9e2` as the bounded source/adoption basis, not implementation acceptance. Preserve the report unchanged.

## Review and remaining design boundary

Lead verified candidate clean at `933d888880ee5507aa0ce4ee2b81bcdc3756e3ff`, the report digest, all six historical positive git-cherry entries, current blind-prune call sites and full022 historical source diff. Current fixed Batch output, direct Values generation path, unchecked media bridges, core Path analysis delegation, extracted clipboard writer and both snapshot consumers were independently inspected. No new test count is claimed for this read-only review; the prior wave05 receipt remains historical baseline evidence.

Accept the proposed safety-first prerequisite order. Serialize issue submissions as **022 -> 019 -> 021 -> 027 -> 029 -> 030**, with a named clean tip and a separate lead assignment after each accepted issue. Adapt source behavior; do not import old parents, obsolete core modules or historical INDEX. Only022 is authorized now. Later019/030 dependency reconciliation must preserve per-issue provenance; no manifest/lock work in022.

C1-C3 in `round-02-verdict.md` remain binding. The post183 clipboard/controller/scrubber/snapshot scope correction is accepted as a future193 fence requirement, not permission to edit those paths now. A numbered193 implementation amendment will enumerate it when193 is actually authorized. No new general protocol review is needed.

F versus O and actual admission limits remain owner decisions. Recommendation remains recoverable fail-closed admission after reclaiming unowned artifacts, preserving every accepted owner/job. No quota, overflow allowance, cross-class eviction, retention-only policy R, or oversized-job behavior is selected here. This does not block the explicitly allowed prerequisite adaptations. Registry193 implementation still waits for the pressure ruling and reviewed prerequisites, then shared hooks remain193 ->185 ->184 ->186.

## Phase022 exact base and scope

Implement in the existing candidate `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, clean HEAD `933d888880ee5507aa0ce4ee2b81bcdc3756e3ff`. Stop if the source tip or unrelated worktree state differs. No Git mutation, app launch, build/package, runtime capture, install, or actual user-cache cleanup is assigned. Ordinary compile/test artifacts and isolated TempDir fixtures are permitted; never target live application roots or retained profiling evidence.

Normative issue: AI-IMP-180 adapted SWEEP-022, historical source `dd73c6ba370de1d14d527b85bfecda1387004ce2`. The later IMP-193 protocol remains separate. Exactly five candidate paths may change:

- `tauri-app/src-tauri/src/cache.rs`: name/document the existing pruning entry point as startup-only; preserve current retention values, managed-root rejection and explicit cleanup semantics. Add focused in-module retention controls if needed.
- `tauri-app/src-tauri/src/main.rs`: invoke that entry point only during existing setup, before exposing renderer-owned media; remove only the periodic media-prune thread. Preserve logging heartbeat, profiling/session setup and all command registration.
- `tauri-app/src-tauri/src/ffmpeg.rs`: remove frame/strip completion-time sibling pruning and its dead helper/imports. Preserve FFmpeg invocation, timestamp/result/error behavior and output naming; collision and worker fixes are later issues.
- `tauri-app/src-tauri/src/value_analysis.rs`: remove generation-time blind pruning only; preserve startup policy helpers, existing metadata/cache behavior and numeric results. In-module focused tests permitted.
- `tauri-app/src-tauri/tests/audit_value_cache.rs`: permanent regression proving a real new Values generation does not delete an unrelated prior artifact; retain existing AUD-005 coverage unchanged.

No source/dependency/config/test outside these five paths, ticket edits, generated INDEX edits, core math, other SWEEP work, ownership registry, new persistent setting, startup-policy change or release/commit. If a test or adapter needs another path, report it for a narrow amendment first. Lead owns the atomic issue commit and planning projections.

## Binding acceptance details

1. Prove the Values pruning failure before production edits with a real `generate_value_analysis` call and isolated fixture old enough to trigger existing age pruning (set fixture timestamps deterministically; no 30-day clock sleeps or huge allocations). Record the failing assertion, then prove the prior artifact bytes survive after the change and the new output is valid. Do not manufacture a failure by calling the startup pruner as if it were a session callback.
2. Positive controls must keep explicit startup retention effective and preserve unrelated/user paths. Exercise actual helpers for frame/strip counts and existing flat/Values age or size behavior as appropriate. Existing tests may supply unchanged controls; list which ones actually ran. Do not change quota values or weaken assertions to pass.
3. Check all production prune call sites and confirm no periodic, frame/strip completion or Values generation path still performs blind session-time pruning. A source/call-site inventory is useful supplemental evidence, not a mounted timer/FFmpeg lifetime test. Do not add a broad fake scheduler or claim elapsed-time proof from text matches.
4. This interim removes one unsafe deletion mechanism; it does not establish leases, cancellation, output immutability, safe explicit remove/clear, multi-process ownership or bounded session growth. Keep these limits in comments/report without claiming cleanup is now globally safe. Preserve existing persistent clipboard/snapshot restart behavior exactly; no blanket startup deletion.

## Gates and submission

Use installed dependencies. Run focused new/affected native tests, then from `tauri-app/src-tauri`: `cargo fmt --all -- --check`, `cargo clippy --workspace --offline -- -D warnings`, `cargo test --workspace --offline`, `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`, and `cargo tree -p color-core --offline --edges normal` (no Tauri in normal dependency tree). From `tauri-app`: `npm run test -- --run`, `npm run check`, `npm run lint`, `npm run format:check`, and `node --test scripts/profiling/*.test.mjs`. From root: `node --test scripts/svelte-event-guard.test.mjs` and `git diff --check`. Keep the two known AUD-020 warnings explicit. Use pipefail for any pipelines. No skipped/fails-marked regression or install to repair a gate.

Report exact base/status, five-path-or-smaller diff and SHA-256 manifest, source provenance, before-fix evidence, per-suite counts, command outcomes/toolchain, preserved behavior and candid friction. Do not relabel tests as owner/platform/mounted acceptance. Candidate changes stay uncommitted. Write only `RAG/reviews/EPIC-029/correctness-wave-06-phase-022-submission.md` in the planning carrier, send its path/hash to lead task `019f7c75-2b8b-7882-9df7-0cdc1e494671`, then stop without polling. No019 edits before the next exact-base assignment.
