import regularUrl from '../../assets/fonts/FiraSans-Regular.woff?url';
import mediumUrl from '../../assets/fonts/FiraSans-Medium.ttf?url';
import boldUrl from '../../assets/fonts/FiraSans-Bold.woff?url';

interface FontDescriptor {
  url: string;
  weight: number;
  style: 'normal' | 'italic';
  format: 'woff' | 'woff2' | 'truetype';
}

const FIRA_SANS_SOURCES: FontDescriptor[] = [
  { url: regularUrl, weight: 400, style: 'normal', format: 'woff' },
  { url: mediumUrl, weight: 500, style: 'normal', format: 'truetype' },
  { url: boldUrl, weight: 700, style: 'normal', format: 'woff' },
];

let cachedCssPromise: Promise<string> | null = null;

export function getEmbeddedFiraSansCss(): Promise<string> {
  if (!cachedCssPromise) {
    cachedCssPromise = buildFontCss();
  }
  return cachedCssPromise;
}

async function buildFontCss(): Promise<string> {
  const blocks = await Promise.all(
    FIRA_SANS_SOURCES.map(async (descriptor) => {
      const dataUrl = await fetchFontData(descriptor.url);
      return fontFaceBlock(
        'Fira Sans',
        descriptor.weight,
        descriptor.style,
        dataUrl,
        descriptor.format
      );
    })
  );
  return blocks.join('\n');
}

async function fetchFontData(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to load font asset: ${response.status} ${response.statusText}`
    );
  }
  const buffer = await response.arrayBuffer();
  return bufferToBase64(buffer);
}

function fontFaceBlock(
  family: string,
  weight: number,
  style: 'normal' | 'italic',
  base64Data: string,
  format: FontDescriptor['format']
): string {
  return `
@font-face {
  font-family: '${family}';
  font-style: ${style};
  font-weight: ${weight};
  src: url('data:font/${format};base64,${base64Data}') format('${format}');
}
`.trim();
}

function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}
