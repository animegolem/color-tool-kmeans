# AI-IMP-202 B14 isolated capture-hook build

Review Lead -> existing Code Lead, 2026-09-06. PROJECT-RECORD rev0.43 §10.22.
**B13 source accepted. Build-only preparation; no launch/capture.**

## Exact source and reserved identity

Candidate /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01
Branch codex/correctness-wave-01-2026-09-05, HEAD8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2 plus57 prepared accepted paths.
PLAN /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-remediation-plan.

Reserved output root /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs.
Immutable lead inputs already present:
- accepted-b13-dirty57-source.tar SHAe5f47c0af37edcd0bb1a72005309369dc7b225d89c0abaf056e6fddb0a517cce.
- accepted-source-hashes.sha256 SHAbd2e849680dba22f2a5568e919f16a20afba00fbeb42089e5e9ec89105e12e21.
- source-paths.txt lists the57 archive leaves.

Product/window title Color Tool Profile B14; identifier com.color.tool.profile.b14.r8bf3187. Fresh CARGO_TARGET_DIR /Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/cargo-target.

Read AGENTS.md, CLAUDE.md, record §§4/6/10.13/10.21/10.22, profiling-b13-source-verdict.md and B10 build submission/verdict for the proven route. No old target/bundle replacement or source/instrumentation changes.

## Preflight and preservation

Verify the57 leaves/hashlist/archive, exact -uall status and branch/HEAD before/after. Preserve base-plus-dirty reconstruction, tracked patch/new files and full current-source hash inventory, not HEAD alone. Reconstructed directories0700 and regular evidence0600; respect actual bundle executable metadata.

Check root Cargo.lock SHAe1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454 and frontend lock03b4caa5b09c581f62c83d79671c3f4be05467763dca046d2ea7d266299d7cd4. Record sidecar/config/dependency/tool identities without installs. Inspect only relevant inherited target/rustflags/wrapper/release overrides, not a general environment dump.

Lead found these prospective namespaces absent; recheck existence only, no creation/removal/adoption:
- /Users/golem/Library/Application Support/com.color.tool.profile.b14.r8bf3187
- /Users/golem/Library/Caches/com.color.tool.profile.b14.r8bf3187

## Exact build route

From candidate/tauri-app, with existing dependencies:

    CARGO_NET_OFFLINE=true \
    CARGO_TARGET_DIR='/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/cargo-target' \
    CARGO_PROFILE_RELEASE_DEBUG=line-tables-only \
    CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO=packed \
    CARGO_PROFILE_RELEASE_STRIP=none \
    npm run tauri -- build --bundles app --no-sign --ci \
      --config '{"productName":"Color Tool Profile B14","identifier":"com.color.tool.profile.b14.r8bf3187","app":{"windows":[{"label":"main","title":"Color Tool Profile B14","width":1360,"height":860,"minWidth":720,"minHeight":600,"decorations":true}]}}' \
      -- --locked -vv

Preserve exact command/full log/wrapper and underlying exits with pipefail if piped. Only command-local identity/window/symbol flags differ; no --debug, feature, dependency, optimization or source-map workaround. Preserve failed attempts instead of overwriting them.

## Build proof

Discover actual fresh executable/dSYM/DWARF leaf. Hash and verify plist/version/architecture/matching UUID. Inspect actual core/app-lib/app-bin rustc lines for opt3/line-tables-only/packed/no-strip; perform fresh core computation and application profiling source-line lookup, not copied addresses. State symbol-coverage limits.

Retain target regular-file inventory separately from directory symlinks, bundled sidecars/auxiliaries, frontend hashes, full-source reconstruction and all attempt evidence. Validate strict dirty=true build manifest and rehash its bound evidence/references; supplement manifest schema limits with inventories, never schema edits. Exclude still-active log carriers from immutable-payload indexes until frozen.

Allowed writes: generated build/frontend/symbol files, private logs/inventories/reconstruction/manifests/specs under reserved root, normal ignored candidate tauri-app/dist from beforeBuildCommand, and one new PLAN/RAG/reviews/EPIC-029/profiling-b14-build-submission.md. Use apply_patch for authored specs/notes/report.

No source/config/lock/dependency/fixture edits, installs/npm ci, Git mutations, global settings, full-suite reruns, old artifact edits, media/preferences scans, app/UI/process control, launch/tracing/Instruments, workload changes or recovery. Never execute the generated app or guessed target/deps binary to obtain help/version. Static Mach-O/plist/DWARF inspection only.

## Delivery

Report exact identities/digests/commands/exits, packaging-only duration,57/source/config/status preservation, manifest/inventory/symbol checks, candid friction and unrun gates. Gates already independently passed: Node82/Vitest335/27/native72/scalar1/static,2 existing Svelte warnings.

Send one report and its whole-file SHA immediately to this lead. Stop at build review; no launch/capture, polling or owner bell. The next assignment will admit a fresh exact B14 session for real native settled-input correlation, including honest intermediate supersession; overhead/flame graph acquisition remains later.
