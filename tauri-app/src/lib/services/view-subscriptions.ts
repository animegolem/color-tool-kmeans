import { get } from 'svelte/store';
import {
  pendingVideoSwitch,
  images,
  mediaLoadRequested,
  isCurrentSelection,
} from '../stores/ui';
import type { ImageEntry, SelectionAuthority } from '../stores/ui';

export interface ResolvedVideoSwitch {
  entry: ImageEntry;
  videoPath: string;
  id: string;
  cid?: string;
  selection: SelectionAuthority;
}

export function subscribePendingVideoSwitch(
  callback: (resolved: ResolvedVideoSwitch) => void
): () => void {
  return pendingVideoSwitch.subscribe((pending) => {
    if (!pending) return;
    const { id, cid, selection } = pending;
    pendingVideoSwitch.update((current) =>
      current === pending ? null : current
    );
    if (!isCurrentSelection(selection)) return;
    const entry = get(images).find((item) => item.id === id);
    if (!entry?.path) return;
    const videoPath = entry.videoPath ?? entry.path;
    callback({ entry, videoPath, id, cid, selection });
  });
}

export function subscribeMediaLoadRequested(callback: () => void): () => void {
  let first = true;
  return mediaLoadRequested.subscribe(() => {
    if (first) {
      first = false;
      return;
    }
    callback();
  });
}
