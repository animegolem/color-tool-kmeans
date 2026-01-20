import { svgCircle, svgDocument, svgGroup, svgLine, svgText } from './svg';
import { svgToPngBlob } from './png';
const DEG_TO_RAD = Math.PI / 180;
export function generateCircleGraphSvg(clusters, options) {
    const size = options.size ?? 620;
    const radius = size / 2 - 12;
    const center = size / 2;
    const chromaValues = clusters.map((cluster) => getChroma(cluster));
    const maxChroma = Math.max(1e-6, ...chromaValues);
    const layout = clusters.map((cluster) => buildLayoutEntry(cluster, radius, center, options, maxChroma));
    const svgParts = [];
    if (options.showGamutBackground) {
        const meanL = computeMeanLightness(clusters);
        svgParts.push(buildGamutBackground(center, radius, meanL));
    }
    else {
        svgParts.push(svgGroup([
            svgCircle({ cx: center, cy: center, r: radius, fill: 'none', stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 }),
            svgLine({ x1: center - radius, y1: center, x2: center + radius, y2: center, stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 }),
            svgLine({ x1: center, y1: center - radius, x2: center, y2: center + radius, stroke: 'rgba(16,17,17,0.85)', 'stroke-width': 1 })
        ]));
    }
    if (options.showAxisLabels !== false) {
        const axisLabelRadius = radius + 24;
        const hueText = '<- Hue ->';
        const secondary = '<- Chroma ->';
        svgParts.push(svgText({
            x: center,
            y: center - axisLabelRadius,
            'font-family': 'Fira Sans',
            'font-size': 15,
            fill: 'rgba(16,17,17,0.6)',
            'text-anchor': 'middle',
            transform: `rotate(90 ${center} ${center - axisLabelRadius})`
        }, secondary));
        svgParts.push(svgText({
            x: center + axisLabelRadius * Math.SQRT1_2,
            y: center + axisLabelRadius * Math.SQRT1_2,
            'font-family': 'Fira Sans',
            'font-size': 15,
            fill: 'rgba(16,17,17,0.6)'
        }, hueText));
    }
    for (const entry of layout) {
        const fill = `rgb(${entry.rgb.r},${entry.rgb.g},${entry.rgb.b})`;
        const stroke = options.showStroke === false ? 'none' : contrastStroke(entry.rgb);
        svgParts.push(svgCircle({
            cx: entry.x.toFixed(2),
            cy: entry.y.toFixed(2),
            r: entry.symbolRadius.toFixed(2),
            fill,
            stroke,
            'stroke-width': options.showStroke === false ? 0 : 1
        }));
    }
    return {
        svg: svgDocument({
            width: size,
            height: size,
            content: svgParts.join(''),
            attrs: {
                'data-color-model': 'oklch',
                'data-chroma-normalization': 'per-image',
                'data-gamut-overlay': options.showGamutBackground ? 'oklch-mean-L' : 'none'
            }
        }),
        width: size,
        height: size
    };
}
export async function generateCircleGraphPng(clusters, options) {
    const { svg, width, height } = generateCircleGraphSvg(clusters, options);
    return svgToPngBlob(svg, width, height, options.scale ?? 1);
}
function buildLayoutEntry(cluster, radius, center, options, maxChroma) {
    const hue = getHue(cluster);
    const chroma = getChroma(cluster);
    const maxSymbolRadius = radius * 0.3 * (options.symbolScale || 1);
    const padding = 8;
    const effectiveRadius = Math.max(0, radius - maxSymbolRadius - padding);
    const symbolRadius = Math.max(3.5, Math.sqrt(Math.max(cluster.share, 0)) * maxSymbolRadius);
    const angle = hue * DEG_TO_RAD - Math.PI / 2;
    const r = effectiveRadius * (chroma / maxChroma);
    return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        symbolRadius,
        rgb: cluster.rgb
    };
}
function getHue(cluster) {
    if (cluster.oklch && cluster.oklch.length >= 3) {
        return cluster.oklch[2];
    }
    return cluster.hsv?.[0] ?? 0;
}
function getChroma(cluster) {
    if (cluster.oklch && cluster.oklch.length >= 3) {
        return cluster.oklch[1];
    }
    return cluster.hsv?.[1] ?? 0;
}
function contrastStroke(rgb) {
    const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
    return luminance > 0.5 ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.85)';
}
function buildGamutBackground(center, radius, lightness) {
    const slices = 96;
    const hueEntries = [];
    let maxC = 0;
    for (let i = 0; i < slices; i += 1) {
        const hue = (360 / slices) * i;
        const c = maxChromaForHue(lightness, hue);
        maxC = Math.max(maxC, c);
        const rgb = oklchToSrgb(lightness, c, hue);
        hueEntries.push({ hue, maxC: c, color: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})` });
    }
    const wedgeParts = [];
    const boundaryPoints = [];
    for (let i = 0; i < hueEntries.length; i += 1) {
        const entry = hueEntries[i];
        const start = ((Math.PI * 2) / slices) * i - Math.PI / 2;
        const end = ((Math.PI * 2) / slices) * (i + 1) - Math.PI / 2;
        const sliceRadius = maxC > 0 ? radius * (entry.maxC / maxC) : 0;
        const x1 = center + sliceRadius * Math.cos(start);
        const y1 = center + sliceRadius * Math.sin(start);
        const x2 = center + sliceRadius * Math.cos(end);
        const y2 = center + sliceRadius * Math.sin(end);
        boundaryPoints.push([x1, y1]);
        const path = `M ${center} ${center} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${sliceRadius.toFixed(2)} ${sliceRadius.toFixed(2)} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
        wedgeParts.push(`<path d="${path}" fill="${entry.color}" fill-opacity="0.22" />`);
    }
    const boundaryPath = buildBoundaryPath(boundaryPoints);
    const defs = `
    <defs>
      <radialGradient id="gamut-fade" gradientUnits="userSpaceOnUse" cx="${center}" cy="${center}" r="${radius}">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85" />
        <stop offset="55%" stop-color="#ffffff" stop-opacity="0.25" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.12" />
      </radialGradient>
    </defs>
  `;
    const hueWedges = wedgeParts.join('');
    const fadeCircle = `<circle cx="${center}" cy="${center}" r="${radius}" fill="url(#gamut-fade)" />`;
    const ring = `<circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="rgba(16,17,17,0.85)" stroke-width="1" />`;
    const axis = `<line x1="${center - radius}" y1="${center}" x2="${center + radius}" y2="${center}" stroke="rgba(16,17,17,0.45)" stroke-width="1" /><line x1="${center}" y1="${center - radius}" x2="${center}" y2="${center + radius}" stroke="rgba(16,17,17,0.45)" stroke-width="1" />`;
    const boundary = boundaryPath
        ? `<path d="${boundaryPath}" fill="none" stroke="rgba(16,17,17,0.5)" stroke-width="1" />`
        : '';
    return `${defs}${hueWedges}${fadeCircle}${boundary}${ring}${axis}`;
}
function buildBoundaryPath(points) {
    if (points.length === 0)
        return '';
    const [firstX, firstY] = points[0];
    const segments = points.slice(1).map(([x, y]) => `L ${x.toFixed(2)} ${y.toFixed(2)}`);
    return `M ${firstX.toFixed(2)} ${firstY.toFixed(2)} ${segments.join(' ')} Z`;
}
function computeMeanLightness(clusters) {
    let total = 0;
    let weight = 0;
    for (const cluster of clusters) {
        const l = cluster.oklch?.[0];
        const share = cluster.share ?? 0;
        if (typeof l === 'number' && Number.isFinite(l)) {
            total += l * (share > 0 ? share : 1);
            weight += share > 0 ? share : 1;
        }
    }
    if (weight <= 0)
        return 0.6;
    return Math.min(1, Math.max(0, total / weight));
}
function maxChromaForHue(lightness, hue) {
    const maxC = 0.5;
    let low = 0;
    let high = maxC;
    let best = 0;
    for (let i = 0; i < 16; i += 1) {
        const mid = (low + high) * 0.5;
        const rgb = oklchToLinearRgb(lightness, mid, hue);
        if (isInGamut(rgb)) {
            best = mid;
            low = mid;
        }
        else {
            high = mid;
        }
    }
    return best;
}
function oklchToSrgb(lightness, chroma, hue) {
    const linear = oklchToLinearRgb(lightness, chroma, hue);
    return linear.map((value) => linearToSrgbByte(value));
}
function oklchToLinearRgb(lightness, chroma, hue) {
    const rad = ((hue % 360) + 360) % 360 * (Math.PI / 180);
    const a = chroma * Math.cos(rad);
    const b = chroma * Math.sin(rad);
    return oklabToLinearRgb([lightness, a, b]);
}
function oklabToLinearRgb(lab) {
    const l = lab[0];
    const a = lab[1];
    const b = lab[2];
    const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = l - 0.0894841775 * a - 1.291485548 * b;
    const l3 = l_ * l_ * l_;
    const m3 = m_ * m_ * m_;
    const s3 = s_ * s_ * s_;
    return [
        4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
        -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
        -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3
    ];
}
function isInGamut(rgb) {
    return rgb[0] >= -1e-6 && rgb[0] <= 1 + 1e-6 && rgb[1] >= -1e-6 && rgb[1] <= 1 + 1e-6 && rgb[2] >= -1e-6 && rgb[2] <= 1 + 1e-6;
}
function linearToSrgbByte(value) {
    const clamped = Math.min(1, Math.max(0, value));
    const srgb = clamped <= 0.0031308 ? clamped * 12.92 : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, srgb)) * 255);
}
