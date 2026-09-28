# AI-IMP-202 B7 first real operator-finalization proof

Review Lead -> Code Lead, 2026-09-05. PROJECT-RECORD rev0.35 §10.14.

## Outcome and scope

Prove that the reviewed packaged app exposes the profiling-only control, observes real Colors parameter changes and can finish through the ordinary UI to a real native trace seal. This is **one diagnostic/control run**, not a timing distribution, on/off comparison, quiet-host performance test, numerical oracle or an eligible acquisition claim. No new agents needed.

Use the accepted B6 bundle only:

- Bundle /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/cargo-target/release/bundle/macos/Color Tool Profile B6.app
- Executable Contents/MacOS/tauri-app, SHA256869ce8df24d5b9c251253197979de656f778f8343fed71726fc981cd73314fb6
- Identifier com.color.tool.profile.b6.r8bf3187; title Color Tool Profile B6
- Manifest /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/attempt-01/build-manifest.json, SHA256a24eaaefca59a2d7f59233a8a1f458d73ca67d2aaf9c0d80ebfdc6c9f57b726a
- One launch-local COLOR_TOOL_PROFILE_SESSION=b7-control-20260905-01. Never modify global environment.
- Private evidence root already created: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/b7-capture-01.CMdcCN. Preserve all earlier build/evidence artifacts; use new filenames, owner-only0700 directories/0600 evidence files (not0600 directories).

## Launch and continuity boundary

Recheck exact executable/plist and absence of an existing process at that path. Both exact B6 namespaces were absent at lead review:

- /Users/golem/Library/Application Support/com.color.tool.profile.b6.r8bf3187
- /Users/golem/Library/Caches/com.color.tool.profile.b6.r8bf3187

If an existing process or namespace conflicts with that fresh setup, stop for lead coordination; no silent adoption, deletion, restart or new session ID.

Launch only the exact bundle executable, with the reserved session environment. Prefer a detached Node child with explicit file-backed stdout/stderr, detached:true and unref(), so it does not rely on the tool shell remaining alive. A small launch wrapper authored with apply_patch under this private evidence directory is allowed. No dangling stdio pipes, generic open/getApp launch as the environment carrier, or guessed binary.

Record actual PID/start/executable and launch mechanism. Verify the targeted session key/value without dumping the environment. Confirm actual B6-only app-created namespace and exact profile file path before media input:

/Users/golem/Library/Caches/com.color.tool.profile.b6.r8bf3187/profiling/profile-b7-control-20260905-01.jsonl

Native header sessionId must match; record native clock ID. Never precreate/edit the trace or a session seal. Normal B6-only runtime persistence is authorized. If namespace differs, stop and terminate only the exact newly launched B6 process; do not inspect ordinary preferences.

Use documented computer-use APIs, fresh uniquely matching window state and exact native PID checks before/after first attachment. Do not reuse B2's retained app object for B6. First process loss, renderer reload/replacement, second root renderer:mounted event, missing profiling status, multiple renderer clocks or unknown continuity stops the experiment and yields partial/unverified evidence. Preserve it; do not restart/resume or invent continuity from a positive seal. No getApp/reload loop. B2/A0/ordinary apps and owner workloads remain untouched.

## Exact material and bounded sequence

Use only the owner's attached palette-wheel PNG:

/var/folders/xf/rq944nws6psgkhb73fmdftgm0000gn/T/codex-clipboard-e94c2a0b-fa7f-4c34-8d0a-ab6b9928deff.png

SHA256e3ca7176b596dfec54ec1a33a6b43ae988a81e6835e9875873675b21e6d12790,608455bytes. Verify before/after; an exact private copy named palette-wheel-reference.png is allowed. Verify exact picker path/URL before Open. No broad Desktop inventory or substitute asset. The prior controller accepted its documented super+shift+g spelling; don't repeat unsupported spellings or invent APIs.

