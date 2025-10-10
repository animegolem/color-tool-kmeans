# AI-EPIC
---
node_id: AI-EPIC-006
tags:
  - EPIC
  - AI
  - tauri
  - reliability
  - bridge-architecture
  - critical-bug
date_created: 2025-10-08
date_completed:
kanban-status: backlog
AI_IMP_spawned:
---

# AI-EPIC-006-tauri-bridge-reliability-and-native-mode-fixes

## Problem Statement/Feature Scope

The Tauri application currently fails to consistently load or analyze images, rendering it unusable in both development and packaged builds. Users cannot reliably run `npm run tauri dev` and successfully analyze images through the native Tauri compute path. The root cause is a combination of bridge selection race conditions, missing environment detection checks, silent error handling, and insufficient validation in native mode. This epic addresses the critical reliability issues preventing the Tauri implementation from being the primary deployment target.

## Proposed Solution(s)

Implement a comprehensive fix to the bridge architecture that ensures deterministic, reliable detection and selection of the Tauri native compute and filesystem paths. The solution involves:

1. **Deferred Bridge Initialization**: Move bridge selection from module-level import time to first-use time via async-ready pattern, allowing Tauri API injection to complete before detection occurs. Export factory functions only; provide `getComputeBridge()` and `getFsBridge()` that select once on first call with optional tick delay.

2. **Strict Environment Validation**: Add mandatory `isTauriEnv()` checks to all Tauri bridge factory functions, preventing silent fallback to browser/WASM when native mode should be active. Keep existing try-order for `tauriInvoke()` (globals → root.core → root → core module) with comprehensive logging.

3. **Explicit Error Propagation**: Replace silent error catching with logged failures and user-visible, actionable error messages when Tauri commands fail. All `tauriInvoke()` calls must log command name and failure reason. HomeView must surface errors to users with context-appropriate messages.

4. **Native Mode Validation**: Add file existence checks (Rust-side `std::fs::metadata`) and path validation before attempting native analysis, preventing cryptic errors from stale or invalid `__ACTIVE_IMAGE_PATH__` globals. Display "Native mode" indicator in UI when active.

5. **State Cleanup**: Ensure all global state (`__ACTIVE_IMAGE_PATH__`, cached bridges) is cleared on file deselection and errors, preventing stale data from affecting subsequent operations.

6. **Dev Mode Stability & Diagnostics**: Address `devUrl` connection issues with friendly error messages. Mandatory detection banner during dev builds: log `tauriDetectionInfo()`, selected bridge ID, and active force-override status on first analysis and file open. Enable DevTools access in dev builds (keyboard shortcut or auto-open).

7. **Force Override Documentation**: Preserve existing `bridge.force=tauri` localStorage override as documented developer escape hatch. Log when active with warning that detection is bypassed.

8. **Linux/NVIDIA Packaging Stability**: Set `WEBKIT_DISABLE_DMABUF_RENDERER=1` (and optionally `GDK_BACKEND=x11`) in Rust `main()` for Linux builds to prevent WebKit crashes on first run.

The refactored architecture will provide a single, reliable code path for Tauri native operation with fallback only when explicitly in browser or Electron contexts.

## Path(s) Not Taken

- **Separate build targets**: We will not create separate build configurations for browser vs native. The bridge pattern should handle runtime detection.
- **Removing WASM fallback**: Browser execution remains a valid use case; we're fixing detection, not removing multi-platform support.
- **Synchronous bridge initialization**: Bridges will remain lazy-loaded but defer until after async API loading completes.
- **Custom Tauri plugin for file handling**: We'll use existing `tauri-plugin-dialog` rather than building custom file I/O.

## Success Metrics

1. **100% native path usage in Tauri dev mode**: After fixes, `npm run tauri dev` followed by Upload button must invoke native `analyze_image` command (verified via Rust terminal logs) without WASM fallback.

2. **Zero silent fallbacks**: All bridge selection failures must log detection info and reason for fallback. No more "works in browser but not Tauri" without diagnostic output.

3. **Packaged build reliability**: `npm run tauri build` followed by running the release binary with `WEBKIT_DISABLE_DMABUF_RENDERER=1` must successfully analyze images on first attempt, 10/10 test runs.

4. **Error visibility**: When Tauri commands fail (file dialog, analyze_image), user receives an actionable error message within 2 seconds, not silent hang or cryptic console errors.

5. **Dev console accessibility**: Developer can access browser DevTools in `npm run tauri dev` to inspect bridge selection logs and state.

## Requirements

### Functional Requirements

