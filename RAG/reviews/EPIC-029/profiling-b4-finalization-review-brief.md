# AI-IMP-202 B4 operator finalization boundary review

Review Lead -> Code Lead, 2026-09-05. PROJECT-RECORD rev 0.32 §10.11.

## Outcome and authority

Return one source-grounded report establishing the smallest safe way for an operator to finish a real profiling session and obtain its native seal. This is a focused missing-control review, not another general audit or implementation round. Lead retains product/architecture rulings.

Accepted B1 registers native profile_finalize, but the current renderer bridge exposes status/append only. Do not claim that a registered native API is an available operator control. B3 off-path smoke is now accepted except resize; it did not exercise tracing.

## Exact carrier and read scope

Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, branch codex/correctness-wave-01-2026-09-05, HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2. Preserve all 53 accepted source paths against /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/attempt-02/source-hashes.before.sha256.

Read CLAUDE.md, PROJECT-RECORD §§4/6/10, B1 V1–V7 and C1–C8/D1–D4 verdicts as needed for the finalization contract. Source scope is renderer lib/bridges/profiling.ts; lib/profiling/trace*.ts; lib/views/home/profiling* and their actual HomeView/DevBanner/App integration; native src/profiling*.rs and main.rs; existing profiling tests/importer and local Tauri capabilities. Follow only directly necessary callers.

## Lead constraints to test against source

Preferred scope is a small accessible profiling-only session status and explicit **Finish capture** action, hidden when profiling is disabled. It is an internal measurement control, not the notebook redesign or an always-visible app feature. Identify the smallest current mounted host; do not choose a broader settings/export architecture or implement a UI.

Finishing must stop new observer admission without changing production analysis/cancellation/cache authority, account honestly for open renderer actions and late native work, wait for actual renderer batch persistence, then request the native seal. A rendered result is not a persistence receipt. A pending/failed seal is not success. No fabricated completion or forgotten action, session loss or rejected write may become a clean eligible trace.

Report precisely:

1. Native request/receipt shape and existing finalization state machine, with file/line citations; what pending, failure, retry and already-sealed mean.
2. Renderer action lifecycle, pending batch ownership and asynchronous ordering. Can the current collector be quiesced/drained without new APIs? What narrow additions are necessary, if any? Distinguish source facts from proposed changes.
3. Minimal exact files to touch and test matrix for the preferred control, covering active debounce/native/DOM work, late response, write rejection, double click/retry, navigation/unmount and disabled behavior. Do not widen the numeric/core/file policy surface.
4. Whether an eligible first capture requires a new reviewed source/build identity. Preserve B2 immutable regardless; no patching its bundle or injecting JavaScript/Apple events/devtools/LLDB.
5. Any concrete blocker to an operator-visible honest final status and receipt, plus the smallest decision needed from the lead. Do not ask the owner to make source-mechanics choices.

## Fences, validation and delivery

Allowed write: only /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b4-finalization-boundary-review.md, created with apply_patch. Include exact source identity, citations, minimal touch set, tests proposed versus executed, issues encountered and SHA-256 of the finished report.

Read-only source/hash/Git-status inspection is allowed. No tests/builds requiring new generated artifacts are needed; no app/control/runtime/preference/media changes, source/config/dependency/lock/test edits, installs, Git mutations, benchmarks, tracing, process changes or other worktree changes. Do not execute guessed target/deps binaries. Keep retained B2 PID67432 untouched; this assignment is not a resize workaround.

Preserve A0/B2 and all submitted evidence. No ticket/record/index edits or delegated design decisions. Return the one report to this lead and stop; no polling, watcher or owner bell for ordinary completion. Implementation follows only a separate bounded verdict.
