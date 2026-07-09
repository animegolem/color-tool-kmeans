import { describe, it, expect } from 'vitest';
import { generateAseBlob } from '../palette-ase';
import { FIXED_CLUSTERS } from './fixtures';
import type { AnalysisCluster } from '../../stores/ui';

async function blobToBuffer(blob: Blob): Promise<DataView> {
  const buffer = await blob.arrayBuffer();
  return new DataView(buffer);
}

describe('generateAseBlob', () => {
  it('returns a Blob instance', () => {
    const blob = generateAseBlob(FIXED_CLUSTERS);
    expect(blob).toBeInstanceOf(Blob);
  });

  describe('header', () => {
    it('starts with ASEF magic bytes', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
      );
      expect(magic).toBe('ASEF');
    });

    it('has version 1.0', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      expect(view.getUint16(4)).toBe(0x0001);
      expect(view.getUint16(6)).toBe(0x0000);
    });

    it('has correct block count', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      expect(view.getUint32(8)).toBe(FIXED_CLUSTERS.length);
    });
  });

  describe('block structure', () => {
    it('first block has type 0x0001 (color entry)', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      expect(view.getUint16(12)).toBe(0x0001);
    });

    it('first block has correct length', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      // "#DC3C1E" = 7 chars + null = 8 UTF-16 code units = 16 bytes
      // nameLenField(2) + nameBytes(16) + colorModel(4) + floats(12) + colorType(2) = 36
      const blockLength = view.getUint32(14);
      expect(blockLength).toBe(36);
    });

    it('encodes name as UTF-16BE with null terminator', async () => {
      const singleCluster: AnalysisCluster[] = [
        {
          count: 100,
          share: 1.0,
          centroidSpace: [0.5, 0, 0],
          oklab: [0.5, 0, 0],
          oklch: [0.5, 0, 0],
          rgb: { r: 255, g: 0, b: 0 },
          hsv: [0, 1, 1],
        },
      ];
      const view = await blobToBuffer(generateAseBlob(singleCluster));

      // Name starts at offset 18 (header 12 + type 2 + length 4)
      // Name length field at offset 18
      const nameLen = view.getUint16(18);
      expect(nameLen).toBe(8); // "#FF0000" (7) + null (1)

      // Read UTF-16BE chars starting at offset 20
      const chars: string[] = [];
      for (let i = 0; i < 7; i++) {
        chars.push(String.fromCharCode(view.getUint16(20 + i * 2)));
      }
      expect(chars.join('')).toBe('#FF0000');

      // Null terminator
      expect(view.getUint16(20 + 7 * 2)).toBe(0x0000);
    });

    it('has RGB color model after name', async () => {
      const singleCluster: AnalysisCluster[] = [
        {
          count: 100,
          share: 1.0,
          centroidSpace: [0.5, 0, 0],
          oklab: [0.5, 0, 0],
          oklch: [0.5, 0, 0],
          rgb: { r: 255, g: 0, b: 0 },
          hsv: [0, 1, 1],
        },
      ];
      const view = await blobToBuffer(generateAseBlob(singleCluster));

      // After header(12) + type(2) + length(4) + nameLen(2) + name(16) = 36
      const modelOffset = 36;
      const model = String.fromCharCode(
        view.getUint8(modelOffset),
        view.getUint8(modelOffset + 1),
        view.getUint8(modelOffset + 2),
        view.getUint8(modelOffset + 3)
      );
      expect(model).toBe('RGB ');
    });
  });

  describe('float precision', () => {
    it('encodes r/255 values that round-trip through float32', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      const cluster = FIXED_CLUSTERS[0];

      // First block: header(12) + type(2) + length(4) + nameLen(2) + name(16) + model(4) = 40
      const floatOffset = 40;
      const rFloat = view.getFloat32(floatOffset);
      const gFloat = view.getFloat32(floatOffset + 4);
      const bFloat = view.getFloat32(floatOffset + 8);

      expect(rFloat).toBeCloseTo(cluster.rgb.r / 255, 5);
      expect(gFloat).toBeCloseTo(cluster.rgb.g / 255, 5);
      expect(bFloat).toBeCloseTo(cluster.rgb.b / 255, 5);
    });

    it('encodes color type 0x0000 (global)', async () => {
      const view = await blobToBuffer(generateAseBlob(FIXED_CLUSTERS));
      // After floats: offset 40 + 12 = 52
      expect(view.getUint16(52)).toBe(0x0000);
    });
  });

  describe('golden reference', () => {
    it('produces exact bytes for a single red cluster', async () => {
      const red: AnalysisCluster[] = [
        {
          count: 100,
          share: 1.0,
          centroidSpace: [0.5, 0, 0],
          oklab: [0.5, 0, 0],
          oklch: [0.5, 0, 0],
          rgb: { r: 255, g: 0, b: 0 },
          hsv: [0, 1, 1],
        },
      ];
      const blob = generateAseBlob(red);
      const buf = await blob.arrayBuffer();
      const bytes = new Uint8Array(buf);

      // Total: header(12) + type(2) + length(4) + data(36) = 54
      expect(bytes.length).toBe(54);

      // Header
      expect(bytes[0]).toBe(0x41); // A
      expect(bytes[1]).toBe(0x53); // S
      expect(bytes[2]).toBe(0x45); // E
      expect(bytes[3]).toBe(0x46); // F

      // Block count = 1
      expect(bytes[11]).toBe(1);

      // Verify RGB float for pure red: r=1.0, g=0.0, b=0.0
      const view = new DataView(buf);
      expect(view.getFloat32(40)).toBeCloseTo(1.0, 6);
      expect(view.getFloat32(44)).toBeCloseTo(0.0, 6);
      expect(view.getFloat32(48)).toBeCloseTo(0.0, 6);
    });
  });

  describe('edge cases', () => {
    it('produces valid header-only file for empty array', async () => {
      const blob = generateAseBlob([]);
      const buf = await blob.arrayBuffer();
      expect(buf.byteLength).toBe(12); // header only

      const view = new DataView(buf);
      const magic = String.fromCharCode(
        view.getUint8(0),
        view.getUint8(1),
        view.getUint8(2),
        view.getUint8(3)
      );
      expect(magic).toBe('ASEF');
      expect(view.getUint32(8)).toBe(0); // 0 blocks
    });

    it('handles single cluster', async () => {
      const single = [FIXED_CLUSTERS[0]];
      const blob = generateAseBlob(single);
      const view = await blobToBuffer(blob);
      expect(view.getUint32(8)).toBe(1);
    });
  });

  describe('determinism', () => {
    it('produces byte-identical output on repeated calls', async () => {
      const blob1 = generateAseBlob(FIXED_CLUSTERS);
      const blob2 = generateAseBlob(FIXED_CLUSTERS);
      const buf1 = new Uint8Array(await blob1.arrayBuffer());
      const buf2 = new Uint8Array(await blob2.arrayBuffer());
      expect(buf1).toEqual(buf2);
    });
  });
});
