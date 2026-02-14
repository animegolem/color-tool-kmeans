import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { isTauriEnv } from './lib/bridges/tauri';
import { getComputeBridge } from './lib/bridges/compute';
import { getFsBridge } from './lib/bridges/fs';
import { loadPrefs } from './lib/stores/prefs';
import { hydrateFromPrefs } from './lib/stores/ui';

async function logRuntimeBanner() {
  try {
    const w = globalThis as any;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const tauriKeys = w?.__TAURI__ ? Object.keys(w.__TAURI__) : [];
    const hasInternals = typeof w?.__TAURI_INTERNALS__ !== 'undefined';
    console.info('[runtime] userAgent:', ua);
    console.info('[runtime] isTauriEnv():', isTauriEnv());
    console.info('[runtime] __TAURI__ keys:', tauriKeys);
    console.info('[runtime] has __TAURI_INTERNALS__:', hasInternals);
    const [computeBridge, fsBridge] = await Promise.all([getComputeBridge(), getFsBridge()]);
    console.info('[runtime] compute bridge:', computeBridge.id);
    console.info('[runtime] fs bridge:', fsBridge.id);
  } catch (error) {
    console.warn('[runtime] banner failed:', error);
  }
}

void logRuntimeBanner();
setupDevHotkeys();

// Preload Tauri API (best-effort) to help dev setups resolve the module
try {
  void import('@tauri-apps/api').then(() => console.info('[env] tauri api module resolved')).catch(() => {
    console.info('[env] tauri api module not resolved (will use globals if present)');
  });
} catch {
  // ignore
}

// Hydrate preferences from persistent store (non-blocking)
loadPrefs().then(hydrateFromPrefs).catch(() => {});

const target = document.getElementById('app');

if (!target) {
  throw new Error('App root element missing');
}

const app = mount(App, { target });

export default app;

function setupDevHotkeys() {
  if (!import.meta.env.DEV) return;
  const handler = async (event: KeyboardEvent) => {
    const isF12 = event.key === 'F12';
    const isDevtoolsCombo = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'i';
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
