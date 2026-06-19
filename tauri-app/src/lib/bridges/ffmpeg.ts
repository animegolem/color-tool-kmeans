import { tauriInvoke } from './tauri';

export async function getFfmpegVersion(): Promise<string> {
  const version = await tauriInvoke('ffmpeg_version');
  if (typeof version === 'string' && version.trim().length > 0) {
    return version;
  }
  throw new Error('FFmpeg version unavailable');
}
