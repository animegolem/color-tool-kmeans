# Correctness wave06 — six prerequisites locally accepted

Review Lead -> Code Lead and owner, 2026-09-06. PROJECT-RECORD rev0.70. This closes the local review of the six named native prerequisites, not AI-IMP-180 aggregate adoption, native193 ownership, main integration or release acceptance.

## Phase030 acceptance receipt

Submission `correctness-wave-06-phase-030-submission.md` SHA-256 `8a124bc834a395cf2345ce409fc531156a9bf70f356ebcbd6922547e22419379` fully reviewed. Exact seven-path manifest and all prepared hashes match; six tracked-file binary diff `8bfafbe1bd94397625e55dc86f25bff59470a97635fb6c259941cfa7d37d2657` matches. Lead's canonical seven-file staged binary diff is `d1600a4c2d13cb52d8c96a96095953649a2d414b46d439a7d80ffb09841d3735`, separately identified from the report's assembled tracked-plus-new-file stream. Only the existing sha2 direct edge was added to the lock; version0.10.9/checksum/transitive package contents did not change.

Lead reviewed the entire source/test delta and new helper. The actual frame/strip request builders are used by production commands and preserve request fields/clamps/modes. The Values writer and remover share exact logical-ID UTF-8 canonicalization, retaining settings/source-generation suffixes. The actual producer/remover tests demonstrate formerly colliding IDs have distinct output paths and that removal of one leaves the other's three PNGs unchanged. The known-vector/safe-component/exact-byte distinctions and blank-ID controls pass. Earlier029 worker/profile,027 bridge,021 generation and022 retention behavior remains covered; untouched019/022/frontend hashes match.

Lead verified the retained negative transcript hash `4a6f93de2e34cf669069313aac1e652f0a42e0f78c9f84f7a7897935992f5c2f` and inspected its three behavioral assertions: same producer paths for ab/a/b; mismatched sharedframeid/shared_frame_id; same Values output path for a/b/a?b. Positive transcript hash `1d722f6b8f1995269fc0d808e12de499809433b1ef1c478538613afbef773a3b` also matches. These are report-backed before-fix executions, not a claim the lead reran a modified old source tree.

Lead independently reproduced **473 renderer tests/36 files; 92 native tests plus one intentional ignored profiling emitter; scalar1; profiling Node88; event10**. Native fmt/clippy, Svelte check (zero errors/two accepted warnings), lint/format, diff check and core normal tree without Tauri pass. Actual candidate-local commit hooks pass. Node88 explicitly exercises the profiling emitter; this is not media FFmpeg/AppHandle transport evidence.

Lead commit **a0d9dd0be5441095ef12f5bf98c225aee02281d4**, parent `f1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55`: seven source/manifest/test paths380 insertions/52 deletions plus generated INDEX gives eight paths384 insertions/56 deletions. Candidate clean. LOC review retains cohesive command/builder/test705, Values755 (shrinking), regression499 modules and the generated root lock; explicit commit annotation used rather than unrelated splitting. The submission's parent title paraphrases the actual `refactor(commands): offload blocking native work ...`; its parent SHA is correct and authoritative. Preserve the original report.

## Accepted local prerequisite sequence

Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, branch `codex/correctness-wave-01-2026-09-05`. Each issue was reviewed and committed before the next overlapping assignment.

| Slice | Local commit | Bounded result |
| --- | --- | --- |
| SWEEP-022 | `5d22118d9a708b49181ff2e154d84c0bb090398b` | Remove blind session-time pruning; retain startup/explicit-removal behavior |
| SWEEP-019 | `575868c697e67fb7331ae3df3ae39fc5069efca8` | Separate retained grid output paths |
| SWEEP-021 | `caf822526af273c3dafdb44a51f7c094fb3ebeb4` | Separate observed Values generations |
| SWEEP-027 | `3d35787a5df857e095a96c31a8a5e8588b13db70` | Validate four media response boundaries |
| SWEEP-029 | `f1a30d1f9bfd0e0232f7a08d8e29575d6bcfcf55` | Await blocking workers while preserving profiling and errors |
| SWEEP-030 | `a0d9dd0be5441095ef12f5bf98c225aee02281d4` | Shared collision-safe logical-ID naming and exact-ID removal |

Source provenance, previous hashes, regression receipts and narrow limits remain in the individual wave06 submissions/verdicts. All six local prerequisites are now present; the original native-delta finding that they were absent on933d888 remains valid historical evidence, superseded for the current candidate by this table.

## What this does not accept

No main integration, app packaging/launch, real FFmpeg/AppHandle transport, Node20/Windows/Linux, mounted interaction, performance comparison or release validation was performed. Main, running app, bundles and retained evidence were not changed by this wave. Naming digest is not a content digest, immutable snapshot, lease, PTS, symlink-safe confinement, producer equality when callers use different IDs, or proof that collisions are impossible. No legacy migration or fallback deletion was added; old naming ambiguity/restart retirement stays193. Worker placement does not bound concurrent work or cancel it. Same-generation publication, retained export/Batch ownership and explicit removal races remain assigned residuals.

## Next gate: owner capacity ruling, then bounded193 assignment

**No193 implementation is authorized. Code Lead should retain the clean candidate and stop without polling.** The accepted Round02 C1–C3 protocol basis remains binding; there is no request for another general protocol review. The lead still owes the numbered current-topology implementation amendment before any193 coding.

The owner-pending decision is now on the next native implementation path: after reclaiming artifacts no accepted owner needs, what happens if a new all-or-none reservation cannot fit?

- Recommendation **F**: return recoverable `ManagedCapacityExceeded` for the new request, preserving all accepted jobs/results/owners. No silent eviction of owned bytes, no wait on capacity held by the request's own inputs.
- Alternative **O** requires explicit bounded overflow allowance and a separate hard ceiling. **R** retention-only is not selected by silence.

F/O policy and concrete budgets remain unapproved. Minimum follow-on budget specification includes separate transient-pool ceiling/headroom, any class-specific admission ceilings, and oversized-single-job behavior; O additionally needs overflow allowance/hard ceiling. Current retention counts/bytes are not these admission budgets. First ask the owner to confirm the behavioral direction; then present concrete budget recommendations for approval before enabling or assigning new exhaustion behavior. No inferred numerical defaults or193 source action in this verdict.

This is a pause at the native ownership decision gate, not a claim the entire project is blocked or complete. Disjoint work may receive a separate scoped assignment; none is dispatched here. No new watcher, task, automatic continuation, app or release action is authorized.
