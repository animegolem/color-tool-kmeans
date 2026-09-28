# AI-IMP-202 B3 smoke01 control-boundary submission

Code Lead → Review Lead, 2026-09-05. PROJECT-RECORD rev 0.30 §10.10. Review state: **SUBMITTED PARTIAL; interaction stopped before import; not accepted; no ticket completion.**

The exact B2 app reached an initial mounted Colors window, but the prescribed launch provenance did not survive the UI-controller attachment step. The smoke sequence stopped before importing media or changing any control. No tracing, profiling session, finalization attempt, developer tools, injection, Instruments capture, timing comparison, export, source/config/dependency/Git change, rebuild, optimization, or aggregate acceptance occurred.

## Exact preflight

- Bundle: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/cargo-target/release/bundle/macos/Color Tool Profile B2.app`.
- Executable: bundle `Contents/MacOS/tauri-app`; SHA-256 rechecked as `9f297d5e67c90259ab44c96fa2b8101974c7b6e3d8a712dcce117ccba8681ed7`.
- Plist rechecked `CFBundleIdentifier=com.color.tool.profile.b2.r8bf3187` and `CFBundleDisplayName=Color Tool Profile B2`.
- A process-name-first exact-`comm` check found no process using this executable before launch. The initial full-command-line detector had self-matched its own shell because the exact path appeared in the detector arguments; it stopped before copy or launch and was replaced by the bounded exact-`comm` check.
- Both exact B2 runtime namespaces were absent before launch.
- Original input `/var/folders/xf/rq944nws6psgkhb73fmdftgm0000gn/T/codex-clipboard-e94c2a0b-fa7f-4c34-8d0a-ab6b9928deff.png` remained 608,455 bytes with SHA-256 `e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790`.
- Exact private copy `b3-smoke-01.ZeEyA0/palette-wheel-reference.png` has the same digest. The original and copy were rechecked after stopping.

## Launch and control-boundary failure

1. The exact executable was started directly with `env -u COLOR_TOOL_PROFILE_SESSION`. The returned PID was **67138**, and `ps ... comm` resolved it to the exact accepted B2 executable. `launch.txt` retains this receipt.
2. Two seconds after launch, PID 67138 was alive. It created only the exact B2 Application Support/cache namespaces. Initial B2 log `event-log-20260905-202910.txt` records app setup at 20:29:10, Home mount, visible renderer and ffmpeg version.
3. The documented UI-control entry point `getApp("Color Tool Profile B2")` returned a mounted B2 window, but the direct PID was no longer present afterward. A new exact-B2 process, PID **67432**, had started at 20:29:26 with parent PID 1, accompanied by a second app-setup log `event-log-20260905-202926.txt`.
4. PID 67432 resolves to the same accepted executable and its environment contains no `COLOR_TOOL_PROFILE_SESSION` key. However, its launch mechanism was the UI-controller app selection, not the prescribed explicit `env -u` command. The second startup therefore cannot be silently substituted for the controlled direct launch.
5. Per the brief's no-silent-restart and bounded-alternatives rules, interaction stopped before file import. PID 67432 was not killed or reused. It is left open at the initial Colors dropzone for lead inspection.

This is a control/harness provenance failure, not evidence of a B2 application crash or product defect. The retained evidence does not establish why PID 67138 disappeared or whether `getApp` launched rather than attached; no further probe or restart was attempted.

## Observed initial state

- The UI controller identified window title `Color Tool Profile B2`, Tauri URL `tauri://localhost`, and Colors/Values/Batch/Exports/Settings controls.
- The captured window shows the initial Colors dropzone with no selected media. The retained window-scoped image is 969×768 pixels; actual macOS window bounds versus requested 1360×860 remain unverified because the controller returned image pixels rather than a geometry receipt.
- The newly created isolated settings file records fresh defaults: K45, quality2, exclude-top0, merge0, snap-to-real enabled, histogram/polar/hue-lightness figures enabled, frequency histogram, OKHSV polar, and chroma hue-lightness sizing. These are source-confirmed from the B2-only settings artifact, not claimed as fully read through visible controls.
- Exact B2 namespaces contain `settings.json`, WebKit cache data, and two B2 event logs. They contain **zero** `.jsonl` or profiling-named artifact files.

