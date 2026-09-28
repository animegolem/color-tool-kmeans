# AI-IMP-202 B18 review and R1 signed-zero amendment

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.48.
**Main repair/gates verified; one localized boundary correction before source acceptance.**

Lead verified exact two-file diff, other55 baseline hashes, B18 two-artifact index and raw B16 digest. Reproduced Node87, Vitest335/27, Rust72 plus intentional ignored emitter exercised by Node, fmt/clippy/lint/format and check0errors/same2warnings. Re-executed production parser/organizer/inspector on untouched41843-byte B16 trace: all8 actual outcomes retained/four completed coherent/untainted. No acquisition or performance claim.

Checker438 and test841 lines remain cohesive for this bounded policy; accept cohesion as a deliberate review, with eventual commit LOC bypass required, not source minification.

## R1: normalize signed zero only inside ULP spacing

The approved domain admits both numeric zeros, but current bit increment assumes a positive sign:
- ulp(+0) = Number.MIN_VALUE;
- ulp(-0) = -Number.MIN_VALUE, violating next-higher spacing.
Lead executed the actual private production function definitions in memory: compare(5*MIN_VALUE,{start:+0,end:MIN_VALUE,value:MIN_VALUE}) returns true; same operands with start:-0 returns false. This is a tiny-domain false negative, not a B16 data problem or tolerance widening request.

In ulp, special-case value === 0 to return Number.MIN_VALUE before bit stepping. Preserve raw values and reported subtraction; do not normalize trace bytes or change exact-zero policy. Add a production-inspector regression for signed-zero start and subnormal nonzero spans, with both accepted within-bound and rejected outside-bound, plus zero/nonzero behavior. The test must preserve -0 in memory (JSON.stringify changes it to0), or deliberately use a valid raw -0 JSON numeral; do not let serialization erase the case.

Exact B18 two-file fence remains. No app/source outside fence/config/dependency/Git/old-evidence edits. Run focused Node and all profiling Node tests, full frontend/native/static gates as before; these are fast and already passed at the submitted tip. Preserve original report2f6d79b7… and numerical receipt70ed0f60…; create new suffixed R1 report, new source-labelled reinspection receipt/index under existing private B18 root (never overwrite original). Report whole-file SHA immediately.

No owner blocker; do not begin new app capture yet. Lead is preparing the installed-tool acquisition plan concurrently and will promptly rule on R1.

