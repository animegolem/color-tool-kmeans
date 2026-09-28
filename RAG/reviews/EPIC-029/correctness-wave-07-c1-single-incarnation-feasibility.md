# Wave07 C1 nonrenewable WebView-incarnation feasibility

Code Lead -> Review Lead, 2026-09-07. Governed by PROJECT-RECORD rev0.81 and C1-H15. This is the report-only result requested by `correctness-wave-07-c1-single-incarnation-feasibility-brief.md`; no source, config, feature, dependency, candidate, harness, ledger, process, app or runtime action was taken.

## Receipt and result

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`, clean `## codex/correctness-wave-01-2026-09-05`, unchanged HEAD `6e12a73783c7119dae9b6add947e1b5085abe003`.
- Candidate `Cargo.lock` SHA256 `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`, locking Tauri `2.11.5`, `tauri-runtime` `2.11.3`, `tauri-runtime-wry` `2.11.4` and Wry `0.55.1`.
- Governing closeout verdict / feasibility brief SHA256: `e7fd4a48346ee344f43daecd6609bf4535f3a97890f4e00893a68dc1fd9e37fe` / `ffb92c432d2d0d8daa82ff8c91671aad5a25177250e14f0919416e729efa9fdd`.
- PROJECT-RECORD rev0.81 SHA256 `605a724fec060fe3a1591642eb4831090ce2bc4bd8f2bfffd3e306f00c6cb7ac`.
- Accepted Run02 / preserved failed Run01 ledger SHA256 remain `0ef15c196b95ff523b32c62e600e1fd3f4f6389ff1b7e3702c0baf0bc481ad4f` / `bf09f57400e64a4bf39f1995a209db5d6507d3a40dc2cd6795ca779facd1bec5`.

**Result:** one authority-bearing document per newly constructed WebView is source-feasible as a conservative application rule, but the currently enabled stable Tauri surface can realize replacement only by creating a **new OS window**. Retaining the existing OS window requires Tauri's public-but-`unstable` child-WebView surface, which the candidate does not enable. Reliable first-document admission is not proved: the available URL-only navigation policy and page-load callbacks can support a fail-closed one-shot, but cannot identify a document, correlate redirects/reloads, distinguish subframes or prove initial `about:blank`/document-start ordering. This is therefore a bounded conditional seam, not production C1 acceptance.

## 1. Replacement API and native-window consequence

The candidate enables Tauri's default Wry runtime plus only `protocol-asset` and `devtools` (`tauri-app/src-tauri/Cargo.toml:20`). It does not enable `unstable` or `macos-private-api`.

On locked Tauri, `WebviewBuilder` and `WindowBuilder` are public only under `feature = "unstable"` (`tauri-2.11.5/src/webview/mod.rs:257-281`; `src/window/mod.rs:106-135`; re-exports at `src/lib.rs:235-237`). `Window::add_child`, the operation that can add a fresh managed WebView to an existing `Window`, is likewise gated by `all(desktop, feature = "unstable")` (`src/window/mod.rs:1126-1146`). Tauri defines that feature independently of `macos-private-api` (`tauri-2.11.5/Cargo.toml:108-110,130`). Therefore:

- **Current enabled stable API:** cannot replace the authority WebView while retaining the OS window.
- **Feature-gated public API:** after an explicit future `tauri/unstable` decision, `Webview::close` followed by `Window::add_child` can remove the old child and build a new child in the same `Window`. `Webview::close` dispatches close and removes the Tauri webview entry (`tauri-2.11.5/src/webview/mod.rs:1501-1505`); runtime close removes the private-ID entry (`tauri-runtime-wry-2.11.4/src/lib.rs:1712-1721,3815-3823`); locked Wry removes the old `WKWebView` from its superview on drop (`wry-0.55.1/src/wkwebview/mod.rs:1396-1415`). The retained `Window` preserves native window identity and therefore its geometry, but the new WebView must be focused explicitly (`tauri-2.11.5/src/webview/mod.rs:1535-1538`). Source does not prove first-responder continuity or absence of a blank/flicker interval.
- **Stable whole-window shape:** `WebviewWindowBuilder` is available, but it owns a `WindowBuilder` and a `WebviewBuilder`, and `build` creates both (`tauri-2.11.5/src/webview/webview_window.rs:47-51,101-106,437-440`; `src/window/mod.rs:334-430`). That is a new OS window, not a replacement child in the old one.
- **Raw/private alternatives:** stable `Webview::with_webview` exposes the current platform handle (`tauri-2.11.5/src/webview/mod.rs:1608-1677`), not a supported Tauri-managed replacement factory. Direct Cocoa/Wry construction, a runtime extension or fork is outside the enabled surface and this assignment.

