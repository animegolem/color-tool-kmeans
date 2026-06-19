import { svgDocument, svgRect } from './svg';
import type { CompositorTile, CompositorResult } from './compositor';

export interface ColorStudyInput {
  sourceImage?: CompositorTile;
  videoBarcode?: CompositorTile;
  polarChart?: CompositorTile;
  hueLightness?: CompositorTile;
  histogram?: CompositorTile;
  secondaryHistograms?: CompositorTile[];
  paletteStrip?: CompositorTile;
}

export interface ColorStudyOptions {
  background?: string;
  gap?: number;
  margin?: number;
  canvasWidth?: number;
}

const PALETTE_COL_WIDTH = 320;
const ALL_SORTS_SOURCE_SCALE = 0.65;
const COL1_RATIO = 1.4;

interface ColumnItem {
  tile: CompositorTile;
  renderWidth: number;
  renderHeight: number;
  xOffset: number;
}

interface SideBySideRow {
  left: ColumnItem;
  right: ColumnItem;
  totalHeight: number;
}

interface ColumnLayout {
  items: ColumnItem[];
  sideBySide?: SideBySideRow;
  totalHeight: number;
}

function scaledHeight(tile: CompositorTile, width: number): number {
  if (tile.width <= 0) return 0;
  return width * (tile.height / tile.width);
}

function buildColumn(
  tiles: (CompositorTile | undefined)[],
  colWidth: number,
  gap: number,
  allSorts: boolean
): ColumnLayout {
  const items: ColumnItem[] = [];
  let sideBySide: SideBySideRow | undefined;
  let totalHeight = 0;

  for (const tile of tiles) {
    if (!tile) continue;

    if (allSorts && tile.key === 'source-image') {
      const renderWidth = colWidth * ALL_SORTS_SOURCE_SCALE;
      const renderHeight = scaledHeight(tile, renderWidth);
      const xOffset = (colWidth - renderWidth) / 2;
      items.push({ tile, renderWidth, renderHeight, xOffset });
      totalHeight += renderHeight;
    } else {
      const renderHeight = scaledHeight(tile, colWidth);
      items.push({ tile, renderWidth: colWidth, renderHeight, xOffset: 0 });
      totalHeight += renderHeight;
    }
  }

  if (items.length > 1) {
    totalHeight += gap * (items.length - 1);
  }

  return { items, sideBySide, totalHeight };
}

function buildCol1(
  input: ColorStudyInput,
  colWidth: number,
  gap: number
): ColumnLayout {
  const allSorts = !!input.secondaryHistograms && input.secondaryHistograms.length === 2;
  const primaryTiles: (CompositorTile | undefined)[] = [
    input.sourceImage,
    input.videoBarcode,
    input.histogram
  ];
  const layout = buildColumn(primaryTiles, colWidth, gap, allSorts);

  if (allSorts && input.secondaryHistograms && input.secondaryHistograms.length === 2) {
    const subWidth = (colWidth - gap) / 2;
    const left = input.secondaryHistograms[0];
    const right = input.secondaryHistograms[1];
    const leftH = scaledHeight(left, subWidth);
    const rightH = scaledHeight(right, subWidth);
    const rowHeight = Math.max(leftH, rightH);

    layout.sideBySide = {
      left: { tile: left, renderWidth: subWidth, renderHeight: leftH, xOffset: 0 },
      right: { tile: right, renderWidth: subWidth, renderHeight: rightH, xOffset: subWidth + gap },
      totalHeight: rowHeight
    };

    if (layout.items.length > 0) {
      layout.totalHeight += gap;
    }
    layout.totalHeight += rowHeight;
  }

  return layout;
}

function buildCol2(input: ColorStudyInput, colWidth: number, gap: number): ColumnLayout {
  return buildColumn([input.polarChart, input.hueLightness], colWidth, gap, false);
}

