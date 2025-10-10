import { z } from 'zod';
import { isTauriEnv, tauriInvoke, tauriDetectionInfo, getBridgeOverride } from './tauri';
const DEFAULT_TOLERANCE = 1e-3;
const DEFAULT_MAX_ITER = 40;
const DEFAULT_MAX_SAMPLES = 300_000;
const DEFAULT_SEED = 1;
export class TauriComputeError extends Error {
    code;
    constructor(code, message, options) {
        super(message);
        this.name = 'TauriComputeError';
        this.code = code;
        if (options?.cause !== undefined) {
            this.cause = options.cause;
        }
    }
}
// Electron path removed: Tauri-only baseline.
const finiteNumberSchema = z
    .number()
    .refine((value) => Number.isFinite(value), { message: 'must be a finite number' });
const tauriClusterSchema = z
    .object({
    count: finiteNumberSchema.min(0, { message: 'count must be >= 0' }),
    share: finiteNumberSchema,
    centroidSpace: z.any().optional(),
    centroid_space: z.any().optional(),
    rgb: z
        .object({
        r: finiteNumberSchema,
        g: finiteNumberSchema,
        b: finiteNumberSchema
    })
        .refine((value) => value.r >= 0 && value.r <= 255 && value.g >= 0 && value.g <= 255 && value.b >= 0 && value.b <= 255, { message: 'rgb components must be within 0-255' }),
    hsv: z.any()
})
    .transform((data, ctx) => {
    const sourceCentroid = data.centroidSpace ?? data.centroid_space;
    const centroid = coerceTriple(sourceCentroid);
    if (!centroid) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['centroidSpace'], message: 'centroidSpace must contain three finite numbers' });
    }
    const hsvTriple = coerceTriple(data.hsv);
    if (!hsvTriple) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['hsv'], message: 'hsv must contain three finite numbers' });
    }
    if (ctx.issues.length > 0) {
        return z.NEVER;
    }
    return {
        count: data.count,
        share: data.share,
        centroidSpace: centroid,
        rgb: data.rgb,
        hsv: hsvTriple
    };
});
const tauriComputeResponseSchema = z
    .object({
    clusters: z.array(tauriClusterSchema).min(1, {
        message: 'clusters missing or empty'
    }),
    iterations: finiteNumberSchema.min(0, { message: 'iterations must be >= 0' }),
    durationMs: finiteNumberSchema.min(0, { message: 'durationMs must be >= 0' }),
    totalSamples: finiteNumberSchema.min(0, { message: 'totalSamples must be >= 0' }),
    variant: z.string().min(1, { message: 'variant must be provided' })
})
    .readonly();
