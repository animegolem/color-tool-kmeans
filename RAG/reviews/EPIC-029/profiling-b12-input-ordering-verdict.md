# AI-IMP-202 B12 ordering review verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev 0.42.
**ACCEPT bounded browser/source repair basis, with R1-R5. B13 two-file implementation authorized separately.**

Submission SHA-256: 080c10bf65abe307df1764ffac3129ea1a34119791be68d222585a7f27997347.

## Independent checks

All 24 indexed B12 artifacts pass. All 57 accepted candidate hashes pass; exact -uall status matches B11 on the unchanged candidate. Lead verified the current component fixture equals candidate bytes and the capture fixture differs by exactly six oninput -> oninputcapture attribute replacements. B12 server PID47453 is absent; no server/app/browser replay was performed by lead.

Lead recompiled both fixtures in memory with installed Svelte. Current has zero capture input hooks. Candidate variant has six, each with capture=true before its own corresponding bind_value/bind_checked call; other bindings remain. Lead independently checked both raw snapshots:86 ordered records each,20 retained native-event records each, all isTrusted=true. Every numeric input window has effect before observer in current and observer before effect in capture. Current has one action-bearing schedule (checkbox); capture has six (4/46/4/45/checkbox false/quality3), matching the report.

Read the actual harness, compiler probe and summary generator. The coordinator and component are real, but the trace sink, schedule sink, fixed study, and mirrored effect are a restricted diagnostic boundary. The stub compares config equality and does not reproduce collector terminal/cancellation/native behavior. The report's phrase "real candidate config correlation semantics" is accepted only as coordinator snapshot creation plus that explicit stub comparison, not full collector execution.

Review friction: an initial lead regexp assumed single-line generated calls and failed to match the multiline capture output. After inspecting actual compiler output, the corrected whitespace-aware probe passed all six element-specific checks. No artifact/source was changed to accommodate the probe.

## R1 — accepted cause, scoped to the observed browser

The retained trusted Chrome152 mounted evidence establishes the numeric ordering failure at this fixture's reactive scheduling boundary, rather than merely guessing from B11. It supports, but does not establish, the exact Tauri/WebKit timing mechanism. Do not promote it to native execution/collector/chart proof or claim a lead-operated browser rerun.

## R2 — exact production repair

Change only the six existing profiling oninput hooks in ParameterControls.svelte to oninputcapture. Preserve number/range value binding, checkbox change binding, target extraction, guards/exception containment, disabled-profiling behavior, pointer hooks, and every other production byte except unavoidable formatter whitespace. No scheduler, debounce, request-key, coordinator, schema or native changes.

## R3 — permanent regression contract

Update profiling-svelte.spec.ts only. Preserve and label the null/wire surrogate accurately. Add a compiler contract covering all six named controls/elements, direct capture=true input registration before each element's corresponding binding, unchanged binding counts, and absence of input from the delegated tail. Checking only the first hook or a total count is insufficient. Demonstrate the same contract rejects an in-memory old-hook variant. This is a compiler contract, not trusted-event runtime proof; retain B12 evidence for the latter.

## R4 — correct the proposed native acceptance recipe

Reject the requirement that EVERY valid intermediate digit must have a native span and renderer endpoint. The unchanged400ms debounce may legitimately supersede intermediate4 before admission. Require honest per-action target/config association and actual cancellation/supersession/dedup outcomes; require native/renderer completion for settled final values that actually execute. Never disable debounce, stretch operator timing or synthesize spans to force intermediate work.

Fresh-process repetition alone cannot establish instrumentation overhead: later matched off/on acquisition, comparable workloads and uncertainty are separate requirements. The next control proof should use the already-identified owner PNG first; varied Desktop/performance acquisition follows its own bounded case brief. No blanket multi-image/native run is authorized here.

## R5 — implementation then native gates

B13 is two-file source/test implementation with full gates, prepared uncommitted. After lead reproduces gates and accepts source, assign a distinct immutable build and fresh native capture; preserve B10/B11. Native correlation, bound acquisition, numerical parity, overhead, true end-to-end flame graph and owner/platform acceptance remain open. No owner decision is pending. Lead must dispatch and review promptly rather than leave Sol idle behind the follow-up.
