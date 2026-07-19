import { describe, expect, it } from 'vitest';
import { clipboardImageExtensionForMimeType } from './clipboard-image';

describe('clipboard image type handling', () => {
  it.each([
    ['image/png', 'png'],
    ['image/jpeg', 'jpg'],
    ['image/webp', 'webp'],
    ['image/bmp', 'bmp'],
    ['image/gif', 'gif'],
    ['image/tiff', 'tif'],
  ])('SWEEP-011 maps %s bytes to an honest .%s name', (mimeType, extension) => {
    expect(clipboardImageExtensionForMimeType(mimeType)).toBe(extension);
  });

  it.each(['', 'video/mp4', 'image/svg+xml', 'image/heic'])(
    'SWEEP-011 rejects unsupported clipboard MIME %j',
    (mimeType) => {
      expect(clipboardImageExtensionForMimeType(mimeType)).toBeNull();
    }
  );
});
