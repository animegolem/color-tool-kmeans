import type { AnalysisResult, AnalysisParams, ExportChecks } from '../../stores/ui';
import { generateCircleGraphSvg } from '../../exports/polar-chart';
import { generateHistogramSvg } from '../../exports/histogram';
import { generateHueLightnessSvg } from '../../exports/hue-lightness';
import { generatePaletteSvg, generatePaletteCsv } from '../../exports/palette';
import { generateAseBlob } from '../../exports/palette-ase';
import { generatePaletteJson } from '../../exports/palette-web';
import { toDataUrl } from '../../exports/value-analysis';
import { svgToTile, imageToTile } from '../../exports/compositor';
import { composeColorStudy, type ColorStudyInput } from '../../exports/color-study-compositor';
import { getFsBridge, saveFromPath } from '../../bridges/fs';
import { svgToPngBlob } from '../../exports/png';
import { assetUrl } from '../../utils/asset-url';

export interface BatchExportDeps {
  getResult: () => AnalysisResult | null;
  getCompositePath: () => string | null;
  getParams: () => AnalysisParams;
  getExportScale: () => number;
  getExportChecks: () => ExportChecks;
  getGraphExportFormat: () => string;
  getPinCount: () => number;
  performSave: (action: () => Promise<void>) => Promise<void>;
  setStatus: (value: string | null, variant: 'info' | 'error') => void;
}

/**
 * Batch counterpart of the colors export runner: same chart generators fed
 * by the batch analysis result and batch params, with the composite grid in
 * the source-image slot. No video handlers — batch has no video inputs.
 * Shares the save mutex and status bar via performSave/setStatus deps.
 */
