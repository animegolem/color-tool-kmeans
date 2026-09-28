---
node_id: AI-LOG-2026-09-04-remediation-reconciliation
tags:
  - AI-log
  - development-summary
  - audit
closed_tickets: []
date_created: 2026-09-04
related_files:
  - RAG/PROJECT-RECORD.md
  - RAG/AI-EPIC/AI-EPIC-029-control-flow-remediation.md
  - RAG/reviews/EPIC-029/round-01-brief.md
confidence_score: 0.93
---

# September control-flow reconciliation

## Work Completed

Three read-only reviewers independently traced frontend ownership, native artifacts/numerics, and exports/shared helpers. The review lead reconciled their results against current refs, active worktrees, original tickets, and the July central register, and reproduced the main test failure. This is a review and planning delivery, not a remediation completion.

### Baseline and evidence notation

- **M:** fetched main/origin main `2cc2000bce04ce2e6bda11a2853dd42595946980`, checkout `/Users/golem/git/color-tool-kmeans`.
- **S:** sweep `f427ff40bf6efa2e332c9705830048e1b5cfe8bd`, branch `codex/control-flow-sweep-2026-07-19`.
- Common ancestor `28d9e8415736cc82154fbcc2dfb90b70157ac6cf`; `git rev-list --left-right --count main...codex/control-flow-sweep-2026-07-19` returned **3 / 33**.
- Main renderer is byte-identical to the common ancestor. Main's three newer commits extract, test, and document `color-core`; they do not adopt the sweep.
- Source locations below are repository-relative, qualified by M/S. `src/` in frontend rows means `tauri-app/src/lib/`; native rows use `tauri-app/src-tauri/src/`.
- **Executed:** an existing test or actual-source in-memory probe was run this turn. Probes inject mocked dependencies/timers and rune shims; they are not mounted-app or native acceptance tests.
- **Source-confirmed:** concrete call/control-flow trace with triggering sequence; no new executable regression run. All new regression work remains unchecked.

### Original 22 defects: current disposition

All 22 remain applicable to M. “Addressed in S” means the specific original boundary appears corrected in that branch, not accepted on main. Follow-up items may block that correction's integration.

