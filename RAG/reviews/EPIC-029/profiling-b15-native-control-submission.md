# AI-IMP-202 B15 capture-hook native control submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev0.44 §10.23. Review state: **SUBMITTED WITH CONTROLLER FAILURE BEFORE IMPORT; runtime/header provenance passes, assigned control sequence is unrun, trace is intentionally unsealed, and no performance/flame/eligible-import claim is made.**

The single authorized exact B14 process launched correctly, created the matching strict-v2 session header before media, exposed the unique profiling-enabled window, and remained alive without PID replacement. The ordinary native picker repeatedly resolved and previewed the exact authorized PNG, but the controller could not produce a stable enabled Open action. After the permitted primary route and one cancel/reopen alternative, interaction stopped. No media reached the app; consequently there are zero actions, renderer batches, native spans or closes and no seal. This is a computer-use/native-picker control failure, not an app-analysis result.

## Exact identities and scope

- Bundle: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/cargo-target/release/bundle/macos/Color Tool Profile B14.app`
- Executable: `Contents/MacOS/tauri-app`, SHA-256 `4b43e52313d783e2c58b9ae762fa96682086a3c6b22f1e45a3523c28ab07c2ae`
- Identifier/title: `com.color.tool.profile.b14.r8bf3187` / `Color Tool Profile B14`
- Accepted build manifest: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/attempt-02/build-manifest.json`, SHA-256 `15f1285f15fa70ffcda71a39df868c935b91aff6024d248548780cf656fc5912`
- Launch-local session: `COLOR_TOOL_PROFILE_SESSION=b15-control-20260906-01`
- Private evidence root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/b15-capture-01.Z38jdd`, mode 0700; retained regular files mode 0600
- Exact supplied PNG and private copy: 608,455 bytes, SHA-256 `e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790`

This was one profiling-on control attempt only. It was not a timing distribution, off/on comparison, overhead measurement, eligible acquisition/import, end-to-end acquisition, geometry/reflow pass, flame graph, numerical oracle or performance verdict.

## Preflight, launch and continuity

- Before launch, the exact B14 process count was zero and its prospective Application Support/cache namespaces were absent. Executable, plist, manifest, owner input, all 57 accepted source hashes, branch `codex/correctness-wave-01-2026-09-05`, HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`, and the exact 57-path source state matched the accepted B14 handoff.
- `launch-b15.mjs`, SHA-256 `f2b6239c4f3276a29c500520fd9b2412140ccda5bc2052d3d6c7a8ec3717d144`, spawned only the exact executable with inherited environment plus the reserved session, `detached:true`, ignored stdin, explicit file-backed stdout/stderr, and `unref()` after spawn.
- Exactly one authorized launch occurred at `2026-09-06T18:41:37.565Z`. Receipt `launch-receipt.json`, SHA-256 `74e48634472f018a4021321027adee8e8bbd8010751a3108fbd03600528ce1a7`.
- Actual PID 18954, PPID 1, process start `Sun Sep 6 13:41:37 2026`. At failure preservation (`2026-09-06T18:52:22.233Z`), the exact executable path and targeted session key/value still matched. No alternate launch, restart, PID replacement, adoption or termination occurred.
- The native-created trace appeared before media at `/Users/golem/Library/Caches/com.color.tool.profile.b14.r8bf3187/profiling/profile-b15-control-20260906-01.jsonl`, mode 0600. Its sole record is schema v2 with matching session and native clock `native-18954-18d2cf73cb3aa4b8`.
- Initial exact-window evidence showed `Color Tool Profile B14`, Colors, `Profiling launch enabled`, `Finish capture`, and an empty import surface: `initial-window.jpg`, SHA-256 `b8cbc8592ec576717eea310c12209cfce99669c7827769fdc499345caa697cac`; paired transcribed AX, SHA-256 `f13b74c0cd2c8129756fa1f14195aab4c6e9a09d6e2bdd0689f746646c2284b5`.

## Ordinary picker attempt and stop point

1. The empty image dropzone was focused and Return opened the ordinary native picker.
2. The Go-to-path sheet resolved the exact private-copy path. The picker AX and preview repeatedly identified only `palette-wheel-reference.png`, exact file URL under the private B15 root, `PNG image`, `608 KB`.
3. The selected file's documented AX secondary action made Open appear enabled once. Return did not close the picker or import media; Open then appeared disabled.
4. The picker was cancelled and reopened once as the second documented controller alternative. It retained the exact directory. The exact selected file URL and preview were reverified.
5. Ordinary file click/keyboard selection and the documented file secondary action did not establish a stable enabled Open action. The final deterministic secondary-action-then-Open attempt left the same Open sheet visible with the authorized PNG selected and `OKButton` disabled.
6. The brief's controller-alternative limit was reached. No additional clicks, alternate media, direct preference/DOM/IPC change, second session, app restart, trace edit, Finish action or seal was attempted.

