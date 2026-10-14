import { describe, expect, it } from 'vitest';
import { createComputeBridgeForTarget } from '../bridges/compute';
import { createFsBridgeForTarget } from '../bridges/fs';
import { createPreferenceAdapterForTarget } from '../bridges/preferences';
import {
  runtimeTargetLogRecord,
  selectRuntimeTarget,
  type RuntimeSignals,
} from './target';

const BROWSER_SIGNALS: RuntimeSignals = {
  isTauriEnvironment: false,
  hasTauriInvoke: false,
  hasTauriCoreInvoke: false,
  hasTauriInternals: false,
  hasTauriIpc: false,
  userAgent: 'Mozilla/5.0 Chrome/143',
};

describe('runtime target selection', () => {
  it('selects the immutable complete browser capability matrix', () => {
    const target = selectRuntimeTarget(BROWSER_SIGNALS);

    expect(target).toEqual({
      kind: 'browser',
      capabilities: {
        fileAdapter: 'browser-file',
        computeAdapter: 'browser-worker-wasm',
        preferenceAdapter: 'browser-local-storage',
        save: false,
        values: false,
        batch: false,
        exports: false,
        exportDirectory: false,
        video: false,
        webviewZoom: false,
      },
    });
    expect(Object.isFrozen(target)).toBe(true);
    expect(Object.isFrozen(target.capabilities)).toBe(true);
  });

  it.each([
    ['environment detector', { isTauriEnvironment: true }],
    ['legacy invoke', { hasTauriInvoke: true }],
    ['core invoke', { hasTauriCoreInvoke: true }],
    ['internals', { hasTauriInternals: true }],
    ['IPC', { hasTauriIpc: true }],
    ['user agent', { userAgent: 'Color Tool Tauri/2' }],
  ])('selects Tauri from %s without changing its matrix', (_label, signal) => {
    const target = selectRuntimeTarget({ ...BROWSER_SIGNALS, ...signal });

    expect(target).toEqual({
      kind: 'tauri',
      capabilities: {
        fileAdapter: 'tauri',
        computeAdapter: 'tauri-native',
        preferenceAdapter: 'tauri-store',
        save: true,
        values: true,
        batch: true,
        exports: true,
        exportDirectory: true,
        video: true,
        webviewZoom: true,
      },
    });
  });

  it('drives all three F1 adapter selections from the same record', () => {
    const browser = selectRuntimeTarget(BROWSER_SIGNALS);
    const tauri = selectRuntimeTarget({
      ...BROWSER_SIGNALS,
      hasTauriInternals: true,
    });

    expect(createFsBridgeForTarget(browser).id).toBe('browser-file');
    expect(createComputeBridgeForTarget(browser).id).toBe(
      'browser-worker-wasm'
    );
    expect(createPreferenceAdapterForTarget(browser).id).toBe(
      'browser-local-storage'
    );
    expect(createFsBridgeForTarget(tauri).id).toBe('tauri');
    expect(createComputeBridgeForTarget(tauri).id).toBe('tauri-native');
    expect(createPreferenceAdapterForTarget(tauri).id).toBe('tauri-store');
  });

  it('emits only the target and public capability record', () => {
    expect(
      runtimeTargetLogRecord(selectRuntimeTarget(BROWSER_SIGNALS))
    ).toEqual({
      target: 'browser',
      file: 'browser-file',
      compute: 'browser-worker-wasm',
      preferences: 'browser-local-storage',
      save: false,
      values: false,
      batch: false,
      exports: false,
      exportDirectory: false,
      video: false,
      webviewZoom: false,
    });
  });
});
