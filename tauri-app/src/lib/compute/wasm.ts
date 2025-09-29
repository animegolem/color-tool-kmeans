// Thin wrapper to dynamically import the wasm module built by `compute-wasm`.
// The bundler target from `wasm-pack` exposes `analyze_image(bytes, params)`.

export type AnalyzeParams = {
  width: number;
  height: number;
  k: number;
  stride?: number;
  minLum?: number;
  space?: 'RGB' | 'HSL' | 'HSV' | 'YUV' | 'CIELAB' | 'CIELUV';
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
};

export type ClusterOut = {
  count: number;
  share: number;
  centroidSpace: [number, number, number];
  rgb: { r: number; g: number; b: number };
  hsv: [number, number, number];
};

export type AnalyzeResponse = {
  clusters: ClusterOut[];
  iterations: number;
  durationMs: number;
  totalSamples: number;
  variant: 'wasm';
};

let modPromise: Promise<any> | null = null;

function loadWasm(): Promise<any> {
  if (!modPromise) {
    const moduleUrl = new URL('../../../../compute-wasm/pkg/compute_wasm.js', import.meta.url);
    modPromise = import(/* @vite-ignore */ moduleUrl.href);
  }
  return modPromise;
}

export async function analyzeImageWasm(bytes: Uint8Array, params: AnalyzeParams): Promise<AnalyzeResponse> {
  const mod = await loadWasm();
  const out = await mod.analyze_image(bytes, params);
  return out as AnalyzeResponse;
}