| Finding | Priority | Main boundary / defect                                                                | Source patch  | September disposition                                                       |
| ------- | -------- | ------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------------------------------- |
| RT-01   | P1       | Native commands.rs:100-111 self-copy can truncate source                              | SWEEP-002     | Addressed in S; adopt with alias/failure/platform tests                     |
| XC-01   | P2       | src/views/exports/ runners bypass ownership and miss retry                            | SWEEP-001/015 | Original boundaries addressed; IMP-184 job-source gap remains               |
| FE-01   | P2       | src/stores/image.ts:348 raw-video timer defeats newer selection                       | SWEEP-013     | Timer addressed; dispatched probe requires IMP-192                          |
| FE-02   | P2       | HomeView.svelte:449 and Values ingestion retain unmounted authority                   | SWEEP-023     | Disposal addressed; replacement-view handoff requires IMP-183               |
| FE-05   | P2       | src/stores/image.ts:161 same-path replacement keeps Colors cache                      | SWEEP-010     | Store invalidates; IMP-181/182 runner/restore identity still wrong          |
| FE-06   | P2       | src/stores/multi-analysis.ts:51 tracks pin IDs without revision                       | SWEEP-017     | Revision added; require pending and cache-restore integration coverage      |
| RT-02   | P2       | Native compose_grid.rs:96-101 concurrent requests overwrite same file                 | SWEEP-019     | Unique paths address overwrite; IMP-186 retention missing                   |
| RT-03   | P2       | Native value_analysis.rs:116-129 accepted paths remain writable                       | SWEEP-021     | Partial; same-generation publication still unsafe, IMP-185                  |
| FE-03   | P3       | src/views/home/video-controller.svelte.ts:120 cached seek leaks to fresh video        | SWEEP-003     | Original reset addressed; cached restore identity IMP-182                   |
| FE-04   | P3       | src/stores/image.ts:280,374 removal/clear retain Values tokens                        | SWEEP-006     | Addressed; test late success and error with token-aware export callers      |
| FE-07   | P3       | main.ts:53; src/stores/prefs.ts:260 unordered hydration/writes                        | SWEEP-016     | Addressed; retain failed-write recovery and delayed hydration tests         |
| FE-08   | P3       | src/views/values/video-scrubber.svelte.ts:73; ValuesView:157 old pixels/new timestamp | SWEEP-008     | Settled capture addressed; preserve it through IMP-183                      |
| FE-09   | P3       | src/services/media-ingestion.ts:52 late raw thumbnail overwrites frame                | SWEEP-018     | Expected path/revision/raw-entry guards address original case               |
| RT-04   | P3       | Native main.rs:75-78, ffmpeg.rs:167,262 runtime pruning deletes live paths            | SWEEP-022     | Blind pruning removed; IMP-186/193 complete ownership/reclamation           |
| RT-05   | P3       | Native ffmpeg.rs:177-183 tolerance omits barcode tail                                 | SWEEP-007     | Addressed in S with cap-boundary tests                                      |
| RT-06   | P3       | Native value_analysis.rs:391-415 alpha discarded before counting                      | SWEEP-014     | Production handling coherent; vacuous artifact test corrected under IMP-185 |
| RT-07   | P3       | color-core/src/kmeans.rs:165-187 reseed bypasses convergence movement                 | SWEEP-012     | Original premature exit addressed but degenerate loop regression, IMP-187   |
| XC-02   | P3       | src/views/BatchView.svelte:195-212 duplicate ingestion creates phantom pins           | SWEEP-005     | Shared ingestion uses retained IDs                                          |
| XC-03   | P3       | App.svelte:227-244 clipboard bytes written as PNG regardless of MIME                  | SWEEP-011     | MIME-derived extension addresses original issue                             |
| XC-05   | P3       | src/services/drag-drop.ts:31-50 partial listener acquisition leaks                    | SWEEP-004     | Failure-atomic rollback implemented                                         |
| XC-11   | P3       | src/views/BatchView.svelte retains result but hides error/disables retry              | SWEEP-020     | Failed-refresh retry and visible error implemented                          |
| XC-04   | P4       | File picker/media registry omits .tif                                                 | SWEEP-009     | Shared registry includes .tif                                               |

The original count remains **22 defects: 1 P1, 7 P2, 13 P3, 1 P4**. Do not add every follow-up below to that count: most are incomplete acceptance boundaries of those same issues.

### Seven unification/hardening families

| Family                              | S status                                                     | Current treatment                                                                        |
| ----------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| XC-06 typed Batch compute path      | SWEEP-025 implemented                                        | Adopt current bridge; no second raw-invoke pipeline                                      |
| XC-07 media IPC response validation | SWEEP-027 implemented                                        | No concrete validator bug found; hand-authored tests are not Rust serialization parity   |
| XC-08 export helper forks           | SWEEP-031 chart save and SWEEP-032 Notan mapping implemented | Generator/dimension and palette-save slices stay optional IMP-189/190                    |
| XC-09 color formatting              | SWEEP-026 implemented                                        | Original candidate section lacks completion note; summary/history confirm implementation |
| XC-10 scroll locking                | SWEEP-028 implemented                                        | Extraction retains queued callback defect, IMP-188                                       |
| RT-08 blocking native work          | SWEEP-029 implemented                                        | Executor placement only; no measured severity escalation or cancellation claim           |
| RT-09 artifact/process helpers      | SWEEP-022/024/030 implemented                                | Process/ID extraction sound; retention partial IMP-186/193                               |

## September residual register

### SEP-01 / AI-IMP-179 — current main's golden test points at a removed fixture (P3, executed)

M `tauri-app/src/lib/exports/__tests__/color-goldens.spec.ts:27-30` still opens `src-tauri/tests/fixtures/color_golden.json`. Core extraction moved the canonical fixture to `color-core/tests/fixtures/color_golden.json`. Full Vitest fails ENOENT. Update the canonical path, not the golden bytes or a duplicate fixture.

