# B2 build preparation — accepted

Review Lead → Code Lead, 2026-09-05. AI-IMP-202, PROJECT-RECORD rev0.30.
**Accept this exact immutable B2 bundle for the separately assigned B3 smoke. Not runtime, profiling-system or performance acceptance.**

## Independently verified

Submission SHA256 ef6b3254a7278ff5cd775e30cb9b96dfb688a024c5986200a14103e4256dfd1d.
Root /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF.
Executable /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b2.wLOiuF/cargo-target/release/bundle/macos/Color Tool Profile B2.app/Contents/MacOS/tauri-app.
Executable SHA256 9f297d5e67c90259ab44c96fa2b8101974c7b6e3d8a712dcce117ccba8681ed7.
Executable/dSYM UUID A53AAE9C-FD89-34C3-9EA7-D6A0C21ECD73, arm64.
DWARF SHA256 3aa2954a5a6ca4077b7f7ab9d593d3bfa42bcaf7942987dbf5b1dd6f2b7bea83.

Lead independently checked26 final-index artifact hashes,5 source-evidence entries,6 bundle files,8 frontend files, all53 current source hashes and all53 archived source leaves. All7 manifest-bound files and8 external evidence files match. Strict build manifest revalidates with dirty=true; its SHA256 is f31fb02984ab7f89536c3fc2ee419513e0a8b76077e2c4ef34fd2acad42cb38e. Candidate status is byte-identical to the pre-build53-path record. A0 executable independently retains121ebe204b17f1996b2764662a5afba76b5b7a170c295502304689811aa69318. The cargo-target inventory itself was hash-checked; lead did not individually rehash all3671 target files.

Actual full-log compiler lines6602/6640/6644 contain opt-level3, line-tables-only and split-debuginfo=packed for core/app-lib/app-bin, with no strip argument. Plist independently confirms Color Tool Profile B2 / com.color.tool.profile.b2.r8bf3187 /1.0.2. Runtime namespaces remain absent at review.

Lead independently repeated both dwarfdump lookups:
- 0x1004b4ea8 resolves optimized core run_kmeans to kmeans.rs:131.
- 0x100209fcc resolves optimized application ProfileWriter::finalize to profiling_writer.rs:247.

This closes the stated core-and-application build-time lookup gate, not every optimized/dependency frame or runtime process coverage. The compiler-produced packed dSYM is preserved. Renderer source maps remain unavailable.

## Build receipts and deviations retained

The underlying prescribed build reports success, with71.33s compilation/package duration. The outer logging wrapper failed on zsh's read-only status variable after success; neither rerun nor zero-error-wrapper claims are made. Preflight path-shadowing, partial compiler-summary extraction and incidental out-of-root npm debug-log write remain disclosed in the submission. Do not erase them or rebuild solely for a cleaner report. Future shell variables must avoid path/status and other special names; use exact installed CLI paths rather than npx version probes.

All original artifacts are immutable. The auxiliary bundled kmeans_framesim is explicitly inventoried; no packaging cleanup is authorized here.

## Next gate

profiling-b3-smoke-brief.md authorizes one controlled profiling-disabled launch and limited image/navigation/parameter/reflow smoke, using the exact executable and namespace above. No instrumented run is assigned yet: source review finds profile_finalize registered natively but no confirmed operator route from the current UI/renderer bridge. Keep this acquisition-control gap visible rather than inventing a seal, using invasive injection, or accepting an unsealed trace.

No rebuild, source/dependency/Git change, optimization, parity/overhead claim or aggregate AI-IMP-202 completion. Lead owns the later instrumented-acquisition control decision and independent live acceptance.

