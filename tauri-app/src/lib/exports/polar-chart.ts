import type { AnalysisCluster } from '../stores/ui';
import { svgCircle, svgDocument, svgGroup, svgLine, svgText } from './svg';
import { svgToPngBlob } from './png';

const DEG_TO_RAD = Math.PI / 180;

export interface CircleGraphOptions {
  symbolScale: number;
  showAxisLabels?: boolean;
  showStroke?: boolean;
  useHsl?: boolean;
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
  const useHsl = options.useHsl === true;
  const chromaValues = clusters.map((cluster) => getChroma(cluster, useHsl));
  const maxChroma = Math.max(1e-6, ...chromaValues);
  const maxSymbolRadius = radius * 0.3 * (options.symbolScale || 1);
  const padding = 8;
  const effectiveRadius = Math.max(0, radius - maxSymbolRadius - padding);
  const layout = clusters.map((cluster) =>
    buildLayoutEntry(cluster, effectiveRadius, maxSymbolRadius, center, maxChroma, useHsl)
  );

  const svgParts: string[] = [];
  const axisGroup = svgGroup([
    svgCircle({
      cx: center,
      cy: center,
      r: effectiveRadius,
      fill: 'none',
      stroke: 'rgba(16,17,17,0.85)',
      'stroke-width': 1
    }),
    svgLine({
      x1: center - effectiveRadius,
      y1: center,
      x2: center + effectiveRadius,
      y2: center,
      stroke: 'rgba(16,17,17,0.85)',
      'stroke-width': 1
    }),
    svgLine({
      x1: center,
      y1: center - effectiveRadius,
      x2: center,
      y2: center + effectiveRadius,
      stroke: 'rgba(16,17,17,0.85)',
      'stroke-width': 1
    })
  ]);

  svgParts.push(axisGroup);

  if (options.showAxisLabels !== false) {
    const axisLabelRadius = effectiveRadius + 24;
    const hueText = '<- Hue ->';
    const secondary = '<- Chroma ->';
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
    svg: svgDocument({
      width: size,
      height: size,
      content: svgParts.join(''),
      attrs: {
        'data-color-model': useHsl ? 'hsl' : 'oklch',
        'data-chroma-normalization': 'per-image'
      }
    }),
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
  effectiveRadius: number,
  maxSymbolRadius: number,
  center: number,
  maxChroma: number,
  useHsl: boolean
): LayoutEntry {
  const hue = getHue(cluster, useHsl);
  const chroma = getChroma(cluster, useHsl);
  const symbolRadius = Math.max(3.5, Math.sqrt(Math.max(cluster.share, 0)) * maxSymbolRadius);
  const angle = hue * DEG_TO_RAD - Math.PI / 2;
  const r = effectiveRadius * (chroma / maxChroma);
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
    symbolRadius,
    rgb: cluster.rgb
  };
}

function getHue(cluster: AnalysisCluster, useHsl: boolean): number {
  if (useHsl) {
    return rgbToHsl(cluster.rgb).h;
  }
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[2];
  }
  return cluster.hsv?.[0] ?? 0;
}

function getChroma(cluster: AnalysisCluster, useHsl: boolean): number {
  if (useHsl) {
    return rgbToHsl(cluster.rgb).s;
  }
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[1];
  }
  return cluster.hsv?.[1] ?? 0;
}

function contrastStroke(rgb: { r: number; g: number; b: number }): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}

function rgbToHsl(rgb: { r: number; g: number; b: number }): { h: number; s: number; l: number } {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (delta > 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}
