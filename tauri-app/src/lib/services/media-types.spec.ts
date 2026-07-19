import { describe, expect, it } from 'vitest';
import {
  IMAGE_EXTENSIONS,
  VIDEO_EXTENSIONS,
  canonicalExtensionForMimeType,
  canonicalImageExtension,
  hasVideoExtension,
  inferMimeType,
} from './media-types';

describe('media type registry', () => {
  it('SWEEP-009 keeps picker extensions and MIME inference in one table', () => {
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

    const expectedMimes = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
      bmp: 'image/bmp',
      gif: 'image/gif',
      tif: 'image/tiff',
      tiff: 'image/tiff',
      mp4: 'video/mp4',
      mov: 'video/quicktime',
      webm: 'video/webm',
    } as const;

    for (const extension of [...IMAGE_EXTENSIONS, ...VIDEO_EXTENSIONS]) {
      expect(inferMimeType(`sample.${extension.toUpperCase()}`)).toBe(
        expectedMimes[extension]
      );
    }
  });

  it('SWEEP-009 normalizes aliases and identifies video extensions', () => {
    expect(canonicalImageExtension('scan.tiff')).toBe('tif');
    expect(canonicalImageExtension('portrait.jpeg')).toBe('jpg');
    expect(canonicalImageExtension('unknown.raw')).toBe('png');
    expect(canonicalExtensionForMimeType('IMAGE/TIFF')).toBe('tif');
    expect(hasVideoExtension('clip.WEBM')).toBe(true);
    expect(hasVideoExtension('still.webp')).toBe(false);
  });
});
