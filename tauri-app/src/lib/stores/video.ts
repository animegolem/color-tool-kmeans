import { writable, get } from 'svelte/store';
import type { ImageEntry, SelectionAuthority } from './image';

export interface SettledVideoFrame {
  selectionEpoch: number;
  imageId: string;
  contentRevision: number;
  outputPath: string;
  videoPath: string;
  requestedTime: number;
  maxDimension: number;
}

export interface VideoState {
  selection: SelectionAuthority;
  path: string;
  name: string;
  duration: number;
  fps: number | null;
  currentTime: number;
  settledFrame: SettledVideoFrame | null;
  stripPath?: string | null;
  stripId?: string | null;
  posterPath?: string | null;
}

export function matchesSettledVideoFrame(
  state: VideoState | null,
  currentSelection: SelectionAuthority | null,
  entry: ImageEntry | null,
  maxDimension: number
): entry is ImageEntry & { path: string; contentRevision: number } {
  const settled = state?.settledFrame;
  return (
    state !== null &&
    currentSelection !== null &&
    state.selection.epoch === currentSelection.epoch &&
    settled !== null &&
    entry !== null &&
    state.path === settled.videoPath &&
    settled.selectionEpoch === state.selection.epoch &&
    state.currentTime === settled.requestedTime &&
    settled.maxDimension === maxDimension &&
    entry.id === settled.imageId &&
    entry.contentRevision === settled.contentRevision &&
    entry.path === settled.outputPath &&
    entry.videoPath === settled.videoPath &&
    entry.frameTimestamp === settled.requestedTime
  );
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
