# IMP-193-4 preparation round 02 — AMEND, narrow integration correction

Review Lead -> Sol / Code Lead, 2026-09-08. PROJECT-RECORD rev0.95. Submission round02; verdict **AMEND**. Correct only193-4-P13..P15 below, submit fresh round03, then stop. No launch or production authority.

## Identity, preservation and independent gates

Reviewed round02 report SHA256 `fc8e599603bbcde0c222e969f590254ca7f5ad9ecb121303bf5b6cf9ac6d0cb5`. All fifteen source hashes and binary hash match; exactly eight authorized existing files changed and seven remained byte-identical to round01. No extra authored source or symlink; reserved owner run path remains absent. Original round01 report/verdict and frozen roots remain immutable.

Lead reserved fresh `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-review-r2.Z5s0Og`, preserving all fifteen files unchanged under `source/` and submitted binary as `color-tool-c1-visible-r2-submitted`, SHA256 `bc4c0aee09987184fff1b7f80c2c22b5ac3a303cfc564e531b9c23c3822a42f0`. Code Lead must not write this root.

From actual P8xk8N source, with `env -u TAURI_CONFIG` and a fresh Z5s0Og/target-lead, independently reproduced:

- Node syntax and actual validator/projection self-test: pass, Node26.8.1. Node20 remains unrun; no install.
- Cargo fmt, locked/offline check, **52 library +3 binary =55 tests passed**,0failed/ignored/doc0, strict all-target Clippy and locked/offline build: all pass/exit0.
- Preserved transcript `lead-preparation-gates.txt`, SHA256 `f0e449013ef6135058ed62874faab5ade3b934ecbcfe0378b019c3fe6c646d4b`.
- Independently built `color-tool-c1-visible-r2-lead-build`, SHA256 `88f7ba26239521c05951dd7b01be39abfaa568ab4c3d414cc0fd23a92ea79bb0`; both binaries Mach-O64-bit arm64. Inspected main/entry, then default/help/config-only invocations each exited0 without Tauri initialization. Neither binary ran `--run`.

Lead additionally preserved `lead-r2-boundary-probes.rs`/binary/transcript: **1 passing control and3 failing expectations**, exit101. Uses actual public protocol/session library, source-checked receipt predicate and verbatim frozen sample_status function with a non-native sampling seam; it is not an App/IPC execution. Source SHA256 `d15963e2486461f230c1d8d93d4815c9981afd30a22b204c1a9e5d13c8f3354a`; transcript `95096305a2108c0eecd821fe60965212ed71092c432b0da629be57afb391d0e8`.

`lead-r2-validator-probe.cjs`/transcript adds **1 failing fixture-construction expectation**, exit1, by intercepting the actual frozen validator's duplicate-terminal mutator. These four failed expectations are separate from the55 green baseline tests. No native hang, startup run, browser interaction or visible outcome was observed.

## Prior correction disposition

P7 shared failed outcome/watchdog mapping is corrected in source/pure tests. P8 adds independent self-process supervision, worker panic/error signaling, fall-through close/record failure handling and actual ACK classification; preserve those changes. P11 native case projection/focus labels and P12 timestamp/exit/owner-row/admitted-successor validation are materially corrected. Do not reopen those surfaces except P15's small fixture repair. P9's new receipt guard introduces an admission circularity; P10's dispatch still inherits held state guards. These integration blockers prevent preparation acceptance regardless of the green baseline suite.

## 193-4-P13 — Separate protocol-current admission from session-current controls

R2 driver533-545 now gates every renderer receipt on `VisibleSession.current_child_label`. That is None during first-child construction: run_coordinator_inner waits for bootstrap Admission at1542 before calling install_initial_child at1560-1563. Meanwhile actual harness246-248 awaits document-start receipt success before invoking bootstrapExact. Thus the first required receipt is rejected as retired before the operation that could install its session identity. The coordinator's retry requires a BootstrapNotReady action; rejected document-start never invokes bootstrap to produce that action. This is a direct source circularity, not a speculative platform race.

During recovery, session.current_child_label remains A until finish_recovery after B's admission; protocol.current_child_label is already the pre-minted B. B's required receipt is likewise rejected. Lead probes independently establish both valid public-library states and fail the exact source guard, while observe_context accepts the authentic current candidate context.

Fix the actual adapter admission/receipt decision. Distinguish the native protocol-current construction/admission candidate from the admitted session-current child allowed to issue owner controls. Accept the required authentic candidate document-start/receipt-before-bootstrap path without prematurely marking it session-admitted, weakening original authority, minting extra credentials or bypassing bootstrap. Keep owner controls unavailable until real admission.

