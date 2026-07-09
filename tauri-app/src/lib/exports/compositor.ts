import { svgDocument, svgRect } from './svg';

export interface CompositorTile {
  key: string;
  svgContent: string;
  width: number;
  height: number;
  isRaster?: boolean;
}

export interface CompositorOptions {
  background?: string;
  gap?: number;
  margin?: number;
  canvasWidth?: number;
}

export interface CompositorResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * Strip XML declaration and outer <svg> wrapper, returning inner content.
 */
export function extractSvgInner(fullSvg: string): string {
  let s = fullSvg.replace(/<\?xml[^?]*\?>\s*/g, '');
  s = s.replace(/^<svg[^>]*>/, '');
  s = s.replace(/<\/svg>\s*$/, '');
  return s;
}

/**
 * Parse width/height from an SVG string's root element attributes.
 */
export function parseSvgDimensions(fullSvg: string): {
  width: number;
  height: number;
} {
  const wMatch = fullSvg.match(/<svg[^>]*\bwidth="(\d+(?:\.\d+)?)"/);
  const hMatch = fullSvg.match(/<svg[^>]*\bheight="(\d+(?:\.\d+)?)"/);
  return {
    width: wMatch ? parseFloat(wMatch[1]) : 0,
    height: hMatch ? parseFloat(hMatch[1]) : 0,
  };
}

/**
 * Build a tile from a full SVG string (auto-extracts inner content and dimensions).
 */
export function svgToTile(fullSvg: string, key: string): CompositorTile {
  const { width, height } = parseSvgDimensions(fullSvg);
  return {
    key,
    svgContent: extractSvgInner(fullSvg),
    width,
    height,
  };
}

/**
 * Wrap an image data URL as a compositor tile.
 */
export function imageToTile(
  dataUrl: string,
  width: number,
  height: number,
  key: string
): CompositorTile {
  const escaped = dataUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  return {
    key,
    svgContent: escaped,
    width,
    height,
    isRaster: true,
  };
}

/**
 * Compute grid cols/rows for a given tile count.
 */
export function computeGridLayout(count: number): {
  cols: number;
  rows: number;
} {
  if (count <= 1) return { cols: 1, rows: 1 };
  if (count === 2) return { cols: 2, rows: 1 };
  if (count <= 4) return { cols: 2, rows: Math.ceil(count / 2) };
  return { cols: 3, rows: Math.ceil(count / 3) };
}

/**
 * Compose an array of tiles into a single SVG with adaptive grid layout.
 */
export function composeTiles(
  tiles: CompositorTile[],
  options?: CompositorOptions
): CompositorResult {
  const background = options?.background ?? '#f8f2e3';
  const gap = options?.gap ?? 24;
  const margin = options?.margin ?? 32;
  const canvasWidth = options?.canvasWidth ?? 1200;
  if (tiles.length === 0) {
    const h = margin * 2;
    return {
      svg: svgDocument({
        width: canvasWidth,
        height: h,
        content: svgRect({
          x: 0,
          y: 0,
          width: canvasWidth,
          height: h,
          fill: background,
        }),
      }),
      width: canvasWidth,
      height: h,
    };
  }

  const { cols, rows } = computeGridLayout(tiles.length);
  const cellWidth = (canvasWidth - margin * 2 - gap * (cols - 1)) / cols;

  // Build row groups and compute row heights
  const rowHeights: number[] = [];
  for (let row = 0; row < rows; row++) {
    let maxH = 0;
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (idx >= tiles.length) break;
      const tile = tiles[idx];
      const aspect = tile.width > 0 ? tile.height / tile.width : 1;
      maxH = Math.max(maxH, cellWidth * aspect);
    }
    rowHeights.push(Math.ceil(maxH));
  }

  const totalHeight =
    margin * 2 + rowHeights.reduce((sum, h) => sum + h, 0) + gap * (rows - 1);

  const parts: string[] = [];
  parts.push(
    svgRect({
      x: 0,
      y: 0,
      width: canvasWidth,
      height: totalHeight,
      fill: background,
    })
  );

  let cursorY = margin;
  for (let row = 0; row < rows; row++) {
    const rowHeight = rowHeights[row];
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col;
      if (idx >= tiles.length) break;
      const tile = tiles[idx];
      const x = margin + col * (cellWidth + gap);

      if (tile.isRaster) {
        parts.push(
          `<image href="${tile.svgContent}" xlink:href="${tile.svgContent}" ` +
            `x="${x}" y="${cursorY}" width="${cellWidth}" height="${rowHeight}" ` +
            `preserveAspectRatio="xMidYMid meet" />`
        );
      } else {
        parts.push(
          `<svg x="${x}" y="${cursorY}" width="${cellWidth}" height="${rowHeight}" ` +
            `viewBox="0 0 ${tile.width} ${tile.height}" ` +
            `preserveAspectRatio="xMidYMid meet">`
        );
        parts.push(tile.svgContent);
        parts.push('</svg>');
      }
    }
    cursorY += rowHeight + gap;
  }

  return {
    svg: svgDocument({
      width: canvasWidth,
      height: totalHeight,
      content: parts.join(''),
    }),
    width: canvasWidth,
    height: totalHeight,
  };
}
