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
  levels: number;
  background?: string;
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
    levels,
    background = '#f8f2e3'
  } = input;

  const tileWidth = Math.max(1, neutralWidth);
  const tileHeight = Math.max(1, neutralHeight);
  const scale = Math.max(1, tileWidth / 280);
  const margin = Math.round(32 * scale);
  const previewGap = Math.round(24 * scale);
  const sectionGap = Math.round(24 * scale);
  const labelGap = Math.round(10 * scale);
  const fontSmall = Math.round(12 * scale);
  const fontMedium = Math.round(14 * scale);

  const previewScale = previewWidth > 0 ? tileWidth / previewWidth : 1;
  const previewDisplayWidth = tileWidth;
  const previewDisplayHeight = Math.round(previewHeight * previewScale);

  const topPairWidth = tileWidth * 2 + previewGap;
  const contentWidth = topPairWidth;
  const totalWidth = contentWidth + margin * 2;

  const topPairX = margin + (contentWidth - topPairWidth) / 2;
  const topPairY = margin;
  const topLabelY = topPairY;
  const topImageY = topLabelY + fontSmall + labelGap;

  const rangeY = topImageY + tileHeight + sectionGap;
  const rangeWidth = topPairWidth;
  const rangeX = margin + (contentWidth - rangeWidth) / 2;
  const rangeLabelY = rangeY;
  const rangeTrackY = rangeLabelY + fontMedium + labelGap;
  const rangeTrackHeight = Math.round(18 * scale);
  const rangeMetaY = rangeTrackY + rangeTrackHeight + labelGap;

  const bucketY = rangeMetaY + fontSmall + sectionGap;
  const bucketLabelY = bucketY;
  const bucketStripY = bucketLabelY + fontMedium + labelGap;
  const bucketStripHeight = Math.round(48 * scale);

  const notanLabelY = bucketStripY + bucketStripHeight + sectionGap;
  const notanImageY = notanLabelY + fontMedium + labelGap;

  const totalHeight = notanImageY + previewDisplayHeight + margin;

  const [originalData, neutralData, previewData] = await Promise.all([
    toDataUrl(originalSrc),
    toDataUrl(neutralSrc),
    toDataUrl(previewSrc)
  ]);

  const content: string[] = [];
  content.push(svgRect({ x: 0, y: 0, width: totalWidth, height: totalHeight, fill: background }));

  content.push(
    svgText(
      {
        x: topPairX + tileWidth / 2,
        y: topLabelY,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'letter-spacing': 1.2,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      'ORIGINAL'
    )
  );
  content.push(
    svgText(
      {
        x: topPairX + tileWidth + previewGap + tileWidth / 2,
        y: topLabelY,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'letter-spacing': 1.2,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      'NEUTRAL VALUES'
    )
  );

  content.push(
    svgImage({
      href: originalData,
      x: topPairX,
      y: topImageY,
      width: tileWidth,
      height: tileHeight
    })
  );
  content.push(
    svgImage({
      href: neutralData,
      x: topPairX + tileWidth + previewGap,
      y: topImageY,
      width: tileWidth,
      height: tileHeight
    })
  );

  content.push(
    svgText(
      {
        x: rangeX,
        y: rangeLabelY,
        fill: 'rgba(33,33,32,0.9)',
        'font-family': FONT_FAMILY,
        'font-size': fontMedium,
        'font-weight': 600,
        'text-anchor': 'start',
        'dominant-baseline': 'hanging'
      },
      'Values Track'
    )
  );

  const rangeLabel = `${keyLabel(p10, p90)} / ${contrastLabel(p10, p90)}`;
  content.push(
    svgText(
      {
        x: rangeX + rangeWidth,
        y: rangeLabelY,
        fill: 'rgba(33,33,32,0.6)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'text-anchor': 'end',
        'dominant-baseline': 'hanging'
      },
      rangeLabel
    )
  );

  content.push(
    svgRect({
      x: rangeX,
      y: rangeTrackY,
      width: rangeWidth,
      height: rangeTrackHeight,
      fill: '#2d2c2a',
      rx: rangeTrackHeight / 2
    })
  );

  const safeP10 = clamp01(p10);
  const safeP90 = clamp01(p90);
  const safeP01 = clamp01(p01);
  const safeP99 = clamp01(p99);
  const stepColors = [
    '#2d2c2a',
    '#474641',
    '#61605a',
    '#7a776f',
    '#949089',
    '#aea99f',
    '#c7c2b7',
    '#dfd9cd',
    '#f2ece0',
    '#f8f2e3'
  ];
  const stepWidth = rangeWidth / stepColors.length;
  for (let i = 0; i < stepColors.length; i += 1) {
    content.push(
      svgRect({
        x: rangeX + stepWidth * i,
        y: rangeTrackY,
        width: stepWidth,
        height: rangeTrackHeight,
        fill: stepColors[i],
        rx: rangeTrackHeight / 2
      })
    );
  }

  const whiskerStart = rangeX + rangeWidth * safeP01;
  const whiskerSpan = Math.max(0, rangeWidth * (safeP99 - safeP01));
  content.push(
    svgRect({
      x: whiskerStart,
      y: rangeTrackY + 2,
      width: whiskerSpan,
      height: Math.max(1, Math.round(2 * scale)),
      fill: 'rgba(33,33,32,0.55)',
      rx: Math.round(2 * scale)
    })
  );

  const coreStart = rangeX + rangeWidth * safeP10;
  const coreSpan = Math.max(0, rangeWidth * (safeP90 - safeP10));
  content.push(
    svgRect({
      x: coreStart,
      y: rangeTrackY + 2,
      width: coreSpan,
      height: rangeTrackHeight - 4,
      fill: 'rgba(248,242,227,0.2)',
      stroke: 'rgba(33,33,32,0.75)',
      'stroke-width': Math.max(1, Math.round(2 * scale)),
      rx: rangeTrackHeight / 2
    })
  );

  content.push(
    svgRect({
      x: rangeX,
      y: rangeTrackY,
      width: rangeWidth,
      height: rangeTrackHeight,
      fill: 'none',
      stroke: 'rgba(33,33,32,0.18)',
      'stroke-width': Math.max(1, Math.round(1 * scale)),
      rx: rangeTrackHeight / 2
    })
  );

  content.push(
    svgText(
      {
        x: rangeX,
        y: rangeMetaY,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'text-anchor': 'start',
        'dominant-baseline': 'hanging'
      },
      `Mass range ${formatPercent(safeP10)}-${formatPercent(safeP90)}`
    )
  );
  content.push(
    svgText(
      {
        x: rangeX + rangeWidth,
        y: rangeMetaY,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'text-anchor': 'end',
        'dominant-baseline': 'hanging'
      },
      `Extremes ${formatPercent(safeP01)}-${formatPercent(safeP99)}`
    )
  );

  content.push(
    svgText(
      {
        x: rangeX,
        y: bucketLabelY,
        fill: 'rgba(33,33,32,0.9)',
        'font-family': FONT_FAMILY,
        'font-size': fontMedium,
        'font-weight': 600,
        'text-anchor': 'start',
        'dominant-baseline': 'hanging'
      },
      'Value Buckets'
    )
  );
  content.push(
    svgText(
      {
        x: rangeX + rangeWidth,
        y: bucketLabelY,
        fill: 'rgba(33,33,32,0.6)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'text-anchor': 'end',
        'dominant-baseline': 'hanging'
      },
      `Levels ${levels}`
    )
  );

  const bucketTotal = counts.length ? counts.reduce((sum, count) => sum + count, 0) : 0;
  let cursor = rangeX;
  bucketValues.forEach((value, idx) => {
    const count = counts[idx] ?? 0;
    const share = bucketTotal > 0 ? count / bucketTotal : 1 / bucketValues.length;
    const width =
      idx === bucketValues.length - 1
        ? rangeX + rangeWidth - cursor
        : Math.max(1, rangeWidth * share);
    const fill = grayFill(value);
    content.push(
      svgRect({
        x: cursor,
        y: bucketStripY,
        width,
        height: bucketStripHeight,
        fill
      })
    );
    if (width >= 42 * scale) {
      content.push(
        svgText(
          {
            x: cursor + width / 2,
            y: bucketStripY + bucketStripHeight / 2,
            fill: bucketTextColor(value),
            'font-family': FONT_FAMILY,
            'font-size': fontSmall,
            'font-weight': 600,
            'text-anchor': 'middle',
            'dominant-baseline': 'middle'
          },
          formatPercent(share)
        )
      );
    }
    cursor += width;
  });

  content.push(
    svgRect({
      x: rangeX,
      y: bucketStripY,
      width: rangeWidth,
      height: bucketStripHeight,
      fill: 'none',
      stroke: 'rgba(33,33,32,0.18)',
      'stroke-width': Math.max(1, Math.round(1 * scale))
    })
  );

  content.push(
    svgText(
      {
        x: rangeX,
        y: notanLabelY,
        fill: 'rgba(33,33,32,0.9)',
        'font-family': FONT_FAMILY,
        'font-size': fontMedium,
        'font-weight': 600,
        'text-anchor': 'start',
        'dominant-baseline': 'hanging'
      },
      'Simplified Preview'
    )
  );
  content.push(
    svgImage({
      href: previewData,
      x: rangeX,
      y: notanImageY,
      width: previewDisplayWidth,
      height: previewDisplayHeight
    })
  );

  return {
    svg: svgDocument({ width: totalWidth, height: totalHeight, content: content.join('') }),
    width: totalWidth,
    height: totalHeight
  };
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function keyLabel(p10: number, p90: number) {
  const mid = (p10 + p90) * 0.5;
  if (mid <= 0.38) return 'Low key';
  if (mid >= 0.62) return 'High key';
  return 'Mid key';
}

function contrastLabel(p10: number, p90: number) {
  const range = p90 - p10;
  if (range >= 0.75) return 'Full range';
  if (range >= 0.6) return 'High contrast';
  if (range >= 0.4) return 'Medium contrast';
  return 'Low contrast';
}

function grayFill(value: number) {
  const shade = Math.round(clamp01(value) * 255);
  return `rgb(${shade},${shade},${shade})`;
}

function bucketTextColor(value: number) {
  return value <= 0.52 ? 'rgba(248,242,227,0.9)' : 'rgba(33,33,32,0.85)';
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function svgImage({
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

function serializeAttrs(attrs: Record<string, string | number>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}=\"${escapeAttr(String(value))}\"`)
    .join(' ');
}

function escapeAttr(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/\"/g, '&quot;');
}

async function toDataUrl(src: string): Promise<string> {
  if (!src) {
    throw new Error('Missing image source for export.');
  }
  if (src.startsWith('data:')) {
    return src;
  }
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('Failed to load image for export.');
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
}
