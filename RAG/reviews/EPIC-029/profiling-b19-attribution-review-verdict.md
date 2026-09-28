# AI-IMP-202 B19 attribution review verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.50.
**Accept preserved native sampling and partial renderer diagnostics. Reject owner-facing E2E completion; authorize B20 foregrounded capture only under its brief. No B19 rerun or report rewrite required.**

Submission0812d75ce58fc46306e23f44d6a0071f59eeccc88efcf349002d9f0882f9d709 verified. Lead rehashed all513 indexed files, indexe7b37caf6dd07f44facecce19db2da2dd5637b2a42ecf7e0edd64cb0abc6f1b7. Current PID24489/start15:03:23/executable still matches. Exact55 old source leaves/two accepted R1 tool hashes and status57 unchanged. Raw19592bytes/SHAdaeb5d14764f21ff2b52f8ac4fdd5016d3f5c7c88106910e39f423c0808b5b93 matches current live bytes.

Independent production parsing:14records/four actions/untainted seal. Sequences1/3 invalid-empty;2/4 unverified hidden-before-dom-raf2. Lead independently recomputed all available renderer durations exactly; native deltas895.214042/720.967083ms. Missing DOM/RAF2 cannot be upgraded by a generic coherent:true returned for a noncompleted action.

Read actual trace-dom.ts: after generated figures and settle/association checks, document.visibilityState != visible terminates before dom_settled. Thus trace proves hidden at the guarded point; lack of app activation is a plausible operational explanation, not independently instrumented causality. No production-code repair or disabled visibility guard is justified.

## Attribution corrections

Lead parsed actual symbolicated time-profile XML and TOC: targetPID24489 and binaryUUID DFF35F8D-552F-322B-85D8-1FC89C2007EB match. Actual WHOLE table has2533 modeled rows/2533ms weight;2530 rows have tagged-backtrace and3 do not. Report's2530 whole-recording total is the stack-bearing subset, not every CPU row.

Within the exact provisional projection windows, seq2 has839ms total/stack-bearing sample weight and11ms main-thread. Seq4 has895ms total sample weight,892ms stack-bearing and3ms without tagged-backtrace; main-thread12ms. Keep missing-stack sample weight explicit in future fold/flame totals rather than dropping it. No new source correction or report revision needed; this verdict governs interpretation.

Whole-recording and per-window CPU weights are not elapsed latency. Recursive frame-occurrence totals are not additive CPU. Wall projection has no measured error bound, so projected regions locate candidate stacks only; no exact action sample attribution or production-hang causality accepted. Source400ms debounce plausibly accounts for most401–403ms admission delay, not an exact equality claim or optimization ruling.

## Evidence and next-run requirements

Lead read current exact app AX: K45/q3/exclude0/merge0/snapfalse, three charts and sealed header. This is lead read-only inspection, not B19-era foreground or screenshot proof. Current CUA documentation and actual window expose performSecondaryAction(windowIndex,'Raise'); use fresh indices, then screenshot-guided titlebar click if needed. App selection/background AX setValue does not prove foreground visibility.

B19 has no indexed UI screenshots/AX chronology or actual recorder stdout capture (xctrace-record.txt is help). Historical tool transcript remains evidence, but B20 must retain acquisition-state receipts more deliberately. No invented indexed screenshot or exact CSS viewport claims.

B20 begins with one new session and a foregrounded warm-up visibility gate before spending the120s recorder budget. If the first warm-up does not produce completed plus explicit visibleAtDomSettle/Raf1/Raf2 and actual endpoints, stop the new run before profiler acquisition; do not iterate blindly or patch instrumentation. One supported foregrounded run is the justified next step. No owner blocker currently.

