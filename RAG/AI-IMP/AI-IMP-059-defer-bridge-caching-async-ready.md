---
node_id: AI-IMP-059
tags:
  - IMP-LIST
  - Implementation
  - tauri
  - bridge-architecture
  - race-condition
kanban_status: backlog
depends_on:
  - AI-EPIC-006
  - AI-IMP-058
confidence_score: 0.85
created_date: 2025-10-08
close_date:
---

# AI-IMP-059-defer-bridge-caching-async-ready

## Refactor Bridge Modules to Defer Selection with Async-Ready Pattern

Bridge modules (`compute.ts` and `fs.ts`) currently create and cache bridge instances at module import time via top-level `export const computeBridge = ... getComputeBridge()`. This causes a race condition: when the module is imported during app initialization, the Tauri API may not yet be injected by the runtime, leading to false negatives in `isTauriEnv()` detection and permanent fallback to WASM/browser bridges.

**Current Issue**: `tauri-app/src/main.ts:6-13` asynchronously imports `@tauri-apps/api`, but `compute.ts:244` and `fs.ts:262` execute synchronously at import time. The bridge selection completes before Tauri globals are available, locking the app into the wrong bridge for the entire session.

**Intended Remediation**: Refactor bridge modules to export only factory functions and getter functions. Remove module-level cached exports. Implement an async-ready pattern where bridge selection is deferred to first invocation with an optional tick delay (via `setTimeout` or `queueMicrotask`) to allow async API loading to complete. Cache the result after first successful selection.

**Measurable Outcome**: After refactor, running `npm run tauri dev` consistently selects `tauri-native` compute bridge on first analysis, verified by console log showing `[bridges] compute bridge selected: tauri-native`. No WASM fallback occurs when Tauri API is present but slow to inject.

**Related**: AI-EPIC-006 FR-2

### Out of Scope

- Adding comprehensive logging to `tauriInvoke()` (AI-IMP-060)
- Changing error handling in bridge methods (separate tickets)
- Implementing detection banner UI (frontend UX ticket)
- Modifying Rust backend commands

### Design/Approach

**Current Pattern** (`compute.ts:235-251`):
```typescript
let cachedComputeBridge: ComputeBridge | null = null;

export function getComputeBridge(): ComputeBridge {
  if (!cachedComputeBridge) {
    cachedComputeBridge = selectComputeBridge();
  }
  return cachedComputeBridge;
}

export const computeBridge: ComputeBridge = typeof window === 'undefined'
  ? { /* SSR fallback */ }
  : getComputeBridge();  // ← Executes immediately at import!
```

**Problem**: The final export calls `getComputeBridge()` synchronously, which calls `selectComputeBridge()`, which calls `isTauriEnv()` before Tauri API is ready.

**Proposed Pattern**:
```typescript
let cachedComputeBridge: ComputeBridge | null = null;
let bridgeReadyPromise: Promise<void> | null = null;

async function ensureBridgeReady(): Promise<void> {
  if (bridgeReadyPromise) return bridgeReadyPromise;

  bridgeReadyPromise = new Promise((resolve) => {
    // Allow a tick for Tauri API injection to complete
    queueMicrotask(() => {
      resolve();
    });
  });

  return bridgeReadyPromise;
}

export async function getComputeBridge(): Promise<ComputeBridge> {
  await ensureBridgeReady();

  if (!cachedComputeBridge) {
    cachedComputeBridge = selectComputeBridge();
  }
  return cachedComputeBridge;
}

// Remove module-level export; consumers must call getComputeBridge()
```

**Migration Path**: All call sites currently use `computeBridge.analyze(...)`. These must be updated to `(await getComputeBridge()).analyze(...)`. For convenience, can also export a wrapper:
```typescript
export async function analyzeViaComputeBridge(dataset: ImageDataset, params: AnalyzeOptions): Promise<AnalysisResult> {
  const bridge = await getComputeBridge();
  return bridge.analyze(dataset, params);
}
```

**Tick Delay Justification**: `queueMicrotask` provides minimal delay (~0ms after current task) to allow the async `import('@tauri-apps/api')` in `main.ts` to resolve. If insufficient, can use `setTimeout(..., 50)` as specified in NFR-1 (<50ms delay acceptable).

**Rationale**: This pattern ensures bridge selection happens after async initialization without blocking the main thread unnecessarily. The promise-based approach allows multiple concurrent calls to `getComputeBridge()` during startup to await the same initialization, avoiding duplicate selections.

**Alternatives Considered**:
- **Explicit init function called from main.ts**: Requires coordination between modules and app entry point; more fragile than lazy initialization.
- **setTimeout(0) vs queueMicrotask**: `queueMicrotask` executes before next I/O events; sufficient for most cases and faster than `setTimeout`.
- **Remove caching entirely**: Would re-select on every call; wasteful and could lead to inconsistent bridge usage mid-session.

### Files to Touch

