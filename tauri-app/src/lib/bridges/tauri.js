export function getBridgeOverride() {
    try {
        return typeof localStorage !== 'undefined' ? localStorage.getItem('bridge.force') : null;
    }
    catch {
        return null;
    }
}
export function isTauriEnv() {
    try {
        const override = getBridgeOverride();
        if (override === 'tauri')
            return true;
        const w = globalThis;
        const ua = globalThis.navigator?.userAgent || '';
        return !!((w && (w.__TAURI__?.invoke || w.__TAURI__?.core?.invoke)) ||
            w?.__TAURI_INTERNALS__ ||
            w?.__TAURI_IPC__ ||
            /Tauri/i.test(ua));
    }
    catch {
        return false;
    }
}
export async function tauriInvoke(cmd, args) {
    const argKeys = args ? Object.keys(args) : [];
    const argsPreview = argKeys.length > 0 ? `(${argKeys.join(', ')})` : '()';
    console.info(`[tauri-invoke] command: ${cmd} args: ${argsPreview}`);
    const w = globalThis;
    const coreInvoke = w?.__TAURI__?.core?.invoke;
    if (typeof coreInvoke === 'function') {
        console.info('[tauri-invoke] success via: globals.__TAURI__.core.invoke');
        return coreInvoke(cmd, args);
    }
    console.info('[tauri-invoke] globals.__TAURI__.core.invoke -> not found');
    const globalInvoke = w?.__TAURI__?.invoke;
    if (typeof globalInvoke === 'function') {
        console.info('[tauri-invoke] success via: globals.__TAURI__.invoke');
        return globalInvoke(cmd, args);
    }
    console.info('[tauri-invoke] globals.__TAURI__.invoke -> not found');
    try {
        const mod = await import('@tauri-apps/api');
        if (mod) {
            if (typeof mod?.core?.invoke === 'function') {
                console.info('[tauri-invoke] success via: @tauri-apps/api core.invoke');
                return mod.core.invoke(cmd, args);
            }
            if (typeof mod?.invoke === 'function') {
                console.info('[tauri-invoke] success via: @tauri-apps/api invoke');
                return mod.invoke(cmd, args);
            }
            console.warn('[tauri-invoke] @tauri-apps/api imported but no invoke found', { mod });
        }
        else {
            console.warn('[tauri-invoke] dynamic import @tauri-apps/api returned falsy module');
        }
    }
    catch (err) {
        console.warn('[tauri-invoke] dynamic import @tauri-apps/api failed', err);
    }
    try {
        const core = await import('@tauri-apps/api/core');
        if (core && typeof core.invoke === 'function') {
            console.info('[tauri-invoke] success via: @tauri-apps/api/core invoke');
            return core.invoke(cmd, args);
        }
        console.warn('[tauri-invoke] @tauri-apps/api/core imported but no invoke', { core });
    }
    catch (err) {
        console.warn('[tauri-invoke] dynamic import @tauri-apps/api/core failed', err);
    }
    const errorMsg = `Tauri API unavailable: unable to resolve invoke for command '${cmd}'`;
    console.error('[tauri-invoke] all paths failed:', errorMsg);
    throw new Error(errorMsg);
}
export function tauriDetectionInfo() {
    const w = globalThis;
    const ua = globalThis.navigator?.userAgent || '';
    return {
        override: getBridgeOverride(),
        hasGlobal: !!w?.__TAURI__,
        hasInvoke: typeof w?.__TAURI__?.invoke === 'function',
        hasCoreInvoke: typeof w?.__TAURI__?.core?.invoke === 'function',
        hasInternals: !!w?.__TAURI_INTERNALS__,
        hasIpc: !!w?.__TAURI_IPC__,
        uaIncludesTauri: /Tauri/i.test(ua)
    };
}
