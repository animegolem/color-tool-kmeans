import type { AnalysisCluster } from '../stores/ui';
import { svgCircle, svgDocument, svgGroup, svgLine, svgText } from './svg';
import { svgToPngBlob } from './png';

const DEG_TO_RAD = Math.PI / 180;

export type PolarMode = 'oklch' | 'okhsv' | 'hsv';

export interface CircleGraphOptions {
  symbolScale: number;
  showAxisLabels?: boolean;
  showStroke?: boolean;
  showGamutOverlay?: boolean;
  mode?: PolarMode;
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
  const center = size / 2;
  const radius = center - 12;
  const padding = 8;
  const effectiveRadius = Math.max(0, radius - padding);
  const mode: PolarMode = options.mode ?? 'oklch';

  const gamut = mode === 'oklch' || mode === 'okhsv' ? buildOklchGamutOutline(18) : null;
  const maxChroma = mode === 'oklch' ? Math.max(1e-6, ...(gamut ?? []).map((p) => p.c)) : 1;
  const hueChromaLut =
    mode === 'okhsv' ? buildHueChromaLut(gamut ?? [], 360, Math.max(1e-6, maxChroma)) : null;
  const showGamutOverlay = options.showGamutOverlay ?? false;

  const maxSymbolRadius = Math.max(3.5, effectiveRadius * 0.3 * (options.symbolScale || 1));
  const layout = clusters.map((cluster) =>
    buildLayoutEntry(cluster, effectiveRadius, maxSymbolRadius, center, mode, maxChroma, hueChromaLut)
  );

  const svgParts: string[] = [];
  const axisGroup: string[] = [];
  const overlayGroup: string[] = [];
  if (showGamutOverlay) {
    if ((mode === 'oklch' || mode === 'okhsv') && gamut) {
      const overlayPath = buildOutlinePath(gamut, effectiveRadius, center, maxChroma);
      overlayGroup.push(`<path d="${overlayPath}" fill="rgba(16,17,17,0.08)" stroke="none" />`);
    } else {
      overlayGroup.push(
        svgCircle({
          cx: center,
          cy: center,
          r: effectiveRadius,
          fill: 'rgba(16,17,17,0.08)',
          stroke: 'none'
        })
      );
    }
  }
  if (overlayGroup.length) {
    svgParts.push(svgGroup(overlayGroup));
  }
  if (mode === 'oklch' && gamut) {
    const outlinePath = buildOutlinePath(gamut, effectiveRadius, center, maxChroma);
    axisGroup.push(
      `<path d="${outlinePath}" fill="none" stroke="rgba(16,17,17,0.85)" stroke-width="1" />`
    );
  } else {
    axisGroup.push(
      svgCircle({
        cx: center,
        cy: center,
        r: effectiveRadius,
        fill: 'none',
        stroke: 'rgba(16,17,17,0.85)',
        'stroke-width': 1
      })
    );
  }
  axisGroup.push(
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
  );

  svgParts.push(svgGroup(axisGroup));