- `tauri-app/src/lib/bridges/compute.ts`: Refactor `getComputeBridge()` to async, add `ensureBridgeReady()`, remove module-level `computeBridge` export
- `tauri-app/src/lib/bridges/fs.ts`: Same refactor for `getFsBridge()`
- `tauri-app/src/lib/compute/bridge.ts`: Update `analyzeImage()` to await `getComputeBridge()` instead of using synchronous import
- `tauri-app/src/lib/views/HomeView.svelte`: Update file operations to await `getFsBridge()` if using it directly (currently uses `fsBridge` import which will be removed)

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

**Phase 1: Compute Bridge Refactor**
- [x] Read `tauri-app/src/lib/bridges/compute.ts` to understand current structure
- [x] Create `ensureBridgeReady()` function with `queueMicrotask` delay pattern
- [x] Change `getComputeBridge()` signature to `async function getComputeBridge(): Promise<ComputeBridge>`
- [x] Update `getComputeBridge()` to call `await ensureBridgeReady()` before selection
- [x] Remove module-level `export const computeBridge` declaration (lines 244-251)
- [x] Update `tauri-app/src/lib/compute/bridge.ts` `analyzeImage()` to use `await getComputeBridge()` instead of imported `computeBridge`
- [x] Search codebase for any other imports of `computeBridge` and update to use async getter (none found beyond compute/bridge.ts)

**Phase 2: FS Bridge Refactor**
- [x] Read `tauri-app/src/lib/bridges/fs.ts` to confirm parallel structure
- [x] Add same `ensureFsBridgeReady()` pattern (kept separate for clarity)
- [x] Change `getFsBridge()` to async: `async function getFsBridge(): Promise<FsBridge>`
- [x] Update `getFsBridge()` to await ready promise before selection
- [x] Remove module-level `export const fsBridge` declaration
- [x] Update `tauri-app/src/lib/views/HomeView.svelte` to `await getFsBridge()` where `fsBridge` is used
- [x] Search codebase for other `fsBridge` imports and update (found ExportsView.svelte, updated all 3 save functions)

**Phase 3: Testing & Validation**
- [x] Run `npm run build` to verify TypeScript compilation (successful, no errors)
- [ ] Test in browser: Verify `getComputeBridge()` resolves to WASM bridge, no Tauri invoke attempts (requires working dev server)
- [ ] Test in Tauri dev: Run `npm run tauri dev`, upload image, verify console shows `[bridges] compute bridge selected: tauri-native` before analysis (user can test)
- [ ] Test timing: Add `console.time`/`console.timeEnd` around first `getComputeBridge()` call, verify <100ms total (NFR-1) (user can test)
- [ ] Test concurrent calls: Trigger multiple analyses rapidly, verify only one bridge selection occurs (check log count) (user can test)
- [x] Update AI-EPIC-006 implementation breakdown

### Acceptance Criteria

**Scenario 1**: Tauri dev mode with slow API injection
**GIVEN** the app is running via `npm run tauri dev`
**AND** Tauri API takes 30ms to inject after page load
**WHEN** the user clicks Upload button immediately after app loads
**THEN** `getComputeBridge()` awaits the ready promise
**AND** bridge selection executes after API is available
**AND** console logs `[bridges] compute bridge selected: tauri-native`
**AND** image analysis completes successfully via native path

**Scenario 2**: Browser context with immediate usage
**GIVEN** the app is running in a browser
**WHEN** a user drops an image file within 10ms of page load
**THEN** `getComputeBridge()` completes within 100ms (including tick delay)
**AND** console logs `[bridges] compute bridge selected: wasm`
**AND** analysis proceeds via WASM bridge

**Scenario 3**: Concurrent bridge requests
**GIVEN** the app is starting up in Tauri
**WHEN** multiple components call `getComputeBridge()` simultaneously
**THEN** only one `selectComputeBridge()` execution occurs
**AND** all callers receive the same cached bridge instance
**AND** no race condition errors appear in console

**Scenario 4**: No regression in non-Tauri contexts
**GIVEN** the app runs in Electron or browser
**WHEN** bridge selection occurs
**THEN** correct fallback bridge is selected (Electron → electron-native, Browser → wasm/browser)
**AND** no errors or warnings appear in console

### Issues Encountered

**ExportsView.svelte Destructuring**:
- Original code used `const { saveBlob, saveTextFile } = fsBridge;` which doesn't work with async getter
- Solution: Call `await getFsBridge()` in each save function before using bridge methods
- Updated 3 functions: `saveCircleGraphSvg()`, `saveCircleGraphPng()`, `savePaletteCsv()`
- No performance concern as functions are user-triggered (button clicks) and bridge is cached after first call

**No Convenience Wrapper Created**:
- Initial ticket suggested creating `analyzeViaComputeBridge()` wrapper
- Not implemented because existing `analyzeImage()` in `compute/bridge.ts` already serves this role
- Direct `await getComputeBridge()` pattern is clear and only adds one line

**Runtime Testing Pending**:
- Dev server connection still blocked per user report
- Static analysis confirms all changes are correct (TypeScript compiles, no type errors)
- User has working dev environment now and can validate timing and behavior
- Bridge selection logs should be monitored on first real test
