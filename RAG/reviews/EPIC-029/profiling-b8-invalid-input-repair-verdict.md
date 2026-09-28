# AI-IMP-202 B8 repair review verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.37 §10.16.
**ACCEPTED AS REPAIR BASIS WITH G1-G7; proceed to B9 implementation.**

Report profiling-b8-invalid-input-repair-review.md SHA256 b8e56fc42b9789dae3ee76c33901481a80a488e61a61f508e825890866327317 verified. Lead independently rechecked all56 source hashes and inspected installed binding, coordinator/collector/validator, native writer state, parser/integrity and import conversion. No independent full-suite or native/runtime execution in this review.

The reported installed-binding probe establishes a useful deterministic counterexample: invalid1/3 fail pre-IPC, valid cancelled2/4 reach a strict sequence stub and lose4->8. Those cancellations are probe conditions, not B7's missing terminals. Source supports binding -> synchronous subscription -> delegated observer -> later effect order. The surrogate is not a mounted browser/native run and does not establish why real B7 completed analyses had no persisted native spans. Do not change production scheduling based on the former artificially injected dedup example.

## G1 — v2 evidence arm accepted

Adopt the report's exact tagged analysisConfig union: resolved/value with unchanged exact finite config, or unavailable/input-target-invalid with no value. New native records are all v2 through the existing SCHEMA_VERSION constant. The IPC batch is an internal typed v2 contract; do not add schemaVersion/recordType IPC keys just because examples are serialized trace fragments.

Retain v1 parser semantics and schema file; add a distinct v2 schema and reject mixed/unknown versions. Binding/run/case schemas are not version-bumped. Never rewrite historical artifacts. All numeric/domain/quality consistency validators that already apply remain in force; this does not authorize algorithm changes or blanket new rejection of legitimate unresolved/cancelled observations.

## G2 — narrow unavailable action, synchronous and honest

Accept guards1-10 with these refinements: input_resolved.sourceMatches must be true; targetMatches false; association checks exactly inputTargetResolved:false; measurements empty; exact delivered_input -> input_resolved -> action_outcome sequence; no dropped events for a clean ordinary arm. Render config and identities remain valid. Canonical delivery/outcome fields and event timestamps retain existing strict checks.

Construct, resolve and terminalize the ordinary invalid action synchronously before the coordinator returns; do not pass null/nonfinite values through createProfileAnalysisConfig to manufacture a typed resolved snapshot. No scheduling/admission/native/store/figure path may consume unavailable evidence. Keep resolved internal values separate where that minimizes downstream churn.

Capacity overflow/sentinel is NOT ordinary invalid-input completion: preserve existing explicit session-loss/sticky refusal behavior, no clean seal. Do not fake a three-event input-target-invalid terminal, invent config, expand the arm to trace-dropped, or suppress known loss to satisfy the new schema. Test empty input exactly at the capacity boundary. Other malformed runtime state outside the narrow arm must fail closed with safe known loss/failure, not silently disappear as a successful capture.

## G3 — native state and trace integrity

Payload validation alone cannot establish absence of native work. Add a minimal profiling.rs append check against existing writer action state before accepting unavailable evidence; a preexisting native receive/return or conflicting native action history must reject through existing loss/close accounting. No native reservation, sequence, capacity, finalization or production-compute policy rewrite.

Node integrity must reject unavailable actions with any native phase or true native receipt flag regardless of selection. A resolved selected measurement cannot hide contradictory nonselected evidence. Late native calls after a closed invalid action must retain existing rejection/loss behavior. Native missing-write/drop history remains tainted; no clean completion from absent records.

## G4 — importer reason correction

Accept ACTION_CASE_CONFIG_UNAVAILABLE for normal selection; nonselected structurally clean invalid observations can coexist with resolved selected actions. Diagnostic selected unavailable action has unverified/input-target-invalid, no measurements and no fresh execution claim.

The report's claim that trace-to-run.mjs needs no change is incorrect: importedAttempt currently overwrites every diagnostic reason with acquisition-binding-unverified. That exact file is admitted for a narrow conversion guard preserving the invalid-input reason on otherwise intact unavailable evidence. Broader binding/trace loss still takes precedence; do not relabel corrupt evidence as a clean invalid input. No run schema/summary/redaction rewrite.

## G5 — safe failure codes and unchanged behavior

Use a fixed bridge-authored allowlist for internal pre-IPC codes; fallback trace-flush-failed for arbitrary thrown text. Keep first failure sticky, Finish generic/nonretryable and native finalize uncalled after known loss. No resetting/rebasing/skipping/retrying sequence, no coercion/default/current-baseline substitution.

Preserve disabled observer overhead and production input/store/debounce/cache/cancel/request/numeric behavior. No changes to ParameterControls, HomeView or analysis-runner for the earlier speculative schedule race.

## G6 — implementation proof, not narrative-only reproduction

The B8 report describes but does not embed the complete executable sequence probe. Replace that reproducibility gap with a permanent self-contained regression in the assigned existing Svelte test: installed binding/conversion, real store propagation, real coordinator/collector/bridge validation; label surrogate native transport honestly. Do not use a validator that always succeeds or only null target with valid params.

Exercise rapid and settled/debounce-expired cases, all numeric controls' invalid delivery, hostile states, capacity, unchanged production scheduling and valid admitted/result path. Native producer -> Node parser/import integration must emit actual v2 including an ordinary invalid action followed by a resolved measured action; preserve explicit v1 compatibility fixtures. Schema guards require tests at renderer, native payload/state, parser and nonselected integrity boundaries.

New source acceptance still does not prove mounted app capture, numerical parity, profiling overhead or performance. Those require a later fresh isolated build/session, not B6 restart.

## G7 — scope and delivery

profiling-b9-invalid-input-implementation-brief.md is the exact implementation/test fence and gate list. It admits the two source-discovered gaps above and narrow typed/test plumbing; no broader repair wave. Source prepared/uncommitted, no packaging, app execution or Git changes. Lead owns immediate review on submission, not an owner question.