  if (options.showAxisLabels !== false) {
    const axisLabelRadius = effectiveRadius + 24;
    const hueText = '<- Hue ->';
    const secondary = mode === 'oklch' ? '<- Chroma ->' : '<- Saturation ->';
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
        'data-color-model': mode,
        'data-chroma-normalization': mode === 'oklch' ? 'gamut' : mode === 'okhsv' ? 'gamut-hue' : 'unit'
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

interface PolarValue {
  hue: number;
  radiusRatio: number;
}

function buildLayoutEntry(
  cluster: AnalysisCluster,
  effectiveRadius: number,
  maxSymbolRadius: number,
  center: number,
  mode: PolarMode,
  maxChroma: number,
  hueChromaLut: number[] | null
): LayoutEntry {
  const polar = getPolarValue(cluster, mode, maxChroma, hueChromaLut);
  const angle = polar.hue * DEG_TO_RAD - Math.PI / 2;
  const r = effectiveRadius * Math.max(0, Math.min(1, polar.radiusRatio));
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
    symbolRadius: Math.max(3.5, Math.sqrt(Math.max(cluster.share, 0)) * maxSymbolRadius),
    rgb: cluster.rgb
  };
}

function getPolarValue(
  cluster: AnalysisCluster,
  mode: PolarMode,
  maxChroma: number,
  hueChromaLut: number[] | null
): PolarValue {
  if (mode === 'hsv') {
    const hsv = cluster.hsv ?? rgbToHsv(cluster.rgb);
    return { hue: hsv[0], radiusRatio: hsv[1] };
  }
  const oklch = cluster.oklch ?? [0, 0, 0];
  const hue = oklch[2] ?? 0;
  const chroma = oklch[1] ?? 0;
  if (mode === 'okhsv') {
    const maxHueChroma = hueChromaLut ? hueChromaLut[wrapHueIndex(hue)] : maxChroma;
    const radiusRatio = maxHueChroma > 0 ? chroma / maxHueChroma : 0;
    return { hue, radiusRatio };
  }
  return { hue, radiusRatio: maxChroma > 0 ? chroma / maxChroma : 0 };
}

function wrapHueIndex(hue: number): number {
  const normalized = ((hue % 360) + 360) % 360;
  return Math.round(normalized) % 360;
}

function buildOutlinePath(
  points: Array<{ h: number; c: number }>,
  radius: number,
  center: number,
  maxChroma: number
): string {
  if (!points.length) return '';
  const coords = points.map((point) => {
    const angle = point.h * DEG_TO_RAD - Math.PI / 2;
    const r = radius * (point.c / maxChroma);
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  return `M ${coords[0]} L ${coords.slice(1).join(' ')} Z`;
}

function buildOklchGamutOutline(steps: number): Array<{ h: number; c: number }> {
  const edges: Array<[[number, number, number], [number, number, number]]> = [
    [[1, 0, 0], [1, 1, 0]],
    [[1, 1, 0], [0, 1, 0]],
    [[0, 1, 0], [0, 1, 1]],
    [[0, 1, 1], [0, 0, 1]],
    [[0, 0, 1], [1, 0, 1]],
    [[1, 0, 1], [1, 0, 0]]
  ];
  const points: Array<{ h: number; c: number }> = [];
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
      points.push({ h: lch[2], c: lch[1] });
    }
  }
  return points;
}

function buildHueChromaLut(points: Array<{ h: number; c: number }>, bins: number, fallback: number) {
  const lut = new Array(bins).fill(0);
  for (const point of points) {
    const idx = wrapHueIndex(point.h) % bins;
    lut[idx] = Math.max(lut[idx], point.c);
  }
  let last = 0;
  for (let i = 0; i < bins; i += 1) {
    if (lut[i] === 0) {
      lut[i] = last;
    } else {
      last = lut[i];
    }
  }
  for (let i = bins - 1; i >= 0; i -= 1) {
    if (lut[i] === 0) {
      lut[i] = last || fallback;
    } else {
      last = lut[i];
    }
  }
  return lut.map((value) => (value <= 0 ? fallback : value));
}

export function srgbToLinear(value: number): number {
  if (value <= 0.04045) {
    return value / 12.92;
  }
  return Math.pow((value + 0.055) / 1.055, 2.4);
}

export function linearSrgbToOklab(rgb: [number, number, number]): [number, number, number] {
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

export function oklabToOklch(lab: [number, number, number]): [number, number, number] {
  const [l, a, b] = lab;
  const c = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return [l, c, h];
}

export function rgbToHsv(rgb: { r: number; g: number; b: number }): [number, number, number] {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
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
  const s = max === 0 ? 0 : delta / max;
  return [h, s, max];
}

function contrastStroke(rgb: { r: number; g: number; b: number }): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}
