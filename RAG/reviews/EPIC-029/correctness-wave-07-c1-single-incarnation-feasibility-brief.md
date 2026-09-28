# C1 nonrenewable WebView incarnation — bounded read-only feasibility

Review Lead -> Code Lead, 2026-09-07. PROJECT-RECORD rev0.81 and C1-H15 govern. **Read-only API/source check plus one report; no implementation, build, test, run, dependency or app change.** This is one new seam hypothesis, not another general193 protocol review.

## Hypothesis selected by Review Lead

Avoid renewing authority across multiple documents in one native WebView. The native incarnation admits at most one authority-bearing document; any subsequent navigation/reload/crash retirement cannot create another session in that incarnation. To admit a replacement, native code must construct a new WebView with fresh captured identity. An old request cannot learn the new incarnation through a reply or current-label eval, and old native callbacks carry their original identity.

The accepted registry and non-renderer owners remain outside renderer lifetime; no deletion, cache flush, timeout ownership expiry or loss of pending export/snapshot/clipboard owners follows from retirement. Full C2/C3 design and implementation are not part of this check.

## Four exact feasibility checks

1. Determine whether the currently locked/enabled Tauri/Wry public APIs can replace the authority WebView while retaining the OS window and its geometry/focus. Distinguish actual enabled API from feature-gated, unstable, private or fork-required surface. If whole-window replacement is the only available shape, name that consequence rather than assuming owner acceptance. Do not add a feature or use a private selector.
2. Trace initial WebView construction/navigation/document-start order and the actual navigation-policy callback. Can local initial app navigation be admitted once, with later document navigation fail-closed until native replacement, without treating URL equality, renderer nonce, repeated policy calls, subframe navigation, reload or redirects as document identity? Address initial about:blank and a challenge arriving before the first authority document. Native incarnation must be nonrenewable; do not reintroduce a current-label eval grant into a predecessor.
3. Identify the smallest source-backed lifecycle/identity boundary that rejects queued old work after replacement and retains registry/non-renderer owners. Distinguish unproved safety from a merely inconvenient but fail-closed startup. Do not implement ownership transfer or redesign C2/C3.
4. List only the concrete current candidate attachment references affected (window creation/config, existing main-label assumptions, renderer reload/bootstrap references), with line citations. This is an impact inventory, not authorization or a Files-to-Touch amendment. State any unavoidable user-visible reload/window behavior for Review Lead to discuss with the owner.

Use the current clean6e12a73 candidate and exact installed tauri2.11.5/runtime2.11.3/runtime-wry2.11.4/wry0.55.1 source; existing accepted reports and immutable harness evidence may be read. Reuse existing citations where exact. No broad search, alternate machine provisioning or speculative implementation plan.

## Fence and deliverable

Only authored output: planning **RAG/reviews/EPIC-029/correctness-wave-07-c1-single-incarnation-feasibility.md**. Keep it concise: answer each feasibility check, exact source/feature evidence, remaining unsupported premises and owner-visible consequences. Recheck candidate HEAD/status and both ledger hashes. Do not edit any source/config/manifest/lock, earlier report, snapshot, ledger, ticket, PROJECT-RECORD or generated INDEX. No commands that build/test/launch or change processes/settings.

Send path/hash and stop without polling. If the hypothesis is not supported by the current public surface, say exactly where it fails. Review Lead, not this report, decides whether a different runtime seam or owner-approved behavior is warranted.
