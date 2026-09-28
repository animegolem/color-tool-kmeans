# AI-IMP-202 B14 isolated capture-hook build submission

Code Lead -> Review Lead, 2026-09-06. PROJECT-RECORD rev 0.43 §10.22.
**Build-only preparation complete. Fresh optimized/symbolized B14 bundle produced from the exact accepted dirty-57 source. No generated executable was run, no app was launched or controlled, and no runtime/performance evidence is claimed.**

## Carrier and source reconstruction

- Candidate: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-kmeans-correctness-wave-01`
- Branch: `codex/correctness-wave-01-2026-09-05`
- HEAD before/after: `8bf3187d5b8ce2da183fe44cba8bccf26a5d46d2`
- Exact status before/after: 57 paths, byte-identical to each other and to the accepted B11/B13 carrier status.
- Reserved root: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs`
- Successful build/proof directory: `attempt-02`.

Lead-provided immutable source inputs reverified:

- `accepted-b13-dirty57-source.tar`: `e5f47c0af37edcd0bb1a72005309369dc7b225d89c0abaf056e6fddb0a517cce`
- `accepted-source-hashes.sha256`: `bd2e849680dba22f2a5568e919f16a20afba00fbeb42089e5e9ec89105e12e21`
- `source-paths.txt`: 57 paths; SHA-256 `26d7b76e341401de4b742757e33c1acc91232834a57fbe55f31d35b698239e65`

The tar path set equals `source-paths.txt`; all 57 extracted archive leaves and all 57 live candidate leaves pass the accepted hash list before and after. Source composition remains 10 tracked changes plus 47 new files.

Complete base-plus-dirty reconstruction used the preserved same-HEAD B6 `head-source.tar` (`78f08a5b34fe6f312ae86e68480232b1725543ed586d0f5ac3ae537ac4fca448`) and overlaid the accepted B13 dirty archive. All 516 reconstructed paths match all 516 current candidate paths before and after. The three full inventories share SHA-256:

`668e378c6697aef40760849f6fc3c738110711532ec76ac0176b2fda242a5e6e`

Additional source receipts:

- retained tracked patch SHA-256 `1a500adff053d20bfceecb22f0b671d3b497b67b03f6686ae301d57178fc26a0`;
- new-file inventory SHA-256 `bec006622855b7cf689cf6cdb03d09705b7787947779553c2563ac4770da5d57`;
- source evidence index SHA-256 `7d771e029150158f16f836d0b45c69bfa66d2378c905c22af9a1549e7f44baea`.

Locks remained exact before/after:

- root `Cargo.lock`: `e1b39cfefd75c40e64adef7acb260782ff1749e6e355cc6871fd4fa206ee4454`;
- frontend `package-lock.json`: `03b4caa5b09c581f62c83d79671c3f4be05467763dca046d2ea7d266299d7cd4`.

Candidate ffmpeg/ffprobe sidecars also remained exact. All inspected inherited target, Rust flags, wrappers, and release-profile override variables were unset; no candidate/root/`tauri-app`/`src-tauri` Cargo config was present. No dependency install or config edit occurred.

Both prospective B14 namespaces were absent before and after packaging:

- `/Users/golem/Library/Application Support/com.color.tool.profile.b14.r8bf3187`
- `/Users/golem/Library/Caches/com.color.tool.profile.b14.r8bf3187`

This proves only absence without launch, not runtime isolation.

## Exact build and outcome

Executed once from candidate `tauri-app/` with existing dependencies:

```text
CARGO_NET_OFFLINE=true \
CARGO_TARGET_DIR='/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/cargo-target' \
CARGO_PROFILE_RELEASE_DEBUG=line-tables-only \
CARGO_PROFILE_RELEASE_SPLIT_DEBUGINFO=packed \
CARGO_PROFILE_RELEASE_STRIP=none \
npm run tauri -- build --bundles app --no-sign --ci \
  --config '{"productName":"Color Tool Profile B14","identifier":"com.color.tool.profile.b14.r8bf3187","app":{"windows":[{"label":"main","title":"Color Tool Profile B14","width":1360,"height":860,"minWidth":720,"minHeight":600,"decorations":true}]}}' \
  -- --locked -vv
```

