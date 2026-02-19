import { svgDocument, svgRect, svgText } from './svg';

export interface ValueAnalysisExportInput {
  originalSrc: string;
  neutralSrc: string;
  previewSrc: string;
  neutralWidth: number;
  neutralHeight: number;
  previewWidth: number;
  previewHeight: number;
  p10: number;
  p90: number;
  p01: number;
  p99: number;
  bucketValues: number[];
  boundaries: number[];
  counts: number[];
  histogramBins: number[];
  levels: number;
  background?: string;
  includeNeutral?: boolean;
  includeOriginal?: boolean;
  includeRangeFinder?: boolean;
  includeHistogram?: boolean;
  includeSimplified?: boolean;
}

export interface ValueAnalysisExportResult {
  svg: string;
  width: number;
  height: number;
}

const FONT_FAMILY = 'Fira Sans';

// Fixed logical canvas — layout is independent of input image resolution.
// Constants are CSS values ÷ 0.552 (compositor col1 scale factor) so that
// after the compositor scales the 1200px SVG into its ~662px col1 slot,
// elements render at their CSS-equivalent sizes.
const CANVAS_WIDTH = 1200;
const MARGIN = 58;
const CONTENT_WIDTH = CANVAS_WIDTH - 2 * MARGIN;
const PREVIEW_GAP = 44;
const SECTION_GAP = 44;
const LABEL_GAP = 18;
const FONT_SMALL = 22;
const FONT_TINY = 20;
const RANGE_TRACK_HEIGHT = 80;
const RANGE_SCALE_GAP = 8;
const HISTOGRAM_HEIGHT = 80;
const BUCKET_STRIP_HEIGHT = 66;
const BUCKET_STRIP_GAP = 4;
const BUCKET_STRIP_RADIUS = 22;
const NOTAN_GAP = 16;

let _idCounter = 0;

