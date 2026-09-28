# Retained-window Round01 accepted with preparation rulings

Review Lead -> Code Lead, 2026-09-07. PROJECT-RECORD rev0.84. Accepted scope: source-based preparation plan only. **Implement, compile and pure-test the standalone spike now; do not launch it.** No193-B or production changes are authorized.

## Reviewed receipt

Final Round01 report **1b58945c555bae93a7d14d1e3d1185cb96d553cd07b3c20c390a5b23c17cc8e9** fully read and hash matched. An earlier draft6a92af80 was inspected but is not the accepted report identity. Final report explicitly corrects inherited candidate feature union and renderer-reported URL provenance. Lead independently inspected public ns_window, WebviewEvent, child create/attach/label wrappers, auto-resize path, close/Wry removal and actual registry accounting. Candidate rechecked clean6e12a73783c7119dae9b6add947e1b5085abe003, lock05e43199; new PEEpxt root empty. No compile/test/runtime claim in this review.

The six proposed cases are an acceptable decomposition of the brief, not an expanded protocol project. No new source path or dependency is needed. The following rulings govern where report shorthand could overstate guarantees or regress previous harness lessons.

## C1-H17 — retained parent evidence, not inferred child destruction

Use public Window::ns_window only as a read-only opaque non-null pointer value, sampled on the main thread before/after swaps. Do not dereference it or add raw-window-handle/private Cocoa dependencies. Require unchanged pointer, one native parent creation, no parent Destroyed or unexpected ExitRequested during cases, plus actual before/after geometry. Distinguish pointer identity within the live process from a capability or durable identity.

Accept the correction that WebviewEvent has no native destruction event. Log close-requested, close-returned and old-label absence separately; no native-child-destroyed label or cancellation claim. Unique child labels and no repeated close on old handles remain required. Use actual Resized then observed parent/child dimensions, matching coordinate units explicitly; any allowed tolerance is at most one physical pixel per dimension and must be printed, not inferred. This is a hidden mechanics test, not focus/flicker/Space/fullscreen acceptance.

## C1-H18 — conditional admission and native test owners

Implement the report's pre-minted four native fields plus stable per-JS-instance diagnostic nonce, full-key pinning and H16 exact-original confirmation. Preserve the distinction between internal assertions that the same session survived and the wire response: replies carry no proof/session candidate/successor credentials. A digest is unnecessary; a status plus the request's already-held request_id is sufficient correlation and must not authorize anything by itself. No new hashing dependency is allowed for this acknowledgement.

Pinning an early key is a non-authorizing state transition, not activation or a registry allocation. Conflicts and retired calls reject before every registry mutation. Native pre-mint counters, admissions and actual registry allocations must be distinguishable in tests/trace. Nonce and renderer-reported href remain diagnostics; no native main-frame/document fact is inferred from IPC fields. URL-only policy and pre-attachment callback loss remain source-premise limits. Repeated unknown policy/Started events cannot silently mint or renew identity. This experiment does not solve initial-empty-document binding merely by making startup succeed.

Use the real registry with the native-owned Snapshot4096-byte baseline from Round01. Store group/lease capabilities natively; never deserialize renderer-supplied substitutes or let a current child's request release the independent native owner or another child's lease. Minimal native test-owner/session bookkeeping suffices; do not implement production C2 jobs or cleanup policy. Require a valid current acquire/release control and exact idempotent release, alongside stale rejections preserving the current snapshot. Restore the declared baseline before cases that expect two retained leases, rather than loosening accounting assertions. Retirement never flushes the registry or independent owners.

Lost/withheld acknowledgement is a deliberate test control: trace where success was committed, where its renderer acknowledgement was withheld/ignored, and where the identical original was retried. If a response was delivered but deliberately ignored, label that simulated application-level acknowledgement loss, not an observed transport drop. Known-admission A and unacknowledged A must be distinct cases with actual native receipts before the delayed release. No successor authority goes through an old promise.

## C1-H19 — terminal ordering must retain H14

Correct Round01 case6's shorthand that terminal success precedes the controlled exit request. Use the established H14 order: all six named cases and required receipts complete; driver requests controlled exit0 while retaining its event inbox; main-loop ExitRequested is recorded and verifies the exact case/receipt/trace state; only that gate appends and flushes terminal success and acknowledges finalization; the driver retains receiver/watchdog until that acknowledgement. The final observed exit request must not become an append-after-terminal error or be silently omitted by success-before-exit logic.

Required regressions exercise the same helpers the runtime uses: late callback after final case but before exit finalization succeeds; early receiver loss fails; missing/duplicate/out-of-order cases and required receipts fail; write/flush or finalizer-ACK failure cannot yield accepted exit0; watchdog remains armed through finalization. Do not copy the old seven-case count or tests unchanged. A buffer flush is a successful process-visible write, not power-loss durability; do not claim fsync-level durability unless actually implemented. Final process exit status must be reconciled separately at runtime. Actual parent destruction during process teardown is not a required receipt or a fact to invent; distinguish a controlled shutdown request from observed teardown callbacks.

Missing required JS effect receipts fail the case. Ordinary old Tauri callbacks explicitly classified as optional scheduling observations may remain not-observed within their stated bound; they cannot count as cancellation/stale-rejection proof. Eval enqueue/return alone never satisfies a required JS execution receipt. Unexpected callbacks or parse/trace faults must not be globally ignored to pass.

## C1-H20 — exact preparation release and isolation

Source root only:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt

Exactly fourteen prospective authored/generated fixture paths accepted: Cargo.toml, Cargo.lock, build.rs, tauri.conf.json, README.md, src/main.rs, src/lib.rs, src/protocol.rs, src/driver.rs, src/trace.rs, assets/a.html, assets/b.html, assets/harness.js, assets/icon.png. Inline pure tests are sufficient; any extra authored path needs a separate lead ruling. Generated target/schema outputs remain beneath this root. No copies of prior target/run trees; old source may inform new authored code, but all previous material is read-only. Pure tests prefer in-memory trace writers; any test-owned filesystem fixtures must be uniquely created under this root and preserve earlier files, not delete/reuse global predictable temp paths.

The brief's full isolation, separate target, exact version/feature/no-upgrade, local assets, no plugins/data/control/runtime, unset TAURI_CONFIG, deterministic icon, fresh output and explicit --run fences remain. The actual feature union includes the candidate dependency's existing protocol-asset/devtools; document it rather than claiming the graph has only two features. Add only unstable at the new root. Perform one disclosed offline unlocked root-lock reconciliation, inspect package delta, then all fmt/check/pure-test/all-target clippy/build commands and exact tree from the brief. No candidate gates are needed unless its identity changes; if it changes unexpectedly, stop and report, do not repair it silently.

Preparation report: RAG/reviews/EPIC-029/correctness-wave-07-c1-retained-window-spike-preparation.md in the planning carrier only. Include all14 hashes (or fewer explicitly), exact lock delta/feature tree, binary hash/architecture, commands/counts and candid failures, source-backed isolation/CLI and case receipt gates, precise unexecuted future binary command. Do not use cargo run, execute --run, create an App in tests, open a window or launch the binary during this assignment. Default/help behavior is checked through pure parser/config tests; lead may validate the frozen binary separately.

After report/path/hash handoff to the existing Review Lead task, stop without polling. Lead owns independent source/pure/binary review and the separate first runtime assignment. No new owner approval is needed for this already-approved preparation; no production adoption or visible-app experiment is implied.
