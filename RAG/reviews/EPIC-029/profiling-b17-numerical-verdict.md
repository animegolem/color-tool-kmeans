# AI-IMP-202 B17 numerical-boundary verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.47.
**ACCEPT as repair basis; authorize B18 two-file tool-only implementation under the companion brief.**

Submission SHA256 a6cba6eeed58fb39de796e3ac5aad01a9b7a9ee64a014cc74d26ffe7589c2668.

## Independent verification

Lead rehashed all three named diagnostic receipts, all57 accepted source leaves and exact57 status stream062d3a16… on HEAD8bf3187. Read the actual private Rust package and probe source, then independently invoked the named offline Cargo probe with retained input, not the receipt-writing driver. Both retained durations move from402.00000000023283 to402.0000000002328 with unchanged endpoint values; gap5.684341886080802e-14ms. Exact zero stays zero.

Lead reran both JS diagnostics in memory after removing their receipt-writing tails, preserving every evidence file: table19/19, four completed B16 actions go from two exact to four predicate-coherent, raw bytes unchanged. The historical live IPC hop is supported by exact reproduction/source but was not retrospectively instrumented.

Source confirms trace-to-run uses evidence.values for renderer measurements, with native aggregate and kernel results separate. No reporting-authority change is necessary.

## Binding rulings

1. Accept the proposed finite/nonnegative/ordered, at-most2^30ms domain BEFORE the exact-equality shortcut. This is a conservative profiling validation policy, not an app uptime limit or a proof of global serde error bounds. Apply it consistently to both historical v1 and v2; above-domain completed actions become unverified without altering raw artifacts.
2. Exact zero/zero only whenever either duration is zero. Otherwise permit exact equality or abs(recorded - (end - start)) <= min(1e-6ms, ulp(start)+ulp(end)+ulp(recorded)+ulp(end-start)). ULP is next-higher binary64 spacing. The1ns cap is an independent ceiling, not a general-purpose epsilon. Keep all other checks exact.
3. Keep endpoint subtraction authoritative for reported renderer values. No trace normalization, mutation or dependency feature change.
4. B17's cancellation case perturbs only the duration at a large clock; it does not actually exercise transported endpoint movement. Strengthen permanent tests with endpoint-shift/cancellation cases, powers-of-two spacing changes, both sides of the bound, reversed zero/nonzero, and just-above range. Test the production predicate through the inspector or importer, not a copied test implementation.
5. Full v1/v2 re-sealed integration fixtures must prove recomputed reporting authority and preserve existing unverified/error precedence for genuinely contradictory values, native integers, association, ordering and seals.

Only the companion B18 fence is authorized. New numerical reinspection of immutable B16 bytes may be separately recorded under B18 after passing gates; it cannot silently upgrade the B16 report or establish missing acquisition binding/performance/flame acceptance. No new app build or controller operations. No owner blocker.

