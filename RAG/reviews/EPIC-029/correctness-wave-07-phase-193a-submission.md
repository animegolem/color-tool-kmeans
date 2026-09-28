# Correctness wave 07 — phase193-A submission

Code Lead -> Review Lead, 2026-09-07. Implemented only the native in-memory artifact group/lease/reclamation kernel assigned by `correctness-wave-07-phase-193a-brief.md`. Candidate source remains uncommitted. No filesystem path, deletion, producer verification, source/session/operation identity, IPC, renderer/store/view, cache policy, quota, app/runtime, ticket/index/record, dependency, manifest, lockfile, profiling, evidence, installation, or Git mutation was made.

## Exact base, fence, and serialization

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- Base/current HEAD: `a0d9dd0be5441095ef12f5bf98c225aee02281d4` (`refactor(cache): unify collision-safe artifact IDs [SWEEP-030] [loc-bypass]`). The candidate was clean when assigned and HEAD did not move.
- Normative brief: planning `RAG/reviews/EPIC-029/correctness-wave-07-phase-193a-brief.md`, SHA-256 `d2e62738028f873531f9bafe7f663fd0963424c39db833f157a5ed31800e1a92`; PROJECT-RECORD rev0.71 §§4, 6, and 12 plus numbered amendment193-01.
- Candidate status is exactly the five allowed paths below: 1,257 insertions, 0 deletions. `git status --short` serialization SHA-256: `aac93038ca8b398879bb88e4f21aba76d1793a5236da86fe0e0f2f89c696ffa4`. Sorted complete five-path-list serialization SHA-256: `1ccf736f37aeca1ca17f37766cfefbd0a9ed5b6e7bcd9446775c83db52363cc5`.
- Tracked `lib.rs` full-index binary-diff serialization SHA-256: `62f4c5eab642a7620fca3a111605448561dc84d53933d58c87eb9d6ccbd58a0e`. Complete prepared-patch serialization SHA-256: `f4ae07566a7dcf35d5490637d7408b433f1ed969cb6fab56cab08a415721d98f`, computed in this fixed order from `git diff --binary --full-index HEAD -- lib.rs`, followed by `git diff --binary --full-index --no-index /dev/null` for `artifact_ownership.rs`, `types.rs`, `tests.rs`, and `audit_artifact_ownership.rs`.

| Candidate path | Base SHA-256 | Prepared SHA-256 | Delta | Purpose |
| --- | --- | --- | --- | --- |
| `tauri-app/src-tauri/src/artifact_ownership.rs` | absent | `a4bbdf1194920abde1ed9f1def8422a130630b384326aa0d324a575a7fbdd7c0` | new, 343 lines | Serialized in-memory registry and public state transitions |
| `tauri-app/src-tauri/src/artifact_ownership/types.rs` | absent | `77206a1a48a086a121e76d8f39bfca99ae620712708bf3461e130fce93f60aa8` | new, 250 lines | Opaque identities, metadata, classes, outcomes, errors, accounting, and private state types |
| `tauri-app/src-tauri/src/artifact_ownership/tests.rs` | absent | `7c398eabe80a1cab6637f7805af15b7099904be0526eb4d8dadeb6830052a612` | new, 320 lines | Seven focused kernel/edge tests, including private exhaustion controls |
| `tauri-app/src-tauri/src/lib.rs` | `837a5c30a626917a628b19ff223700077b2bafc11b99a434c7b193a124ea42d0` | `ed72f02f62650cec70bed17d6c66186291e3162cc280e3f837a3de4add3060e5` | +1/-0 | Exposes `artifact_ownership`; every existing export is retained |
| `tauri-app/src-tauri/tests/audit_artifact_ownership.rs` | absent | `33ba9004ee57b0bbe06a21a0ccd1c3bdf2e9ac8b11443ab84443856d6304dd71` | new, 343 lines | Six permanent public-API regressions, including both deterministic lock orders |

The base had no ownership module, export, or ownership regression. I therefore did not claim a prior behavioral production failure: importing a nonexistent module would only have produced the missing-module/compiler failure prohibited as regression evidence. All evidence below is executable positive/negative state-transition coverage of the new actual kernel.

## Public API and state invariants

