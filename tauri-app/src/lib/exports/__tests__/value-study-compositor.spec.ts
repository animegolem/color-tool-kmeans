import { describe, expect, it } from 'vitest';
import { composeValueStudy, type ValueStudyInput } from '../value-study-compositor';
import { svgDocument, svgRect } from '../svg';

const STABILITY_RUNS = 10;
const XMLNS_PATTERN = /xmlns(?::xlink)?="https?:\/\/[^"]+"/g;

function assertNoExternalUrls(svg: string) {
  const withoutXmlns = svg.replace(XMLNS_PATTERN, '');
  expect(withoutXmlns).not.toMatch(/https?:\/\//);
}

function makeSvg(width: number, height: number, fill = '#cccccc'): string {
  return svgDocument({
    width,
    height,
    content: svgRect({ x: 0, y: 0, width, height, fill })
  });
}

function makeInput(overrides?: Partial<ValueStudyInput>): ValueStudyInput {
  return {
    col1Svg: makeSvg(925, 1200),
    col2Svg: makeSvg(500, 600),
    ...overrides
  };
}

describe('composeValueStudy', () => {
  it('produces valid SVG with 2 nested tiles', () => {
    const result = composeValueStudy(makeInput());
    expect(result.svg).toContain('<?xml version="1.0"');
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    // Root SVG + 2 nested SVGs for the tiles
    const svgCount = (result.svg.match(/<svg /g) ?? []).length;
    expect(svgCount).toBe(3);
  });

  it('uses default canvas width of 1300px', () => {
    const result = composeValueStudy(makeInput());
    expect(result.width).toBe(1300);
    expect(result.svg).toContain('width="1300"');
  });

  it('respects custom canvas width', () => {
    const result = composeValueStudy(makeInput(), { canvasWidth: 1000 });
    expect(result.width).toBe(1000);
    expect(result.svg).toContain('width="1000"');
  });

  it('uses default background #f8f2e3', () => {
    const result = composeValueStudy(makeInput());
    expect(result.svg).toContain('#f8f2e3');
  });

  it('respects custom background', () => {
    const result = composeValueStudy(makeInput(), { background: '#ffffff' });
    expect(result.svg).toContain('fill="#ffffff"');
    expect(result.svg).not.toContain('#f8f2e3');
  });

  it('vertically centers the shorter column', () => {
    // Col1 is tall (1200h at 925w), col2 is short (200h at 500w)
    const input = makeInput({ col2Svg: makeSvg(500, 200) });
    const result = composeValueStudy(input);
    // The col2 tile should have a y offset > margin (32)
    // Extract all nested <svg y="..." positions
    const yMatches = [...result.svg.matchAll(/<svg x="[^"]*" y="([^"]*)"/g)];
    expect(yMatches.length).toBe(2);
    const col1Y = parseFloat(yMatches[0][1]);
    const col2Y = parseFloat(yMatches[1][1]);
    // Shorter col2 should have a larger y offset
    expect(col2Y).toBeGreaterThan(col1Y);
  });

  it('height is driven by the taller column', () => {
    const result = composeValueStudy(makeInput());
    // Height should be > 2*margin
    expect(result.height).toBeGreaterThan(64);
  });

  it('is deterministic over multiple runs', () => {
    const input = makeInput();
    const results = Array.from({ length: STABILITY_RUNS }, () =>
      composeValueStudy(input).svg
    );
    expect(new Set(results).size).toBe(1);
  });

  it('contains no external URLs (excluding xmlns)', () => {
    const result = composeValueStudy(makeInput());
    assertNoExternalUrls(result.svg);
  });

  it('both columns have viewBox attributes', () => {
    const result = composeValueStudy(makeInput());
    const viewBoxCount = (result.svg.match(/viewBox="/g) ?? []).length;
    // Root SVG viewBox + 2 nested tile viewBoxes
    expect(viewBoxCount).toBe(3);
  });
});
