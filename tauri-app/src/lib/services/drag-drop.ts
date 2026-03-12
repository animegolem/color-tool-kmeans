import { listen } from '@tauri-apps/api/event';
import { isTauriEnv } from '../bridges/tauri';
import { inferMimeType } from '../bridges/fs';
import type { FileSelection } from '../bridges/fs';

function pathsToSelections(paths: string[]): FileSelection[] {
  return paths.map((p) => {
    const name = p.split(/[\\/]/).pop() ?? 'file';
    return {
      name,
      path: p,
      size: 0,
      blob: new Blob([], { type: inferMimeType(name) }),
      mimeType: inferMimeType(name)
    } satisfies FileSelection;
  });
}

export async function setupTauriDragDrop(
  onBatch: (selections: FileSelection[]) => void
): Promise<(() => void) | null> {
  if (!isTauriEnv()) return null;
  const unlisten = await listen<{ paths?: string[] }>('tauri://drag-drop', (event) => {
    const paths = event.payload?.paths;
    if (!paths?.length) return;
    onBatch(pathsToSelections(paths));
  });
  return unlisten;
}
