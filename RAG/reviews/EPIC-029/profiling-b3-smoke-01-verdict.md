# B3 smoke01 — partial evidence accepted; explicit existing-process continuation

Review Lead → Code Lead, 2026-09-05. PROJECT-RECORD rev0.31 §10.10, AI-IMP-202.
**Keep smoke01 partial. Adopt the independently verified existing B2 process for smoke02; no restart is needed or authorized.**

Read the original profiling-b3-smoke-brief.md with this numbered ruling. This ruling supersedes only its requirement to originate the functional smoke in a new explicit env-u launch and its original output location. All no-tracing/source/build/Git/other-app fences remain.

## Verified evidence and honest interpretation

Smoke01 report SHA256 cfdb9c5664c56323f4a9356c5b62bad79fadfb78df144988519e93fd0427cee4.
Lead verified all13 evidence hashes, all53 source hashes, original/copy input and B2 executable hashes, and the unchanged8bf3187 carrier. Evidence inventory remains e74ebc7cc35f4f9eedc5f964fbf9ccec268997b489a546fad9af49ef71676f17. Lead viewed the retained initial-window.jpg: correctly titled empty Colors window, no loaded material. Screenshot pixels are not a macOS geometry receipt.

PID67138 disappeared before it could supply the interaction sequence; preserve that failed/partial attempt and its first startup log. PID67432 started separately at20:29:26. Tool selection and the PID transition are temporally associated, but neither the report nor current evidence proves what ended the first process or caused the second. Do not state that the app crashed or that getApp definitely killed/restarted it. No new attempt to reproduce that loss is requested now.

Lead independently checked live PID67432, parent1, start Sat Sep5 20:29:26 2026, and its exact executable path. A targeted environment read returned successfully and contained no COLOR_TOOL_PROFILE_SESSION key; no unrelated environment values were emitted. The exact B2 cache profiling directory is absent. This is adequate provenance to adopt an already-running process for a NON-TIMED functional smoke, not to call it the original launch or a cold/fresh-process benchmark.

## Authorized carrier and continuation

Only existing PID67432 with the above start time is authorized:

/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/cargo-target/release/bundle/macos/Color Tool Profile B2.app/Contents/MacOS/tauri-app

Executable SHA256 9f297d5e67c90259ab44c96fa2b8101974c7b6e3d8a712dcce117ccba8681ed7.
Bundle identifier com.color.tool.profile.b2.r8bf3187.
Namespace: /Users/golem/Library/Application Support/com.color.tool.profile.b2.r8bf3187 and /Users/golem/Library/Caches/com.color.tool.profile.b2.r8bf3187.
These directories now contain previously recorded smoke setup state; do not call them absent/fresh, reset them or delete anything.

Reuse the retained UI-controller app object from smoke01. Do not call getApp again as a launch/selection shortcut or start a shell/background app. Before and after the first read-only state acquisition, verify the exact PID/start/executable still match. Verify only the profiling key's absence, not a general environment dump. If the retained object is unavailable, attachment changes the PID, the process is gone, or the target cannot be identified, stop and report before any import. No silent relaunch or process substitution.

Inspect fresh UI state. Expect the empty Colors dropzone from the retained screenshot; if unexpected owner-selected material or a different app appears, report rather than clearing or overwriting it.

New private evidence directory, already created:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/b3-smoke-02.xvIUy8

Preserve every smoke01 artifact/report unchanged. Reuse the exact private input copy:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/b3-smoke-01.ZeEyA0/palette-wheel-reference.png
SHA256 e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790.
Original owner PNG remains immutable at the path in the initial brief. Recheck both hashes before/after.

## Smoke02 work

Continue the original functional sequence once the attachment check passes:

1. Verify current B2 window/process/namespace and profiling-off state; record it explicitly as an adopted already-running process.
2. Import the exact reference through documented normal UI, verifying exact picker path/URL before confirming. No neighbouring file, preference-file injection or broad inventory.
3. Confirm loaded Colors and actual visible control state. Establish K45, quality2, exclude-top0, merge0, snap enabled and all three figures enabled where the UI exposes those controls; mark inaccessible settings unverified.
4. Make45→46→45 numeric cluster changes and observe actual value/result transitions. Preserve every setup/attempt/failure; do not turn displayed kernel time into end-to-end latency or claim cache restores are fresh analysis.
5. Navigate Colors→Values→Exports→Colors, inspecting shared study selection without export jobs or Batch assumptions.
6. If supported by documented controls, inspect approximately900×720 and restore original actual bounds. No system display/Spaces changes; screenshot dimensions alone are not geometry proof.
7. Leave this exact process open at the loaded Colors view; record final PID/start/input/settings/state and continued absence of profiling artifacts.

At most two grounded documented alternatives for a failed control, then report. Do not reopen/relaunch merely because an attachment is inconvenient. Keep window-only durable screenshot/AX/log evidence, distinguish inline-only/transcribed/unavailable states, and preserve original input/source/build bytes.

No tracing, native finalization, developer tools/injection, source edits, rebuild, dependencies, Git changes, benchmark, optimization or ordinary/A0 app control. Normal B2-only runtime writes and new private smoke evidence remain allowed. All original numerical/performance/platform limitations remain open.

Write only the new report:
/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b3-smoke-02-submission.md

State the adopted PID provenance rather than rewriting smoke01. Notify lead and stop without polling. No owner choice or bell is needed for this technical continuation.

