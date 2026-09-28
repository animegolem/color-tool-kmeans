---
submission: epic-029-code-lead-review
verdict: amend
branch: codex/remediation-planning-2026-09-04
commit: 2cc2000bce04ce2e6bda11a2853dd42595946980
round: 1
reviewed: 2026-09-04
submission_sha256: 15cbe4ed17de9d7aaed8d731c0167aaaa50af814879595080a6e4cf5c9ddb901
implementation_authorized: false
---

# EPIC-029 Round 01 Review Lead verdict

**AMEND — useful review accepted as input; no implementation assignment yet.** The commit above is the planning checkout base, not a claim that its uncommitted documents were committed. The hash identifies the reviewed report. Preserve Round 01; return corrections in a new Round 02 file.

## Evidence independently checked

- Live local main and origin/main resolve to `5baa20e021855fbc57aebf48fa0f9b3374ded281`; divergence from immutable sweep `f427ff4` is **4 / 33**. Main is clean. Planning and performance worktrees remain based at `2cc2000`; this verdict does not rebase either.
- The intervening commit changes `color-core/src/analyze.rs:220` from stdout to stderr logging. It does not repair renderer fixture paths or invalidate the control-flow diagnoses.
- The performance worktree has the exact one-line renderer fixture repair, an extracted `color-core/src/kmeans_tests.rs`, and a ticket marked completed. All remain uncommitted and unaccepted. This is not an integrated performance release.
- `color-core/tests/color_goldens.rs:25-29` uses its own `CARGO_MANIFEST_DIR/tests/fixtures/color_golden.json`, which exists. **Round 01 incorrectly includes the Rust fixture reader in SEP-01.** Only the TypeScript relative path is broken. A filesystem resolution check confirms the old TS target absent and proposed target present; no Rust build or full suite was rerun.
- Sweep `HomeView.svelte:229-233` really passes an id-only cast to seed logic; `stores/image.ts:197-218` really increments revision while optionally preserving old Colors analysis. The requested frontend fence amendments are justified.
- `frame-snapshot.ts:23-31` explicitly describes copying snapshots to persistent storage. Existing native policy uses 30-day retention, 512 MiB clipboard/Values budgets, 1 GiB snapshots, and separate video counts. These are not one approved universal hard admission quota.
- No application code, performance working tree, original sweep, or main was edited for this verdict. Historical test counts were not rerun or represented as new passes.

## Accepted directions

- All twelve SEP issues remain credible, subject to the Rust-reader citation correction. SWEEP-006 and SWEEP-008 concern **Values**, not “Batch” as two review rows say.
- Approve separate user-selection intent, content identity, and requested/settled frame state, with Amendment 3's ownership qualification.
- Approve exploration of **one native registry** with private staging, immutable publication, idempotent leases, revocation and managed-root confinement. Do not introduce a second JS-only refcount authority or a database without a demonstrated need. Exact lifecycle/admission protocol is **not** approved until Amendments 4–6 are answered.
- Keep IMP-189, IMP-190 and IMP-194 optional backlog. They do not block required acceptance.
- At most two implementation writers later, on expressly disjoint files; shared frontend hooks serialize. This is a scheduling ceiling, not present coding authorization.

## Numbered amendments

### 1. Refresh the candidate base without rewriting historical evidence

Current integration floor is `5baa20e`, or a newer exact tip independently checked before assignment. Preserve the stderr correction. Keep historical observations at `2cc2000` labeled with their original base; do not retroactively relabel the earlier executed tests as having run on newer main.

The manifest and project record now distinguish planning checkout from integration floor. Do not rebase the dirty planning worktree or another task's branch to make those names match.

### 2. Resolve fixture ownership without blocking it on all performance work

IMP-179 remains the sole remediation carrier for the renderer golden-path issue. Reuse the already prepared one-line IMP-178 patch; do not ask another agent to rediscover it or create two fixing commits. Record its supplied provenance.

At integration, whichever accepted candidate first contains the repair supplies the one implementation: if performance lands first, validate and record IMP-179 as satisfied by that exact commit; otherwise adopt the isolated renderer repair under IMP-179, leaving the performance worktree untouched and recognizing the hunk as already integrated when performance is later reviewed. Completion is not marked until the accepted-base tests pass.

Do not force the baseline fixture repair, source-copy safety or unrelated low-risk sweep changes to wait for acceptance of the entire numeric optimization package. **Only overlapping math changes** need the coordinated accepted k-means shape. No production changes are authorized by this ruling alone.

### 3. Separate stable data identity from transient execution authority

Use these semantic distinctions; concrete type names can vary:

- `selectionEpoch` orders active-selection intents. A current completion validates rather than increments it.
- `contentRevision` invalidates data-dependent caches on replacement. It must never silently reset on same-ID re-admission such that an old completion becomes valid again. A revision may be conservatively new when sameness cannot be proven; do not promise content-hash equality from metadata alone.
- Stable frame identity identifies the source revision and actual settled frame/sample identity, including relevant extraction settings. **Do not put a transient decodeToken into the equality key of reusable frame content.**
- A request/decode token and view owner are separate authority. A new restore request gets new authority while comparing against the cached frame's stable identity. RestoreIntent binds both; new seek/step/replacement/disposal revokes it.
- Requested playhead and settled pixels remain separate; a successor view reacquires a mismatched frame.

Qualify “every analysis captures selectionEpoch”: active-view publication must obey selection authority, but an explicitly started export or background Batch/cache computation has its **own job ownership**. Merely selecting B must not silently retarget, cancel or strand an independently owned export of A. Cache publication still validates its source revision and request/job token.

