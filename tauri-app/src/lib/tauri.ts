export function isTauri(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof (window as any).__TAURI__ !== 'undefined';
}

export async function openFileDialog(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const selection = await open({ multiple: false, title: 'Select image' });
    if (typeof selection === 'string') return selection;
    if (Array.isArray(selection) && selection.length > 0) return selection[0];
    return null;
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? file.name : null);
    };
    input.click();
  });
}

export interface AnalyzeImageParams {
  path: string;
  clusters: number;
  stride: number;
  minLum: number;
  colorSpace: 'RGB' | 'HSL' | 'YUV' | 'CIELAB' | 'CIELUV';
  tol?: number;
  maxIter?: number;
  seed?: number;
  maxSamples?: number;
}

export interface AnalyzeImageResponse {
  clusters: Array<{
    count: number;
    share: number;
    centroidSpace: [number, number, number];
    rgb: { r: number; g: number; b: number };
    hsv: [number, number, number];
  }>;
  iterations: number;
  durationMs: number;
  totalSamples: number;
  variant: string;
}

export async function invokeAnalyzeImage(
  params: AnalyzeImageParams
): Promise<AnalyzeImageResponse> {
  const payload = {
    path: params.path,
    K: params.clusters,
    stride: params.stride,
    minLum: params.minLum,
    space: params.colorSpace,
    tol: params.tol ?? 1e-3,
    maxIter: params.maxIter ?? 40,
    seed: params.seed ?? 1,
    maxSamples: params.maxSamples ?? 300_000
  };

  if (!isTauri()) {
    // Lightweight fallback for browser preview/dev without Tauri backend.
    const mockCount = Math.min(params.clusters, 6);
    const weights = Array.from({ length: mockCount }, (_, idx) => mockCount - idx);
    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    const fakeClusters = weights.map((weight, idx) => {
      const hue = (idx * 47) % 360;
      const saturation = 0.62;
      const value = 0.82 - idx * 0.05;
      const c = value * saturation;
      const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
      const m = value - c;
      const rgbNorm = (() => {
        if (hue < 60) return [c, x, 0];
        if (hue < 120) return [x, c, 0];
        if (hue < 180) return [0, c, x];
        if (hue < 240) return [0, x, c];
        if (hue < 300) return [x, 0, c];
        return [c, 0, x];
      })().map((v) => Math.round((v + m) * 255)) as [number, number, number];
      const share = weight / totalWeight;
      return {
        count: Math.round(48000 * share),
        share,
        centroidSpace: [hue, saturation, value],
        rgb: { r: rgbNorm[0], g: rgbNorm[1], b: rgbNorm[2] },
        hsv: [hue, saturation, value]
      };
    });
    return Promise.resolve({
      clusters: fakeClusters,
      iterations: 12,
      durationMs: 95,
      totalSamples: 48000,
      variant: 'mock'
    });
  }

  const { invoke } = await import('@tauri-apps/api/core');
  return invoke<AnalyzeImageResponse>('analyze_image', payload);
}
