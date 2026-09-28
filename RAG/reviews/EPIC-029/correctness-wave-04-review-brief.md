# Correctness wave 04 — replacement identity preflight

Review Lead -> Code Lead, 2026-09-06. Governing PROJECT-RECORD rev0.52 §§4–6 and11. Owner has authorized resuming correctness work and carefully improving interaction scheduling after a normal B14 manual run. This is a focused pre-implementation check, not a new whole-app sweep.

## Exact assignment

Review adaptation of SWEEP-010 (`42137f7451297c8bff52cb0ee73c83845979c14f`) and SWEEP-017 (`1e48deb6d3cac490096fc45cd1ca1fc1c1b1025a`) as prerequisite issue patches, followed by AI-IMP-181 revision-aware Colors request identity. Tickets are in this planning worktree's RAG/AI-IMP; IMP-180 holds aggregate sweep adoption and must stay open. Read current source, original issue patches, IMP181 and the existing Round02 identity rulings. Do not reopen settled architecture or review unrelated tickets.

Candidate is `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2, seven locally accepted issue commits plus57 preserved profiling paths. The B20 verdict is accepted diagnostic evidence, not general performance or integration acceptance. Inspect current HEAD/status; any unexpected drift is a concrete report item, not permission to overwrite it.

## Required answer

1. Verify the real store/ingestion/runner failure chain for same-path replacement, including every completed-key seed/cancel adapter. Distinguish replacement revision from selection epoch and request token. Identify exact original patches already present or still missing; no blind cherry-pick.
2. Verify how pinned Batch content becomes stale on replacement and which minimal revision primitive can serve both without changing independent Batch/export job authority. Keep file identity/content revision separate from active selection.
3. Give the smallest exact implementation file fence and ordered issue/test map for010 ->017 ->181, correcting order if source requires it. Required cases: readyA replaced at samepathB dispatches once, old completion cannot satisfyB, eligible unchanged restore avoids duplicate analysis; pinned replacement invalidates/recomputes. Include negative and positive tests through real store/runner APIs, not synthetic scheduling assumptions.
4. Explain interaction with current profiling observer/request keys. Preserve the accepted instrumentation's observational behavior and evidence schema; do not quietly change it to make a regression pass. Existing57-path baseline remains untouched in this review. Flag the minimal integration choice for lead-owned atomic commits before code edits; no Git mutation or clone/worktree creation by this assignment.
5. Return focused test commands, current-base discrepancies and estimated bounded implementation scope. A small in-memory/private temporary repro using installed dependencies is allowed if it resolves an actual source ambiguity; no candidate edits, dependency installation, full gate churn or app launch is needed for this review.

## Allowed writes and fences

Write only `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/correctness-wave-04-review.md`, plus a newly named private temporary repro directory if necessary. Do not overwrite any submission or old evidence. Lead owns PROJECT-RECORD, tickets, INDEX, scheduling design and assignment decisions.

No candidate/source/build/Git mutation, commits, app or browser control, capture, benchmarking, native lifetime-policy redesign, cache quotas, IMP178, EPIC026, UI implementation, dependency/lock/schema changes, owner notifications or polling. Read-only subagents are permitted only for disjoint bounded verification; return one consolidated report. Stop after reporting; Review Lead owes the next implementation ruling, not an owner decision.

## Owner observation and parallel lead work

Owner's latest screenshot shows78ms/40iterations/260000samples and they report the app felt normal with none of the earlier strange behavior. Material/config/whole-interaction latency are not fully bound, so this is bounded owner feedback, not matched benchmark evidence or a resolved historical-stall diagnosis. Preserve B20 unchanged.

Lead is separately scoping gesture-aware scheduling: coalesce incomplete typing/continuous changes, evaluate committed-action flush without worker floods, retain latest-request authority and numeric output. No debounce timing change belongs in wave04. No new profiling capture is assigned. Design direction is unchanged; shared study/collection return remains the subsequent UI priority after its correctness prerequisites.

Report immediately with exact files, citations, proposed regressions and candid friction. Do not pad this into another broad audit or await a new owner response.
