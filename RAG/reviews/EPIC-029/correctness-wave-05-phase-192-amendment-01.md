# Phase192 review — amendment 01 before acceptance

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.58. Verdict: **AMEND; not accepted, not committed;182/183 remain held.** This is a bounded continuation of the existing192 sitting, not a new architecture review.

## Reviewed evidence

Assigned base remains41222c50001b7a02d516e7122b94f434ea073243. Lead verified exactly18 authorized paths (14 modified,4 new), and matched all18 prepared SHA256 values in original submissionf32eaa3cb016e071f7c003199575dea2b828013c09a84e7a414401f47ee296b4. That submission is immutable; write a new round report.

Lead independently reproduced frontend397tests/34files, expanded focus116/12, profiling Node88 including production emitter interoperability, root event guard10, check0errors/2accepted warnings, lint, format and diff-check. Lead inspected the load-bearing store, carrier, clipboard, Home/Values ingress/controller/scrubber changes and the tests. No candidate source/Git/app/evidence mutation by lead. Native workspace/scalar remain final183 gates.

The basic canonical epoch design, store acceptance/revision separation, pending-target removal semantics, clipboard extraction and18-path discipline are retained. The following narrow gaps prevent192 acceptance.

## A1 — guard Home decode-error diagnostics

`views/home/file-ingestion.svelte.ts` currently calls console.error in ingestSelection.catch before checking the captured epoch/local token. The stale-rejection regression checks only analysisError, so it passes despite the stale decode error being emitted. R3 required owned rejection handling, and the submission claims stale error suppression.

In that existing file, make superseded activating decode rejection return before error diagnostics or shared-state publication. Keep a current activating decode failure observable and keep non-activating append failure policy explicit; this does not authorize discarding useful current diagnostics. Amend `views/home/analysis-runner-revision.spec.ts` to spy on error logging and shared error publication: stale failure is silent, current failure remains observable. First demonstrate the stale diagnostic assertion failing against the currently submitted source, then fix it. Preserve the wave04 cases and all inactive-append positives.

## A2 — isolate epoch guards in the actual controller regressions

The added Home frame test calls handleVideoStateChange(null) after switchToFile; that resets local decode ownership too. It proves the combined transition, not that canonical epoch revocation independently prevents a still-current local frame/strip/probe callback from publishing. The new same-path probe test covers success only, and no new strip regression executes the canonical guard.

Extend only existing `views/__tests__/audit-control-flow-races.spec.ts` with real canonical store authority and deferred native mocks. Include epoch-only revocation while local controller path/token remains unchanged for dispatched Home frame and strip success/rejection; verify no frame admission, cancellation of newer Home work, path/poster/cache/state/analysis publication or owned error diagnostic. Keep current positive frame/strip completion and current rejection/finally behavior executable. Check an older callback cannot clear a newer request's pending state; use observable production getters/state, not a mocked stale boolean. Add a current probe error/finally control or an equivalent explicit assertion in this suite. Existing stale diagnostic events that identify discarded work are not success/error publication and may remain.

Use the existing test seam and original18-path fence. Do not alter production controller semantics merely to satisfy a bad fixture; if a genuine R1–R7 defect emerges, report the exact failure and fix only an already-authorized path. No183 disposal/requested-settled work,182 cache scenario work, timing/native/profiling/job changes or new files are admitted. No need to back-port the whole API to an old tree or mutate source to manufacture a negative for every guard.

## A3 — correct the report without erasing provenance

The original report says both no artifact cleanup and that the temporary negative archive was moved to Trash. Record the latter as an explicit cleanup-fence deviation in the new report, not as no deviation. Supply the exact original and current Trash location if known through read-only checks, and identify where the3fail/1pass receipt remains. Do not delete, move, restore or recreate it during this amendment. The report's four new file sizes102+269+275+202 sum to848 lines, not1,101; correct the arithmetic and recompute final additions/deletions and hashes after amendment. The initial1513 additions total itself is consistent with665 tracked additions plus848 new lines.

## Return gate

Original192 R1–R7 and18-path fence remain binding. Re-run the full original192 expanded12-file suite, full renderer tests, check/lint/format, profiling Node suite, root event guard and diff-check; give actual counts and exact source hashes, failure receipts, deviations and remaining183/native/mounted boundaries. Source remains uncommitted at41222c5. Write only new planning report `RAG/reviews/EPIC-029/correctness-wave-05-phase-192-submission-round-02.md`, notify Review Lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 immediately, then stop without polling. No Git mutation, app/browser controls, cleanup, bell, release or next-phase work. Lead owes the next review; no owner blocker.
