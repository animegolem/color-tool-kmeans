# AI-IMP-202 B4 operator-finalization boundary review

Code Lead -> Review Lead, 2026-09-05. PROJECT-RECORD rev0.32 §10.11. Review state: **SOURCE REVIEW SUBMITTED; no implementation or runtime action; no ticket completion.**

## Outcome

There is no native finalization defect requiring a new backend command. The smallest safe route is a profiling-only control mounted in the persistent App header, absent when the one cached profiling status says disabled. Its `Finish capture` action must first quiesce the renderer collector, allow already-created actions to reach their existing immutable outcomes, serialize and drain every renderer batch to a validated persistence receipt, and only then invoke the already registered native `profile_finalize({ req: { sessionId } })`. Any renderer write rejection stops before native sealing. Native `profiling-actions-open` is pending/retryable; every other unsealed/error result is failure; `sealed:true` with coherent counts is the only success.

The current renderer cannot perform that sequence honestly without narrow new APIs. It has no finalization bridge, admission-stop state, aggregate open/pending view, serialized append queue or drain/finalize method. These can be added without changing analysis, cancellation, cache, numeric or importer policy. The existing native writer and importer already provide the required fail-closed seal semantics.

## Exact carrier and preservation

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`.
- Branch: `codex/correctness-wave-01-2026-09-05`; HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`.
- `git status --short --untracked-files=all`: 53 accepted paths.
- All 53 paths verify against `color-tool-profile-b2.wLOiuF/attempt-02/source-hashes.before.sha256`; manifest SHA-256 `0b8e7188495f52988afda6c0003127e05e48c0fa02bf8cf9fd03ee5d6174d0e5`.
- No candidate, source, test, build, runtime, app, preference, media, evidence or Git mutation was made. Retained B2 PID67432 was not inspected or controlled in this review.

## 1. Native request, receipt and state machine

### Source facts

- Wire request is exactly one camel-case `sessionId`; receipt fields are `sessionId`, `sealed`, `openActionCount`, `recordCount`, `eventCount`, `artifactByteCount`, `droppedEventCount`, `lastBatchSequence`, and nullable `errorCode` (`tauri-app/src-tauri/src/profiling_wire.rs:96-100`, `:133-145`). The registered Tauri wrapper accepts argument `req` and forwards it unchanged (`tauri-app/src-tauri/src/profiling.rs:480-486`); registration is already in the handler (`tauri-app/src-tauri/src/main.rs:104-119`). Therefore the renderer call shape is `tauriInvoke('profile_finalize', { req: { sessionId } })`.
- `ProfileState::finalize` rejects disabled or wrong-session calls and otherwise locks the writer and delegates to its state machine (`tauri-app/src-tauri/src/profiling.rs:387-397`).
- The first writer-finalize call synchronously sets `accepting_new_actions=false` before inspecting state. If a sealed receipt already exists, that exact cached receipt is returned. If reservations remain, it returns `sealed:false`, the actual open count and `profiling-actions-open`; if the sink is gone it returns `profiling-writer-unavailable` (`tauri-app/src-tauri/src/profiling_writer.rs:247-271`).
- Open means an action still has a reserved native return or action close (`tauri-app/src-tauri/src/profiling_writer.rs:339-343`). New actions and new native-return reservation for a known renderer-only action are refused after finalization starts, while a return reservation created before finalization may still be consumed (`tauri-app/src-tauri/src/profiling_writer.rs:72-123`, `:161-191`). Native receive/return ownership and late return recording are in `tauri-app/src-tauri/src/profiling.rs:88-163` and `:165-210`.
- With no open reservation, finalization constructs a seal containing full record/event/action/native/batch/byte/drop totals, flushes the pre-seal sink, appends the seal, and only then caches a successful receipt (`tauri-app/src-tauri/src/profiling_writer.rs:274-336`). Pre-seal flush, seal encoding/size and seal-write failures all return `sealed:false`; write failure also taints/drops the sink (`:299-333`, `:409-419`). These failures are not a clean result.
- Successful sealing is irreversible: writer mutation methods reject when sealed, session loss becomes a no-op, and repeated finalization returns the cached receipt (`tauri-app/src-tauri/src/profiling_writer.rs:78-80`, `:126-168`, `:193-205`, `:252-255`, `:328-336`). Existing native tests directly cover stop-admission/open-native/retry/seal/idempotence and post-seal byte immutability (`tauri-app/src-tauri/src/profiling_tests.rs:532-659`), plus conflicting post-finalize attempts and a late reserved return (`:661-736`).
- Import eligibility independently requires a nontruncated trace whose last complete record is the unique seal and whose counts, bytes, closed actions, matched native receive/return, batch sequence and loss total recompute exactly (`tauri-app/scripts/profiling/trace-integrity.mjs:179-237`, `:240-379`). Missing/invalid seal taints the trace; tainted evidence becomes `trace-persistence-unverified`, never eligible completed (`tauri-app/scripts/profiling/trace-to-run.mjs:63-106`).

