import type { AnalysisCluster } from '../stores/ui';

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`.toUpperCase();
}

interface PaletteEntry {
  rank: number;
  hex: string;
  rgb: [number, number, number];
  oklch: [number, number, number];
  share: number;
}

interface PaletteJson {
  palette: PaletteEntry[];
  count: number;
}

/**
 * Generate a JSON palette string from cluster data.
 *
 * Output is pretty-printed and deterministic (no timestamps).
 * Each entry includes rank, hex, rgb array, oklch array, and share.
 */
export function generatePaletteJson(clusters: AnalysisCluster[]): string {
  const palette: PaletteEntry[] = clusters.map((c, i) => ({
    rank: i + 1,
    hex: rgbToHex(c.rgb),
    rgb: [c.rgb.r, c.rgb.g, c.rgb.b],
    oklch: [
      Math.round(c.oklch[0] * 1000) / 1000,
      Math.round(c.oklch[1] * 1000) / 1000,
      Math.round(c.oklch[2] * 10) / 10
    ],
    share: Math.round(c.share * 10000) / 10000
  }));

  const output: PaletteJson = { palette, count: clusters.length };
  return JSON.stringify(output, null, 2);
}
