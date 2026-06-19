import { describe, expect, it } from 'vitest';
import { generateNotanStudySvg, generateSingleCellSvg, type NotanCellData, type NotanStudyInput } from '../notan-study';

// Minimal 1×1 PNG data URL for testing (avoids needing real images)
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makeCell(bucketValues: number[], counts: number[]): NotanCellData {
  return {
    previewSrc: TINY_PNG,
    previewWidth: 400,
    previewHeight: 300,
    bucketValues,
    counts
  };
}

function makeInput(overrides?: Partial<NotanStudyInput>): NotanStudyInput {
  return {
    cells: [
      makeCell([0.2, 0.8], [280, 720]),
      makeCell([0.15, 0.5, 0.85], [200, 350, 450]),
      makeCell([0.1, 0.35, 0.65, 0.9], [180, 220, 300, 300]),
      makeCell([0.08, 0.28, 0.5, 0.72, 0.92], [170, 170, 210, 220, 230])
    ],
    ...overrides
  };
}

const XMLNS_PATTERN = /xmlns(?::xlink)?="https?:\/\/[^"]+"/g;

function assertNoExternalUrls(svg: string) {
  const withoutXmlns = svg.replace(XMLNS_PATTERN, '');
  expect(withoutXmlns).not.toMatch(/https?:\/\//);
}

describe('generateNotanStudySvg', () => {
  it('produces valid SVG document', async () => {
    const result = await generateNotanStudySvg(makeInput());
    expect(result.svg).toContain('<?xml version="1.0"');
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    expect(result.width).toBeGreaterThan(0);
    expect(result.height).toBeGreaterThan(0);
  });

  it('contains 4 image elements for 4 cells', async () => {
    const result = await generateNotanStudySvg(makeInput());
    const imageCount = (result.svg.match(/<image /g) ?? []).length;
    expect(imageCount).toBe(4);
  });

  it('contains bucket strip segments for all cells', async () => {
    const result = await generateNotanStudySvg(makeInput());
    // Total bucket segments: 2 + 3 + 4 + 5 = 14 (plain <rect> inside clip groups)
    // Plus 4 background rects for bucket containers + 1 background rect = 19 rects minimum
    const rectCount = (result.svg.match(/<rect /g) ?? []).length;
    expect(rectCount).toBeGreaterThanOrEqual(14 + 4 + 1);
  });

  it('is deterministic over multiple runs', async () => {
    const input = makeInput();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => generateNotanStudySvg(input))
    );
    const svgs = results.map(r => r.svg);
    expect(new Set(svgs).size).toBe(1);
  });

  it('uses default background #f8f2e3', async () => {
    const result = await generateNotanStudySvg(makeInput());
    expect(result.svg).toContain('#f8f2e3');
  });

  it('respects custom background color', async () => {
    const result = await generateNotanStudySvg(makeInput({ background: '#ffffff' }));
    expect(result.svg).toContain('#ffffff');
    expect(result.svg).not.toContain('#f8f2e3');
  });

  it('renders percentage labels for wide segments', async () => {
    // Cell with 2 buckets: 28%/72% — both segments should be wide enough for labels
    const result = await generateNotanStudySvg(makeInput());
    expect(result.svg).toContain('28%');
    expect(result.svg).toContain('72%');
  });

  it('omits percentage labels for narrow segments', async () => {
    // Create a cell with one tiny bucket that should not get a label
    const tinyCell = makeCell([0.1, 0.5, 0.9], [1, 1, 9998]);
    const input = makeInput({
      cells: [tinyCell, tinyCell, tinyCell, tinyCell]
    });
    const result = await generateNotanStudySvg(input);
    // The 0% labels should not appear (segments too narrow)
    // But the dominant ~100% label should appear
    const textMatches = result.svg.match(/<text [^>]*>(\d+%)<\/text>/g) ?? [];
    // At least some labels rendered for the large segment
    expect(textMatches.length).toBeGreaterThan(0);
    // No "0%" labels (the tiny segments)
    expect(result.svg).not.toMatch(/<text [^>]*>0%<\/text>/);
  });

  it('output dimensions match expected 2×2 grid layout', async () => {
    const result = await generateNotanStudySvg(makeInput());
    const widthMatch = result.svg.match(/width="(\d+)"/);
    const heightMatch = result.svg.match(/height="(\d+)"/);
    expect(widthMatch).not.toBeNull();
    expect(heightMatch).not.toBeNull();
    expect(Number(widthMatch![1])).toBe(result.width);
    expect(Number(heightMatch![1])).toBe(result.height);

    // Fixed canvas width (1800px), height from aspect ratio
    expect(result.width).toBe(1800);

    // Height should include 2 rows of cells + strips + margins
    expect(result.height).toBeGreaterThan(result.width * 0.6);
  });

  it('contains clip-path definitions for bucket strips and images', async () => {
    const result = await generateNotanStudySvg(makeInput());
    expect(result.svg).toContain('clipPath');
    // 4 bucket strip clips + 4 image clips = 8
    const clipPathCount = (result.svg.match(/<clipPath/g) ?? []).length;
    expect(clipPathCount).toBe(8);
  });

  it('contains no external URLs (excluding xmlns)', async () => {
    const result = await generateNotanStudySvg(makeInput());
    assertNoExternalUrls(result.svg);
  });

  it('handles cells with different dimensions gracefully', async () => {
    const input: NotanStudyInput = {
      cells: [
        { ...makeCell([0.2, 0.8], [300, 700]), previewWidth: 300, previewHeight: 200 },
        { ...makeCell([0.2, 0.5, 0.8], [200, 400, 400]), previewWidth: 400, previewHeight: 300 },
        { ...makeCell([0.1, 0.4, 0.6, 0.9], [250, 250, 250, 250]), previewWidth: 350, previewHeight: 280 },
        { ...makeCell([0.1, 0.3, 0.5, 0.7, 0.9], [200, 200, 200, 200, 200]), previewWidth: 380, previewHeight: 290 }
      ]
    };
    const result = await generateNotanStudySvg(input);
    expect(result.svg).toContain('<svg');
    // All 4 images still rendered
    const imageCount = (result.svg.match(/<image /g) ?? []).length;
    expect(imageCount).toBe(4);
  });
});

