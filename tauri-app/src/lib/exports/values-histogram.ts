import { svgDocument, svgRect } from './svg';
import { grayFill } from './value-analysis';

export interface ValuesHistogramOptions {
  width?: number;
  height?: number;
  barGap?: number;
  barRadius?: number;
  showBarStroke?: boolean;
}

export interface ValuesHistogramResult {
  svg: string;
  width: number;
  height: number;
}

/**
 * Raw SVG <rect> elements with origin (0,0). For embedding in a compositor.
 */
export function generateValuesHistogramBars(
  bins: number[],
  options: ValuesHistogramOptions = {}
): string {
  const width = options.width ?? 520;
  const height = options.height ?? 44;
  const barGap = options.barGap ?? 4;
  const barRadius = options.barRadius ?? 4;
  const showBarStroke = options.showBarStroke ?? true;

  if (!bins.length) return '';

  const maxCount = Math.max(...bins, 1);
  const barWidth = (width - barGap * (bins.length - 1)) / bins.length;
  const parts: string[] = [];

  for (let i = 0; i < bins.length; i++) {
    const count = bins[i];
    if (count === 0) continue;

    const heightPct = count / maxCount;
    const barH = Math.max(
      Math.round(height * 0.02),
      Math.round(height * heightPct)
    );
    const barX = i * (barWidth + barGap);
    const barY = height - barH;
    const fill = grayFill(i / (bins.length - 1));

    const attrs: Record<string, string | number> = {
      x: barX,
      y: barY,
      width: Math.max(1, Math.round(barWidth)),
      height: barH,
      fill,
      rx: barRadius,
    };

    if (showBarStroke) {
      attrs.stroke = 'rgba(33,33,32,0.15)';
      attrs['stroke-width'] = 1;
    }

    parts.push(svgRect(attrs));
  }

  return parts.join('');
}

/**
 * Full SVG document for inline {@html} rendering.
 */
export function generateValuesHistogramSvg(
  bins: number[],
  options: ValuesHistogramOptions = {}
): ValuesHistogramResult {
  const width = options.width ?? 520;
  const height = options.height ?? 44;

  const content = generateValuesHistogramBars(bins, options);

  return {
    svg: svgDocument({ width, height, content }),
    width,
    height,
  };
}
