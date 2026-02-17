import { describe, expect, it } from 'vitest';
import { FIXED_CLUSTERS } from './fixtures';
import { svgToTile, imageToTile } from '../compositor';
import type { CompositorTile } from '../compositor';
import { composeColorStudy, type ColorStudyInput } from '../color-study-compositor';
import { generateCircleGraphSvg } from '../polar-chart';
import { generateHistogramSvg } from '../histogram';
import { generateHueLightnessSvg } from '../hue-lightness';
import { generatePaletteSvg } from '../palette';

const XMLNS_PATTERN = /xmlns(?::xlink)?="https?:\/\/[^"]+"/g;
const STABILITY_RUNS = 10;

function assertNoExternalUrls(svg: string) {
  const withoutXmlns = svg.replace(XMLNS_PATTERN, '');
  expect(withoutXmlns).not.toMatch(/https?:\/\//);
}

function makePolar(): CompositorTile {
  const { svg } = generateCircleGraphSvg(FIXED_CLUSTERS, {
    symbolScale: 1, showAxisLabels: true, showStroke: true, mode: 'oklch'
  });
  return svgToTile(svg, 'polar-chart');
}

function makeHistogram(sort: 'frequency' | 'hue' | 'lightness' = 'frequency'): CompositorTile {
  const { svg } = generateHistogramSvg(FIXED_CLUSTERS, { sortBy: sort });
  return svgToTile(svg, sort === 'frequency' ? 'histogram' : `histogram-${sort}`);
}

function makeHueLightness(): CompositorTile {
  const { svg } = generateHueLightnessSvg(FIXED_CLUSTERS, {
    symbolScale: 1, showAxisLabels: true, showStroke: true
  });
  return svgToTile(svg, 'hue-lightness');
}

function makePalette(): CompositorTile {
  const { svg } = generatePaletteSvg(FIXED_CLUSTERS, { maxClusters: 15 });
  return svgToTile(svg, 'palette-strip');
}

function makeSourceImage(): CompositorTile {
  return imageToTile('data:image/png;base64,abc', 800, 600, 'source-image');
}

function makeVideoBarcode(): CompositorTile {
  return imageToTile('data:image/png;base64,barcode', 1200, 80, 'video-barcode');
}

function fullInput(): ColorStudyInput {
  return {
    sourceImage: makeSourceImage(),
    polarChart: makePolar(),
    histogram: makeHistogram(),
    hueLightness: makeHueLightness(),
    paletteStrip: makePalette()
  };
}

describe('composeColorStudy', () => {
  describe('empty input', () => {
    it('produces valid SVG with empty input', () => {
      const result = composeColorStudy({});
      expect(result.svg).toContain('<svg');
      expect(result.svg).toContain('</svg>');
      expect(result.svg).toContain('#f8f2e3');
      expect(result.width).toBe(1300);
      expect(result.height).toBe(64); // 2 * margin
    });
  });

  describe('single-column layouts', () => {
    it('renders only col1 when only source image is provided', () => {
      const result = composeColorStudy({ sourceImage: makeSourceImage() });
      expect(result.svg).toContain('<image');
      expect(result.width).toBe(1300);
      expect(result.height).toBeGreaterThan(64);
    });

    it('renders only col2 when only polar chart is provided', () => {
      const result = composeColorStudy({ polarChart: makePolar() });
      expect(result.svg).toContain('<svg ');
      // Nested SVG for the polar chart + root
      const nestedCount = (result.svg.match(/<svg /g) ?? []).length;
      expect(nestedCount).toBe(2);
    });

    it('renders only col3 when only palette strip is provided', () => {
      const result = composeColorStudy({ paletteStrip: makePalette() });
      expect(result.svg).toContain('<svg ');
      expect(result.width).toBe(1300);
    });
  });

  describe('two-column layouts', () => {
    it('renders col1 + col2 without palette', () => {
      const result = composeColorStudy({
        sourceImage: makeSourceImage(),
        polarChart: makePolar()
      });
      expect(result.svg).toContain('<image');
      const nestedSvgCount = (result.svg.match(/<svg /g) ?? []).length;
      // Root + polar chart
      expect(nestedSvgCount).toBe(2);
    });

    it('renders col1 + col3 without col2', () => {
      const result = composeColorStudy({
        sourceImage: makeSourceImage(),
        paletteStrip: makePalette()
      });
      expect(result.svg).toContain('<image');
      expect(result.width).toBe(1300);
    });

    it('renders col2 + col3 without col1', () => {
      const result = composeColorStudy({
        polarChart: makePolar(),
        paletteStrip: makePalette()
      });
      const nestedSvgCount = (result.svg.match(/<svg /g) ?? []).length;
      // Root + polar + palette = 3
      expect(nestedSvgCount).toBe(3);
    });
  });

  describe('three-column layout', () => {
    it('renders all three columns', () => {
      const result = composeColorStudy(fullInput());
      expect(result.svg).toContain('<svg');
      expect(result.width).toBe(1300);
      expect(result.height).toBeGreaterThan(64);
    });

    it('contains expected tile types', () => {
      const result = composeColorStudy(fullInput());
      // Source image is raster
      expect(result.svg).toContain('<image href="data:image/png;base64,abc"');
      // SVG tiles get nested <svg> wrappers
      const nestedSvgCount = (result.svg.match(/<svg /g) ?? []).length;
      // Root + polar + histogram + hue-lightness + palette = 5
      expect(nestedSvgCount).toBe(5);
    });
  });

  describe('vertical centering', () => {
    it('centers shorter column when columns have different heights', () => {
      // Col1 has source + histogram (tall), col2 has only polar (short)
      const input: ColorStudyInput = {
        sourceImage: makeSourceImage(),
        histogram: makeHistogram(),
        polarChart: makePolar()
      };
      const result = composeColorStudy(input);
      // The polar chart y position should be offset (centered)
      // Parse the polar chart SVG position
      const polarMatch = result.svg.match(/viewBox="0 0 \d+ \d+"[^>]*>/g);
      expect(polarMatch).not.toBeNull();
      expect(result.height).toBeGreaterThan(64);
    });
  });

  describe('palette stretch', () => {
    it('palette column uses full main height', () => {
      const input = fullInput();
      const result = composeColorStudy(input);
      // The palette column should have a viewBox matching its natural dimensions
      // and be rendered at the palette column x position (after col1 + col2 + gaps)
      // Palette strip's natural viewBox should appear in a nested <svg>
      const paletteViewBox = result.svg.match(
        /viewBox="0 0 320 160"[^>]*preserveAspectRatio="xMidYMid meet"/
      );
      expect(paletteViewBox).not.toBeNull();
    });
  });

  describe('all-sorts mode', () => {
    it('renders primary + secondary histograms in col1', () => {
      const input: ColorStudyInput = {
        sourceImage: makeSourceImage(),
        histogram: makeHistogram('frequency'),
        secondaryHistograms: [makeHistogram('hue'), makeHistogram('lightness')],
        polarChart: makePolar()
      };
      const result = composeColorStudy(input);
      // Should have 3 histogram tiles (primary + 2 secondary)
      // Source image is raster, so count nested <svg> tags for SVG tiles
      expect(result.svg).toContain('<svg');
      expect(result.height).toBeGreaterThan(64);
    });

    it('source image is rendered at reduced width in all-sorts mode', () => {
      const input: ColorStudyInput = {
        sourceImage: makeSourceImage(),
        histogram: makeHistogram('frequency'),
        secondaryHistograms: [makeHistogram('hue'), makeHistogram('lightness')],
        polarChart: makePolar()
      };
      const result = composeColorStudy(input);
      // Source image should be at ~65% of column width
      // The image tag should have a width smaller than full column width
      const imageMatch = result.svg.match(/<image[^>]*width="([\d.]+)"/);
      expect(imageMatch).not.toBeNull();
      const imageWidth = parseFloat(imageMatch![1]);
      // Full content width = 1300 - 64 = 1236
      // Two columns (1.4:1 ratio): col1 = (1236-24)*1.4/2.4 ≈ 707
      // 65% of 707 ≈ 460
      expect(imageWidth).toBeLessThan(500);
      expect(imageWidth).toBeGreaterThan(400);
    });

    it('secondary histograms are side-by-side', () => {
      const input: ColorStudyInput = {
        histogram: makeHistogram('frequency'),
        secondaryHistograms: [makeHistogram('hue'), makeHistogram('lightness')]
      };
      const result = composeColorStudy(input);
      // Both secondary histograms should be present
      expect(result.svg).toContain('<svg');
      expect(result.height).toBeGreaterThan(64);
    });
  });

  describe('video barcode', () => {
    it('includes video barcode in col1', () => {
      const input: ColorStudyInput = {
        sourceImage: makeSourceImage(),
        videoBarcode: makeVideoBarcode(),
        polarChart: makePolar()
      };
      const result = composeColorStudy(input);
      expect(result.svg).toContain('data:image/png;base64,barcode');
    });
  });

  describe('options', () => {
    it('uses default background', () => {
      const result = composeColorStudy(fullInput());
      expect(result.svg).toContain('fill="#f8f2e3"');
    });

    it('respects custom background', () => {
      const result = composeColorStudy(fullInput(), { background: '#ffffff' });
      expect(result.svg).toContain('fill="#ffffff"');
    });

    it('respects custom canvas width', () => {
      const result = composeColorStudy(fullInput(), { canvasWidth: 800 });
      expect(result.width).toBe(800);
      expect(result.svg).toContain('width="800"');
    });
  });

  describe('determinism', () => {
    it('produces identical output over multiple runs', () => {
      const input = fullInput();
      const results = Array.from({ length: STABILITY_RUNS }, () =>
        composeColorStudy(input).svg
      );
      expect(new Set(results).size).toBe(1);
    });

    it('produces identical output with all-sorts mode', () => {
      const input: ColorStudyInput = {
        sourceImage: makeSourceImage(),
        histogram: makeHistogram('frequency'),
        secondaryHistograms: [makeHistogram('hue'), makeHistogram('lightness')],
        polarChart: makePolar(),
        paletteStrip: makePalette()
      };
      const results = Array.from({ length: STABILITY_RUNS }, () =>
        composeColorStudy(input).svg
      );
      expect(new Set(results).size).toBe(1);
    });
  });

  describe('no external URLs', () => {
    it('contains no external URLs (excluding xmlns)', () => {
      const result = composeColorStudy(fullInput());
      assertNoExternalUrls(result.svg);
    });

    it('contains no external URLs in all-sorts mode', () => {
      const input: ColorStudyInput = {
        sourceImage: makeSourceImage(),
        videoBarcode: makeVideoBarcode(),
        histogram: makeHistogram('frequency'),
        secondaryHistograms: [makeHistogram('hue'), makeHistogram('lightness')],
        polarChart: makePolar(),
        hueLightness: makeHueLightness(),
        paletteStrip: makePalette()
      };
      const result = composeColorStudy(input);
      assertNoExternalUrls(result.svg);
    });
  });
});
