# C1 harness preparation Round02 — narrow provenance AMEND

Review Lead -> Code Lead, 2026-09-07. PROJECT-RECORD rev0.76. Binding amendment C1-H13 below. **No harness launch, candidate modification, or193-B authority.**

## Review receipt and accepted corrections

Round02 submission SHA256 **fc845013d879e8e5ea572148c40abb3761436ff20fb7aee90d327f216787e92c** fully read. Lead independently matched the submitted source/config/icon/lock hashes and pre-build executable191ebde7, reviewed the corrected protocol, real IPC reply projection, diagnostic path, lifecycle/exit policy, seven case joins, callback/report validation, and trace finalization. Candidate rechecked clean at6e12a73783c7119dae9b6add947e1b5085abe003.

Lead reproduced with TAURI_CONFIG explicitly unset: fmt PASS; offline check PASS; all-target clippy with warnings denied PASS; pure tests **24 library +1 binary config =25 passed,0 failed,0 ignored**, doc tests0; offline build PASS. No compiled main executable, App, event loop, or WebView was launched.

Accept C1-H7/H8 corrections, the H9 lifecycle/exit mechanism, H10 exact activation/delivery joins and dispatch-versus-execution distinction, and H11 exclusive ledger/seven-case terminal gate as preparation-level source and pure-test evidence. The eight reported before-fix assertion failures remain Code Lead-attributed evidence; this lead reproduced the final counts, not the historical failing sittings. These are not actual macOS or C1 acceptance.

Lead preserved all14 Round02 source/config/fixture files in **/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-harness-review-r2.U6Hnyn**. The independent build regenerated the executable with SHA256 **6993c0f13d29229c65be634c45b857471349d2cde6cb75a8345c50de02056ac4**; that exact unexecuted artifact is preserved there as color-tool-c1-harness-r2-lead-build. It is not asserted byte-identical to the previously verified submission executable191ebde7. Original Round01 snapshot and both reports remain immutable.

## C1-H13 — Synthetic lifecycle provenance must survive into each ledger row

One concrete residual mismatch prevents preparation acceptance. Case6 driver.rs:2444-2455 directly invokes on_page_load twice for the deliberately injected old Started/Finished callbacks. Unlike on_window_lifecycle, on_page_load accepts no actuality argument. Its event rows at446-451 and506-511 use source tauri-on-page-load, evidence Observed, and the TraceRecord::event default actuality actual. Thus a reader of those two rows would see fabricated callback releases labeled as actual platform events, contrary to H9/H10 and the Round02 report's claim that all three late lifecycle controls are distinctly labeled synthetic.

Carry explicit provenance from the actual builder callback and the synthetic case6 call sites through the same on_page_load transition/recording path. Actual callbacks must remain labeled actual platform observations; synthetic Started and Finished rows must explicitly identify the injected-control origin and synthetic actuality. Do not infer provenance from the fake visit string, rejected result, or current case. Preserve the actual matching destruction observation and the distinctly synthetic late destruction. No native callback fabricated by the driver may be reported as an observed platform delivery.

Add a compiling before-fix regression on the actual record-construction path, then permanent positive and negative tests for Started and Finished provenance. A helper extraction within driver.rs is permitted if needed to exercise the actual recording logic without a WebView. The tests must assert serialized event/source/actuality fields for actual versus synthetic inputs; a disconnected test-only record or substring check of the source is insufficient. Retain existing protocol nonmutation tests and all25 current tests.

## Exact next fence and handoff

Only existing harness **src/driver.rs** may change. No other harness source, README, dependency, manifest, config, icon, lock, candidate file, prior report, or frozen snapshot changes. Do not split files or launch a process/App/WebView. This is one evidence-provenance correction, not another general protocol review.

Run the compiling before-fix assertion and retain its verbatim output in the new report, then offline fmt/check/all-target clippy/pure tests/build with TAURI_CONFIG unset and target-harness. Report exact counts, driver old/new hash, final unexecuted binary hash, and unchanged hashes for the other13 manifest paths against the preserved Round02 source. Recheck candidate clean6e12a73.

Write only planning **RAG/reviews/EPIC-029/correctness-wave-07-c1-harness-preparation-submission-round-03.md** outside the harness. Include the compact before-fix assertion transcript, source-to-test evidence, honest build identity, and remaining runtime limits. Send path/hash to Review Lead and stop without polling. Review Lead will decide first-launch authority after this correction; do not invoke the prospective run command.

Retention-only R, fast-switch caches, native owners, main/app/evidence preservation, Windows/Linux uncertainty, and all production C1-C3/193 acceptance gates remain unchanged. No owner decision is needed for this bounded correction.