export function createBatchExportRunner(deps: BatchExportDeps) {
  function baseName(): string {
    return `batch-${deps.getPinCount()}-images`;
  }

  // --- Generators ---

  function polarGenerator() {
    const result = deps.getResult()!;
    const paramSnapshot = deps.getParams();
    return generateCircleGraphSvg(result.clusters, {
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: paramSnapshot.showAxisLabels,
      showStroke: paramSnapshot.showClusterOutline,
      mode: paramSnapshot.polarMode,
      fontSize: 20
    });
  }

  function histogramGenerator() {
    const result = deps.getResult()!;
    const paramSnapshot = deps.getParams();
    return generateHistogramSvg(result.clusters, {
      sortBy: paramSnapshot.histogramSort,
      fontSize: 16
    });
  }

  function hueLightnessGenerator() {
    const result = deps.getResult()!;
    const paramSnapshot = deps.getParams();
    return generateHueLightnessSvg(result.clusters, {
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: paramSnapshot.showAxisLabels,
      showStroke: paramSnapshot.showClusterOutline,
      sizeMode: paramSnapshot.hueLightnessSizeMode,
      fontSize: 18
    });
  }

  function paletteGenerator() {
    const result = deps.getResult()!;
    return generatePaletteSvg(result.clusters);
  }

  // --- Helpers ---

  function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to load image dimensions.'));
      img.src = src;
    });
  }

  // --- Tile assembly ---

  async function buildBatchStudyInput(): Promise<ColorStudyInput> {
    const input: ColorStudyInput = {};
    const result = deps.getResult();
    const checks = deps.getExportChecks();
    const paramSnapshot = deps.getParams();
    const compositePath = deps.getCompositePath();
    if (!result) return input;

    if (checks.batchCompositeGrid && compositePath) {
      const dataUrl = await toDataUrl(assetUrl(compositePath));
      const img = await loadImageDimensions(dataUrl);
      input.sourceImage = imageToTile(dataUrl, img.width, img.height, 'composite-grid');
    }

    if (checks.batchPolarChart) {
      input.polarChart = svgToTile(polarGenerator().svg, 'polar-chart');
    }

    if (checks.batchHistogram) {
      const primarySort = paramSnapshot.histogramSort;
      const { svg } = generateHistogramSvg(result.clusters, { sortBy: primarySort, hPadding: 0, fontSize: 16 });
      input.histogram = svgToTile(svg, 'histogram');

      if (checks.batchHistogramAll) {
        const allModes: Array<'frequency' | 'hue' | 'lightness'> = ['frequency', 'hue', 'lightness'];
        input.secondaryHistograms = allModes
          .filter((m) => m !== primarySort)
          .map((mode) =>
            svgToTile(
              generateHistogramSvg(result.clusters, { sortBy: mode, hPadding: 0, fontSize: 22 }).svg,
              `histogram-${mode}`
            )
          );
      }
    }

    if (checks.batchHueLightness) {
      input.hueLightness = svgToTile(hueLightnessGenerator().svg, 'hue-lightness');
    }

    if (checks.batchPaletteStrip) {
      const { svg } = generatePaletteSvg(result.clusters, { maxClusters: 20 });
      input.paletteStrip = svgToTile(svg, 'palette-strip');
    }

    return input;
  }

  // --- Composite export ---

  async function exportBatchComposite() {
    if (!deps.getResult()) return;
    await deps.performSave(async () => {
      const input = await buildBatchStudyInput();
      const hasContent = Object.values(input).some((v) => v !== undefined);
      if (!hasContent) {
        deps.setStatus('No items selected for export.', 'info');
        return;
      }
      const { svg, width, height } = composeColorStudy(input);
      const scale = Math.max(1, Math.min(4, deps.getExportScale()));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-study.png`);
      if (canceled) deps.setStatus('Export canceled.', 'info');
      else deps.setStatus('Batch study PNG saved.', 'info');
    });
  }

  // --- Individual saves ---

  async function saveIndividualChart(
    generator: () => { svg: string; width: number; height: number },
    suffix: string
  ) {
    await deps.performSave(async () => {
      const { svg, width, height } = generator();
      const format = deps.getGraphExportFormat();
      const bridge = await getFsBridge();
      if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const { canceled } = await bridge.saveBlob(blob, `${baseName()}-${suffix}.svg`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus(`${suffix} SVG saved.`, 'info');
      } else {
        const scale = Math.max(1, Math.min(4, deps.getExportScale()));
        const blob = await svgToPngBlob(svg, width, height, scale);
        const { canceled } = await bridge.saveBlob(blob, `${baseName()}-${suffix}.png`);
        if (canceled) deps.setStatus('Export canceled.', 'info');
        else deps.setStatus(`${suffix} PNG saved.`, 'info');
      }
    });
  }

  async function saveCompositeGridImage() {
    const compositePath = deps.getCompositePath();
    if (!compositePath) return;
    await deps.performSave(async () => {
      const { canceled } = await saveFromPath(compositePath, `${baseName()}-grid.png`);
      if (canceled) deps.setStatus('Export canceled.', 'info');
      else deps.setStatus('Composite grid PNG saved.', 'info');
    });
  }

  // --- Palette data saves ---

  async function savePaletteCsv() {
    const result = deps.getResult();
    if (!result) return;
    await deps.performSave(async () => {
      const csv = generatePaletteCsv(result.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveTextFile(csv, `${baseName()}-palette.csv`);
      if (canceled) deps.setStatus('Export canceled.', 'info');
      else deps.setStatus('Batch palette CSV saved.', 'info');
    });
  }

  async function savePaletteAse() {
    const result = deps.getResult();
    if (!result) return;
    await deps.performSave(async () => {
      const blob = generateAseBlob(result.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-palette.ase`);
      if (canceled) deps.setStatus('Export canceled.', 'info');
      else deps.setStatus('Batch palette .ase saved.', 'info');
    });
  }

  async function savePaletteJson() {
    const result = deps.getResult();
    if (!result) return;
    await deps.performSave(async () => {
      const json = generatePaletteJson(result.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveTextFile(json, `${baseName()}-palette.json`);
      if (canceled) deps.setStatus('Export canceled.', 'info');
      else deps.setStatus('Batch palette JSON saved.', 'info');
    });
  }

  return {
    exportBatchComposite,
    saveIndividualChart,
    saveCompositeGridImage,
    polarGenerator,
    histogramGenerator,
    hueLightnessGenerator,
    paletteGenerator,
    savePaletteCsv,
    savePaletteAse,
    savePaletteJson
  };
}
