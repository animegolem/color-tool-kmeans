# AI-IMP-202 B5 profiling Finish capture implementation — round 01

Code Lead -> Review Lead, 2026-09-05. Prepared/uncommitted implementation against PROJECT-RECORD rev 0.33 §10.12, B4 F1–F5 and `profiling-b5-finalization-implementation-brief.md`.

## Carrier

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- No Git mutation, app build/package, app launch/attach/control, capture, source-map generation, injection, workload/media/preference change or performance experiment was performed.
- The B2 runtime/evidence bundle and open carrier were not touched.

## Files and SHA-256

The two `absent` entries are the two new B5 source-tree files. The other before hashes are from the immutable accepted-dirty 53 archive/hash list, except clean tracked `App.svelte`, whose before hash is from HEAD.

| File | Before SHA-256 | Prepared SHA-256 |
|---|---|---|
| `tauri-app/src/lib/bridges/profiling.ts` | `38de8f926ca17edceb22943e87c5a5658ba4e8f6352dc4c2480d615be588b82a` | `a4f4323336575d69ddcdaacf05b990c128fb8c7516cbe0d5801f0e55bd2c9f7a` |
| `tauri-app/src/lib/profiling/trace.ts` | `b2d9e0febcbea0a593b40b537066b2eaf4c4f2d0d82a74793db5a7645a78deb4` | `35b3004d4eec6724ec2a4af13cda2af8367fb7e65fb5052e74bc408f3eac5bf2` |
| `tauri-app/src/lib/profiling/trace-types.ts` | `6bdd68d5d530d00df2e74e5b921630143e3e3b4f84ab77d0674a9c4e9e92208d` | `d5fecac17791c2089911121c42ccbfe9adef6295057bbe91e9bd2eef12aeca25` |
| `tauri-app/src/lib/components/ProfileCaptureControl.svelte` | absent | `9db6b52fab6c51fe4c2bfbafe213037b5ea39fd0412042e9ab3fe09e79ca89ce` |
| `tauri-app/src/App.svelte` | `624676c9adba293a363594781e97a606c5eb48177ba0f945422d73e3a6ea8d89` | `c07dd0d9ffc8f5d78d077c81cf5a17ecf69e801afa0deafb000841236bdce820` |
| `tauri-app/src/lib/bridges/profiling.spec.ts` | absent | `40ad0ddfe8f7e9f9b1379f2a60dee3277d11d33809a215f66341fc060d24213c` |
| `tauri-app/src/lib/profiling/trace.spec.ts` | `95cca09601bc5ae36f91c31b62666d067cfe1934355985e908661dc0d48474e9` | `2a5e351ae564cfa11e8c233c92a7c378119a6943265ce7c2a8f640a2113f0f8f` |
| `tauri-app/src/lib/profiling/trace-dom.spec.ts` | `fc1a4a4992415c59157542e2809bbdef23936002ee26ccb30847707f1113c401` | `5a305e2efe2d35101c2395cac9bb38c5c06691f592ecc3648d4ed451c5cd8207` |
| `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` | `e7ecbb46eff6e8385b6327db2501370378203663853edaf224b9bd129c0a6cf0` | `f4f13bec0cb0acb48de2e04a2ec826ac4d84fc667cfb9852b76002e793834c9d` |
| `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts` | `8c154c70d617ca49ed6ef9fdd41d60ff966260981e01baf3925a4ba51214b302` | `e150e11383ee9e0b818902dfc80ef018e59b52fe623ce91bb49bc4975d702657` |
| `tauri-app/src/lib/profiling/trace-fixtures.ts` | `f39a4258efc46e39788433107554a1931f51e17875dd64deb70153bda2a36074` | `a372e4320629ee1d6cd54a16db2e6d33766e585fd5ae9b9f702a2c34703179d4` |

No file outside the exact 11-file B5 source fence was changed. The submission itself is the one authorized planning-tree report.

## Implementation summary

- `profiling.ts`: added exact `profile_finalize` invoke shape, typed receipt/error allowlist, exact-key parsing, same-session validation, safe integral/positive-total checks and coherent sealed/pending/terminal-state enforcement.
- `trace.ts` / `trace-types.ts`: added typed finalization states and dependency injection; placed the admission gate before supersession/allocation/counters/clock/ID work; serialized actual append starts in assigned sequence; retained per-action persistence and sticky session failure/loss; added quiesce, exact drain/recheck, single-flight finish, explicit pending retry, terminal caching, native-loss preservation and local sequence continuity classification.
- `ProfileCaptureControl.svelte` / `App.svelte`: added one compact persistent header control sharing cached initialization. Disabled/rejected bootstrap renders no DOM. It uses `$state.raw` for collector/immutable state identity, has no timer/polling/storage marker and uses the exact approved clean/loss wording plus fixed safe error codes.
- Test fixtures gained queue-aware append and typed finalizer injection. Existing assertions that observed append calls now await serialized persistence where required.

## F1–F5 and matrix mapping

### F1 — exact, sticky, ordered local drain

- `trace.spec.ts`: direct post-quiesce admission has no supersession side effect; renderer-pending explicit retry; deferred first append prevents later append invocation; failed first append still permits later queue progress while finalization remains terminal; unresolved append withholds native finalize; missing persistence, session capacity/drop and dropped/tainted receipts refuse native finalize.
- `profiling-contract.spec.ts`: actual analysis-runner debounce remains renderer-pending until its ordinary lifecycle closes.
- `profiling-svelte.spec.ts`: actual coordinator input after Finish truthfully supersedes its prior action, while the new observation is not admitted.
- `trace-dom.spec.ts`: Finish remains renderer-pending through Svelte tick/DOM work; ordinary unmount closes the action and explicit retry can seal.

