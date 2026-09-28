# C1 replacement feasibility — source facts accepted; owner decision gate

Review Lead, 2026-09-07. PROJECT-RECORD rev0.82. **No implementation, feature change, experiment preparation/build/launch, or193-B authority is granted here.**

## Review receipt

Report **0357cf73b761ea202143462862d87bd06c9d88a8f70636e6b1466f10e3073047** fully read and hashed. Lead independently inspected the enabled candidate Tauri features, locked public/unstable builder visibility and Window::add_child, WebviewWindowBuilder::build, Webview::close/set_focus, Wry drop/removeFromSuperview and capability window-to-child matching. Candidate rechecked clean6e12a73783c7119dae9b6add947e1b5085abe003; both run ledgers0ef15c19 andbf09f574 unchanged; governing record605a724f matched. No source, feature, runtime or app action occurred.

Accept the concrete API inventory: candidate enables protocol-asset/devtools but not unstable; standalone WebviewBuilder/WindowBuilder and Window::add_child are feature-gated. Current stable WebviewWindowBuilder creates a new native window. Public unstable child-WebView replacement can retain the native Window object, but focus continuity, flicker, bounds/resize behavior and first-document admission are not tested or accepted.

The stable current-surface recovery shape would therefore replace the OS window, with unaccepted focus/z-order/Space/fullscreen/restoration consequences and label/capability/last-window-exit handling. The alternative adds the public unstable feature, not macos-private-api, and remains unapproved. Neither route may be silently adopted.

## C1-H16 — do not accept the suggested protocol details as settled

The nonrenewable-incarnation rule remains a hypothesis, not a production safety proof. It removes same-incarnation N+1 renewal, but the initial empty/about:blank/document-start/first-eligible-navigation binding is still open. Fail closed on detected ambiguity; do not claim this solves ambiguity that the public callback cannot detect.

The report's proposed rule that every retry after activation is terminal is **not accepted**. It would discard the existing lost-ack/exact-original recovery obligation. A future pre-minted proof must distinguish idempotent confirmation/recovery of the same already-admitted instance from renewal, a conflicting instance or retired incarnation; no duplicate allocation or new authority may follow. C2/H7 are unchanged, and this is not permission to redesign or implement them now.

Registry/cache/operation/clipboard/snapshot/export owners remain independent of WebView replacement. Neither choosing an API nor retiring a renderer authorizes deleting or flushing their retained bytes.

## Owner-facing recommendation and exact pause

Recommend approval of a **separate isolated retained-window/child-WebView spike with tauri/unstable enabled only in that test crate**, keeping the candidate and running app unchanged. This would evaluate the public API without accepting whole-window recreation or prematurely adopting it in production. No dependency version upgrade, private Cocoa API or fork is recommended.

The prospective spike would need a separately reviewed brief and fresh artifact/identifier/output fence. It must inspect initial-document binding and preserve exact-original recovery, then compile/pure-test before a separate runtime gate; owner approval to explore does not automatically accept the C1 protocol or enable production features.

Pause for the owner's decision on that proposed direction. Code Lead has no active assignment and must not prepare/build/run/change features or poll. If the owner declines the experimental surface, Review Lead will discuss the stable whole-window consequence or another bounded seam instead of assuming acceptance.

The accepted finite run and193-A remain useful evidence; full C1-C3/IO/consumer integration and193-B remain open. R unchanged. This is a new API/product-direction gate, not a new cache-pressure question.
