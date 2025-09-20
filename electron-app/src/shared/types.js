/** Shared renderer/worker types */

export const AxisType = Object.freeze({
  HSL: 'HSL',
  HLS: 'HLS'
});

export function normalizeAxisType(value) {
  return value === AxisType.HLS ? AxisType.HLS : AxisType.HSL;
}

export function defaultChartOptions() {
  return {
    axisType: AxisType.HSL,
    showAxisLabels: true,
    showStroke: true,
    symbolScale: 1,
    radius: 300
  };
}

export function validateClusters(clusters) {
  if (!Array.isArray(clusters)) {
    throw new Error('clusters must be an array');
  }
  return clusters.map((cluster) => {
    if (!cluster || typeof cluster !== 'object') {
      throw new Error('Invalid cluster entry');
    }
    const { count, share, rgb, centroidSpace, hsv } = cluster;
    return {
      count: Number(count) || 0,
      share: Number(share) || 0,
      rgb: rgb || { r: 0, g: 0, b: 0 },
      centroidSpace: centroidSpace instanceof Float32Array ? centroidSpace : new Float32Array(3),
      hsv: hsv instanceof Float32Array ? hsv : new Float32Array(3)
    };
  });
}
