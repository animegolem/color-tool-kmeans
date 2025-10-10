import { writable, derived } from 'svelte/store';
export const currentView = writable('home');
export const selectedFile = writable(null);
export const params = writable({
    colorSpace: 'HSL',
    clusters: 10,
    stride: 4,
    minLum: 10,
    axis: 'HSL',
    symbolScale: 1
});
export const hasFile = derived(selectedFile, ($file) => $file !== null);
export const analysisState = writable('idle');
export const analysisResult = writable(null);
export const analysisError = writable(null);
export function setAnalysisPending() {
    analysisState.set('pending');
    analysisError.set(null);
}
export function setAnalysisSuccess(result) {
    analysisResult.set(result);
    analysisState.set('ready');
    analysisError.set(null);
}
export function setAnalysisError(message) {
    analysisError.set(message);
    analysisState.set('error');
}
export function resetAnalysis() {
    analysisResult.set(null);
    analysisError.set(null);
    analysisState.set('idle');
}
export function clearAnalysisError() {
    analysisError.set(null);
    analysisState.set('idle');
}
export const topClusters = derived(analysisResult, ($result) => {
    if (!$result)
        return [];
    return $result.clusters.slice(0, 8);
});
export function setView(view) {
    currentView.set(view);
}
export function setFile(image) {
    selectedFile.set(image);
    resetAnalysis();
}
export function clearFile() {
    selectedFile.set(null);
    resetAnalysis();
    try {
        // Clear native path used by Tauri compute bridge to avoid stale state
        if (globalThis.__ACTIVE_IMAGE_PATH__) {
            delete globalThis.__ACTIVE_IMAGE_PATH__;
        }
    }
    catch {
        // ignore
    }
}
