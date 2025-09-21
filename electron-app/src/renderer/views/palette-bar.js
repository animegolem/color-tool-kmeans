import { PaletteSortMode, normalizePaletteSort, clusterToPaletteItem } from '../../shared/types.js';
import { svgDocument, svgRect, svgText, svgGroup } from './svg-utils.js';
import { computeContrastStroke } from './canvas-utils.js';
import { svgToPngBlob } from './exporters.js';

const ROW_HEIGHT = 32;
const SWATCH_WIDTH = 56;
const PADDING_X = 16;
const FONT_SIZE = 16;

export class PaletteBar {
  constructor(config = {}) {
    this.sortMode = normalizePaletteSort(config.sortMode);
    this.rows = [];
    this.width = config.width || 260;
    this.rowHeight = config.rowHeight || ROW_HEIGHT;
    this.fontFamily = config.fontFamily || 'Fira Sans';
  }

  setData(clusters, options = {}) {
    this.sortMode = normalizePaletteSort(options.sortMode ?? this.sortMode);
    this.rows = clusters.map((cluster, index) => ({
      ...clusterToPaletteItem(cluster, index + 1)
    }));
    this._sort();
    this._computeLayout();
    return this.rows;
  }

  _sort() {
    switch (this.sortMode) {
      case PaletteSortMode.HUE:
        this.rows.sort((a, b) => a.hue - b.hue || b.share - a.share);
        break;
      case PaletteSortMode.SHARE_ASC:
        this.rows.sort((a, b) => a.share - b.share || a.hue - b.hue);
        break;
      case PaletteSortMode.SHARE_DESC:
      default:
        this.rows.sort((a, b) => b.share - a.share || a.hue - b.hue);
        break;
    }
    this.rows.forEach((row, idx) => {
      row.rank = idx + 1;
    });
  }

  _computeLayout() {
    this.rows = this.rows.map((row, index) => {
      const y = index * this.rowHeight;
      const rgb = row.rgb || { r: 0, g: 0, b: 0 };
      const textColor = computeContrastStroke(rgb);
      const rgbLabel = `[${rgb.r}:${rgb.g}:${rgb.b}] : ${row.count}`;
      return {
        ...row,
        y,
        textColor,
        rgbLabel
      };
    });
    this.height = this.rows.length * this.rowHeight;
  }

  render(container) {
    if (!(container instanceof HTMLElement)) {
      throw new Error('render(container) expects a DOM element');
    }
    container.innerHTML = this.toSVG();
  }

  toSVG() {
    const content = this.rows.map((row) => this._rowToSvg(row)).join('');
    return svgDocument({
      width: this.width,
      height: this.height,
      content,
      attrs: { 'data-palette-bar': 'true' }
    });
  }

  _rowToSvg(row) {
    const swatch = svgRect({
      x: 0,
      y: row.y + 4,
      width: SWATCH_WIDTH,
      height: this.rowHeight - 8,
      fill: row.hex,
      stroke: 'none',
      rx: 4
    });
    const text = svgText({
      x: SWATCH_WIDTH + PADDING_X,
      y: row.y + this.rowHeight / 2,
      text: row.rgbLabel,
      fill: row.textColor,
      fontFamily: this.fontFamily,
      fontSize: FONT_SIZE,
      anchor: 'start'
    });
    return svgGroup([swatch, text]);
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

  getRows() {
    return this.rows;
  }
}

export function createPaletteBar(config) {
  return new PaletteBar(config);
}
