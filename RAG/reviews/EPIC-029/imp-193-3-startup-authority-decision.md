# IMP-193-3 renderer startup-authority decision

Code Lead -> Review Lead, 2026-09-08. Governed by PROJECT-RECORD rev0.90 and the focused `imp-193-3-startup-authority-brief.md`. This is a read-only source decision. No candidate, experimental source, dependency, feature, build, test, process, App, Window or WebView was changed or run.

## Decision input: constrained go

**Recommendation: CONSTRAINED GO for IMP-193-4 preparation only. Do not adopt the mechanism in production or start IMP-193-5.**

The fixed Round03 path supports a narrow application safety claim: if the authority-bearing renderer is trusted packaged local main-frame code, each native child has a unique, pre-minted, nonrenewable authority tuple, and any reload, navigation, process replacement, contradictory context or ambiguous startup permanently retires or poisons that child, then an initial-empty-document ordering anomaly can make startup fail but cannot grant a different document successor authority. The evidence supports **fail-closed safety**, not reliable startup or native frame authentication.

This requires a Review Lead/owner contract ruling. The reliability boundary would be the trusted packaged local document and single-document lifetime of a uniquely labelled native child WebView. Matching href, renderer nonce, label and incarnation remain diagnostics and contradiction detectors; they do not make an arbitrary or compromised same-origin renderer authentic. A product contract that requires recovery inside the same child after reload/navigation/process replacement is incompatible with this recommendation.

| Claim or assumption | Status | Evidence | Consequence |
| --- | --- | --- | --- |
| A child receives one native-minted tuple before construction and never receives a successor tuple | Source-supported in the frozen experiment | `src/driver.rs:1145-1162`; `src/protocol.rs:270-282,342-421` | Removes the old N -> N+1 predecessor-acquisition direction. |
| Initialization is main-frame document-start code on each top-level navigation | Tauri API contract and locked implementation | Tauri `2.11.5/src/webview/mod.rs:819-876`; Wry `0.55.1/src/wkwebview/mod.rs:777-788` | Excludes subframe injection on macOS, but means a later top-level document sees the same static bytes. |
| An unexpected document cannot bootstrap through this script before native sees its context | Source-supported under trusted-local code | `assets/harness.js:1-26,141-154`; `src/driver.rs:487-555`; `src/protocol.rs:433-492` | Wrong href/nonce/child/incarnation poisons, and failed or lost document-start reporting never reaches bootstrap. |
| An implicit initial empty document never receives the user script, or always orders relative to commit/IPC in one particular way | **Unknown and unnecessary for the narrow safety claim** | Wry creates `WKWebView` before adding scripts, then explicitly navigates: `wry-0.55.1/src/wkwebview/mod.rs:425-426,585-597,636-657`; Apple directs clients to add `WKUserScript` before creating the web view | Can still cause fail-closed startup loss; no universal liveness claim. |
| Renderer-supplied href/nonce proves document or frame identity against hostile code | Unsupported | Tauri's command path supplies the actual WebView label, but href/nonce are renderer data: `src/driver.rs:487-555` | The threat model must stay trusted-local; this is not a security boundary for hostile renderer code. |
| Reload/navigation/process replacement may reuse authority in the existing child | Rejected by the proposed contract | One allowed policy call and one eligible `Started`: `src/protocol.rs:285-340`; retired/poisoned are terminal at `:417-418` | Recovery requires native child replacement, not renewal. |
| The present production candidate establishes this boundary | False | Candidate `tauri.conf.json:21-30`, `src-tauri/src/main.rs:58-117`, `src/main.ts:37-70`, `src/lib/bridges/tauri.ts:17-85` | Candidate remains no-go as-is; no production authority was earned. |

## Exact supported claim and lifecycle model

The supported invariant is **one authority-bearing trusted local top-level document per unique native child WebView incarnation**:

1. Native code creates a never-reused child label/incarnation and a fixed bootstrap proof/session candidate before constructing the child.
2. The fixed tuple is embedded only in that child's main-frame initialization script. No lifecycle callback, renderer request or reply mints a successor.
3. Native authorization selects the invoking child from the Tauri `Webview` command argument, then checks the pre-minted tuple and native record before any ownership mutation.
4. The first exact intended lifecycle may activate once. A pre-`Started` exact call may only pin that same original and return `NotReady`; the later retry contains the same original, not a new challenge.
5. Any later navigation/policy call, second `Started`, reload, process replacement signal, wrong URL, changed nonce, changed native child, changed incarnation or ambiguous sequence makes the incarnation terminal. Recovery constructs a different child with a different label and tuple.

This is an application reliability/lifecycle contract, not proof that WebKit cryptographically bound renderer fields to a frame. It assumes the packaged local startup code is not malicious and does not fabricate its actual `window.location.href`, captured tuple or document nonce. If hostile same-origin script execution is in scope, this mechanism is insufficient because that code can read the embedded seed and synthesize the diagnostics.

## Locked construction and delivery trace