- Tauri command exit: 0.
- Tee exit: 0.
- Wrapper exit: 0.
- Packaging wall time: 52 seconds. Cargo's internal release build reports 48.94 seconds. Neither is app latency.
- Full log: 6,653 lines / 1,715,509 bytes; SHA-256 `f1a99626cc32dfc26010e1150c5a02a9d7856ba3a3835514c44ad37b85420f0a`.
- Exact command SHA-256: `4035257e80b0b195afade46a485d78450c74933e52905d1ccd500fed7e49c4e8`.
- Frozen wrapper SHA-256: `a69f9feeb3b0673eb54108696e4f0135e35937152967cda43ca3b3cd4ca9775e`.

The build emitted the two accepted Svelte accessibility warnings, existing Vite/Rollup notices, and dependency-crate warnings. There was no fallback, source-map workaround, manual dSYM generation, or rebuild.

Toolchain: arm64 macOS 26.6.2 (25G83); rustc 1.90.0 / LLVM 20.1.8; cargo 1.90.0; Node 26.8.1; npm 11.19.0; Tauri CLI 2.9.6; Xcode 26.4 (17E192); Apple clang 21.0.0. Receipt SHA-256 `de42f2790e0738060a2985b50fc60cb0e09017eaadfb3a9141a455247e984396`.

## Bundle and static identity

- Bundle: `/Users/golem/.codex/visualizations/2026/07/19/019f7c75-2b8b-7882-9df7-0cdc1e494671/color-tool-profile-b14.XANBLs/cargo-target/release/bundle/macos/Color Tool Profile B14.app`
- Executable: `Contents/MacOS/tauri-app`, produced mode 0755, arm64 Mach-O, 18,231,240 bytes.
- Executable SHA-256: `4b43e52313d783e2c58b9ae762fa96682086a3c6b22f1e45a3523c28ab07c2ae`.
- It is byte-identical to `cargo-target/release/tauri-app`.
- Executable UUID: `DFF35F8D-552F-322B-85D8-1FC89C2007EB`.
- Plist: display/name `Color Tool Profile B14`, identifier `com.color.tool.profile.b14.r8bf3187`, executable `tauri-app`, short/build version `1.0.2`.
- Info.plist SHA-256: `7d099a638a5d7e74a0a7d0caa4092badaaef8fc773c930140788434bc5c43230`.
- The exact B14 title appears in executable strings; this is static evidence only.

Complete bundle inventory: six files, SHA-256 `51519954e5584f755cb22e9e9a44e91a5c13e90b65f730b7e9c9d0a438f030d5`. Bundled auxiliaries:

- ffmpeg: `e554de6ac7cf6d93182961e89eafbb022012601770def39316bc3844a560e501`;
- ffprobe: `e6555c55b60734a7fd690e32f63f7ab801872e7097bc54995e101cdd307f25af`;
- kmeans_framesim: `7bb2242429392be649765e2be1a3be729bd5acd345de788e4333847aefe5a0cc`.

Eight generated frontend files are bound by inventory SHA-256 `65d7e5163ea796c945568becc79319edfbed66444409c4cd0a8211df4ebc1bea`. No `.map` file was produced.

## Compiler and symbol proof

- Compiler-produced dSYM: `cargo-target/release/tauri-app.dSYM`.
- DWARF leaf: `Contents/Resources/DWARF/tauri_app-bd6a4248a41a498a`, arm64 Mach-O companion, SHA-256 `ca19ae3b4385bb248c9ab13b57ce98f795146fe37719fcac105d1cfaae4d0d38`.
- dSYM UUID: `DFF35F8D-552F-322B-85D8-1FC89C2007EB`, exactly matching the executable.
- The verbose log contains exactly three primary invocations: one `color_core` and two `tauri_app`. Each has `-C opt-level=3`, `-C debuginfo=line-tables-only`, and `-C split-debuginfo=packed`; none has a `-C strip` argument. Invocation receipt SHA-256 `cad5b6951e329ac69ea181472b4e8b905e372742d6eacfa3e5aa43e3dbfa0679`.
- Fresh B14 core lookup: `color_core::kmeans::run_kmeans`, `0x00000001004b3a40` -> optimized `kmeans.rs:131`.
- Fresh B14 application lookup: `tauri_app::profiling::profile_append_batch`, `0x000000010032b240` -> optimized `profiling.rs:518`.
- Fresh B14 writer lookup: `ProfileWriter::finalize`, `0x0000000100314a08` -> optimized `profiling_writer.rs:247`.
- Source-line receipt SHA-256: `45e99c8a24796894aaf1482e49e3ced72f4e4c5cc6dd98c2b83dc1639f2043b1`.

