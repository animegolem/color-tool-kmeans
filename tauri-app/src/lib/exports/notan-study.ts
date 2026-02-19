import { svgDocument, svgRect, svgText } from './svg';
import {
  toDataUrl,
  formatPercent,
  grayFill,
  bucketTextColor,
  clamp01,
  svgImage,
  roundedRectPath
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

// Fixed layout constants — 1200px canvas for compositor scale-down (matches value-analysis.ts)
const NOTAN_CANVAS_WIDTH = 1200;
const NOTAN_MARGIN = 48;
const NOTAN_CELL_GAP = 30;
const NOTAN_STRIP_GAP = 3;
const NOTAN_STRIP_RADIUS = 15;
const NOTAN_IMAGE_GAP = 9;
const NOTAN_IMAGE_RADIUS = 9;

const SINGLE_CANVAS_WIDTH = 750;

export async function generateNotanStudySvg(
  input: NotanStudyInput
): Promise<NotanStudyResult> {
  const { cells, background = '#f8f2e3' } = input;

  const contentWidth = NOTAN_CANVAS_WIDTH - 2 * NOTAN_MARGIN;
  const cellWidth = Math.floor((contentWidth - NOTAN_CELL_GAP) / 2);

  // Aspect ratio from max preview dimensions across all 4 cells
  const maxPreviewW = Math.max(1, ...cells.map(c => c.previewWidth));
  const maxPreviewH = Math.max(1, ...cells.map(c => c.previewHeight));
  const imageDisplayHeight = Math.round(cellWidth * (maxPreviewH / maxPreviewW));

  // Strip height proportional to image height (clamped), so ratio stays ~13-14% across aspect ratios
  const stripHeight = Math.round(Math.max(42, Math.min(56, 0.13 * imageDisplayHeight)));
  const stripFont = Math.round(stripHeight * 0.35);

  const cellInnerHeight = stripHeight + NOTAN_IMAGE_GAP + imageDisplayHeight;
  const gridHeight = cellInnerHeight * 2 + NOTAN_CELL_GAP;

  const totalWidth = NOTAN_CANVAS_WIDTH;
  const totalHeight = gridHeight + 2 * NOTAN_MARGIN;

  // Convert all preview sources to data URLs in parallel
  const dataUrls = await Promise.all(cells.map(c => toDataUrl(c.previewSrc)));

  const content: string[] = [];
  content.push(svgRect({ x: 0, y: 0, width: totalWidth, height: totalHeight, fill: background }));

  // Render each cell in 2×2 grid
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cellX = NOTAN_MARGIN + col * (cellWidth + NOTAN_CELL_GAP);
    const cellY = NOTAN_MARGIN + row * (cellInnerHeight + NOTAN_CELL_GAP);

    content.push(renderCell({
      cell: cells[i],
      dataUrl: dataUrls[i],
      x: cellX,
      y: cellY,
      cellWidth,
      imageDisplayHeight,
      stripHeight,
      stripFont,
      cellIndex: i
    }));
  }

  return {
    svg: svgDocument({ width: totalWidth, height: totalHeight, content: content.join('') }),
    width: totalWidth,
    height: totalHeight
  };
}