### Native construction and initialization

The frozen driver calculates exactly `tauri://localhost/{page}`, pre-mints the child's seed, prepends it to `harness.js`, and captures the same label/incarnation/expected URL in builder-local navigation and page-load closures (`color-tool-c1-retained-review-r3.iuWPrw/src/driver.rs:1145-1275`). It then calls `Window::add_child`; there is no post-`Started` challenge creation.

Tauri prepends its core object, invoke transport, metadata and internal initialization before the user script (`tauri-2.11.5/src/manager/webview.rs:157-224`). Runtime-wry installs the IPC handler and forwards all initialization scripts to Wry (`tauri-runtime-wry-2.11.4/src/lib.rs:5164-5175`). On locked macOS Wry:

- constructs the `WKWebView` first (`wry-0.55.1/src/wkwebview/mod.rs:425-426`);
- attaches the navigation delegate (`:585-597`);
- installs raw IPC and the accumulated user scripts (`:636-645`); and
- explicitly navigates to the selected app URL (`:652-657`).

Wry implements the scripts as `WKUserScript` at `AtDocumentStart` with the supplied main-frame-only bit (`:777-788`). Tauri documents user initialization as after global creation, before HTML and page scripts, on all top-level navigations, main frame only (`tauri-2.11.5/src/webview/mod.rs:819-876`). Apple's public [`WKUserScript`](https://developer.apple.com/documentation/webkit/wkuserscript) guidance says to add the user script to the configuration before creating the web view. Locked Wry instead adds it after `WKWebView` construction. Neither the installed source nor the public contract specifies whether an implicit already-created empty document receives that late-added script. That uncertainty remains explicit.

The URL-only navigation decision is also weaker than document identity. Wry extracts only the action request URL and forwards a Boolean decision, without target-frame, navigation-type or navigation-object identity (`wry-0.55.1/src/wkwebview/navigation.rs:49-82`). Wry maps `Started` to `didCommitNavigation` (`:17-35`). These callbacks cannot prove which script instance owns authority.

### Actual report-before-bootstrap path

The fixed script snapshots the seed, creates a per-document random nonce and captures `window.location.href` in its original request (`assets/harness.js:1-26`). Crucially, it calls `report('document-start')` and begins `bootstrap()` only in that report promise's success continuation (`:141-154`). It has no rejection continuation that bootstraps anyway.

`renderer_receipt` obtains the invoking WebView's actual Tauri label and runs the detected-context guard before recording or delivering the receipt (`src/driver.rs:487-520`). The guard resolves the native record by that actual label, compares reported label/incarnation, exact href and any nonce, poisons on contradiction, and only then records a first nonce (`src/protocol.rs:433-492`). `bootstrap` likewise obtains the actual WebView label before consulting native state (`src/driver.rs:522-555`).

There are two early-delivery gaps during construction, but both reduce liveness rather than grant authority:

- Tauri's page-load wrapper resolves the label through the manager and silently omits the callback while the WebView is not yet attached (`tauri-2.11.5/src/webview/mod.rs:762-804`). The navigation closure itself still runs before that lookup (`tauri-2.11.5/src/manager/webview.rs:577-605`).
- Tauri's IPC protocol drops a message when the manager cannot resolve the WebView label (`tauri-2.11.5/src/ipc/protocol.rs:185-188`). Missing core transport, ACL rejection or a dropped receipt likewise prevents the report promise from fulfilling, so the fixed script does not proceed to bootstrap.

If bootstrap precedes `Started` despite a successful exact receipt, the protocol can only pin the original and return `NotReady` (`src/protocol.rs:378-387`). The driver waits for policy, `Started` and document receipt, then evaluates only `bootstrapExact()` for that same pre-minted original (`src/driver.rs:1426-1546`). Eligible exact activation consumes that original; an active exact repeat is `ConfirmedExisting`; retired and poisoned states are terminal (`src/protocol.rs:389-421`).

## Smallest counterexample analysis

For the actual fixed code, the plausible initial-empty schedules are fail closed:

1. **The script does not run in the implicit empty document.** The explicit intended navigation later receives the installed script; ordinary startup may proceed.
2. **The script runs in an empty or wrong document and IPC reaches native.** Its actual href is not the exact native-selected local URL. `renderer_receipt` poisons the native-invoking child and rejects, so the `.then` bootstrap continuation does not run. A later intended document cannot recover that child.
3. **The script runs before IPC/core/manager attachment is usable.** The receipt fails, is dropped or remains unresolved; bootstrap does not run. Startup may hang/fail, but no authority is granted.
4. **The intended document reports before `Started`.** Native may pin only that exact original and return `NotReady`; after the first eligible `Started`, the driver retries the same original. There is no successor proof for an old document to acquire.

The smallest remaining authority crossover therefore requires an assumption outside the proposed model: code in a wrong or compromised document must obtain the embedded seed and deliberately fabricate the expected href/label/incarnation/nonce flow, or the product must allow the same child to survive a later document/process lifetime without terminal retirement. The public APIs do not exclude that hostile-code sequence. This is why the result is constrained rather than an unconditional go.

