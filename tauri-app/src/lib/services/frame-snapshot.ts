import { appLocalDataDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/core';
import { tauriInvoke } from '../bridges/tauri';
import { appendFile, libraryDrawerOpen, type ImageEntry } from '../stores/ui';
import { logEvent } from '../bridges/log';

export interface SnapshotRequest {
  /** Path to the currently-displayed frame on disk (lives in the prunable cache dir). */
  framePath: string;
  /** Source video name, used to derive the snapshot entry name. */
  name: string;
  /** Current playback timestamp in seconds, encoded into the name. */
  timestamp: number;
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}m${String(secs).padStart(2, '0')}s`;
}

/**
 * Capture the current video frame as a standalone still in the media bucket.
 *
 * The displayed frame already exists on disk in the cache dir, but that dir is
 * pruned (keep-newest-N on startup), so we copy it to a persistent location
 * first. The resulting entry is a plain image (no videoPath/frameTimestamp) so
 * the bucket treats it as an independent still — clickable, analyzable, and
 * pinnable — rather than re-routing back into the source video. The artifact
 * cleanup service removes this managed copy when its media entry is removed.
 */
export async function snapshotCurrentFrame(req: SnapshotRequest): Promise<void> {
  if (!req.framePath) return;
  const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const dest = await join(await appLocalDataDir(), 'snapshots', `snapshot-${id}.png`);

  try {
    await tauriInvoke('copy_file', { req: { source: req.framePath, dest } });
  } catch (err) {
    console.error('[frame-snapshot] copy failed', err);
    void logEvent(`snapshot:error message=${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  const label = req.name.replace(/\.[^.]+$/, '');
  const entry: ImageEntry = {
    id,
    name: `${label} @ ${formatTimestamp(req.timestamp)}`,
    path: dest,
    size: 0,
    source: { kind: 'path', path: dest },
    previewUrl: convertFileSrc(dest)
  };
  const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
  appendFile(entry, dataset);
  libraryDrawerOpen.set(true);
  void logEvent(`snapshot:captured t=${req.timestamp.toFixed(2)}`);
}
