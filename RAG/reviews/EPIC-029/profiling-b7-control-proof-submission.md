# AI-IMP-202 B7 first real operator-finalization proof submission

Code Lead → Review Lead, 2026-09-06. PROJECT-RECORD rev 0.35 §10.14. Review state: **SUBMITTED WITH FAILED FINALIZATION; bounded control evidence preserved; no seal; no ticket or performance acceptance.**

The reviewed packaged app exposed the profiling-only control, accepted the exact still, observed real Colors changes, preserved the study across Colors → Values, and attempted Finish through the ordinary Values-hosted UI. The single Finish ended `Capture failed · renderer-persistence-failed`. The raw native artifact contains two cumulative `batch-sequence` loss records and no renderer batch, action close, native action, or seal. This was not an allowed open-action-pending retry state, so no retry, restart, fallback, direct IPC, further navigation, or performance experiment occurred.

## Exact identities and scope

- Bundle: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/cargo-target/release/bundle/macos/Color Tool Profile B6.app`
- Executable: `Contents/MacOS/tauri-app`, SHA-256 `869ce8df24d5b9c251253197979de656f778f8343fed71726fc981cd73314fb6`
- Identifier/title: `com.color.tool.profile.b6.r8bf3187` / `Color Tool Profile B6`
- Accepted build manifest: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/attempt-01/build-manifest.json`, SHA-256 `a24eaaefca59a2d7f59233a8a1f458d73ca67d2aaf9c0d80ebfdc6c9f57b726a`
- Launch-local session: `COLOR_TOOL_PROFILE_SESSION=b7-control-20260905-01`
- Private evidence root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/b7-capture-01.CMdcCN`, mode 0700; retained evidence files mode 0600
- Source material: `/var/folders/xf/rq944nws6psgkhb73fmdftgm0000gn/T/codex-clipboard-e94c2a0b-fa7f-4c34-8d0a-ab6b9928deff.png`, 608,455 bytes, SHA-256 `e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790`
- Exact private copy: `palette-wheel-reference.png`, same SHA-256. Source and copy remained hash-identical after the run.

This was one profiling-on diagnostic/control run. It was not a timing distribution, quiet-host run, off/on comparison, overhead test, numerical oracle, eligible acquisition, trace-import acceptance, full workload, flame graph, or performance verdict.

## Preflight, launch, and continuity

- Before launch, exact B6 process count was zero and both exact B6 Application Support/cache namespaces were absent. Accepted executable/manifest/input hashes matched.
- `launch-b7.mjs`, SHA-256 `5164e1705467aed38ec8f742f28a8bcbb54d2ce0bf90cc6e164b79b47d8821bf`, spawned only the exact executable with `detached:true`, inherited environment plus the one reserved session variable, ignored stdin, explicit file-backed stdout/stderr, and `unref()` after the child `spawn` event.
- One launch occurred at `2026-09-06T08:56:38.486Z`. Receipt `launch-receipt.json`, SHA-256 `991bb31d0124e8fe6303176511e31d4bb4e9924856e2449989bbc0082016b901`.
- Actual child PID 43210, PPID 1, process start `Sun Sep 6 03:56:38 2026`. `ps` reported the exact B6 executable path before controller attachment, before Finish, after Finish, and at final preservation. Targeted process inspection returned only the reserved session key/value; no environment dump was retained.
- `/usr/bin/proc_pidpath` was unavailable on this host (`no such file or directory`), so the independently visible full `ps ... comm` path plus exact preflight executable hash are the retained executable-binding evidence. No guessed binary or generated binary execution occurred.
- Exact trace path appeared before media input: `/Users/golem/Library/Caches/com.color.tool.profile.b6.r8bf3187/profiling/profile-b7-control-20260905-01.jsonl`, mode 0600. Its header session ID matched and native clock was `native-43210-18d2af87aca0df10`.
- Initial and final exact-process log inspection found one `[renderer] renderer:mounted` and one `pageshow:persisted=false`; no second root mount, process loss, reload, or replacement was observed. This is bounded evidence, not proof of every possible renderer lifetime.
- Exact initial screenshot/AX showed the uniquely titled B6 window, `Profiling launch enabled`, and `Finish capture`. Hashes: `initial-window.png` `6d784974ef6e9e4d20817fc545dab835799e1b759c6e135af92ef5f44e42aaee`; `initial-window.ax.txt` `28e2b5e2b1268a3c54116a46119b8b15be85f2d37c8bdd18dff7f321e0722102`.

## Ordinary UI sequence and actual outcomes

1. The native picker resolved and selected the exact private-copy `file:///.../b7-capture-01.CMdcCN/palette-wheel-reference.png` URL before ordinary Open. No Desktop inventory or substitute asset was used.
2. Loaded Colors visibly completed K45 with 100 ms, 19 iterations, and 72,900 samples. Visible/retained setup was K45, quality 2, exclude top 0, merge 0, snap enabled, and three charts. Display modes were histogram Frequency, polar OKHSV, and hue-lightness Chroma. Evidence: `loaded-k45-window.png` SHA-256 `065c65e17de5843c17f16a0e1a3af61a365af2108f13a7a5cdba98806b875186` and paired AX `7378b076d261d49c11173ef8ad13d3c3abdfd219b8bf986fd9ba1d4e402995ab`.
3. The visible number field changed 45 → 46. The first post-input state still showed the old Top 45 result, so readiness was not inferred from the control alone. The next bounded state showed newly rendered Top 46 with 104 ms, 19 iterations, 72,900 samples. `k46-window.png` SHA-256 `771d0513bab3d567550aca319ebe3307224ee04841cdf0c78c3099d70965eee7`; paired AX `250ceadce56a323428770e9ef1f7242085d31829c0dfc78f510c83dc3a9725eb`.
4. The same visible field changed 46 → 45. The bounded transition was followed by newly rendered Top 45 with 119 ms, 19 iterations, 72,900 samples. No empty-field action was observed. `k45-return-window.png` SHA-256 `0ec356276c0acb45976287eb4f494a61215706858708b6ddc8dda303573465d5`; paired AX `85c6789273318b5bdfaeb0c7dfde274d8bf94ece2862d8aae5ff63b2f258eafb`.
5. Ordinary Colors → Values navigation retained `palette-wheel-reference.png`, Original/Neutral Values, and the persistent profiling header. Before-Finish screenshot `671cc4bef0e86c070c891f942f5af3594a61de01d936b0b31b82435337dba47b`; paired AX `2da81e71a877b0d320ee6e8ba38b5a7bd2e83db06dd791e320392becb1ee3798`.
6. `Finish capture` was pressed exactly once from Values. The terminal UI immediately reported `Capture failed · renderer-persistence-failed`, with Finish disabled. Failure screenshot `52bd64c44c4c3ecce5591c0079658ec31bb5ae6abc5d618fa074f6f4555e511c`; paired AX `bcbf1a460ac6b0594d73a8f3ee5121cd6c48f7affa4a0a7fd245d2c140498c28`.
7. Because this was not coherent renderer/native open-action pending, no retry was authorized. The app was left open on Values in that exact failure state; there was no return to Colors, geometry action, further input, export, Batch activity, direct invocation, or second session.

