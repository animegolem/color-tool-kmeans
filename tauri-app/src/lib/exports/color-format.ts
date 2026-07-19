import type { AnalysisCluster } from '../stores/ui';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

function toHex(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value)))
    .toString(16)
    .padStart(2, '0');
}

export function rgbToHex(rgb: RgbColor): string {
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

export function clusterHue(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) return cluster.oklch[2];
  return cluster.hsv?.[0] ?? 0;
}

export function clusterLightness(cluster: AnalysisCluster): number {
  if (cluster.oklch && cluster.oklch.length >= 3) return cluster.oklch[0];
  return (cluster.hsv?.[2] ?? 0) / 100;
}

export function contrastStroke(rgb: RgbColor): string {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}
