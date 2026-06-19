import { tauriInvoke } from './tauri';

export interface ComposeGridResult {
  path: string;
  width: number;
  height: number;
  gridCols: number;
  gridRows: number;
}

export async function composeGrid(
  paths: string[],
  maxCellDim?: number
): Promise<ComposeGridResult> {
  return tauriInvoke('compose_grid', {
    req: { paths, maxCellDim: maxCellDim ?? null }
  });
}
