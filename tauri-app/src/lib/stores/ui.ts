import { writable, derived } from 'svelte/store';

export type View = 'home' | 'graphs' | 'exports';

export interface AnalysisParams {
  colorSpace: 'RGB' | 'HSL' | 'YUV' | 'CIELAB' | 'CIELUV';
  clusters: number;
  stride: number;
  minLum: number;
  axis: 'HSL' | 'HLS';
  symbolScale: number;
}

export const currentView = writable<View>('home');

export const selectedFile = writable<{ path: string; name: string } | null>(null);

export const params = writable<AnalysisParams>({
  colorSpace: 'HSL',
  clusters: 10,
  stride: 4,
  minLum: 10,
  axis: 'HSL',
  symbolScale: 1
});

export const hasFile = derived(selectedFile, ($file) => $file !== null);

export function setView(view: View) {
  currentView.set(view);
}

export function setFile(path: string, name: string) {
  selectedFile.set({ path, name });
}

export function clearFile() {
  selectedFile.set(null);
}
