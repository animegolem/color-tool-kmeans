# A1 Round 01 — AMEND verdict and correction assignment

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev0.23. **AMEND: do not commit or accept A1 yet. Implement R1–R8 below; no owner decision is needed.**

Submission SHA-256 6aafc8af58a412ffab033bf3c6b0c667c214ddffe2c34b8f43063c84b4917f1f. Preserve submission and all A0/A1 raw evidence unchanged. Lead froze the eight submitted files at /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/a1-review-round01.dBPiKi/profiling; line references below refer to that snapshot.

Lead independently reproduced Node34/34, Vitest21files/222tests, Svelte0errors/2accepted warnings, lint/format, Rustfmt/clippy/workspace50tests and scalar1. Existing tests pass but do not cover the reproduced counterexamples below. Candidate existing files remain unchanged; eight untracked A1 files only. No integration or issue completion.

## R1 [P2] Represent the real quality domain

validate-manifest.mjs:450 and case schema require positive quality, rejecting quality=0. Live ParameterControls.svelte:54–55 allows0–4 and core has an explicit preset0. Lead probe of a valid case with quality0 returns INVALID_POSITIVE_NUMBER. Accept integers0–4; reject -1,5,fractions. Synchronize schema and tests using all five real presets. Do not alter the app's control/numeric policy.

## R2 [P1] Enforce frame and measurement evidence claims consistently

Case exact validation at433–437 accepts both timestamps unavailable because null===null. Run caseRef accepts exact with unequal requested/achieved timestamps. Reuse one frame-status rule in case and run: exact needs available equal timestamps; not-applicable still-image time must not be called exact by null equality (use the current unverified/not-applicable availability route or add an explicit frame-status not-applicable with coherent schema/tests). Timestamp equality is not automatically decoded-pixel equality.

validateMeasurement at602–624 independently checks method/evidenceLevel enums but does not connect them or require references. Lead changed a measured UI record to method=presented-observation/evidenceLevel=presented-evidence/evidenceRefs=[] and validation passed. Require a coherent method→evidence-level→referenced evidence-kind mapping, nonempty actual evidence for available measurements, and explicit unavailable behavior. UI/app-log evidence cannot be promoted to actual presentation; referenced metadata remains evidence, not automatic verification of its content. Keep the distinction between fresh-request proof and eligibility established in the earlier fix.

## R3 [P2] Count attempts without measurements

validateRunRecord accepts measurements=[] but summarizeRunRecords only updates outcome counts inside its measurement loop (summarize-runs.mjs:147–177). Lead probe retains inputAttemptCount=1 with groups=[], losing all role/outcome/exclusion accounting. Add endpoint-independent attempt accounting (grouped by build/case/operation/process/cache/workload/visibility), including zero-measurement failures and censored/unverified outcomes. Keep per-endpoint counts distinct so two endpoints do not become two attempts. Preserve all31 A0 attempts exactly once in the attempt-level totals.

## R4 [P2] Canonical semantic grouping and reference equality

stableKey at62–64 uses JSON.stringify; groupIdentity clones caller strata in insertion order. Reordering only the strata object's keys on equivalent records doubled nine groups to18. Similarly case-reference object ordering can produce a false MIXED_CASE_REFERENCE. Canonicalize known semantic structures (explicit ordered fields or recursive sorted plain JSON keys) for grouping/reference comparison; do not alter ordered attempts/raw samples. Test recursively permuted input property order, input-record order and genuinely different values. Use stable deterministic key ordering rather than locale-dependent collation where it affects serialized output.

## R5 [P2] Enforce bounded reads on bytes actually read

Read-only safety review reproduced a file growing after lstat: maxBytes2 accepted101bytes because readJsonFile at904–907 calls unrestricted readFile. Collector at37–47 likewise checks initial size then hashes unbounded EOF. Read/hash from the checked regular-file descriptor with a byte counter/fixed limit; reject growth beyond limits, replacement/type mismatch and invalid public maxBytes values without reading indefinitely. Hash only actual bounded file content and report changed input if identity/size changes during capture rather than silently certifying a moving build. Test deterministic concurrent growth and failure cleanup, not only static oversize files.

