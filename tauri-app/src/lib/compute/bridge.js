import { getComputeBridge } from '../bridges/compute';
export async function analyzeImage(dataset, params) {
    const merged = { ...params };
    const bridge = await getComputeBridge();
    return bridge.analyze(dataset, merged);
}