export async function generateValueAnalysisSvg(
  input: ValueAnalysisExportInput
): Promise<ValueAnalysisExportResult> {
  const {
    originalSrc,
    neutralSrc,
    previewSrc,
    neutralWidth,
    neutralHeight,
    previewWidth,
    previewHeight,
    p10,
    p90,
    p01,
    p99,
    bucketValues,
    counts,
    histogramBins,
    background = '#f8f2e3',
    includeNeutral = true,
    includeOriginal = true,
    includeRangeFinder = true,
    includeHistogram = true,
    includeSimplified = true
  } = input;

  const idSuffix = _idCounter++;

  // Image display dimensions from aspect ratio
  const aspectNeutral = neutralWidth > 0 && neutralHeight > 0 ? neutralHeight / neutralWidth : 1;
  const aspectPreview = previewWidth > 0 && previewHeight > 0 ? previewHeight / previewWidth : 1;

  const tileDisplayWidth = includeOriginal
    ? (CONTENT_WIDTH - PREVIEW_GAP) / 2
    : CONTENT_WIDTH;
  const tileDisplayHeight = Math.round(tileDisplayWidth * aspectNeutral);

  const previewDisplayWidth = CONTENT_WIDTH;
  const previewDisplayHeight = Math.round(previewDisplayWidth * aspectPreview);

  // --- Compute section heights and total ---
  const sectionHeights: number[] = [];
  if (includeNeutral) sectionHeights.push(tileDisplayHeight);
  if (includeRangeFinder) sectionHeights.push(RANGE_TRACK_HEIGHT + RANGE_SCALE_GAP + FONT_TINY + LABEL_GAP + FONT_SMALL);
  if (includeHistogram) sectionHeights.push(HISTOGRAM_HEIGHT);
  if (includeSimplified) sectionHeights.push(BUCKET_STRIP_HEIGHT + NOTAN_GAP + previewDisplayHeight);

  let totalHeight = MARGIN * 2;
  for (let i = 0; i < sectionHeights.length; i++) {
    totalHeight += sectionHeights[i];
    if (i < sectionHeights.length - 1) totalHeight += SECTION_GAP;
  }

  // Load only needed image data
  const imageLoads: Promise<string>[] = [];
  const imageKeys: string[] = [];
  if (includeNeutral && includeOriginal) {
    imageKeys.push('original');
    imageLoads.push(toDataUrl(originalSrc));
  }
  if (includeNeutral) {
    imageKeys.push('neutral');
    imageLoads.push(toDataUrl(neutralSrc));
  }
  if (includeSimplified) {
    imageKeys.push('preview');
    imageLoads.push(toDataUrl(previewSrc));
  }
  const loadedImages = await Promise.all(imageLoads);
  const imageData: Record<string, string> = {};
  imageKeys.forEach((key, i) => { imageData[key] = loadedImages[i]; });

  const content: string[] = [];
  content.push(svgRect({ x: 0, y: 0, width: CANVAS_WIDTH, height: totalHeight, fill: background }));

  let cursorY = MARGIN;

  // --- Section 1: Image pair ---
  if (includeNeutral) {
    if (includeOriginal) {
      content.push(
        svgImage({ href: imageData.original, x: MARGIN, y: cursorY, width: tileDisplayWidth, height: tileDisplayHeight })
      );
      content.push(
        svgImage({ href: imageData.neutral, x: MARGIN + tileDisplayWidth + PREVIEW_GAP, y: cursorY, width: tileDisplayWidth, height: tileDisplayHeight })
      );
    } else {
      content.push(
        svgImage({ href: imageData.neutral, x: MARGIN, y: cursorY, width: tileDisplayWidth, height: tileDisplayHeight })
      );
    }
    cursorY += tileDisplayHeight + SECTION_GAP;
  }

  // --- Section 2: Range finder ---
  if (includeRangeFinder) {
    const rangeTrackY = cursorY;
    const gradientId = `range-gradient-${idSuffix}`;
    content.push(
      `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0%" stop-color="#2a2926" />` +
      `<stop offset="100%" stop-color="#f8f2e3" />` +
      `</linearGradient></defs>`
    );
    content.push(
      svgRect({
        x: MARGIN, y: rangeTrackY, width: CONTENT_WIDTH, height: RANGE_TRACK_HEIGHT,
        fill: `url(#${gradientId})`, rx: RANGE_TRACK_HEIGHT / 2
      })
    );

    const safeP10 = clamp01(p10);
    const safeP90 = clamp01(p90);
    const safeP01 = clamp01(p01);
    const safeP99 = clamp01(p99);

    // Extension overlay (p01-p99)
    const extInset = 11;
    const extHeight = RANGE_TRACK_HEIGHT - extInset * 2;
    content.push(
      svgRect({
        x: MARGIN + CONTENT_WIDTH * safeP01, y: rangeTrackY + extInset,
        width: Math.max(0, CONTENT_WIDTH * (safeP99 - safeP01)), height: extHeight,
        fill: 'rgba(33,33,32,0.1)', rx: extHeight / 2
      })
    );

    // Core overlay (p10-p90)
    const coreInset = 18;
    const coreHeight = RANGE_TRACK_HEIGHT - coreInset * 2;
    content.push(
      svgRect({
        x: MARGIN + CONTENT_WIDTH * safeP10, y: rangeTrackY + coreInset,
        width: Math.max(0, CONTENT_WIDTH * (safeP90 - safeP10)), height: coreHeight,
        fill: 'rgba(33,33,32,0.22)', rx: coreHeight / 2
      })
    );

    // Outline overlay (p01-p99)
    const outInset = 7;
    const outHeight = RANGE_TRACK_HEIGHT - outInset * 2;
    content.push(
      svgRect({
        x: MARGIN + CONTENT_WIDTH * safeP01, y: rangeTrackY + outInset,
        width: Math.max(0, CONTENT_WIDTH * (safeP99 - safeP01)), height: outHeight,
        fill: 'none', stroke: 'rgba(33,33,32,0.75)',
        'stroke-width': 4, rx: outHeight / 2
      })
    );

    // Scale labels
    const rangeScaleLabelY = rangeTrackY + RANGE_TRACK_HEIGHT + RANGE_SCALE_GAP;
    content.push(
      svgText(
        { x: MARGIN, y: rangeScaleLabelY, fill: 'rgba(33,33,32,0.5)', 'font-family': FONT_FAMILY, 'font-size': FONT_TINY, 'text-anchor': 'start', 'dominant-baseline': 'hanging' },
        '0'
      )
    );
    content.push(
      svgText(
        { x: MARGIN + CONTENT_WIDTH, y: rangeScaleLabelY, fill: 'rgba(33,33,32,0.5)', 'font-family': FONT_FAMILY, 'font-size': FONT_TINY, 'text-anchor': 'end', 'dominant-baseline': 'hanging' },
        '100'
      )
    );

    // Metadata
    const rangeMetaY = rangeScaleLabelY + FONT_TINY + LABEL_GAP;
    content.push(
      svgText(
        { x: MARGIN, y: rangeMetaY, fill: 'rgba(33,33,32,0.7)', 'font-family': FONT_FAMILY, 'font-size': FONT_SMALL, 'text-anchor': 'start', 'dominant-baseline': 'hanging' },
        `Mass range ${formatPercent(safeP10)}-${formatPercent(safeP90)}`
      )
    );
    content.push(
      svgText(
        { x: MARGIN + CONTENT_WIDTH / 2, y: rangeMetaY, fill: 'rgba(33,33,32,0.7)', 'font-family': FONT_FAMILY, 'font-size': FONT_SMALL, 'font-weight': 600, 'text-anchor': 'middle', 'dominant-baseline': 'hanging' },
        `${keyLabel(safeP10, safeP90)} · ${contrastLabel(safeP10, safeP90)}`
      )
    );
    content.push(
      svgText(
        { x: MARGIN + CONTENT_WIDTH, y: rangeMetaY, fill: 'rgba(33,33,32,0.7)', 'font-family': FONT_FAMILY, 'font-size': FONT_SMALL, 'text-anchor': 'end', 'dominant-baseline': 'hanging' },
        `Extremes ${formatPercent(safeP01)}-${formatPercent(safeP99)}`
      )
    );

    cursorY += RANGE_TRACK_HEIGHT + RANGE_SCALE_GAP + FONT_TINY + LABEL_GAP + FONT_SMALL + SECTION_GAP;
  }

  // --- Section 3: Values Histogram ---
  if (includeHistogram && histogramBins.length > 0) {
    const histBinCount = histogramBins.length || 16;
    const histBarGap = 4;
    const histBarWidth = (CONTENT_WIDTH - histBarGap * (histBinCount - 1)) / histBinCount;
    const maxBin = Math.max(...histogramBins, 1);
    for (let i = 0; i < histogramBins.length; i++) {
      const binCount = histogramBins[i];
      const heightPct = binCount / maxBin;
      const barH = Math.max(1, Math.round(HISTOGRAM_HEIGHT * heightPct));
      const barX = MARGIN + i * (histBarWidth + histBarGap);
      const barY = cursorY + HISTOGRAM_HEIGHT - barH;
      const fill = grayFill(i / (histogramBins.length - 1));
      content.push(
        svgRect({
          x: barX, y: barY,
          width: Math.max(1, Math.round(histBarWidth)), height: barH,
          fill, rx: 4
        })
      );
    }
    cursorY += HISTOGRAM_HEIGHT + SECTION_GAP;
  }

  // --- Section 4: Bucket strip + notan preview ---
  if (includeSimplified) {
    const bucketX = MARGIN;
    const bucketW = CONTENT_WIDTH;

    // Rounded container background
    content.push(
      svgRect({
        x: bucketX, y: cursorY, width: bucketW, height: BUCKET_STRIP_HEIGHT,
        fill: 'rgba(33,33,32,0.08)', stroke: 'rgba(33,33,32,0.16)',
        'stroke-width': 2, rx: BUCKET_STRIP_RADIUS
      })
    );

    // ClipPath for bucket strip rounded corners
    const bucketClipId = `value-bucket-clip-${idSuffix}`;
    content.push(
      `<defs><clipPath id="${bucketClipId}">` +
      `<path d="${roundedRectPath(bucketX, cursorY, bucketW, BUCKET_STRIP_HEIGHT, BUCKET_STRIP_RADIUS)}" />` +
      `</clipPath></defs>`
    );

    // Proportional bucket segments inside clip group
    const bucketTotal = counts.length ? counts.reduce((sum, count) => sum + count, 0) : 0;
    const bucketCount = bucketValues.length;
    const totalGapWidth = BUCKET_STRIP_GAP * (bucketCount > 1 ? bucketCount - 1 : 0);
    const bucketInnerWidth = bucketW - totalGapWidth;
    const bucketLabels: string[] = [];
    content.push(`<g clip-path="url(#${bucketClipId})">`);
    let segCursor = bucketX;
    bucketValues.forEach((value, idx) => {
      const count = counts[idx] ?? 0;
      const share = bucketTotal > 0 ? count / bucketTotal : 1 / bucketCount;
      const segWidth = idx === bucketCount - 1
        ? bucketX + bucketW - segCursor
        : Math.max(1, bucketInnerWidth * share);
      const fill = grayFill(value);
      content.push(svgRect({ x: segCursor, y: cursorY, width: segWidth, height: BUCKET_STRIP_HEIGHT, fill }));
      if (segWidth >= 76) {
        bucketLabels.push(
          svgText(
            {
              x: segCursor + segWidth / 2, y: cursorY + BUCKET_STRIP_HEIGHT / 2,
              fill: bucketTextColor(value), 'font-family': FONT_FAMILY, 'font-size': FONT_SMALL,
              'font-weight': 600, 'text-anchor': 'middle', 'dominant-baseline': 'middle'
            },
            formatPercent(share)
          )
        );
      }
      segCursor += segWidth + BUCKET_STRIP_GAP;
    });
    content.push('</g>');
    // Text labels outside clip group to prevent clipping
    content.push(...bucketLabels);

    // Notan preview image
    const notanImageY = cursorY + BUCKET_STRIP_HEIGHT + NOTAN_GAP;
    content.push(
      svgImage({ href: imageData.preview, x: MARGIN, y: notanImageY, width: previewDisplayWidth, height: previewDisplayHeight })
    );
  }

  return {
    svg: svgDocument({ width: CANVAS_WIDTH, height: totalHeight, content: content.join('') }),
    width: CANVAS_WIDTH,
    height: totalHeight
  };
}

