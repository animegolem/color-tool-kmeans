# AI-IMP-202 B16 native control verdict

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.46.
**Accept repaired native input association and loss-free seal as diagnostic evidence. Strict importer coherence still fails for two completed actions; no eligible/performance acceptance.**

Submission SHA2f7c1c20534004ddee44dd15ef236c6c7349b8422b63a4f3fd41b4fab54c4157.

## Independent findings

Lead rehashed all49 frozen payloads and parsed the untouched41843-byte raw trace with the current parser/organizer/inspector. Live trace still matches SHA1c9cfe55ce4367ca92e06a85ebb77ea8f6f98e706541a863a0d35ad33b71c652; same PID18954/start13:41:37/executable remains. Eight actions/batches/closes, four native receive/return pairs, zero loss, valid untainted seal. Original B15 partial evidence is not replaced.

All four completed actions carry true association checks. Two empty actions remain unavailable, two intermediate4 actions are honestly input-superseded without native spans. K45 and Snap are coherent under the unchanged inspector. K46 and quality3 fail only the renderer measurement equality test:

- stored duration402.0000000002328;
- recomputed parsed-timestamp delta402.00000000023283;
- difference5.684341886080802e-14ms.

For action3 the retained start/end are1202112 and1202514.0000000002; action8 uses1344891 and1345293.0000000002. Lead reproduced both exact failures. In a throwaway in-memory object only, substituting the recomputed duration makes each unchanged inspector result coherent. This isolates the failing equality; it does NOT repair or validate the raw artifact under current rules. No disk bytes were changed.

Source cleanProfileDuration returns finite nonnegative values unchanged. Collector derives the measurement from its recorded event times; importer uses strict === against a recomputed delta. The B14 compiler log shows serde_json without float_roundtrip in both recorded invocations. This is a plausible transport-roundtrip origin, not by itself proof of the exact lossy hop; B17 must reproduce the installed path before deciding repair policy.

Viewed the actual1215x768 final Colors image: supplied palette study and chart presentation with sealed header are visible. Preserve disclosed92x104 K45 thumbnail/capture error and AX provenance. No lead UI replay, physical-display, quiet-host or numerical oracle claim.

## Ruling and next gate

B13's repaired input ordering now has real Tauri/native association evidence. Do not change capture hooks, scheduler, native algorithm or sealed session again to address a comparison-boundary defect.

B17 is a focused numerical transport/coherence review: reproduce the equality issue through installed serialization, propose the narrowest bounded rule and negative regressions, and determine whether the untouched B16 artifact can be honestly re-inspected after a tool-only change. Prefer a narrowly justified comparison rule to rebuilding the app merely to avoid existing evidence, but no tolerance is authorized before review.

Do not broadly weaken clocks, IDs, ordering, native integer deltas, loss/seal checks or association checks. Do not round stored traces or turn contradictory large differences into accepted measurements. Importability, acquisition binding, parity/overhead and actual end-to-end flame acquisition remain open. No owner blocker; lead owes immediate next implementation ruling.
