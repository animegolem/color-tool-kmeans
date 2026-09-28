# AI-IMP-202 B17 duration roundtrip/coherence review

Review Lead -> existing Code Lead, 2026-09-06. PROJECT-RECORD rev0.46 §10.25.
**Focused pre-implementation numerical-boundary review; no app/build/candidate repair.**

## Task and source floor

Review profiling-b16-native-verdict.md and the B16 submission against current candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, branch codex/correctness-wave-01-2026-09-05/HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus accepted57 paths. Baseline hash list: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/accepted-source-hashes.sha256. Verify it and exact -uall status before/after.

Preserve B16 raw /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/b16-continuation.bynwZo/native-trace.raw.before-colors.jsonl,41843bytes/SHA1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652. B14 app remains sealed; no app/controller operations.

Private diagnostics root /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b17.pwNu01, already0700. One report: PLAN/RAG/reviews/EPIC-029/profiling-b17-duration-coherence-review.md. Read AGENTS.md/CLAUDE.md and record §§4/6/10.3/10.25. No general audit or feature work.

## Required bounded review

1. Reproduce current inspector failures for sequences3/8 from unchanged B16 bytes. Follow renderer clock/event/measurement creation, IPC serialization, Rust serde_json parse/write and Node parsing. Determine which numerical operations are observed versus inferred. Lead confirmed cleanProfileDuration does not round and the build's serde_json invocations lack float_roundtrip; do not simply assume that feature is the answer.
2. Exercise a minimal JS -> installed Rust JSON -> JS decimal roundtrip for the retained values. A private standalone Rust probe using the already-installed exact dependency version/cache is allowed, with all temporary source/lock/target outputs only under B17; no dependency install/network or candidate/native executable. Name the probe explicitly and invoke through Cargo rather than executing guessed target/deps binaries. Inspect installed library source as needed.
3. Propose one narrow renderer-duration coherence rule, with a reasoned error bound, units and finite/nonnegative/range limits. Consider rounding in both timestamps and separately transported deltas. Do not choose a broad percent tolerance, arbitrary visible-ms allowance, or unbounded clock-magnitude tolerance that accepts meaningful forged deltas for huge timestamps. Exact integer identities/native ns/sequence/seal and unrelated config equality remain strict.
4. Demonstrate the proposed predicate in a private/in-memory diagnostic against all completed B16 actions, with raw bytes unchanged. Also show exact values/zero, adjacent representable perturbations, timestamp cancellation, missing/negative/nonfinite values, large values, and differences clearly outside the justified bound fail or remain honestly unverified as appropriate. Include zero/nonzero boundary behavior explicitly.
5. Trace how import-trace-run and trace-to-run consume recomputed versus recorded measurements; settle the authoritative reported value and compatibility behavior for both v1/v2 without rewriting historical artifacts or silently upgrading old failed reports. Preserve all other coherence checks and error priorities.
6. Return exact Files-to-Touch/Do-NOT-touch list and regression/gate plan. Prefer importer/inspector-only repair if supported; native/renderer changes require explicit rationale and lead ruling, not implementation in this pass.

## Fences and delivery

Allowed authored writes only private B17 probes/evidence and one report (apply_patch). No candidate source/schema/config/lock/dependency changes, full suites, app build/launch/control, new material, trace repair, Git mutation, benchmark or performance claims. B17 probe compilation is the sole narrow exception to no-build; it is not a shipped app.

Retain commands/results/digests and actual numeric deltas, immutable before/after raw digest, source57/status preservation, honest failures and missing coverage. Never label a private predicate diagnostic as current importer acceptance. No mutation of B14/B15/B16 evidence or active app.

Send report path and whole-file SHA immediately to lead. Do not wait for owner or start a polling loop. Lead will promptly rule on the exact comparison/test repair and then move toward bound end-to-end acquisition; this is not another native rebuild assignment.
