import { listen } from '@tauri-apps/api/event';
import { isTauriEnv } from '../bridges/tauri';
import type { FileSelection } from '../bridges/fs';
import { inferMimeType } from './media-types';

function pathsToSelections(paths: string[]): FileSelection[] {
  return paths.map((p) => {
    const name = p.split(/[\\/]/).pop() ?? 'file';
    return {
      name,
      path: p,
      size: 0,
      blob: new Blob([], { type: inferMimeType(name) }),
      mimeType: inferMimeType(name),
    } satisfies FileSelection;
  });
}

export interface DragDropOptions {
  /** Fired on tauri://drag-enter — HTML5 dragover is suppressed by Tauri's native handling. */
  onEnter?: () => void;
  /** Fired on tauri://drag-leave and on drop (drag-leave does not fire when the drop lands). */
  onLeave?: () => void;
}

export async function setupTauriDragDrop(
  onBatch: (selections: FileSelection[]) => void,
  options?: DragDropOptions
): Promise<(() => void) | null> {
  if (!isTauriEnv()) return null;
  const unlistens: Array<() => void> = [];
  try {
    unlistens.push(
      await listen<{ paths?: string[] }>('tauri://drag-drop', (event) => {
        options?.onLeave?.();
        const paths = event.payload?.paths;
        if (!paths?.length) return;
        onBatch(pathsToSelections(paths));
      })
    );
    if (options?.onEnter) {
      unlistens.push(
        await listen('tauri://drag-enter', () => options.onEnter?.())
      );
    }
    if (options?.onLeave) {
      unlistens.push(
        await listen('tauri://drag-leave', () => options.onLeave?.())
      );
    }
  } catch (error) {
    for (const unlisten of unlistens.reverse()) {
      try {
        unlisten();
      } catch (cleanupError) {
        console.error('[drag-drop] Failed to roll back listener', cleanupError);
      }
    }
    throw error;
  }
  return () => unlistens.forEach((fn) => fn());
}