// tupleFrom and Electron schemas removed with Electron path.
function coerceTriple(value) {
    if (value instanceof Float32Array || value instanceof ArrayBuffer) {
        value = Array.from(value);
    }
    if (Array.isArray(value) && value.length >= 3) {
        const numbers = value.slice(0, 3).map((entry) => Number(entry));
        if (numbers.every((n) => Number.isFinite(n))) {
            return [numbers[0], numbers[1], numbers[2]];
        }
    }
    return null;
}
function normalizeTauriCluster(raw) {
    if (!raw || typeof raw !== 'object') {
        return {};
    }
    const cluster = raw;
    const centroidSource = cluster.centroidSpace ?? cluster.centroid_space;
    const rgb = cluster.rgb;
    return {
        count: Number(cluster.count),
        share: Number(cluster.share),
        centroidSpace: centroidSource,
        centroid_space: centroidSource,
        rgb: rgb
            ? {
                r: Number(rgb.r),
                g: Number(rgb.g),
                b: Number(rgb.b)
            }
            : undefined,
        hsv: cluster.hsv
    };
}
function normalizeTauriResponse(raw) {
    if (!raw || typeof raw !== 'object') {
        return {};
    }
    const payload = raw;
    const clustersValue = Array.isArray(payload.clusters) ? payload.clusters : [];
    return {
        clusters: clustersValue.map((entry) => normalizeTauriCluster(entry)),
        iterations: Number(payload.iterations),
        durationMs: Number(payload.durationMs ?? payload.duration_ms),
        totalSamples: Number(payload.totalSamples ?? payload.total_samples),
        variant: payload.variant
    };
}
function parseTauriResponse(raw) {
    const normalized = normalizeTauriResponse(raw);
    try {
        return tauriComputeResponseSchema.parse(normalized);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const issue = error.issues[0];
            const path = issue?.path?.length ? issue.path.join('.') : 'response';
            const detail = issue?.message ?? 'unknown validation error';
            throw new TauriComputeError('invalid-response', `Invalid analyze_image response: ${path} ${detail}`, {
                cause: error
            });
        }
        throw error;
    }
}
// Electron bridge removed.
function createWasmComputeBridge() {
    return {
        id: 'wasm',
        async analyze() {
            throw new Error('Browser/WASM compute is no longer included in this build. Use the native Tauri path.');
        }
    };
}
function createTauriComputeBridge() {
    if (!isTauriEnv())
        return null;
    return {
        id: 'tauri-native',
        async analyze(_dataset, params) {
            const req = {
                path: globalThis.__ACTIVE_IMAGE_PATH__ ?? '',
                k: params.clusters,
                stride: params.stride,
                minLum: params.minLum,
                space: params.colorSpace,
                tol: params.tol ?? DEFAULT_TOLERANCE,
                maxIter: params.maxIter ?? DEFAULT_MAX_ITER,
                seed: params.seed ?? DEFAULT_SEED,
                maxSamples: params.maxSamples ?? DEFAULT_MAX_SAMPLES
            };
            if (!req.path) {
                throw new TauriComputeError('missing-path', 'No image path available for native analysis');
            }
            let rawResponse;
            try {
                rawResponse = await tauriInvoke('analyze_image', { req });
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                throw new TauriComputeError('invoke-failed', `Tauri analyze_image invoke failed: ${message}`, { cause: err });
            }
            const parsed = parseTauriResponse(rawResponse);
            const clusters = parsed.clusters.map((cluster) => ({
                count: cluster.count,
                share: cluster.share,
                centroidSpace: cluster.centroidSpace,
                rgb: cluster.rgb,
                hsv: cluster.hsv
            }));
            return {
                clusters,
                iterations: parsed.iterations,
                durationMs: parsed.durationMs,
                totalSamples: parsed.totalSamples,
                variant: String(parsed.variant ?? 'tauri-native')
            };
        }
    };
}
function logSelection(label, id) {
    console.info(`[bridges] ${label} bridge selected: ${id}`);
}
export function selectComputeBridge() {
    const tauriBridge = createTauriComputeBridge();
    if (tauriBridge) {
        const info = tauriDetectionInfo();
        console.info('[bridges] tauri detection', info);
        logSelection('compute', tauriBridge.id);
        return tauriBridge;
    }
    const fallback = createWasmComputeBridge();
    logSelection('compute', fallback.id);
    return fallback;
}
let cachedComputeBridge = null;
let bridgeReadyPromise = null;
async function ensureBridgeReady() {
    if (bridgeReadyPromise)
        return bridgeReadyPromise;
    bridgeReadyPromise = (async () => {
        // Event-based readiness: return immediately if not Tauri or if forced
        const forced = getBridgeOverride() === 'tauri';
        if (!forced && !isTauriEnv()) {
            // Poll briefly for Tauri globals to appear in dev; cap at ~300ms
            const start = Date.now();
            while (Date.now() - start < 300) {
                if (isTauriEnv())
                    break;
                await new Promise((r) => setTimeout(r, 20));
            }
        }
        console.info('[bridges] ensureBridgeReady complete; proceeding to bridge selection');
    })();
    return bridgeReadyPromise;
}
export async function getComputeBridge() {
    console.info('[bridges] getComputeBridge called, awaiting ready...');
    await ensureBridgeReady();
    if (!cachedComputeBridge) {
        console.info('[bridges] cache miss, selecting bridge now');
        cachedComputeBridge = selectComputeBridge();
    }
    else {
        console.info('[bridges] cache hit, returning existing bridge:', cachedComputeBridge.id);
    }
    return cachedComputeBridge;
}
