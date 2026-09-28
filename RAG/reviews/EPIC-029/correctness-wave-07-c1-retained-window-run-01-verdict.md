# Retained-window Round03 accepted for one bounded run

Review Lead, 2026-09-07. PROJECT-RECORD rev0.87. **C1-RW-RUN-01** is authorized for the Review Lead only. This accepts preparation, not a runtime outcome, initial-document proof, production enablement or193-B.

## Reviewed and frozen

- Round03 report **d5b9f06dab8b36b2523ddff4331ac75dbfea72245f3cfde4bba5995f58c68165** and all14 authored hashes independently match. Exactly driver.rs/protocol.rs/README.md changed from frozen Round02. Candidate independently clean6e12a73783c7119dae9b6add947e1b5085abe003; main clean. Dependency manifest/lock and remaining11 authored files unchanged.
- Lead reviewed the entire three-file delta including nine new pure regressions and actual receipt/Finished call sites. H25 now rejects detected contradictions through the native-selected child record, preserves poison through lifecycle callbacks, fails completion, and leaves B/accounting intact for delayed wrong A. Expected late Finished remains diagnostic. Original exact-key conflicts and recovery stay intact.
- Independently reproduced **44 tests:42lib+2bin,0failed/ignored/filtered,doc0**, plus fmt/check/all-target clippy-Dwarnings/build offline/locked with TAURI_CONFIG unset and JavaScript syntax. Code Lead reports a behavior-preserving extraction red baseline14pass/5fail, then17pass/2fail before final19/0 protocol tests; these historical red runs are reported evidence, not independently rerun here.
- Preserved14 source/fixture files and submitted binary **e1ed6376fa4ddc72f94f38b03f2d9223bac7f825198ffc325165a1aa28c917e6** before lead builds in `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-review-r3.iuWPrw`.
- Separately frozen lead-built arm64 Mach-O **cbad33ecf7df9e44ba37f88a88c8b22271b4cacf173bee58d98ac18985b988a3** at `color-tool-c1-retained-r3-lead-build` in that same review root. Only this executable may run. Both artifacts remain unexecuted at this verdict.

## Exact authority

Run exactly once:

```text
env -u TAURI_CONFIG /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-review-r3.iuWPrw/color-tool-c1-retained-r3-lead-build --run /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-c1-retained-window.PEEpxt/run-20260907-retained-first-reviewed
```

The output child was independently confirmed nonexistent. Let the reviewed binary create it atomically; do not precreate, reuse or clean it. No retry, source fix, rebuild-as-retry, config override, feature/dependency change, manual UI/app control or production/candidate action is authorized.

The reviewed config creates no default window, uses local embedded assets only, and installs no plugins/server/network/media/preferences/production entrypoint. Runtime creates its one hidden/unfocused/nonfocusable accessory parent and incognito uniquely labelled children. Six finite cases use20-second receipt waits and a300-second driver watchdog armed after initial setup. Lead retains terminal supervision; if setup or exit hangs beyond360 seconds from launch, terminate only this exact launched process/session, record failure and preserve partial evidence. This supervision does not claim the in-app watchdog covers setup.

Record actual process exit and stderr separately from terminal-success ledger text. Inspect all ordered cases/required receipts, contiguous sequence, native/renderer joins, shutdown outcome, before/after authority/accounting, retained parent identity/inner-size/scale, actual requested target and child bounds. Unexpected/missing evidence is failure or unknown as appropriate, never an automatic retry.

## Claim boundary and next handoff

A successful finite run establishes only observed hidden macOS mechanics and the forced stale-work controls in this build. It does not authenticate an unseen initial frame, prove every callback schedule/native child destruction, test pending ordinary command-response routing, observe window position/focus/Spaces/fullscreen/visual continuity, establish power-loss durability, enable production unstable or close C1-C3/193-B.

Review Lead writes a fresh runtime result after the single run. Code Lead remains stopped without polling; no correction or further experiment is assigned by this verdict.