### Operator meanings

- **Pending:** only `sealed:false`, `errorCode='profiling-actions-open'`, `openActionCount>0`. Admission is already closed. The operator may retry after the disclosed late native/close reservations resolve.
- **Failure:** a thrown command/validation error, renderer persistence failure, or any unsealed native receipt other than the coherent pending shape. It remains visible as failed; it is never recast as success or eligible evidence. Do not call native finalize at all when any renderer batch failed, because failure before native admission might otherwise leave a deceptively clean seal that omits renderer evidence.
- **Retry:** manual explicit retry is safe only for the pending/open-actions case. No polling is required. Writer-unavailable, pre-seal-flush, seal-write/size and malformed/mismatched receipt paths should be terminal in the v1 control even if the operator can preserve their evidence for diagnosis.
- **Already sealed:** native has no separate `alreadySealed` flag. It returns the exact cached successful receipt without another write. The UI may truthfully say `Sealed` but must not claim this click created the seal. In the same renderer lifetime the control should cache that success and disable the button; after a renderer reload an explicit Finish click may rediscover the same idempotent receipt.

## 2. Renderer lifecycle, pending ownership and ordering

### Current source facts

- `bridges/profiling.ts` exposes one cached status handshake and validated batch append only; the file ends after `appendProfileBatch` and has no finalize request/receipt (`tauri-app/src/lib/bridges/profiling.ts:148-211`, `:327-396`).
- `RendererProfileTrace` privately owns all actions and only numeric action/batch/drop counters (`tauri-app/src/lib/profiling/trace.ts:64-77`). `startDeliveredAction` creates/supersedes actions whenever the launch status is enabled; there is no quiescing/sealed admission gate (`:99-187`).
- Every terminal is immutable, cancels outstanding RAF/visibility ownership, appends one `action_outcome`, and immediately starts a private `action.persistence` promise (`tauri-app/src/lib/profiling/trace.ts:519-556`). `getPersistence` exposes only one action's promise (`:427-435`).
- `flush` increments `batchSequence`, snapshots the batch and calls `append` directly; it validates the returned receipt or resolves a failed persistence result, but there is no session-wide pending set, append tail or drain (`tauri-app/src/lib/profiling/trace.ts:559-600`). Two terminals can therefore have concurrently outstanding IPC even though native requires exact increasing batch sequence (`tauri-app/src-tauri/src/profiling_writer.rs:126-145`). A rejection fails closed, but current tests do not establish cross-IPC completion order.
- Renderer singleton initialization only creates/returns the active trace; no quiesce/finalize facade exists (`tauri-app/src/lib/profiling/trace.ts:603-623`).
- Real work can be in the 400ms debounce, native await or result/DOM/RAF phase. The runner owns scheduled/running action refs and cancels them without changing production cancellation authority (`tauri-app/src/lib/views/home/analysis-runner.svelte.ts:38-56`, `:81-110`, `:135-185`, `:188-313`). The compute bridge records native issue before invoke, native settle after the promise, then response parsing (`tauri-app/src/lib/bridges/compute.ts:277-355`). DOM/RAF is asynchronous and terminalizes only after association/visibility checks (`tauri-app/src/lib/profiling/trace-dom.ts:110-179`).
- Navigation unmounts Home because the view switch is in App (`tauri-app/src/App.svelte:385-396`); Home then terminalizes the observation as `view-unmounted` and independently cancels production pending work (`tauri-app/src/lib/views/HomeView.svelte:498-515`). A finalization control inside Home or its dev banner would disappear at exactly this boundary. `DevBanner` is also gated by `import.meta.env.DEV` and Home-local visibility (`tauri-app/src/lib/views/HomeView.svelte:72-76`, `:571-574`), so it is not a release profiling host.