describe('generateSingleCellSvg', () => {
  it('produces valid SVG with 1 image element', async () => {
    const cell = makeCell([0.2, 0.8], [280, 720]);
    const result = await generateSingleCellSvg(cell);
    expect(result.svg).toContain('<?xml version="1.0"');
    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('</svg>');
    const imageCount = (result.svg.match(/<image /g) ?? []).length;
    expect(imageCount).toBe(1);
  });

  it('has tight dimensions matching cell width', async () => {
    const cell = makeCell([0.3, 0.7], [400, 600]);
    const result = await generateSingleCellSvg(cell);
    // Fixed canvas width (1125px)
    expect(result.width).toBe(1125);
    // Height should include bucket strip + gap + preview + margins
    expect(result.height).toBeGreaterThan(result.width * 0.5);
  });

  it('uses default background #f8f2e3', async () => {
    const cell = makeCell([0.5], [1000]);
    const result = await generateSingleCellSvg(cell);
    expect(result.svg).toContain('#f8f2e3');
  });

  it('respects custom background', async () => {
    const cell = makeCell([0.5], [1000]);
    const result = await generateSingleCellSvg(cell, '#ffffff');
    expect(result.svg).toContain('#ffffff');
    expect(result.svg).not.toContain('#f8f2e3');
  });

  it('is deterministic', async () => {
    const cell = makeCell([0.2, 0.5, 0.8], [300, 400, 300]);
    const results = await Promise.all(
      Array.from({ length: 5 }, () => generateSingleCellSvg(cell))
    );
    expect(new Set(results.map(r => r.svg)).size).toBe(1);
  });

  it('contains clip-path definitions for bucket strip and image', async () => {
    const cell = makeCell([0.2, 0.8], [500, 500]);
    const result = await generateSingleCellSvg(cell);
    expect(result.svg).toContain('clipPath');
    // 1 bucket strip clip + 1 image clip = 2
    const clipPathCount = (result.svg.match(/<clipPath/g) ?? []).length;
    expect(clipPathCount).toBe(2);
  });
});
