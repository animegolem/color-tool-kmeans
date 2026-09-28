# AI-IMP-202 B18 bounded renderer-duration implementation

Review Lead -> existing Code Lead, 2026-09-06. PROJECT-RECORD rev0.47 §10.26.
**Implementation authorized now: exactly two candidate files, full gates, new offline diagnostic evidence.**

Read profiling-b17-numerical-verdict.md and profiling-b17-duration-coherence-review.md. Apply the verdict's binding policy, including stronger endpoint/boundary tests. No further general review round.

## Source and files

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, branch codex/correctness-wave-01-2026-09-05, HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2, accepted57 source baseline /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/accepted-source-hashes.sha256. Verify exact -uall status and baseline before work; preserve the other55 hashes afterward.

Only candidate authored edits (apply_patch):
- tauri-app/scripts/profiling/trace-integrity.mjs
- tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs

Keep helpers private where possible and test real production behavior. Preserve unique endpoint requirements and returned evidence.values. Do not export a generic epsilon utility or add dependencies. Explain constants/domain/zero behavior near implementation. Cohesive local extraction within the named file is allowed; no broad refactor.

Do NOT touch renderer/app/native code, schemas, fixtures outside the named test, trace-wire, trace-to-run, import-trace-run, Cargo/package manifests or locks, collection hooks, scheduling, numeric analysis, B14/B15/B16/B17 evidence, baseline inventories, or Git. No app build/launch/controller/restart, new media or benchmarking. Test/compiler build outputs from the gates below are allowed; no packaged application execution.

## Gates

From tauri-app:
- node --test scripts/profiling/profiling-trace-integrity.test.mjs
- node --test scripts/profiling/*.test.mjs
- npm run test -- --run
- npm run check
- npm run lint
- npm run format:check

From tauri-app/src-tauri:
- cargo fmt --all -- --check
- cargo clippy --workspace --offline -- -D warnings
- cargo test --workspace --offline

Retain true counts and exit statuses, same2 known Svelte warnings explicitly. No installs or lock generation. Use pipefail for captured pipelines. Flag LOC/cohesion honestly; no minification to satisfy counts.

## New evidence and delivery

Private root /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b18.LVNlpB, already0700. After focused/full gates, run repaired parser/organizer/inspector on the untouched B16 raw trace /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/b16-continuation.bynwZo/native-trace.raw.before-colors.jsonl (41843bytes/SHA1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652). New receipt must record source/tool file hashes, policy version/domain, all8 outcomes and four completed comparisons, and unchanged before/after raw digest. This is numerical reinspection, not acquisition binding or performance acceptance. Do not fabricate run-manifest binding merely to turn a diagnostic import green.

Return one report /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b18-duration-coherence-submission.md with full source hashes, exact boundaries/status, regressions/counts, verbatim gate results, immutable evidence index, any friction and explicit missing gates. Preserve B16/B17 historical verdicts. Send report path and whole-file SHA immediately to Review Lead; no owner wait/polling loop. Lead will review this tool-only repair and advance to acquisition without rebuilding the unchanged app.

