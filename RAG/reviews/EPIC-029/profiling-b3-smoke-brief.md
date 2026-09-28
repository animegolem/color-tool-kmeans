# B3 smoke01 — exact B2 app, profiling disabled

Review Lead → Code Lead, 2026-09-05. PROJECT-RECORD rev0.30 §10.10, AI-IMP-202.
**Execute one bounded real-app smoke; do not rebuild or instrument. No new agents are needed.**

## Exact executable and runtime boundary

Bundle: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/cargo-target/release/bundle/macos/Color Tool Profile B2.app
Executable: the bundle's Contents/MacOS/tauri-app.
SHA256 9f297d5e67c90259ab44c96fa2b8101974c7b6e3d8a712dcce117ccba8681ed7.
Bundle identifier com.color.tool.profile.b2.r8bf3187; expected window title Color Tool Profile B2.

Recheck hash/plist and absence of a process using this exact executable before launch. Do not select an app by a generic title alone, execute anything under target/deps, or control any installed/ordinary/A0 app. Launch only this executable with COLOR_TOOL_PROFILE_SESSION explicitly absent from its environment; do not alter global environment or host preferences. Record launch mechanism and actual PID/executable identity, not only a matching display name. If an existing B2 process is found, stop for lead coordination rather than kill/reuse it silently.

The following namespaces were absent at lead review:
- /Users/golem/Library/Application Support/com.color.tool.profile.b2.r8bf3187
- /Users/golem/Library/Caches/com.color.tool.profile.b2.r8bf3187

Ordinary B2-only app persistence and retention are authorized by this launch; verify the actual app-created paths before importing media. If observed namespace differs, stop interaction, terminate only the exact newly launched B2 process and report. Do not probe ordinary owner preferences to guess isolation.

Private smoke evidence directory, already created: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/b3-smoke-01.ZeEyA0.
Do not overwrite prior evidence. Normal app logs live in the exact B2 cache and may be copied into this private smoke directory. No uploads, all-process recording, Instruments, system-setting changes, media pruning/cleanup, unrelated process arguments or owner-workload manipulation.

## Input and intent

Use only the owner's already supplied palette-wheel reference image:
/var/folders/xf/rq944nws6psgkhb73fmdftgm0000gn/T/codex-clipboard-e94c2a0b-fa7f-4c34-8d0a-ab6b9928deff.png
SHA256 e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790;608455bytes at lead preflight.

Recheck bytes before/after; original is immutable. An exact byte copy named palette-wheel-reference.png inside the private smoke directory is allowed for reliable selection/preservation; document both paths and matching digest if used. No broad Desktop/media inventory or substitute inputs. If missing/mismatched, report the changed input instead of guessing.

This is a real mounted-app smoke on an owner-supplied still reference, not representative full-workload, video, numerical-oracle or performance acceptance.

## Interaction sequence

Use documented computer-use actions only, inspecting current state and exact target before each material action. Preserve runtime logs and UI evidence where supported.

1. Confirm the uniquely identified window is usable at its initial1360×860 configuration; inspect actual geometry rather than assuming requested size. Confirm the B2 namespace, fresh initial state and lack of a profiling artifact/directory. Record any startup issue before proceeding.
2. Import the exact reference via normal application file selection/drop workflow. Verify the selected file's exact URL/path or equivalent picker evidence before confirming; do not import a neighbouring file because its thumbnail looks plausible. Confirm the reference preview and completed Colors result.
3. Read the resolved visible analysis/display controls. Through ordinary controls, establish K45, quality2, exclude-top0, merge0, snap-to-real enabled and the histogram/polar/hue-lightness figures enabled, to the extent exposed and controllable. Retain actual state; inaccessible settings remain unverified, not invented or force-written to preference files.
4. Change the clusters numeric control45→46; observe actual bound value, new pending/ready transition where available and a newly produced displayed result. Then46→45. Keep every attempt or control failure; do not relabel cache restores as fresh analyses. At most these two target changes after setup; this is not a timing distribution.
5. Navigate Colors→Values→Exports→Colors, checking whether the same selected study material stays selected where those views expose it. Do not trigger export jobs, save files, clear the collection or treat Batch's distinct aggregate state as a failed global selection.
6. If documented window controls allow, inspect one narrow window around900×720, then restore initial bounds. Record clipping/overflow/controls inaccessible or unexpected state reset. Do not change system display resolution/Spaces/host settings to achieve it. If resizing is unsupported, mark it unrun.
7. Return to Colors with the reference selected, record final controls/status, check the exact B2 cache for absence of profiling artifacts, and preserve final source hash. Leave this identified app open for lead/owner inspection; report its PID and final state. Do not stop other apps.

If selection/control fails, use at most two concrete documented alternatives grounded in fresh UI state, then stop and report the exact blocker. Do not spend an unbounded sequence of blind coordinate clicks or invent hidden APIs. A control failure is not automatically an application defect. If B2 crashes or hangs, preserve observations and relevant B2-only logs; do not silently restart.

## Evidence and limits

Capture screenshots/AX state at initial window, loaded Colors, one changed-K result, Values/Exports selection evidence, narrow/final state as supported. Save actual returned image bytes/paths with the supported API when available; inline-only tool images are not durable capture files. State plainly which evidence is retained, transcribed, source-confirmed or unavailable. No whole-desktop screenshots containing unrelated apps when an app/window capture is available.

Displayed durationMs, if transcribed, is kernel time. Do not call it input-to-result latency, speed improvement, a matched A0 result, quiet-host timing or overhead. No claim about UI correctness from a log alone, or numeric equivalence from matching screenshots. The disabled-launch flag and absence of artifact are a limited smoke of the off path, not proof of zero overhead.

The native profile_finalize command has no confirmed operator-facing route in this accepted build. Do not enable tracing, open developer tools, inject JavaScript/LLDB/Apple events into WebView internals, fabricate native records/seals or perform an acquisition experiment in this pass. Lead handles that separately.

## Fences and submission

No source/config/dependency/Git changes, rebuild, optimization/IMP-178 integration, app replacement, raw media commits, owner workload or ordinary-namespace access. Candidate remains53 accepted paths on8bf3187; artifacts/build source stay immutable. Authorized writes are normal B2 runtime state, generated evidence in the smoke directory, optional exact reference copy and one report:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b3-smoke-01-submission.md.

Report exact PID/executable/runtime namespace, input hash, each attempted state and outcome, retained evidence with hashes, concrete UI findings versus control/tool limitations, final open-app state, preservation and still-unrun gates. No fresh full test-suite rerun needed. Notify lead and stop without polling. Only use an owner bell for a genuine owner-required blocker, not ordinary submission or a technical question the lead can resolve.

