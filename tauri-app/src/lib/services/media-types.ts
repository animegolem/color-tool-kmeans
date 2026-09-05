type MediaKind = 'image' | 'video';

interface MediaTypeDefinition {
  readonly extensions: readonly string[];
  readonly mimeType: string;
  readonly canonicalExtension: string;
  readonly kind: MediaKind;
}

const MEDIA_TYPES: readonly MediaTypeDefinition[] = [
  {
    extensions: ['png'],
    mimeType: 'image/png',
    canonicalExtension: 'png',
    kind: 'image',
  },
  {
    extensions: ['jpg', 'jpeg'],
    mimeType: 'image/jpeg',
    canonicalExtension: 'jpg',
    kind: 'image',
  },
  {
    extensions: ['webp'],
    mimeType: 'image/webp',
    canonicalExtension: 'webp',
    kind: 'image',
  },
  {
    extensions: ['bmp'],
    mimeType: 'image/bmp',
    canonicalExtension: 'bmp',
    kind: 'image',
  },
  {
    extensions: ['gif'],
    mimeType: 'image/gif',
    canonicalExtension: 'gif',
    kind: 'image',
  },
  {
    extensions: ['tif', 'tiff'],
    mimeType: 'image/tiff',
    canonicalExtension: 'tif',
    kind: 'image',
  },
  {
    extensions: ['mp4'],
    mimeType: 'video/mp4',
    canonicalExtension: 'mp4',
    kind: 'video',
  },
  {
    extensions: ['mov'],
    mimeType: 'video/quicktime',
    canonicalExtension: 'mov',
    kind: 'video',
  },
  {
    extensions: ['webm'],
    mimeType: 'video/webm',
    canonicalExtension: 'webm',
    kind: 'video',
  },
];

export const IMAGE_EXTENSIONS = MEDIA_TYPES.filter(
  ({ kind }) => kind === 'image'
).flatMap(({ extensions }) => extensions);

export const VIDEO_EXTENSIONS = MEDIA_TYPES.filter(
  ({ kind }) => kind === 'video'
).flatMap(({ extensions }) => extensions);

const MIME_BY_EXTENSION = new Map(
  MEDIA_TYPES.flatMap(({ extensions, mimeType }) =>
    extensions.map((extension) => [extension, mimeType] as const)
  )
);

const CANONICAL_EXTENSION_BY_MIME = new Map(
  MEDIA_TYPES.map(
    ({ mimeType, canonicalExtension }) =>
      [mimeType, canonicalExtension] as const
  )
);

function extensionFromName(name: string): string | null {
  return name.match(/\.([^.\\/]+)$/)?.[1]?.toLowerCase() ?? null;
}

export function inferMimeType(name: string): string {
  const extension = extensionFromName(name);
  return extension
    ? (MIME_BY_EXTENSION.get(extension) ?? 'application/octet-stream')
    : 'application/octet-stream';
}

export function canonicalExtensionForMimeType(mimeType: string): string | null {
  return CANONICAL_EXTENSION_BY_MIME.get(mimeType.trim().toLowerCase()) ?? null;
}

export function canonicalImageExtension(name: string): string {
  const mimeType = inferMimeType(name);
  if (!mimeType.startsWith('image/')) return 'png';
  return canonicalExtensionForMimeType(mimeType) ?? 'png';
}

export function hasVideoExtension(name: string): boolean {
  return inferMimeType(name).startsWith('video/');
}