Whole-window replacement preserves app-owned native state only if the Tauri application remains alive. `AppManager` owns an `Arc<StateManager>` (`tauri-2.11.5/src/manager/mod.rs:183-196`), whose values remain pinned in its map (`src/state.rs:100-133`). But the candidate uses the convenience `Builder::run` (`tauri-app/src-tauri/src/main.rs:58-117`), which is `build` followed by `App::run` with an empty callback (`tauri-2.11.5/src/app.rs:2445-2451`); locked runtime requests exit when the last native window is destroyed unless that request is prevented (`tauri-runtime-wry-2.11.4/src/lib.rs:4310-4323`). A stable replacement therefore needs either overlapping differently labelled windows or explicit last-window-exit handling. Neither behavior exists or is authorized here.

## 2. Initial document and nonrenewable admission

The candidate window omits `label`, `url` and `create` (`tauri-app/src-tauri/tauri.conf.json:21-30`), so locked `tauri-utils` defaults it to label `main`, `App(index.html)` and `create = true` (`tauri-utils-2.9.3/src/config.rs:1917-1939,2294-2300`; `WebviewUrl::default` at `:122-125`). Tauri resolves `index.html` to the configured dev URL or the production app base, `tauri://localhost` on macOS (`tauri-2.11.5/src/manager/webview.rs:430-460`; `src/manager/mod.rs:337-365`). Configured windows are built before the candidate's `setup` body (`tauri-2.11.5/src/app.rs:2520-2532`).

On the locked macOS path, Wry creates the `WKWebView`, installs its navigation delegate, installs Tauri and builder initialization scripts, and then explicitly navigates to the resolved URL (`wry-0.55.1/src/wkwebview/mod.rs:569-597,636-657`). The scripts are `WKUserScript`s at document start (`:777-788`), and Tauri marks ordinary initialization scripts main-frame-only and documents that they run on every top-level navigation (`tauri-2.11.5/src/webview/mod.rs:819-876`). Wry emits `Started` from `didCommitNavigation`, after calling the page-load handler it drains first-commit queued eval strings (`wry-0.55.1/src/wkwebview/navigation.rs:17-35`). This source contains no explicit `about:blank` navigation, but it does not prove that an implicit initial empty document cannot run a script or callback, nor does it prove document-start IPC ordering against `didCommit`.

The actual stable navigation policy is only `Fn(&Url) -> bool` (`tauri-2.11.5/src/webview/webview_window.rs:245-269`). Wry extracts the request URL and forwards only that Boolean decision; it ignores the webview argument and does not inspect target frame, navigation type or navigation identity (`wry-0.55.1/src/wkwebview/navigation.rs:49-82`). It therefore cannot identify the authority document or safely pair repeated same-URL calls, subframe navigation, reload, redirect or finish.

A nonrenewable incarnation can nevertheless be **safe by failing closed**, with these boundaries:

1. Native code pre-mints one opaque incarnation and one nonrenewable bootstrap proof before constructing the WebView, embeds them in that builder's main-frame document-start script, and captures the same incarnation in its callbacks. No `Started` callback or renderer request creates a successor proof.
2. Navigation policy is only a guard: allow the intended local initial request once; an unexpected or ambiguous later policy request is denied and poisons the incarnation. It never increments identity or makes URL equality authoritative. Repeated callbacks, a subframe action or a redirect may therefore make startup fail closed; that is inconvenient but not an authority crossover.
3. Only the first captured-current `Started` for the intended app URL may open preactivation. A wrong-URL or `about:blank` callback/request poisons the incarnation; any later `Started`, reload, navigation or process-termination observation retires it permanently. No document inside that WebView can renew it.
4. If the initialization request arrives before the first eligible `Started`, native returns `NotReady` with no challenge, incarnation, session or grant. The exact pre-minted request may retry only while that same incarnation remains unactivated and unpoisoned; retry cannot mint or select a successor. After activation or retirement, every retry is terminally rejected.
5. Activation consumes the one bootstrap proof once. Any success acknowledgement carries no new authority; there is no current-label eval grant and no reply from which a predecessor can learn a successor incarnation. A later document sees the same static script bytes, but native state has already consumed or retired their proof.

This removes C1-H15's renewing `Started`/eval predecessor-acquisition direction: there is no N+1 challenge to execute in predecessor A. It does **not** prove a reliable first startup. In particular, the public policy has no main-frame fact, and the installed source does not settle implicit `about:blank`, first policy-call shape, redirect needs, document-start IPC versus commit, or an already-dispatched platform callback. The only safe answer to any such ambiguity is to poison/retire and require native replacement.

The C1-H15 distinction remains intact: old A carrying its activated N session is rejected as retired; old A with `knownSession = None` also cannot acquire N+1 here because this incarnation never mints or delivers a successor challenge. A fresh proof exists only inside a separately constructed native WebView.

## 3. Smallest lifecycle/identity boundary and owner retention

The smallest source-backed authority boundary is an application-owned, never-reused `WebViewIncarnationId` created before each WebView, captured in every builder-local lifecycle closure, embedded with the fixed one-shot bootstrap proof, and stored in the same app-managed native owner as the current/retired state. Every authority-bearing invoke and every delayed native completion must compare its captured `(incarnation, activated session)` to that state **before** `ArtifactRegistry` acquire/register/release mutation. Retirement changes only the session/incarnation state; it does not clear the registry, caches, operation records or other non-renderer owners.

