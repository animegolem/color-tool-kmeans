import type { AnalysisCluster } from '../stores/ui';
import { svgCircle, svgDocument, svgGroup, svgLine, svgText } from './svg';
import { svgToPngBlob } from './png';

const DEG_TO_RAD = Math.PI / 180;

export interface CircleGraphOptions {
  axisType: 'HSL' | 'HLS';
  symbolScale: number;
  showAxisLabels?: boolean;
  showStroke?: boolean;
  size?: number;
}

export interface CircleGraphResult {
  svg: string;
  width: number;
  height: number;
}

export function generateCircleGraphSvg(
  clusters: AnalysisCluster[],
  options: CircleGraphOptions
): CircleGraphResult {
  const size = options.size ?? 620;
  const radius = size / 2 - 12;
  const center = size / 2;
  const layout = clusters.map((cluster) => buildLayoutEntry(cluster, radius, center, options));

  const svgParts: string[] = [];
  svgParts.push(
    svgGroup([
      svgCircle({ cx: center, cy: center, r: radius, fill: 'none', stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 }),
      svgLine({ x1: center - radius, y1: center, x2: center + radius, y2: center, stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 }),
      svgLine({ x1: center, y1: center - radius, x2: center, y2: center + radius, stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 })
    ])
  );

  if (options.showAxisLabels !== false) {
    const axisLabelRadius = radius + 24;
    const hueText = '<- Hue ->';
    const secondary = options.axisType === 'HSL' ? '<- Sat. ->' : '<- Lum. ->';
    svgParts.push(
      svgText(
        {
          x: center,
          y: center - axisLabelRadius,
          'font-family': 'Fira Sans',
          'font-size': 15,
          fill: 'rgba(16,17,17,0.6)',
          'text-anchor': 'middle',
          transform: `rotate(90 ${center} ${center - axisLabelRadius})`
        },
        secondary
      )
    );
    svgParts.push(
      svgText(
        {
          x: center + axisLabelRadius * Math.SQRT1_2,
          y: center + axisLabelRadius * Math.SQRT1_2,
          'font-family': 'Fira Sans',
          'font-size': 15,
          fill: 'rgba(16,17,17,0.6)'
        },
        hueText
      )
    );
  }

  for (const entry of layout) {
    const fill = `rgb(${entry.rgb.r},${entry.rgb.g},${entry.rgb.b})`;
    const stroke = options.showStroke === false ? 'none' : contrastStroke(entry.rgb);
    svgParts.push(
      svgCircle({
        cx: entry.x.toFixed(2),
        cy: entry.y.toFixed(2),
        r: entry.symbolRadius.toFixed(2),
        fill,
        stroke,
        'stroke-width': options.showStroke === false ? 0 : 1
      })
    );
  }

  return {
    svg: svgDocument({ width: size, height: size, content: svgParts.join('') }),
    width: size,
    height: size
  };
}

export async function generateCircleGraphPng(
  clusters: AnalysisCluster[],
  options: CircleGraphOptions & { scale?: number }
): Promise<Blob> {
  const { svg, width, height } = generateCircleGraphSvg(clusters, options);
  return svgToPngBlob(svg, width, height, options.scale ?? 1);
}

interface LayoutEntry {
  x: number;
  y: number;
  symbolRadius: number;
  rgb: AnalysisCluster['rgb'];
}

function buildLayoutEntry(
  cluster: AnalysisCluster,
  radius: number,
  center: number,
  options: CircleGraphOptions
): LayoutEntry {
  const hue = cluster.hsv?.[0] ?? 0;
  const sat = cluster.hsv?.[1] ?? 0;
  const val = cluster.hsv?.[2] ?? 0;
  const maxSymbolRadius = radius * 0.18 * (options.symbolScale || 1);
  const padding = 8;
  const effectiveRadius = Math.max(0, radius - maxSymbolRadius - padding);
  const symbolRadius = Math.max(2, Math.sqrt(Math.max(cluster.share, 0)) * maxSymbolRadius);
  const angle = hue * DEG_TO_RAD - Math.PI / 2;
  const radialValue = options.axisType === 'HLS' ? val : sat;
  const r = effectiveRadius * radialValue;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
    symbolRadius,
    rgb: cluster.rgb
  };
}

function contrastStroke(rgb: { r: number; g: number; b: number }): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}
