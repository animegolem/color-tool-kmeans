import { describe, expect, it } from 'vitest';
import { FIXED_CLUSTERS } from './fixtures';
import { generatePaletteCsv, generatePaletteSvg } from '../palette';
import { generateCircleGraphSvg } from '../polar-chart';
import type { PolarMode } from '../polar-chart';
import { generateHistogramSvg } from '../histogram';
import { generateHueLightnessSvg } from '../hue-lightness';

const STABILITY_RUNS = 10;
const XMLNS_PATTERN = /xmlns(?::xlink)?="https?:\/\/[^"]+"/g;

function assertValidSvg(svg: string, expectedWidth: number, expectedHeight: number) {
  expect(svg).toMatch(/^<\?xml version="1\.0"/);
  expect(svg).toContain('<svg');
  expect(svg).toContain('</svg>');
  expect(svg).toContain(`width="${expectedWidth}"`);
  expect(svg).toContain(`height="${expectedHeight}"`);
}

function assertNoExternalUrls(svg: string) {
  const withoutXmlns = svg.replace(XMLNS_PATTERN, '');
  expect(withoutXmlns).not.toMatch(/https?:\/\//);
}

describe('generatePaletteCsv determinism', () => {
  it('produces identical output on repeated calls', () => {
    const a = generatePaletteCsv(FIXED_CLUSTERS);
    const b = generatePaletteCsv(FIXED_CLUSTERS);
    expect(a).toBe(b);
  });

  it('is stable over N runs', () => {
    const results = Array.from({ length: STABILITY_RUNS }, () =>
      generatePaletteCsv(FIXED_CLUSTERS)
    );
    expect(new Set(results).size).toBe(1);
  });

  it('contains header and correct row count', () => {
    const csv = generatePaletteCsv(FIXED_CLUSTERS);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(FIXED_CLUSTERS.length + 1);
    expect(lines[0]).toContain('rank');
  });

  it('handles empty cluster array', () => {
    const csv = generatePaletteCsv([]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(1);
  });

  it('handles single cluster', () => {
    const csv = generatePaletteCsv([FIXED_CLUSTERS[0]]);
    const lines = csv.trim().split('\n');
    expect(lines).toHaveLength(2);
  });
});

describe('generatePaletteSvg determinism', () => {
  it('produces identical output on repeated calls', () => {
    const a = generatePaletteSvg(FIXED_CLUSTERS);
    const b = generatePaletteSvg(FIXED_CLUSTERS);
    expect(a.svg).toBe(b.svg);
  });

  it('is stable over N runs', () => {
    const results = Array.from({ length: STABILITY_RUNS }, () =>
      generatePaletteSvg(FIXED_CLUSTERS).svg
    );
    expect(new Set(results).size).toBe(1);
  });

  it('produces valid SVG structure', () => {
    const { svg, width, height } = generatePaletteSvg(FIXED_CLUSTERS);
    assertValidSvg(svg, width, height);
  });

  it('contains no external URLs', () => {
    const { svg } = generatePaletteSvg(FIXED_CLUSTERS);
    assertNoExternalUrls(svg);
  });

  it('handles empty cluster array', () => {
    const { svg } = generatePaletteSvg([]);
    expect(svg).toContain('<svg');
  });
});

describe('generateCircleGraphSvg determinism', () => {
  const baseOpts = { symbolScale: 1.0, showAxisLabels: true, showStroke: true };

  for (const mode of ['oklch', 'okhsv', 'hsv'] as PolarMode[]) {
    describe(`mode=${mode}`, () => {
      const opts = { ...baseOpts, mode };

      it('produces identical output on repeated calls', () => {
        const a = generateCircleGraphSvg(FIXED_CLUSTERS, opts);
        const b = generateCircleGraphSvg(FIXED_CLUSTERS, opts);
        expect(a.svg).toBe(b.svg);
      });

      it('is stable over N runs', () => {
        const results = Array.from({ length: STABILITY_RUNS }, () =>
          generateCircleGraphSvg(FIXED_CLUSTERS, opts).svg
        );
        expect(new Set(results).size).toBe(1);
      });

      it('produces valid SVG structure', () => {
        const { svg, width, height } = generateCircleGraphSvg(FIXED_CLUSTERS, opts);
        assertValidSvg(svg, width, height);
        expect(svg).toContain(`data-color-model="${mode}"`);
      });

      it('contains no external URLs', () => {
        const { svg } = generateCircleGraphSvg(FIXED_CLUSTERS, opts);
        assertNoExternalUrls(svg);
      });
    });
  }

  it('handles empty cluster array', () => {
    const { svg } = generateCircleGraphSvg([], baseOpts);
    expect(svg).toContain('<svg');
  });

  it('handles single cluster', () => {
    const { svg } = generateCircleGraphSvg([FIXED_CLUSTERS[0]], baseOpts);
    expect(svg).toContain('<circle');
  });

  it('handles cluster with share ≈ 0', () => {
    const tiny = { ...FIXED_CLUSTERS[4], share: 0.0001 };
    const { svg } = generateCircleGraphSvg([tiny], baseOpts);
    expect(svg).toContain('<circle');
  });
});

describe('generateHistogramSvg determinism', () => {
  for (const sortBy of ['frequency', 'hue', 'lightness'] as const) {
    describe(`sortBy=${sortBy}`, () => {
      const opts = { sortBy };

      it('produces identical output on repeated calls', () => {
        const a = generateHistogramSvg(FIXED_CLUSTERS, opts);
        const b = generateHistogramSvg(FIXED_CLUSTERS, opts);
        expect(a.svg).toBe(b.svg);
      });

      it('is stable over N runs', () => {
        const results = Array.from({ length: STABILITY_RUNS }, () =>
          generateHistogramSvg(FIXED_CLUSTERS, opts).svg
        );
        expect(new Set(results).size).toBe(1);
      });

      it('produces valid SVG structure', () => {
        const { svg, width, height } = generateHistogramSvg(FIXED_CLUSTERS, opts);
        assertValidSvg(svg, width, height);
        expect(svg).toContain('data-view="histogram"');
      });

      it('contains no external URLs', () => {
        const { svg } = generateHistogramSvg(FIXED_CLUSTERS, opts);
        assertNoExternalUrls(svg);
      });
    });
  }

  it('handles empty cluster array', () => {
    const { svg } = generateHistogramSvg([]);
    expect(svg).toContain('<svg');
  });

  it('handles single cluster', () => {
    const { svg } = generateHistogramSvg([FIXED_CLUSTERS[0]]);
    expect(svg).toContain('<rect');
  });
});

describe('generateHueLightnessSvg determinism', () => {
  const baseOpts = { symbolScale: 1.0, showAxisLabels: true, showStroke: true };

  for (const sizeMode of ['frequency', 'chroma'] as const) {
    describe(`sizeMode=${sizeMode}`, () => {
      const opts = { ...baseOpts, sizeMode };

      it('produces identical output on repeated calls', () => {
        const a = generateHueLightnessSvg(FIXED_CLUSTERS, opts);
        const b = generateHueLightnessSvg(FIXED_CLUSTERS, opts);
        expect(a.svg).toBe(b.svg);
      });

      it('is stable over N runs', () => {
        const results = Array.from({ length: STABILITY_RUNS }, () =>
          generateHueLightnessSvg(FIXED_CLUSTERS, opts).svg
        );
        expect(new Set(results).size).toBe(1);
      });

      it('produces valid SVG structure', () => {
        const { svg, width, height } = generateHueLightnessSvg(FIXED_CLUSTERS, opts);
        assertValidSvg(svg, width, height);
        expect(svg).toContain('data-view="hue-lightness"');
      });

      it('contains no external URLs', () => {
        const { svg } = generateHueLightnessSvg(FIXED_CLUSTERS, opts);
        assertNoExternalUrls(svg);
      });
    });
  }

  it('handles empty cluster array', () => {
    const { svg } = generateHueLightnessSvg([], baseOpts);
    expect(svg).toContain('<svg');
  });

  it('handles single cluster', () => {
    const { svg } = generateHueLightnessSvg([FIXED_CLUSTERS[0]], baseOpts);
    expect(svg).toContain('<circle');
  });
});

// PNG determinism: explicitly skipped.
// Canvas rendering is platform-dependent (OffscreenCanvas/HTMLCanvasElement
// encode differently across browsers and OSes). SVG determinism covers the
// semantic content; PNG is just a rasterization of the SVG.
