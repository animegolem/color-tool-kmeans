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
  centroids: number[];
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
    centroids,
    boundaries,
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
  const rulerWidth = Math.round(70 * scale);
  const rulerTrackWidth = Math.max(8, Math.round(10 * scale));

  const topPairWidth = tileWidth * 2 + previewGap;
  const analysisWidth = rulerWidth + previewGap + previewDisplayWidth;
  const contentWidth = Math.max(topPairWidth, analysisWidth);
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
  const rangeTrackHeight = Math.round(12 * scale);
  const rangeMetaY = rangeTrackY + rangeTrackHeight + labelGap;

  const analysisY = rangeMetaY + fontSmall + sectionGap;
  const analysisLabelY = analysisY;
  const analysisBodyY = analysisLabelY + fontMedium + labelGap;
  const analysisX = margin + (contentWidth - analysisWidth) / 2;

  const totalHeight = analysisBodyY + previewDisplayHeight + margin;

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
      'Value Range'
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
      fill: 'rgba(33,33,32,0.12)',
      rx: rangeTrackHeight / 2
    })
  );

  const safeP10 = clamp01(p10);
  const safeP90 = clamp01(p90);
  const rangeStart = rangeX + rangeWidth * safeP10;
  const rangeSpan = Math.max(0, rangeWidth * (safeP90 - safeP10));
  const stepWidth = rangeSpan / 5;
  const stepColors = ['#3a3936', '#5a5953', '#7a776f', '#9a968d', '#bab6ad'];
  for (let i = 0; i < 5; i += 1) {
    content.push(
      svgRect({
        x: rangeStart + stepWidth * i,
        y: rangeTrackY,
        width: stepWidth,
        height: rangeTrackHeight,
        fill: stepColors[i],
        rx: rangeTrackHeight / 2
      })
    );
  }

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
      `Shadows ${formatPercent(safeP10)}`
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
      `Highlights ${formatPercent(safeP90)}`
    )
  );

  content.push(
    svgText(
      {
        x: analysisX,
        y: analysisLabelY,
        fill: 'rgba(33,33,32,0.9)',
        'font-family': FONT_FAMILY,
        'font-size': fontMedium,
        'font-weight': 600,
        'text-anchor': 'start',
        'dominant-baseline': 'hanging'
      },
      'Value Masses'
    )
  );
  content.push(
    svgText(
      {
        x: analysisX + analysisWidth,
        y: analysisLabelY,
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

  const rulerX = analysisX;
  const rulerY = analysisBodyY;
  const trackX = rulerX + rulerWidth / 2;
  const trackY1 = rulerY;
  const trackY2 = rulerY + previewDisplayHeight;

  content.push(
    svgLine({
      x1: trackX,
      y1: trackY1,
      x2: trackX,
      y2: trackY2,
      stroke: 'rgba(33,33,32,0.2)',
      'stroke-width': rulerTrackWidth,
      'stroke-linecap': 'round'
    })
  );

  boundaries.forEach((boundary) => {
    const y = rulerY + (1 - boundary) * previewDisplayHeight;
    content.push(
      svgLine({
        x1: trackX - rulerWidth / 2 + 6 * scale,
        y1: y,
        x2: trackX + rulerWidth / 2 - 6 * scale,
        y2: y,
        stroke: 'rgba(33,33,32,0.5)',
        'stroke-width': Math.max(1, 2 * scale),
        'stroke-linecap': 'round'
      })
    );
  });

  const maxCount = counts.length ? Math.max(...counts) : 1;
  centroids.forEach((centroid, idx) => {
    const count = counts[idx] ?? 0;
    const size = markerSize(count, maxCount, scale);
    const y = rulerY + (1 - centroid) * previewDisplayHeight;
    content.push(
      svgPolygon({
        points: diamondPoints(trackX, y, size),
        fill: 'rgba(33,33,32,0.85)'
      })
    );
  });

  content.push(
    svgText(
      {
        x: trackX,
        y: rulerY - labelGap,
        fill: 'rgba(33,33,32,0.6)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'text-anchor': 'middle',
        'dominant-baseline': 'ideographic'
      },
      '100'
    )
  );
  content.push(
    svgText(
      {
        x: trackX,
        y: trackY2 + fontSmall + labelGap,
        fill: 'rgba(33,33,32,0.6)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      '0'
    )
  );

  const previewX = analysisX + rulerWidth + previewGap;
  content.push(
    svgText(
      {
        x: previewX + previewDisplayWidth / 2,
        y: analysisBodyY - labelGap - fontSmall,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'letter-spacing': 1.2,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      'RENDERED FRAME'
    )
  );
  content.push(
    svgImage({
      href: previewData,
      x: previewX,
      y: analysisBodyY,
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

function markerSize(count: number, maxCount: number, scale: number) {
  if (maxCount <= 0) return Math.round(8 * scale);
  const min = 6 * scale;
  const max = 14 * scale;
  const ratio = Math.min(1, count / maxCount);
  return Math.round(min + (max - min) * ratio);
}

function diamondPoints(x: number, y: number, size: number) {
  const half = size / 2;
  return `${x},${y - half} ${x + half},${y} ${x},${y + half} ${x - half},${y}`;
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

function svgLine(attrs: Record<string, string | number>): string {
  return `<line ${serializeAttrs(attrs)} />`;
}

function svgPolygon(attrs: Record<string, string | number>): string {
  return `<polygon ${serializeAttrs(attrs)} />`;
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
