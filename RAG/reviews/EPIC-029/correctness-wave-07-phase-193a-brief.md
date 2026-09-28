# Wave07 / IMP-193 slice A — native ownership kernel

Review Lead -> Code Lead,2026-09-07. PROJECT-RECORD rev0.71 §§4,6,12 and numbered amendment193-01 govern. This is implementation authority for one small native foundation, not a third general protocol review or the whole193 ticket.

## Exact base and prerequisites

Use existing candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01 at clean **a0d9dd0be5441095ef12f5bf98c225aee02281d4**. Verify source/base/status before editing. All six native prerequisites022/019/021/027/029/030 are locally accepted; frontend181/192/182/183 is already present. Full193, immutable inputs, real native lifetime and main integration remain unaccepted. Planning carrier is separate and dirty by design, based at2cc2000.

Read current candidate AGENTS.md/CLAUDE.md, planning PROJECT-RECORD §§4/6/12, ticket RAG/AI-IMP/AI-IMP-193-native-artifact-admission-and-release-ownership.md, accepted round-02-verdict.md C1–C3 and correctness-wave-06-native-delta-review.md. Historical pressure holds in those immutable reviews are superseded only by rev0.71's explicit owner choice.

## Owner ruling

Owner accepts active-session accumulation with safe unused-file/flush cleanup. Select retention-only R; no new hard admission quota, fail-closed capacity response, overflow bound or cross-class eviction. Preserve fast-switching caches and independently owned bytes. Disk-full/write failure still needs honest safe rollback in later IO integration. Flush never deletes accepted owners or automatically discards persistent clipboard/snapshot copies. No installed-app, runtime cache, timer or UI changes.

## Exact current source fence

At most these five candidate paths (optional files need not be created):

- tauri-app/src-tauri/src/artifact_ownership.rs(new): cohesive in-memory native group/lease/reclamation registry.
- tauri-app/src-tauri/src/artifact_ownership/types.rs(new, optional): domain IDs/state/error/accounting types only.
- tauri-app/src-tauri/src/artifact_ownership/tests.rs(new, optional): focused kernel tests only.
- tauri-app/src-tauri/src/lib.rs: expose module, retain all existing exports.
- tauri-app/src-tauri/tests/audit_artifact_ownership.rs(new): permanent public-kernel regressions.

Use smaller scope if cohesive; flag LOC threshold rather than silently split elsewhere.

No manifests/locks/new dependencies, commands/main/cache/FFmpeg/Values/grid, frontend/bridge/store/session/bootstrap, filesystem adapters, profiling/core, evidence, spikes or other candidate RAG. Lead owns ticket/index/record and Git. Future193-01 topology allowances are NOT current edit permission. No commit, rebase, fetch/push, branch/config change, app/package build/launch, live cache scan/delete, install or polling. Ordinary compilation/tests are authorized.

## Implemented kernel contract

This slice factors the smallest reusable library core for later registry wiring. No filesystem path is accepted for deletion; do not pretend metadata proves on-disk completeness. Names below are semantic descriptions, not a mandatory giant API.

