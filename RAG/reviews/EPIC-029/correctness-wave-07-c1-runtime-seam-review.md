# Wave07 C1 native document/window seam review

Code Lead -> Review Lead, 2026-09-07. This is the one report-only result requested by `correctness-wave-07-c1-runtime-seam-brief.md`. It does not implement or authorize 193-B.

## Receipt and bounded result

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Exact unchanged HEAD: `6e12a73783c7119dae9b6add947e1b5085abe003` (`feat(cache): add native artifact ownership kernel [AI-IMP-193]`)
- Candidate status before and after inspection: clean, `## codex/correctness-wave-01-2026-09-05`
- Governing brief SHA256: `5fa90d91cb43601f37063e65ec713590385bb5f63697556a0ed3fed777d02563`
- Accepted 193-A verdict SHA256: `c9ee4a2976f7c466ef5529d5f573bd84aa1ec4a409fc2e9e8b6a6616c400df1e`
- Only durable write from this inspection is this planning report. Candidate, planning tickets/record/index, source, tests, dependencies, Git, app/runtime data and retained evidence were not changed.
- No compile probe was needed: all signature/accessibility questions are answered directly by the exact installed Rust sources. No build, suite, app/WebView launch, network access, dependency action, watcher or polling was performed.

**Result: the supported public Tauri/Wry surface does not itself establish the native window/document identity and ordering C1 requires.** It exposes useful commit/load boundaries, a reusable label, a private runtime webview ID, static per-webview initialization-script bytes and eval/IPC paths that target the current document at delivery. It exposes no correlated native window incarnation plus document/navigation epoch to page-load, IPC and eval. Therefore a random document nonce or last-arriving bootstrap remains insufficient, and 193-B session activation should remain stopped pending the narrow evidence/capability ruling below.

An app-owned native challenge protocol may be feasible on top of these surfaces, but that is an **inferred candidate**, not an established cross-platform guarantee. It is safe to implement only after the proposed runtime probe proves that each platform's `Started` callback is a predecessor-terminal boundary and that a challenge scheduled from it cannot execute in the predecessor. The present source trace proves neither condition for all supported platforms.

## Locked versions

Candidate `Cargo.lock` is SHA256 `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734` and locks:

| crate | version | checksum | lock lines |
| --- | --- | --- | --- |
| `tauri` | 2.11.5 | `667b20e2726d572dea2de7370da16e188eb06008faf9a92fab7cdc46791190b5` | `Cargo.lock:3483-3487` |
| `tauri-runtime` | 2.11.3 | `b0b4bc95aed361b0019067d189a1174a603d460d0f6c72606512d59fc9c12ec8` | `Cargo.lock:3713-3717` |
| `tauri-runtime-wry` | 2.11.4 | `4e6fac707727b7a2f48e4ded90976324267371073edbb415ffb73bb0458d203f` | `Cargo.lock:3738-3742` |
| `wry` | 0.55.1 | `186f9871daa55fd9c016578b810d149de58367113db7fb72b462d2323ce19514` | `Cargo.lock:5053-5057` |

Installed source roots inspected:

- `/Users/golem/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-2.11.5`
- `/Users/golem/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-runtime-2.11.3`
- `/Users/golem/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-runtime-wry-2.11.4`
- `/Users/golem/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/wry-0.55.1`

Older cached versions were not used.

## Current application seam: absent

- Candidate `tauri-app/src-tauri/src/main.rs:58-117` uses `tauri::Builder::default()`, setup, a window-event handler that handles only `Focused`, plugins and the invoke handler. It registers no page-load, destruction/session, initialization-script challenge or document-generation hook.
- `tauri-app/src-tauri/tauri.conf.json:21-30` creates one configured window. Tauri constructs configured windows before the application's setup callback (`tauri-2.11.5/src/app.rs:2520-2532`), so a future builder-local incarnation closure cannot simply be attached to this already-created configured webview in `setup`.
- `tauri-app/src/main.ts:37-70` starts helpers and directly mounts `App`; it has no native lifetime handshake.
- `tauri-app/src/App.svelte:123-127,214-227,257-300` only logs renderer mount, visibility, focus/blur and `pagehide`/`pageshow`, and removes those listeners on component disposal. These browser notifications carry no native generation and currently own nothing.
- `tauri-app/src/lib/bridges/tauri.ts:17-85` is a generic invoke resolver. It does not attach a native incarnation, document generation, client-session capability or request nonce envelope.