## Required sequence outcome

- Initial uniquely titled mounted window: **observed**, with title/content and retained window-scoped screenshot; exact requested geometry remains unverified.
- Import exact palette-wheel reference and completed Colors result: **not attempted** after launch provenance broke.
- Resolve/establish visible controls: **not attempted in UI**; only isolated settings defaults retained.
- K45→46→45 with new pending/ready/results: **not attempted**.
- Colors→Values→Exports→Colors shared selection: **not attempted**.
- Narrow resize and restore: **not attempted**.
- Intended final loaded Colors state: **not reached**. Current open PID 67432 remains at initial empty Colors state.
- Profiling-disabled artifact check: **zero artifacts observed**, but this is only an off-path preparation observation and not zero-overhead proof.

## Retained evidence

Private directory: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/b3-smoke-01.ZeEyA0`.

- `preflight.txt` — exact executable/plist/input/copy hashes and initial namespace/process checks; SHA-256 `986517f70b856835243563dc08230f6efbb4c8107d24468877d7fc68473077f9`.
- `launch.txt` — controlled direct PID/executable receipt; SHA-256 `d7b3101127764022061a6fac0c10b0be7b212f13e36f57ab28c738d701a5d8ef`.
- `runtime-stdout.log` and copied `event-log-20260905-202910.txt` — first setup; SHA-256 `5c2908e8d97c62aa31d8c1cacfa94870c02292e7003b1b7759b37e1215e86aec` and `517ef14efd543cf6e4a31aa799856127dede57698c600f51f4c521a5c7b587eb`.
- Copied `event-log-20260905-202926.txt` — second setup/current PID; SHA-256 `bf0a06eb503d1fcf384cf5962ef70151ea6ebf28b3786d9814ecdb36b6dbf490`.
- `initial-window.jpg` — actual window-scoped screenshot bytes returned by the UI controller; SHA-256 `6e46b75d02a41f166a2470a5ba3da6cf29a556485bd22d4dfc23ee2a3f32fbbc`.
- `settings.after-launch.json` — B2-only settings snapshot; SHA-256 `7c129e116f5cab27994f83e48b25ee4b4a1020624bd931149735e6913993483b`.
- `control-boundary.txt` — PID transition, exact current executable, profile-key absence, artifact count and stop state; SHA-256 `497c16d5a9578c0f4083f10990e6d060eec8de106938b601295f3b519c5cfeee`.
- `preservation.txt` — build/source/input receipt; SHA-256 `6b673c5f2b55abacfd40e4ec06d0f75830875ba668fc2d2e7b77be0103deb596`.
- `evidence-hashes-02.sha256` is the complete current evidence hash list; SHA-256 `e74ebc7cc35f4f9eedc5f964fbf9ccec268997b489a546fad9af49ef71676f17`.

The screenshot is durably retained, not merely inline. UI facts above come from the controller's AX/screenshot state; startup facts come from exact B2-only logs and process checks. No numeric result, latency, navigation, reflow or selection evidence exists.

## Preservation and still-open gates

- Candidate remains HEAD `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2` with the exact 53 accepted status paths. Current 53-file hash list is byte-identical to the accepted B2 list, digest `0b8e7188495f52988afda6c0003127e05e48c0fa02bf8cf9fd03ee5d6174d0e5`.
- Executable, build artifacts and original/copy input bytes are unchanged. Only authorized B2 runtime state and private smoke evidence were written.
- Current open process at submission: PID 67432, exact B2 executable, initial Colors dropzone, no selected media, zero profiling artifacts.
- Still unrun: the entire loaded-reference interaction sequence, visible control confirmation, K changes, new-analysis proof, shared selection/navigation, narrow/restored geometry, loaded final state, instrumented acquisition/finalization, parity/overhead, process attribution, video, Node20/Windows, timing distribution, flame graph and performance interpretation.

Stop point: lead coordination on a launch/attachment mechanism that preserves the explicitly disabled environment and one-process provenance. No owner bell was used; no owner decision is required for this technical control ruling.
