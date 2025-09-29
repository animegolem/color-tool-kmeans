export interface SvgDocumentOptions {
  width: number;
  height: number;
  content: string;
  attrs?: Record<string, string | number | boolean>;
}

export function svgDocument({ width, height, content, attrs = {} }: SvgDocumentOptions): string {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttr(String(value))}"`)
    .join(' ');
  const extra = attrString ? ` ${attrString}` : '';
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${extra}>${content}</svg>`;
}

export function svgCircle(attrs: Record<string, string | number>): string {
  return `<circle ${serializeAttrs(attrs)} />`;
}

export function svgLine(attrs: Record<string, string | number>): string {
  return `<line ${serializeAttrs(attrs)} />`;
}

export function svgRect(attrs: Record<string, string | number>): string {
  return `<rect ${serializeAttrs(attrs)} />`;
}

export function svgText(attrs: Record<string, string | number>, text: string): string {
  return `<text ${serializeAttrs(attrs)}>${escapeText(text)}</text>`;
}

export function svgGroup(children: string[], attrs: Record<string, string | number> = {}): string {
  return `<g ${serializeAttrs(attrs)}>${children.join('')}</g>`;
}

function serializeAttrs(attrs: Record<string, string | number>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${escapeAttr(String(value))}"`)
    .join(' ');
}

function escapeAttr(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}

function escapeText(input: string): string {
  return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
