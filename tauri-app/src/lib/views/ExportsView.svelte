<script lang="ts">
  import { onMount } from 'svelte';
  import {
    analysisResult,
    analysisState,
    params,
    selectedFile,
    videoState,
    exportScale,
    exportChecks,
    graphExportFormat,
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError
  } from '../stores/ui';
  import { analyzeImage } from '../compute/bridge';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHistogramSvg } from '../exports/histogram';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';
  import { generatePaletteSvg, generatePaletteCsv } from '../exports/palette';
  import { generateAseBlob } from '../exports/palette-ase';
  import { generatePaletteJson } from '../exports/palette-web';
  import { toDataUrl } from '../exports/value-analysis';
  import { svgToTile, imageToTile } from '../exports/compositor';
  import { composeColorStudy, type ColorStudyInput } from '../exports/color-study-compositor';
  import { getFsBridge, saveFromPath } from '../bridges/fs';
  import { svgToPngBlob } from '../exports/png';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { logEvent } from '../bridges/log';
  import { createValuesExportRunner } from './exports/values-export-runner.svelte';

  // --- Store-derived state ---
  const file = $derived($selectedFile);
  const result = $derived($analysisResult);
  const paramSnapshot = $derived($params);

  // --- Auto-analyze unanalyzed images ---
  let analysisRunning = $state(false);

  async function ensureColorAnalysis() {
    if (!file?.path || result || analysisRunning) return;
    if ($analysisState === 'pending') return;
    analysisRunning = true;
    setAnalysisPending();
    try {
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

  $effect(() => {
    const _file = file;
    const _result = result;
    if (_file && !_result) {
      void ensureColorAnalysis();
    }
  });

  // --- Checkbox state (persisted via exportChecks store) ---
  const videoStrip = $derived.by(() => {
    const vs = $videoState;
    return vs?.stripPath ? { path: vs.stripPath, url: convertFileSrc(vs.stripPath) } : null;
  });

  // --- Save state ---
  let isSaving = $state(false);
  let message = $state<string | null>(null);
  let messageVariant = $state<'info' | 'error'>('info');
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  const colorsAnyChecked = $derived(
    $exportChecks.colorsSourceImage || $exportChecks.colorsPolarChart || $exportChecks.colorsHistogram ||
    $exportChecks.colorsHueLightness || $exportChecks.colorsPaletteStrip || $exportChecks.colorsVideoBarcode
  );
  const valuesAnyChecked = $derived(
    $exportChecks.valuesNeutral || $exportChecks.valuesRangeFinder || $exportChecks.valuesHistogram || $exportChecks.valuesSimplified
  );

  const valuesRunner = createValuesExportRunner({
    getFile: () => file,
    getExportScale: () => $exportScale,
    getCheckboxState: () => ({
      valuesNeutral: $exportChecks.valuesNeutral,
      valuesIncludeOriginal: $exportChecks.valuesIncludeOriginal,
      valuesRangeFinder: $exportChecks.valuesRangeFinder,
      valuesHistogram: $exportChecks.valuesHistogram,
      valuesSimplified: $exportChecks.valuesSimplified,
      valuesAllStudies: $exportChecks.valuesAllStudies
    }),
    getGraphExportFormat: () => $graphExportFormat,
    performSave,
    baseName,
    setStatus
  });

  onMount(() => {
    void logEvent('exports:view:mount');
    return () => {
      if (dismissTimer) clearTimeout(dismissTimer);
      void logEvent('exports:view:unmount');
    };
  });

  function baseName(): string {
    if (!file) return 'export';
    const name = file.name || 'image';
    const withoutExt = name.replace(/\.[^.]+$/, '');
    return withoutExt.replace(/[^A-Za-z0-9-_]+/g, '-');
  }

  // --- Tile builders ---
  async function buildColorStudyInput(): Promise<ColorStudyInput> {
    const input: ColorStudyInput = {};
    if (!file || !result) return input;

    if ($exportChecks.colorsSourceImage && file.previewUrl) {
      const dataUrl = await toDataUrl(file.previewUrl);
      const img = await loadImageDimensions(dataUrl);
      input.sourceImage = imageToTile(dataUrl, img.width, img.height, 'source-image');
    }

    if ($exportChecks.colorsPolarChart) {
      const { svg } = generateCircleGraphSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        mode: paramSnapshot.polarMode,
        fontSize: 20
      });
      input.polarChart = svgToTile(svg, 'polar-chart');
    }

    if ($exportChecks.colorsHistogram) {
      const primarySort = paramSnapshot.histogramSort;
      const { svg } = generateHistogramSvg(result.clusters, { sortBy: primarySort, hPadding: 0, fontSize: 16 });
      input.histogram = svgToTile(svg, 'histogram');

      if ($exportChecks.colorsHistogramAll) {
        const allModes: Array<'frequency' | 'hue' | 'lightness'> = ['frequency', 'hue', 'lightness'];
        input.secondaryHistograms = allModes
          .filter(m => m !== primarySort)
          .map(mode => svgToTile(
            generateHistogramSvg(result!.clusters, { sortBy: mode, hPadding: 0, fontSize: 22 }).svg,
            `histogram-${mode}`
          ));
      }
    }

    if ($exportChecks.colorsHueLightness) {
      const { svg } = generateHueLightnessSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        sizeMode: paramSnapshot.hueLightnessSizeMode,
        fontSize: 18
      });
      input.hueLightness = svgToTile(svg, 'hue-lightness');
    }

    if ($exportChecks.colorsPaletteStrip) {
      const { svg } = generatePaletteSvg(result.clusters, { maxClusters: 20 });
      input.paletteStrip = svgToTile(svg, 'palette-strip');
    }

    if ($exportChecks.colorsVideoBarcode && videoStrip) {
      const dataUrl = await toDataUrl(videoStrip.url);
      const img = await loadImageDimensions(dataUrl);
      input.videoBarcode = imageToTile(dataUrl, img.width, img.height, 'video-barcode');
    }

    return input;
  }

  // --- Composite exports ---
  async function exportColorsComposite() {
    if (!result) return;
    await performSave(async () => {
      const input = await buildColorStudyInput();
      const hasContent = Object.values(input).some(v => v !== undefined);
      if (!hasContent) {
        setStatus('No items selected for export.', 'info');
        return;
      }
      const { svg, width, height } = composeColorStudy(input);
      const scale = Math.max(1, Math.min(4, $exportScale));
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

  // --- Individual saves ---
  async function saveIndividualChart(
    generator: () => { svg: string; width: number; height: number },
    suffix: string
  ) {
    await performSave(async () => {
      const { svg, width, height } = generator();
      const format = $graphExportFormat;
      const bridge = await getFsBridge();
      if (format === 'svg') {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const { canceled } = await bridge.saveBlob(blob, `${baseName()}-${suffix}.svg`);
        if (canceled) setStatus('Export canceled.', 'info');
        else setStatus(`${suffix} SVG saved.`, 'info');
      } else {
        const scale = Math.max(1, Math.min(4, $exportScale));
        const blob = await svgToPngBlob(svg, width, height, scale);
        const { canceled } = await bridge.saveBlob(blob, `${baseName()}-${suffix}.png`);
        if (canceled) setStatus('Export canceled.', 'info');
        else setStatus(`${suffix} PNG saved.`, 'info');
      }
    });
  }

  function polarGenerator() {
    return generateCircleGraphSvg(result!.clusters, {
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: paramSnapshot.showAxisLabels,
      showStroke: paramSnapshot.showClusterOutline,
      mode: paramSnapshot.polarMode,
      fontSize: 20
    });
  }

  function histogramGenerator() {
    return generateHistogramSvg(result!.clusters, {
      sortBy: paramSnapshot.histogramSort,
      fontSize: 16
    });
  }

  function hueLightnessGenerator() {
    return generateHueLightnessSvg(result!.clusters, {
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: paramSnapshot.showAxisLabels,
      showStroke: paramSnapshot.showClusterOutline,
      sizeMode: paramSnapshot.hueLightnessSizeMode,
      fontSize: 18
    });
  }

  function paletteGenerator() {
    return generatePaletteSvg(result!.clusters);
  }

  function loadImageDimensions(src: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Failed to load image dimensions.'));
      img.src = src;
    });
  }

  async function saveVideoBarcodeImage() {
    if (!videoStrip) return;
    await performSave(async () => {
      const { canceled } = await saveFromPath(videoStrip!.path, `${baseName()}-video-barcode.png`);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Video barcode PNG saved.', 'info');
    });
  }

  async function saveSourceImagePng() {
    if (!file?.path) return;
    await performSave(async () => {
      const ext = file!.name?.match(/\.(jpe?g|png|webp|bmp)$/i)?.[1]?.toLowerCase() ?? 'png';
      const normalizedExt = ext === 'jpeg' ? 'jpg' : ext;
      const { canceled } = await saveFromPath(file!.path!, `${baseName()}-source.${normalizedExt}`);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Source image saved.', 'info');
    });
  }

  async function savePaletteCsv() {
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
</script>

<section class="exports">
  <header>
    <h1>Exports</h1>
  </header>

  {#if file && result}
    <div class="builder-section">
      <h2>Colors</h2>
      <div class="builder-items">
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsSourceImage} />
          <span>Source Image</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving || !file.previewUrl} onclick={saveSourceImagePng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsPolarChart} />
          <span>Polar Chart</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualChart(polarGenerator, 'polar')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsHistogram} />
          <span>Cluster Histogram</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include frequency, hue, and lightness sort modes">
              <input type="checkbox" bind:checked={$exportChecks.colorsHistogramAll} disabled={!$exportChecks.colorsHistogram} />
              <span class="sub-toggle-label">All sorts</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualChart(histogramGenerator, 'histogram')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsHueLightness} />
          <span>Hue × Lightness</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualChart(hueLightnessGenerator, 'hue-lightness')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsPaletteStrip} />
          <span>Palette Strip (top 20)</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualChart(paletteGenerator, 'palette')}>↓</button>
        </label>
        <label class="builder-item" class:disabled={!videoStrip}>
          <input type="checkbox" bind:checked={$exportChecks.colorsVideoBarcode} disabled={!videoStrip} />
          <span>Video Barcode</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving || !videoStrip} onclick={saveVideoBarcodeImage}>↓</button>
        </label>
      </div>
      <button class="composite-btn" disabled={isSaving || !colorsAnyChecked} onclick={exportColorsComposite}>
        Export Colors Composite
      </button>
    </div>

    <div class="builder-section">
      <h2>Values</h2>
      <div class="builder-items">
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.valuesNeutral} />
          <span>Neutral Values</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include original image alongside neutral">
              <input type="checkbox" bind:checked={$exportChecks.valuesIncludeOriginal} disabled={!$exportChecks.valuesNeutral} />
              <span class="sub-toggle-label">Include original</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={valuesRunner.saveNeutralImage}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.valuesRangeFinder} />
          <span>Range Finder</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={valuesRunner.saveRangeFinderPng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.valuesHistogram} />
          <span>Values Histogram</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={valuesRunner.saveValuesHistogramPng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.valuesSimplified} />
          <span>Simplified Values</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include all 4 notan study levels (2-5)">
              <input type="checkbox" bind:checked={$exportChecks.valuesAllStudies} disabled={!$exportChecks.valuesSimplified} />
              <span class="sub-toggle-label">All studies</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={valuesRunner.saveNotanStudyPng}>↓</button>
        </label>
      </div>
      <button class="composite-btn" disabled={isSaving || !valuesAnyChecked} onclick={valuesRunner.exportValuesComposite}>
        Export Values Composite
      </button>
    </div>

    <div class="builder-section">
      <h2>Data</h2>
      <div class="builder-items">
        <div class="data-row">
          <span>Palette CSV</span>
          <span class="spacer"></span>
          <button disabled={isSaving} onclick={savePaletteCsv}>Save CSV</button>
        </div>
        <div class="data-row">
          <span>Palette .ase</span>
          <span class="spacer"></span>
          <button disabled={isSaving} onclick={savePaletteAse}>Save .ase</button>
        </div>
        <div class="data-row">
          <span>Palette JSON</span>
          <span class="spacer"></span>
          <button disabled={isSaving} onclick={savePaletteJson}>Save JSON</button>
        </div>
      </div>
      <div class="scale-control">
        <label>
          <span>PNG Scale</span>
          <span class="scale-value">{$exportScale}×</span>
          <input type="range" min="1" max="4" step="1" bind:value={$exportScale} />
        </label>
      </div>
    </div>
  {:else}
    <div class="empty" class:analyzing={file && $analysisState === 'pending'}>
      {#if file && $analysisState === 'pending'}
        Analyzing\u2026
      {:else}
        Select an image and complete analysis to unlock exports.
      {/if}
    </div>
  {/if}

  {#if isSaving}
    <div class="status status-saving">Saving…</div>
  {:else if message}
    <div class:status-error={messageVariant === 'error'} class="status">{message}</div>
  {/if}
</section>

<style>
  .exports {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .builder-section {
    background: var(--panel);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow);
  }

  .builder-section h2 {
    margin: 0 0 12px 0;
    font-size: 15px;
    font-weight: 600;
  }

  .builder-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .builder-item {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 14px;
  }

  .builder-item.disabled {
    cursor: default;
    opacity: 0.5;
  }

  .builder-item input[type='checkbox'] {
    margin: 0;
  }

  .sub-toggle {
    margin-left: 4px;
  }

  .sub-toggle-inner {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.55);
  }

  .sub-toggle-inner input[type='checkbox'] {
    margin: 0;
  }

  .sub-toggle-inner input:disabled {
    cursor: not-allowed;
  }

  .sub-toggle-label {
    white-space: nowrap;
  }

  .spacer {
    flex: 1;
  }

  .item-download {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid var(--line);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    padding: 0;
    color: inherit;
    flex-shrink: 0;
  }

  .item-download:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .composite-btn {
    width: 100%;
    margin-top: 16px;
    padding: 10px 16px;
    border-radius: 8px;
    border: 1px solid var(--accent, #4f5ffa);
    background: var(--accent, #4f5ffa);
    color: #fff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }

  .composite-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .data-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }


  .data-row button {
    border-radius: 6px;
    padding: 6px 14px;
    border: 1px solid var(--line);
    background: transparent;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }

  .data-row button[disabled] {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .scale-control {
    margin-top: 16px;
    border-top: 1px solid var(--line, rgba(33, 33, 32, 0.1));
    padding-top: 12px;
  }

  .scale-control label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .scale-value {
    font-weight: 600;
    min-width: 24px;
  }

  .scale-control input[type='range'] {
    flex: 1;
    max-width: 160px;
  }

  .empty {
    padding: 16px;
    background: var(--panel);
    border-radius: 8px;
    color: rgba(33, 33, 32, 0.6);
  }

  .empty.analyzing {
    animation: pulse-opacity 1.2s ease-in-out infinite;
  }

  .status {
    margin-top: 2px;
    padding: 12px;
    border-radius: 8px;
    background: rgba(79, 95, 250, 0.12);
    color: #1b1d23;
  }

  .status-error {
    background: rgba(220, 53, 69, 0.1);
    color: #8a1f2b;
  }

  .status-saving {
    animation: pulse-opacity 1.2s ease-in-out infinite;
  }

  @keyframes pulse-opacity {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
</style>