- `ArtifactRegistry::new` issues a private 256-bit backend nonce using the existing `rand::rngs::OsRng`; inability to obtain OS randomness returns `BackendIdentityUnavailable`. `BackendInstanceId`, `GroupId`, `LeaseId`, `ReclaimCandidate`, and `ReclaimTicket` expose no raw constructors or fields and derive no serialization. Every capability check rejects a different registry before local sequence lookup.
- Group, lease, and reclaim-ticket sequences are independent checked `NonZeroU64` allocators. `u64::MAX` is issuable once; the next request returns typed `IdExhausted` without wrap or alias. Registration preflights both group and first-lease identities before mutation. Acquire and claim also preflight before changing records.
- `register_group(GroupMetadata { class, resident_bytes })` atomically creates one group and its initial exact lease. The metadata is explicitly trusted-native input for this slice; it contains no path, membership, manifest, producer, content, source, session, or deletion assertion.
- `acquire(group)` creates a new exact lease only while the group is resident and not claimed. Copying the opaque lease value does not add an owner; only `acquire` changes the active count. `release(group, lease)` verifies both capabilities and their exact pairing. First release returns `Released`; repeating the same release returns benign `AlreadyReleased`; foreign, unknown, and wrong-group capabilities are typed errors and cannot mutate another record.
- The final release retains the group and its bytes but moves it from live-owned to eligible. A versioned opaque candidate is returned only by `reclaim_candidates(requested_class)`. An acquire that wins first protects the group and invalidates the old eligibility version; a claim that wins first atomically enters `Reclaiming` and blocks acquire.
- `claim_reclaim(candidate)` returns a fresh backend/group-bound ticket but performs no I/O. `finish_reclaim(group, ticket, Removed)` alone removes the resident record and charge. `Failed` retires that ticket and returns the group to a newly versioned eligible state. Ticket tombstones make old, double, wrong-group, and late completion attempts typed nonmutations; lease tombstones preserve exact release idempotence after group retirement.
- The four explicit classes are `TransientOutput`, `Staging`, `Clipboard`, and `Snapshot`. There is no global candidate query, flush-all, automatic deletion, age policy, timer, quota, class budget, or cross-class eviction. Clipboard and snapshot groups are visible only under their explicitly requested persistent class.
- `accounting()` and `accounting_for(class)` recompute exact resident, live-owned, eligible, and claimed group/byte buckets plus active lease count from current records. Categories partition resident groups; a group is charged once regardless of lease count and remains charged while eligible or reclaim-in-progress.

State transition summary:

```text
register -> Resident(leases=1)
Resident(n>0) --acquire--> Resident(n+1)
Resident(n>0) --exact release--> Resident(n-1)
Resident(0, eligible revision r) --claim(r)--> Reclaiming(ticket t)
Reclaiming(t) --Failed--> Resident(0, eligible revision r+1)
Reclaiming(t) --Removed--> retired/absent
```

No public transition revives a retired group, releases a different lease, acquires through an active reclaim claim, or reuses an exhausted identity.

## Permanent executable coverage

Thirteen new tests execute the actual registry: six external public-kernel regressions plus seven focused in-module tests. No test was converted, skipped, ignored, or reclassified with `it.fails`.

External regressions prove:

1. one multi-file-sized byte charge across two leases, reclaim exclusion until the last exact release, resident/claimed accounting, and subtraction only after confirmed removal;
2. wrong-group and repeated releases, candidate invalidation across reacquire/release, double ticket completion, and permanent post-removal rejection of old group/candidate capabilities while exact released-lease repetition stays benign;
3. acquire-first ordering through one `Arc<Mutex<ArtifactRegistry>>`, with the acquiring mutation committed and its guard dropped before a barrier releases the claim attempt;
4. claim-first ordering through one real shared registry and three barriers: claim committed, blocked acquire observed, failed-reclaim restoration committed, then successful reacquire;
5. failed reclaim accounting, a distinct retry ticket, late first-ticket rejection during the newer claim, rollback, reacquisition, and rejection of the now-stale second ticket;
6. two registries at matching local allocation positions rejecting foreign group, lease, candidate, and ticket capabilities without mutation.

Focused kernel tests additionally prove transactional group/lease exhaustion, acquire/claim exhaustion with unchanged eligibility, same-backend never-issued IDs, wrong-ticket isolation across independent groups/classes, explicit transient/staging/clipboard/snapshot selection, exact overflow-sized and zero-byte accounting, and mixed live/eligible/claimed per-class totals. The two ordering tests use no sleep, never wait while holding a `MutexGuard`, and assert results only after both threads join.

## Overflow and retention semantics

