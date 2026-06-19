import { describe, expect, it } from 'vitest';
import { FIXED_CLUSTERS } from './fixtures';
import {
  extractSvgInner,
  parseSvgDimensions,
  svgToTile,
  imageToTile,
  computeGridLayout,
  composeTiles,
  type CompositorTile
} from '../compositor';
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

function buildRealisticTiles(): CompositorTile[] {
  const polar = generateCircleGraphSvg(FIXED_CLUSTERS, {
    symbolScale: 1,
    showAxisLabels: true,
    showStroke: true,
    mode: 'oklch'
  });
  const histogram = generateHistogramSvg(FIXED_CLUSTERS, { sortBy: 'frequency' });
  const hueLightness = generateHueLightnessSvg(FIXED_CLUSTERS, {
    symbolScale: 1,
    showAxisLabels: true,
    showStroke: true
  });
  const palette = generatePaletteSvg(FIXED_CLUSTERS);

  return [
    svgToTile(polar.svg, 'polar-chart'),
    svgToTile(histogram.svg, 'histogram'),
    svgToTile(hueLightness.svg, 'hue-lightness'),
    svgToTile(palette.svg, 'palette-strip')
  ];
}

describe('extractSvgInner', () => {
  it('strips XML declaration and outer svg wrapper', () => {
    const input =
      '<?xml version="1.0" encoding="UTF-8"?>' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">' +
      '<rect x="0" y="0" width="100" height="100" />' +
      '</svg>';
    const inner = extractSvgInner(input);
    expect(inner).not.toContain('<?xml');
    expect(inner).not.toMatch(/^<svg/);
    expect(inner).not.toMatch(/<\/svg>$/);
    expect(inner).toContain('<rect');
  });

  it('handles SVG without XML declaration', () => {
    const input =
      '<svg width="50" height="50"><circle cx="25" cy="25" r="10" /></svg>';
    const inner = extractSvgInner(input);
    expect(inner).toBe('<circle cx="25" cy="25" r="10" />');
  });
});

describe('parseSvgDimensions', () => {
  it('extracts width and height', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="620" height="360"><rect /></svg>';
    const { width, height } = parseSvgDimensions(svg);
    expect(width).toBe(620);
    expect(height).toBe(360);
  });

  it('returns 0 for missing dimensions', () => {
    const { width, height } = parseSvgDimensions('<svg><rect /></svg>');
    expect(width).toBe(0);
    expect(height).toBe(0);
  });
});

describe('computeGridLayout', () => {
  it.each([
    [0, 1, 1],
    [1, 1, 1],
    [2, 2, 1],
    [3, 2, 2],
    [4, 2, 2],
    [5, 3, 2],
    [6, 3, 2]
  ])('count=%i → cols=%i, rows=%i', (count, expectedCols, expectedRows) => {
    const { cols, rows } = computeGridLayout(count);
    expect(cols).toBe(expectedCols);
    expect(rows).toBe(expectedRows);
  });
});

describe('imageToTile', () => {
  it('stores escaped data URL and marks as raster', () => {
    const tile = imageToTile('data:image/png;base64,abc', 100, 80, 'test-image');
    expect(tile.key).toBe('test-image');
    expect(tile.width).toBe(100);
    expect(tile.height).toBe(80);
    expect(tile.isRaster).toBe(true);
    expect(tile.svgContent).toBe('data:image/png;base64,abc');
    expect(tile.svgContent).not.toContain('<image');
  });

  it('emits root-level <image> when composed', () => {
    const tile = imageToTile('data:image/png;base64,abc', 100, 80, 'test-image');
    const result = composeTiles([tile]);
    expect(result.svg).toContain('<image href="data:image/png;base64,abc"');
    // No nested <svg> wrapper for raster tiles — only root <svg>
    const nestedSvgCount = (result.svg.match(/<svg /g) ?? []).length;
    expect(nestedSvgCount).toBe(1);
  });
});

describe('composeTiles', () => {
  it('produces valid SVG with 0 tiles', () => {
    const result = composeTiles([]);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    expect(result.svg).toContain('#f8f2e3');
    expect(result.width).toBe(1200);
  });

  it('produces valid SVG with 1 tile', () => {
    const tiles = buildRealisticTiles().slice(0, 1);
    const result = composeTiles(tiles);
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    const nestedSvgCount = (result.svg.match(/<svg /g) ?? []).length;
    // Root <svg> + 1 nested tile
    expect(nestedSvgCount).toBe(2);
  });

  it('produces 2×2 grid for 4 tiles', () => {
    const tiles = buildRealisticTiles();
    const result = composeTiles(tiles);
    expect(result.svg).toContain('<svg');
    const nestedSvgCount = (result.svg.match(/<svg /g) ?? []).length;
    // Root <svg> + 4 nested tiles
    expect(nestedSvgCount).toBe(5);
  });

  it('background rect uses correct fill color', () => {
    const result = composeTiles([], { background: '#ff0000' });
    expect(result.svg).toContain('fill="#ff0000"');
  });

  it('uses default background when not specified', () => {
    const result = composeTiles([]);
    expect(result.svg).toContain('fill="#f8f2e3"');
  });

  it('contains no external URLs (excluding xmlns)', () => {
    const tiles = buildRealisticTiles();
    const result = composeTiles(tiles);
    assertNoExternalUrls(result.svg);
  });

  it('is deterministic over N runs', () => {
    const tiles = buildRealisticTiles();
    const results = Array.from({ length: STABILITY_RUNS }, () =>
      composeTiles(tiles).svg
    );
    expect(new Set(results).size).toBe(1);
  });

  it('respects custom canvas width', () => {
    const tiles = buildRealisticTiles().slice(0, 2);
    const result = composeTiles(tiles, { canvasWidth: 800 });
    expect(result.width).toBe(800);
    expect(result.svg).toContain('width="800"');
  });
});

describe('svgToTile', () => {
  it('extracts inner content and dimensions from a full SVG', () => {
    const { svg, width, height } = generateCircleGraphSvg(FIXED_CLUSTERS, {
      symbolScale: 1,
      mode: 'oklch'
    });
    const tile = svgToTile(svg, 'polar');
    expect(tile.key).toBe('polar');
    expect(tile.width).toBe(width);
    expect(tile.height).toBe(height);
    expect(tile.svgContent).not.toContain('<?xml');
    expect(tile.svgContent).not.toMatch(/^<svg/);
  });
});
