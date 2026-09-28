# AI-IMP-202 B8 invalid-input persistence repair: focused Round 1

Review Lead -> existing Code Lead, 2026-09-06. PROJECT-RECORD rev0.36 §10.15.
Read profiling-b7-control-proof-verdict.md first. This is an ACTIVE bounded repair assignment; no owner question or idle waiting is required.

## Objective and current authority

Reproduce the empty-number-input pre-IPC failure with exact current dependencies; settle the smallest honest persistable unavailable-config wire arm and exact implementation touch set. Also distinguish why a valid replacement may be production-deduped before profiling attaches. Return one source-cited repair proposal and executable regression recipe. Do not resweep the app or repeat B4/B5 architecture review.

Round1 is source/in-memory/test-harness diagnosis, not production implementation. A schema change spans native validation and the importer, so the lead must settle its exact semantics and file fence before coding. This review gate needs the lead, not the owner.

Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
Branch codex/correctness-wave-01-2026-09-05; HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus56 prepared paths.
Plan: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan
Baseline hashes: sibling color-tool-profile-b6.fnWyNO/attempt-01/source-hashes.after.sha256.
Immutable source archive: color-tool-profile-b6.fnWyNO/accepted-b5-dirty56-source.tar, SHA2566ef4ad8b22384f3a4735fac981def4f2c975914318ac6da0ad1c352220ee8e1f.

Read governing AGENTS.md/CLAUDE.md and PROJECT-RECORD §§4/6/10.3/10.8/10.12/10.15. B7 verdict supplements previous fences only as stated here.

## Questions to settle with bounded execution

1. Use installed Svelte binding plus real coordinator/collector/production bridge validator to reproduce45 -> empty ->46 -> empty ->45. Test null as current helper returns; separately cover undefined/nonfinite hostile states. State which listener/effect ordering actually executes versus manually injected conditions. Do not replace validation with an always-success mock. A stub native transport is permissible if explicitly labelled.
2. For each action show input state, config availability, terminal, assigned sequence and whether validation reaches IPC. Do not claim these synthetic IDs are B7's missing IDs.
3. Trace Home effect / runner production dedup and observer attachment. Does actual mounted-equivalent ordering attach the valid action before the first schedule? If not, identify exact seam preserving production scheduling behavior. If the existing harness cannot establish ordering, say so and provide the smallest real mounted regression fixture proposal.
4. Propose ONE preferred unavailable-config representation and version policy with exact examples of allowed invalid-input/unverified batch and forbidden completed/admitted batch. No invented numeric baseline; no permissive arbitrary nulls. Explain renderer types, native validation/wire, strict raw parser/integrity/binding/import eligibility and backward handling for immutable v1 traces. Enumerate exhaustive guards for that new arm.
5. Specify safe allowlisted pre-IPC failure reporting and sticky Finish behavior without native sequence relaxation. Later valid actions must not erase previous failed persistence.
6. Return exact proposed production/test files, implementation order, positive/negative regression matrix and gate commands. Keep numerical behavior, existing disabled-path overhead contract and production selection/cache/cancel/debounce untouched.

## Read scope and write fence

Read only relevant existing files:
- tauri-app/src/lib/views/home/{ParameterControls.svelte,profiling-coordinator.svelte.ts,analysis-runner.svelte.ts}, views/HomeView.svelte, stores/analysis.ts;
- tauri-app/src/lib/profiling/* and bridges/profiling{,.spec}.ts;
- tauri-app/src/lib/views/__tests__/profiling-*.spec.ts and installed Svelte binding/compiler/test harness;
- tauri-app/src-tauri/src/profiling*.rs;
- tauri-app/scripts/profiling/* for exact producer-consumer schema, binding, integrity and existing tests;
- retained B7 report/log/trace/inspection, without rewriting any evidence.

Only authored file allowed:
PLAN/RAG/reviews/EPIC-029/profiling-b8-invalid-input-repair-review.md (new).
The report may embed a complete minimal reproduction command/source as code blocks. In-memory compilation/probes may execute using existing dependencies, with no emitted app bundle/native binary. If a temporary mounted fixture is necessary, use one new mktemp directory, leave its path/hash disclosed, and write it with apply_patch; never modify installed dependencies/config or tracked/untracked candidate source.

No source/test-file edits in the candidate, full suites, Cargo compilation/native execution, package/build, app launch/attach/input/control, runtime/preference/log writes, imports of live app entrypoints with side effects, owner workload/media operations, installs, Git changes, new tasks, watchers or cleanup. The former B6 PID43210 is absent at lead recheck; all B6 namespaces and retained evidence still must remain untouched. Do not restart or recover that session. Preserve B2/A0/ordinary apps too.

## Validation and submission

Check branch/HEAD and all56 baseline source hashes before/after. Recheck B7 raw/index digests; no broad process/environment scan. Record actual probe command, installed versions, outputs, counts and any harness limitations/errors. No guessed target/deps executable discovery.

Submit the one immutable report and its external SHA256 to this lead as soon as ready. Stop at this explicit schema/fence verdict gate; no autonomous build. Lead must respond with a bounded implementation brief or concrete technical blocker, not leave silence labelled review. No owner bell is needed.