export async function generateSingleCellSvg(
  cell: NotanCellData,
  background?: string
): Promise<NotanStudyResult> {
  const bg = background ?? '#f8f2e3';

  const cellWidth = SINGLE_CANVAS_WIDTH - 2 * NOTAN_MARGIN;
  const imageDisplayHeight = Math.round(
    cellWidth * (Math.max(1, cell.previewHeight) / Math.max(1, cell.previewWidth))
  );

  const stripHeight = Math.round(Math.max(42, Math.min(56, 0.13 * imageDisplayHeight)));
  const stripFont = Math.round(stripHeight * 0.35);

  const totalWidth = SINGLE_CANVAS_WIDTH;
  const innerHeight = stripHeight + NOTAN_IMAGE_GAP + imageDisplayHeight;
  const totalHeight = innerHeight + 2 * NOTAN_MARGIN;

  const dataUrl = await toDataUrl(cell.previewSrc);

  const content: string[] = [];
  content.push(svgRect({ x: 0, y: 0, width: totalWidth, height: totalHeight, fill: bg }));
  content.push(renderCell({
    cell,
    dataUrl,
    x: NOTAN_MARGIN,
    y: NOTAN_MARGIN,
    cellWidth,
    imageDisplayHeight,
    stripHeight,
    stripFont,
    cellIndex: 0
  }));

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
  cellWidth: number;
  imageDisplayHeight: number;
  stripHeight: number;
  stripFont: number;
  cellIndex: number;
}): string {
  const { cell, dataUrl, x, y, cellWidth, imageDisplayHeight, stripHeight, stripFont, cellIndex } = opts;
  const { bucketValues, counts } = cell;
  const parts: string[] = [];

  // --- Bucket strip ---

  // Rounded container background
  parts.push(
    svgRect({
      x, y, width: cellWidth, height: stripHeight,
      fill: 'rgba(33,33,32,0.08)', stroke: 'rgba(33,33,32,0.16)',
      'stroke-width': 1, rx: NOTAN_STRIP_RADIUS
    })
  );

  // ClipPath for bucket strip rounded corners
  const clipId = `notan-bucket-clip-${cellIndex}`;
  parts.push(
    `<defs><clipPath id="${clipId}">` +
    `<path d="${roundedRectPath(x, y, cellWidth, stripHeight, NOTAN_STRIP_RADIUS)}" />` +
    `</clipPath></defs>`
  );

  // Proportional bucket segments inside clip group
  const bucketTotal = counts.length ? counts.reduce((sum, c) => sum + c, 0) : 0;
  const bucketCount = bucketValues.length;
  const totalGapWidth = NOTAN_STRIP_GAP * (bucketCount > 1 ? bucketCount - 1 : 0);
  const bucketInnerWidth = cellWidth - totalGapWidth;

  const bucketLabels: string[] = [];
  parts.push(`<g clip-path="url(#${clipId})">`);
  let segCursor = x;
  bucketValues.forEach((value, idx) => {
    const count = counts[idx] ?? 0;
    const share = bucketTotal > 0 ? count / bucketTotal : 1 / bucketCount;
    const segWidth = idx === bucketCount - 1
      ? x + cellWidth - segCursor
      : Math.max(1, bucketInnerWidth * share);
    const fill = grayFill(clamp01(value));
    parts.push(svgRect({ x: segCursor, y, width: segWidth, height: stripHeight, fill }));
    if (segWidth >= 42) {
      bucketLabels.push(
        svgText(
          {
            x: segCursor + segWidth / 2, y: y + stripHeight / 2,
            fill: bucketTextColor(value), 'font-family': FONT_FAMILY, 'font-size': stripFont,
            'font-weight': 600, 'text-anchor': 'middle', 'dominant-baseline': 'middle'
          },
          formatPercent(share)
        )
      );
    }
    segCursor += segWidth + NOTAN_STRIP_GAP;
  });
  parts.push('</g>');
  // Text labels outside clip group to prevent clipping
  parts.push(...bucketLabels);

  // --- Preview image with rounded corners ---
  const imageY = y + stripHeight + NOTAN_IMAGE_GAP;
  const imageClipId = `notan-img-clip-${cellIndex}`;
  parts.push(
    `<defs><clipPath id="${imageClipId}">` +
    `<rect x="${x}" y="${imageY}" width="${cellWidth}" height="${imageDisplayHeight}" rx="${NOTAN_IMAGE_RADIUS}" />` +
    `</clipPath></defs>`
  );
  parts.push(`<g clip-path="url(#${imageClipId})">`);
  parts.push(
    svgImage({ href: dataUrl, x, y: imageY, width: cellWidth, height: imageDisplayHeight })
  );
  parts.push('</g>');

  return parts.join('');
}
