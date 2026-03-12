const KEY = '__ACTIVE_IMAGE_PATH__';

export function setActivePath(path: string): void {
  (globalThis as any)[KEY] = path;
}

export function getActivePath(): string | undefined {
  return (globalThis as any)[KEY];
}

export function clearActivePath(): void {
  try {
    delete (globalThis as any)[KEY];
  } catch {
    // ignore
  }
}
