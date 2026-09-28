# A1 Round 02 — AMEND: two residual safety edges

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev 0.24. **AMEND, narrowly scoped to R9–R10 below. No owner decision is needed.**

Submission SHA-256: bb87094baad34645595ae1c6864d6e9a6de06b8e5c1431da8b0b99c9c6536e25.
Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01, HEAD 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2.
All 16 authorized A1 files remain untracked; no tracked candidate changes. Lead froze this round at /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/a1-review-round02.GELvOM/profiling. Preserve both rounds and all raw/projection evidence.

## Verified corrections and gates

Lead independently reproduced:

- Node profiling: 52 passed, 0 failed.
- Vitest: 21 files, 222 tests passed.
- Svelte: 0 errors, 2 accepted existing AUD-020 warnings.
- Lint, formatting, Rust fmt and offline clippy: passed.
- Offline workspace Rust tests: 50 passed; scalar snapshot: 1 passed.
- Fourteen direct domain/grouping probes: quality 0–4 accepted and -1/5/fraction rejected; unavailable/unequal exact-frame claims rejected; empty/wrong-kind presentation evidence rejected; zero-measurement failure counted once; recursively permuted JSON keys preserve results.
- Real A0 projection: 31 attempts in four attempt groups, nine endpoint groups. Recomputed redacted JSON is byte-identical to both Round 02 summaries, SHA-256 2dd90b8c3790cdb3d9a5aee592bcdd55c8ae5c53bc95e26a6fc646ff0cb44013.
- Visible warm-process six-sample UI median 94.5 ms and log median 129 ms remain separate from hidden one-sample 95/132 ms; fresh-process target eligible count remains zero.

R1–R4 and R7–R8 are satisfied for this slice. Ordinary actual-byte growth/replacement tests and filename-shaped identifier fixes from R5–R6 pass. Two narrow residual cases remain; do not reopen settled numeric policy, grouping, schema design, or app instrumentation.

## R9 [P2] Reject pre-open nonregular replacement without hanging

private-files.mjs:67–70 opens with blocking O_RDONLY | O_NOFOLLOW after lstat. Replacing the checked regular file with a FIFO before open causes open to wait for a writer, so the descriptor-type validation never runs.

Both safety reviewer and lead independently reproduced this with a synthetic two-byte JSON file: interpose the initial lstat, replace that exact test-owned leaf with mkfifo after retaining its regular-file stat, then resume capture. The bounded child made no validation return and required SIGKILL at a 1500 ms timeout. All synthetic fixtures were removed. This requires concurrent type replacement, not metadata forgery; it is not a normal-file performance claim.

Use nonblocking descriptor admission on supported platforms before fstat verifies a regular file (or an equally bounded approach). Preserve leaf-symlink rejection, actual-byte limit, identity checks, existing stable error codes and finally-close behavior. Test deterministically in an isolated bounded child; do not let a regression hang the suite. Where FIFO creation is platform-specific, report an explicit platform skip and keep ordinary regular-file tests portable. No new dependency or app code.

## R10 [P2, exported API only] Complete nested summary redaction

summarize-runs.mjs:270/278 clones entire nested case and measurement objects; strata and count maps are also cloned. Starting with a valid generated summary, lead added synthetic private fields at groups[0].key.case.privateNote, groups[0].key.measurement.command and attemptGroups[0].key.strata.privateNote. All three survived redactRunSummary.

Strict run validation prevents these unknown fields through the current CLI. This is an exported reusable redactor contract defect, not an observed leak of owner data. The Round 02 claim that the redacted output uses explicit allowlists is incomplete.

Allowlist nested case, strata, measurement, availability-wrapper and enum-keyed count structures, or reject unknown nested fields before returning any output. Preserve namespace-bound IDs, semantic fields, values, sample order and byte-identical ordinary A0 output. Add direct exported-API regression vectors at the nested boundaries, including attempt and endpoint groups; top-level-only sentinel tests are insufficient. Do not add a general schema framework.

## Exact correction fence and delivery

Only these five existing untracked A1 files may change in this round, relative to the frozen Round 02 snapshot:

- tauri-app/scripts/profiling/private-files.mjs
- tauri-app/scripts/profiling/summarize-runs.mjs
- tauri-app/scripts/profiling/profiling-files.test.mjs
- tauri-app/scripts/profiling/profiling-summary.test.mjs
- tauri-app/scripts/profiling/README.md

Other eleven A1 files and all tracked app/core/configuration/dependency/lock/fixture files remain unchanged. No new helper files, installs, app control, builds, traces, Git mutations, IMP-178 integration or owner-workload changes. If a genuine cohesion/file-boundary conflict appears, report it rather than silently widening the fence. Do not minify to meet a line target; report any size exception for review.

Regression-test both counterexamples, then rerun all focused and full gates above. Local Node 26.8.1 was used by the lead; Node 20 remains unrun unless already available locally. Do not install it in this correction.

Recompute the existing Round 02 A0 summary in memory and prove its bytes/hash unchanged. No new media observations or duplicate normalized corpus is needed for these fixes. Any new diagnostic files must be private, additive and outside Git.

Write only the new report /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-a1-round-03-submission.md with per-R evidence, exact changed files/hashes, gate counts, platform caveats and candid friction. Notify the lead and stop at review, without polling. No commit, acceptance, merge, issue completion or B-stage instrumentation is implied.
