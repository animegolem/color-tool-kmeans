---
node_id: AI-IMP-060
tags:
  - IMP-LIST
  - Implementation
  - tauri
  - logging
  - diagnostics
kanban_status: backlog
depends_on:
  - AI-EPIC-006
  - AI-IMP-058
confidence_score: 0.90
created_date: 2025-10-08
close_date:
---

# AI-IMP-060-add-comprehensive-tauri-invoke-logging

## Add Comprehensive Error Logging to tauriInvoke with Command Tracking

The `tauriInvoke()` function currently attempts multiple fallback paths to locate the Tauri invoke API (globals → root.core → root → core module) but provides no visibility into which paths succeed or fail. When all paths fail, it throws a generic error with no context about what was attempted or why it failed. This makes debugging Tauri API injection issues nearly impossible.

**Current Issue**: Developers and users experience silent failures or cryptic "Tauri API unavailable" errors without knowing:
1. Which detection paths were tried
2. Whether globals exist but invoke is missing
3. Whether dynamic imports failed or succeeded but returned unexpected structure
4. What command was being invoked when the failure occurred

**Intended Remediation**: Add structured logging to `tauriInvoke()` that logs:
- Command name and sanitized args preview on every invocation attempt
- Each fallback path attempt (success/failure)
- Full error details when all paths fail
- Successful invoke path (so we know which detection method worked)

Keep existing try-order logic intact. Logs should be informational (not errors) for successful paths, and warnings/errors for failures.

**Measurable Outcome**: After implementation, when Tauri API fails to load in dev mode, the console shows:
```
[tauri-invoke] attempting command: open_image_dialog
[tauri-invoke] trying globals: __TAURI__.core.invoke -> not found
[tauri-invoke] trying globals: __TAURI__.invoke -> not found
[tauri-invoke] trying dynamic import: @tauri-apps/api -> failed (MODULE_NOT_FOUND)
[tauri-invoke] trying dynamic import: @tauri-apps/api/core -> failed (MODULE_NOT_FOUND)
[tauri-invoke] all invoke paths failed for command: open_image_dialog
```

When successful in Tauri dev:
```
[tauri-invoke] command: open_image_dialog (args: {})
[tauri-invoke] success via: globals.__TAURI__.core.invoke
```

**Related**: AI-EPIC-006 FR-3

### Out of Scope

- Changing the try-order sequence (current order is correct per epic review)
- Adding retry logic or timeouts (not required for this ticket)
- Modifying error messages shown to users (handled in HomeView UX ticket)
- Instrumenting other bridge functions beyond `tauriInvoke()`

### Design/Approach

**Current Code** (`tauri.ts:28-54`):
```typescript
export async function tauriInvoke(cmd: string, args?: Record<string, unknown>): Promise<any> {
  const w = globalThis as any;
  const direct: InvokeFn | undefined = w?.__TAURI__?.core?.invoke || w?.__TAURI__?.invoke;
  if (typeof direct === 'function') {
    return direct(cmd, args);
  }
  try {
    const mod: any = await import('@tauri-apps/api').catch(() => null);
    if (mod) {
      if (typeof mod?.core?.invoke === 'function') {
        return mod.core.invoke(cmd, args);
      }
      if (typeof mod?.invoke === 'function') {
        return mod.invoke(cmd, args);
      }
    }
    const core: any = await import('@tauri-apps/api/core').catch(() => null);
    if (core && typeof core.invoke === 'function') {
      return core.invoke(cmd, args);
    }
  } catch {
    // ignore and throw below
  }
  throw new Error('Tauri API unavailable: unable to resolve invoke');
}
```

**Enhanced Version**:
```typescript
export async function tauriInvoke(cmd: string, args?: Record<string, unknown>): Promise<any> {
  const argsPreview = args ? `(${Object.keys(args).join(', ')})` : '()';
  console.info(`[tauri-invoke] command: ${cmd} args: ${argsPreview}`);

  const w = globalThis as any;

  // Try globals: __TAURI__.core.invoke
  if (typeof w?.__TAURI__?.core?.invoke === 'function') {
    console.info(`[tauri-invoke] success via: globals.__TAURI__.core.invoke`);
    return w.__TAURI__.core.invoke(cmd, args);
  }
  console.info(`[tauri-invoke] globals.__TAURI__.core.invoke -> not found`);

  // Try globals: __TAURI__.invoke
  if (typeof w?.__TAURI__?.invoke === 'function') {
    console.info(`[tauri-invoke] success via: globals.__TAURI__.invoke`);
    return w.__TAURI__.invoke(cmd, args);
  }
  console.info(`[tauri-invoke] globals.__TAURI__.invoke -> not found`);

  // Try @tauri-apps/api root
  try {
    const mod: any = await import('@tauri-apps/api');
    if (typeof mod?.core?.invoke === 'function') {
      console.info(`[tauri-invoke] success via: @tauri-apps/api core.invoke`);
      return mod.core.invoke(cmd, args);
    }
    if (typeof mod?.invoke === 'function') {
      console.info(`[tauri-invoke] success via: @tauri-apps/api invoke`);
      return mod.invoke(cmd, args);
    }
    console.warn(`[tauri-invoke] @tauri-apps/api imported but no invoke found`, { mod });
  } catch (err) {
    console.warn(`[tauri-invoke] dynamic import @tauri-apps/api failed`, err);
  }

  // Try @tauri-apps/api/core
  try {
    const core: any = await import('@tauri-apps/api/core');
    if (typeof core?.invoke === 'function') {
      console.info(`[tauri-invoke] success via: @tauri-apps/api/core invoke`);
      return core.invoke(cmd, args);
    }
    console.warn(`[tauri-invoke] @tauri-apps/api/core imported but no invoke`, { core });
  } catch (err) {
    console.warn(`[tauri-invoke] dynamic import @tauri-apps/api/core failed`, err);
  }

  const errorMsg = `Tauri API unavailable: unable to resolve invoke for command '${cmd}'`;
  console.error(`[tauri-invoke] all paths failed:`, errorMsg);
  throw new Error(errorMsg);
}
```