The older renewing challenge counterexample does not transfer. That adapter minted N+1 at `Started` and could evaluate the new challenge in still-running predecessor A. The fixed design never mints or delivers successor credentials inside an existing WebView. An unacknowledged original can at most activate its own pre-minted tuple; an already active exact retry is idempotent; a retired original cannot renew.

## Source-guaranteed, observed and still unknown

| Category | Finding |
| --- | --- |
| Source-guaranteed for the frozen artifact | Unique pre-mint before child build; builder-local captured identity; main-frame-only document-start registration; strict report-before-bootstrap continuation; native-invoking label selection; context poison before receipt delivery; one policy/one eligible `Started`; same-original `NotReady` retry; no successor mint; terminal retirement/poison. |
| Observed only in accepted finite Run01 | 198 rows, 6 cases, 43 required renderer receipts, 7 unique children, policy -> `Started` -> document-start receipt -> `Finished`, same native parent and exact resize, exit 0. No `about:blank` or contradictory document was observed. `correctness-wave-07-c1-retained-window-run-01-result.md` SHA256 `7fce8facd661d0be5fd01c7ee682e85ab5f6c47131c3cc2ed534eeeae030ccdf`. |
| Still unknown | Whether an implicit initial empty document receives Wry's scripts added after `WKWebView` creation; universal document-start IPC versus commit ordering; cancellation of already-running JavaScript/platform callbacks; all content-process replacement signals; pending ordinary command-response delivery; visible focus/first responder, flicker, z-order, Spaces/fullscreen/restoration; other platforms. |

The finite run supports feasibility and regression behavior only. It is not used here as universal ordering proof.

## Candidate state and product consequence

The candidate was rechecked clean at `6e12a73783c7119dae9b6add947e1b5085abe003`; root `Cargo.lock` SHA256 remains `05e43199d69c11db31155cec2378633f1867344daa99c748cdc4c42843f89734`, locking Tauri `2.11.5`, tauri-runtime `2.11.3`, tauri-runtime-wry `2.11.4` and Wry `0.55.1`.

The candidate's configured default window is auto-created (`tauri.conf.json:21-30`), native setup and invoke registration contain no incarnation/bootstrap owner (`src-tauri/src/main.rs:58-117`), renderer startup mounts normally (`src/main.ts:37-70`), and the generic bridge carries no session envelope (`src/lib/bridges/tauri.ts:17-85`). Production therefore has none of the constrained invariant. This report does not change that state.

Owner-visible cost is deliberate fail-stop behavior: reload, navigation, dev HMR, renderer content-process replacement or ambiguous startup makes the current child unusable and requires a fresh native child. Retaining the OS window also continues to require the separately unapproved `tauri/unstable` child-WebView surface. If the owner rejects either the trusted-local boundary or fail-stop replacement contract, the retained-window route is no-go. The bounded choices are then (1) accept stable whole-OS-window replacement and its focus/z-order/Spaces/fullscreen/restoration risks, or (2) stop this route and authorize a separately designed mechanism; more hidden harness refinement will not turn URL/renderer fields into frame authentication.

## Exact IMP-193-4 fence

IMP-193-4 is meaningful only after the Review Lead records a numbered decision and the owner approves all of the following as a proposed product/reliability contract:

- trusted packaged local main-frame startup code is the boundary, not hostile-renderer authentication;
- one authority-bearing document is allowed per unique native child;
- every later navigation/reload/process replacement/contradiction/ambiguous startup permanently retires or poisons that child; and
- startup delivery loss is permitted to fail closed and recover only by constructing a fresh child.

After that ruling, only a separately reviewed, isolated visible-test preparation/run may assess owner-facing child-replacement behavior. It must retain the existing production/candidate fence, use fresh unique child labels and authority, keep native-owned state outside the renderer, and test focus/first responder, initial paint/flicker, sizing, z-order and relevant macOS window modes. Preparation is not launch authority; launch requires its own gate. No production feature, integration design, IMP-193-5 work or acceptance is implied.

## Validation and friction

- Candidate HEAD/status, root lock hash and locked versions were rechecked read-only.
- Frozen Round03 driver/protocol/harness paths and locked installed framework source were reread at the cited lines.
- No application gate was rerun because the assignment forbids build/test/runtime work and makes no source change.
- `git diff --check` is run at handoff. Because this report is a new untracked file in an already dirty planning tree, ordinary `git diff --check` does not inspect its content; an explicit no-index check is included in the handoff validation.

The principal source friction is genuine: Tauri's high-level initialization contract is stronger about document-start/main-frame scope than locked Wry's source is about the already-created initial empty document, and the navigation callback intentionally discards frame/navigation identity. The fixed script makes that uncertainty a liveness issue under the proposed model, but cannot erase or authenticate it. No further unbounded source or harness audit is recommended.
