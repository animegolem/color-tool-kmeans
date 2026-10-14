import { describe, expect, it, vi } from 'vitest';
import {
  createBrowserFsBridge,
  FsBridgeUnavailableError,
  pickBrowserImage,
} from './fs';

function file(name = 'study.png', type = 'image/png'): File {
  return Object.assign(new Blob(['pixels'], { type }), {
    name,
    lastModified: 42,
  }) as File;
}

describe('browser file bridge', () => {
  it('returns one pathless File-backed still with the browser bridge ID', async () => {
    const selected = file();
    const bridge = createBrowserFsBridge(async () => selected);

    const result = await bridge.openMediaFiles('all');

    expect(bridge.id).toBe('browser-file');
    expect(result).toEqual([
      {
        name: 'study.png',
        blob: selected,
        size: selected.size,
        lastModified: 42,
        mimeType: 'image/png',
      },
    ]);
    expect(result?.[0]).not.toHaveProperty('path');
  });

  it('returns null when the browser picker is canceled', async () => {
    const bridge = createBrowserFsBridge(async () => null);
    await expect(bridge.openMediaFiles('images')).resolves.toBeNull();
  });

  it('rejects browser video and save operations with a typed error', async () => {
    const videoBridge = createBrowserFsBridge(async () =>
      file('clip.mp4', 'video/mp4')
    );
    const imageBridge = createBrowserFsBridge(async () => file());

    await expect(videoBridge.openMediaFiles('all')).rejects.toMatchObject({
      name: 'FsBridgeUnavailableError',
      operation: 'open-video',
    });
    await expect(imageBridge.openMediaFiles('videos')).rejects.toBeInstanceOf(
      FsBridgeUnavailableError
    );
    await expect(
      imageBridge.saveBlob(new Blob(), 'export.png')
    ).rejects.toMatchObject({ operation: 'save' });
    await expect(
      imageBridge.saveTextFile('text', 'export.txt')
    ).rejects.toMatchObject({ operation: 'save' });
  });

  it('rejects image MIME types outside the supported decoder set', async () => {
    const bridge = createBrowserFsBridge(async () =>
      file('vector.svg', 'image/svg+xml')
    );

    await expect(bridge.openMediaFiles('images')).rejects.toMatchObject({
      operation: 'unsupported-file',
      code: 'FS_OPERATION_UNAVAILABLE',
    });
  });

  it('configures a hidden single-image input and resolves its selected File', async () => {
    const listeners = new Map<string, EventListener>();
    const selected = file('chosen.tiff', 'image/tiff');
    const input = {
      type: '',
      accept: '',
      multiple: true,
      hidden: false,
      files: [selected],
      click: vi.fn(),
      remove: vi.fn(),
      addEventListener: vi.fn((name: string, listener: EventListener) => {
        listeners.set(name, listener);
      }),
      removeEventListener: vi.fn(),
    };
    const documentRef = {
      createElement: vi.fn(() => input),
      body: { append: vi.fn() },
    };
    const windowRef = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: vi.fn(),
    };

    const pending = pickBrowserImage(
      documentRef as unknown as Document,
      windowRef as unknown as Window
    );
    listeners.get('change')?.(new Event('change'));

    await expect(pending).resolves.toBe(selected);
    expect(input.type).toBe('file');
    expect(input.accept).toContain('image/png');
    expect(input.accept).toContain('.tiff');
    expect(input.multiple).toBe(false);
    expect(input.hidden).toBe(true);
    expect(documentRef.body.append).toHaveBeenCalledWith(input);
    expect(input.click).toHaveBeenCalledOnce();
    expect(input.remove).toHaveBeenCalledOnce();
  });
});
