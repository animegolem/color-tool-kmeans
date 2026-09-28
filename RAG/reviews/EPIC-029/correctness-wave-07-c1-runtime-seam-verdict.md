# Wave07 C1 source review accepted; isolated harness preparation

Review Lead -> Code Lead,2026-09-07. PROJECT-RECORD rev0.73. This is a narrow implementation-evidence ruling, not a change to C1 or retention-only R.

## Accepted evidence

Reviewed the complete source-seam report correctness-wave-07-c1-runtime-seam-review.md, SHA256 **559ee81e4a79564ee54433815d0600391f5e86cde4d7a98b65fe13d43b61585c**. Candidate remains clean at6e12a73783c7119dae9b6add947e1b5085abe003. Lead independently inspected locked PageLoadPayload/InvokeRequest fields, global/local label lookup, WK didCommit and eval queue/callback code, GTK Committed and WebView2 ContentLoading handlers, and auto-configured-window creation before setup. The report correctly distinguishes useful callbacks from a correlated document capability.

Primary documentation corroborates the need for care, not the full proposed guarantee: [Apple didCommit](https://developer.apple.com/documentation/webkit/wknavigationdelegate/webview(_:didcommit:)) describes main-frame content receipt; [Microsoft navigation events](https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/navigation-events) explicitly describes overlapping navigations distinguished by NavigationId and cases without ContentLoading. Current Wry discards the corresponding navigation object/event args. These documents do not prove predecessor-terminal eval ordering.

## Binding lead rulings C1-H1 through C1-H5

1. **Accept the source review, not a proven impossibility.** Public fields lack direct correlated document identity. This does not by itself require a runtime fork; a native-issued challenge protocol remains a hypothesis to test. Keep C1 unchanged: an old request cannot advance or replace the current lifetime.
2. **Do not make all-platform runtime access a global prerequisite to useful local preparation.** Prepare an isolated macOS harness now; Windows/Linux runtime acceptance remains open. A macOS pass cannot authorize a cross-platform production guarantee. No new machine/VM/install/remote coordination is implied.
3. **Finite runtime trials are evidence, not proof over all schedules.** Separate documented/source invariants, directly observed events, forced delayed-message cases and pure protocol-model cases. A test ledger saying pass does not establish a missing platform guarantee. Report unknown ordering honestly.
4. **Freeze the app.** No candidate source/manifest/config or normal Color Tool launch/data action. No Tauri/Wry fork or upgraded dependency. Only the separate harness directory and specified submission may change in this phase. Build and pure non-WebView tests are authorized; launching the harness requires lead source/config/namespace review first.
5. **Test the candidate mechanism without promoting it.** Manual native builder captures a fresh incarnation; only native Started may advance its document generation; Finished/request/retry cannot. Deliver challenges to the current page via guarded eval, never in an old caller's promise. Embed expected incarnation plus monotone generation guards. Record bootstrap as a separate native-validated transition before any actual193-A registry lease. Initial delivery must fail safely if an event/receiver was absent; do not add an unproven caller-authorized fallback to make a case green. Lost eval callback before first commit is not success.

The next authority is correctness-wave-07-c1-harness-preparation-brief.md, not193-B. No owner decision is presently required. R remains selected; partial-deletion/tombstone/finer-retention obligations from193-A remain open.

