import { writable } from 'svelte/store';

export type ZoomContent =
  | { kind: 'image'; src: string; alt?: string; width?: number; height?: number }
  | { kind: 'svg'; svg: string; width: number; height: number };

export interface ZoomOverlayState {
  content: ZoomContent;
}

export const zoomOverlay = writable<ZoomOverlayState | null>(null);

export function openZoomOverlay(content: ZoomContent) {
  zoomOverlay.set({ content });
}

export function closeZoomOverlay() {
  zoomOverlay.set(null);
}
