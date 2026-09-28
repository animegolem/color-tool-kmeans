# AI-IMP-202 B11 first real strict-v2 capture proof submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev 0.40 §10.19. Review state: **SUBMITTED WITH VALID-ACTION CORRELATION FAILURE; v2 artifact sealed, loss-free, and invalid-input-complete; no performance, eligible-import, or ticket acceptance claim.**

The accepted B10 app completed the assigned ordinary-UI run and produced a strictly parseable v2 seal with six contiguous renderer batches and closes, no dropped events, one renderer clock, and both actual empty inputs preserved in the required exact three-event unavailable/unverified form. The valid multi-digit inputs did not correlate honestly to their fresh analysis executions: the intermediate `4` actions carried the eventual 46/45 configs and closed `unverified/input-value-unresolved`, while the final 46/45 actions closed `deduped/request-key-unchanged`; no native receive/return record was attributed to any action. Visible K46/K45 readiness does not repair that trace failure. This is therefore a successful persistence/seal diagnostic and a failed settled-valid-correlation gate.

## Exact identities and scope

- Bundle: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9/cargo-target/release/bundle/macos/Color Tool Profile B10.app`
- Executable: `Contents/MacOS/tauri-app`, SHA-256 `c11d0fc2391bc6068a4e8586cbf3bb7d2965f4f023bed169ee0be1cc7152142d`
- Identifier/title: `com.color.tool.profile.b10.r8bf3187` / `Color Tool Profile B10`
- Accepted build manifest: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9/attempt-01/build-manifest.json`, SHA-256 `5df45bb76cf6f1e166cee99137359b30aba50f835be31cd7d79bffbb476ad976`
- Launch-local session: `COLOR_TOOL_PROFILE_SESSION=b11-control-20260906-01`
- Private evidence root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9/b11-capture-01.1X95GF`, mode 0700; retained files mode 0600
- Source material: `/var/folders/xf/rq944nws6psgkhb73fmdftgm0000gn/T/codex-clipboard-e94c2a0b-fa7f-4c34-8d0a-ab6b9928deff.png`, 608,455 bytes, SHA-256 `e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790`
- Exact private copy: `palette-wheel-reference.png`, same byte count and SHA-256 before/after

This was one profiling-on diagnostic/control run. It was not a timing distribution, quiet-host run, off/on comparison, overhead measurement, numerical oracle, eligible acquisition/import, case-bound run, geometry/reflow pass, flame graph, or performance verdict.

## Preflight, launch, and continuity

- Before launch, exact B10 process count was zero and both exact B10 Application Support/cache namespaces were absent. Executable, manifest, owner input, accepted source hash list, branch `codex/correctness-wave-01-2026-09-05`, HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`, and exact 57-path source state matched the accepted handoff.
- `launch-b11.mjs`, SHA-256 `c81f10b13429d5f1aff60fe5127c9331dc610bf9478602a7da6cbcfc8a99123b`, spawned only the exact executable with inherited environment plus the reserved session variable, `detached:true`, ignored stdin, file-backed stdout/stderr, and `unref()` after the spawn event.
- One launch occurred at `2026-09-06T15:35:24.312Z`; receipt `launch-receipt.json`, SHA-256 `eb840c1b49fd24c5b9068febd0ffe9962e6f06870d67d4b0f3cdbfa40579256f`.
- Actual PID 57783, PPID 1, process start `Sun Sep 6 10:35:24 2026`. The exact executable path and targeted session key/value matched before UI work and at final preservation. Final exact-process count was one; no restart, PID replacement, process adoption, or termination occurred.
- Exact native trace appeared before media at `/Users/golem/Library/Caches/com.color.tool.profile.b10.r8bf3187/profiling/profile-b11-control-20260906-01.jsonl`, mode 0600. Its first record was schema v2, session match, native clock `native-57783-18d2c54a51b16808`.
- B10 event-log/stderr evidence contains one initial `pageshow:persisted=false` and one initial `renderer:mounted visibility=visible`; no later root pageshow or renderer mount. The Home view unmounted for the assigned Values visit and remounted once for the authorized final Colors return. This is bounded continuity evidence, not proof of every possible renderer lifetime.
- Initial window evidence showed the unique B10 title, `Profiling launch enabled`, and `Finish capture`: screenshot `initial-window.jpg` SHA-256 `6559b26294ebf14f6cbd0fc3215ad2a606eda34e0c0652c56d202c84d358b693`; transcribed full initial AX `initial-ax.txt` SHA-256 `6badccf8da9017d2a08b469270e4ee34389a22a6288bc86e13b727fa0069c260`. The AX file labels its provenance and does not misstate the later no-change diff as a full tree.

