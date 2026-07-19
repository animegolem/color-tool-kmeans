import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isTauriEnv: vi.fn(() => true),
  listen: vi.fn(),
}));

vi.mock('../bridges/tauri', () => ({ isTauriEnv: mocks.isTauriEnv }));
vi.mock('@tauri-apps/api/event', () => ({ listen: mocks.listen }));

import { setupTauriDragDrop } from './drag-drop';

describe('Tauri drag-drop listener lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isTauriEnv.mockReturnValue(true);
  });

  it('SWEEP-004: rolls back every acquired listener when later registration fails', async () => {
    const unlistenDrop = vi.fn();
    const unlistenEnter = vi.fn();
    const error = new Error('drag-leave registration failed');
    mocks.listen
      .mockResolvedValueOnce(unlistenDrop)
      .mockResolvedValueOnce(unlistenEnter)
      .mockRejectedValueOnce(error);

    await expect(
      setupTauriDragDrop(vi.fn(), {
        onEnter: vi.fn(),
        onLeave: vi.fn(),
      })
    ).rejects.toBe(error);

    expect(mocks.listen).toHaveBeenCalledTimes(3);
    expect(unlistenEnter).toHaveBeenCalledOnce();
    expect(unlistenDrop).toHaveBeenCalledOnce();
  });
});
