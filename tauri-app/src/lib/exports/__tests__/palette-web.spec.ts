import { describe, it, expect } from 'vitest';
import { generatePaletteJson } from '../palette-web';
import { FIXED_CLUSTERS } from './fixtures';
import type { AnalysisCluster } from '../../stores/ui';

describe('generatePaletteJson', () => {
  it('returns valid JSON', () => {
    const json = generatePaletteJson(FIXED_CLUSTERS);
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('has palette array matching cluster count', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    expect(parsed.palette).toHaveLength(FIXED_CLUSTERS.length);
    expect(parsed.count).toBe(FIXED_CLUSTERS.length);
  });

  it('each entry has required fields', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    for (const entry of parsed.palette) {
      expect(entry).toHaveProperty('rank');
      expect(entry).toHaveProperty('hex');
      expect(entry).toHaveProperty('rgb');
      expect(entry).toHaveProperty('oklch');
      expect(entry).toHaveProperty('share');
    }
  });

  it('ranks are sequential starting from 1', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    parsed.palette.forEach((entry: { rank: number }, i: number) => {
      expect(entry.rank).toBe(i + 1);
    });
  });

  it('hex values match input clusters', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    expect(parsed.palette[0].hex).toBe('#DC3C1E');
    expect(parsed.palette[1].hex).toBe('#1E5AD2');
    expect(parsed.palette[3].hex).toBe('#808080');
  });

  it('rgb arrays match input clusters', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    const first = parsed.palette[0];
    expect(first.rgb).toEqual([220, 60, 30]);
  });

  it('oklch values are rounded appropriately', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    const first = parsed.palette[0];
    expect(first.oklch).toEqual([0.627, 0.258, 29.3]);
  });

  it('share values are rounded to 4 decimal places', () => {
    const parsed = JSON.parse(generatePaletteJson(FIXED_CLUSTERS));
    expect(parsed.palette[0].share).toBe(0.4);
    expect(parsed.palette[1].share).toBe(0.267);
  });

  describe('edge cases', () => {
    it('handles empty clusters', () => {
      const json = generatePaletteJson([]);
      const parsed = JSON.parse(json);
      expect(parsed.palette).toEqual([]);
      expect(parsed.count).toBe(0);
    });

    it('handles single cluster', () => {
      const json = generatePaletteJson([FIXED_CLUSTERS[0]]);
      const parsed = JSON.parse(json);
      expect(parsed.palette).toHaveLength(1);
      expect(parsed.count).toBe(1);
      expect(parsed.palette[0].rank).toBe(1);
    });
  });

  describe('determinism', () => {
    it('produces identical strings on repeated calls', () => {
      const json1 = generatePaletteJson(FIXED_CLUSTERS);
      const json2 = generatePaletteJson(FIXED_CLUSTERS);
      expect(json1).toBe(json2);
    });
  });
});
