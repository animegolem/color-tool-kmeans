import { writable, derived } from 'svelte/store';
import { images, type ImageEntry } from './image';
import type { AnalysisResult } from './analysis';

// --- Pin state ---
export const pinnedImageIds = writable<Set<string>>(new Set());

// Derived: ordered array of pinned ImageEntry objects.
// Order follows `images` array order (stable), filters to only pinned IDs.
// Automatically excludes entries removed from the bucket.
export const pinnedImages = derived(
  [images, pinnedImageIds],
  ([$images, $pinned]) => $images.filter((img) => $pinned.has(img.id))
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
export type MultiAnalysisState =
  | 'idle'
  | 'compositing'
  | 'analyzing'
  | 'ready'
  | 'error';

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

// --- Auto-cleanup: prune pins and invalidate results when pinned pixels change ---
let pinnedRevisions = new Map<string, number>();

derived(
  [images, pinnedImageIds],
  ([$images, $pinned]) => [$images, $pinned] as const
).subscribe(([$images, $pinned]) => {
  const currentIds = new Set($images.map((img) => img.id));
  const pruned = [...$pinned].some((id) => !currentIds.has(id));
  const nextPinnedRevisions = new Map(
    $images
      .filter((image) => $pinned.has(image.id))
      .map((image) => [image.id, image.contentRevision ?? 0] as const)
  );
  const contentChanged = [...nextPinnedRevisions].some(
    ([id, revision]) =>
      pinnedRevisions.has(id) && pinnedRevisions.get(id) !== revision
  );
  pinnedRevisions = nextPinnedRevisions;

  if (pruned) {
    pinnedImageIds.update((set) => {
      const next = new Set<string>();
      for (const id of set) {
        if (currentIds.has(id)) next.add(id);
      }
      return next;
    });
    resetMultiAnalysis();
  } else if (contentChanged) {
    resetMultiAnalysis();
  }
});