### Narrow additions required

The current collector cannot be safely quiesced/drained by callers; the needed state is private and there is no finalization bridge. Add these collector behaviors, without touching the runner/coordinator/native analysis contracts:

1. A synchronous `acceptingActions=false` transition at the start of Finish. `startDeliveredAction` must return null before allocating a new ID/action once quiescing begins. Existing action refs remain valid and continue through their current debounce/native/store/DOM/RAF or existing cancel/error terminal path. Production inputs and computations continue normally but are no longer admitted as observations.
2. A serialized append tail ordered by the already assigned `batchSequence`, with each action retaining its own persistence result. Drain snapshots every known terminal action and awaits all persistence promises. If any action is still open, return an explicit renderer-pending state and do not call native finalize; the operator can retry after the ordinary lifecycle closes it. If any terminal lacks a persistence promise or any result is not `ok`, return terminal renderer failure and do not request a native seal.
3. A single-flight `finishCapture()` state machine. Concurrent/double clicks share one promise. After a pending renderer state, a later explicit retry rechecks open actions and drain; after a native `profiling-actions-open` receipt, retry only calls native again after renderer remains drained. Successful receipts are cached. Other failures remain visible and do not auto-retry.
4. A typed/validated `finalizeProfileSession` bridge. Validate session identity, every nonnegative safe-integer count and coherent sealed/pending/error combinations before exposing the receipt. Bridge/invoke/shape errors are failure, not native success.

This ordering is essential: calling native finalize before renderer drain would close native admission and reject a renderer action not yet known to the writer. Waiting only for a displayed result is also insufficient because the renderer terminal starts, rather than completes, its persistence promise.

## 3. Minimum proposed touch set

### Production: four files

1. `tauri-app/src/lib/bridges/profiling.ts` — finalize DTO, strict receipt parser and exact native invoke wrapper.
2. `tauri-app/src/lib/profiling/trace.ts` — quiescing state, serial append tail, aggregate open/persistence inspection, single-flight drain/finalize/retry state and cached sealed receipt.
3. `tauri-app/src/lib/components/ProfileCaptureControl.svelte` **(new)** — profiling-only accessible status plus explicit `Finish capture`/`Retry finish` action; `role=status`/polite live text; no output when initialization returns null; no timers or polling.
4. `tauri-app/src/App.svelte` — mount that component in the persistent header, outside the view switch. The header is continuously mounted at `:361-383`; this is narrower and more lifecycle-correct than Settings, Exports, Home or the dev-only banner.

No change is mechanically required in `HomeView.svelte`, `profiling-coordinator.svelte.ts`, `analysis-runner.svelte.ts`, native `profiling*.rs`, `main.rs`, importer/schema, numeric/core/cache/export/video code, package/config/locks or `capabilities/main.json`. The custom command is already registered and status/append already use the same application invoke channel; the local capability file contains no per-profiling-command entry (`tauri-app/src-tauri/capabilities/main.json:1-10`). Packaged invocation remains an implementation validation gate, not an inferred permission proof.

### Tests: five files

5. `tauri-app/src/lib/bridges/profiling.spec.ts` **(new)** — exact `{req:{sessionId}}` invoke, sealed/pending receipt parsing, mismatched session, unsafe counts, contradictory flags/errors and invoke rejection.
6. `tauri-app/src/lib/profiling/trace.spec.ts` — admission stop, serial append order, drain, active renderer action, write rejection, single-flight double click, pending-native retry, cached success and terminal failure.
7. `tauri-app/src/lib/profiling/trace-dom.spec.ts` — Finish during tick/RAF1/RAF2 remains renderer-pending until the existing action reaches its honest terminal and persistence completes; no fabricated completion.
8. `tauri-app/src/lib/views/__tests__/profiling-contract.spec.ts` — active debounce/native await/late response paths keep production result/cancellation behavior while collector admission is closed; native finalize is not called before renderer persistence.
9. `tauri-app/src/lib/views/__tests__/profiling-svelte.spec.ts` — compiled-Svelte/source contract for disabled absence, accessible labels/status, persistent App-header mounting and Home navigation/unmount ownership.

The existing Rust finalization/post-seal/loss tests and Node seal-integrity tests should be rerun unchanged. No native test edit is proposed unless implementation discovers a counterexample to the already accepted producer semantics.

## 4. Required implementation test matrix

