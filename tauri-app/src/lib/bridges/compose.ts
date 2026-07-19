import { tauriInvoke } from './tauri';
import {
  parseComposeGridResponse,
  type ComposeGridResult,
} from './ipc-contracts';

export type { ComposeGridResult } from './ipc-contracts';

export async function composeGrid(
  paths: string[],
  maxCellDim?: number
): Promise<ComposeGridResult> {
  const response = await tauriInvoke('compose_grid', {
    req: { paths, maxCellDim: maxCellDim ?? null },
  });
  return parseComposeGridResponse(response);
}
