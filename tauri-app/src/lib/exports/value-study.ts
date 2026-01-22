import { svgDocument, svgRect, svgText } from './svg';

export interface ValueStudyExportInput {
  originalSrc: string;
  neutralSrc: string;
  tiles: string[];
  tileWidth: number;
  tileHeight: number;
  background?: string;
}

export interface ValueStudyExportResult {
  svg: string;
  width: number;
  height: number;
}

const FONT_FAMILY = 'Fira Sans';

export async function generateValueStudySvg(input: ValueStudyExportInput): Promise<ValueStudyExportResult> {
  const {
    originalSrc,
    neutralSrc,
    tiles,
    tileWidth,
    tileHeight,
    background = '#f8f2e3'
  } = input;
  if (tiles.length < 9) {
    throw new Error('Value study export requires 9 tiles.');
  }

  const scale = Math.max(1, tileWidth / 280);
  const margin = Math.round(32 * scale);
  const gridGap = Math.round(12 * scale);
  const labelColWidth = Math.round(72 * scale);
  const previewGap = Math.round(24 * scale);
  const labelGap = Math.round(8 * scale);
  const sectionGap = Math.round(24 * scale);
  const fontSmall = Math.round(12 * scale);
  const fontMedium = Math.round(14 * scale);

  const gridWidth = 3 * tileWidth + 2 * gridGap;
  const contentWidth = labelColWidth + gridWidth;
  const topPairWidth = 2 * tileWidth + previewGap;
  const previewLeft = margin + labelColWidth + Math.max(0, (gridWidth - topPairWidth) / 2);

  const labelY = margin;
  const imageY = labelY + fontSmall + labelGap;
  const imageBottom = imageY + tileHeight;
  const majorLabelY = imageBottom + sectionGap;
  const columnLabelY = majorLabelY + fontMedium + labelGap;
  const gridY = columnLabelY + fontSmall + labelGap;
  const gridHeight = 3 * tileHeight + 2 * gridGap;
  const totalHeight = gridY + gridHeight + margin;
  const totalWidth = contentWidth + margin * 2;

  const [originalData, neutralData, tileData] = await Promise.all([
    toDataUrl(originalSrc),
    toDataUrl(neutralSrc),
    Promise.all(tiles.slice(0, 9).map((src) => toDataUrl(src)))
  ]);

  const content: string[] = [];
  content.push(svgRect({ x: 0, y: 0, width: totalWidth, height: totalHeight, fill: background }));

  content.push(
    svgText(
      {
        x: previewLeft + tileWidth / 2,
        y: labelY,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'letter-spacing': 1.2,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      'ORIGINAL'
    )
  );
  content.push(
    svgText(
      {
        x: previewLeft + tileWidth + previewGap + tileWidth / 2,
        y: labelY,
        fill: 'rgba(33,33,32,0.7)',
        'font-family': FONT_FAMILY,
        'font-size': fontSmall,
        'font-weight': 600,
        'letter-spacing': 1.2,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      'NEUTRAL VALUES'
    )
  );

  content.push(
    svgImage({
      href: originalData,
      x: previewLeft,
      y: imageY,
      width: tileWidth,
      height: tileHeight
    })
  );
  content.push(
    svgImage({
      href: neutralData,
      x: previewLeft + tileWidth + previewGap,
      y: imageY,
      width: tileWidth,
      height: tileHeight
    })
  );

  content.push(
    svgText(
      {
        x: margin + labelColWidth + gridWidth / 2,
        y: majorLabelY,
        fill: 'rgba(33,33,32,0.9)',
        'font-family': FONT_FAMILY,
        'font-size': fontMedium,
        'font-weight': 600,
        'text-anchor': 'middle',
        'dominant-baseline': 'hanging'
      },
      'Major Key'
    )
  );

  const columnLabels = ['High', 'Medium', 'Low'];
  columnLabels.forEach((label, idx) => {
    const x = margin + labelColWidth + idx * (tileWidth + gridGap) + tileWidth / 2;
    content.push(
      svgText(
        {
          x,
          y: columnLabelY,
          fill: 'rgba(33,33,32,0.8)',
          'font-family': FONT_FAMILY,
          'font-size': fontSmall,
          'font-weight': 600,
          'text-anchor': 'middle',
          'dominant-baseline': 'hanging'
        },
        label
      )
    );
  });

  const minorLabelX = margin + labelColWidth / 2;
  const minorLabelY = gridY + gridHeight / 2;
  content.push(
    svgText(
      {
        x: minorLabelX,
        y: minorLabelY,
        fill: 'rgba(33,33,32,0.9)',
        'font-family': FONT_FAMILY,
        'font-size': fontMedium,
        'font-weight': 600,
        'text-anchor': 'middle',
        transform: `rotate(-90 ${minorLabelX} ${minorLabelY})`
      },
      'Minor Key'
    )
  );

  const rowLabels = ['High', 'Medium', 'Low'];
  rowLabels.forEach((label, row) => {
    const y = gridY + row * (tileHeight + gridGap) + tileHeight / 2;
    const x = margin + labelColWidth - labelGap;
    content.push(
      svgText(
        {
          x,
          y,
          fill: 'rgba(33,33,32,0.8)',
          'font-family': FONT_FAMILY,
          'font-size': fontSmall,
          'font-weight': 600,
          'text-anchor': 'end',
          'dominant-baseline': 'middle'
        },
        label
      )
    );
  });

  tileData.forEach((href, idx) => {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const x = margin + labelColWidth + col * (tileWidth + gridGap);
    const y = gridY + row * (tileHeight + gridGap);
    content.push(svgImage({ href, x, y, width: tileWidth, height: tileHeight }));
  });

  return {
    svg: svgDocument({ width: totalWidth, height: totalHeight, content: content.join('') }),
    width: totalWidth,
    height: totalHeight
  };
}

function svgImage({
  href,
  x,
  y,
  width,
  height
}: {
  href: string;
  x: number;
  y: number;
  width: number;
  height: number;
}): string {
  return `<image ${serializeAttrs({
    href,
    'xlink:href': href,
    x,
    y,
    width,
    height,
    preserveAspectRatio: 'xMidYMid meet'
  })} />`;
}

function serializeAttrs(attrs: Record<string, string | number>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttr(String(value))}"`)
    .join(' ');
}

function escapeAttr(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

async function toDataUrl(src: string): Promise<string> {
  if (!src) {
    throw new Error('Missing image source for export.');
  }
  if (src.startsWith('data:')) {
    return src;
  }
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('Failed to load image for export.');
  }
  const blob = await response.blob();
  return blobToDataUrl(blob);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Failed to read image data.'));
    reader.readAsDataURL(blob);
  });
}
