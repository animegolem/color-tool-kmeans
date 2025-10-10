import './app.css';
import { mount } from 'svelte';
import App from './App.svelte';
// Preload Tauri API (best-effort) to help dev setups resolve the module
try {
    void import('@tauri-apps/api').then(() => console.info('[env] tauri api module resolved')).catch(() => {
        console.info('[env] tauri api module not resolved (will use globals if present)');
    });
}
catch {
    // ignore
}
const target = document.getElementById('app');
if (!target) {
    throw new Error('App root element missing');
}
const app = mount(App, { target });
export default app;
