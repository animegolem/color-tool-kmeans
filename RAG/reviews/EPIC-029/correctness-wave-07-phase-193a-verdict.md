# Wave07 phase193-A accepted; C1 runtime seam verification next

Review Lead -> Code Lead,2026-09-07. PROJECT-RECORD rev0.72. Accept only the native in-memory ownership kernel, not production file safety or aggregate193.

## Independent acceptance receipt

Submission correctness-wave-07-phase-193a-submission.md SHA256 **101586bebed1044137268ea19ceaf34ae186b3fc743e729175168b9d60dff6da** fully read. All five prepared hashes match. Lead read the entire registry/types and both test files; exact acquire/release/eligibility/claim/failed-claim/success transitions preserve ownership and accounting, with private constructors and checked sequences. Atomicity is serialized Rust mutation, not a claimed database/filesystem transaction. Actual public-kernel barrier tests establish both lock orders; no sleeps or parallel model.

Lead reproduced renderer473/36, native105 plus one intentional ignored emitter, Node profiling88/event10/scalar1, zero Svelte errors/two accepted warnings, lint/format/fmt/clippy and core normal dependency tree without Tauri. Native count was also recovered with a quiet fresh full-workspace run after a combined tool result truncated part of the first transcript:19+2+1+3+1+26+1+2+37+6+7=105. Prior source/manifest/rootlock hashes match. All five new/changed source files are within350 lines.

Tracked lib diff SHA62f4c5e matches. Lead canonical staged five-source full-index binary patch SHA**12b64141a9e8fd554d05ae4cafb024a8924dcb1e16386c1e3d35af75f7548853** is distinct from the report's assembled no-index serialization; do not equate them. Five source paths1257 insertions/0 deletions. Lead commit **6e12a73783c7119dae9b6add947e1b5085abe003**, parent **a0d9dd0be5441095ef12f5bf98c225aee02281d4**, includes generatedINDEX: six paths1261 insertions/1 deletion. Candidate-local hooks passed; no bypass; candidate clean. Main, running app and retained evidence unchanged.

## Retained obligations for later integration

- R retention-only remains owner-approved. No new quota, timer, capacity rejection, global eviction or automatic flush was introduced.
- The four initial classes distinguish persistent copies from transient metadata; later production adapters must preserve the finer frame/strip/Values retention classes and existing restart policy.
- ReclaimOutcome::Failed restores eligibility only because this kernel performs no IO. A later filesystem adapter must NOT report a partially deleted/corrupted group as restored complete bytes. Establish safe whole-group isolation/quarantine or an explicit non-readable terminal state before wiring real deletion.
- Released-lease/ticket tombstones remain for registry lifetime. This is honest in-memory idempotence, not bounded metadata retention; session/window lifecycle must not gain an arbitrary safety timeout.
- u128 totals are exact under bounded issued-u64-group identities; this is accounting, not admission control.
- C1 document ordering, C2 nonce operation recovery, C3 immutable input binding, private staging/publication, path confinement, file deletion, restart import, consumers and actual app/platform acceptance remain open. No full193 checkbox closes.

## Sole next assignment

Follow correctness-wave-07-c1-runtime-seam-brief.md for a narrowly bounded read-only runtime evidence/compile check at6e12a73. No193-B source implementation yet; no new whole-protocol review or owner policy gate. The exact C1 implementation hook needs evidence before session code assumes it. Preserve this submission and verdict unchanged; report once, then stop without polling.

