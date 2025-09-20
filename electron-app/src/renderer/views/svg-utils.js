const XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>';

export function svgDocument({ width, height, content, attrs = {} }) {
  const attrString = Object.entries({
    xmlns: 'http://www.w3.org/2000/svg',
    width,
    height,
    viewBox: `0 0 ${width} ${height}`,
    ...attrs
  })
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  return `${XML_HEADER}\n<svg ${attrString}>${content}</svg>`;
}

export function svgRect({ x, y, width, height, fill, stroke = 'none', strokeWidth = 0, rx = 0 }) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" rx="${rx}"/>`;
}

export function svgText({ x, y, text, fill = '#000', fontFamily = 'Fira Sans', fontSize = 14, anchor = 'start' }) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="${fontFamily}" font-size="${fontSize}" text-anchor="${anchor}" dominant-baseline="middle">${escapeSvg(text)}</text>`;
}

export function svgGroup(children, attrs = {}) {
  const attrString = Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  return `<g${attrString ? ` ${attrString}` : ''}>${children.join('')}</g>`;
}

function escapeSvg(text = '') {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