The unchanged current-file hashes are:

- `main.rs` `086b9ecd453bdce4867df313032a4f52bdf19e79adf607a86314426c90dec8cb`
- `tauri.conf.json` `d369c228c69da7a78a9e9c939a751441705e9dadc5bc112077e52444d3946c76`
- `main.ts` `56c0dbc2be6dc4ed3123639c9a6bc835b4d98f31ef6a47dda63f2f044c5dad64`
- `App.svelte` `74a159f23049b8aeb6f6a4f9a3169d33d76a4e27e2c89470f6f13ba9ed7bf423`
- `tauri.ts` `93f39d4722cbac1dd5bb73cc0611d0968459401999a4400c947baaee7e408316`

## Lifecycle API and implementation trace

### Public payload is label/URL/event, not an epoch

- `tauri-2.11.5/src/webview/mod.rs:105-122` defines `PageLoadPayload` with only `url` and `PageLoadEvent`.
- Builder-local `WebviewBuilder::on_page_load` is public at `tauri-2.11.5/src/webview/mod.rs:651-694`; the app-global hook is public at `tauri-2.11.5/src/app.rs:1781-1789`.
- Public `Webview` equality and hashing deliberately use label only (`tauri-2.11.5/src/webview/mod.rs:1332-1344`); its public identity accessor is `label()` (`:1383-1386`).
- The runtime does allocate a per-runtime private `u32` webview ID (`tauri-runtime-wry-2.11.4/src/lib.rs:145,257-288,301-402`). It stays stable across `navigate`/`reload`, restarts at runtime initialization (`:2919-2943`) and is stored in the dispatcher (`:1593-1599`), but Tauri's page-load/IPC request surface does not expose it as a durable incarnation or document ID.

### Tauri re-resolves callbacks by reusable label

- Tauri composes global, plugin and builder-local page-load callbacks at `tauri-2.11.5/src/manager/webview.rs:288-311` and `tauri-2.11.5/src/webview/mod.rs:762-772`. Both look up `get_webview(label)` when the callback runs. A late callback from an old native webview can therefore be handed the new Tauri `Webview` after the label is reused.
- Duplicate prevention is only current label-map membership (`tauri-2.11.5/src/manager/webview.rs:430-438`); the API explicitly permits reuse after close (`tauri-2.11.5/src/webview/mod.rs:361-363`, `src/webview/webview_window.rs:109-112`). Label is a slot, not an incarnation.
- Attachment occurs only after runtime window/webview creation returns (`tauri-2.11.5/src/window/mod.rs:409-428`). Runtime Wry creates the native window and webview first (`tauri-runtime-wry-2.11.4/src/lib.rs:4621-4694,5227-5267`); each Wry platform builder starts its configured navigation during that construction (for example macOS `wry-0.55.1/src/wkwebview/mod.rs:636-657`, Windows `src/webview2/mod.rs:517-535`, Linux `src/webkitgtk/mod.rs:343-375`). Tauri attaches the detached webview to its label map only after the native build returns. The callbacks are normally asynchronous, but the public API supplies no attachment barrier; an unusually early initial callback would find no mapped webview and be dropped by the lookup above. This is an implementation-order observation, not a reproduced runtime failure.

### Cross-platform `Started` is not one documented navigation phase

Wry's public enum only says content “started loading” or “finished loading” (`wry-0.55.1/src/lib.rs:2465-2471`). The exact platform implementations differ:

| platform | Wry `Started` | Wry `Finished` | identity retained |
| --- | --- | --- | --- |
| macOS | `WKNavigationDelegate.didCommitNavigation` (`wry-0.55.1/src/wkwebview/navigation.rs:17-37`) | `didFinishNavigation` (`:39-46`) | The `WKNavigation` argument is discarded. The registered delegate has no `didStartProvisionalNavigation` callback (`src/wkwebview/class/wry_navigation_delegate.rs:50-79`). |
| Linux/WebKitGTK | `LoadEvent::Committed` (`wry-0.55.1/src/webkitgtk/mod.rs:473-483`) | `LoadEvent::Finished` (same range) | No navigation/document ID enters the Wry closure. |
| Windows/WebView2 | `ContentLoading` (`wry-0.55.1/src/webview2/mod.rs:642-658`) | `NavigationCompleted` (`:659-670`) | Wry ignores both event-args objects and recomputes the current webview URL. Its separate `NavigationStarting` handler is only the URL policy path (`:673-680` onward). |

Thus macOS and Linux source identify a committed-navigation callback, not provisional start. Windows uses a different event and the installed Wry source contains no contract proving the same predecessor-terminal boundary. None of the three propagates a navigation ID, success/failure/cancellation correlation or main-document generation. `Finished` cannot safely be paired to a particular `Started` across redirects, cancellation or rapid navigation, and must not establish authority.

### Close, destruction and replacement

- `Webview::close` sends close to the private runtime ID and then immediately removes Tauri's map entry by label (`tauri-2.11.5/src/webview/mod.rs:1501-1505`). Runtime removal later finds the private ID (`tauri-runtime-wry-2.11.4/src/lib.rs:3745-3752,3815-3823`). A retained old public handle can therefore target its old runtime ID but remove a same-label successor from Tauri's registry; do not use public handle/label equality as incarnation proof.
- Window `close()` is interceptable; `destroy()` is documented as force-close without a close-request event (`tauri-2.11.5/src/window/mod.rs:1793-1801`). Native `Destroyed` reaches Tauri/listeners before the runtime removes its window store (`tauri-runtime-wry-2.11.4/src/lib.rs:4265-4312`). Tauri removes its window and child-webview label entries before forwarding the public run event (`tauri-2.11.5/src/app.rs:2542-2559`, `src/manager/mod.rs:653-665`). Public destruction context is still a label, not an incarnation.
- A captured, native-issued app incarnation could filter these callbacks, but the current configured-window/global-hook topology has no such capture and the installed API does not derive one.

## Initialization-script, IPC and eval trace

### Initialization scripts are repeated static bytes

- Tauri documents that an initialization script runs after the global object is created, before document parsing/HTML scripts, on every top-level navigation (`tauri-2.11.5/src/webview/mod.rs:819-826`), and stores the caller's fixed string in the builder (`:868-876`).
- Wry likewise documents that the same code executes on new pages before `window.onload` and stores it once (`wry-0.55.1/src/lib.rs:950-1009`). This is a per-document execution point, not a freshly native-issued value per reload.
- macOS installs the string as a main-frame `WKUserScript` at `AtDocumentStart` (`wry-0.55.1/src/wkwebview/mod.rs:636-645,777-788`). Linux installs stored user scripts and flushes pre-first-commit pending eval strings at `LoadEvent::Committed` (`src/webkitgtk/mod.rs:343-363`). Windows registers stored strings with `AddScriptToExecuteOnDocumentCreated` (`src/webview2/mod.rs:492-495,1306-1318`), and Wry/Tauri explicitly note that Windows injects into subframes regardless of the requested main-frame-only flag (`wry-0.55.1/src/lib.rs:988-991`; `tauri-2.11.5/src/webview/mod.rs:828-833`).
- A JS-created nonce in this script is fresh per document, but accepting whichever such nonce arrives last is precisely the C1-forbidden ordering. A static native value embedded per webview can distinguish a manually constructed webview incarnation, but cannot distinguish its reloads.

### IPC carries frame URL/body/callbacks, not document authority

