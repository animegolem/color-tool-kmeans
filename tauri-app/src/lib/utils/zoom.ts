import type { ZoomContent } from '../stores/ui';

type OpenZoomFn = (content: ZoomContent) => void;

export function openImageZoom(
  src: string | null | undefined,
  alt: string,
  openZoomOverlay: OpenZoomFn
) {
  if (!src) return;
  openZoomOverlay({ kind: 'image', src, alt });
}

export function openSvgZoom(
  svg: string | undefined,
  width: number | undefined,
  height: number | undefined,
  openZoomOverlay: OpenZoomFn
) {
  if (!svg || !width || !height) return;
  openZoomOverlay({ kind: 'svg', svg, width, height });
}

export function handleZoomKeydown(
  event: KeyboardEvent,
  svg: string | undefined,
  width: number | undefined,
  height: number | undefined,
  openZoomOverlay: OpenZoomFn
) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  openSvgZoom(svg, width, height, openZoomOverlay);
}
