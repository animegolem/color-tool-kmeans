import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
import { isTauriEnv } from './lib/bridges/tauri';
import { getComputeBridge } from './lib/bridges/compute';
import { getFsBridge } from './lib/bridges/fs';

function logRuntimeBanner() {
  try {
    const w = globalThis as any;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
    const tauriKeys = w?.__TAURI__ ? Object.keys(w.__TAURI__) : [];
    const hasInternals = typeof w?.__TAURI_INTERNALS__ !== 'undefined';
    console.info('[runtime] userAgent:', ua);
    console.info('[runtime] isTauriEnv():', isTauriEnv());
    console.info('[runtime] __TAURI__ keys:', tauriKeys);
    console.info('[runtime] has __TAURI_INTERNALS__:', hasInternals);
    console.info('[runtime] compute bridge:', getComputeBridge().id);
    console.info('[runtime] fs bridge:', getFsBridge().id);
  } catch (error) {
    console.warn('[runtime] banner failed:', error);
  }
}

logRuntimeBanner();

// Preload Tauri API (best-effort) to help dev setups resolve the module
try {
  void import('@tauri-apps/api').then(() => console.info('[env] tauri api module resolved')).catch(() => {
    console.info('[env] tauri api module not resolved (will use globals if present)');
  });
} catch {
  // ignore
}

const target = document.getElementById('app');

if (!target) {
  throw new Error('App root element missing');
}

const app = mount(App, { target });

export default app;
