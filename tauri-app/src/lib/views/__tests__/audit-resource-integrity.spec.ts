import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tauriInvoke: vi.fn(),
  isTauriEnv: vi.fn(() => true)
}));

vi.mock('../../bridges/tauri', () => mocks);

import { mountAsyncListener } from '../batch/batch-drop.svelte';
import { cleanupAllMediaArtifacts } from '../../services/artifact-cleanup';
import type { ImageEntry } from '../../stores/ui';

describe('resource-integrity regressions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.tauriInvoke.mockResolvedValue(undefined);
  });

  it('AUD-011: cleans Values and managed source artifacts for every removed entry', async () => {
    const entries: ImageEntry[] = [
      {
        id: 'value-entry',
        name: 'paste.png',
        path: '/cache/clipboard/paste-1.png',
        size: 0,
        source: { kind: 'path', path: '/cache/clipboard/paste-1.png' },
        previewUrl: null
      },
      {
        id: 'snapshot-entry',
        name: 'snapshot',
        path: '/data/snapshots/snapshot-1.png',
        size: 0,
        source: { kind: 'path', path: '/data/snapshots/snapshot-1.png' },
        previewUrl: null
      }
    ];

    await cleanupAllMediaArtifacts(entries);

    expect(mocks.tauriInvoke).toHaveBeenCalledTimes(2);
    expect(mocks.tauriInvoke).toHaveBeenCalledWith('remove_media_artifacts', {
      req: { imageId: 'value-entry', artifactPath: '/cache/clipboard/paste-1.png' }
    });
    expect(mocks.tauriInvoke).toHaveBeenCalledWith('remove_media_artifacts', {
      req: { imageId: 'snapshot-entry', artifactPath: '/data/snapshots/snapshot-1.png' }
    });
  });

  it('AUD-013: unlistens when registration resolves after view cleanup', async () => {
    let resolveRegistration!: (unlisten: () => void) => void;
    const registration = new Promise<() => void>((resolve) => {
      resolveRegistration = resolve;
    });
    const unlisten = vi.fn();

    const cleanup = mountAsyncListener(() => registration);
    cleanup();
    resolveRegistration(unlisten);
    await registration;
    await Promise.resolve();

    expect(unlisten).toHaveBeenCalledOnce();
  });
});