### SEP-02 / AI-IMP-181 — invalidation does not revoke Colors dedup identity (P2, executed probe)

S `src/views/home/analysis-runner.svelte.ts:58-104`: cancellation leaves `lastRequestKey`; schedule compares only ID and parameters, then returns when status is not error. `file-ingestion.svelte.ts:98,119-125` cancels, invalidates the same-path file, and schedules the same key. Actual-source probe: seed prior key → cancel → schedule idle same ID → **0 timers, expected 1**. Source revision must participate without breaking a genuine unchanged cache restore.

### SEP-03 / AI-IMP-182 — cached-restore permission is not bound to the restored frame (P2, executed probe)

S `src/views/home/video-controller.svelte.ts:550-551,625-635,357-367`: a boolean restore flag survives a user step and authorizes `preserveColorAnalysis` for the different decoded frame. Probe: cached frame at 7 s → step during restore → **decoded7.0416667 s, preserve=true, analysis requests 0, seeded keys 1**. Bind restore eligibility to exact source/frame/parameters/generation and revoke on seek/step.

### SEP-04 / AI-IMP-183 — Home disposal leaves Values on old pixels with a new playhead (P2, source-confirmed)

S Home controller `:625-636,812-830` publishes the stepped time then cancels decode on dispose. S `ValuesView.svelte:179-198` analyzes the settled file and reacquires only if absent or a different video path. A same-path frameTimestamp mismatch survives navigation. Require successor acquisition during both debounce and active IPC, without allowing the disposed owner to publish.

### SEP-05 / AI-IMP-184 — an export job can mix files and adopt a later name (P2, executed probe)

S `src/views/exports/values-export-runner.svelte.ts:55,117-122,165-170,216` captures fileA for initial work but repeatedly calls a helper that rereads current file; it also names at completion. Deferred actual-source probe: start A, select B while awaiting → analysis calls **A/3, B/2, B/3, B/4, B/5**, left column A, right panels B, saved **B-values.png**. Snapshot source/config/name at job start and retain required bytes/artifacts or explicitly cancel. Audit all three export runners at the same boundary.

### SEP-06 / AI-IMP-185 — Values generation directories are not immutable publication (P2, source-confirmed)

S native `value_analysis.rs:127-134` shares deterministic source-path/mtime/length directories among simultaneous same-generation misses; `:174-185` decodes twice; `:198,261-263` writes final PNGs directly; `:696-700` ignores metadata-write errors. A second writer can truncate a path already returned by the first, and source replacement between reads can mix inputs. Existing `tests/audit_value_cache.rs:85-122` races different sources only. Use one owned source snapshot, staging, and atomic admission/complete-error handling. The alpha-zero test at `:873-880` checks one directory too high; its partial-artifact assertions are vacuous.

### SEP-07 / AI-IMP-186 — unique Batch grids have no reclamation path (P3, source-confirmed)

S native `compose_grid.rs:97-111` keeps each temporary PNG. `cache.rs:74-162` startup and explicit removal omit Batch; `src/services/artifact-cleanup.ts:4-9` only sees ImageEntry paths, not Batch composites. Superseded, failed, and stale generations leak **across restarts**. Model accepted/in-flight owners and release them, with startup recovery for abandoned generations.

### SEP-08 / AI-IMP-187 — reseeding unchanged empty centroids forces max iterations (P3, source-confirmed)

S old native `kmeans.rs:167-188` unconditionally sets reseeded=true for an empty cluster. For uniform data with k>1, every seed equals the existing centroid; convergence stays disabled until max_iters (20 Values, ordinarily40 Colors), whereas M exits after one iteration. This is an iteration-count proof, not a measured timing claim. Correct material-reseed convergence in current `color-core/src/kmeans.rs`; coordinate independently owned IMP-178.

### SEP-09 / AI-IMP-188 — canceled scroll restoration still mutates a successor container (P3, executed probe)