Do not turn the output policy into a blanket ban on ordinary ancestor symlinks: canonical /var→/private/var and a private external symlink target are allowed if resolved outside Git. Leaf input symlinks remain rejected; explicitly document ancestor resolution. Existing static private-mode/Git/outside/overwrite checks otherwise held in review. No requirement to defeat arbitrary hostile mutation of every ancestor by the account owner; keep claims bounded.

## R6 [P2] Make redaction safe for accepted caller identifiers

The current opaque regex permits a literal filename. Lead and safety reviewer reproduced id=private-source-name.mov surviving redactBuildManifest. Build/artifact/evidence/toolchain IDs and run group endpoint/clock/build/case identifiers are caller-controlled strings, not intrinsically sanitized.

Use deterministic opaque redacted identifiers (for example namespace-bound digests), or enforce genuinely opaque generated identifiers at the public boundary. Keep useful schema-defined enumerated labels, but do not echo arbitrary accepted caller strings as supposedly safe. Preserve local full records and document redacted join-key semantics. Tests must place a filename-shaped sentinel in EVERY caller-controlled string that could reach success stdout, summary or error output, not just notes/localPath. No regex-only pathname scrubbing.

## R7. Strengthen schema/domain checks and bounded summary implementation

Top-level key agreement test (profiling-tools.test.mjs:299ff) does not exercise nested wire contracts. Cover nested emitted build/case/run shapes, enum/type/availability constraints and representative rejected vectors, maintaining schema/runtime agreement for structural constraints; runtime may add documented cross-field rules. No new validation dependency or general schema framework required.

Correct exact commit validation from40–64 arbitrary hex digits to supported full40 or64 lengths. UUID claims that are available must have the actual UUID format; unavailable remains explicit, not UUID-A masquerading as valid. Replace Math.min/max(...largeValues) with bounded reduction so accepted merged limits cannot throw on argument count. Keep count/limit and nonfinite guards across public APIs.

## R8. Approved structural seams; no automatic LOC bypass

The 1015-line validator combines record domains, shared validation, filesystem safety and CLI; tests combine fixtures, domains, statistics and filesystem operations. Those are independently reviewable boundaries, not a request to split just to hit a number. In addition to the original eight files, authorize exactly these new files under tauri-app/scripts/profiling/:
- validation-primitives.mjs
- validate-build.mjs
- validate-case.mjs
- validate-run.mjs
- private-files.mjs
- profiling-fixtures.mjs
- profiling-files.test.mjs
- profiling-summary.test.mjs

Keep validate-manifest.mjs as the public validator facade/CLI, preserving import contracts. Put record tests in existing profiling-tools.test.mjs, test-only shared synthetic fixtures in profiling-fixtures.mjs, filesystem tests and summary tests in the two named test modules. No additional helpers, framework, dependency or production imports. Do not duplicate validation constants/rules across record validators. Actual cohesion and test quality matter; report remaining large files rather than adding padding or suppressing checks.

## Assignment, gates and report

Continue in /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01 at HEAD8bf3187 with the existing uncommitted A1 changes; do not reset them. All previous no-app-control/no-build/no-config/dependency/no-Git/no-IMP178 fences remain. Existing candidate files outside the16 authorized A1 files must remain untouched. Lead owns record/tickets/index and any later commit.

Regression-test each reproduced counterexample first, implement the fixes, then run node --test scripts/profiling/*.test.mjs and all original A1/full renderer/native/scalar gates. Node20 is still unrun unless an existing local runtime is found; do not install/download. No false claim that ordinary Vitest discovers these tests.

Regenerate the normalized A0 projection and summaries into a NEW private directory. Preserve older projections; verify all31 attempts, requested/achieved mismatch, visible6 statistics94.5/129, hidden trial1 separately, zero valid fresh-process targets and honest transcription evidence. Aggregate attempt counts must not be derived by summing duplicate endpoint counts.

Write /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-a1-round-02-submission.md with per-R fix/test evidence, exact boundaries, gate counts, normalized output paths/hashes and candid friction. No ticket completion, commit, app trace or routine acknowledgment. Notify lead and stop at review.