These selected lookups prove usable fresh B14 core/application native line tables. They do not prove every native frame, WebContent/renderer attribution, Instruments coverage, runtime execution, or physical display.

## Strict manifest and inventories

- Build spec SHA-256: `fa2d320ffd4d00707467483bb5cb20cec044ea81270a7b45a143605ba3623b27`.
- Strict dirty=true build manifest SHA-256: `15f1285f15fa70ffcda71a39df868c935b91aff6024d248548780cf656fc5912`.
- Validator output: `{"kind":"build","valid":true,"version":1}`.
- All 11 external references and all seven bound files rehash correctly.
- The manifest binds the exact commit plus dirty state, executable/hash/UUID/profile/flags, both locks, compiler-produced DWARF, all three bundled auxiliaries, toolchain, source reconstruction, full log/compiler/symbol proof, frontend/plist/namespace/preservation evidence, and complete target/bundle inventories.
- Fresh target: 3,671 regular files plus five symlinks; 1,289,248,768 bytes by `du` allocation.
- Target regular-file inventory SHA-256: `0cf5db34aa3c4f6c4c8eba968c11a1d0c7ba195cfbadf9dabb008bedc7bb68a5`; all 3,671 entries were rehashed successfully.
- Target symlink inventory SHA-256: `f6d2fb1b9c9e6bc46505129ca41efd860e1ffa1c9f68ad1b09a8c4fefc888dd1`.
- Authoritative 79-file immutable top-level payload index SHA-256: `bd1d0633117ee600a76a03547df5180abe0ff29f4ac026deee756c7ea6baa8b0`; all entries rehash successfully. It excludes itself and its subsequently written verification receipt.
- Root, attempt, archive-extraction, and reconstruction directories are 0700; all private top-level evidence files are 0600. The generated bundle executable retains its produced 0755 metadata.

## Candid friction and preservation

- `attempt-01` stopped before any build because a zsh reconstruction loop used the special variable name `path`, which shadowed command lookup. The partial preflight and authored failure note are preserved; no target was created. `attempt-02` uses `source_rel` and absolute hashing/text tools.
- Two post-build receipt commands in `attempt-02` each contained an accidental literal `+` at a shell-block close. The first stopped after successful source/status/lock/sidecar checks and before its target-symbol inventory; the second stopped after successful 3,671/6/8 inventory reverification and before a summary receipt. Both failures are preserved in authored notes, corrected outputs use distinct `.final` names, no prior receipt was overwritten, and the build was not rerun.
- The first modes receipt observed itself during creation as default 0644 and therefore recorded one transient non-0600 file. It is retained as historical evidence. `modes-receipt.final.txt` was precreated mode 0600 and verifies zero non-0600 attempt evidence files and zero non-0700 reconstruction directories.
- Post-build checks preserve all 57 accepted source hashes, all 516 current/reconstructed hashes, exact 57-path status, branch/HEAD, locks, candidate sidecars/config absence, and `git diff --check`.
- Normal ignored candidate `tauri-app/dist` was regenerated only by the authorized `beforeBuildCommand`.
- B10/B11/B12/B13 and all older bundles, traces, manifests, logs, runtimes, and independent worktrees were not write targets or control targets.

The Review Lead had already reproduced the source gates at this exact B13 state; B14 did not rerun full suites per brief.

## Open gates and stop point

No app launch, WebKit/native settled-input correlation, trace capture/seal/import, bound acquisition, numerical parity, matched profiling-off/on overhead, latency distribution, end-to-end flame graph, physical presentation, Node 20, Windows, or owner/platform acceptance occurred. B12 verdict R4 remains binding: intermediate digits may be honestly superseded by the unchanged debounce, while settled actions that actually execute require full native/renderer correlation.

Stop at build review. The Review Lead owns exact-binary acceptance and any later B15 launch/control authority.
