import { z } from 'zod';
import { analyzeImageWasm } from '../compute/wasm';
const DEFAULT_TOLERANCE = 1e-3;
const DEFAULT_MAX_ITER = 40;
const DEFAULT_MAX_SAMPLES = 300_000;
const DEFAULT_SEED = 1;
const tripleLikeSchema = z.union([
    z.instanceof(Float32Array),
    z.tuple([z.number(), z.number(), z.number()]),
    z.array(z.number()).min(3)
]);
const electronClusterSchema = z.object({
    count: z.number(),
    share: z.number(),
    centroidSpace: tripleLikeSchema,
    rgb: z.object({ r: z.number(), g: z.number(), b: z.number() }),
    hsv: tripleLikeSchema
});
const electronComputeResponseSchema = z.object({
    clusters: z.array(electronClusterSchema),
    iterations: z.number(),
    durationMs: z.number(),
    totalSamples: z.number(),
    variant: z.string().optional()
});
function tupleFrom(value) {
    if (value instanceof Float32Array) {
        return [value[0] ?? 0, value[1] ?? 0, value[2] ?? 0];
    }
    if (Array.isArray(value)) {
        return [Number(value[0]) || 0, Number(value[1]) || 0, Number(value[2]) || 0];
    }
    return [0, 0, 0];
}
function createElectronComputeBridge() {
    if (typeof window === 'undefined' || typeof window.electronAPI === 'undefined') {
        return null;
    }
    const api = window.electronAPI;
    if (!api || typeof api.analyzeImage !== 'function') {
        return null;
    }
    return {
        id: 'electron-native',
        async analyze(dataset, params) {
            const payload = {
                dataset: {
                    width: dataset.width,
                    height: dataset.height,
                    pixels: new Uint8Array(dataset.pixels)
                },
                params: {
                    k: params.clusters,
                    stride: params.stride,
                    minLum: params.minLum,
                    space: params.colorSpace,
                    tol: params.tol ?? DEFAULT_TOLERANCE,
                    maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
                    seed: params.seed ?? DEFAULT_SEED,
                    maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
                }
            };
            const parsed = electronComputeResponseSchema.parse(await api.analyzeImage(payload));
            const variant = parsed.variant ?? 'electron-native';
            const clusters = parsed.clusters.map((cluster) => ({
                count: cluster.count,
                share: cluster.share,
                centroidSpace: tupleFrom(cluster.centroidSpace),
                rgb: cluster.rgb,
                hsv: tupleFrom(cluster.hsv)
            }));
            return {
                clusters,
                iterations: parsed.iterations,
                durationMs: parsed.durationMs,
                totalSamples: parsed.totalSamples,
                variant
            };
        }
    };
}
function createWasmComputeBridge() {
    return {
        id: 'wasm',
        async analyze(dataset, params) {
            const response = await analyzeImageWasm(dataset.pixels, {
                width: dataset.width,
                height: dataset.height,
                k: params.clusters,
                stride: params.stride,
                minLum: params.minLum,
                space: params.colorSpace,
                tol: params.tol ?? DEFAULT_TOLERANCE,
                maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
                seed: params.seed ?? DEFAULT_SEED,
                maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
            });
            const clusters = response.clusters.map((cluster) => {
                const centroidSpace = [
                    cluster.centroidSpace[0],
                    cluster.centroidSpace[1],
                    cluster.centroidSpace[2]
                ];
                const hsv = [cluster.hsv[0], cluster.hsv[1], cluster.hsv[2]];
                return {
                    count: cluster.count,
                    share: cluster.share,
                    centroidSpace,
                    rgb: cluster.rgb,
                    hsv
                };
            });
            return {
                clusters,
                iterations: response.iterations,
                durationMs: response.durationMs,
                totalSamples: response.totalSamples,
                variant: 'wasm'
            };
        }
    };
}
function logSelection(label, id) {
    console.info(`[bridges] ${label} bridge selected: ${id}`);
}
export function selectComputeBridge() {
    const electronBridge = createElectronComputeBridge();
    if (electronBridge) {
        logSelection('compute', electronBridge.id);
        return electronBridge;
    }
    const fallback = createWasmComputeBridge();
    logSelection('compute', fallback.id);
    return fallback;
}
let cachedComputeBridge = null;
export function getComputeBridge() {
    if (!cachedComputeBridge) {
        cachedComputeBridge = selectComputeBridge();
    }
    return cachedComputeBridge;
}
export const computeBridge = typeof window === 'undefined'
    ? {
        id: 'wasm',
        async analyze() {
            throw new Error('computeBridge unavailable in non-browser context');
        }
    }
    : getComputeBridge();