1. Confirm initial app/window, profiling launch-enabled status and Finish capture button, native header and namespace. Retain scoped screenshot/AX and actual PID. Absence/failure is a control-proof result, not permission for hidden invoke.
2. Import the exact still via normal picker. Confirm preview and completed Colors. Through visible controls, establish K45, quality2, ignoreTop0, merge0, snap enabled and three charts. Record actual display modes; don't force missing settings via preference writes. All setup input events belong to this diagnostic trace.
3. Change45→46 and wait for newly rendered ready state, then46→45 and ready. Preserve every input/control failure and any intermediate empty-field action. Do not discard noncompleted actions or infer freshness solely from an unchanged displayed duration.
4. Navigate Colors→Values and verify shared material plus the persistent profiling header. From Values press **Finish capture** once. Only if the UI reports coherent renderer/native open-action pending may you explicitly retry after visible settling, at most twice. If finishing never resolves or reports failure/loss/continuity unverified, preserve it and stop; no polling loop or native/direct IPC fallback.
5. Retain final control text and source-file trace bytes after terminal outcome. Return to Colors after sealing only if the UI remains usable, verify same study and final K45, then leave exact B6 open. No more parameter changes, export jobs, Batch activity or another session.

Optional one narrow/restored geometry observation is allowed only through a documented controller window-bounds action without interrupting continuity; otherwise retain unrun status. No system display/Spaces changes or blind edge drags. Screenshot dimensions are not actual window bounds.

## Evidence and static trace checks

Preserve launch/stdout receipts, exact session/PID/start before attachment and after finish, window-scoped initial/loaded/K46/Values-Finish/final screenshots, final B6-only event log/settings copy, original/private-copy hash, and exact native trace copy. Picker AX may be transcribed instead of retaining screenshots with unrelated filenames; distinguish transcripts from raw retained evidence.

Do not take whole-desktop captures where a window capture is available. No developer tools, JS/WebView injection, Apple-event evaluation, LLDB, Instruments, all-process recordings or ordinary app access.

After the run only, inspect the immutable copied trace with existing source functions:

- parseTraceJsonl from scripts/profiling/trace-wire.mjs
- organizeTrace and inspectActionEvidence from scripts/profiling/trace-integrity.mjs

Bound the regular-file read to MAX_TRACE_BYTES (8MiB); preserve raw bytes/digest regardless of parser failure. Report parse validity, record/action/batch/close/native counts, sealValid/tainted/loss totals, renderer clock count and per-action observed outcome/coherence code. No native/renderer clock subtraction or synthesized records. A strict parser error is an honest runtime finding, not permission to edit parser/schema/source.

If a positive seal exists, hash both live trace and private copy, then recheck live hash once after final navigation to establish unchanged bytes across that bounded interval. Don't claim indefinite durability or fsync. Use exact B6 logs to check setup/root renderer mount count and scope continuity evidence; log silence alone is not proof of all renderer lifetimes.

No full build/case/acquisition binding or A1 eligible run is assigned here. Strict raw integrity is not source binding, numerical truth or owner full-interactivity acceptance. Keep every diagnostic action and loss; do not relabel unfamiliar outcomes to make the smoke pass. Native/renderer durations may exist in the trace but aren't a performance verdict.

## Fences and stop

Allowed writes: B6 normal runtime state, new private B7 evidence/wrapper/transcripts and one /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b7-control-proof-submission.md. Source56/build/archive/manifest/symbol/locks/Git stay unchanged; no rebuild/install/optimization, source edits, ordinary data cleanup, owner workload manipulation or other process control. At most two documented alternatives for a failing UI control, then stop and report.

Report actual steps/outcomes, retained versus transcribed evidence, trace/manifest/input identities, final process state and unresolved continuity/geometry/trace/import/platform/performance gates. Whole-file report SHA goes in the delivery message. No full suites. Notify lead and stop without polling/watchers or routine owner bell.
