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

export const PaletteSortMode = Object.freeze({
  HUE: 'hue',
  SHARE_ASC: 'share-asc',
  SHARE_DESC: 'share-desc'
});

export function normalizePaletteSort(mode) {
  return Object.values(PaletteSortMode).includes(mode) ? mode : PaletteSortMode.SHARE_DESC;
}

export function clusterToPaletteItem(cluster, rank = 0) {
  const hue = cluster.hsv?.[0] ?? 0;
  const share = cluster.share ?? 0;
  return {
    rank,
    hue,
    share,
    count: cluster.count ?? 0,
    rgb: cluster.rgb || { r: 0, g: 0, b: 0 },
    hex: cluster.hex || rgbToHex(cluster.rgb || { r: 0, g: 0, b: 0 })
  };
}

function rgbToHex({ r = 0, g = 0, b = 0 }) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function toHex(value) {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
}