The displayed 100/104/119 ms figures are preserved diagnostic UI observations only. Host conditions were not controlled, the trace did not persist the actions, and no performance inference is accepted.

## Raw trace and strict inspection

- The live trace and exact private copy `native-trace.raw.jsonl` were both 748 bytes and SHA-256 `037e79faafcb58844fbcf463f8ba78d1e91e4bad51c124db47f75fae2c626770` at the post-Finish copy and final bounded recheck.
- The copy ends with a newline and has exactly three records: one `trace-session`, then two `session-loss` records.
- Loss 1: cumulative `droppedEventCount=4`, `errorCode=batch-sequence`.
- Loss 2: cumulative `droppedEventCount=8`, `errorCode=batch-sequence`.
- Existing `MAX_TRACE_BYTES` (8 MiB), `parseTraceJsonl`, `organizeTrace`, and `inspectActionEvidence` were used unchanged through `inspect-trace.mjs`. The 748-byte read was bounded before parsing.
- Strict parse outcome: valid JSONL/schema, not truncated, record count 3. Organization outcome: action count 0, renderer batch count 0, action-close count 0, native action/receive/return counts 0, renderer clock count 0, loss count 2, final dropped total 8, seal absent, `sealValid=false`, `tainted=true`. With no persisted action IDs, there are no per-action outcomes/coherence codes to inspect.
- Inspection receipt `trace-inspection.json`, SHA-256 `1ebde2cf955e8cd2bcdd8b0190816f6feba0dfad5ef9c448c8b90e1f565f8efa`.

