import type { AnalysisCluster } from '../stores/ui';
import { svgCircle, svgDocument, svgGroup, svgLine, svgRect, svgText } from './svg';
import { svgToPngBlob } from './png';

export interface HueLightnessOptions {
  symbolScale: number;
  showAxisLabels?: boolean;
  showStroke?: boolean;
  showGamutOverlay?: boolean;
  sizeMode?: 'frequency' | 'chroma';
  width?: number;
  height?: number;
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
  const maxChroma = Math.max(1e-6, ...clusters.map((cluster) => getChroma(cluster)));
  const maxSymbolRadius = Math.min(plotWidth, plotHeight) * 0.06 * (options.symbolScale || 1);
  const showGamutOverlay = options.showGamutOverlay ?? false;
  const points: Array<{ x: number; y: number; radius: number; r: number; g: number; b: number }> = [];
  const circleParts: string[] = [];
  const axisGroup = svgGroup([
    ...(showGamutOverlay ? buildHueLightnessOverlay(padding, plotWidth, plotHeight) : []),
    svgRect({
      x: padding,
      y: padding,
      width: plotWidth,
      height: plotHeight,
      fill: 'none',
      stroke: 'rgba(16,17,17,0.6)',
      'stroke-width': 1
    }),
    svgLine({
      x1: padding + plotWidth / 2,
      y1: padding,
      x2: padding + plotWidth / 2,
      y2: padding + plotHeight,
      stroke: 'rgba(16,17,17,0.2)',
      'stroke-width': 1
    }),
    svgLine({
      x1: padding,
      y1: padding + plotHeight / 2,
      x2: padding + plotWidth,
      y2: padding + plotHeight / 2,
      stroke: 'rgba(16,17,17,0.2)',
      'stroke-width': 1
    })
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
        ? Math.sqrt(Math.max(cluster.share, 0))
        : maxChroma > 0
          ? chroma / maxChroma
          : 0;
    const fill = `rgb(${cluster.rgb.r},${cluster.rgb.g},${cluster.rgb.b})`;
    const stroke = options.showStroke === false ? 'none' : contrastStroke(cluster.rgb);
    const radius = Math.max(2, sizeFactor * maxSymbolRadius);
    points.push({
      x,
      y,
      radius: Math.max(3, radius * 2),
      r: cluster.rgb.r,
      g: cluster.rgb.g,
      b: cluster.rgb.b
    });
    circleParts.push(
      svgCircle({
        cx: x.toFixed(2),
        cy: y.toFixed(2),
        r: radius.toFixed(2),
        fill,
        stroke,
        'stroke-width': options.showStroke === false ? 0 : 1
      })
    );
  }

  svgParts.push(axisGroup);
  svgParts.push(...circleParts);

  if (options.showAxisLabels !== false) {
    svgParts.push(
      svgText(
        {
          x: padding + plotWidth / 2,
          y: height - 8,
          'font-family': 'Fira Sans',
          'font-size': 14,
          fill: 'rgba(16,17,17,0.6)',
          'text-anchor': 'middle'
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
          'font-size': 14,
          fill: 'rgba(16,17,17,0.6)',
          'text-anchor': 'middle',
          transform: `rotate(-90 12 ${padding + plotHeight / 2})`
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
        'data-view': 'hue-lightness'
      }
    }),
    width,
    height
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

function buildHueLightnessOverlay(padding: number, plotWidth: number, plotHeight: number): string[] {
  const bins = 360;
  const minL = new Array(bins).fill(1);
  const maxL = new Array(bins).fill(0);
  const samples = buildOklchEdgeSamples(18);

  for (const sample of samples) {
    const idx = wrapHueIndex(sample.h, bins);
    minL[idx] = Math.min(minL[idx], sample.l);
    maxL[idx] = Math.max(maxL[idx], sample.l);
  }

  fillHueLightnessBins(minL, maxL);
  if (!minL.length) return [];

  const top: string[] = [];
  const bottom: string[] = [];
  const last = bins - 1;
  for (let i = 0; i < bins; i += 1) {
    const x = padding + (i / last) * plotWidth;
    const y = padding + (1 - clamp01(maxL[i])) * plotHeight;
    top.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  for (let i = bins - 1; i >= 0; i -= 1) {
    const x = padding + (i / last) * plotWidth;
    const y = padding + (1 - clamp01(minL[i])) * plotHeight;
    bottom.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  const path = `M ${top[0]} L ${top.slice(1).join(' ')} L ${bottom.join(' ')} Z`;
  return [`<path d="${path}" fill="rgba(16,17,17,0.08)" stroke="none" />`];
}

function fillHueLightnessBins(minL: number[], maxL: number[]) {
  const bins = minL.length;
  let lastMin: number | null = null;
  let lastMax: number | null = null;
  for (let i = 0; i < bins; i += 1) {
    if (maxL[i] >= minL[i]) {
      lastMin = minL[i];
      lastMax = maxL[i];
    } else if (lastMin !== null && lastMax !== null) {
      minL[i] = lastMin;
      maxL[i] = lastMax;
    }
  }
  let nextMin: number | null = null;
  let nextMax: number | null = null;
  for (let i = bins - 1; i >= 0; i -= 1) {
    if (maxL[i] >= minL[i]) {
      nextMin = minL[i];
      nextMax = maxL[i];
    } else if (nextMin !== null && nextMax !== null) {
      minL[i] = nextMin;
      maxL[i] = nextMax;
    }
  }
  if (nextMin === null || nextMax === null) {
    for (let i = 0; i < bins; i += 1) {
      minL[i] = 0;
      maxL[i] = 1;
    }
  }
}

function buildOklchEdgeSamples(steps: number): Array<{ h: number; l: number }> {
  const edges: Array<[[number, number, number], [number, number, number]]> = [
    [[1, 0, 0], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 0]],
    [[0, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 1]],
    [[1, 0, 1], [1, 0, 0]]
  ];
  const samples: Array<{ h: number; l: number }> = [];
  for (const [start, end] of edges) {
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const rgb = [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
        start[2] + (end[2] - start[2]) * t
      ];
      const lab = linearSrgbToOklab(rgb.map(srgbToLinear) as [number, number, number]);
      const lch = oklabToOklch(lab);
      if (lch[1] < 1e-4) continue;
      samples.push({ h: lch[2], l: lch[0] });
    }
  }
  return samples;
}

function wrapHueIndex(hue: number, bins: number): number {
  const normalized = ((hue % 360) + 360) % 360;
  const idx = Math.round(normalized) % bins;
  return idx;
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function srgbToLinear(v: number): number {
  if (v <= 0.04045) return v / 12.92;
  return Math.pow((v + 0.055) / 1.055, 2.4);
}

function linearSrgbToOklab(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
  ];
}

function oklabToOklch(lab: [number, number, number]): [number, number, number] {
  const l = lab[0];
  const a = lab[1];
  const b = lab[2];
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (!Number.isFinite(h)) h = 0;
  if (h < 0) h += 360;
  return [l, c, h];
}