## Ordinary UI sequence and actual visible outcomes

1. The ordinary native picker resolved the exact private-copy URL/path and imported only `palette-wheel-reference.png`. No Desktop inventory or substitute asset was used.
2. Loaded Colors visibly completed K45 with quality 2, exclude top 0, merge 0, snap enabled, and three charts. Actual modes were histogram Frequency, polar OKHSV, and hue-lightness Chroma. The rendered diagnostic line was `16 ms · 19 iterations · 72,900 samples`. Evidence: `loaded-window.jpg` SHA-256 `a4c4ebaea12fa39d4b15be6558ae8879eb4c82b59592589d2d437da28ee16a5d`; paired AX `aefd8b14ab4a879bc1b3f96a5dd9f41f62f84879fdd55c987f6c51a6bedee31`.
3. The number field received ordinary click -> select all -> delete -> type `46` in one tool invocation with no intentional wait/capture during deletion. Event-log progression was `clusters=null -> 4 -> 46`, then `pending clusters=46 -> ready clusters=46`. Newly rendered Top 46 showed `18 ms · 19 iterations · 72,900 samples`. Evidence: `k46-window.jpg` SHA-256 `d495a0fcca88064fffa6d15f6608539e9303620f8b21fdc4e41ab9634d360693`; paired AX `7c7c578df950ac958f1735164f89dfcb86f4c9858fc454c3255c13c8306a378f`.
4. The same ordinary interaction replaced 46 with 45. Event-log progression was `clusters=null -> 4 -> 45`, then `pending clusters=45 -> ready clusters=45`. Newly rendered Top 45 showed `15 ms · 19 iterations · 72,900 samples`. Evidence: `k45-return-window.jpg` SHA-256 `2d3a9fa12f04e63fd308cc4f86fe571b93770dbf1515b86ad9e9edd66dde1b73`; paired AX `2976c5819501abe6ceb641ece04ba6cf5e81446348536a2cb7f27f99bcf4e728`.
5. Ordinary Colors -> Values navigation retained the same named study and rendered Original, Neutral Values, range finder, histogram, and simplified tones with the persistent profiling header. Evidence: `values-window.jpg` SHA-256 `3eeb4fb3075cadb1d4980e279d0cf041bec0278a102a6370a6a35dbb49c7ac7f`; paired AX `cb18751a910a1f76fa9f7039054fe7e8b80997e33908c6b1de72328c2319f584`.
6. `Finish capture` was pressed exactly once. The settled UI showed `Trace sealed · validation pending` with Finish disabled; no retry was used. Strict raw inspection subsequently established `sealValid=true`. Evidence: `finish-window.jpg` SHA-256 `ade374884be90006ce0778ea86ce6a7a5473a7a1321103b3473ce428f7de552c`; paired AX `d34b6cb1d1265d7122fbf89eb990097275947439b43beb016c05740172705bf4`.
7. On that positive seal, ordinary Values -> Colors navigation occurred once. Final Colors retained the same image preview, Top 45, q2/exclude0/merge0/snap, and all three charts. Evidence: `final-colors-window.jpg` SHA-256 `1b81db8f59113fc08fb6ea33bcb400cbba4dd02978590cfd24535ee60818650f`; paired AX `17ae1a091fb50423f05c5fa357c4e303f9628dc55325280ff3ce0f44058951f9`.

The displayed 16/18/15 ms values are retained UI observations only. They are not trace-correlated end-to-end measurements and support no speed or regression inference.

