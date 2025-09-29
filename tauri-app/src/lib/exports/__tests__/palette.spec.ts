import { describe, expect, it } from 'vitest';
import { generatePaletteCsv } from '../palette';

const sampleClusters = [
  {
    count: 1200,
    share: 0.4,
    centroidSpace: [0, 0, 0],
    rgb: { r: 255, g: 0, b: 0 },
    hsv: [0, 1, 1]
  },
  {
    count: 800,
    share: 0.266667,
    centroidSpace: [0, 0, 0],
    rgb: { r: 0, g: 128, b: 255 },
    hsv: [210, 1, 1]
  }
];

describe('generatePaletteCsv', () => {
  it('includes header and one row per cluster', () => {
    const csv = generatePaletteCsv(sampleClusters as any);
    const lines = csv.trim().split(/\n/);
    expect(lines[0]).toBe('rank,share,count,r,g,b,hex');
    expect(lines).toHaveLength(sampleClusters.length + 1);
  });

  it('formats share with six decimals and hex uppercase', () => {
    const csv = generatePaletteCsv(sampleClusters as any);
    const [, firstRow] = csv.trim().split(/\n/);
    expect(firstRow).toContain('0.400000');
    expect(firstRow.endsWith('#FF0000')).toBe(true);
  });
});
