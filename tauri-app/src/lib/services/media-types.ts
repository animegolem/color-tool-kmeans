export const IMAGE_EXTENSIONS = [
  'png',
  'jpg',
  'jpeg',
  'webp',
  'bmp',
  'gif',
  'tif',
  'tiff',
] as const;

export const VIDEO_EXTENSIONS = ['mp4', 'mov', 'webm'] as const;

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
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
};

const CANONICAL_EXTENSION_BY_MIME: Readonly<Record<string, string>> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
  'image/gif': 'gif',
  'image/tiff': 'tif',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

function extensionFromName(name: string): string | null {
  return name.match(/\.([^.\\/]+)$/)?.[1]?.toLowerCase() ?? null;
}

export function inferMimeType(name: string): string {
  const extension = extensionFromName(name);
  return extension
    ? (MIME_BY_EXTENSION[extension] ?? 'application/octet-stream')
    : 'application/octet-stream';
}

export function canonicalExtensionForMimeType(mimeType: string): string | null {
  return CANONICAL_EXTENSION_BY_MIME[mimeType.toLowerCase()] ?? null;
}

export function canonicalImageExtension(name: string): string {
  const mimeType = inferMimeType(name);
  if (!mimeType.startsWith('image/')) return 'png';
  return canonicalExtensionForMimeType(mimeType) ?? 'png';
}

export function hasVideoExtension(name: string): boolean {
  return inferMimeType(name).startsWith('video/');
}