## Strict raw trace inspection

- Live trace and immutable private copy `native-trace.raw.jsonl` were each 15,910 bytes and SHA-256 `b9f7706b7a3c7293e97a7d674f153146227f7786e9202336979bf8757cc983d2` at the post-final-Colors comparison. A second live rehash at `2026-09-06T15:52:01Z` matched and retained the same byte count and mtime. The first live/copy hash was not taken in the intended interval between Finish and final Colors; the evidence therefore proves identity only from the post-navigation comparison through the second rehash, not the stronger unobserved pre-navigation interval.
- Existing `MAX_TRACE_BYTES` (8 MiB), `parseTraceJsonl`, `organizeTrace`, and `inspectActionEvidence` were used unchanged through `inspect-trace.mjs`. The size was checked before the bounded regular-file read; no parser, schema, source, raw record, or seal was edited.
- Strict parse: schema versions `[2]`, valid JSONL/schema, not truncated, 14 records total: one `trace-session`, six `renderer-batch`, six `action-close`, one `session-seal`.
- Organization: six actions/batches/closes; batch sequences `[1,2,3,4,5,6]` contiguous; close sequences `[1,2,3,4,5,6]` contiguous; one renderer clock `renderer-b11-control-20260906-01-7866ac3d-2d00-4b92-b4cf-e9252e98828d`; zero native actions, receives, or returns; zero losses and final dropped count 0.
- Seal: present and valid; `recordCount=14`, `eventCount=28`, `actionCount=6`, `closedActionCount=6`, `nativeReceiveCount=0`, `nativeReturnCount=0`, `rendererBatchCount=6`, `rendererEventCount=20`, `artifactByteCount=15910`, `droppedEventCount=0`, `lastBatchSequence=6`, `sealed=true`; `tainted=false`.
- Inspection receipt `trace-inspection.json`, SHA-256 `41d6d31c7bfa20dd712c30d9957d0d7c64d6c5ca246bd81c3f31073a6410b5f1`.

### Every persisted action

| Seq | Delivered input | Evidence arm | Events | Actual terminal | Native receive/return | Inspector coherence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `clusters`, `invalid-or-empty` | unavailable / `input-target-invalid` | 3: delivered, resolved, outcome | `unverified` / `input-target-invalid`; no endpoint; fresh=false | false / false; no native phases | coherent=true; exact unavailable three-event=true |
| 2 | `clusters`, number `4` | resolved config K46/q2/exclude0/merge0/snap | 3: delivered, resolved, outcome | `unverified` / `input-value-unresolved`; no endpoint; fresh=false | false / false; no native phases | coherent=true; target association=false |
| 3 | `clusters`, number `46` | resolved config K46/q2/exclude0/merge0/snap | 4: delivered, resolved, schedule, outcome | `deduped` / `request-key-unchanged`; no endpoint; fresh=false | false / false; no native phases | coherent=true; target association=true |
| 4 | `clusters`, `invalid-or-empty` | unavailable / `input-target-invalid` | 3: delivered, resolved, outcome | `unverified` / `input-target-invalid`; no endpoint; fresh=false | false / false; no native phases | coherent=true; exact unavailable three-event=true |
| 5 | `clusters`, number `4` | resolved config K45/q2/exclude0/merge0/snap | 3: delivered, resolved, outcome | `unverified` / `input-value-unresolved`; no endpoint; fresh=false | false / false; no native phases | coherent=true; target association=false |
| 6 | `clusters`, number `45` | resolved config K45/q2/exclude0/merge0/snap | 4: delivered, resolved, schedule, outcome | `deduped` / `request-key-unchanged`; no endpoint; fresh=false | false / false; no native phases | coherent=true; target association=true |

Both actual empty deliveries persisted exactly as required: three renderer events, unavailable analysis config with `input-target-invalid`, terminal unverified with the same reason, and no native span. All six actions closed with no omission or loss. No setup action existed before the two ordinary replacements. The settled valid actions failed the independent correlation requirement: neither final 46 nor final 45 has a fresh native or renderer endpoint, and the first-digit actions expose mismatched delivered targets versus eventual config. This is the exact failing gate; UI readiness is not substituted for trace evidence.

