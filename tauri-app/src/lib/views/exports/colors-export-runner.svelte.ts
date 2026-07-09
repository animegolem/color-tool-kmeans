import { get } from 'svelte/store';
import type { SelectedImage, AnalysisResult, AnalysisParams, ExportChecks } from '../../stores/ui';
import {
  analysisState,
  setAnalysisPending,
  setAnalysisSuccess,
  setAnalysisError
} from '../../stores/ui';
import { analyzeImage } from '../../compute/bridge';
import { generateCircleGraphSvg } from '../../exports/polar-chart';
import { generateHistogramSvg } from '../../exports/histogram';
import { generateHueLightnessSvg } from '../../exports/hue-lightness';
import { generatePaletteSvg, generatePaletteCsv } from '../../exports/palette';
import { generateAseBlob } from '../../exports/palette-ase';
import { generatePaletteJson } from '../../exports/palette-web';
import { toDataUrl } from '../../exports/value-analysis';
import { svgToTile, imageToTile } from '../../exports/compositor';
import { composeColorStudy, type ColorStudyInput } from '../../exports/color-study-compositor';
import { getFsBridge, saveFromPath, sourceImageExportName } from '../../bridges/fs';
import { svgToPngBlob } from '../../exports/png';
import { saveChart } from '../../exports/chart-save';

export interface ColorsExportDeps {
  getFile: () => SelectedImage | null;
  getResult: () => AnalysisResult | null;
  getParams: () => AnalysisParams;
  getExportScale: () => number;
  getExportChecks: () => ExportChecks;
  getGraphExportFormat: () => string;
  getVideoStrip: () => { path: string; url: string } | null;
  getVideoFrameLabel: () => string;
  getVideoFps: () => number | null;
}

