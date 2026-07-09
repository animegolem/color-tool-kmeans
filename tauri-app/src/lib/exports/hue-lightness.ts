import type { AnalysisCluster } from '../stores/ui';
import {
  svgCircle,
  svgDocument,
  svgGroup,
  svgLine,
  svgRect,
  svgText,
} from './svg';
import { svgToPngBlob } from './png';

export interface HueLightnessOptions {
  symbolScale: number;
  showAxisLabels?: boolean;
  showStroke?: boolean;
  sizeMode?: 'frequency' | 'chroma';
  width?: number;
  height?: number;
  fontSize?: number;
}

export interface HueLightnessResult {
  svg: string;
  width: number;
  height: number;
}

export function generateHueLightnessSvg(
  clusters: AnalysisCluster[],
  options: HueLightnessOptions
): HueLightnessResult {
  const width = options.width ?? 520;
  const height = options.height ?? 360;
  const padding = 36;
  const plotWidth = Math.max(1, width - padding * 2);
  const plotHeight = Math.max(1, height - padding * 2);
  const sizeMode = options.sizeMode ?? 'chroma';
  const maxChroma = Math.max(
    1e-6,
    ...clusters.map((cluster) => getChroma(cluster))
  );
  const maxShare = Math.max(
    1e-6,
    ...clusters.map((cluster) => Math.max(cluster.share, 0))
  );
  const maxSymbolRadius =
    Math.min(plotWidth, plotHeight) * 0.06 * (options.symbolScale || 1);
  const points: Array<{
    x: number;
    y: number;
    radius: number;
    r: number;
    g: number;
    b: number;
  }> = [];
  const circleParts: string[] = [];
  const axisGroup = svgGroup([
    svgRect({
      x: padding,
      y: padding,
      width: plotWidth,
      height: plotHeight,
      fill: 'none',
      stroke: 'rgba(16,17,17,0.6)',
      'stroke-width': 1,
    }),
    svgLine({
      x1: padding + plotWidth / 2,
      y1: padding,
      x2: padding + plotWidth / 2,
      y2: padding + plotHeight,
      stroke: 'rgba(16,17,17,0.2)',
      'stroke-width': 1,
    }),
    svgLine({
      x1: padding,
      y1: padding + plotHeight / 2,
      x2: padding + plotWidth,
      y2: padding + plotHeight / 2,
      stroke: 'rgba(16,17,17,0.2)',
      'stroke-width': 1,
    }),
  ]);
  const svgParts: string[] = [];

  for (const cluster of clusters) {
    const hue = getHue(cluster);
    const lightness = getLightness(cluster);
    const chroma = getChroma(cluster);
    const x = padding + (hue / 360) * plotWidth;
    const y = padding + (1 - lightness) * plotHeight;
    const sizeFactor =
      sizeMode === 'frequency'
        ? Math.sqrt(Math.max(cluster.share, 0) / maxShare)
        : maxChroma > 0
          ? chroma / maxChroma
          : 0;
    const fill = `rgb(${cluster.rgb.r},${cluster.rgb.g},${cluster.rgb.b})`;
    const stroke =
      options.showStroke === false ? 'none' : contrastStroke(cluster.rgb);
    const radius = Math.max(2, sizeFactor * maxSymbolRadius);
    points.push({
      x,
      y,
      radius: Math.max(3, radius * 2),
      r: cluster.rgb.r,
      g: cluster.rgb.g,
      b: cluster.rgb.b,
    });
    circleParts.push(
      svgCircle({
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: radius.toFixed(2),
        fill,
        stroke,
        'stroke-width': options.showStroke === false ? 0 : 1,
      })
    );
  }

  svgParts.push(axisGroup);
  svgParts.push(...circleParts);

  if (options.showAxisLabels !== false) {
    const labelFontSize = options.fontSize ?? 14;
    svgParts.push(
      svgText(
        {
          x: padding + plotWidth / 2,
          y: height - 8,
          'font-family': 'Fira Sans',
          'font-size': labelFontSize,
          fill: 'rgba(16,17,17,0.6)',
          'text-anchor': 'middle',
        },
        'Hue'
      )
    );
    svgParts.push(
      svgText(
        {
          x: 12,
          y: padding + plotHeight / 2,
          'font-family': 'Fira Sans',
          'font-size': labelFontSize,
          fill: 'rgba(16,17,17,0.6)',
          'text-anchor': 'middle',
          transform: `rotate(-90 12 ${padding + plotHeight / 2})`,
        },
        'Lightness'
      )
    );
  }

  return {
    svg: svgDocument({
      width,
      height,
      content: svgParts.join(''),
      attrs: {
        'data-color-model': 'oklch',
        'data-view': 'hue-lightness',
      },
    }),
    width,
    height,
  };
}

export async function generateHueLightnessPng(
  clusters: AnalysisCluster[],
  options: HueLightnessOptions & { scale?: number }
): Promise<Blob> {
  const { svg, width, height } = generateHueLightnessSvg(clusters, options);
  return svgToPngBlob(svg, width, height, options.scale ?? 1);
}

function getHue(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[2];
  }
  return cluster.hsv?.[0] ?? 0;
}

function getChroma(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[1];
  }
  return cluster.hsv?.[1] ?? 0;
}

function getLightness(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[0];
  }
  return (cluster.hsv?.[2] ?? 0) / 100;
}

function contrastStroke(rgb: { r: number; g: number; b: number }): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}
