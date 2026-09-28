# AI-IMP-202 B12 trusted-input ordering review

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev 0.41 §10.20.
**Focused Round 1: source diagnosis and isolated browser proof. No candidate implementation, native build or performance run.**

## Objective and source floor

Establish the real event-ordering failure behind B11, test the narrow capture-phase hypothesis, and return the smallest implementation/regression fence. This is not another general profiling audit.

PLAN: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan

CANDIDATE: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01

Expected HEAD 8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2; 57 prepared/uncommitted paths. Verify -uall status and all hashes in /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9/accepted-source-hashes.sha256 before and after.

Reserved private diagnostics root: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b12.wPLNxd. Root already exists; mode 0700. Use apply_patch for authored harness files. Keep private evidence files 0600.

Read AGENTS.md, CLAUDE.md, PROJECT-RECORD §§4/6/10.12/10.20 and the B11 submission/verdict. The preferred hypothesis is capture-phase observation, not a settled implementation ruling.

## Required bounded investigation

1. Verify installed Svelte numeric binding, delegated input, capture hookup and actual Home effect dependencies. Check paramsWithTarget before binding and disabled-profiling/error containment. Explain source facts separately from runtime proof.
2. Build a private, local-only diagnostic harness with existing installed Svelte/compiler/Vite dependencies. Mount the actual ParameterControls component with a real writable store and a real Svelte reactive effect mirroring the relevant Home scheduling boundary. Reuse actual coordinator/runner where feasible; explicitly identify every stub and copied boundary. Never manually call the effect/scheduler inside the observer and then claim browser ordering was proven.
3. Compare unchanged-source and capture-hook-only variants in the harness. Variant transformation must occur in memory or private copied fixture files, never CANDIDATE or node_modules. Record source digests and the exact variant delta.
4. Use documented computer-use controls on only the new private browser page. Ordinary select-all/delete/type 46 then 45 must retain delivered intermediate events, their isTrusted values, bound-store transitions, observer calls, and actual reactive-effect ordering in one renderer clock. Do not use dispatchEvent, DOM value assignment, evaluate-triggered clicks, or a synthetic-only EventTarget surrogate as trusted-input proof. Observation/export of the harness's own diagnostic state is allowed; do not inject into B10.
5. Exercise ordinary snap checkbox activation separately: its binding listens to change, observation to input. Include a keyboard-driven numeric range input to check the second numeric control shape without assuming pointer-scrub semantics. Retain actual ordering/failures, do not force expected logs.
6. Keep the current null/wire regression as such; propose a permanent regression that actually fails for the old hookup. If a synthetic regression cannot prove trusted-event ordering, label that limitation and retain the browser proof as a distinct acceptance gate.

A browser harness proves only that browser/fixture. Record browser/version, mounted boundary and native/backend stubs. It cannot replace a subsequent fresh Tauri/WebKit capture through native execution and chart completion.

## Allowed resources and strict fences

Allowed writes: new private B12 harness, compiler output, evidence/logs, and one PLAN/RAG/reviews/EPIC-029/profiling-b12-input-ordering-review.md. Existing dependencies may be read, not installed or modified. No new package/lock/config changes.

A new loopback-only server bound to 127.0.0.1 with an OS-selected free port and a new dedicated browser tab are allowed. Record the actual port/PID/URL; serve only the fixture and explicitly required source/dependency assets, not home/Desktop or unrestricted filesystem roots. No external assets/network, app preferences, broad media inventory or credentials. Stop only your own diagnostic server when complete; preserve its files.

Do not control, restart, replace, resume, or inject into the sealed B10 app/session. Preserve all B10/B11/B6/B7/B2/A0 source archives, bundles, manifests, logs and raw traces. No native executable/build, full suites, candidate source edit, production scheduling change, Git mutation, merge or release.

If the installed environment cannot support trusted browser proof within these tools/dependencies, report the exact missing capability and closest source evidence promptly; do not spend a sitting installing a testing platform or return another synthetic-only test as success.

## Submission and next gate

Return one report with: corrected causal claims and source citations; exact reproduction commands/files/browser controls; observed before/after event orders and isTrusted evidence; actual versus stubbed coverage; exact proposed Files-to-Touch and Do-NOT-touch list; runnable validation commands and a fresh native acceptance recipe; per-file hashes of immutable diagnostic artifacts; source57/status preservation; candid friction and unrun gates.

Exclude active log carriers from immutable-payload indexes; hash frozen snapshots separately. Preserve failures. Do not invent native/paint spans, subtract unrelated clocks or treat raf2 as proof of physical display.

Send report path and whole-file SHA to the existing Review Lead immediately. Stop at this review boundary, with no polling loop. Lead owns prompt implementation authorization and subsequent end-to-end acquisition work; the owner is waiting for the actual flame graph, not another status handoff.