export function createColorsExportRunner(deps: ColorsExportDeps) {
  let analysisRunning = $state(false);
  let isSaving = $state(false);
  let message = $state<string | null>(null);
  let messageVariant = $state<'info' | 'error'>('info');
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  // --- Save infrastructure ---

  async function performSave(action: () => Promise<void>) {
    if (isSaving) return;
    isSaving = true;
    setStatus(null, 'info');
    try {
      await action();
    } catch (error) {
      console.error('[exports] failed to save file', error);
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Failed to save file: ${msg}`, 'error');
    } finally {
      isSaving = false;
    }
  }

  function setStatus(value: string | null, variant: 'info' | 'error') {
    if (dismissTimer) clearTimeout(dismissTimer);
    message = value;
    messageVariant = variant;
    if (value && variant === 'info') {
      dismissTimer = setTimeout(() => { message = null; }, 3000);
    }
  }

  function destroy() {
    if (dismissTimer) clearTimeout(dismissTimer);
  }

  // --- Auto-analyze ---

  async function ensureColorAnalysis() {
    const file = deps.getFile();
    const result = deps.getResult();
    if (!file?.path || result || analysisRunning) return;
    if (get(analysisState) === 'pending') return;
    analysisRunning = true;
    setAnalysisPending();
    try {
      const paramSnapshot = deps.getParams();
      const response = await analyzeImage(
        file.dataset,
        { ...paramSnapshot, tol: 1e-3, maxIter: 40, seed: 1, maxSamples: 300_000 }
      );
      setAnalysisSuccess(response, file.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setAnalysisError(msg);
    } finally {
      analysisRunning = false;
    }
  }

  // --- Name generation ---

  function baseName(): string {
    const file = deps.getFile();
    if (!file) return 'export';
    const name = file.name || 'image';
    const withoutExt = name.replace(/\.[^.]+$/, '');
    let base = withoutExt.replace(/[^A-Za-z0-9-_]+/g, '-');
    if (file.videoPath && file.frameTimestamp != null) {
      if (deps.getVideoFrameLabel() === 'frame') {
        const fps = deps.getVideoFps() ?? 24;
        const frameNum = Math.round(file.frameTimestamp * fps);
        base += `-f${frameNum}`;
      } else {
        const totalSec = Math.floor(file.frameTimestamp);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        const centis = Math.round((file.frameTimestamp - totalSec) * 100);
        base += `-${String(mins).padStart(2, '0')}m${String(secs).padStart(2, '0')}s${String(centis).padStart(2, '0')}`;
      }
    }
    return base;
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

  // --- Tile assembly ---

  async function buildColorStudyInput(): Promise<ColorStudyInput> {
    const input: ColorStudyInput = {};
    const file = deps.getFile();
    const result = deps.getResult();
    const checks = deps.getExportChecks();
    const paramSnapshot = deps.getParams();
    if (!file || !result) return input;

    if (checks.colorsSourceImage && file.previewUrl) {
      const dataUrl = await toDataUrl(file.previewUrl);
      const img = await loadImageDimensions(dataUrl);
      input.sourceImage = imageToTile(dataUrl, img.width, img.height, 'source-image');
    }

    if (checks.colorsPolarChart) {
      const { svg } = generateCircleGraphSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        mode: paramSnapshot.polarMode,
        fontSize: 20
      });
      input.polarChart = svgToTile(svg, 'polar-chart');
    }

    if (checks.colorsHistogram) {
      const primarySort = paramSnapshot.histogramSort;
      const { svg } = generateHistogramSvg(result.clusters, { sortBy: primarySort, hPadding: 0, fontSize: 16 });
      input.histogram = svgToTile(svg, 'histogram');

      if (checks.colorsHistogramAll) {
        const allModes: Array<'frequency' | 'hue' | 'lightness'> = ['frequency', 'hue', 'lightness'];
        input.secondaryHistograms = allModes
          .filter(m => m !== primarySort)
          .map(mode => svgToTile(
            generateHistogramSvg(result!.clusters, { sortBy: mode, hPadding: 0, fontSize: 22 }).svg,
            `histogram-${mode}`
          ));
      }
    }

    if (checks.colorsHueLightness) {
      const { svg } = generateHueLightnessSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        sizeMode: paramSnapshot.hueLightnessSizeMode,
        fontSize: 18
      });
      input.hueLightness = svgToTile(svg, 'hue-lightness');
    }

    if (checks.colorsPaletteStrip) {
      const { svg } = generatePaletteSvg(result.clusters, { maxClusters: 20 });
      input.paletteStrip = svgToTile(svg, 'palette-strip');
    }

    const videoStrip = deps.getVideoStrip();
    if (checks.colorsVideoBarcode && videoStrip) {
      const dataUrl = await toDataUrl(videoStrip.url);
      const img = await loadImageDimensions(dataUrl);
      input.videoBarcode = imageToTile(dataUrl, img.width, img.height, 'video-barcode');
    }

    return input;
  }

  // --- Composite export ---

  async function exportColorsComposite() {
    if (!deps.getResult()) return;
    await performSave(async () => {
      const input = await buildColorStudyInput();
      const hasContent = Object.values(input).some(v => v !== undefined);
      if (!hasContent) {
        setStatus('No items selected for export.', 'info');
        return;
      }
      const { svg, width, height } = composeColorStudy(input);
      const scale = Math.max(1, Math.min(4, deps.getExportScale()));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-colors.png`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Colors composite PNG saved.', 'info');
      }
    });
  }

  // --- Individual chart saves ---

  async function saveIndividualChart(
    generator: () => { svg: string; width: number; height: number },
    suffix: string
  ) {
    await performSave(async () => {
      const format = deps.getGraphExportFormat() === 'svg' ? 'svg' : 'png';
      const { canceled } = await saveChart(format, generator(), baseName(), suffix, deps.getExportScale());
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus(`${suffix} ${format.toUpperCase()} saved.`, 'info');
    });
  }

  // --- File saves ---

  async function saveVideoBarcodeImage() {
    const videoStrip = deps.getVideoStrip();
    if (!videoStrip) return;
    await performSave(async () => {
      const { canceled } = await saveFromPath(videoStrip.path, `${baseName()}-video-barcode.png`);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Video barcode PNG saved.', 'info');
    });
  }

  async function saveSourceImagePng() {
    const file = deps.getFile();
    if (!file?.path) return;
    await performSave(async () => {
      const defaultName = sourceImageExportName(file!.name ?? '', baseName());
      const { canceled } = await saveFromPath(file!.path!, defaultName);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Source image saved.', 'info');
    });
  }

  async function savePaletteCsv() {
    const result = deps.getResult();
    if (!result) return;
    await performSave(async () => {
      const csv = generatePaletteCsv(result!.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveTextFile(csv, `${baseName()}-palette.csv`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Palette CSV saved.', 'info');
      }
    });
  }

  async function savePaletteAse() {
    const result = deps.getResult();
    if (!result) return;
    await performSave(async () => {
      const blob = generateAseBlob(result!.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-palette.ase`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Palette .ase saved.', 'info');
      }
    });
  }

  async function savePaletteJson() {
    const result = deps.getResult();
    if (!result) return;
    await performSave(async () => {
      const json = generatePaletteJson(result!.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveTextFile(json, `${baseName()}-palette.json`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Palette JSON saved.', 'info');
      }
    });
  }

  return {
    get isSaving() { return isSaving; },
    get message() { return message; },
    get messageVariant() { return messageVariant; },
    ensureColorAnalysis,
    performSave,
    baseName,
    setStatus,
    destroy,
    exportColorsComposite,
    saveIndividualChart,
    polarGenerator,
    histogramGenerator,
    hueLightnessGenerator,
    paletteGenerator,
    saveVideoBarcodeImage,
    saveSourceImagePng,
    savePaletteCsv,
    savePaletteAse,
    savePaletteJson
  };
}
