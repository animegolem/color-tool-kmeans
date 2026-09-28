# B2 — isolated optimized instrumented build preparation

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev0.29 §10.9.
B1 is locally accepted under profiling-b1-round-03-verdict.md. **Build preparation only; no app launch or live capture. No new agents are needed.**

## Exact carrier and preservation

Candidate: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
Branch codex/correctness-wave-01-2026-09-05; HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2.
The carrier is deliberately dirty: nine tracked app modifications plus44 new files (16A1+28new B1),53 total known paths. Do not require clean HEAD, reset, stage or commit it. Verify the exact accepted A1/B1 source hashes from A1 Round03 and B1 Round02/03 reports, not HEAD alone.

Reserved private artifact root: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF
It already contains accepted-b1-source.tar (37paths, SHA256 08b18aea5afc935f9ffea9ec5bf6f51d885fbd2a33104d7489a6fb003e53ba32). Never overwrite it.
Product name and window title: Color Tool Profile B2.
Bundle identifier: com.color.tool.profile.b2.r8bf3187.
Use a new cargo-target below this root; never rebuild in the immutable A0 target.

Preserve installed app, prior debug bundles, entire A0 artifact corpus, accepted A1 files, B1 source and independent IMP-178/EPIC-026 worktrees. No source/config/dependency/lock/fixture change; no installs/npm ci, optimization, sample/iteration changes, Git operations or ticket completion.

## Permitted writes and safety

Only generated build/symbol/frontend artifacts, private build logs, explicit inventories/source snapshot/manifest and handoff README beneath the reserved root. The normal beforeBuildCommand may regenerate candidate ignored tauri-app/dist. One planning report: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b2-build-submission.md. Lead alone updates record/ticket/log/index.

Use apply_patch for authored specifications, README and report. Normal tool-generated build/log/archive outputs are allowed. Existing destinations are immutable: use distinct filenames/attempt subdirectories if preserving a failure. Stop rather than replace an existing app or artifact.

No app execution/control, including guessed binaries with --help/--list under target/deps; see the recorded Round03 review incident. Do not use open, execute the generated application, launch/quit installed apps, inspect owner media/preferences, scan Desktop, start/stop ML work, capture Instruments, or alter host settings. Static file/plist/Mach-O/DWARF inspection is authorized. A later exact-executable assignment governs launch.

## Preflight and provenance

Record exact HEAD/branch/status and per-file hashes of all53 accepted source changes. Preserve a generated tracked diff plus all new files (or one complete source archive with explicit base+patch reconstruction), and hashes of that evidence. A dirty=true build manifest must bind this material; never label8bf3187 alone as the instrumented source identity.

Root Cargo.lock SHA256 e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454.
Frontend package-lock.json SHA256 03b4caa5b09c581f62c83d79671c3f4be05467763dca046d2ea7d266299d7cd4.
Record installed Rust/Node/npm/Tauri/Xcode/tool target versions and explicit sidecar hashes. Use existing dependencies only.

Inspect only relevant build-override environment/config values (target, rustflags, wrapper, profile/debug/strip), never general environment or credentials. If an inherited override conflicts with the contract, stop and report rather than silently changing global settings.

Check only absence/presence of these exact prospective namespaces, both absent at lead preflight:
- /Users/golem/Library/Application Support/com.color.tool.profile.b2.r8bf3187
- /Users/golem/Library/Caches/com.color.tool.profile.b2.r8bf3187

Do not create/delete runtime directories. Their absence is preparation evidence, not actual runtime-isolation proof.

## Build and symbol-generation ruling

From candidate/tauri-app, use the existing locked offline Tauri release build with command-local overrides:

```sh
CARGO_NET_OFFLINE=true \
CARGO_TARGET_DIR='/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/cargo-target' \
CARGO_PROFILE_RELEASE_DEBUG=line-tables-only \
CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO=packed \
CARGO_PROFILE_RELEASE_STRIP=none \
npm run tauri -- build --bundles app --no-sign --ci \
  --config '{"productName":"Color Tool Profile B2","identifier":"com.color.tool.profile.b2.r8bf3187","app":{"windows":[{"label":"main","title":"Color Tool Profile B2","width":1360,"height":860,"minWidth":720,"minHeight":600,"decorations":true}]}}' \
  -- --locked -vv
```

Retain exact command, full output and exit status; use pipefail with tee. No --debug, unsupported-version bypass, extra Cargo feature, global flag change or altered optimization profile. Only product/window identity and debug-information/strip packaging differ from normal release settings.

Packed is a deliberate change from A0's split-debuginfo=off: on macOS, off suppresses the compiler's dsymutil step, while packed produces the companion dSYM. Official rustc documentation: https://doc.rust-lang.org/rustc/codegen-options/index.html#split-debuginfo (checked by lead; installed rustc1.90.0 exposes the flag). This is a proposed remedy for A0's missing application CGU symbol objects, not proof it has worked. Preserve actual compiler-produced dSYM before any manual symbol regeneration; do not overwrite it with a degraded later dsymutil result.

Prove actual application/core compiler invocations retain opt-level3, line-tables-only, split-debuginfo=packed and no stripping. Record effective target/features/inherited flags. If unsupported or packaging/symbol proof fails, preserve evidence and stop; no unapproved fallback flag/install/source round.

## Required artifact proof and handoff

Resolve actual bundle/executable and generated dSYM paths from output. Read plist identity/version/title configuration, architecture, executable SHA256 and Mach-O UUID; match dSYM UUID and hash its actual DWARF file. Read actual symbol addresses and perform source filename/line lookup for BOTH a core computation function and an application-crate function (prefer analyze_image or profiling state path). Merely matching UUID or finding core alone does not close A0's application-symbol limitation. Optimized/inlined or dependency-symbol limitations remain explicit.

Preserve target objects, source snapshot, frontend asset bytes/hashes, all bundled sidecar hashes, locks, build logs and symbol commands/results. Use accepted A1 build-manifest tooling for a strict private build record where supported; provide supplementary explicit provenance/inventory for dirty-source reconstruction and frontend files rather than weakening schemas or overloading unrelated artifact fields. Validate the build manifest and retain its digest. Source maps remain explicitly unavailable if the unchanged release renderer does not generate them; no source/config change to add maps here.

Do not manufacture case/frame/viewport/runtime/trace evidence. No timing, frame/case import or performance/overhead claim follows from packaging. Later on/off profiling uses identified executable/case pairs and controlled acquisition.

Post-build verify all53 source hashes, branch/HEAD/status and lock hashes unchanged. Do not rerun full suites unnecessarily: lead already reran the accepted source; this slice's gates are locked build, identity, provenance, real core+application line lookup and preservation.

Submit profiling-b2-build-submission.md with exact paths/hashes, command/exit/build duration (not interaction latency), manifest and symbol proof, preservation receipt, candid failed approaches and still-unrun runtime/platform gates. Notify lead and stop without polling. No owner bell is warranted for routine build review.