Retain stale-A isolation after B becomes protocol-current, with no poisoning/cancelling B. Route actual current candidate contradictions during initial startup or an owned recovery into that startup/recovery's explicit bounded failure path; do not misclassify them as an irrelevant retired child or recursively start another attempt. Already-admitted current-child contradiction still follows the approved one-attempt recovery/fail-stop rule. Use actual captured native label and existing frozen protocol observations; protocol.rs remains read-only.

Add pure integration regressions through the helper actually used by renderer_receipt/callback routing: successful first-child receipt -> exact bootstrap -> session admission; successful A->B fresh-child receipt/bootstrap -> finish owned recovery; retired A rejection with B unchanged; initial/replacement candidate contradiction disposition; and owner controls still rejecting pre-admission. Exercise real protocol/session functions and report current counts. Do not merely replace the failed review assertion or install the session identity early to make equality true. No Tauri App construction is needed or allowed.

## 193-4-P14 — Drop snapshot guards before main-thread dispatch

R2 sample_status at1939-1957 constructs `Ok(NativeStatus { protocol: state.protocol.lock().snapshot(), session: state.session.lock().snapshot(), window: sample_window(...) })` in one expression. In this Rust2021 expression, both temporary MutexGuards live through evaluation of the window field. sample_window then dispatches to and waits for the main thread. A queued callback needing either lock before the sampling closure can deadlock until failure supervision, contrary to P10/report/README's no-held-lock claim.

The lead's verbatim-function probe substitutes only a non-native sampler using try_lock; it observes both guards held at the sampling seam. A separate-statement control observes both released. This proves the guard lifetime, not that a native deadlock was run.

Take owned protocol/session snapshots in separately completed statements or explicit scopes, then dispatch/sample with all such guards dropped, then assemble NativeStatus. Preserve main-thread ns_window use, self-wait protection,20-second bound and current-geometry comparison. Add a pure injected sampling regression through the actual runtime-used helper that can acquire both locks at the seam. Check adjacent snapshot/dispatch call sites for this same specific temporary-lifetime pattern; no general refactor or new source file.

## 193-4-P15 — Restore actual duplicate-terminal self-test coverage

audit-visible-run.cjs337 still appends `{ ...records[1], sequence:3 }` for the duplicate-terminal fixture. After P12 expanded fixture() with owner rows, records[1] is a case-disposition-recorded row, not terminal. The test now rejects a misplaced terminal/sequence error with only one terminal, so it no longer exercises the advertised duplicate-terminal check. Lead's actual-self-test mutator probe observes terminal count1 and appended event case-disposition-recorded.

Clone the actual terminal, resequence correctly so unrelated sequence failure does not supply the rejection, and assert the constructed fixture contains exactly two terminal rows before testing the intended rejection. Keep the validator's exactly-one-terminal guard and all other fixtures. This is test-coverage repair, not a request for a broader validator.

## Exact round03 scope and handoff

Same source root `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-visible-replacement.P8xk8N`, namespace and dependency graph. Only **four existing files** writable: `src/driver.rs`, `src/session.rs` (only if needed for the actual P13 helper/tests), `audit-visible-run.cjs` (P15 only), `README.md` (corrected contract/evidence wording only). Other eleven authored files read-only, including protocol, trace, CLI, renderer JS/HTML, manifest/lock/build/config/icon/lib. No sixteenth authored file or feature/dependency/resolution change. If this precise correction truly requires another file/policy, stop and report the missing scope.

Allowed planning writes: fresh `RAG/reviews/EPIC-029/imp-193-4-visible-preparation-round-03.md` and193-4 ticket validated evidence/Issues Encountered only. Original reports/verdicts, both lead review roots, all older hidden evidence, candidate/main and PROJECT/epic/parent/INDEX/other tickets are read-only to Code Lead. Keep four remaining acceptance boxes open; do not complete193-4.

Repeat prior exact Node syntax/actual self-test and env-unset, locked/offline fmt/check/test/strict all-target Clippy/build gates, generated output only source target-visible/gen/schemas. Default/help/config only after source inspection; no App in tests. Report P13..P15 disposition, actual runtime-used test paths/counts/outcomes, all15 source hashes/delta against frozen R2, binary/hash/type, generated inventory, preservation/candidate/main checks and candid LOC/friction/residuals. Preserve P7..P12 corrections and their green regressions.

No App/Window/WebView/--run, reserved run-output creation, browser/desktop manipulation, induced process loss, install, new task/subagent, polling, commit/merge/ref operation or cleanup. No193-5 or production authority. Submit fresh round03 report path/hash and stop. Lead will independently preserve/review/reproduce and decide the separate launch gate. No further owner contract decision is needed for these narrow integration repairs.