- Wry's IPC contract is `Fn(Request<String>)` (`wry-0.55.1/src/lib.rs:1132-1144`). On macOS it copies only the message body and requesting frame URL from `WKScriptMessage` (`src/wkwebview/class/wry_web_view_delegate.rs:32-73`), not `isMainFrame`, `WKNavigation` or a document ID. Windows copies `WebMessageReceived.Source` and the string body (`src/webview2/mod.rs:877-915`). Linux reads the webview's current URI when handling the script message (`src/webkitgtk/mod.rs:630-652`), which is not an immutable sender-document identity.
- Tauri's `InvokeRequest` contains command, success/error callback IDs, frame URL, body, headers and the app-wide invoke key—no incarnation/navigation/document field (`tauri-2.11.5/src/webview/mod.rs:124-145`). The invoke key authenticates the Tauri bridge, not document recency.
- Runtime Wry captures a stable runtime webview ID when installing its IPC handler (`tauri-runtime-wry-2.11.4/src/lib.rs:5164-5175,5384-5406`), but Tauri's message handler discards that detached handle and calls `get_webview(label)` (`tauri-2.11.5/src/ipc/protocol.rs:32-36,185-188`). A delayed message after same-label replacement is therefore associated with the successor unless the application payload independently proves an old incarnation.

### Eval and invoke responses target the then-current document

- Public `Webview::eval` / `eval_with_callback` only dispatch a script and optional callback (`tauri-2.11.5/src/webview/mod.rs:1916-1939`). Runtime messages are addressed to stable window/webview IDs (`tauri-runtime-wry-2.11.4/src/lib.rs:1838-1903`); at dequeue the runtime finds that webview ID and calls Wry evaluation (`:3745-3752,3764-3791`). Reload retains that same ID, so there is no originating or expected document epoch.
- Wry then evaluates against the platform webview's current document (`wry-0.55.1/src/lib.rs:1993-2021`; macOS `src/wkwebview/mod.rs:720-775`; Windows `src/webview2/mod.rs:1321-1330,1375-1385`; Linux `src/webkitgtk/mod.rs:689-710`). A delayed eval intended for A can execute in B.
- Before the first macOS commit, Wry queues only the eval string and drops the `eval_with_callback` callback (`wry-0.55.1/src/wkwebview/mod.rs:720-723`). `didCommit` evaluates the queued strings with no completion handler and permanently clears the queue (`src/wkwebview/navigation.rs:28-35`). Linux has an analogous first-commit string queue (`src/webkitgtk/mod.rs:351-363`). This is neither a reload generation nor a delivery receipt.
- Tauri async invoke resolution retains a `Webview` and numeric callback IDs (`tauri-2.11.5/src/ipc/mod.rs:286-339,371-400`), formats `window.__TAURI_INTERNALS__.runCallback(id, value)` and calls `webview.eval` (`src/ipc/protocol.rs:301-338,372-421`; `src/ipc/format_callback.rs:93-105`). Tauri's own core script warns that the callback can be absent after reload while Rust still runs (`tauri-2.11.5/scripts/core.js:22-47`). The response can therefore land in the successor; the callback ID is not a session or document capability.

## Concrete C1 transition traces

The terms below name application state that does **not** exist yet. They show what the current surfaces can and cannot prove.

### Duplicate bootstrap in one document

1. Document A's static init script can create random nonce `a` and invoke bootstrap twice.
2. Both requests arrive with the same label/URL but no native document epoch.
3. Native code can make `(a, same request)` idempotent, but this proves only request equality, not that A is current.
4. Safe rule required: a request may validate a previously native-established challenge; it may never create or advance the current document generation.

### Newer B activates, then delayed A arrives

1. A begins a bootstrap or ownership-bearing invoke and native work/dispatch is delayed.
2. The same runtime webview commits B. On macOS/Linux, Wry emits `Started` from commit; on Windows it emits from `ContentLoading`. The public payload still contains only the reusable label, current URL and event.
3. B bootstraps. A's old request then reaches the same IPC handler. For same-URL reload, its observable label/URL can equal B's; after same-label replacement, Tauri can re-resolve the request to B by label.
4. Any “latest nonce wins” state machine lets A retire B. Therefore A must be rejected before it can acquire a 193-A lease or create/replace a client session.
5. Current stack does not supply the token that proves step 4. An application challenge might, but its delivery ordering remains a runtime gate.

### Simultaneous/reordered bootstrap and old-client retry

