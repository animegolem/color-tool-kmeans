import { svgToPngBlob } from './png';
import { getFsBridge } from '../bridges/fs';

export interface ChartOutput {
  svg: string;
  width: number;
  height: number;
}

/**
 * Save a single chart SVG as PNG or SVG via the native save dialog.
 * Shared by the Exports-view runners and the in-context chart menus
 * (IMP-153). Returns the dialog result so callers can report status.
 */
export async function saveChart(
  format: 'png' | 'svg',
  chart: ChartOutput,
  baseName: string,
  suffix: string,
  scale = 2
): Promise<{ canceled: boolean }> {
  const bridge = await getFsBridge();
  if (format === 'svg') {
    const blob = new Blob([chart.svg], { type: 'image/svg+xml;charset=utf-8' });
    return bridge.saveBlob(blob, `${baseName}-${suffix}.svg`);
  }
  const clampedScale = Math.max(1, Math.min(4, scale));
  const blob = await svgToPngBlob(
    chart.svg,
    chart.width,
    chart.height,
    clampedScale
  );
  return bridge.saveBlob(blob, `${baseName}-${suffix}.png`);
}