S `src/services/analysis-scroll-lock.ts:48-61` validates before queueing, clears its lock, then finds the current container inside a microtask/rAF. Later clear/unmount cannot revoke that closure. Probe: capture 240 → restore → clear → replace container at 600 → flush → **240, expected 600**. Capture container identity and validate ownership at execution; test cancel after enqueue, not just before restore.

### SEP-10 / AI-IMP-192 — a dispatched Values probe can defeat a later bucket still selection (P2, executed probe)

S `src/stores/image.ts:342-362` selects stillB without revoking the Values loader's generation. S `src/views/values/file-ingestion-values.svelte.ts:51-84,154-158` advances that generation only for loader requests/image ingestion/dispose. Probe A already dispatched → bucket selects B → A resolves → **videoState=/A.mp4, expected null**. A canonical selection epoch must cover bucket, dialog, replacement, clear and removal, checked by completion.

### SEP-11 / AI-IMP-193 — cleanup does not own queued/running native work or cached video references (P3, source-confirmed)

S native `main.rs:28-45` removes an image cache tree independently of `commands.rs:18-26` queued workers. A queued worker can start afterward and recreate removed artifacts; active publication can race deletion. `src/stores/video.ts:19-36` retains frame/poster/strip refs; individual `image.ts:316-341` removal does not evict/release them, and clear drops them at 411 without cleanup. Propose a minimal admission/lease/release contract before coding; frontend token rejection is not native cancellation.

### SEP-12 / AI-IMP-194 — extensionless snapshot labels are mistaken for filenames (P3, executed probe; optional)

S/main `src/services/frame-snapshot.ts:55-58` creates display labels such as `clip.v1 @ 00m01s`; Colors baseName (M127/S145) strips everything after the last dot as an extension. Probes at 1 s and 2 s both become `clip`. No data loss demonstrated; PNG content is correctly labeled. Preserve source version and time using explicit label/filename semantics; optional low-risk follow-up after job snapshot work.

### Denoising and rejected leads

- FE/XC scroll findings are the same SEP-09, not two tickets. Snapshot naming is adjacent to job provenance but isolated as optional IMP-194.
- RT-08 remains narrow executor-placement hardening; native lifetime ownership is separately specified in IMP-193.
- No current alpha-sentinel consumer bug found: native preview checks255 before indexing, renderer preserves the map and does not index it into bucket arrays.
- Nested Values statistics already recurse (`value_analysis.rs:380-392`); the missing retention class is Batch, not a flat-directory scanner bug.
- Artifact-ID parity test calls the same helper three times; strengthen real-producer coverage during adoption, but current production callsites align.
- Atomic-copy behavior is coherent for aliases. General `save_file` failure-atomicity remains a separate design-sensitive adjacent concern; no new failure-injection repro ran, so it is not counted as a confirmed finding here.
- Deferred IMP-124 owns broad Home/Values extraction unification. EPIC-027 owns layout, EPIC-026 live playback, and IMP-178 numerical performance. Do not reticket these as audit bugs.

## Session Commits

None. Planning branch `codex/remediation-planning-2026-09-04` starts at M and contains documentation only. Main, sweep, and performance worktrees were not edited. Full original SHA manifest is `RAG/reviews/EPIC-029/sweep-adoption-manifest.md`.

## Issues Encountered

“Completed” in the old register described the July sweep branch, not main or September acceptance. Its historical **35 files / 235 tests** pass is not current validation. The new core extraction and active performance lane require semantic reconciliation, not a blind merge.

Read-only `git merge-tree --write-tree main codex/control-flow-sweep-2026-07-19` exited1 with conflicts in RAG/INDEX.md, native Cargo.toml, commands.rs and lib.rs. It changed no checkout/ref. Preserve core delegation/re-exports, map k-means changes to color-core, and regenerate INDEX.

No native builds/benchmarks were run during this review, avoiding interference with active performance measurement. No code-lead task was started; the first brief is review-only. Runtime cache pressure policy and implementation activation remain explicit lead/owner choices.

