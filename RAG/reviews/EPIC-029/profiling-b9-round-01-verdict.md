# AI-IMP-202 B9 Round 01 source verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.38 §10.17.
**AMEND H1-H2 only. Preserve accepted direction and all passing work. No build/runtime authority.**

Submission SHA256185ce5d6b217f24f9bad0dcff63c66ff320da9269e5098aa3b97ed2dcfa05b93 verified. Lead reproduced Node80, Vitest334/27, Svelte0errors/two old warnings, lint/format, Rustfmt/offlineclippy, workspace72 plus one intentional emitter ignored and explicitly exercised by Node, scalar1. All gates exit0.

Boundary check:20 report hashes match; exactly19 baseline paths changed,37 unchanged, one new v2 schema,57 current status paths on unchanged8bf3187. No outside-fence change found. B9 report/source retained; no Git mutation, app build/control or actual capture performed by lead.

Renderer reviewer independently executed actual compiled coordinator/collector/production bridge: null invalid input for four numeric controls produces contiguous1-4 exact three-event unavailable evidence. Hostile quality NaN on later finite target causes known failed capture without additional IPC. Permanent binding regression is useful installed-runtime/surrogate evidence, not mounted ParameterControls/native app proof. Native bounded unavailable-action state and locking reviewed; late native rejection is narrow and both accesses use writer-before-set lock order. Existing loss/seal semantics remain.

## H1 — do not skip available render-config verification

At import-trace-run.mjs:57-68, unavailable analysis pushes ACTION_CASE_CONFIG_UNAVAILABLE and continues before comparing renderConfig. This discards an independently checkable mismatch.

Executed lead probe with existing v2TraceRecords/withFixture/importTraceRun: change only action-invalid.renderConfig.showAxisLabels, recalculate its action-close byte count through the test fixture, diagnostic-import the selected invalid action against the original case. Actual result: only ACTION_CASE_CONFIG_UNAVAILABLE and terminal input-target-invalid. Expected: record the render mismatch and retain acquisition-binding-unverified precedence. The valid record is structurally intact but does not match its asserted render case. No actual B7 evidence was changed; probe used existing test-owned fixture lifecycle.

Separate available render comparison from unavailable analysis comparison for every selected batch. Always verify expectedRender and actual render config when present, even if analysis is unavailable. Keep normal selected-unavailable rejection and diagnostic unavailable reason for matching render. If mismatch or unavailable expectedRender exists, retain ACTION_CASE_CONFIG_MISMATCH (or existing applicable binding error) alongside unavailable analysis; trace-to-run's existing problems precedence should then produce acquisition-binding-unverified. Do not invent analysis equality or alter nonselected eligibility.

Add positive matching-render and negative mismatched-render/expected-render-unavailable diagnostic regressions. Preserve all v1/resolved behavior.

## H2 — require the unavailable event data in the v2 schema

Source-confirmed: rendererBatch's unavailable conditional prefixItems constrains event1.data using properties but does not require data. The referenced v1 rendererEvent also does not require data. Thus a missing input_resolved.data satisfies the schema's object-key rules while runtime validation rejects it. Delivered/outcome event data likewise lacks the new arm's fixed invalid-target/outcome constraints. Existing schema test checks top-level additionalProperties/id but not these conditional requirements.

In the v2 document only, require data on each of the three unavailable events. Express the fixed invalid-target state and invalid outcome with exact permitted fields, require sourceMatches:true/targetMatches:false, forbid numeric/boolean target arms, and require the exact fixed outcome data. Control equality across two dynamic record locations remains a runtime guard; schema can still restrict both controls to the same supported numeric-control enum. Keep event IDs/clocks/times and dynamic cross-record equality under existing runtime/native/integrity validation; do not claim JSON Schema proves those.

Add tests asserting the new required and exact fixed-shape constraints plus paired runtime rejection/positive fixtures. If an existing offline draft2020 validator is readily available, execute schema validation; otherwise explicitly report structural schema assertions versus executed runtime parser tests. No install/new dependency or validator reimplementation is authorized. Lead found no installed ajv/dist/2020; don't claim prior full JSON Schema execution.

## Exact correction fence

Candidate same branch/HEAD57-path source. Only:

1. tauri-app/scripts/profiling/import-trace-run.mjs — H1 comparison order
2. tauri-app/scripts/profiling/schema/trace-record.v2.schema.json — H2 conditional constraints
3. tauri-app/scripts/profiling/profiling-trace.test.mjs — H1/H2 regressions

Plus one new immutable PLAN/RAG/reviews/EPIC-029/profiling-b9-round-02-submission.md. All other17 B9 files and37 baseline files stay byte-identical. No new feature/schema arm, source split, frontend/native edits or further broad sweep. trace-to-run already implements required mismatch precedence and remains fenced.

Use B9's exact full gate commands again after focused Node regression. Preserve B9Round01 report and all historical artifacts. Report three hashes, unchanged17/37 preservation, exact test counts/outcomes, errors/friction and source-only versus executed evidence. Source prepared/uncommitted; no builds/app/runtime/Git work. Send result immediately to lead; no owner question or idle uncertainty.