Required tests include positive exact restore across new request tokens, replacing/removing/re-adding the same logical ID, and an A export surviving selection of B with unchanged source provenance.

### 4. Make acquisition and publication sequencing possible across async IPC

“Acquire every lease before the first await” is not implementable literally through an asynchronous Tauri bridge. The rule is:

1. Capture the intended job descriptor synchronously before the first await.
2. Use a native admission/acquisition transaction to validate identities and retain all required managed inputs (and establish an owned external-source snapshot) before dependent decode/render/read/save work.
3. On return, validate the relevant job owner and revision; if the acquisition lost its race, release/cancel explicitly. Never proceed with a partial dependency set or a reread of current selection.
4. Complete ownership transfer before exposing an accepted result; handle failure between native publication and frontend acknowledgment, not only the happy path.

Return exact API boundaries and tests for acquire-vs-remove, publication-vs-revoke, ACK loss and atomic multi-input acquisition. State what happens when removal occurs after an export retained A but before a later export subanalysis admits. Do not leave exported jobs simultaneously “independent” and unconditionally rejected by a shared source tombstone.

### 5. Model renderer replacement, backend restart and retention separately

A renderer reload does **not** necessarily restart the native process. Native jobs, leases and queued IPC can outlive the JS instance. Introduce or reuse a backend-validated client/session lifetime and define disposal/replacement behavior for pending response leases, semantic owners and active native job leases. Do not rely on a dead renderer eventually calling `finally`.

A native restart, renderer reload and view unmount are three distinct transitions. Demonstrate each. A source revision counter must not collide after renderer reconstruction while backend tombstones remain alive.

Reject the blanket proposal to delete all snapshots and clipboard artifacts at startup. Preserve existing persistence/retention classifications until an explicit policy change is approved. Invalid staging and newly introduced session-only Batch orphans may be reclaimed by the defined ownership contract; legacy complete caches need an explicit compatibility/migration rule, not an assumption that “no new manifest” means disposable user intent.

### 6. Cache pressure remains an owner decision, not an implied refactor

The owner has been asked whether a genuinely exhausted managed-cache limit should reject new work with a recoverable error or allow bounded temporary overflow. Existing accepted results must stay safe either way.

Pending that answer, return a concrete budget proposal: existing retention limits versus new admission limits, per-class versus global accounting, reservations for concurrent/staging jobs, unknown-size growth, oversized single jobs, double-counted groups, failure cleanup, and retry UX. Do not quietly convert existing cleanup targets into new hard product limits.

Lead recommendation is fail-closed **for new work after reclaiming unowned artifacts**, while preserving existing jobs/results; no budget values or pressure policy are approved yet. No indefinite wait for capacity held by the waiting job's own inputs.

### 7. Exact file-fence amendments

The lead synchronizes the following into tickets. These are scoped allowances for a later assignment, not permission to implement now:

- IMP-181: add HomeView.svelte.
- IMP-182: add HomeView.svelte and stores/video.ts; serialize after IMP-192.
- IMP-184: add the dedicated ownership bridge/spec, source-snapshot helper/spec, and analysis/Values store acceptance-result hooks plus Values lifecycle tests.
- IMP-185: add Values bridge, IPC contracts/spec, Values store/lifecycle tests and Values runner/ownership integration spec. This makes its frontend work overlap IMP-184: **serialize those hooks**.
- IMP-186: add compose bridge, IPC contracts/spec and Batch export runner/ownership spec.
- IMP-187: allow the performance-extracted kmeans_tests.rs only on a coordinated accepted base; do not create a duplicate test module beside it.
- IMP-192: add ValuesView.svelte and its video-scrubber module.
- IMP-193: add IPC contracts/spec, dedicated ownership bridge/spec, frontend session bootstrap surfaces, and snapshot lifecycle hookup. Keep native ownership in its existing native file fence.
- IMP-180: test-file shape is conditional on the accepted math base; original historical-register import and generated index stay Review-Lead-owned.
- IMP-191: final record/index/status work stays Review-Lead-owned.

### 8. Revise wave ordering and avoid a false dependency cycle

Use the seven-wave outline as a proposal with these corrections:

- Baseline repair is independently integrable; no blanket IMP-178 dependency.
- Adoption may prepare disjoint low-risk patches while math ownership is resolved; source-copy protection should not wait behind a new registry design.
- Serialize frontend identity as 181 →192 →182 →183.
- The RT-07 math patch must be accepted with both meaningful-reseed and unchanged-degenerate cases satisfied. Prefer one semantically adapted SWEEP-012 patch tagged with IMP-187 provenance for this same issue; do not require an intentionally deficient intermediate commit just to reproduce old history.
- IMP-187 depends on baseline repair and its explicit coordinated math prerequisites, **not completion of the aggregate IMP-180 adoption ticket**. Both original and residual evidence are recorded in the source mapping.
- Native ownership, export leases and Values publication share frontend files. Native-only preparation can overlap; frontend integration cannot.
- IMP-186 still requires 184+185; isolated scroll restoration can be early. Final acceptance remains independent.

## Next submission and channel state

Return **only** `RAG/reviews/EPIC-029/round-02-code-lead-review.md` in the existing planning worktree. Do not overwrite Round 01, alter tickets, implement code, run heavy gates or mutate git. Include frontmatter identifying round2, planning base, live source base(s), and the input verdict; label the uncommitted document basis honestly.

Focus on Amendments 3–6 and the corrected wave/fence map, not another whole-repository audit. You can complete the protocol alternatives while the owner considers cache pressure; report that choice as pending rather than guessing. Notify Review Lead on submission. No polling loop is requested.

No implementation, commit, merge, PR, or release is authorized or accepted by this verdict.
