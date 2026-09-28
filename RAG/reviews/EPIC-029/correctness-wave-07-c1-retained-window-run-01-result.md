# C1-RW-RUN-01 — accepted finite hidden macOS result

Review Lead, 2026-09-07; PROJECT-RECORD rev0.88. **The one authorized retained-window run passed.** This establishes bounded hidden native-window retention and forced stale-work behavior for this artifact. It does not authorize production adoption or close the initial-document premise.

## Exact execution and preservation

- Governing run verdict SHA256 **0997401e407a1ee0c4a6a284ee95457af676bdd0dc70917457af3f8d71d0fd3c**. Round03 preparationd5b9f06d was accepted only after lead reproduced44 pure tests and all locked preparation gates.
- Executed once: frozen arm64 `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-review-r3.iuWPrw/color-tool-c1-retained-r3-lead-build`, SHA256 **cbad33ecf7df9e44ba37f88a88c8b22271b4cacf173bee58d98ac18985b988a3**, unchanged after execution.
- Exact fresh output: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/run-20260907-retained-first-reviewed/ledger.jsonl`. SHA256 **ce6daf15aa74dc05f2336971b1da0a6c7ae5b861c1ccb3eb29150a6ca5ce6897**,198 newline-terminated contiguous records, unchanged on final recheck.
- Launched at approximately2026-09-08 03:21:32 UTC (2026-09-07 Central). Actual terminal process **exit0**, no stdout/stderr. The ledger covers0.930547167 seconds through terminal append; this is not a wall-clock process-duration claim. No watchdog/lead termination, retry, manual window control or source repair.
- Host independently read as macOS26.6.2 build25G83; locked Tauri2.11.5/runtime-wry2.11.4/Wry0.55.1. Production/candidate remained clean; candidate6e12a73/root lock05e43199 unchanged. The unexecuted submittede1ed6376 and all previous artifacts remain preserved.

## Independent ledger checks

The lead's read-only audit `audit-run-01.cjs` in retained-review-r3.iuWPrw, SHA256 **6c1c87f696e02afdaa4a7b06d8d7d68abc1e88c96b1f0a03155237be3a41fc30**, exits0. It reads the exact ledger and frozen trace specification; it does not launch the spike.

- Six ordered starts/completions; **43 required receipts** (9/8/8/6/6/6), each present exactly once in its case. No failure/context-rejection rows. Sequence197 observes ExitRequested0;198 is the single final terminal-success. Actual process exit is separately observed, not inferred from that row.
- Seven admissions with unique child labels1..7 and serials1..7. Each observed sequence is initial policy -> Started -> renderer document-start -> Finished, then native activation/renderer acknowledgement. All observed URLs are the native-selected local page. No about:blank was observed; this says nothing about an unobserved initial empty document.
- Actual renderer receipts were joined to native-child label, admitted incarnation, expected URL, diagnostic document nonce and relevant request/operation identity. The renderer nonce is first-observed diagnostic data, not a native-generated frame identity.

## Case outcomes

| Case | Bounded result and ledger evidence |
| --- | --- |
| Initial admission/recovery | Child1 activates once; exact original confirms without changing authority/accounting; changed nonce conflicts. Real current lease1 acquire/release/idempotent release restores the native baseline. Sequences14-35. |
| Known A -> B | A's real lease2 is retained. Held A bootstrap/acquire/release reject as retired after child2 activation. Current B's attempt to release A's handle independently rejects at owner-session binding. Full B/accounting snapshots stay equal with2 active leases. Sequences38-72. |
| Ignored acknowledgement | Child3's activated and confirmed-existing replies are actually received but deliberately ignored by application code, both reporting lastBootstrapIsNull=true. Active exact-original confirmation is state-preserving. Held original after child4 activation rejects retired without new credentials or mutation. Sequences87-118. This is simulated application-level ACK loss, not transport loss. |
| No same-child renewal | Child5's requested reload reaches navigation policy and is denied; later ownership request rejects retired. Child6 activates separately. Sequences137-158. No replacement document in the retired child is claimed. |
| Old completion/guard | Held old acquire rejects retired. Current child7 first applies its valid marker control; explicit stale child6 delivery reports accepted=false with the same marker and unchanged native snapshot. Sequences179-186. Forced delivery is not pending ordinary callback routing. |
| Parent/resize/finalization | Same public opaque parent pointer throughout all swaps;6 close returns and6 old-label absences. Parent and child reach the exact requested physical size, final owners remain intact, cases finish and process exits0. Sequences189-198. |

Initial parent was1280x960 physical pixels at scale2. All19 pre-resize swap/add parent samples match its opaque pointer **0xb688fc500**, inner size and scale exactly. The deliberate811x613 logical request produces1622x1226 physical pixels. Actual resize sequence1 is after request boundary0; parent getter and child bounds both match target with **zero pixel delta** and child origin(0,0). The pointer remains identical. These are hidden getter/event observations, not window-position or visual-continuity evidence.

Final real registry: one4096-byte resident/live-owned Snapshot group,2 active leases (independent native owner plus retained A session owner), no eligible/claimed bytes or reclaim candidates; current child7 authority is Active. Stale controls do not free either retained owner. This is not a reclamation/cleanup policy test.

## Friction and honest limits

The lead's initial audit selector used source=renderer-ipc alone, which also selected a driver-written summary receipt lacking raw renderer fields. It failed before the join checks. Preserved initial script as `audit-run-01-initial-selector.cjs`, SHAc7b03307e9bdb5043ec02a71de5fdf0316a8135c352d093544f14f64d0b05936. Corrected only that read-only audit selector to require rendererReported=true; full audit then passed. No ledger, runtime source or binary changed and no native rerun occurred. An oversized first ledger display was truncated; selected remaining rows were reread and the full198 rows were audited programmatically.

This run does **not** prove native child destruction, every possible callback schedule, the initial-empty-document binding, native-frame authenticity, pending ordinary command-response delivery, focus/first responder, native window position, flicker/z-order/Spaces/fullscreen/restoration, other platforms, power-loss durability, production C1-C3 or193-B. H25 negative-context cases remain pure regression evidence; no contradictory document was observed in this native run.

## Ruling and next boundary

The practical feasibility question is answered positively: on this locked macOS stack, the standalone public unstable child API replaces WebViews while retaining the native parent and native-owned state through these finite controls. Whole-OS-window recreation is not required for this experimental route.

The authorized isolated experiment is complete. No rerun, visible test, source change, production feature enablement or integration is currently assigned. The remaining initial-document premise and owner-facing interaction acceptance must be addressed explicitly before any product adoption; neither is silently converted into a passed gate by this result. Code Lead remains stopped without polling.
