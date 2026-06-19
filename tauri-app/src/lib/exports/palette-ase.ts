import type { AnalysisCluster } from '../stores/ui';

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
  const h = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${h(rgb.r)}${h(rgb.g)}${h(rgb.b)}`.toUpperCase();
}

const HEADER_SIZE = 12; // ASEF(4) + version(4) + blockCount(4)
const COLOR_MODEL_SIZE = 4; // "RGB "
const FLOAT_CHANNELS = 12; // 3 × float32
const COLOR_TYPE_SIZE = 2; // uint16

/**
 * Generate an Adobe Swatch Exchange (.ase) binary blob from cluster data.
 *
 * Binary layout per spec:
 * - Header: "ASEF" + version 1.0 (0x00010000) + block count (uint32 BE)
 * - Per swatch: block type 0x0001 + block length + UTF-16BE name (with null) + "RGB " + 3×f32 + color type 0x0000
 */
export function generateAseBlob(clusters: AnalysisCluster[]): Blob {
  // Pre-compute swatch names and sizes
  const swatches = clusters.map((c) => {
    const name = rgbToHex(c.rgb); // e.g. "#DC3C1E" — 7 chars
    const nameChars = name.length + 1; // +1 for null terminator
    const nameBytes = nameChars * 2; // UTF-16BE
    const nameLenField = 2; // uint16 char count
    const blockDataSize = nameLenField + nameBytes + COLOR_MODEL_SIZE + FLOAT_CHANNELS + COLOR_TYPE_SIZE;
    return { cluster: c, name, nameChars, blockDataSize };
  });

  // Total buffer: header + per-swatch (type(2) + length(4) + data)
  const totalSize = HEADER_SIZE + swatches.reduce((sum, s) => sum + 2 + 4 + s.blockDataSize, 0);
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  let offset = 0;

  // Header: "ASEF"
  view.setUint8(offset++, 0x41); // A
  view.setUint8(offset++, 0x53); // S
  view.setUint8(offset++, 0x45); // E
  view.setUint8(offset++, 0x46); // F

  // Version 1.0
  view.setUint16(offset, 0x0001);
  offset += 2;
  view.setUint16(offset, 0x0000);
  offset += 2;

  // Block count
  view.setUint32(offset, clusters.length);
  offset += 4;

  // Swatch blocks
  for (const { cluster, name, nameChars, blockDataSize } of swatches) {
    // Block type: color entry
    view.setUint16(offset, 0x0001);
    offset += 2;

    // Block length (everything after this field)
    view.setUint32(offset, blockDataSize);
    offset += 4;

    // Name length (UTF-16 char count including null)
    view.setUint16(offset, nameChars);
    offset += 2;

    // Name as UTF-16BE
    for (let i = 0; i < name.length; i++) {
      view.setUint16(offset, name.charCodeAt(i));
      offset += 2;
    }
    // Null terminator
    view.setUint16(offset, 0x0000);
    offset += 2;

    // Color model: "RGB "
    view.setUint8(offset++, 0x52); // R
    view.setUint8(offset++, 0x47); // G
    view.setUint8(offset++, 0x42); // B
    view.setUint8(offset++, 0x20); // space

    // RGB float values (0.0–1.0)
    view.setFloat32(offset, cluster.rgb.r / 255);
    offset += 4;
    view.setFloat32(offset, cluster.rgb.g / 255);
    offset += 4;
    view.setFloat32(offset, cluster.rgb.b / 255);
    offset += 4;

    // Color type: global/process
    view.setUint16(offset, 0x0000);
    offset += 2;
  }

  return new Blob([buffer], { type: 'application/octet-stream' });
}
