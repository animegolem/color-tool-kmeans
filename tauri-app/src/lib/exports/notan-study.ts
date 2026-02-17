import { svgDocument, svgRect, svgText } from './svg';
import {
  toDataUrl,
  formatPercent,
  grayFill,
  bucketTextColor,
  clamp01,
  svgImage
} from './value-analysis';

export interface NotanCellData {
  previewSrc: string;
  previewWidth: number;
  previewHeight: number;
  bucketValues: number[];
  counts: number[];
}

export interface NotanStudyInput {
  cells: [NotanCellData, NotanCellData, NotanCellData, NotanCellData];
  background?: string;
}

export interface NotanStudyResult {
  svg: string;
  width: number;
  height: number;
}

const FONT_FAMILY = 'Fira Sans';

export async function generateNotanStudySvg(
  input: NotanStudyInput
): Promise<NotanStudyResult> {
  const { cells, background = '#f8f2e3' } = input;

  // Derive cell dimensions from the max preview across all 4 levels
  const cellWidth = Math.max(1, ...cells.map(c => c.previewWidth));
  const cellHeight = Math.max(1, ...cells.map(c => c.previewHeight));
  const scale = Math.max(1, cellWidth / 280);

  const margin = Math.round(32 * scale);
  const cellGap = Math.round(24 * scale);
  const fontSmall = Math.round(12 * scale);
  const bucketStripHeight = Math.round(36 * scale);
  const bucketStripGap = Math.round(2 * scale);
  const bucketStripRadius = Math.round(12 * scale);
  const notanGap = Math.round(8 * scale);
  const imageRadius = Math.round(8 * scale);

  // Grid: 2 columns × 2 rows
  const gridWidth = cellWidth * 2 + cellGap;
  const cellInnerHeight = bucketStripHeight + notanGap + cellHeight;
  const gridHeight = cellInnerHeight * 2 + cellGap;

  const totalWidth = gridWidth + margin * 2;
  const totalHeight = gridHeight + margin * 2;

  // Convert all preview sources to data URLs in parallel
  const dataUrls = await Promise.all(cells.map(c => toDataUrl(c.previewSrc)));

  const content: string[] = [];
  content.push(svgRect({ x: 0, y: 0, width: totalWidth, height: totalHeight, fill: background }));

  // Render each cell
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cellX = margin + col * (cellWidth + cellGap);
    const cellY = margin + row * (cellInnerHeight + cellGap);
    const cell = cells[i];
    const dataUrl = dataUrls[i];

    content.push(renderCell({
      cell,
      dataUrl,
      x: cellX,
      y: cellY,
      width: cellWidth,
      height: cellHeight,
      scale,
      fontSmall,
      bucketStripHeight,
      bucketStripGap,
      bucketStripRadius,
      notanGap,
      imageRadius,
      cellIndex: i
    }));
  }

  return {
    svg: svgDocument({ width: totalWidth, height: totalHeight, content: content.join('') }),
    width: totalWidth,
    height: totalHeight
  };
}

function renderCell(opts: {
  cell: NotanCellData;
  dataUrl: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
  fontSmall: number;
  bucketStripHeight: number;
  bucketStripGap: number;
  bucketStripRadius: number;
  notanGap: number;
  imageRadius: number;
  cellIndex: number;
}): string {
  const {
    cell, dataUrl, x, y, width, height, scale,
    fontSmall, bucketStripHeight, bucketStripGap,
    bucketStripRadius, notanGap, imageRadius, cellIndex
  } = opts;
  const { bucketValues, counts } = cell;
  const parts: string[] = [];

  // --- Bucket strip ---
  const clipId = `notan-bucket-clip-${cellIndex}`;
  parts.push(
    `<defs><clipPath id="${clipId}">` +
    `<rect x="${x}" y="${y}" width="${width}" height="${bucketStripHeight}" rx="${bucketStripRadius}" />` +
    `</clipPath></defs>`
  );

  // Rounded container background
  parts.push(
    svgRect({
      x, y, width, height: bucketStripHeight,
      fill: 'rgba(33,33,32,0.08)', stroke: 'rgba(33,33,32,0.16)',
      'stroke-width': Math.max(1, Math.round(1 * scale)), rx: bucketStripRadius
    })
  );

  // Proportional bucket segments
  const bucketTotal = counts.length ? counts.reduce((sum, c) => sum + c, 0) : 0;
  const bucketCount = bucketValues.length;
  const totalGapWidth = bucketStripGap * (bucketCount > 1 ? bucketCount - 1 : 0);
  const bucketInnerWidth = width - totalGapWidth;

  parts.push(`<g clip-path="url(#${clipId})">`);
  let segCursor = x;
  bucketValues.forEach((value, idx) => {
    const count = counts[idx] ?? 0;
    const share = bucketTotal > 0 ? count / bucketTotal : 1 / bucketCount;
    const segWidth = idx === bucketCount - 1
      ? x + width - segCursor
      : Math.max(1, bucketInnerWidth * share);
    const fill = grayFill(clamp01(value));
    parts.push(
      svgRect({ x: segCursor, y, width: segWidth, height: bucketStripHeight, fill })
    );
    if (segWidth >= 42 * scale) {
      parts.push(
        svgText(
          {
            x: segCursor + segWidth / 2, y: y + bucketStripHeight / 2,
            fill: bucketTextColor(value), 'font-family': FONT_FAMILY, 'font-size': fontSmall,
            'font-weight': 600, 'text-anchor': 'middle', 'dominant-baseline': 'middle'
          },
          formatPercent(share)
        )
      );
    }
    segCursor += segWidth + bucketStripGap;
  });
  parts.push('</g>');

  // --- Preview image with rounded corners ---
  const imageY = y + bucketStripHeight + notanGap;
  const imageClipId = `notan-img-clip-${cellIndex}`;
  parts.push(
    `<defs><clipPath id="${imageClipId}">` +
    `<rect x="${x}" y="${imageY}" width="${width}" height="${height}" rx="${imageRadius}" />` +
    `</clipPath></defs>`
  );
  parts.push(`<g clip-path="url(#${imageClipId})">`);
  parts.push(
    svgImage({ href: dataUrl, x, y: imageY, width, height })
  );
  parts.push('</g>');

  return parts.join('');
}
