# AI-IMP-202 B10 isolated strict-v2 build

Review Lead -> Code Lead, 2026-09-06. PROJECT-RECORD rev0.39 §10.18.
B9 locally accepted under profiling-b9-round-02-verdict.md. **Build preparation only; no launch/capture.**

## Exact inputs and output identity

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
Branch codex/correctness-wave-01-2026-09-05, HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus57 accepted dirty paths.
Plan /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan.

Reserved root /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9.
Already preserved there:
- accepted-b9-dirty57-source.tar SHA2564e7ade0dff25a8d6b1318340b3f4d86a05a30acafe888bb9b46e64a9330e34ac;
- accepted-source-hashes.sha256 SHA2562eec9e72d225e084421611647b43527f944ae1be84ad40b4400156cfb8b669a7.
All57 archive leaves match; do not overwrite either file.

Product and window title: Color Tool Profile B10.
Identifier: com.color.tool.profile.b10.r8bf3187.
Fresh CARGO_TARGET_DIR: /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9/cargo-target.
No reuse/overwrite of B6/B2/A0 target or bundle. Their runtime namespaces and historical process evidence are out of scope.

## Allowed writes and fences

Generated build/frontend/symbol artifacts, private logs/inventories/reconstruction/manifests and authored build specs/notes under reserved root; normal ignored candidate tauri-app/dist generation by beforeBuildCommand; one new PLAN/RAG/reviews/EPIC-029/profiling-b10-build-submission.md.

Read AGENTS.md/CLAUDE.md, record §§4/6/10.13/10.16/10.18 and B6 build submission/verdict for the proven route. Use apply_patch for authored specs/notes/report; generated logs/archives through normal tooling allowed. Preserve failed attempts separately. Reconstructed directories must be traversable0700 (B6's0600 root mistake is documented); regular evidence files0600 and actual executable0700 as applicable. Verify modes without recursively rewriting source/bundle metadata.

No source/config/lock/dependency/fixture edits, installs/npm ci, Git operations, global flags/settings, optimization/numeric changes, ticket/record/index editing, media/preferences scans, app/process/UI control, launch/open/tracing/Instruments, owner workload changes or failed-session recovery. Never execute a generated application or guessed target/deps binary for --help/--list. Static Mach-O/plist/DWARF inspection only.

## Preflight

Verify exact57 source set/branch/HEAD and lead hashes/archive before build; retain tracked patch/new files and a complete base-plus-dirty reconstruction. All current source must bind the build, not HEAD alone. Hash configs/locks/sidecars and record installed tool versions without install/version probing through npx.

Expected unchanged root Cargo.lock SHA256e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454; frontend lock03b4caa5b09c581f62c83d79671c3f4be05467763dca046d2ea7d266299d7cd4.

Inspect only relevant target/rustflags/wrapper/release override environment, not general credentials/environment. Conflicting inherited overrides require report rather than global modification.

Lead exact preflight found both prospective runtime namespaces absent:
- /Users/golem/Library/Application Support/com.color.tool.profile.b10.r8bf3187
- /Users/golem/Library/Caches/com.color.tool.profile.b10.r8bf3187

Recheck existence only; don't create/remove runtime directories. Absence before build is not proof of runtime isolation.

## Exact build route

From candidate/tauri-app with existing dependencies:

    CARGO_NET_OFFLINE=true \
    CARGO_TARGET_DIR='/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b10.h6bbb9/cargo-target' \
    CARGO_PROFILE_RELEASE_DEBUG=line-tables-only \
    CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO=packed \
    CARGO_PROFILE_RELEASE_STRIP=none \
    npm run tauri -- build --bundles app --no-sign --ci \
      --config '{"productName":"Color Tool Profile B10","identifier":"com.color.tool.profile.b10.r8bf3187","app":{"windows":[{"label":"main","title":"Color Tool Profile B10","width":1360,"height":860,"minWidth":720,"minHeight":600,"decorations":true}]}}' \
      -- --locked -vv

Keep exact command, full compiler/build log and both underlying/wrapper exits. Use pipefail for pipelines, task-specific vars (never path/status). No --debug, feature/config/optimization changes or source-map workaround. Product/title/namespace and command-local symbol/strip flags are the only configuration deltas.

## Proof and handoff

- Discover actual bundle/executable/dSYM and DWARF leaf from fresh output. Hash them, verify plist/version/architecture and matching executable/dSYM UUID.
- Prove actual core, app-lib and app-bin compiler lines are opt3/line-tables-only/packed/no-strip. Resolve fresh symbol addresses for core computation and application profiling, perform actual source-line lookups. Don't copy historical addresses/UUID or claim all frames covered.
- Preserve target inventory, bundled sidecars/auxiliary tools, frontend bytes, source/lock/patch reconstruction, and all failed attempts. Existing normal auxiliary binaries remain inventoried, not removed.
- Strict dirty=true A1 build manifest must validate and bind exact source/executable/symbol evidence. Supplement schema limitations with private explicit inventories, not schema edits. Verify reconstruction file bytes and traversable directory modes.
- Recheck57 hashes/status/HEAD/branch/configs/locks unchanged. No full-suite rerun needed; lead independently accepted Node82/Vitest334/Rust72/scalar1 and static gates.
- Report exact artifacts/hashes, command/exits and build duration labelled packaging-only; truthful symbol coverage, errors/friction and preservation. Node20/Windows/full schema engine/mounted app/reflow/trace sealing/import/numerical parity/overhead/performance remain open.
- Source remains uncommitted; no new runtime acceptance follows from compile success.

Send the one immutable report and external SHA immediately to this lead. Stop at build review; no app launch/capture, new task, watcher, polling loop or owner bell. Later exact-binary/session authority will test empty plus settled-valid actions and native sealing through actual UI.