export function keyLabel(p10: number, p90: number): string {
  const mid = (p10 + p90) * 0.5;
  if (mid <= 0.38) return 'Low key';
  if (mid >= 0.62) return 'High key';
  return 'Mid key';
}

export function contrastLabel(p10: number, p90: number): string {
  const range = p90 - p10;
  if (range >= 0.75) return 'Full range';
  if (range >= 0.6) return 'High contrast';
  if (range >= 0.4) return 'Medium contrast';
  return 'Low contrast';
}

export function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}


export function grayFill(value: number) {
  const shade = Math.round(clamp01(value) * 255);
  return `rgb(${shade},${shade},${shade})`;
}

export function bucketTextColor(value: number) {
  return value <= 0.52 ? 'rgba(248,242,227,0.9)' : 'rgba(33,33,32,0.85)';
}

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function roundedRectPath(
  x: number, y: number, w: number, h: number, rx: number
): string {
  const r = Math.min(rx, w / 2, h / 2);
  let d = `M ${x + r} ${y}`;
  d += ` H ${x + w - r}`;
  d += ` A ${r} ${r} 0 0 1 ${x + w} ${y + r}`;
  d += ` V ${y + h - r}`;
  d += ` A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`;
  d += ` H ${x + r}`;
  d += ` A ${r} ${r} 0 0 1 ${x} ${y + h - r}`;
  d += ` V ${y + r}`;
  d += ` A ${r} ${r} 0 0 1 ${x + r} ${y}`;
  d += ' Z';
  return d;
}

export function svgImage({
  href,
  x,
  y,
  width,
  height
}: {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
}): string {
  return `<image ${serializeAttrs({
    href,
    'xlink:href': href,
    x,
    y,
    width,
    height,
    preserveAspectRatio: 'xMidYMid meet'
  })} />`;
}

export function serializeAttrs(attrs: Record<string, string | number>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}=\"${escapeAttr(String(value))}\"`)
    .join(' ');
}

export function escapeAttr(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/\"/g, '&quot;');
}

export async function toDataUrl(src: string): Promise<string> {
  if (!src) {
    throw new Error('Missing image source for export.');
  }
  if (src.startsWith('data:')) {
    return src;
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context for image export.'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image for export.'));
    img.src = src;
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
}