Each group stores the measured byte count as `u64`; reports sum into `u128`. At most `u64::MAX` native group identities can be issued, so the theoretical maximum `(u64::MAX * u64::MAX)` is below `u128::MAX` and remains exactly representable. There is no saturation, wrap, conversion to an admission failure, or storage-policy quota.

The permanent test registers `u64::MAX`, another `u64::MAX`, `9`, and a zero-byte group without real files. It observes exact `2 * u64::MAX + 9`, releases all owners without changing resident bytes, removes the two maximum groups in turn to observe `u64::MAX + 9` and then `9`, and proves the zero-byte group still participates honestly in resident/eligible/live group counts and lease transitions.

## Full final-tip gates

Toolchain/platform: macOS 26.6.2 build25G83, Darwin25.6.0 arm64; rustc1.90.0 (LLVM20.1.8), cargo1.90.0, Node v26.8.1, npm11.19.0.

- `npm run test -- --run`: 473/473 passed across 36 files.
- `npm run check`: 0 errors; the two accepted AUD-020 noninteractive-tabindex warnings remain in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `node --test scripts/profiling/*.test.mjs`: 88/88 passed, none failed/skipped.
- `cargo fmt --all -- --check`: passed.
- `cargo clippy --workspace --offline -- -D warnings`: passed.
- `cargo test --workspace --offline`: 105 passed, 0 failed, 1 intentional ignored profiling emitter. This is the prior 92 plus all 13 new ownership tests.
- `cargo test -p color-core --offline --no-default-features --test kmeans_snapshots`: 1/1 passed.
- `cargo tree -p color-core --offline --edges normal`: passed; no Tauri normal dependency is present.
- `node --test scripts/svelte-event-guard.test.mjs`: 10/10 passed.
- `git diff --check`: passed, including the tracked export; all four untracked Rust files were separately rustfmt/clippy compiled and exercised.

## Preservation, limits, and friction

- Git records only the one-line `lib.rs` tracked delta and the four new allowed files. Therefore every other tracked candidate byte remains identical to base `a0d9dd0`. In particular, root `Cargo.lock` remains `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`, native `Cargo.toml` remains `dae7699f97f24acfd077ef7e85c1bb790e6463f821ae7c21d69b518219cd319e`, `artifact_id.rs` remains `36d3072c45c145cbcbfede419fa78a558837621f9c510701da04dc790c3987d7`, `commands.rs` remains `9dc3848a2ac8470d8954ab7e593725521020e42b925470797d3813f506304090`, `cache.rs` remains `07232c21c39804c9e9fd3b2d882054371d17840846525af39016ac4bdc08a994`, `main.rs` remains `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb`, `ffmpeg.rs` remains `e5b1fca84661a6205623bef5038afc2daf38bd5d54342534972e53e39271ae6c`, `value_analysis.rs` remains `21517274d783401341cc05d3360ad16fd589594445398c8b0a34c7181f2ec8a2`, and `compose_grid.rs` remains `c8fd9c946aa3b3ddc91e535cc19bdffecec06304a06d58d226f6539897297edc`.
- All five touched/new files are below the strict 350-line CI ceiling: 343/250/320/9/343 lines respectively. No LOC bypass or out-of-fence split is needed.
- Backend separation relies on an OS-random 256-bit nonce: collision probability is negligible rather than mathematically impossible, and construction fails closed if OS randomness is unavailable. Released-lease and retired-ticket tombstones intentionally remain for the registry lifetime to preserve exact idempotence/stale rejection; this slice adds no persistence or lifetime reset policy.
- Metadata correctness, file membership/dedup, complete publication, on-disk existence, path confinement, symlink/hardlink handling, safe deletion/rollback, disk-full behavior, restart recovery, real native worker/source/session/operation ownership, C1–C3, producer/consumer transport, renderer disposal, clipboard/snapshot hookup, export/batch lifecycle, installed-app behavior, and aggregate IMP-193 acceptance remain unimplemented and unclaimed.
- Node20, Windows, Linux, the installed app, real files, and real interaction were not run. Current evidence is macOS library/build/test evidence only. Running independent Cargo gates concurrently caused ordinary package/build-lock waits but no failure or artifact/source mutation. No implementation deviation, scope expansion, or blocker was encountered.

Candidate remains uncommitted at the exact base HEAD. The aggregate AI-IMP-193 checklist remains untouched and open. Lead owns independent review, commit, and any separately bounded phase193-B assignment.
