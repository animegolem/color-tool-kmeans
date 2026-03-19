import { writable, derived, get } from 'svelte/store';
import { images, type ImageEntry } from './image';
import type { AnalysisResult } from './analysis';

// --- Pin state ---
export const pinnedImageIds = writable<Set<string>>(new Set());

// Derived: ordered array of pinned ImageEntry objects.
// Order follows `images` array order (stable), filters to only pinned IDs.
// Automatically excludes entries removed from the bucket.
export const pinnedImages = derived(
  [images, pinnedImageIds],
  ([$images, $pinned]) =>
    $images.filter((img) => $pinned.has(img.id))
);

export function togglePin(id: string) {
  pinnedImageIds.update((set) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  resetMultiAnalysis();
}

export function clearPins() {
  pinnedImageIds.set(new Set());
  resetMultiAnalysis();
}

// --- Multi-analysis lifecycle ---
export type MultiAnalysisState = 'idle' | 'compositing' | 'analyzing' | 'ready' | 'error';

export const multiAnalysisState = writable<MultiAnalysisState>('idle');
export const multiAnalysisResult = writable<AnalysisResult | null>(null);
export const multiAnalysisError = writable<string | null>(null);
export const multiCompositePath = writable<string | null>(null);

export function resetMultiAnalysis() {
  multiAnalysisState.set('idle');
  multiAnalysisResult.set(null);
  multiAnalysisError.set(null);
  multiCompositePath.set(null);
}

// --- Auto-cleanup: prune pins when images are removed ---
images.subscribe(($images) => {
  const currentIds = new Set($images.map((img) => img.id));
  const $pinned = get(pinnedImageIds);
  let pruned = false;
  for (const id of $pinned) {
    if (!currentIds.has(id)) {
      pruned = true;
      break;
    }
  }
  if (pruned) {
    pinnedImageIds.update((set) => {
      const next = new Set<string>();
      for (const id of set) {
        if (currentIds.has(id)) next.add(id);
      }
      return next;
    });
    resetMultiAnalysis();
  }
});
