import { computeBridge } from '../bridges/compute';
export async function analyzeImage(dataset, params) {
    const merged = {
        ...params
    };
    return computeBridge.analyze(dataset, merged);
}
export { computeBridge };
