import { isTauriEnv, tauriDetectionInfo } from '../bridges/tauri';

export type RuntimeTargetKind = 'tauri' | 'browser';

export interface RuntimeSignals {
  isTauriEnvironment: boolean;
  hasTauriInvoke: boolean;
  hasTauriCoreInvoke: boolean;
  hasTauriInternals: boolean;
  hasTauriIpc: boolean;
  userAgent: string;
}

export interface RuntimeCapabilities {
  readonly fileAdapter: 'tauri' | 'browser-file';
  readonly computeAdapter: 'tauri-native' | 'browser-worker-wasm';
  readonly preferenceAdapter: 'tauri-store' | 'browser-local-storage';
  readonly save: boolean;
  readonly values: boolean;
  readonly batch: boolean;
  readonly exports: boolean;
  readonly exportDirectory: boolean;
  readonly video: boolean;
  readonly webviewZoom: boolean;
}

export interface RuntimeTarget {
  readonly kind: RuntimeTargetKind;
  readonly capabilities: RuntimeCapabilities;
}

function frozenTarget(
  kind: RuntimeTargetKind,
  capabilities: RuntimeCapabilities
): RuntimeTarget {
  return Object.freeze({
    kind,
    capabilities: Object.freeze({ ...capabilities }),
  });
}

const TAURI_TARGET = frozenTarget('tauri', {
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
});

const BROWSER_TARGET = frozenTarget('browser', {
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
});

export function selectRuntimeTarget(signals: RuntimeSignals): RuntimeTarget {
  const tauri =
    signals.isTauriEnvironment ||
    signals.hasTauriInvoke ||
    signals.hasTauriCoreInvoke ||
    signals.hasTauriInternals ||
    signals.hasTauriIpc ||
    /Tauri/i.test(signals.userAgent);
  return tauri ? TAURI_TARGET : BROWSER_TARGET;
}

export function readRuntimeSignals(): RuntimeSignals {
  const detection = tauriDetectionInfo();
  return {
    isTauriEnvironment: isTauriEnv(),
    hasTauriInvoke: detection.hasInvoke,
    hasTauriCoreInvoke: detection.hasCoreInvoke,
    hasTauriInternals: detection.hasInternals,
    hasTauriIpc: detection.hasIpc,
    userAgent:
      typeof navigator === 'undefined' ? '' : navigator.userAgent || '',
  };
}

let activeTarget: RuntimeTarget | null = null;

export function initializeRuntimeTarget(
  signals: RuntimeSignals = readRuntimeSignals()
): RuntimeTarget {
  const selected = selectRuntimeTarget(signals);
  if (activeTarget && activeTarget.kind !== selected.kind) {
    throw new Error(
      `Runtime target already initialized as ${activeTarget.kind}; cannot replace it with ${selected.kind}`
    );
  }
  activeTarget ??= selected;
  return activeTarget;
}

export function getRuntimeTarget(): RuntimeTarget {
  return activeTarget ?? selectRuntimeTarget(readRuntimeSignals());
}

export function runtimeTargetLogRecord(target: RuntimeTarget) {
  return {
    target: target.kind,
    file: target.capabilities.fileAdapter,
    compute: target.capabilities.computeAdapter,
    preferences: target.capabilities.preferenceAdapter,
    save: target.capabilities.save,
    values: target.capabilities.values,
    batch: target.capabilities.batch,
    exports: target.capabilities.exports,
    exportDirectory: target.capabilities.exportDirectory,
    video: target.capabilities.video,
    webviewZoom: target.capabilities.webviewZoom,
  } as const;
}
