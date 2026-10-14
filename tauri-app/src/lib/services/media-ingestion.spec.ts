import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ native: true }));

vi.mock('@tauri-apps/api/core', () => ({
  convertFileSrc: (path: string) => `asset://${path}`,
}));
vi.mock('../bridges/tauri', () => ({
  isTauriEnv: () => mocks.native,
}));
vi.mock('../bridges/video', () => ({
  extractVideoFrame: vi.fn(),
}));

import { clearFile, setFile } from '../stores/image';
import { ingestFileAsEntry } from './media-ingestion';

const emptyDataset = { width: 0, height: 0, pixels: new Uint8Array(0) };

describe('media ingestion source ownership', () => {
  beforeEach(() => {
    mocks.native = true;
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:preview');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  });

  afterEach(() => {
    clearFile();
    vi.restoreAllMocks();
  });

  it('preserves native path authority and its asset preview', () => {
    const result = ingestFileAsEntry({
      name: 'native.png',
      path: '/tmp/native.png',
      blob: new Blob(),
      size: 0,
      mimeType: 'image/png',
    });

    expect(result.entry).toMatchObject({
      name: 'native.png',
      path: '/tmp/native.png',
      source: { kind: 'path', path: '/tmp/native.png' },
      previewUrl: 'asset:///tmp/native.png',
    });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('retains the exact browser Blob without inventing a path', () => {
    mocks.native = false;
    const source = new Blob(['encoded'], { type: 'image/png' });

    const result = ingestFileAsEntry({
      name: 'browser.png',
      blob: source,
      size: source.size,
      mimeType: source.type,
    });

    expect(result.entry.source).toEqual({ kind: 'blob', blob: source });
    expect(result.entry).not.toHaveProperty('path');
    expect(result.entry.previewUrl).toBe('blob:preview');
  });

  it('keeps Blob ownership separate from revocable preview URL ownership', () => {
    mocks.native = false;
    const source = new Blob(['encoded'], { type: 'image/png' });
    const { entry } = ingestFileAsEntry({
      name: 'browser.png',
      blob: source,
      size: source.size,
      mimeType: source.type,
    });
    setFile(entry, emptyDataset);

    clearFile();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
    expect(entry.source).toEqual({ kind: 'blob', blob: source });
  });
});