- [ ] FR-1: The `createTauriFsBridge()` function shall check `isTauriEnv()` and return `null` if Tauri is not detected, before attempting to create a bridge instance.
- [ ] FR-2: Bridge modules shall export factory functions only; `getComputeBridge()` and `getFsBridge()` shall defer selection to first invocation with optional tick delay for async API injection, then cache the result.
- [ ] FR-3: The `tauriInvoke()` function shall log all invocation attempts (command name, args preview) and failures (full error details) to the console using existing try-order fallback chain.
- [ ] FR-4: The `chooseFile()` function in HomeView shall propagate Tauri command errors to the user via actionable messages ("Could not open native file dialog. Try restarting or use packaged build.") instead of silent catch and fallback.
- [ ] FR-5: The Rust `analyze_image` command shall validate file path with `std::fs::metadata` before sampling and return a typed error if unreadable; the `ingestSelection()` function shall validate `__ACTIVE_IMAGE_PATH__` is set before native mode analysis.
- [ ] FR-6: The `clearFile()` and `clearSelection()` functions shall delete the `__ACTIVE_IMAGE_PATH__` global and invalidate cached bridge instances to prevent stale state.
- [ ] FR-7: The `analyzeImage()` function in compute bridge shall validate Rust response structure and throw typed errors with field names when data is missing or malformed (not silent zeros).
- [ ] FR-8: The app shall display a mandatory detection banner in dev builds on first analysis and first file open, logging `tauriDetectionInfo()`, selected bridge ID, and active `bridge.force` override status to console.
- [ ] FR-9: The Tauri window shall display a user-friendly error message if `devUrl` is unreachable ("Development server not running. Start it with 'npm run dev' in a separate terminal.").
- [ ] FR-10: The `open_image_dialog` Tauri command shall return `Result<String, String>` instead of `Option<String>`, distinguishing dialog failure from user cancellation.
- [ ] FR-11: HomeView shall display a "Native mode" badge/chip when Tauri is detected and drag-drop is disabled, setting user expectations.
- [ ] FR-12: The `bridge.force=tauri` localStorage override shall remain functional and log a warning when active ("Bridge override active: forcing tauri-native. Detection bypassed.").
- [ ] FR-13: Dev builds shall enable DevTools access via keyboard shortcut (e.g., F12 or Ctrl+Shift+I) or auto-open on launch for inspection of bridge logs.

### Non-Functional Requirements

- NFR-1: Bridge detection and selection must complete within 100ms of first invocation to avoid user-perceptible delay (tick delay should be <50ms).
- NFR-2: All error messages presented to users must be non-technical and actionable with recovery steps (e.g., "Failed to open file dialog. Try restarting the app." not "Tauri API unavailable").
- NFR-3: Console logs for bridge detection must include full `tauriDetectionInfo()` output in both dev and production to aid debugging when users report issues.
- NFR-4: The refactor must not introduce new dependencies; use existing Tauri plugins (`tauri-plugin-dialog`), Svelte runes patterns, and standard library (`std::fs::metadata`).
- NFR-5: All changes must pass pre-commit hooks (Prettier format check, ESLint, Rust `cargo fmt --check`, `cargo clippy -- -D warnings`) without errors.
- NFR-6: Manual smoke test must verify native analysis with K=300, stride=4 on a 2MB JPEG completes in under 3 seconds on dev hardware (Fedora Atomic, NVIDIA GPU with `WEBKIT_DISABLE_DMABUF_RENDERER=1`).
- NFR-7: Linux packaged builds must automatically set `WEBKIT_DISABLE_DMABUF_RENDERER=1` in Rust `main()` before `Builder::default()` to prevent first-run crashes on NVIDIA/Wayland systems.

## Implementation Breakdown

<!-- This section will be populated as AI-IMP tickets are created -->

### Planned Tickets

**Core Bridge Architecture:**
- AI-IMP-058: Fix Tauri FS bridge environment detection (FR-1) — ✅ IMPLEMENTED, pending runtime validation
- AI-IMP-059: Refactor bridge modules to defer selection with async-ready pattern (FR-2) — ✅ IMPLEMENTED, pending user testing
- AI-IMP-060: Add comprehensive error logging to tauriInvoke with command tracking (FR-3)
- AI-IMP-061: Add response validation to Tauri compute bridge with typed errors (FR-7) — ✅ IMPLEMENTED

**Rust Backend Improvements:**
- AI-IMP-XXX: Add file existence validation in analyze_image command (FR-5, part 1)
- AI-IMP-XXX: Change open_image_dialog to return Result for error distinction (FR-10)
- AI-IMP-XXX: Set WEBKIT_DISABLE_DMABUF_RENDERER in Linux builds (NFR-7)

**Frontend UX & Diagnostics:**
- AI-IMP-062: Propagate Tauri errors with actionable messages in HomeView; native badge; drag/drop notice (FR-4, FR-11) — ⏳ IN REVIEW
- AI-IMP-064: Dev diagnostics banner + force-override warning; DevTools hotkey (FR-8, FR-12, FR-13)
- AI-IMP-XXX: Validate __ACTIVE_IMAGE_PATH__ and clear on deselect (FR-5 part 2, FR-6)

**Testing & Validation:**
- AI-IMP-XXX: End-to-end native mode smoke test suite (Success Metrics 1, 3, NFR-6)
- AI-IMP-XXX: Verify zero-fallback logging in Tauri dev and packaged modes (Success Metric 2)

### Completed Tickets

**AI-IMP-058** (2025-10-08): Fixed Tauri FS bridge environment detection by adding `isTauriEnv()` check to `createTauriFsBridge()`. Build passes, TypeScript compiles successfully. Runtime validation pending due to dev server connection issues. File: `tauri-app/src/lib/bridges/fs.ts:126`

**AI-IMP-059** (2025-10-08): Refactored bridge modules to use async-ready pattern with `queueMicrotask` delay. Both `getComputeBridge()` and `getFsBridge()` now async, called via `await` in all consumers. Updated files: `compute.ts` (lines 235-258), `fs.ts` (lines 253-276), `compute/bridge.ts` (lines 3, 45-46), `HomeView.svelte` (lines 22, 69-72), `ExportsView.svelte` (lines 6, 34-35, 53-54, 67-68). Build successful. Runtime testing by user.
### Future Follow-up
- After overlay components are refactored, transition HomeView back to standard Svelte derived pattern and remove diagnostic logging left from bridge debugging.
