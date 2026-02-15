import type { AnalysisCluster } from '../../stores/ui';

/**
 * Fixed cluster data for determinism tests.
 * Covers: high-chroma warm (red), cool (blue), mid (green),
 * achromatic (gray, oklch[1] ≈ 0), and dark low-chroma (brown).
 */
export const FIXED_CLUSTERS: AnalysisCluster[] = [
  {
    count: 1200,
    share: 0.40,
    centroidSpace: [0.627, 0.225, 0.126],
    oklab: [0.627, 0.225, 0.126],
    oklch: [0.627, 0.258, 29.3],
    rgb: { r: 220, g: 60, b: 30 },
    hsv: [9.5, 0.864, 0.863]
  },
  {
    count: 800,
    share: 0.267,
    centroidSpace: [0.452, -0.032, -0.188],
    oklab: [0.452, -0.032, -0.188],
    oklch: [0.452, 0.191, 260.3],
    rgb: { r: 30, g: 90, b: 210 },
    hsv: [220.0, 0.857, 0.824]
  },
  {
    count: 600,
    share: 0.20,
    centroidSpace: [0.520, -0.140, 0.108],
    oklab: [0.520, -0.140, 0.108],
    oklch: [0.520, 0.177, 142.4],
    rgb: { r: 40, g: 160, b: 50 },
    hsv: [125.0, 0.750, 0.627]
  },
  {
    count: 300,
    share: 0.10,
    centroidSpace: [0.533, 0.000, 0.000],
    oklab: [0.533, 0.000, 0.000],
    oklch: [0.533, 0.0, 0.0],
    rgb: { r: 128, g: 128, b: 128 },
    hsv: [0.0, 0.0, 0.502]
  },
  {
    count: 100,
    share: 0.033,
    centroidSpace: [0.280, 0.030, 0.040],
    oklab: [0.280, 0.030, 0.040],
    oklch: [0.280, 0.050, 53.1],
    rgb: { r: 72, g: 48, b: 30 },
    hsv: [25.7, 0.583, 0.282]
  }
];