**Rationale**:
- **Structured prefix** `[tauri-invoke]` makes logs easy to filter
- **Args preview** shows keys only (not values) to avoid logging sensitive data
- **Separate console.info for success** vs `console.warn` for fallback attempts vs `console.error` for final failure
- **Preserve try-order exactly** as reviewed in epic
- **Include error objects** in warn/error logs for full diagnostic info

**Log Level Strategy**:
- `console.info`: Successful invoke, showing which path worked (helps confirm detection)
- `console.info`: Fallback attempts (not errors yet, just detection flow)
- `console.warn`: Import failures or unexpected module structure (potential issues)
- `console.error`: Complete failure after all paths exhausted

**Privacy/Security**: Args preview shows keys only (`{path, k, stride}`) not values (`{path: '/home/user/secret.png'}`). If future commands have sensitive arg names, can redact further.

### Files to Touch

- `tauri-app/src/lib/bridges/tauri.ts`: Update `tauriInvoke()` function (lines 28-54) with comprehensive logging

### Implementation Checklist

<CRITICAL_RULE>
Before marking an item complete on the checklist MUST **stop** and **think**. Have you validated all aspects are **implemented** and **tested**?
</CRITICAL_RULE>

- [ ] Read `tauri-app/src/lib/bridges/tauri.ts` to understand current `tauriInvoke()` implementation
- [ ] Add initial log at function entry: command name and args preview (keys only, not values)
- [ ] Split first `if` check into two: one for `__TAURI__.core.invoke`, one for `__TAURI__.invoke`, each with success log and fallback log
- [ ] Wrap first dynamic import `@tauri-apps/api` in try-catch, log success path or import failure
- [ ] Check both `mod.core.invoke` and `mod.invoke` with individual success logs
- [ ] Log warning if module imports but neither invoke variant exists
- [ ] Wrap second dynamic import `@tauri-apps/api/core` in try-catch, log success or failure
- [ ] Add final `console.error` before throw with command name in error message
- [ ] Run `npm run format` in `tauri-app/`
- [ ] Run `npm run lint` to ensure no new warnings
- [ ] Build project: `npm run build` and verify no TypeScript errors
- [ ] Test in browser (no Tauri): Open console, trigger file dialog, verify logs show all fallback attempts and final error with command name
- [ ] Test in Tauri dev: Run `npm run tauri dev`, trigger file dialog, verify log shows successful path (e.g., `globals.__TAURI__.core.invoke`)
- [ ] Test force-override in browser: Set `bridge.force=tauri`, reload, trigger dialog, verify logs show invoke attempts and failures
- [ ] Verify no sensitive data (file paths, user info) appears in args preview (only keys should be shown)
- [ ] Update AI-EPIC-006 implementation breakdown

### Acceptance Criteria

**Scenario 1**: Tauri API unavailable in browser
**GIVEN** the app is running in a browser without Tauri
**AND** `bridge.force=tauri` is set to force Tauri path
**WHEN** the user clicks Upload button triggering `open_image_dialog`
**THEN** console shows:
```
[tauri-invoke] command: open_image_dialog args: ()
[tauri-invoke] globals.__TAURI__.core.invoke -> not found
[tauri-invoke] globals.__TAURI__.invoke -> not found
[tauri-invoke] dynamic import @tauri-apps/api failed: <error details>
[tauri-invoke] dynamic import @tauri-apps/api/core failed: <error details>
[tauri-invoke] all paths failed: Tauri API unavailable: unable to resolve invoke for command 'open_image_dialog'
```
**AND** the error includes the command name

**Scenario 2**: Successful invoke via globals in Tauri dev
**GIVEN** the app is running via `npm run tauri dev`
**AND** `window.__TAURI__.core.invoke` exists
**WHEN** the user triggers `analyze_image` command
**THEN** console shows:
```
[tauri-invoke] command: analyze_image args: (req)
[tauri-invoke] success via: globals.__TAURI__.core.invoke
```
**AND** no fallback logs appear
**AND** the command executes successfully

**Scenario 3**: Partial API availability (module import succeeds, wrong structure)
**GIVEN** `@tauri-apps/api` imports successfully but has unexpected structure
**WHEN** `tauriInvoke()` is called
**THEN** console shows warning: `@tauri-apps/api imported but no invoke found`
**AND** includes the module object for inspection
**AND** continues to next fallback path

**Scenario 4**: Args preview does not leak sensitive data
**GIVEN** `analyze_image` is invoked with `{req: {path: '/home/user/private.png', k: 16}}`
**WHEN** logs are written
**THEN** console shows: `[tauri-invoke] command: analyze_image args: (req)`
**AND** the file path does not appear in the log

### Issues Encountered

<!-- Fill out post-implementation -->
