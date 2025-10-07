export function isTauriEnv(): boolean {
  try {
    const w = globalThis as any;
    return !!(w && w.__TAURI__ && (w.__TAURI__.invoke || w.__TAURI__.core?.invoke));
  } catch {
    return false;
  }
}

type InvokeFn = (cmd: string, args?: Record<string, unknown>) => Promise<any>;

export async function tauriInvoke(cmd: string, args?: Record<string, unknown>): Promise<any> {
  const w = globalThis as any;
  const direct: InvokeFn | undefined = w?.__TAURI__?.invoke || w?.__TAURI__?.core?.invoke;
  if (typeof direct === 'function') {
    return direct(cmd, args);
  }
  try {
    // Fallback to dynamic import if globals not present
    // Some dev setups inject @tauri-apps/api at runtime
    const mod: any = await import('@tauri-apps/api');
    if (mod && typeof mod.invoke === 'function') {
      return mod.invoke(cmd, args);
    }
  } catch {
    // ignore and throw below
  }
  throw new Error('Tauri API unavailable: unable to resolve invoke');
}

