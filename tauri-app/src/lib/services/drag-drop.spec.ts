import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    mocks.listen.mockReset();
    mocks.isTauriEnv.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('SWEEP-004: rolls back every acquired listener when later registration rejects', async () => {
    const unlistenDrop = vi.fn();
    const cleanupError = new Error('drag-enter cleanup failed');
    const unlistenEnter = vi.fn(() => {
      throw cleanupError;
    });
    const registrationError = new Error('drag-leave registration failed');
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mocks.listen
      .mockResolvedValueOnce(unlistenDrop)
      .mockResolvedValueOnce(unlistenEnter)
      .mockRejectedValueOnce(registrationError);

    await expect(
      setupTauriDragDrop(vi.fn(), {
        onEnter: vi.fn(),
        onLeave: vi.fn(),
      })
    ).rejects.toBe(registrationError);

    expect(mocks.listen).toHaveBeenCalledTimes(3);
    expect(unlistenEnter).toHaveBeenCalledOnce();
    expect(unlistenDrop).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      '[drag-drop] Failed to roll back listener',
      cleanupError
    );
  });

  it('SWEEP-004: rejects a synchronous registration throw', async () => {
    const unlistenDrop = vi.fn();
    const registrationError = new Error('drag-drop registration threw');
    mocks.listen
      .mockResolvedValueOnce(unlistenDrop)
      .mockImplementationOnce(() => {
        throw registrationError;
      });

    await expect(
      setupTauriDragDrop(vi.fn(), { onEnter: vi.fn() })
    ).rejects.toBe(registrationError);
    expect(mocks.listen).toHaveBeenCalledTimes(2);
    expect(unlistenDrop).toHaveBeenCalledOnce();
  });

  it('SWEEP-004: releases every listener once during repeated normal disposal', async () => {
    const unlistenDrop = vi.fn();
    const cleanupError = new Error('drag-enter cleanup failed');
    const unlistenEnter = vi.fn(() => {
      throw cleanupError;
    });
    const unlistenLeave = vi.fn();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mocks.listen
      .mockResolvedValueOnce(unlistenDrop)
      .mockResolvedValueOnce(unlistenEnter)
      .mockResolvedValueOnce(unlistenLeave);

    const cleanup = await setupTauriDragDrop(vi.fn(), {
      onEnter: vi.fn(),
      onLeave: vi.fn(),
    });
    cleanup?.();
    cleanup?.();

    expect(unlistenLeave).toHaveBeenCalledOnce();
    expect(unlistenEnter).toHaveBeenCalledOnce();
    expect(unlistenDrop).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledWith(
      '[drag-drop] Failed to remove listener',
      cleanupError
    );
  });
});
