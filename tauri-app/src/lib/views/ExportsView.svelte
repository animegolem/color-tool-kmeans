<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import {
    analysisResult,
    params,
    selectedFile,
    videoState,
    valueAnalysisLevels,
    valueAnalysisNotanMode,
    setValueAnalysisPending,
    setValueAnalysisSuccess,
    setValueAnalysisError,
    exportScale
  } from '../stores/ui';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHistogramSvg } from '../exports/histogram';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';
  import { generatePaletteSvg, generatePaletteCsv } from '../exports/palette';
  import { generateValueAnalysisSvg } from '../exports/value-analysis';
  import { toDataUrl } from '../exports/value-analysis';
  import { generateNotanStudySvg, generateSingleCellSvg, type NotanCellData } from '../exports/notan-study';
  import { composeValueStudy } from '../exports/value-study-compositor';
  import { svgToTile, imageToTile } from '../exports/compositor';
  import { composeColorStudy, type ColorStudyInput } from '../exports/color-study-compositor';
  import { getFsBridge, saveFromPath } from '../bridges/fs';
  import { svgToPngBlob } from '../exports/png';
  import { requestValueAnalysis } from '../bridges/value-analysis';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { logEvent } from '../bridges/log';

  // --- Store-derived state ---
  const file = $derived.by(() => get(selectedFile));
  const result = $derived.by(() => get(analysisResult));
  const paramSnapshot = $derived.by(() => get(params));

  // --- Checkbox state ---
  let colorsSourceImage = $state(true);
  let colorsPolarChart = $state(true);
  let colorsHistogram = $state(true);
  let colorsHueLightness = $state(true);
  let colorsPaletteStrip = $state(false);
  let colorsHistogramAll = $state(false);
  let colorsVideoBarcode = $state(false);

  const videoStrip = $derived.by(() => {
    const vs = get(videoState);
    return vs?.stripPath ? { path: vs.stripPath, url: convertFileSrc(vs.stripPath) } : null;
  });

  let valuesNeutral = $state(true);
  let valuesIncludeOriginal = $state(true);
  let valuesRangeFinder = $state(true);
  let valuesHistogram = $state(true);
  let valuesSimplified = $state(true);
  let valuesAllStudies = $state(false);

  // --- Save state ---
  let isSaving = $state(false);
  let message = $state<string | null>(null);
  let messageVariant = $state<'info' | 'error'>('info');
  let dismissTimer: ReturnType<typeof setTimeout> | null = null;

  const colorsAnyChecked = $derived(
    colorsSourceImage || colorsPolarChart || colorsHistogram ||
    colorsHueLightness || colorsPaletteStrip || colorsVideoBarcode
  );
  const valuesAnyChecked = $derived(
    valuesNeutral || valuesRangeFinder || valuesHistogram || valuesSimplified
  );

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

    if (colorsSourceImage && file.previewUrl) {
      const dataUrl = await toDataUrl(file.previewUrl);
      const img = await loadImageDimensions(dataUrl);
      input.sourceImage = imageToTile(dataUrl, img.width, img.height, 'source-image');
    }

    if (colorsPolarChart) {
      const { svg } = generateCircleGraphSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        mode: paramSnapshot.polarMode
      });
      input.polarChart = svgToTile(svg, 'polar-chart');
    }

    if (colorsHistogram) {
      const primarySort = paramSnapshot.histogramSort;
      const { svg } = generateHistogramSvg(result.clusters, { sortBy: primarySort, hPadding: 0 });
      input.histogram = svgToTile(svg, 'histogram');

      if (colorsHistogramAll) {
        const allModes: Array<'frequency' | 'hue' | 'lightness'> = ['frequency', 'hue', 'lightness'];
        input.secondaryHistograms = allModes
          .filter(m => m !== primarySort)
          .map(mode => svgToTile(
            generateHistogramSvg(result!.clusters, { sortBy: mode, hPadding: 0, fontSize: 22 }).svg,
            `histogram-${mode}`
          ));
      }
    }

    if (colorsHueLightness) {
      const { svg } = generateHueLightnessSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        sizeMode: paramSnapshot.hueLightnessSizeMode
      });
      input.hueLightness = svgToTile(svg, 'hue-lightness');
    }

    if (colorsPaletteStrip) {
      const { svg } = generatePaletteSvg(result.clusters, { maxClusters: 20 });
      input.paletteStrip = svgToTile(svg, 'palette-strip');
    }

    if (colorsVideoBarcode && videoStrip) {
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

  async function loadValueAnalysisForExport(levels: number, notanMode: boolean) {
    if (!file?.path) {
      throw new Error('Values analysis export requires a native file path.');
    }
    setValueAnalysisPending(file.id, levels, notanMode);
    try {
      const loaded = await requestValueAnalysis(file.path, file.id, levels, notanMode);
      setValueAnalysisSuccess(file.id, levels, notanMode, loaded);
      return loaded;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      setValueAnalysisError(file.id, levels, notanMode, msg);
      throw error;
    }
  }

  async function exportValuesComposite() {
    if (!file) return;
    await performSave(async () => {
      const levels = get(valueAnalysisLevels);
      const notanMode = get(valueAnalysisNotanMode);
      const currentStudy = await loadValueAnalysisForExport(levels, notanMode);
      const originalSrc = file.previewUrl || '';
      if (!originalSrc) {
        throw new Error('Original image preview unavailable for export.');
      }
      const neutralSrc = convertFileSrc(currentStudy.neutral);
      const previewSrc = convertFileSrc(currentStudy.preview);

      const baseInput = {
        originalSrc,
        neutralSrc,
        previewSrc,
        neutralWidth: currentStudy.neutralWidth,
        neutralHeight: currentStudy.neutralHeight,
        previewWidth: currentStudy.previewWidth,
        previewHeight: currentStudy.previewHeight,
        p10: currentStudy.p10,
        p90: currentStudy.p90,
        p01: currentStudy.p01,
        p99: currentStudy.p99,
        bucketValues: currentStudy.bucketValues,
        boundaries: currentStudy.boundaries,
        counts: currentStudy.counts,
        histogramBins: currentStudy.histogramBins,
        levels: currentStudy.levels
      };

      let svg: string;
      let width: number;
      let height: number;

      if (valuesSimplified) {
        // 2-column composite: analysis left, simplified/notan right
        const col1Result = await generateValueAnalysisSvg({
          ...baseInput,
          includeNeutral: valuesNeutral,
          includeOriginal: valuesIncludeOriginal,
          includeRangeFinder: valuesRangeFinder,
          includeHistogram: valuesHistogram,
          includeSimplified: false
        });

        let col2Result: { svg: string; width: number; height: number };
        if (valuesAllStudies) {
          const [level2, level3, level4, level5] = await Promise.all([
            loadValueAnalysisForExport(2, true),
            loadValueAnalysisForExport(3, false),
            loadValueAnalysisForExport(4, false),
            loadValueAnalysisForExport(5, false)
          ]);
          const toCell = (study: typeof level2): NotanCellData => ({
            previewSrc: convertFileSrc(study.preview),
            previewWidth: study.previewWidth,
            previewHeight: study.previewHeight,
            bucketValues: study.bucketValues,
            counts: study.counts
          });
          col2Result = await generateNotanStudySvg({
            cells: [toCell(level2), toCell(level3), toCell(level4), toCell(level5)]
          });
        } else {
          col2Result = await generateSingleCellSvg({
            previewSrc,
            previewWidth: currentStudy.previewWidth,
            previewHeight: currentStudy.previewHeight,
            bucketValues: currentStudy.bucketValues,
            counts: currentStudy.counts
          });
        }

        const composed = composeValueStudy({
          col1Svg: col1Result.svg,
          col2Svg: col2Result.svg
        });
        svg = composed.svg;
        width = composed.width;
        height = composed.height;
      } else {
        // Single-column fallback (no simplified)
        const result = await generateValueAnalysisSvg({
          ...baseInput,
          includeNeutral: valuesNeutral,
          includeOriginal: valuesIncludeOriginal,
          includeRangeFinder: valuesRangeFinder,
          includeHistogram: valuesHistogram,
          includeSimplified: false
        });
        svg = result.svg;
        width = result.width;
        height = result.height;
      }

      const scale = Math.max(1, Math.min(4, $exportScale));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-values.png`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Values analysis PNG saved.', 'info');
      }
    });
  }

  // --- Individual value saves ---
  async function ensureValuesData() {
    const levels = get(valueAnalysisLevels);
    const notanMode = get(valueAnalysisNotanMode);
    return loadValueAnalysisForExport(levels, notanMode);
  }

  async function saveNeutralImage() {
    if (!file) return;
    await performSave(async () => {
      const currentStudy = await ensureValuesData();
      if (valuesIncludeOriginal) {
        const originalSrc = file!.previewUrl || '';
        if (!originalSrc) throw new Error('Original image preview unavailable for export.');
        const neutralSrc = convertFileSrc(currentStudy.neutral);
        const { svg, width, height } = await generateValueAnalysisSvg({
          originalSrc,
          neutralSrc,
          previewSrc: '',
          neutralWidth: currentStudy.neutralWidth,
          neutralHeight: currentStudy.neutralHeight,
          previewWidth: currentStudy.previewWidth,
          previewHeight: currentStudy.previewHeight,
          p10: currentStudy.p10,
          p90: currentStudy.p90,
          p01: currentStudy.p01,
          p99: currentStudy.p99,
          bucketValues: currentStudy.bucketValues,
          boundaries: currentStudy.boundaries,
          counts: currentStudy.counts,
          histogramBins: currentStudy.histogramBins,
          levels: currentStudy.levels,
          background: 'none',
          includeNeutral: true,
          includeOriginal: true,
          includeRangeFinder: false,
          includeHistogram: false,
          includeSimplified: false
        });
        const scale = Math.max(1, Math.min(4, $exportScale));
        const blob = await svgToPngBlob(svg, width, height, scale);
        const bridge = await getFsBridge();
        const { canceled } = await bridge.saveBlob(blob, `${baseName()}-neutral.png`);
        if (canceled) setStatus('Export canceled.', 'info');
        else setStatus('Neutral values PNG saved.', 'info');
      } else {
        const { canceled } = await saveFromPath(currentStudy.neutral, `${baseName()}-neutral.png`);
        if (canceled) setStatus('Export canceled.', 'info');
        else setStatus('Neutral image saved.', 'info');
      }
    });
  }

  async function buildValuesSectionSvg(
    section: 'rangeFinder' | 'histogram' | 'simplified'
  ): Promise<{ svg: string; width: number; height: number }> {
    const currentStudy = await ensureValuesData();
    const originalSrc = file!.previewUrl || '';
    const neutralSrc = convertFileSrc(currentStudy.neutral);
    const previewSrc = convertFileSrc(currentStudy.preview);
    return generateValueAnalysisSvg({
      originalSrc,
      neutralSrc,
      previewSrc,
      neutralWidth: currentStudy.neutralWidth,
      neutralHeight: currentStudy.neutralHeight,
      previewWidth: currentStudy.previewWidth,
      previewHeight: currentStudy.previewHeight,
      p10: currentStudy.p10,
      p90: currentStudy.p90,
      p01: currentStudy.p01,
      p99: currentStudy.p99,
      bucketValues: currentStudy.bucketValues,
      boundaries: currentStudy.boundaries,
      counts: currentStudy.counts,
      histogramBins: currentStudy.histogramBins,
      levels: currentStudy.levels,
      background: 'none',
      includeNeutral: false,
      includeOriginal: false,
      includeRangeFinder: section === 'rangeFinder',
      includeHistogram: section === 'histogram',
      includeSimplified: section === 'simplified'
    });
  }

  async function saveRangeFinderPng() {
    if (!file) return;
    await performSave(async () => {
      const { svg, width, height } = await buildValuesSectionSvg('rangeFinder');
      const scale = Math.max(1, Math.min(4, $exportScale));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-range-finder.png`);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Range finder PNG saved.', 'info');
    });
  }

  async function saveValuesHistogramPng() {
    if (!file) return;
    await performSave(async () => {
      const { svg, width, height } = await buildValuesSectionSvg('histogram');
      const scale = Math.max(1, Math.min(4, $exportScale));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-values-histogram.png`);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Values histogram PNG saved.', 'info');
    });
  }

  async function saveSimplifiedPng() {
    if (!file) return;
    await performSave(async () => {
      const { svg, width, height } = await buildValuesSectionSvg('simplified');
      const scale = Math.max(1, Math.min(4, $exportScale));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-simplified.png`);
      if (canceled) setStatus('Export canceled.', 'info');
      else setStatus('Simplified values PNG saved.', 'info');
    });
  }

  // --- Individual saves ---
  async function saveIndividualPng(
    generator: () => { svg: string; width: number; height: number },
    suffix: string
  ) {
    await performSave(async () => {
      const { svg, width, height } = generator();
      const scale = Math.max(1, Math.min(4, $exportScale));
      const blob = await svgToPngBlob(svg, width, height, scale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-${suffix}.png`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus(`${suffix} PNG saved.`, 'info');
      }
    });
  }

  function polarGenerator() {
    return generateCircleGraphSvg(result!.clusters, {
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: paramSnapshot.showAxisLabels,
      showStroke: paramSnapshot.showClusterOutline,
      mode: paramSnapshot.polarMode
    });
  }

  function histogramGenerator() {
    return generateHistogramSvg(result!.clusters, {
      sortBy: paramSnapshot.histogramSort
    });
  }

  function hueLightnessGenerator() {
    return generateHueLightnessSvg(result!.clusters, {
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: paramSnapshot.showAxisLabels,
      showStroke: paramSnapshot.showClusterOutline,
      sizeMode: paramSnapshot.hueLightnessSizeMode
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
          <input type="checkbox" bind:checked={colorsSourceImage} />
          <span>Source Image</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving || !file.previewUrl} onclick={saveSourceImagePng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={colorsPolarChart} />
          <span>Polar Chart</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualPng(polarGenerator, 'polar')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={colorsHistogram} />
          <span>Cluster Histogram</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include frequency, hue, and lightness sort modes">
              <input type="checkbox" bind:checked={colorsHistogramAll} disabled={!colorsHistogram} />
              <span class="sub-toggle-label">All sorts</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualPng(histogramGenerator, 'histogram')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={colorsHueLightness} />
          <span>Hue × Lightness</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualPng(hueLightnessGenerator, 'hue-lightness')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={colorsPaletteStrip} />
          <span>Palette Strip (top 20)</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={() => saveIndividualPng(paletteGenerator, 'palette')}>↓</button>
        </label>
        <label class="builder-item" class:disabled={!videoStrip}>
          <input type="checkbox" bind:checked={colorsVideoBarcode} disabled={!videoStrip} />
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
          <input type="checkbox" bind:checked={valuesNeutral} />
          <span>Neutral Values</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include original image alongside neutral">
              <input type="checkbox" bind:checked={valuesIncludeOriginal} disabled={!valuesNeutral} />
              <span class="sub-toggle-label">Include original</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={saveNeutralImage}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={valuesRangeFinder} />
          <span>Range Finder</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={saveRangeFinderPng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={valuesHistogram} />
          <span>Values Histogram</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={saveValuesHistogramPng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={valuesSimplified} />
          <span>Simplified Values</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include all 4 notan study levels (2-5)">
              <input type="checkbox" bind:checked={valuesAllStudies} disabled={!valuesSimplified} />
              <span class="sub-toggle-label">All studies</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={isSaving} onclick={saveSimplifiedPng}>↓</button>
        </label>
      </div>
      <button class="composite-btn" disabled={isSaving || !valuesAnyChecked} onclick={exportValuesComposite}>
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
        <div class="data-row placeholder">
          <span>Palette .ase</span>
          <span class="spacer"></span>
          <span class="badge">IMP-106</span>
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
    <div class="empty">Select an image and complete analysis to unlock exports.</div>
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

  .data-row.placeholder {
    opacity: 0.5;
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

  .badge {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 10px;
    background: rgba(33, 33, 32, 0.08);
    color: rgba(33, 33, 32, 0.5);
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