function renderTile(tile: CompositorTile, x: number, y: number, w: number, h: number): string {
  if (tile.isRaster) {
    return `<image href="${tile.svgContent}" xlink:href="${tile.svgContent}" ` +
      `x="${x}" y="${y}" width="${w}" height="${h}" ` +
      `preserveAspectRatio="xMidYMid meet" />`;
  }
  return `<svg x="${x}" y="${y}" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${tile.width} ${tile.height}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    tile.svgContent +
    '</svg>';
}

function renderColumn(
  layout: ColumnLayout,
  colX: number,
  topY: number,
  mainHeight: number
): string {
  if (layout.items.length === 0 && !layout.sideBySide) return '';

  const yOffset = (mainHeight - layout.totalHeight) / 2;
  let cursor = topY + yOffset;
  const parts: string[] = [];
  const gap = inferGap(layout);

  for (const item of layout.items) {
    parts.push(renderTile(
      item.tile,
      colX + item.xOffset,
      cursor,
      item.renderWidth,
      item.renderHeight
    ));
    cursor += item.renderHeight + gap;
  }

  if (layout.sideBySide) {
    const row = layout.sideBySide;
    parts.push(renderTile(row.left.tile, colX + row.left.xOffset, cursor, row.left.renderWidth, row.left.renderHeight));
    parts.push(renderTile(row.right.tile, colX + row.right.xOffset, cursor, row.right.renderWidth, row.right.renderHeight));
  }

  return parts.join('');
}

function inferGap(layout: ColumnLayout): number {
  const itemCount = layout.items.length + (layout.sideBySide ? 1 : 0);
  if (itemCount <= 1) return 0;
  const contentHeight = layout.items.reduce((s, i) => s + i.renderHeight, 0)
    + (layout.sideBySide?.totalHeight ?? 0);
  const gapSpace = layout.totalHeight - contentHeight;
  return gapSpace / (itemCount - 1);
}

function renderPaletteColumn(
  tile: CompositorTile,
  colX: number,
  topY: number,
  colWidth: number,
  mainHeight: number
): string {
  if (tile.isRaster) {
    return `<image href="${tile.svgContent}" xlink:href="${tile.svgContent}" ` +
      `x="${colX}" y="${topY}" width="${colWidth}" height="${mainHeight}" ` +
      `preserveAspectRatio="xMidYMid meet" />`;
  }
  return `<svg x="${colX}" y="${topY}" width="${colWidth}" height="${mainHeight}" ` +
    `viewBox="0 0 ${tile.width} ${tile.height}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    tile.svgContent +
    '</svg>';
}

export function composeColorStudy(
  input: ColorStudyInput,
  options?: ColorStudyOptions
): CompositorResult {
  const background = options?.background ?? '#f8f2e3';
  const gap = options?.gap ?? 24;
  const margin = options?.margin ?? 32;
  const canvasWidth = options?.canvasWidth ?? 1300;
  const contentWidth = canvasWidth - 2 * margin;

  const hasCol1 = !!(input.sourceImage || input.videoBarcode || input.histogram || input.secondaryHistograms?.length);
  const hasCol2 = !!(input.polarChart || input.hueLightness);
  const hasCol3 = !!input.paletteStrip;

  const activeCount = [hasCol1, hasCol2, hasCol3].filter(Boolean).length;

  if (activeCount === 0) {
    const h = margin * 2;
    return {
      svg: svgDocument({
        width: canvasWidth,
        height: h,
        content: svgRect({ x: 0, y: 0, width: canvasWidth, height: h, fill: background })
      }),
      width: canvasWidth,
      height: h
    };
  }

  const col3Width = hasCol3 ? PALETTE_COL_WIDTH : 0;
  const activeGaps = (activeCount - 1) * gap;
  const remaining = contentWidth - col3Width - activeGaps;

  let col1Width: number;
  let col2Width: number;

  if (hasCol1 && hasCol2) {
    col1Width = remaining * COL1_RATIO / (1 + COL1_RATIO);
    col2Width = remaining / (1 + COL1_RATIO);
  } else if (hasCol1) {
    col1Width = remaining;
    col2Width = 0;
  } else if (hasCol2) {
    col1Width = 0;
    col2Width = remaining;
  } else {
    col1Width = 0;
    col2Width = 0;
  }

  const col1Layout = hasCol1 ? buildCol1(input, col1Width, gap) : { items: [], totalHeight: 0 };
  const col2Layout = hasCol2 ? buildCol2(input, col2Width, gap) : { items: [], totalHeight: 0 };

  const mainHeight = Math.max(col1Layout.totalHeight, col2Layout.totalHeight);
  const totalHeight = 2 * margin + (mainHeight > 0 ? mainHeight : 0);

  const parts: string[] = [];
  parts.push(svgRect({ x: 0, y: 0, width: canvasWidth, height: totalHeight, fill: background }));

  let cursorX = margin;

  if (hasCol1) {
    parts.push(renderColumn(col1Layout, cursorX, margin, mainHeight));
    cursorX += col1Width + gap;
  }

  if (hasCol2) {
    parts.push(renderColumn(col2Layout, cursorX, margin, mainHeight));
    cursorX += col2Width + gap;
  }

  if (hasCol3) {
    parts.push(renderPaletteColumn(input.paletteStrip!, cursorX, margin, col3Width, mainHeight));
  }

  return {
    svg: svgDocument({ width: canvasWidth, height: totalHeight, content: parts.join('') }),
    width: canvasWidth,
    height: totalHeight
  };
}
