import { get } from 'svelte/store';
import type { FileSelection } from '../../bridges/fs';
import { isVideoFile } from '../../bridges/fs';
import { setupTauriDragDrop } from '../../services/drag-drop';
import { ingestFileAsEntry } from '../../services/media-ingestion';
import { images, appendFile, updateEntryPreview, libraryDrawerOpen } from '../../stores/ui';
import { pinnedImageIds, togglePin } from '../../stores/multi-analysis';
import { logEvent } from '../../bridges/log';

export interface BatchDropOptions {
  maxPins: number;
}

/**
 * Drop handling for BatchView: dropped images are appended to the media
 * bucket (deduped by path) without activating, then auto-pinned under the
 * pin cap. Raw videos are skipped — they cannot be pinned for batch.
 */
export function createBatchDrop(opts: BatchDropOptions) {
  let dragOver = $state(false);

  function processDrop(selections: FileSelection[]) {
    let added = 0;
    let pinned = 0;
    let skippedVideos = 0;
    for (const sel of selections) {
      if (isVideoFile(sel)) {
        skippedVideos += 1;
        continue;
      }
      const existing = sel.path
        ? get(images).find((item) => item.path === sel.path && !item.videoPath)
        : undefined;
      let id: string;
      if (existing) {
        id = existing.id;
      } else {
        const { entry, dataset } = ingestFileAsEntry(sel, updateEntryPreview);
        appendFile(entry, dataset);
        id = entry.id;
        added += 1;
      }
      const pins = get(pinnedImageIds);
      if (!pins.has(id) && pins.size < opts.maxPins) {
        togglePin(id);
        pinned += 1;
      }
    }
    if (added > 0) libraryDrawerOpen.set(true);
    void logEvent(`batch:drop added=${added} pinned=${pinned} skippedVideos=${skippedVideos}`);
  }

  function setup(): Promise<(() => void) | null> {
    return setupTauriDragDrop((selections) => processDrop(selections), {
      onEnter: () => {
        dragOver = true;
      },
      onLeave: () => {
        dragOver = false;
      }
    });
  }

  return {
    get dragOver() {
      return dragOver;
    },
    processDrop,
    setup
  };
}
