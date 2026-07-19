import { get } from 'svelte/store';
import type { FileSelection } from '../../bridges/fs';
import { isVideoFile } from '../../bridges/fs';
import { setupTauriDragDrop } from '../../services/drag-drop';
import { ingestFileAsEntry } from '../../services/media-ingestion';
import {
  images,
  appendFile,
  setFile,
  switchToFile,
  updateEntryPreview,
  libraryDrawerOpen,
} from '../../stores/ui';
import { pinnedImageIds, togglePin } from '../../stores/multi-analysis';
import { logEvent } from '../../bridges/log';
import { setActivePath } from '../../services/active-image';

export interface BatchDropOptions {
  maxPins: number;
}

export interface BatchSelectionOptions extends BatchDropOptions {
  activateFirst?: boolean;
}

export interface BatchSelectionResult {
  ids: string[];
  added: number;
  pinned: number;
  skippedVideos: number;
}

export function processBatchSelections(
  selections: FileSelection[],
  options: BatchSelectionOptions
): BatchSelectionResult {
  const ids: string[] = [];
  let added = 0;
  let pinned = 0;
  let skippedVideos = 0;
  let activated = false;

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
      if (options.activateFirst && !activated) {
        switchToFile(id);
        activated = true;
      }
    } else {
      const { entry, dataset } = ingestFileAsEntry(sel, updateEntryPreview);
      if (options.activateFirst && !activated) {
        if (entry.path) setActivePath(entry.path);
        setFile(entry, dataset);
        activated = true;
      } else {
        appendFile(entry, dataset);
      }
      id = entry.id;
      added += 1;
    }
    ids.push(id);

    const pins = get(pinnedImageIds);
    if (!pins.has(id) && pins.size < options.maxPins) {
      togglePin(id);
      pinned += 1;
    }
  }

  if (added > 0) libraryDrawerOpen.set(true);
  return { ids, added, pinned, skippedVideos };
}

/**
 * Drop handling for BatchView: dropped images are appended to the media
 * bucket (deduped by path) without activating, then auto-pinned under the
 * pin cap. Raw videos are skipped — they cannot be pinned for batch.
 */
export function createBatchDrop(opts: BatchDropOptions) {
  let dragOver = $state(false);

  function processDrop(
    selections: FileSelection[],
    options: Pick<BatchSelectionOptions, 'activateFirst'> = {}
  ) {
    const result = processBatchSelections(selections, {
      maxPins: opts.maxPins,
      ...options,
    });
    void logEvent(
      `batch:drop added=${result.added} pinned=${result.pinned} skippedVideos=${result.skippedVideos}`
    );
    return result;
  }

  async function setup(): Promise<(() => void) | null> {
    return setupTauriDragDrop((selections) => processDrop(selections), {
      onEnter: () => {
        dragOver = true;
      },
      onLeave: () => {
        dragOver = false;
      },
    });
  }

  return {
    get dragOver() {
      return dragOver;
    },
    processDrop,
    setup,
  };
}