A live-video handoff arrived during planning. Live `gh pr view 4` verifies [PR4](https://github.com/animegolem/color-tool-kmeans/pull/4) is OPEN, non-draft, head 7687642, and **CONFLICTING** against main. Its four successful checks are dated July 19. Thus the handoff's “mergeable” claim is stale; no native benchmark or new-base acceptance is inferred from it.

Independent native review of the draft corrected two planning boundaries: IMP-180 must coordinate its k-means adoption with IMP-178, not merely wait until IMP-187; IMP-186 now depends on export lease integration in IMP-184 and includes an export-reader-versus-cleanup regression.

## Tests Added

None. Additional probes ran actual TypeScript in memory with deferred bridge/render dependencies and mocked timers; they did not write permanent tests. Findings specify the missing acceptance regressions.

Current validation:

- M `npm run test -- --run`: **15 passed files, 1 failed file; 178 passed tests, 1 failed test**. Failure is ENOENT in color-goldens.spec.ts; IMP-179.
- S focused IPC contracts, color-format, Values chart-save, scroll-lock suites: **4 files / 13 tests passed** (221 ms). Existing scroll suite does not cover cancel-after-enqueue.
- Full check/lint/format/native gates were not rerun this planning turn. Required implementation gates are in PROJECT-RECORD section 6.
- Planning validation passed: 16 distinct tickets (13 planned, 3 backlog), matching epic membership, acyclic dependencies, 21 authored documents with resolving local Markdown links, and no premature completion dates/checks.
- INDEX was regenerated twice with identical SHA-256 `6894a6b13ebc8b73b68a3a6288fd9e0a1d34af3ef53533a7e398b2087a32727b`; `git diff --check` passed. Targeted Prettier formatting was applied to the authored planning documents.
- Main and original sweep remain clean at their recorded tips. Planning changes are documentation only, uncommitted; these checks do not turn the production gate green.

## Next Steps

### Round 02 lead disposition

The focused addendum was accepted as a design basis, not code, with three binding clarifications: stale bootstrap cannot replace a newer renderer; a live client can recover/cancel an operation by nonce after losing its grant/result; cached results must match the exact retained export input, not merely an opaque source generation or path metadata. Both input reports are preserved by hash. No application tests/builds ran for this protocol review. Main/remote main remain `5baa20e`, divergence **4 / 33**.

General protocol review is finished; no third round is requested. Owner capacity behavior/parameters and an explicit bounded coding assignment remain pending. The native quota question does not globally block baseline repair or disjoint source adoption. Shared consumer order is Values185 → export184 → Batch186.

### Round 01 lead follow-up

Code Lead submitted a review-only report, now preserved alongside the numbered AMEND verdict. Main/origin main advanced to `5baa20e`, with divergence **4 / 33**; earlier executable evidence in this log remains at its recorded `2cc2000` base. The one-line renderer fixture repair already exists uncommitted in IMP-178 and will be integrated only once. The review's additional assertion that the Rust golden reader is broken was rejected: its crate-relative fixture exists.

The lead approved separate intent/content/execution identity and a single-native-registry design direction, but requested precise async acquisition/ACK, renderer reload, source-revocation and persistence semantics. Blanket startup snapshot/clipboard deletion is rejected. Cache-pressure behavior was asked of the owner and remains pending. Ticket fences and ordering were amended; no code or acceptance status changed. Round 02 is a focused protocol addendum, not another whole-app audit or a coding assignment.

Review EPIC-029 and PROJECT-RECORD. Round 01 asks a code lead to challenge diagnosis, file fences, source ownership, and native admission/release design before implementation. Do not automatically dispatch or silently adopt a particular eviction policy.

Land the gate repair first, prepare a current-core integration candidate preserving SWEEP issue identities, then complete source/frame/export and artifact ownership corrections. Keep optional export dedup/naming separate from the correctness acceptance path. The code lead may refine execution waves within approved boundaries; this task retains decisions and acceptance.
