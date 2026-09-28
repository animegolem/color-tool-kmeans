# AI-IMP-202 B1 Round 03 correction submission

Code Lead → Review Lead, 2026-09-05. PROJECT-RECORD rev 0.28 §10.8. Review state: **SUBMITTED; uncommitted; not accepted; no ticket completion.** This is the focused D1–D4 correction requested by `profiling-b1-round-02-verdict.md`.

No app build, launch, capture, owner-media interaction, trace acquisition, Instruments run, flame graph, optimization, core/video/cache/other-view change, dependency/configuration change, Git operation, merge, or issue completion was performed.

## Carrier and preservation receipt

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD remains `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- Frozen Round 02 all-37-file source archive remains `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-a0.wJlqoS/b1-review-round02.3JhAyB/source.tar`, SHA-256 `ef544ed597bb5daf110d7cc9f0f2083140ea293daeef28c9e2cde290fbda362f`.
- The Round 01 submission, Round 01 verdict, Round 02 submission, and Round 02 verdict remain unchanged with SHA-256 values `fb177145309b51fb411110550092ae2d248d9787481bde317de2c32a876768a8`, `bff7fc1fd3b7c09fccb8185a2abbb5a2018b5767726692703363ad7d1ffb2a24`, `fccd7e5183c23853ea3cf128749c0ffcdea2c3f424f8a23557aa8cd2047f9967`, and `2dc10f6d93a8d34877540591e4ffa990a6beb50eba7f08adf7eb5e92d158e0d9` respectively.
- Direct `tar -xOf ... | cmp` comparison of every archived B1 path found exactly seven changed files, all inside the eight-path Round 03 fence. The authorized `trace-fixtures.mjs` stayed byte-identical, as did the other 29 B1 files.
- The sixteen accepted A1 files remain byte-identical. Their sorted pathname/per-file-hash-list digest remains `ea93a92f171f565946ccc3f2ad1998fba146cd9350f90c911973d8aa167fe476`.
- `git status --short --untracked-files=all` remains the exact known 53-path carrier: sixteen A1 plus 37 B1. `git diff --check` passes. No staging or Git mutation was attempted.

## D1–D4 disposition

### D1 — legitimate same-action scheduling repeats

- Integrity validation now requires exactly one initial `bound` schedule after input resolution and before admission. Once bound, same-key `repeated` observations may occur while the action is open, including after admission during pending, store-ready, and render phases before `action_outcome`.
- Repeat-before-bind, a second bound schedule, and any post-terminal repeat remain invalid. Primary-stage ordering, identity/config coherence, and immutable outcome checks are unchanged.
- Positive coverage executes the production `RendererProfileTrace` collector rather than constructing only theoretical JSON. The test bundles the actual TypeScript collector with the already-installed esbuild, emits the initial binding plus a pending repeat and a post-store ready repeat, completes figure/DOM/RAF evidence, transfers the emitted batch into a sealed envelope, and imports it through the real `importTraceRun` path. The result is completed and eligible. Precise invalid-order negatives remain rejected.

### D2 — irreversible successful seal

- Successful sealing is now terminal for every writer/state mutation entry point. A delayed first native receive for an already closed known action cannot reserve or append after the seal; post-seal batch and loss attempts cannot change records, sequence, counters, dropped-event totals, bytes, or the cached finalization receipt.
- Repeated finalization returns the same truthful cached receipt and exact byte count. Focused regression snapshots the complete sealed bytes and counters, exercises receive/return/batch/loss paths, and proves exact equality afterward.
- The distinct pre-seal reservation contract is preserved: when finalization has started but an admitted native span or admitted action is still open, new actions are refused without mutation, while the already reserved native return and existing-action batch/close may complete. Finalization waits for those reservations, then seals once. Integration review specifically exercised conflicting receive, duplicate receive, and conflicting batch attempts during this wait and proved they cannot mutate the pending receipt or artifact.

### D3 — pre-finalization admission refusal is durable loss

- Valid in-session evidence refused before finalization because of action/closure/event/record/byte capacity or a conflicting observation now records safe cumulative session-level loss while the writer still accepts new actions. If that loss cannot be reserved/persisted, the session becomes unsealable.
- A refused action is not allocated, does not receive a close receipt, and does not advance the admitted renderer-batch sequence. Deliberate new-action refusal after finalization begins remains a separate non-loss boundary and cannot mutate the pending or sealed session.
- Production Rust writer → real Node parser/importer coverage fills all 128 renderer-only action slots, submits the valid 129th action before finalization, and then seals/imports the retained artifact. The refused identity is absent, the last admitted sequence remains 128, cumulative loss is 2, and the previously selected action is globally unverified with measurements unavailable.

### D4 — rejected identities never persist

- Bounded allowlisted `actionId`, `rendererClockId`, `imageInstanceId`, and event identity validation now occurs before reservation, sequence allocation, identity-bearing persistence, or receipt creation.
- Invalid or oversized identities produce only safe session-level loss codes (`invalid-native-identity` or `invalid-batch-identity`); arbitrary rejected values never enter the artifact. An otherwise valid action identity paired with an invalid payload retains the intended diagnostic close behavior.
- Production Rust writer → real Node parser/importer coverage tests malformed and oversized native/batch identities and scans the resulting bytes for every rejected literal. Only the one valid action is allocated, cumulative loss is 7, all rejected values are absent, and the valid-ID invalid-payload case imports as tainted/unverified missing-batch diagnostic evidence.

## Actual producer-to-consumer proofs

- D1: production renderer collector (`src/lib/profiling/trace.ts`, bundled in memory with installed esbuild) → emitted renderer batch → sealed trace envelope → real Node importer. This proves pending/ready repeats using runtime collector behavior.
- D2–D4: ignored Rust test emitter invokes production `ProfileState`, validation, serializer, and `ProfileWriter` to create temporary `native-round03-fixtures.json`, `profile-native-post-seal.jsonl`, `profile-native-capacity.jsonl`, and `profile-native-identifiers.jsonl`; the Node native-wire test invokes the emitter and consumes those bytes through the real parser/importer. No JavaScript-authored substitute is used for the native wire evidence.
- D2 artifact: post-seal operations preserve exact bytes, counters, and cached receipt.
- D3 artifact: pre-final capacity refusal is durably tainted and cannot yield eligible imported work.
- D4 artifact: rejected literal identities are absent while safe loss and valid-ID invalid-payload diagnostics remain observable.

## Truthful lifecycle and finalization contract

- Before finalization, valid new-action observations may be admitted. A valid refused observation must become durable session loss or make sealing impossible; it must not acquire action identity or sequence state.
- The first finalization request closes new-action admission. It reports `sealed:false` and waits while already admitted close/native-return reservations remain. Existing admitted work may finish; unrelated/conflicting/new admission attempts cannot alter the pending final state.
- Once all admitted reservations resolve, the seal is written as the last record. Thereafter the session is immutable across receive, return, batch, loss, and finalize paths, including calls involving previously known IDs.
- Repeated finalize calls return the exact cached sealed receipt. Renderer action outcomes remain immutable; an admitted late native return remains separate span evidence and never reopens a renderer terminal.

## Exact Round 03 files, SHA-256, and LOC

Changed (seven):

1. `tauri-app/scripts/profiling/trace-integrity.mjs` — `a4785ab8275f50895a6c915edb76617e46b1cc9b71282ac3fed6a60eb1051c06` — 380
2. `tauri-app/scripts/profiling/profiling-trace-integrity.test.mjs` — `43f30853e0f5e26e6f6c6935d9c7e43084399184b3898577c05f15cf5f623b93` — 561
3. `tauri-app/scripts/profiling/profiling-native-wire.test.mjs` — `d37e48a684ed7da4a15558957259a7905b593a518e03423224d5ade073ac57d7` — 372
4. `tauri-app/src-tauri/src/profiling.rs` — `6b3a5630df61c83dc6286b2fd222df553bfa328a23d28d11afac3fdcdc6fe4c0` — 499
5. `tauri-app/src-tauri/src/profiling_writer.rs` — `89ca72e96ede3f77451dcd95e0249f55b7f3dff2640ac752bf15352e7e63568f` — 447
6. `tauri-app/src-tauri/src/profiling_validation.rs` — `2b9bc118256fcc180a38e39a729171de2ad99d1cc28c587e6f0b69648da575b5` — 449
7. `tauri-app/src-tauri/src/profiling_tests.rs` — `3aaab937378fe18bb7cabba708405c34cfc19d519f406ea6cad6d046f7665e5a` — 1471

Authorized but unchanged:

- `tauri-app/scripts/profiling/trace-fixtures.mjs` — `a377b132c41ff556b961d73f7e76cad498ed31e867413c6e4fa47b0d37f51778` — 346

No new module was created and no further split was attempted. `profiling_tests.rs` is test-only and grew to 1471 lines for the production-emitter lifecycle/capacity/identity matrix. The existing cohesive production exceptions are `profiling.rs` 499, `profiling_validation.rs` 449, and `profiling_writer.rs` 447; the integration test exception is `profiling-trace-integrity.test.mjs` 561. Round 02 explicitly rejected another split round, so these remain review-visible LOC exceptions for the lead's commit-time handling rather than being minified or hidden.

## Final validation receipts

All commands below were rerun by the integrating Code Lead after the final cross-lane correction:

- `node --test scripts/profiling/*.test.mjs` — **73 passed, 0 failed, 0 skipped**. This includes production renderer collector → real importer coverage and production Rust writer → real Node importer coverage for sealing, capacity refusal, and rejected identities.
- `npm run test -- --run` — **26 files, 276 passed, 0 failed**.
- `npm run check` — **0 errors**, with the same two accepted AUD-020 accessibility warnings in `VideoPanel.svelte` and `ValuesView.svelte`.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `cargo fmt --all -- --check` — passed.
- `cargo clippy --workspace --offline -- -D warnings` — passed.
- `cargo test --workspace --offline` — **68 passed, 0 failed, 1 intentionally ignored**. The ignored production interop emitter is invoked explicitly by the Node suite.
- `cargo test -p color-core --no-default-features --test kmeans_snapshots --offline` — **1 passed, 0 failed**.

Deterministic chart/golden coverage remains green. Local Node is v26.8.1. Node 20 and Windows remain unavailable/unrun; no dependency was installed or downloaded.

## Candid friction and proof boundary

- Directly importing the Svelte-adjacent TypeScript collector in plain Node is not runnable as-is. The regression therefore bundles the actual production module in memory with the already-installed esbuild, without modifying production or dependency state, then drives that collector into the real importer.
- The Rust emitter uses runtime-generated native clock values and artifact bytes, so the Node consumer discovers and validates the emitted fixture values rather than embedding a second hand-maintained wire description.
- Integration self-review found one additional finalization-wait edge after the native lane first passed: conflicting admissions could still add loss while finalization was waiting for a pre-admitted return. The state gate now records admission-refusal loss only while the writer accepts new actions, and a focused regression proves the waiting receipt/bytes/counters remain unchanged while the late return completes.
- An initial focused Cargo invocation attempted multiple test-name filters in one command, which Cargo does not accept. It changed no state; the tests were rerun through valid focused and full commands.
- These are executable collector/importer and Rust-writer/importer proofs, not a live mounted-app acceptance run. There is still no app bundle, real owner interaction, real mounted window/DOM proof, process/symbol attribution, Instruments capture, flame graph, overhead pair, output-parity acquisition, or performance verdict. The historical displayed `~4000 ms` value remains kernel time, not a measured whole interaction.

Stop point: review gate. Review Lead owns acceptance and any later live acquisition assignment.