## Retained evidence and preservation

- Complete 36-file evidence index: `final-artifact-hashes.sha256`, SHA-256 `e74e4789268419bd23996b938fe6fe3a22c5bea5f47c42857f12836ea3ddd6ee`.
- Detailed ordinary-UI/control transcript: `operator-transcript.md`, SHA-256 `78fc46463d88cadc81b02f6bdebd74a397fa52cfa6742da9056aaee11fe1f51e`.
- B10-only settings snapshot: `settings.final.json`, SHA-256 `0cfed410fad78322b9f6cb8127f0049c011e12e01a72913a1fdca66c33b37d3d`; it confirms final K45/q2/exclude0/merge0/snap, three charts, and Frequency/OKHSV/Chroma modes.
- B10-only event-log snapshot: `event-log.final.txt`, SHA-256 `919644be2d1389d9c51e1928407549af7114e50a89d6fee0c2b4d529cd8dac07`; it records exact input intermediates, ready K46/K45, Values work, and final Colors remount.
- Detached stderr snapshot: `stderr.final.log`, SHA-256 `bef48702535244c233639afdfa054fa8d64fd1e8573883e83d68967208a0ba14`; stdout snapshot was empty, SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- Final continuity/hash receipt: `final-continuity-and-hashes.md`, SHA-256 `89d73a570dadf83b38cbf40395e3a6e5425a74f8eb413b7c3d78032ad43b86dc`.
- All accepted source hashes checked OK after capture. `diff` between the before receipt and `git status --porcelain=v1 -uall` returned empty; exact count remained 57. Candidate branch/HEAD, source, build, archive, manifest, symbols, locks, and Git were unchanged.
- B6/B7/B2/A0 evidence and ordinary apps/owner workloads were not modified or controlled. No rebuild, install, source fix, cleanup, export, Batch action, geometry action, second session, trace import, full suite, direct IPC, DevTools, or event injection occurred.

## Candid friction

- Initial attachment by app name failed before UI interaction with ScreenCaptureKit `SCStreamErrorDomain Code=-3811`. Exact-bundle attachment then returned the unique B10 window. Later `getApp('Color Tool Profile B10')` rebound the same existing PID's active `Open` sheet so its fresh element IDs could be used; no launch, process replacement, or renderer remount followed.
- The first picker attempt reached and verified the exact private-copy path, but AX still exposed Open as disabled after selection. Unsupported uppercase `ENTER`/`RETURN` key names were rejected before dispatch; native-sheet coordinate clicks were rejected as `noWindowsAvailable`; AX double-click/disabled-Open attempts made no state change. The picker was canceled without import. The second ordinary picker retained the exact directory; its documented AX row action selected the exact PNG, and xdotool-style `pressKey('Return')` completed the sole import.
- The assigned normal multi-digit text interaction necessarily emitted an intermediate `4` after each empty. The UI correctly reached fresh ready 46/45 states, but the trace attributed the subsequent execution config to the first digit and deduped the settled final value. This is evidence of the remaining correlation defect, not operator timing evidence.
- The first live/copy trace hash happened after rather than immediately before final Colors navigation, as disclosed above. No stronger bounded durability claim is made.

## Result and open gates

B11 positively proves real packaged v2 persistence for actual empty inputs, contiguous action/batch/close records, an honest loss-free valid seal, one renderer clock, same-study Values continuity, and final K45 UI persistence. It does **not** prove settled-valid action/native endpoint correlation, action measurement availability, performance, eligible acquisition/import, geometry/reflow, exact WebContent attribution, parity/overhead, quiet-host distributions, flame graphs, numerical truth, platform coverage, owner acceptance, or ticket closure.

Stop point: review gate. The exact B10 process remains open as PID 57783 on Colors with the same study, final K45, and the sealed profiling header. Review Lead owns diagnosis, any source remediation ticket, and any later fresh-session authority; this sealed session must not be resumed or reclassified.
