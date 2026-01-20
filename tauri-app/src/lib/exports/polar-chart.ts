import type { AnalysisCluster } from '../stores/ui';
import { svgCircle, svgDocument, svgGroup, svgLine, svgText } from './svg';
import { svgToPngBlob } from './png';
import { buildGradientLayer } from './gradient';

const DEG_TO_RAD = Math.PI / 180;

export interface CircleGraphOptions {
  symbolScale: number;
  showAxisLabels?: boolean;
  showStroke?: boolean;
  showGamutBackground?: boolean;
  showPaletteMask?: boolean;
  useHsl?: boolean;
  useGradient?: boolean;
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
  const layout = clusters.map((cluster) =>
    buildLayoutEntry(cluster, radius, center, options, maxChroma, useHsl)
  );

  const svgParts: string[] = [];
  const axisGroup = svgGroup([
    svgCircle({ cx: center, cy: center, r: radius, fill: 'none', stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 }),
    svgLine({ x1: center - radius, y1: center, x2: center + radius, y2: center, stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 }),
    svgLine({ x1: center, y1: center - radius, x2: center, y2: center + radius, stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 })
  ]);

  if (options.showGamutBackground && !useHsl) {
    const meanL = computeMeanLightness(clusters);
    svgParts.push(buildGamutBackground(center, radius, meanL));
  }

  if (options.useGradient) {
    const gradient = buildGradientLayer(
      size,
      size,
      layout.map((entry) => ({
        x: entry.x,
        y: entry.y,
        radius: Math.max(3, entry.symbolRadius * 2),
        r: entry.rgb.r,
        g: entry.rgb.g,
        b: entry.rgb.b
      })),
      { alphaScale: 0.12, opacity: 0.9 }
    );
    if (gradient) {
      svgParts.push(gradient);
    }
  }

  if (options.showPaletteMask) {
    const mask = buildPaletteMask(layout);
    if (mask) {
      svgParts.push(mask);
    }
  }

  svgParts.push(axisGroup);

