import { isTauriEnv, tauriInvoke } from '../bridges/tauri';
import type { ImageEntry } from '../stores/image';

export async function cleanupMediaArtifacts(entry: ImageEntry): Promise<void> {
  if (!isTauriEnv()) return;
  try {
    await tauriInvoke('remove_media_artifacts', {
      req: { imageId: entry.id, artifactPath: entry.path ?? null },
    });
  } catch (error) {
    console.warn('[media-artifacts] removal failed', error);
  }
}

export async function cleanupAllMediaArtifacts(
  entries: ImageEntry[]
): Promise<void> {
  await Promise.all(entries.map((entry) => cleanupMediaArtifacts(entry)));
}