This boundary must not be replaced by a label or returned `Webview` handle. Tauri page-load wrappers resolve a reusable label at callback time (`tauri-2.11.5/src/manager/webview.rs:288-311`; `src/webview/mod.rs:762-772`), while runtime eval/close dispatch uses a private per-WebView ID (`tauri-runtime-wry-2.11.4/src/lib.rs:257-288,365-402,3745-3752`). After close, queued dispatch for an absent private ID has no new target; however, source does not prove cancellation of JavaScript already executing. A delayed result reaching a successor must therefore carry the old incarnation and be rejected both before native publication and by the successor's document guard.

Fresh Tauri labels per incarnation are the safest management shape. Same-label reuse is documented after close, but `Webview::close` removes Tauri registry state by label after dispatching close to the old private ID (`tauri-2.11.5/src/webview/mod.rs:1501-1505`; `src/manager/mod.rs:663-665`), so a retained old handle can remove a same-labelled successor's public entry. Captured application identity still rejects authority mutation, but does not repair that label-map side effect. A retained `main` OS window plus unique child-WebView labels would avoid the collision, but that is the unavailable `unstable` path; stable unique whole-window labels affect capabilities and UI identity.

The accepted `ArtifactRegistry` is presently only an in-memory module (`tauri-app/src-tauri/src/artifact_ownership.rs:17-29`) exported from `src/lib.rs:5-8`; it is not attached in `main.rs`. A future attachment beside session state can outlive WebView/window replacement through app-managed state, but only while the application does not exit. This report does not implement that attachment, ownership transfer, C2/C3 recovery or process-restart persistence.

## 4. Exact candidate attachment impact and owner-visible behavior

This inventory is not a Files-to-Touch amendment or implementation authority.

- `tauri-app/src-tauri/Cargo.toml:20`: currently enabled Tauri features do not include `unstable`; preserving the OS window would require a feature decision here. No change was made.
- `tauri-app/src-tauri/tauri.conf.json:6-10,21-30`: establishes the dev/prod app URL and auto-created default `main` WebviewWindow. A per-incarnation builder must be created after native identity exists; stable replacement means another native window.
- `tauri-app/src-tauri/src/main.rs:58-90`: setup currently manages `EventLog` and `ProfileState` only and runs after configured-window creation. There is no C1/incarnation owner or `ArtifactRegistry` attachment.
- `tauri-app/src-tauri/src/main.rs:91-117`: the window-event callback only logs focus, invoke registration has no C1 gate, and convenience `run` has no last-window `ExitRequested` prevention for a close-then-recreate sequence.
- `tauri-app/src-tauri/capabilities/main.json:1-10`: permissions match window label `main`. Locked capability rules apply a matching window capability to all of its child webviews (`tauri-utils-2.9.3/src/acl/capability.rs:150-174`), so retained `main` plus uniquely labelled children would remain covered on the unstable path. A stable successor window with a fresh label would not match this file.
- `tauri-app/src-tauri/src/lib.rs:5-8` and `src/artifact_ownership.rs:17-29`: registry code exists but is not a runtime-managed owner.
- `tauri-app/src/main.ts:37-70`: renderer preload, preferences hydration and Svelte mount begin without a native-lifetime bootstrap boundary.
- `tauri-app/src/lib/bridges/tauri.ts:17-85`: generic invoke resolution carries no incarnation/session envelope.
- `tauri-app/src/App.svelte:123-127,169-175,214-227,257-300`: mount/page/focus/visibility events are diagnostic, while zoom resolves the current WebView dynamically. They cannot authorize or renew an incarnation. The current renderer contains no explicit reload or navigate call; reload/HMR/platform navigation would still be terminal under this hypothesis.

With the current stable surface, any reload, navigation or renderer crash that retires authority requires a whole-window replacement to recover. Even if size/position/fullscreen values are copied, a new OS window has a new native identity; source does not guarantee continuity of focus, z-order, macOS Space/Stage Manager placement, fullscreen animation, restoration identity or freedom from flash/blanking. Development HMR/reload would likewise poison the authority window until replacement. These are owner-visible product consequences for Review Lead/owner ruling, not accepted behavior.

## Unsupported premises retained

- No launched probe establishes that the conservative first local policy request succeeds without an earlier/duplicate/subframe callback, that implicit `about:blank` is invisible, or that document-start IPC follows the first eligible commit.
- No source establishes cancellation of an already-executing old script/platform callback at close; permanent native and document-side incarnation checks remain necessary.
- Retaining an OS window is not available without the unapproved `unstable` feature. Stable whole-window replacement still needs a lead-selected label/capability and app-exit strategy.
- No Windows/Linux behavior, production integration, C2/C3 recovery, registry attachment or owner acceptance is inferred from this macOS installed-source check.

The candidate, both ledgers and every previously accepted report remain unchanged. Review Lead must decide whether the `unstable` retained-window surface is admissible or whether the owner accepts whole-window replacement before any C1 implementation fence is opened.