  if (options.showAxisLabels !== false) {
    const axisLabelRadius = radius + 24;
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
        'data-chroma-normalization': 'per-image',
        'data-gamut-overlay': options.showGamutBackground && !useHsl ? 'oklch-mean-L' : 'none',
        'data-palette-mask': options.showPaletteMask ? 'convex-hull' : 'none',
        'data-gradient-overlay': options.useGradient ? 'on' : 'off'
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
  radius: number,
  center: number,
  options: CircleGraphOptions,
  maxChroma: number,
  useHsl: boolean
): LayoutEntry {
  const hue = getHue(cluster, useHsl);
  const chroma = getChroma(cluster, useHsl);
  const maxSymbolRadius = radius * 0.3 * (options.symbolScale || 1);
  const padding = 8;
  const effectiveRadius = Math.max(0, radius - maxSymbolRadius - padding);
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

function buildGamutBackground(center: number, radius: number, lightness: number): string {
  const slices = 96;
  const hueEntries: Array<{ hue: number; maxC: number; color: string }> = [];
  let maxC = 0;
  for (let i = 0; i < slices; i += 1) {
    const hue = (360 / slices) * i;
    const c = maxChromaForHue(lightness, hue);
    maxC = Math.max(maxC, c);
    const rgb = oklchToSrgb(lightness, c, hue);
    hueEntries.push({ hue, maxC: c, color: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` });
  }
  const wedgeParts = [];
  const boundaryPoints: Array<[number, number]> = [];
  for (let i = 0; i < hueEntries.length; i += 1) {
    const entry = hueEntries[i];
    const start = ((Math.PI * 2) / slices) * i - Math.PI / 2;
    const end = ((Math.PI * 2) / slices) * (i + 1) - Math.PI / 2;
    const sliceRadius = maxC > 0 ? radius * (entry.maxC / maxC) : 0;
    const x1 = center + sliceRadius * Math.cos(start);
    const y1 = center + sliceRadius * Math.sin(start);
    const x2 = center + sliceRadius * Math.cos(end);
    const y2 = center + sliceRadius * Math.sin(end);
    boundaryPoints.push([x1, y1]);
    const path = `M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${sliceRadius.toFixed(
      2
    )} ${sliceRadius.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    wedgeParts.push(`<path d="${path}" fill="${entry.color}" fill-opacity="0.22" />`);
  }
  const boundaryPath = buildBoundaryPath(boundaryPoints);
  const defs = `
    <defs>
      <radialGradient id="gamut-fade" gradientUnits="userSpaceOnUse" cx="${center}" cy="${center}" r="${radius}">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.12" />
      </radialGradient>
    </defs>
  `;
  const hueWedges = wedgeParts.join('');
  const fadeCircle = `<circle cx="${center}" cy="${center}" r="${radius}" fill="url(#gamut-fade)" />`;
  const boundary = boundaryPath
    ? `<path d="${boundaryPath}" fill="none" stroke="rgba(16,17,17,0.5)" stroke-width="1" />`
    : '';
  return `${defs}${hueWedges}${fadeCircle}${boundary}`;
}

function buildBoundaryPath(points: Array<[number, number]>): string {
  if (points.length === 0) return '';
  const [firstX, firstY] = points[0];
  const segments = points.slice(1).map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`);
  return `M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${segments.join(' ')} Z`;
}

function computeMeanLightness(clusters: AnalysisCluster[]): number {
  let total = 0;
  let weight = 0;
  for (const cluster of clusters) {
    const l = cluster.oklch?.[0];
    const share = cluster.share ?? 0;
    if (typeof l === 'number' && Number.isFinite(l)) {
      total += l * (share > 0 ? share : 1);
      weight += share > 0 ? share : 1;
    }
  }
  if (weight <= 0) return 0.6;
  return Math.min(1, Math.max(0, total / weight));
}

function maxChromaForHue(lightness: number, hue: number): number {
  const maxC = 0.5;
  let low = 0;
  let high = maxC;
  let best = 0;
  for (let i = 0; i < 16; i += 1) {
    const mid = (low + high) * 0.5;
    const rgb = oklchToLinearRgb(lightness, mid, hue);
    if (isInGamut(rgb)) {
      best = mid;
      low = mid;
    } else {
      high = mid;
    }
  }
  return best;
}

function oklchToSrgb(lightness: number, chroma: number, hue: number): [number, number, number] {
  const linear = oklchToLinearRgb(lightness, chroma, hue);
  return linear.map((value) => linearToSrgbByte(value)) as [number, number, number];
}

function oklchToLinearRgb(lightness: number, chroma: number, hue: number): [number, number, number] {
  const rad = ((hue % 360) + 360) % 360 * (Math.PI / 180);
  const a = chroma * Math.cos(rad);
  const b = chroma * Math.sin(rad);
  return oklabToLinearRgb([lightness, a, b]);
}

function oklabToLinearRgb(lab: [number, number, number]): [number, number, number] {
  const l = lab[0];
  const a = lab[1];
  const b = lab[2];
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;
  return [
    4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
  ];
}

function isInGamut(rgb: [number, number, number]): boolean {
  return rgb[0] >= -1e-6 && rgb[0] <= 1 + 1e-6 && rgb[1] >= -1e-6 && rgb[1] <= 1 + 1e-6 && rgb[2] >= -1e-6 && rgb[2] <= 1 + 1e-6;
}

function linearToSrgbByte(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  const srgb = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, srgb)) * 255);
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

function buildPaletteMask(layout: LayoutEntry[]): string | null {
  const points = layout.map((entry) => ({ x: entry.x, y: entry.y }));
  const hull = convexHull(points);
  if (hull.length < 3) return null;
  const path = hullPath(hull);
  return `<path d="${path}" fill="rgba(16,17,17,0.08)" stroke="rgba(16,17,17,0.35)" stroke-width="1" />`;
}

function convexHull(points: Array<{ x: number; y: number }>): Array<{ x: number; y: number }> {
  if (points.length <= 2) return points.slice();
  const sorted = points
    .slice()
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const lower: Array<{ x: number; y: number }> = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: Array<{ x: number; y: number }> = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

function cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function hullPath(points: Array<{ x: number; y: number }>): string {
  const [first, ...rest] = points;
  const segments = rest.map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
  return `M ${first.x.toFixed(2)} ${first.y.toFixed(2)} ${segments.join(' ')} Z`;
}
