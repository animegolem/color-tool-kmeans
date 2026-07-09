import type { AnalysisCluster } from '../stores/ui';
import { svgDocument, svgRect, svgText } from './svg';
import { svgToPngBlob } from './png';

export interface HistogramOptions {
  width?: number;
  height?: number;
  maxBars?: number;
  sortBy?: 'frequency' | 'hue' | 'lightness';
  hPadding?: number;
  fontSize?: number;
}

export interface HistogramResult {
  svg: string;
  width: number;
  height: number;
}

export function generateHistogramSvg(
  clusters: AnalysisCluster[],
  options: HistogramOptions = {}
): HistogramResult {
  const width = options.width ?? 520;
  const height = options.height ?? 180;
  const maxBars = options.maxBars ?? 120;
  const sortBy = options.sortBy ?? 'frequency';
  const hPad = options.hPadding ?? 16;
  const vPad = 16;
  const fontSize = options.fontSize ?? 11;
  const captionSpace = fontSize + 6;
  const bottomPad = Math.max(vPad, captionSpace);
  const plotWidth = Math.max(1, width - hPad * 2);
  const plotHeight = Math.max(1, height - vPad - bottomPad);
  const sorted = [...clusters];
  if (sortBy === 'hue') {
    sorted.sort((a, b) => getHue(a) - getHue(b));
  } else if (sortBy === 'lightness') {
    sorted.sort((a, b) => getLightness(a) - getLightness(b));
  } else {
    sorted.sort((a, b) => b.count - a.count);
  }
  const bars = sorted.slice(0, Math.max(1, maxBars));
  const maxCount = Math.max(1, ...bars.map((cluster) => cluster.count));
  const barWidth = plotWidth / bars.length;

  const parts: string[] = [];
  parts.push(
    svgRect({
      x: hPad,
      y: vPad,
      width: plotWidth,
      height: plotHeight,
      fill: 'none',
      stroke: 'rgba(16,17,17,0.2)',
      'stroke-width': 1,
    })
  );

  bars.forEach((cluster, index) => {
    const barHeight = (cluster.count / maxCount) * plotHeight;
    const x = hPad + index * barWidth;
    const y = vPad + (plotHeight - barHeight);
    parts.push(
      svgRect({
        x: x.toFixed(2),
        y: y.toFixed(2),
        width: Math.max(1, barWidth - 1).toFixed(2),
        height: barHeight.toFixed(2),
        fill: `rgb(${cluster.rgb.r},${cluster.rgb.g},${cluster.rgb.b})`,
      })
    );
  });

  parts.push(
    svgText(
      {
        x: hPad,
        y: vPad + plotHeight + captionSpace - 2,
        'font-family': 'Fira Sans',
        'font-size': fontSize,
        fill: 'rgba(16,17,17,0.55)',
      },
      `Top ${bars.length} clusters • ${formatSortLabel(sortBy)}`
    )
  );

  return {
    svg: svgDocument({
      width,
      height,
      content: parts.join(''),
      attrs: {
        'data-view': 'histogram',
        'data-color-model': 'oklch',
      },
    }),
    width,
    height,
  };
}

export async function generateHistogramPng(
  clusters: AnalysisCluster[],
  options: HistogramOptions & { scale?: number } = {}
): Promise<Blob> {
  const { svg, width, height } = generateHistogramSvg(clusters, options);
  return svgToPngBlob(svg, width, height, options.scale ?? 1);
}

function getHue(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[2];
  }
  return cluster.hsv?.[0] ?? 0;
}

function getLightness(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) {
    return cluster.oklch[0];
  }
  return (cluster.hsv?.[2] ?? 0) / 100;
}

function formatSortLabel(sortBy: 'frequency' | 'hue' | 'lightness'): string {
  if (sortBy === 'hue') return 'sorted by hue';
  if (sortBy === 'lightness') return 'sorted by lightness';
  return 'sorted by frequency';
}
