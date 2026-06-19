import { convertFileSrc } from '@tauri-apps/api/core';

/**
 * Converts a native filesystem path to a Tauri asset URL with cache-busting.
 * Use this for any generated/extracted file (video frames, strips, analysis renders)
 * where the file content may change while the path stays the same.
 */
export function assetUrl(path: string): string {
  return `${convertFileSrc(path)}?t=${Date.now()}`;
}