Final picker evidence: `picker-failure-window.jpg`, SHA-256 `8ca13c522d78b68ce06089cd62aa5d16917d83f1a2f8dadcd337f89f7baaeddd`; relevant-subset transcribed AX, SHA-256 `860c052772ddf4ca1224cbca36fa79f3a70340a544a4b796662be9d9cf138e86`. The AX transcription explicitly omits unrelated picker inventory.

## Partial trace inspection

- Regular-file and 8 MiB bounds were checked before reading/copying.
- Live trace at preservation: 381 bytes, SHA-256 `b3006b345c4924dd2d9df38f555a48dac05b9df920aef99bf4d1073a5a314e1f`.
- Immutable copy `native-trace.partial.raw.jsonl`: identical 381 bytes and SHA-256.
- Records: one `trace-session`; zero actions, renderer batches, native spans and closes; no `session-seal`.
- The trace is deliberately unsealed because Finish was never reached. No parse, schema, raw record or seal was edited or fabricated.
- K45/quality2/exclude0/merge0/snap state, three charts, actual chart modes, 45->46->45, checkbox, range, Values, Finish, final Colors, settled correlation and positive-seal gates are all **unrun**, not failed app assertions.

## Retained evidence and source preservation

- Complete frozen 20-file evidence index: `final-artifact-hashes.sha256`, SHA-256 `c31f0a88b2e1e16c2459886b31caacfbc9a34f452f25db2845535662636c095f`; all 20 entries reverified OK.
- The still-live launcher carriers `b15-app.stdout.log` and `b15-app.stderr.log` are explicitly excluded from the immutable index. Frozen snapshots are indexed instead: stderr SHA-256 `b5dab7c5768e192ccf1d2434abb82e903f41cfb2f0b5ff2cd4cf8f06a995cb4e`, stdout empty SHA-256 `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.
- `failure-state.json`, SHA-256 `a6cd453d8227b595e4fded20b2ba829503978ad81e79d840825dc52f7291e2e8`, records the process/session/source/build/input/trace checks and zero record-type counts.
- Detailed control transcript: `operator-transcript.md`, SHA-256 `43b0499e81f94ab447d80883a0969c1173b81a67296c6937596c6f6e6143d303`.
- All 57 accepted source hashes checked OK after the stopped attempt. Before/failure candidate status receipts are identical; path count remained 57 and branch/HEAD remained exact. Source, build, manifest, archive, symbols, lockfiles and Git were unchanged.
- The frozen stderr snapshot contains renderer/system lifecycle and heartbeat diagnostics, focus/visibility transitions and one visibility-associated stall line. With no import, action, settled study or bound acquisition, none is classified as analysis latency or performance evidence.

## Candid controller friction

- Initial computer-use attachment by app name returned `Invalid app`; exact-bundle attachment then bound the already-running unique B14 window. No alternate process was launched.
- `pressKey('/')` was rejected before dispatch as `keyNotFound("/")`; `typeText('/')` opened the ordinary Go-to-path sheet. The first select-all chord left a doubled visible slash, although the resolved AX file URL normalized to the exact authorized path.
- One select-text call omitted a required argument and was rejected before dispatch as invalid parameters; the corrected call entered the exact directory and later the exact file path.
- The one observed enabled Open state followed a documented AX secondary action, but Return made no visible transition. After the single cancel/reopen fallback, Open remained disabled despite exact selection and preview. Repeating blind guesses would have violated the B15 brief, so the unrun gates were preserved rather than obscured.

## Result and open gates

B15 positively proves the exact B14 launch identity, clean prospective namespaces, native-created matching v2 header before media, initial profiling UI presence, and process/session continuity through failure preservation. It does **not** prove media import, settings/chart state, capture-hook/native/renderer correlation, strict seal validity, bound acquisition, parity/overhead, performance, flame graph attribution, quiet-host distributions, physical-display behavior, owner acceptance or ticket closure.

Stop point: review gate. The exact B14 process remains open as PID 18954 with the native Open sheet showing the exact authorized PNG selected and Open disabled; the capture remains unsealed. Review Lead owns classification and any fresh-run/recovery authority. No owner blocker is asserted.
