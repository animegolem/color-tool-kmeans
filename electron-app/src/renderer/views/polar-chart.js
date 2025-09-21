import { AxisType, defaultChartOptions, normalizeAxisType, validateClusters } from '../../shared/types.js';
import { clearCanvas, drawCircle, computeContrastStroke } from './canvas-utils.js';
import { svgToPngBlob } from './exporters.js';

const DEG_TO_RAD = Math.PI / 180;

export class PolarChart {
  constructor(config = {}) {
    const options = { ...defaultChartOptions(), ...config };
    this.width = options.width || 620;
    this.height = options.height || 620;
    this.radius = options.radius || Math.min(this.width, this.height) / 2 - 10;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.options = options;
    this.clusters = [];
    this.layout = [];
  }

  setOptions(overrides = {}) {
    this.options = {
      ...this.options,
      ...overrides,
      axisType: normalizeAxisType(overrides.axisType ?? this.options.axisType)
    };
    this.radius = this.options.radius || Math.min(this.width, this.height) / 2 - 10;
    this._recomputeLayout();
  }

  setData(clusters, overrides = {}) {
    this.clusters = validateClusters(clusters);
    if (Object.keys(overrides).length) {
      this.setOptions(overrides);
    } else {
      this._recomputeLayout();
    }
    return this.layout;
  }

  _recomputeLayout() {
    const opts = this.options;
    const padding = opts.symbolPadding ?? 8;
    const maxSymbolRadius = this.radius * 0.18 * (opts.symbolScale || 1);
    const effectiveRadius = Math.max(0, this.radius - maxSymbolRadius - padding);

    this.layout = this.clusters.map((cluster) => {
      const hue = cluster.hsv[0] || 0;
      const sat = cluster.hsv[1] || 0;
      const val = cluster.hsv[2] || 0;
      const angle = (hue * DEG_TO_RAD) - Math.PI / 2;
      const radial = opts.axisType === AxisType.HLS ? val : sat;
      const symbolRadius = this._symbolRadius(cluster.share, maxSymbolRadius);
      const r = effectiveRadius * radial;
      const x = this.centerX + r * Math.cos(angle);
      const y = this.centerY + r * Math.sin(angle);
      return {
        x,
        y,
        symbolRadius,
        rgb: cluster.rgb,
        count: cluster.count,
        share: cluster.share,
        hue,
        sat,
        val
      };
    });
  }

  _symbolRadius(share, maxSymbolRadius) {
    const areaScale = Math.max(share, 0);
    const base = Math.sqrt(areaScale) * maxSymbolRadius;
    return Math.max(2, base);
  }

  render(ctx) {
    if (!ctx) throw new Error('Context is required');
    clearCanvas(ctx, this.width, this.height);
    this._drawBackdrop(ctx);
    this._drawClusters(ctx);
  }

  _drawBackdrop(ctx) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(16,17,17,0.85)';
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(this.centerX - this.radius, this.centerY);
    ctx.lineTo(this.centerX + this.radius, this.centerY);
    ctx.moveTo(this.centerX, this.centerY - this.radius);
    ctx.lineTo(this.centerX, this.centerY + this.radius);
    ctx.stroke();

    if (this.options.showAxisLabels) {
      this._drawAxisLabels(ctx);
    }
    ctx.restore();
  }

  _drawAxisLabels(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(16,17,17,0.6)';
    ctx.font = "15px 'Fira Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const labelRadius = this.radius + 24;
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(Math.PI / 4);
    ctx.fillText('<- Hue ->', labelRadius * Math.cos(0), labelRadius * Math.sin(0));
    ctx.restore();

    const secondary = this.options.axisType === AxisType.HSL ? '<- Sat. ->' : '<- Lum. ->';
    ctx.save();
    ctx.translate(this.centerX, this.centerY - labelRadius);
    ctx.rotate(Math.PI / 2);
    ctx.fillText(secondary, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  _drawClusters(ctx) {
    const showStroke = this.options.showStroke !== false;
    for (const entry of this.layout) {
      const fillStyle = `rgb(${entry.rgb.r}, ${entry.rgb.g}, ${entry.rgb.b})`;
      const strokeStyle = showStroke ? computeContrastStroke(entry.rgb) : null;
      drawCircle(ctx, entry.x, entry.y, entry.symbolRadius, {
        fillStyle,
        strokeStyle,
        lineWidth: showStroke ? 1 : 0
      });
    }
  }

  toSVG() {
    const opts = this.options;
    const svgParts = [];
    svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`);
    svgParts.push(`<g fill="none" stroke="rgba(16,17,17,0.85)" stroke-width="1">`);
    svgParts.push(`<circle cx="${this.centerX}" cy="${this.centerY}" r="${this.radius}"/>`);
    svgParts.push(`<line x1="${this.centerX - this.radius}" y1="${this.centerY}" x2="${this.centerX + this.radius}" y2="${this.centerY}"/>`);
    svgParts.push(`<line x1="${this.centerX}" y1="${this.centerY - this.radius}" x2="${this.centerX}" y2="${this.centerY + this.radius}"/>`);
    svgParts.push(`</g>`);

    if (opts.showAxisLabels) {
      const hueText = '<- Hue ->';
      const secondaryText = opts.axisType === AxisType.HSL ? '<- Sat. ->' : '<- Lum. ->';
      svgParts.push(`<text x="${this.centerX}" y="${this.centerY - this.radius - 24}" font-family="Fira Sans" font-size="15" fill="rgba(16,17,17,0.6)" text-anchor="middle" transform="rotate(90 ${this.centerX} ${this.centerY - this.radius - 24})">${secondaryText}</text>`);
      svgParts.push(`<text x="${this.centerX + (this.radius + 24) * Math.SQRT1_2}" y="${this.centerY + (this.radius + 24) * Math.SQRT1_2}" font-family="Fira Sans" font-size="15" fill="rgba(16,17,17,0.6)">${hueText}</text>`);
    }

    for (const entry of this.layout) {
      const fill = `rgb(${entry.rgb.r},${entry.rgb.g},${entry.rgb.b})`;
      const stroke = this.options.showStroke !== false ? computeContrastStroke(entry.rgb) : 'none';
      svgParts.push(`<circle cx="${entry.x.toFixed(2)}" cy="${entry.y.toFixed(2)}" r="${entry.symbolRadius.toFixed(2)}" fill="${fill}" stroke="${stroke}" stroke-width="${this.options.showStroke !== false ? 1 : 0}"/>`);
    }

    svgParts.push(`</svg>`);
    return svgParts.join('');
  }

  toPNG(scale = 1) {
    return svgToPngBlob(this.toSVG(), this.width, this.height, scale);
  }

  exportAs({ format = 'svg', scale = 1 } = {}) {
    const normalized = String(format).toLowerCase();
    if (normalized === 'svg') {
      return this.toSVG();
    }
    if (normalized === 'png') {
      return this.toPNG(scale);
    }
    throw new Error(`Unsupported export format: ${format}`);
  }

  getLayout() {
    return this.layout;
  }
}

export function createPolarChart(config) {
  return new PolarChart(config);
}
