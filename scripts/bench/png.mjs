import { promises as fs } from 'node:fs';
import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const COLOR_CHANNELS = {
  0: 1, // grayscale
  2: 3, // rgb
  3: 1, // indexed-color (palette) – not supported
  4: 2, // grayscale + alpha
  6: 4 // rgba
};

function paethPredictor(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function applyFilter(filterType, row, prev, bpp) {
  switch (filterType) {
    case 0:
      return row;
    case 1: { // Sub
      for (let i = 0; i < row.length; i++) {
        const left = i >= bpp ? row[i - bpp] : 0;
        row[i] = (row[i] + left) & 0xff;
      }
      return row;
    }
    case 2: { // Up
      for (let i = 0; i < row.length; i++) {
        const up = prev ? prev[i] : 0;
        row[i] = (row[i] + up) & 0xff;
      }
      return row;
    }
    case 3: { // Average
      for (let i = 0; i < row.length; i++) {
        const left = i >= bpp ? row[i - bpp] : 0;
        const up = prev ? prev[i] : 0;
        row[i] = (row[i] + Math.floor((left + up) / 2)) & 0xff;
      }
      return row;
    }
    case 4: { // Paeth
      for (let i = 0; i < row.length; i++) {
        const left = i >= bpp ? row[i - bpp] : 0;
        const up = prev ? prev[i] : 0;
        const upLeft = prev && i >= bpp ? prev[i - bpp] : 0;
        row[i] = (row[i] + paethPredictor(left, up, upLeft)) & 0xff;
      }
      return row;
    }
    default:
      throw new Error(`Unsupported PNG filter type ${filterType}`);
  }
}

export async function decodePng(path) {
  const data = await fs.readFile(path);
  if (!data.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error(`File at ${path} is not a PNG`);
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlaceMethod = 0;
  const idatChunks = [];

  while (offset < data.length) {
    const length = data.readUInt32BE(offset);
    offset += 4;
    const type = data.subarray(offset, offset + 4).toString('ascii');
    offset += 4;
    const chunk = data.subarray(offset, offset + length);
    offset += length;
    // Skip CRC
    offset += 4;

    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk.readUInt8(8);
      colorType = chunk.readUInt8(9);
      interlaceMethod = chunk.readUInt8(12);
      if (bitDepth !== 8) {
        throw new Error(`Unsupported PNG bit depth: ${bitDepth}`);
      }
      if (!COLOR_CHANNELS[colorType] || colorType === 3) {
        throw new Error(`Unsupported PNG color type: ${colorType}`);
      }
    } else if (type === 'IDAT') {
      idatChunks.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (interlaceMethod !== 0) {
    throw new Error('Interlaced PNG decoding is not supported in the harness');
  }

  const channels = COLOR_CHANNELS[colorType];
  const bpp = Math.max(1, Math.ceil((bitDepth * channels) / 8));
  const rowSize = width * channels;
  const expectedSize = height * (rowSize + 1);
  const compressed = Buffer.concat(idatChunks);
  const inflated = inflateSync(compressed);
  if (inflated.length !== expectedSize) {
    throw new Error('Unexpected inflated PNG size. File may be corrupted.');
  }

  const output = new Uint8ClampedArray(width * height * 4);
  let prevRow = null;

  for (let y = 0; y < height; y++) {
    const rowStart = y * (rowSize + 1);
    const filterType = inflated[rowStart];
    const rowRaw = Buffer.from(inflated.subarray(rowStart + 1, rowStart + 1 + rowSize));
    const row = applyFilter(filterType, rowRaw, prevRow, bpp);

    for (let x = 0; x < width; x++) {
      const srcIdx = x * channels;
      const dstIdx = (y * width + x) * 4;
      if (colorType === 6) {
        output[dstIdx] = row[srcIdx];
        output[dstIdx + 1] = row[srcIdx + 1];
        output[dstIdx + 2] = row[srcIdx + 2];
        output[dstIdx + 3] = row[srcIdx + 3];
      } else if (colorType === 2) {
        output[dstIdx] = row[srcIdx];
        output[dstIdx + 1] = row[srcIdx + 1];
        output[dstIdx + 2] = row[srcIdx + 2];
        output[dstIdx + 3] = 255;
      } else if (colorType === 0) {
        const v = row[srcIdx];
        output[dstIdx] = v;
        output[dstIdx + 1] = v;
        output[dstIdx + 2] = v;
        output[dstIdx + 3] = 255;
      } else if (colorType === 4) {
        const v = row[srcIdx];
        output[dstIdx] = v;
        output[dstIdx + 1] = v;
        output[dstIdx + 2] = v;
        output[dstIdx + 3] = row[srcIdx + 1];
      }
    }

    prevRow = row;
  }

  return { width, height, data: output };
}
