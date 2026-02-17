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

  const tileWidth = Math.max(1, neutralWidth);
  const tileHeight = Math.max(1, neutralHeight);
  const scale = Math.max(1, tileWidth / 280);
  const margin = Math.round(32 * scale);
  const previewGap = Math.round(24 * scale);
  const sectionGap = Math.round(24 * scale);
  const labelGap = Math.round(10 * scale);
  const fontSmall = Math.round(12 * scale);
  const fontTiny = Math.round(11 * scale);

  const previewScale = previewWidth > 0 ? tileWidth / previewWidth : 1;
  const previewDisplayWidth = tileWidth;
  const previewDisplayHeight = Math.round(previewHeight * previewScale);

  const topPairWidth = tileWidth * 2 + previewGap;
  const contentWidth = topPairWidth;
  const totalWidth = contentWidth + margin * 2;
  const rangeWidth = topPairWidth;
  const rangeX = margin + (contentWidth - rangeWidth) / 2;
  const topPairX = margin + (contentWidth - topPairWidth) / 2;

  // --- Shared dimension constants ---
  const rangeTrackHeight = Math.round(44 * scale);
  const rangeScaleGap = Math.round(4 * scale);
  const histogramHeight = Math.round(48 * scale);
  const bucketStripHeight = Math.round(36 * scale);
  const bucketStripGap = Math.round(2 * scale);
  const bucketStripRadius = Math.round(12 * scale);
  const notanGap = Math.round(8 * scale);

  // --- Compute section heights and cursor positions ---
  const sectionHeights: number[] = [];
  if (includeNeutral) sectionHeights.push(tileHeight);
  if (includeRangeFinder) sectionHeights.push(rangeTrackHeight + rangeScaleGap + fontTiny + labelGap + fontSmall);
  if (includeHistogram) sectionHeights.push(histogramHeight);
  if (includeSimplified) sectionHeights.push(bucketStripHeight + notanGap + previewDisplayHeight);

  let totalHeight = margin * 2;
  for (let i = 0; i < sectionHeights.length; i++) {
    totalHeight += sectionHeights[i];
    if (i < sectionHeights.length - 1) totalHeight += sectionGap;
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
  content.push(svgRect({ x: 0, y: 0, width: totalWidth, height: totalHeight, fill: background }));

  let cursorY = margin;

  // --- Section 1: Image pair ---
  if (includeNeutral) {
    if (includeOriginal) {
      content.push(
        svgImage({ href: imageData.original, x: topPairX, y: cursorY, width: tileWidth, height: tileHeight })
      );
      content.push(
        svgImage({ href: imageData.neutral, x: topPairX + tileWidth + previewGap, y: cursorY, width: tileWidth, height: tileHeight })
      );
    } else {
      content.push(
        svgImage({ href: imageData.neutral, x: topPairX, y: cursorY, width: tileWidth, height: tileHeight })
      );
    }
    cursorY += tileHeight + sectionGap;
  }

  // --- Section 2: Range finder ---
  if (includeRangeFinder) {
    const rangeTrackY = cursorY;
    const gradientId = 'range-gradient';
    content.push(
      `<defs><linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0%" stop-color="#2a2926" />` +
      `<stop offset="100%" stop-color="#f8f2e3" />` +
      `</linearGradient></defs>`
    );
    content.push(
      svgRect({
        x: rangeX, y: rangeTrackY, width: rangeWidth, height: rangeTrackHeight,
        fill: `url(#${gradientId})`, rx: rangeTrackHeight / 2
      })
    );

    const safeP10 = clamp01(p10);
    const safeP90 = clamp01(p90);
    const safeP01 = clamp01(p01);
    const safeP99 = clamp01(p99);

    // Extension overlay (p01-p99)
    const extInset = Math.round(6 * scale);
    const extHeight = rangeTrackHeight - extInset * 2;
    content.push(
      svgRect({
        x: rangeX + rangeWidth * safeP01, y: rangeTrackY + extInset,
        width: Math.max(0, rangeWidth * (safeP99 - safeP01)), height: extHeight,
        fill: 'rgba(33,33,32,0.1)', rx: extHeight / 2
      })
    );

    // Core overlay (p10-p90)
    const coreInset = Math.round(10 * scale);
    const coreHeight = rangeTrackHeight - coreInset * 2;
    content.push(
      svgRect({
        x: rangeX + rangeWidth * safeP10, y: rangeTrackY + coreInset,
        width: Math.max(0, rangeWidth * (safeP90 - safeP10)), height: coreHeight,
        fill: 'rgba(33,33,32,0.22)', rx: coreHeight / 2
      })
    );

    // Outline overlay (p01-p99)
    const outInset = Math.round(4 * scale);
    const outHeight = rangeTrackHeight - outInset * 2;
    content.push(
      svgRect({
        x: rangeX + rangeWidth * safeP01, y: rangeTrackY + outInset,
        width: Math.max(0, rangeWidth * (safeP99 - safeP01)), height: outHeight,
        fill: 'none', stroke: 'rgba(33,33,32,0.75)',
        'stroke-width': Math.max(1, Math.round(2 * scale)), rx: outHeight / 2
      })
    );

    // Scale labels
    const rangeScaleLabelY = rangeTrackY + rangeTrackHeight + rangeScaleGap;
    content.push(
      svgText(
        { x: rangeX, y: rangeScaleLabelY, fill: 'rgba(33,33,32,0.5)', 'font-family': FONT_FAMILY, 'font-size': fontTiny, 'text-anchor': 'start', 'dominant-baseline': 'hanging' },
        '0'
      )
    );
    content.push(
      svgText(
        { x: rangeX + rangeWidth, y: rangeScaleLabelY, fill: 'rgba(33,33,32,0.5)', 'font-family': FONT_FAMILY, 'font-size': fontTiny, 'text-anchor': 'end', 'dominant-baseline': 'hanging' },
        '100'
      )
    );

    // Metadata
    const rangeMetaY = rangeScaleLabelY + fontTiny + labelGap;
    content.push(
      svgText(
        { x: rangeX, y: rangeMetaY, fill: 'rgba(33,33,32,0.7)', 'font-family': FONT_FAMILY, 'font-size': fontSmall, 'text-anchor': 'start', 'dominant-baseline': 'hanging' },
        `Mass range ${formatPercent(safeP10)}-${formatPercent(safeP90)}`
      )
    );
    content.push(
      svgText(
        { x: rangeX + rangeWidth, y: rangeMetaY, fill: 'rgba(33,33,32,0.7)', 'font-family': FONT_FAMILY, 'font-size': fontSmall, 'text-anchor': 'end', 'dominant-baseline': 'hanging' },
        `Extremes ${formatPercent(safeP01)}-${formatPercent(safeP99)}`
      )
    );

    cursorY += rangeTrackHeight + rangeScaleGap + fontTiny + labelGap + fontSmall + sectionGap;
  }

  // --- Section 3: Values Histogram ---
  if (includeHistogram && histogramBins.length > 0) {
    const histBinCount = histogramBins.length || 16;
    const histBarGap = Math.round(2 * scale);
    const histBarWidth = (rangeWidth - histBarGap * (histBinCount - 1)) / histBinCount;
    const maxBin = Math.max(...histogramBins, 1);
    for (let i = 0; i < histogramBins.length; i++) {
      const binCount = histogramBins[i];
      const heightPct = binCount / maxBin;
      const barH = Math.max(1, Math.round(histogramHeight * heightPct));
      const barX = rangeX + i * (histBarWidth + histBarGap);
      const barY = cursorY + histogramHeight - barH;
      const fill = grayFill(i / (histogramBins.length - 1));
      content.push(
        svgRect({
          x: barX, y: barY,
          width: Math.max(1, Math.round(histBarWidth)), height: barH,
          fill, rx: Math.round(2 * scale)
        })
      );
    }
    cursorY += histogramHeight + sectionGap;
  }

  // --- Section 4: Bucket strip + notan preview ---
  if (includeSimplified) {
    const bucketX = rangeX;
    const bucketW = previewDisplayWidth;

    // ClipPath for rounded container edges
    const clipId = 'bucket-clip';
    content.push(
      `<defs><clipPath id="${clipId}">` +
      `<rect x="${bucketX}" y="${cursorY}" width="${bucketW}" height="${bucketStripHeight}" rx="${bucketStripRadius}" />` +
      `</clipPath></defs>`
    );

    // Rounded container background
    content.push(
      svgRect({
        x: bucketX, y: cursorY, width: bucketW, height: bucketStripHeight,
        fill: 'rgba(33,33,32,0.08)', stroke: 'rgba(33,33,32,0.16)',
        'stroke-width': Math.max(1, Math.round(1 * scale)), rx: bucketStripRadius
      })
    );

    // Individual bucket segments clipped by container shape (no rx)
    const bucketTotal = counts.length ? counts.reduce((sum, count) => sum + count, 0) : 0;
    const bucketCount = bucketValues.length;
    const totalGapWidth = bucketStripGap * (bucketCount > 1 ? bucketCount - 1 : 0);
    const bucketInnerWidth = bucketW - totalGapWidth;
    content.push(`<g clip-path="url(#${clipId})">`);
    let segCursor = bucketX;
    bucketValues.forEach((value, idx) => {
      const count = counts[idx] ?? 0;
      const share = bucketTotal > 0 ? count / bucketTotal : 1 / bucketCount;
      const segWidth = idx === bucketCount - 1
        ? bucketX + bucketW - segCursor
        : Math.max(1, bucketInnerWidth * share);
      const fill = grayFill(value);
      content.push(
        svgRect({ x: segCursor, y: cursorY, width: segWidth, height: bucketStripHeight, fill })
      );
      if (segWidth >= 42 * scale) {
        content.push(
          svgText(
            {
              x: segCursor + segWidth / 2, y: cursorY + bucketStripHeight / 2,
              fill: bucketTextColor(value), 'font-family': FONT_FAMILY, 'font-size': fontSmall,
              'font-weight': 600, 'text-anchor': 'middle', 'dominant-baseline': 'middle'
            },
            formatPercent(share)
          )
        );
      }
      segCursor += segWidth + bucketStripGap;
    });
    content.push('</g>');

    // Notan preview image
    const notanImageY = cursorY + bucketStripHeight + notanGap;
    content.push(
      svgImage({ href: imageData.preview, x: rangeX, y: notanImageY, width: previewDisplayWidth, height: previewDisplayHeight })
    );
  }

  return {
    svg: svgDocument({ width: totalWidth, height: totalHeight, content: content.join('') }),
    width: totalWidth,
    height: totalHeight
  };
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