| Case | Required observable assertion |
|---|---|
| Profiling disabled/status rejected | Control has no rendered button/status; no finalize IPC, action, timer, batch or retry state. |
| Ready, no actions | One click quiesces first, drains empty set, invokes exact session once and renders only a validated sealed receipt. |
| Active debounce | Finish stops new IDs but does not alter the production timer. It reports renderer pending; the already delivered action later admits/settles or reaches its existing terminal, persists, and only an explicit retry may reach native finalize. |
| Active native work / late return | Existing production response remains authoritative. Renderer persistence drains; native `profiling-actions-open` with positive count remains pending. Retry after the reserved late return can seal. |
| Active DOM/RAF | No seal while action has no terminal. Existing association/visibility path finishes or unmount cancels; actual append receipt precedes native finalize. |
| Navigation/Home unmount | App-header control survives. Home's current `view-unmounted` outcome and batch close are awaited before native finalize; navigation is not presented as a completed render. |
| Multiple terminal batches | Native calls observe strictly increasing batch sequence even when mocked append latencies are reversed; drain waits every result. |
| Renderer validation/write rejection | Finish fails before native finalize, preserves exact error, and never exposes sealed/eligible state. |
| Native pending | `sealed:false + profiling-actions-open + openActionCount>0` exposes retry, never success. No automatic poll. |
| Native terminal failure/malformed receipt | Exact failure remains visible; no success, no automatic retry and no cached sealed receipt. |
| Double click/in-flight | Both clicks share one finish promise and produce one drain/native request. Button is disabled while in flight. |
| Retry and already sealed | Pending retry is explicit; successful receipt is cached, button disabled, repeated programmatic finish returns the same receipt without claiming a new seal. |
| Post-finish production interaction | Analysis/cancellation/cache/output behavior remains unchanged while `startDeliveredAction` admits no new observation. |

Tests above are **proposed, not executed**. This brief forbids test/build-generated artifacts. Executed review checks were read-only source inspection, exact Git identity/status, manifest digest, and all53 source hashes (`53 OK / 0 failed`).

## 5. Source/build identity for the first eligible capture

Yes. The first eligible operator-finished capture requires a new separately reviewed source identity and a newly identified instrumented build. B2 is immutable and has no renderer finalization route; patching its bundle or invoking its native command through devtools, JavaScript injection, Apple events or LLDB would destroy the accepted source/build/control provenance. The new build must bind the exact changed-source hashes, executable and symbols into its build/acquisition records before any trace is imported. B2 remains useful only as the accepted profiling-disabled functional carrier.

## 6. Blocker and smallest lead decision

There is **no source-mechanics blocker** to an honest operator route. The lead need only approve the four-production-file/nine-total-file fence and settle two control-surface details already within lead authority:

1. Accept the persistent App header plus dedicated profiling component as the host, with the exact action label `Finish capture` and status language `Profiling launch enabled`, `Waiting for N renderer/native actions`, `Capture failed: CODE`, or `Capture sealed`.
2. Accept explicit manual retry only for coherent open-action pending states; all renderer persistence failures and other native unsealed/error receipts stay terminal for v1.

Do not label the pre-click state `capture active` after a renderer reload, because native `profile_status` does not expose sealed/accepting state; it reports only whether a launch-created session exists (`tauri-app/src-tauri/src/profiling.rs:63-85`). `Profiling launch enabled` is honest. An explicit Finish click safely discovers an already-sealed cached receipt. If the lead instead requires read-only post-reload lifecycle discovery before any button press, that is a broader native status-extension decision and adds `profiling_wire.rs`, `profiling.rs`, `profiling_writer.rs` and native tests to the implementation fence; it is not required for the recommended smallest route.

## Issues encountered

- The report brief requests the SHA-256 of the finished report inside that same report. A whole-file cryptographic digest cannot be embedded in the bytes it hashes without changing the digest. The final whole-file SHA-256 is therefore supplied in the lead submission message after this file is complete; this section records the unavoidable self-reference instead of presenting a stale pre-hash as the finished-file hash.
- `git status --short` collapses untracked directories to21 display entries. The governing exact command `git status --short --untracked-files=all` yields53 paths; all53 were hash-verified.
- No test or runtime evidence is claimed from source inspection. Existing native/Node tests are cited as previously present source boundaries only.

Stop point: review-lead verdict on the proposed implementation fence and control wording. No owner decision or bell is needed.
