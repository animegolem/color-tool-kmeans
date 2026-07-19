import { describe, expect, it } from 'vitest';
import type { AnalysisCluster } from '../../stores/ui';
import {
  clusterHue,
  clusterLightness,
  contrastStroke,
  rgbToHex,
} from '../color-format';

describe('shared export color formatting', () => {
  it('SWEEP-026 normalizes RGB labels and contrast strokes', () => {
    expect(rgbToHex({ r: 255.4, g: -1, b: 15.6 })).toBe('#FF0010');
    expect(contrastStroke({ r: 255, g: 255, b: 255 })).toContain('0,0,0');
    expect(contrastStroke({ r: 0, g: 0, b: 0 })).toContain('255,255,255');
  });

  it('SWEEP-026 keeps OKLCH accessors and HSV fallbacks identical', () => {
    const oklch = {
      oklch: [0.7, 0.1, 210],
      hsv: [30, 40, 50],
    } as AnalysisCluster;
    const hsv = { oklch: [], hsv: [30, 40, 50] } as unknown as AnalysisCluster;
    expect(clusterHue(oklch)).toBe(210);
    expect(clusterLightness(oklch)).toBe(0.7);
    expect(clusterHue(hsv)).toBe(30);
    expect(clusterLightness(hsv)).toBe(0.5);
  });
});