1. Native-issued opaque backend-instance, group, lease and reclaim-ticket identities. New registry instances reject old/foreign capabilities even if internal counters coincide. IDs are not logical media IDs/content hashes/client nonces. Use existing dependencies or standard library; checked counter exhaustion must not wrap or alias. Public constructors must not allow arbitrary raw IDs to stand in for native grants.
2. Trusted-native complete-group metadata registration establishes one initial lease atomically, with a class and measured total bytes. Producer verification/file membership dedup is later, not fabricated here. Return a group plus lease; adding leases never charges bytes again. No external-input/SourceGenerationId/C3-byte capability is inferred.
3. Exact release is idempotent and cannot release another lease, change another group or acquire an owner after retirement. At zero leases the group remains resident and accounted, eligible for class-specific retention selection. A lease is one exact native ownership token, not a JS refcount. Session/semantic-owner/operation-nonce mapping and C2 retry are later slices.
4. Reclamation is two phase: atomically claim an eligible zero-owner group and obtain a fresh reclaim ticket; while claimed, no acquire can succeed. Confirm success removes resident accounting/record; report failure returns it to eligible resident state. Old/double/wrong tickets cannot reclaim a subsequently acquired or newly claimed group. No registry lock is held across future IO; current methods do no IO. Require serialized mutation through &mut self (future shared mutex adapter) or equivalent; tests can exercise one Arc<Mutex<actual registry>> with barriers, no duplicated model.
5. Retention selection is class-explicit. Expose zero-owner candidates for a requested class and claim one by capability; do not implement a global flush-all or automatic unowned deletion. Persistent clipboard/snapshot classes are distinguishable from transient output/staging classes so later policy cannot mistake them for transient garbage. No timer, age policy change or invented class budgets.
6. Published resident bytes count once per group/class, including zero-owner and reclaim-in-progress groups until confirmed removal. Report live-owned versus eligible/claimed counts clearly. No staging/reservation implementation in this slice. Use overflow-safe representation/calculation; do not silently wrap totals or convert reporting saturation into admission rejection. If the chosen integer representation cannot retain exact totals, disclose/test its defined saturation while release recomputes correctly rather than permanently corrupting totals. Resource/ID allocation failures are not invented storage-policy quotas.
7. Keep the API small and real; no placeholder success paths, public unsafe test mutators, guessed Tauri lifecycle hooks, full protocol scaffold, fake filesystem validation or dead broad session framework. Unforeseen concrete requirement outside this slice: stop and ask for a numbered amendment.

## Permanent acceptance cases

Exercise actual library API:

- Two leases on one multi-file-sized group metadata charge it once; releasing either leaves the other valid and prevents reclaim. Last exact release leaves bytes resident until successful reclaim.
- Duplicate/wrong-group/stale lease release cannot underflow or affect another group. Define benign repeated release versus typed foreign/unknown rejection explicitly.
- Acquire wins first: reclaim fails and bytes remain protected. Claim wins first: acquire fails until a failed-reclaim rollback; successful confirmation makes old IDs permanently unusable. Deterministic barrier tests through the real registry plus lock demonstrate both orders without sleeps.
- Failed reclaim retains all accounting, can be retried with a new ticket, and stale first-ticket completion cannot retire the newer claim or its subsequently reacquired bytes.
- Repeated confirmation and aborted/retried claims do not double subtract; independent groups/classes remain unchanged.
- A new backend rejects prior backend group/lease/reclaim IDs even with repeated local sequence values.
- Transient selection excludes clipboard/snapshot groups; zero-owner persistent metadata remains resident unless its own class is explicitly selected and claimed.
- Overflow-sized metadata/accounting paths are tested without huge real files; release returns honest totals. Normal multi-group/class totals and zero-byte groups remain valid.

This is a new module: missing-module/compiler failures are NOT regression evidence. Report baseline nonexistence and executable positive/negative state-transition cases honestly; no pretend old-production failure. No real byte preservation, symlink/hardlink confinement, manifest, C1–C3, producer transport or installed-app claim yet.

## Gates and handoff

From candidate tauri-app: npm run test -- --run; npm run check; npm run lint; npm run format:check; node --test scripts/profiling/*.test.mjs. From native: cargo fmt --all -- --check; cargo clippy --workspace --offline -- -D warnings; cargo test --workspace --offline; cargo test -p color-core --offline --no-default-features --test kmeans_snapshots; cargo tree -p color-core --offline --edges normal. From root: node --test scripts/svelte-event-guard.test.mjs; git diff --check. Baseline473renderer/36,92native+one intentional ignored emitter, Node88/event10/scalar1; preserve every existing suite. Record actual toolchain/platform, exact counts, warnings and unrun gates. Use pipefail for any piped command.

Leave source uncommitted. Write only planning RAG/reviews/EPIC-029/correctness-wave-07-phase-193a-submission.md with exact base/status, complete touched/new path SHA256 manifest and diff serialization, API/state invariants, actual test counts/order coverage, overflow semantics, unchanged-path preservation, LOC crossings and candid friction/limits. Do not check aggregate193 items or claim deletion/lifecycle complete. Notify existing lead task019f7c75-2b8b-7882-9df7-0cdc1e494671 with report path/hash, then stop without polling or starting193-B. Lead will independently review, reproduce counts, commit and assign the next bounded integration.
