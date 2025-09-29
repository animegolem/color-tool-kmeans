import type { AnalysisCluster } from '../stores/ui';
import { svgDocument, svgGroup, svgRect, svgText } from './svg';
import { svgToPngBlob } from './png';

const DEFAULT_ROW_HEIGHT = 32;
const SWATCH_WIDTH = 56;
const FONT_FAMILY = 'Fira Sans';

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}

function contrastStroke(rgb: { r: number; g: number; b: number }): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}

export interface PaletteOptions {
  rowHeight?: number;
  width?: number;
}

export function generatePaletteSvg(clusters: AnalysisCluster[], options: PaletteOptions = {}): { svg: string; width: number; height: number } {
  const rowHeight = options.rowHeight ?? DEFAULT_ROW_HEIGHT;
  const width = options.width ?? 320;
  const rows = clusters.map((cluster, index) => {
    const hex = rgbToHex(cluster.rgb);
    const rgbLabel = `[${cluster.rgb.r}:${cluster.rgb.g}:${cluster.rgb.b}] · ${cluster.count} px · ${(cluster.share * 100).toFixed(2)}%`;
    return {
      hex,
      rgbLabel,
      y: index * rowHeight,
      textColor: contrastStroke(cluster.rgb)
    };
  });
  const height = rows.length * rowHeight;
  const content = rows
    .map((row) =>
      svgGroup([
        svgRect({
          x: 0,
          y: row.y + 4,
          width: SWATCH_WIDTH,
          height: rowHeight - 8,
          fill: row.hex,
          stroke: 'none',
          rx: 4
        }),
        svgText(
          {
            x: SWATCH_WIDTH + 16,
            y: row.y + rowHeight / 2,
            fill: row.textColor,
            'font-family': FONT_FAMILY,
            'font-size': 16,
            'text-anchor': 'start'
          },
          row.rgbLabel
        )
      ])
    )
    .join('');
  return { svg: svgDocument({ width, height, content }), width, height };
}

export async function generatePalettePng(clusters: AnalysisCluster[], options: PaletteOptions & { scale?: number } = {}): Promise<Blob> {
  const { svg, width, height } = generatePaletteSvg(clusters, options);
  return svgToPngBlob(svg, width, height, options.scale ?? 1);
}

export function generatePaletteCsv(clusters: AnalysisCluster[]): string {
  const header = ['rank', 'share', 'count', 'r', 'g', 'b', 'hex'];
  const rows = clusters.map((cluster, index) => {
    const { r, g, b } = cluster.rgb;
    const hex = rgbToHex(cluster.rgb);
    return [index + 1, cluster.share.toFixed(6), cluster.count, r, g, b, hex];
  });
  return [header, ...rows].map((row) => row.join(',')).join('\n');
}
