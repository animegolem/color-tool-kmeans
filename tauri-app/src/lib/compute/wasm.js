// Thin wrapper to dynamically import the wasm module built by `compute-wasm`.
// The bundler target from `wasm-pack` exposes `analyze_image(bytes, params)`.
let modPromise = null;
function loadWasm() {
    if (!modPromise) {
        const moduleUrl = new URL('../../../../compute-wasm/pkg/compute_wasm.js', import.meta.url);
        modPromise = import(/* @vite-ignore */ moduleUrl.href);
    }
    return modPromise;
}
export async function analyzeImageWasm(bytes, params) {
    const mod = await loadWasm();
    const out = await mod.analyze_image(bytes, params);
    return out;
}
