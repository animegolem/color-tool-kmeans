# AI-IMP-202 B6 isolated operator-capable build

Review Lead -> Code Lead, 2026-09-05. PROJECT-RECORD rev0.34 §10.13.

B5 is locally accepted under profiling-b5-round-01-verdict.md. **Build preparation only. No app launch or runtime capture.** No new agents are needed.

## Exact identity and boundaries

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01; branch codex/correctness-wave-01-2026-09-05; HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus56 known dirty paths. This comprises B2's53 paths with eight authorized edits, formerly clean App.svelte now modified, and two new B5 files. Validate against B5's eleven hashes and B2's45 preserved hashes, not HEAD alone.

Reserved root /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO. It already contains accepted-b5-dirty56-source.tar, SHA2566ef4ad8b22384f3a4735fac981def4f2c975914318ac6da0ad1c352220ee8e1f. Do not overwrite this archive or any existing artifact.

Product/window title **Color Tool Profile B6**. Identifier **com.color.tool.profile.b6.r8bf3187**. New target /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/cargo-target. No use of B2/A0 targets or bundles; preserve the running B2 process and all installed/debug/previous apps.

Permitted writes: generated build/symbol/frontend artifacts, private logs/inventories/source manifests and authored notes under this root; normal ignored candidate tauri-app/dist regeneration by beforeBuildCommand; one new report /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan/RAG/reviews/EPIC-029/profiling-b6-build-submission.md. Use apply_patch for authored notes/report/specs. Generated logs/archives are permitted. Separate attempt directories preserve failures; never overwrite an existing bundle to clean up reporting.

No source/config/lock/dependency/fixture edits, installs/npm ci, Git mutations, numeric/optimization/sample changes, ticket/record/index changes, owner media/preferences scans, process/app control, launch/open, tracing/Instruments or host/workload changes. Do not execute generated apps or guessed target/deps binaries with --help/--list. Static file/plist/Mach-O/DWARF inspection only.

## Preflight and reconstruction

Read B2 build submission/verdict for the actual successful build/symbol route and disclosed wrapper errors; don't repeat zsh path/status variables or npx version probes. Use installed CLI. Do not copy historical flags/addresses/counts as new evidence.

Record HEAD/branch, exact56-path status, current per-file hashes, a tracked patch and the new-file inventory or complete base-plus-dirty archive reconstruction. Verify the lead's archive leaves equal current source. Bind these exact bytes into a dirty=true manifest using existing A1 tooling; provide supplementary provenance where schema fields do not fit, never weaken schemas.

Expected unchanged root Cargo.lock SHA256 e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454; frontend package-lock SHA25603b4caa5b09c581f62c83d79671c3f4be05467763dca046d2ea7d266299d7cd4. Record installed Rust/Node/npm/Tauri/Xcode/target versions and exact sidecar hashes.

Inspect only relevant build override environment (target/rustflags/wrapper/release debug-strip), never general environment/credentials. A conflicting inherited override is a stop/report condition; do not mutate global settings.

Lead preflight found these exact prospective namespaces absent:

- /Users/golem/Library/Application Support/com.color.tool.profile.b6.r8bf3187
- /Users/golem/Library/Caches/com.color.tool.profile.b6.r8bf3187

Recheck absence/presence only, no runtime directory creation/deletion. Absence is preparation evidence, not runtime-isolation proof.

## Build

From candidate/tauri-app, with existing dependencies and locked/offline Cargo:

    CARGO_NET_OFFLINE=true \
    CARGO_TARGET_DIR='/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b6.fnWyNO/cargo-target' \
    CARGO_PROFILE_RELEASE_DEBUG=line-tables-only \
    CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO=packed \
    CARGO_PROFILE_RELEASE_STRIP=none \
    npm run tauri -- build --bundles app --no-sign --ci \
      --config '{"productName":"Color Tool Profile B6","identifier":"com.color.tool.profile.b6.r8bf3187","app":{"windows":[{"label":"main","title":"Color Tool Profile B6","width":1360,"height":860,"minWidth":720,"minHeight":600,"decorations":true}]}}' \
      -- --locked -vv

Retain exact command/full log/underlying build and wrapper exit statuses. Use pipefail if tee is used; safe task-specific shell variables, never path/status. No --debug, unsupported-version bypass, feature changes, global flags or altered release optimization. Product/window identity and symbol/strip overrides are the only permitted configuration deltas.

Preserve compiler-produced packed dSYM, no manual overwrite/regeneration. Prove actual core/app-lib/app-bin compiler invocations retain opt-level3, line-tables-only, split-debuginfo=packed and no strip. If build/symbol proof fails, preserve it and stop without an unapproved fallback or install.

## Required proof

Resolve actual bundle/executable/dSYM from fresh output. Verify plist identifier/name/version/architecture, executable hash and UUID; matching dSYM UUID and hash of the actual DWARF leaf. Discover actual symbol addresses and execute source-line lookup for both core computation and application profiling function. No inherited B2 address or UUID and no every-frame coverage claim.

Preserve source snapshot, actual compiler logs, target objects/inventory, bundle sidecars, frontend bytes/hashes and locks. Existing normal auxiliary bundled binaries remain explicitly inventoried, not silently cleaned up. Renderer source maps remain unavailable if unchanged build does not emit them. No source-map/config workaround.

Validate strict A1 build manifest with dirty=true and exact new-source/executable evidence; supplement complete reconstruction/source/frontend inventories separately. New UI existence is source/build evidence only; do not claim mounted accessibility, finished native invocation or trace eligibility.

Post-build verify all56 source hashes and exact status/HEAD/branch/locks unchanged. No full-suite rerun is needed: lead reproduced B5 gates. B6 gates are locked optimized build, provenance, core+app line lookup and preservation.

## Submission

Report exact paths/hashes, command/exits, compile/package duration explicitly not interaction latency, validated manifest, symbol proof, source preservation and candid failed approaches. Keep Node20/Windows, mounted operator/reflow, uninterrupted renderer acquisition, trace import, parity/overhead and real performance acceptance open. Supply finished-report SHA in delivery message, not its own bytes.

Stop after the report and notify the existing lead; no polling, watcher, owner bell or subsequent launch. A later exact-executable/namespace assignment governs first off/on operator capture and independent continuity evidence.