### F2 — native seal is not measurement usability

- `profiling.spec.ts`: exact command/session and exact receipt keys; boolean seal; safe nonnegative integral counters; positive record/event/byte totals; allowlisted nullable errors; only coherent `profiling-actions-open` with positive open count is pending. Wrong sessions, unsafe/fractional/negative counts, zero totals, unknown fields/error codes and contradictory sealed/error/open states reject.
- `trace.spec.ts`: double click shares one flight; same-instance sealed result is cached; native pending requires explicit retry; native terminal error/invoke failure is cached terminal; sealed drop becomes `sealed-with-loss`; unexpected native sequence becomes `continuity-unverified`; both preserve the receipt.
- UI clean text is exactly `Trace sealed · validation pending`; lossy seal text is exactly `Trace sealed with loss · not usable`. No importer-eligibility claim or action exists.

### F3 — one renderer lifetime only

- No resume, rebase, renderer marker, local/session storage, native status expansion or reload ownership inference was added.
- `trace.spec.ts` documents the implementable boundary: a newly constructed empty collector receiving an existing native sequence does not rebase and reports continuity unverified.
- B5 does not pretend to automatically detect every renderer replacement. Independent uninterrupted-ownership proof for first acquisition remains a separate required acquisition gate; even a locally clean B5 result says validation pending.

### F4 — profiling-only persistent control

- `profiling-svelte.spec.ts` compiles the component, exercises Svelte raw identity semantics, confirms the persistent App-header mount precedes the view switch, checks exact wording, cached bootstrap source, no timers/storage marker and no disabled DOM branch.
- Disabled/rejected behavior and layout absence are source/compiled evidence only. A packaged mounted-browser visual/reflow proof is intentionally unrun under the B5 no-build/no-launch fence.

### F5 — narrow preservation

- Exactly 11 authorized source files changed: nine existing plus two new.
- Of the accepted dirty 53 carrier paths, eight are authorized B5 edits and all remaining 45 verified `OK` against `source-hashes.before.sha256` after implementation.
- Current source-tree status is 56 paths: accepted 53 plus clean tracked `App.svelte` now modified plus the two authorized new files. HEAD and branch are unchanged.
- No native/core/Home/runner/coordinator/importer/A1/app.css/config/lock/dependency edit occurred.

## Test-count delta

- Node producer/consumer suite: 73 -> 73 tests; unchanged files, rerun green.
- Vitest: 276 tests / 26 files -> 309 tests / 27 files; +33 tests, +1 file. All old tests retained.
- Rust workspace: 68 passed plus 1 intentional ignored emitter -> unchanged, rerun green. The ignored emitter was explicitly exercised by the Node native-wire test.
- Scalar snapshot gate: 1 -> 1 passed.

## Gate outcomes

All commands used existing dependencies; no install was run.

1. `node --test scripts/profiling/*.test.mjs`
   - `tests 73`
   - `pass 73`
   - `fail 0`
2. `npm run test -- --run`
   - `Test Files  27 passed (27)`
   - `Tests  309 passed (309)`
3. `npm run check`
   - `svelte-check found 0 errors and 2 warnings in 2 files`
   - Warnings are the accepted existing noninteractive-tabindex warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
4. `npm run lint`
   - exit 0; no diagnostics.
5. `npm run format:check`
   - `All matched files use Prettier code style!`
6. `cargo fmt --all -- --check`
   - exit 0; no diagnostics.
7. `cargo clippy --workspace --offline -- -D warnings`
   - `Finished \`dev\` profile [unoptimized + debuginfo] target(s)`; exit 0 with no warnings.
8. `cargo test --workspace --offline`
   - 68 passed, 0 failed, 1 intentional ignored emitter across discovered targets; doc tests 0/0.
   - Main profiling target: `test result: ok. 24 passed; 0 failed; 1 ignored; 0 measured; 0 filtered out`.
9. `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline`
   - `test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out`.
10. Auxiliary `git diff --check`
    - exit 0; no diagnostics.

## Evidence boundary and unrun gates

- Executed: Node producer/consumer and native-wire interoperability; full Vitest including actual collector/coordinator/runner paths and compiled Svelte; Svelte type diagnostics; ESLint; Prettier; Rust format/clippy/workspace/scalar tests; carrier hash verification.
- Source/compiled only: disabled/rejected component DOM absence, shared bootstrap, persistent header placement, labels and component layout rules.
- Unrun by explicit fence: packaged app build; mounted browser/native UI behavior and visual reflow; launch/attach; real profiling artifact finalization; importer consumption of a new B5-sealed artifact; end-to-end capture/flame graph; owner workload/media interaction; Node 20 and Windows CI.
- Therefore this is prepared implementation evidence, not operator/runtime/performance/importer acceptance and not proof that the prior ~4 s symptom is an app regression.

## Deviations, friction and LOC

- Behavioral/file-fence deviations: none.
- One auxiliary baseline LOC inspection command initially used zsh's special `path` variable and consequently made later commands in that transient shell unavailable; it made no file change and was immediately rerun with a non-special variable. No validation gate failed.
- Cohesive LOC growth is explicit: `profiling.ts` 396 -> 496, `trace.ts` 623 -> 767, `trace-types.ts` 144 -> 175, `trace.spec.ts` 560 -> 915, `trace-dom.spec.ts` 150 -> 174, `profiling-contract.spec.ts` 293 -> 320, `profiling-svelte.spec.ts` 229 -> 310, `trace-fixtures.ts` 168 -> 186, `App.svelte` 431 -> 433; new component 127 and new bridge spec 103 lines. Growth is finalization state-machine/wire validation and deterministic matrix coverage; no minification, LOC bypass or unrelated extraction was used.
