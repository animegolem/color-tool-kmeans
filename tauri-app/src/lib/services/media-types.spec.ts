import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isTauriEnv: vi.fn(() => true),
  open: vi.fn(),
  save: vi.fn(),
  tauriInvoke: vi.fn(),
}));

vi.mock('../bridges/tauri', () => ({
  isTauriEnv: mocks.isTauriEnv,
  tauriInvoke: mocks.tauriInvoke,
}));
vi.mock('@tauri-apps/plugin-dialog', () => ({
  open: mocks.open,
  save: mocks.save,
}));

import {
  getFsBridge,
  inferMimeType as inferMimeTypeFromFs,
  isVideoFile,
  sourceImageExportName,
} from '../bridges/fs';
import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  canonicalExtensionForMimeType,
  canonicalImageExtension,
  hasVideoExtension,
  inferMimeType,
} from './media-types';

describe('media type registry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isTauriEnv.mockReturnValue(true);
  });

  it('SWEEP-009 keeps current image/video extensions and MIME aliases', () => {
    expect(IMAGE_EXTENSIONS).toEqual([
      'png',
      'jpg',
      'jpeg',
      'webp',
      'bmp',
      'gif',
      'tif',
      'tiff',
    ]);
    expect(VIDEO_EXTENSIONS).toEqual(['mp4', 'mov', 'webm']);

    const expectedMimes = new Map([
      ['png', 'image/png'],
      ['jpg', 'image/jpeg'],
      ['jpeg', 'image/jpeg'],
      ['webp', 'image/webp'],
      ['bmp', 'image/bmp'],
      ['gif', 'image/gif'],
      ['tif', 'image/tiff'],
      ['tiff', 'image/tiff'],
      ['mp4', 'video/mp4'],
      ['mov', 'video/quicktime'],
      ['webm', 'video/webm'],
    ]);

    for (const extension of [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]) {
      const name = `sample.${extension.toUpperCase()}`;
      expect(inferMimeType(name)).toBe(expectedMimes.get(extension));
      expect(inferMimeTypeFromFs(name)).toBe(expectedMimes.get(extension));
    }
  });

  it('SWEEP-009 canonicalizes source names and detects video extensions', () => {
    expect(canonicalImageExtension('scan.tiff')).toBe('tif');
    expect(canonicalImageExtension('scan.TIF')).toBe('tif');
    expect(canonicalImageExtension('portrait.jpeg')).toBe('jpg');
    expect(canonicalImageExtension('unknown.raw')).toBe('png');
    expect(sourceImageExportName('scan.TIFF', 'study')).toBe(
      'study-source.tif'
    );
    expect(sourceImageExportName('portrait.JPEG', 'study')).toBe(
      'study-source.jpg'
    );
    expect(sourceImageExportName('unknown.raw', 'study')).toBe(
      'study-source.png'
    );
    expect(canonicalExtensionForMimeType(' IMAGE/TIFF ')).toBe('tif');
    expect(hasVideoExtension('clip.WEBM')).toBe(true);
    expect(hasVideoExtension('still.webp')).toBe(false);
    expect(
      isVideoFile({
        name: 'clip.MOV',
        blob: new Blob(),
        size: 0,
      })
    ).toBe(true);
  });

  it.each(['constructor', '__proto__', 'toString'])(
    'W2-1 rejects prototype-named extension %s safely',
    (extension) => {
      const name = `sample.${extension}`;
      expect(inferMimeType(name)).toBe('application/octet-stream');
      expect(canonicalImageExtension(name)).toBe('png');
      expect(canonicalExtensionForMimeType(extension)).toBeNull();
    }
  );

  it('W2-1 rejects arbitrary unsupported MIME keys', () => {
    expect(canonicalExtensionForMimeType('image/heic')).toBeNull();
    expect(canonicalExtensionForMimeType('video/constructor')).toBeNull();
    expect(canonicalExtensionForMimeType('__proto__')).toBeNull();
  });

  it('W2-3 makes the native picker consume the shared registry', async () => {
    mocks.open.mockResolvedValue(null);
    const bridge = getFsBridge();

    await bridge.openMediaFiles('images');
    await bridge.openMediaFiles('videos');
    await bridge.openMediaFiles('all');

    expect(mocks.open).toHaveBeenNthCalledWith(1, {
      multiple: true,
      filters: [{ name: 'Images', extensions: [...IMAGE_EXTENSIONS] }],
    });
    expect(mocks.open).toHaveBeenNthCalledWith(2, {
      multiple: true,
      filters: [{ name: 'Videos', extensions: [...VIDEO_EXTENSIONS] }],
    });
    expect(mocks.open).toHaveBeenNthCalledWith(3, {
      multiple: true,
      filters: [
        {
          name: 'All Media',
          extensions: [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS],
        },
        { name: 'Images', extensions: [...IMAGE_EXTENSIONS] },
        { name: 'Videos', extensions: [...VIDEO_EXTENSIONS] },
      ],
    });
  });

  it('W2-3 infers picker payload MIME types through the shared registry', async () => {
    mocks.open.mockResolvedValueOnce([
      '/tmp/scan.TIF',
      '/tmp/photo.TIFF',
      '/tmp/clip.WEBM',
    ]);

    const selections = await getFsBridge().openMediaFiles('all');

    expect(
      selections?.map(({ name, mimeType }) => ({ name, mimeType }))
    ).toEqual([
      { name: 'scan.TIF', mimeType: 'image/tiff' },
      { name: 'photo.TIFF', mimeType: 'image/tiff' },
      { name: 'clip.WEBM', mimeType: 'video/webm' },
    ]);
  });
});