1. A and B requests can serialize in either arrival order.
2. Arrival order, random nonce order and callback ID order contain no document-recency fact.
3. Retrying after `SessionRetired` cannot create a new challenge or generation. The same retired capability remains terminal; otherwise A can repeatedly displace B.
4. Only a native-established generation plus a challenge delivered to the current-or-later document can admit activation. A caller request can ask native to redeliver the already-current challenge, but must receive no challenge/grant directly in that request's response.

### Stale window incarnation after label reuse

1. Old webview/window A is removed from Tauri's label map; a new B is created under the same allowed label.
2. A late old page-load callback is resolved through `get_webview(label)` and can be handed B. A late old IPC message is also resolved by label to B.
3. Label or public `Webview` equality therefore cannot advance B's lifetime or release B's owners.
4. A future manual builder closure must capture an app-native `WindowIncarnationId`, and every callback/request must be checked against the current incarnation before mutation. This is an app mechanism, not a value obtained from the callback.

### Old `Finished` or async response after a new `Started`

1. A's `Finished` has no navigation ID and can arrive after another navigation begins/commits; it cannot be paired safely and must not activate, retire or deliver authority.
2. A's async invoke response is formatted later and eval targets the current document B. An unguarded application eval can mutate B; a stale callback ID usually has no callback, but a numeric callback is not an authority boundary.
3. Every ownership/grant/result payload must carry the native client-session/document capability and be rejected by B unless it matches B. Native state must also refuse publication/lease transfer under the retired session before formatting any response.

## Conditional app-owned mechanism, not yet approved implementation

The smallest plausible mechanism using existing public APIs is:

1. Stop relying on the auto-created configured webview for the session carrier. Native code creates it through a builder, issues a unique `WindowIncarnationId`, embeds that fixed incarnation in the builder's static init script and captures it in the builder-local page-load/window callbacks. Any old closure first compares its captured incarnation to native current state.
2. Only a verified current-incarnation `PageLoadEvent::Started` increments a checked native `DocumentGeneration` and creates a new opaque `DocumentChallenge`. `Finished`, bootstrap arrival, renderer nonce and retry never advance it.
3. Native delivers the challenge through a guarded eval whose script embeds `(incarnation, generation, challenge)` and only replaces a lower-generation in-page slot. Delivery of generation N into N+1 is harmless because native accepts only the current generation; an older delayed eval cannot overwrite a larger in-page generation.
4. A renderer may send a non-authorizing `request_current_challenge`. Native answers by evaling the already-current challenge to whatever document is current, not by returning it in the old request's Promise. The bootstrap then validates the challenge; duplicate validation is idempotent. A stale request can at most help the current document receive its challenge.
5. Every subsequent command carries the validated native client-session capability. Native rejects stale sessions before any `ArtifactRegistry` acquire/register/release transition. Window destruction retires only the matching captured incarnation; renderer events remain hints, not ownership authority.

This construction addresses the obvious delayed-eval direction **if** `Started` is proven to occur only after the predecessor can no longer execute and an eval scheduled from it cannot execute in that predecessor. Locked source establishes that shape for macOS/Linux commits but not a cross-platform contract, exact initialization/IPC ordering, an initial-attachment barrier, or behavior when navigation races an already-submitted eval. It is therefore a test candidate, not current implementation authority.

193-A attachment: one native backend owns both the session table and `ArtifactRegistry`. The validated client-session entry holds leases; a stale/foreign backend, incarnation, generation, challenge or session fails before registry mutation. A document challenge is never a `BackendId`, `GroupId`, `LeaseId` or content identity.

Later C2 state that must outlive a lost response within the live backend is keyed by `(BackendId, ClientSessionId, requestNonce)` and retains the captured descriptor/input identity, source/session grant state, terminal cancellation tombstone, admitted job/group/lease IDs, response escrow and ACK/release outcome. Reuse with a different descriptor rejects. That operation record, not a document nonce or Tauri callback ID, supports status/result/cancel reconciliation. Backend restart remains a distinct transition.

## Smallest missing evidence and fallback capability

### Required runtime evidence before 193-B

Use a separately authorized, isolated two-page local harness for each supported desktop backend (macOS WKWebView, Windows WebView2 and Linux WebKitGTK). It must record native event sequence plus document-start IPC sequence and cover:

1. Initial creation: prove no necessary `Started` is lost before Tauri attachment, or prove the first-incarnation fallback activates safely without treating a caller nonce as recency.
2. Same-URL reload and A -> B -> C rapid navigation/cancellation: record `Started`, `Finished`, document-start script and ready IPC ordering; never infer matching `Finished` without an ID.
3. Hold an A-intended eval, commit/ready B, then release it. The negative control must show unguarded eval mutates/reports B; the guarded control must report stale and leave B unchanged.
4. Race an eval already submitted before navigation against the commit. Establish whether it can execute after the native successor boundary and, critically, whether a challenge scheduled by B's `Started` can ever execute in A.
5. Hold A bootstrap/retry and async invoke response; activate B; release A. Assert B remains authoritative, A acquires zero owners, response payload validation rejects A and no callback collision can transfer a grant.
6. Close/recreate the same label and release old lifecycle/IPC/handle actions after replacement. Assert the captured incarnation filters them and an old handle cannot retire/remove the new session carrier.
7. Reorder generation-N and generation-(N+1) challenge evals. Assert max-generation guarding converges to N+1 and only N+1 can activate.

A pure state-machine test can validate the proposed application rules but cannot prove the native event/eval assumptions. The launched platform harness is the missing evidence. This inspection was not authorized to launch it.

### Capability required if the probe cannot prove the boundary

The smallest fail-closed runtime capability is an opaque native `(webview incarnation, navigation/document epoch)` propagated consistently through:

- top-level provisional/commit/finish/cancel/failure callbacks;
- every incoming IPC request, including main-frame identity;
- eval/invoke-response submission with an expected epoch that fails instead of running when the current epoch differs; and
- close/destruction without label re-resolution.

That likely requires a Tauri/Wry extension or platform-specific implementation and is outside this report's authority. Do not invent it in application types, weaken C1, or expand silently into a platform fork. Lead can choose the narrow cross-platform runtime probe first; only an actual failed boundary then requires the capability ruling.

## Suggested post-proof implementation/test fence

No 193-B source should be assigned solely from this source trace. If the platform probe validates the conditional mechanism, the smallest cohesive application fence is likely:

- native lifetime/session state beside the existing ownership kernel (a new exact `artifact_ownership/session.rs` path would require a numbered fence amendment), plus its private tests;
- existing `tauri-app/src-tauri/src/main.rs` for manual builder/lifecycle registration;
- existing `commands.rs` / `commands_types.rs` for typed bootstrap, reconciliation and guarded ownership envelopes;
- existing/new `audit_artifact_ownership.rs` coverage for the native transition matrix;
- existing `tauri-app/src/lib/bridges/artifact-ownership.ts` and `.spec.ts`, plus `main.ts` for bootstrap; `App.svelte` only if native client-session lifecycle cannot remain in the bootstrap service.

Permanent application tests must include the Round02 C1 matrix: duplicate same-document bootstrap; B activation before delayed A; both simultaneous orders; terminal old-client retries; stale window incarnation; old finish/response after new start; and zero 193-A acquisitions by every rejected caller. C2 operation-key recovery tests remain separate from the runtime proof.

## Candid limits

- This is installed-source evidence on the local macOS host. Windows/Linux branches were read, not executed.
- No app/WebView was launched, so exact WK/WebView2/WebKitGTK scheduling, initial callback timing and submitted-eval/navigation races remain unproven.
- No compile probe was run because it would only confirm already-visible signatures, not the runtime ordering question.
- No current production failure is claimed: the application has not yet implemented the C1 ownership/session protocol.
- 193-A remains accepted only as the in-memory ownership kernel. C1–C3, filesystem safety, IPC/session integration, producers/consumers and aggregate AI-IMP-193 acceptance remain open.

## Handoff

This report raises a narrow technical evidence/capability gate, not an owner product-policy decision. Preserve candidate `6e12a73` unchanged. Lead should rule between (a) a separately bounded cross-platform runtime probe of the conditional challenge mechanism and (b) an explicit runtime-capability amendment if such proof is unavailable. Do not begin 193-B from callback names alone.
