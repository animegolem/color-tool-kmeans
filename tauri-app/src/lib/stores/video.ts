import { writable, get } from 'svelte/store';

export interface VideoState {
  path: string;
  name: string;
  duration: number;
  fps: number | null;
  currentTime: number;
  stripPath?: string | null;
  posterPath?: string | null;
}

export const videoState = writable<VideoState | null>(null);

export function setVideoState(state: VideoState | null) {
  videoState.set(state);
}

export interface VideoCacheEntry {
  duration: number;
  fps: number | null;
  currentTime: number;
  stripPath: string | null;
  stripId: string | null;
  posterPath: string | null;
  frameId: string;
}

export const videoStateCache = writable<Record<string, VideoCacheEntry>>({});

export function cacheVideoState(videoPath: string, entry: VideoCacheEntry) {
  videoStateCache.update((cache) => ({ ...cache, [videoPath]: entry }));
}

export function getCachedVideoState(videoPath: string): VideoCacheEntry | null {
  return get(videoStateCache)[videoPath] ?? null;
}
