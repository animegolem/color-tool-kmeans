import { describe, it, expect } from 'vitest';
import { generateHueLightnessSvg } from '../hue-lightness';
import type { AnalysisCluster } from '../../stores/analysis';

function makeCluster(share: number, oklch: [number, number, number]): AnalysisCluster {
  return {
    count: Math.round(share * 100_000),
    share,
    centroidSpace: [0, 0, 0],
    oklab: [oklch[0], 0, 0],
    oklch,
    rgb: { r: 128, g: 128, b: 128 },
    hsv: [oklch[2], oklch[1] * 100, oklch[0] * 100]
  };
}

function circleRadii(svg: string): number[] {
  return [...svg.matchAll(/<circle[^>]*\br="([\d.]+)"/g)].map((m) => Number(m[1]));
}

describe('generateHueLightnessSvg frequency sizing', () => {
  it('renders visibly larger markers for larger shares', () => {
    const clusters = [
      makeCluster(0.5, [0.7, 0.1, 30]),
      makeCluster(0.05, [0.5, 0.1, 120]),
      makeCluster(0.005, [0.3, 0.1, 240])
    ];
    const { svg } = generateHueLightnessSvg(clusters, {
      symbolScale: 1,
      sizeMode: 'frequency'
    });
    const [large, mid, small] = circleRadii(svg);
    expect(large).toBeGreaterThan(mid);
    expect(mid).toBeGreaterThan(small);
    // sqrt scaling normalized to max share: ratios sqrt(10) apart
    expect(large / mid).toBeCloseTo(Math.sqrt(10), 1);
    // largest cluster fills the full symbol radius, not the 2px floor
    expect(large).toBeGreaterThan(10);
  });

  it('varies marker size at high cluster counts (K=300 regression)', () => {
    const clusters = [
      makeCluster(0.1, [0.7, 0.1, 30]),
      ...Array.from({ length: 299 }, (_, i) =>
        makeCluster(0.9 / 299, [0.5, 0.05, (i * 360) / 299])
      )
    ];
    const { svg } = generateHueLightnessSvg(clusters, {
      symbolScale: 1,
      sizeMode: 'frequency'
    });
    const radii = circleRadii(svg);
    const distinct = new Set(radii);
    // pre-fix every radius clamped to the 2px floor; dominant cluster must stand out
    expect(distinct.size).toBeGreaterThan(1);
    expect(Math.max(...radii)).toBeGreaterThan(2 * Math.min(...radii));
  });

  it('keeps chroma mode normalization unchanged', () => {
    const clusters = [
      makeCluster(0.5, [0.7, 0.2, 30]),
      makeCluster(0.5, [0.5, 0.05, 120])
    ];
    const { svg } = generateHueLightnessSvg(clusters, {
      symbolScale: 1,
      sizeMode: 'chroma'
    });
    const [highChroma, lowChroma] = circleRadii(svg);
    expect(highChroma).toBeGreaterThan(lowChroma);
    expect(lowChroma / highChroma).toBeCloseTo(0.25, 1);
  });
});
