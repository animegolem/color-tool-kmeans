import { isTauriEnv, tauriInvoke } from './tauri';

export async function logEvent(message: string, source = 'renderer'): Promise<void> {
  if (!message) return;
  if (!isTauriEnv()) return;
  try {
    await tauriInvoke('log_event', { req: { message, source } });
  } catch (err) {
    console.warn('[log-event] failed to write log event', err);
  }
}