The evidence establishes that native persistence rejected two renderer-batch attempts on batch-sequence validation and that renderer Finish surfaced persistence failure. Because neither rejected batch is present, this artifact alone cannot map those two attempts to exact UI actions or establish the precise originating sequence defect. No unfamiliar outcome was relabelled and no record was synthesized.

## Retained evidence and preservation

- Full 30-file immutable-evidence index: `final-artifact-hashes.sha256`, SHA-256 `53b2580382efec31e68ea516e5ff3776dbfef562d2b8592f77aa20bdff9e613a`.
- Detailed operator/picker/controller transcript: `operator-transcript.md`, SHA-256 `5a8e9b23911630069226d98e0b40124b7e8ce1bcb61089c2ef3ace4087990d5f`.
- B6-only settings snapshot: `b6-settings.final.json`, SHA-256 `0cfed410fad78322b9f6cb8127f0049c011e12e01a72913a1fdca66c33b37d3d`. It confirms final K45/q2/exclude0/merge0/snap/three figures and the actual display modes.
- B6-only event-log snapshot: `b6-event-log.final.txt`, SHA-256 `b8b0e1094ef5aa11954a9086b005108930e101ac0b99c4e9f98093bf351fbb03`. It records K45 ready, K46 pending/ready, K45 pending/ready, Values navigation/mount, and shared value-analysis completion.
- Detached stderr snapshot: `b7-app.stderr.final-snapshot.log`, SHA-256 `e7a98ddb91e39d03b0228c7c8664d774ce67317ebc66905be541b5c903c975d7`. File-backed stdout snapshot was empty, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- All 56 source hashes still match the accepted B6 post-build receipt; source checker found 56 OK and exited 0. Exact 56-path status, branch `codex/correctness-wave-01-2026-09-05`, HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`, executable, build manifest, source material, and private copy are unchanged; `git diff --check` passes. Preservation receipt SHA-256 `79b910ac9ad148a3f6ceac8cc9a4cd25e22dacb256070d9079495baedb858241`.
- B2/A0/ordinary apps and owner workloads were not controlled. No source/build/archive/manifest/symbol/lock/Git mutation, rebuild, install, preference write outside normal B6 runtime state, cleanup, or full-suite run occurred.

## Candid friction

- The first controller attachment by identifier failed before UI interaction with ScreenCaptureKit `SCStreamErrorDomain -3811`. PID 43210, one root mount, and one pageshow remained intact. Exact-bundle attachment then returned the unique B6 window. A JavaScript assignment typo (`b6 is not defined`) occurred after target lookup; one further exact-bundle call bound the same target. No process restart or renderer remount followed.
- The first AX click on `Image dropzone` made no UI change; one click on the visibly rendered Add media button opened the picker.
- The Go-to-path sheet carried a prior B2 evidence path from picker history. It was replaced with the exact B7 private path. After resolution, AX temporarily reported Open disabled while the screenshot showed the ordinary Open button enabled; one coordinate click did not close the picker. A fresh AX state then reported Open enabled, and its AX button completed the import. The exact selected file URL was verified before Open.
- `proc_pidpath` was absent, as disclosed above. No alternate process introspection requiring environment dumps or app control was used.
- The optional narrow/restored geometry observation was unrun because the terminal capture failure required stopping interaction.

## Result and open gates

B7 positively proves the packaged profiling-only control mounts, follows the real shared study into Values, observes the bounded K changes, and exposes an honest terminal persistence failure. It does **not** prove native sealing, usable trace integrity, per-action persistence, renderer-clock binding, action coherence, eligible acquisition, import, geometry/reflow, exact WebContent attribution, parity/overhead, quiet-host latency, repeated distributions, flame graphs, numerical truth, platform coverage, or performance acceptance.

Stop point: review gate. The exact B6 process remains open as PID 43210 on Values with `Capture failed · renderer-persistence-failed`. Review Lead owns diagnosis, any new source ticket, and any later fresh-session authority; this failed session must not be resumed or silently adopted.
