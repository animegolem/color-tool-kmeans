export function svgDocument({ width, height, content, attrs = {} }) {
    const attrString = Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeAttr(String(value))}"`)
        .join(' ');
    const extra = attrString ? ` ${attrString}` : '';
    return `<?xml version="1.0" encoding="UTF-8"?>` +
        `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"${extra}>${content}</svg>`;
}
export function svgCircle(attrs) {
    return `<circle ${serializeAttrs(attrs)} />`;
}
export function svgLine(attrs) {
    return `<line ${serializeAttrs(attrs)} />`;
}
export function svgRect(attrs) {
    return `<rect ${serializeAttrs(attrs)} />`;
}
export function svgText(attrs, text) {
    return `<text ${serializeAttrs(attrs)}>${escapeText(text)}</text>`;
}
export function svgGroup(children, attrs = {}) {
    return `<g ${serializeAttrs(attrs)}>${children.join('')}</g>`;
}
function serializeAttrs(attrs) {
    return Object.entries(attrs)
        .map(([key, value]) => `${key}="${escapeAttr(String(value))}"`)
        .join(' ');
}
function escapeAttr(input) {
    return input.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
}
function escapeText(input) {
    return input.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
