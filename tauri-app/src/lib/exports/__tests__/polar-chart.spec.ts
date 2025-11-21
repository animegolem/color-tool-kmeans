import { describe, expect, it } from 'vitest';
import { generateCircleGraphSvg } from '../polar-chart';

const sampleClusters = [
  {
    count: 100,
    share: 0.5,
    centroidSpace: [0, 0, 0],
    rgb: { r: 255, g: 0, b: 0 },
    hsv: [0, 1, 1]
  },
  {
    count: 100,
    share: 0.5,
    centroidSpace: [0, 0, 0],
    rgb: { r: 0, g: 0, b: 255 },
    hsv: [240, 1, 1]
  }
] as any;

describe('generateCircleGraphSvg', () => {
  it('includes style block when font CSS is provided', () => {
    const fontCss = '@font-face { font-family: test; }';
    const { svg } = generateCircleGraphSvg(sampleClusters, {
      axisType: 'HSL',
      symbolScale: 1,
      showAxisLabels: true,
      fontCss
    });
    expect(svg).toContain('<style>');
    expect(svg).toContain(fontCss);
  });
});
