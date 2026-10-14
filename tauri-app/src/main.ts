import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { initializeComputeBridge } from './lib/bridges/compute';
import { initializeFsBridge } from './lib/bridges/fs';
import { initializePreferenceAdapter } from './lib/bridges/preferences';
import { loadAndHydratePreferences } from './lib/stores/ui';
import { registerIpcSink } from './lib/utils/devlog';
import { logEvent } from './lib/bridges/log';
import {
  initializeRuntimeTarget,
  runtimeTargetLogRecord,
  type RuntimeTarget,
} from './lib/runtime/target';

const runtimeTarget = initializeRuntimeTarget();
initializeFsBridge(runtimeTarget);
initializeComputeBridge(runtimeTarget);
initializePreferenceAdapter(runtimeTarget);

// Wire devlog → logEvent IPC so all devlog lines reach the terminal via Rust stderr
registerIpcSink((msg) => void logEvent(msg, 'devlog'));

console.info('[runtime] target', runtimeTargetLogRecord(runtimeTarget));
setupDevHotkeys(runtimeTarget);

// Preload Tauri API (best-effort) to help dev setups resolve the module
if (runtimeTarget.kind === 'tauri') {
  try {
    void import('@tauri-apps/api')
      .then(() => console.info('[env] tauri api module resolved'))
      .catch(() => {
        console.info(
          '[env] tauri api module not resolved (will use globals if present)'
        );
      });
  } catch {
    // ignore
  }
}

// Hydrate preferences without hiding storage failures from the user.
void loadAndHydratePreferences();

// Suppress native WebKit context menus in production —
// images/video expose Save/Copy/Download that bypass app export settings.
if (runtimeTarget.kind === 'tauri' && !import.meta.env.DEV) {
  document.addEventListener('contextmenu', (e) => e.preventDefault(), true);
}

const target = document.getElementById('app');

if (!target) {
  throw new Error('App root element missing');
}

target.dataset.runtimeTarget = runtimeTarget.kind;

const app = mount(App, { target, props: { runtimeTarget } });

export default app;

function setupDevHotkeys(target: RuntimeTarget) {
  if (!import.meta.env.DEV || !target.capabilities.webviewZoom) return;
  const handler = async (event: KeyboardEvent) => {
    const isF12 = event.key === 'F12';
    const isDevtoolsCombo =
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key.toLowerCase() === 'i';
    if (!isF12 && !isDevtoolsCombo) return;
    event.preventDefault();
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('internal_toggle_devtools');
    } catch (error) {
      console.warn('[dev] Failed to toggle devtools', error);
    }
  };
  window.addEventListener('keydown', handler);
}
