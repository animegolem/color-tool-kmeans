import { svgDocument, svgRect } from './svg';
import {
  svgToTile,
  type CompositorTile,
  type CompositorResult,
} from './compositor';

export interface ValueStudyInput {
  col1Svg: string;
  col2Svg: string;
}

export interface ValueStudyOptions {
  background?: string;
  gap?: number;
  margin?: number;
  canvasWidth?: number;
}

const COL1_RATIO = 1.2;

function renderTile(
  tile: CompositorTile,
  x: number,
  y: number,
  w: number,
  h: number
): string {
  return (
    `<svg x="${x}" y="${y}" width="${w}" height="${h}" ` +
    `viewBox="0 0 ${tile.width} ${tile.height}" ` +
    `preserveAspectRatio="xMidYMid meet">` +
    tile.svgContent +
    '</svg>'
  );
}

function scaledHeight(tile: CompositorTile, width: number): number {
  if (tile.width <= 0) return 0;
  return width * (tile.height / tile.width);
}

export function composeValueStudy(
  input: ValueStudyInput,
  options?: ValueStudyOptions
): CompositorResult {
  const background = options?.background ?? '#f8f2e3';
  const gap = options?.gap ?? 24;
  const margin = options?.margin ?? 32;
  const canvasWidth = options?.canvasWidth ?? 1300;
  const contentWidth = canvasWidth - 2 * margin;

  const col1Tile = svgToTile(input.col1Svg, 'values-col1');
  const col2Tile = svgToTile(input.col2Svg, 'values-col2');

  const col1Width = (contentWidth * COL1_RATIO) / (1 + COL1_RATIO) - gap / 2;
  const col2Width = contentWidth / (1 + COL1_RATIO) - gap / 2;

  const col1Height = scaledHeight(col1Tile, col1Width);
  const col2Height = scaledHeight(col2Tile, col2Width);

  const mainHeight = Math.max(col1Height, col2Height);
  const totalHeight = 2 * margin + mainHeight;

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

  // Col 1 — vertically centered
  const col1Y = margin + (mainHeight - col1Height) / 2;
  parts.push(renderTile(col1Tile, margin, col1Y, col1Width, col1Height));

  // Col 2 — vertically centered
  const col2X = margin + col1Width + gap;
  const col2Y = margin + (mainHeight - col2Height) / 2;
  parts.push(renderTile(col2Tile, col2X, col2Y, col2Width, col2Height));

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
