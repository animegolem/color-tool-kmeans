import { canonicalExtensionForMimeType } from './media-types';

export function clipboardImageExtensionForMimeType(
  mimeType: string
): string | null {
  const normalized = mimeType.trim().toLowerCase();
  if (!normalized.startsWith('image/')) return null;
  return canonicalExtensionForMimeType(normalized);
}
