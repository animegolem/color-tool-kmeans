<script lang="ts">
  import { onMount } from 'svelte';
  import {
    analysisResult,
    analysisState,
    params,
    selectedFile,
    videoState,
    videoFrameLabel,
    exportScale,
    exportChecks,
    graphExportFormat
  } from '../stores/ui';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { multiAnalysisResult, multiCompositePath, pinnedImageIds } from '../stores/multi-analysis';
  import { batchParams } from '../stores/batch-params';
  import { logEvent } from '../bridges/log';
  import { createColorsExportRunner } from './exports/colors-export-runner.svelte';
  import { createValuesExportRunner } from './exports/values-export-runner.svelte';
  import { createBatchExportRunner } from './exports/batch-export-runner.svelte';

  // --- Store-derived state ---
  const file = $derived($selectedFile);
  const result = $derived($analysisResult);

  const videoStrip = $derived.by(() => {
    const vs = $videoState;
    return vs?.stripPath ? { path: vs.stripPath, url: convertFileSrc(vs.stripPath) } : null;
  });

  const colorsAnyChecked = $derived(
    $exportChecks.colorsSourceImage || $exportChecks.colorsPolarChart || $exportChecks.colorsHistogram ||
    $exportChecks.colorsHueLightness || $exportChecks.colorsPaletteStrip || $exportChecks.colorsVideoBarcode
  );
  const valuesAnyChecked = $derived(
    $exportChecks.valuesNeutral || $exportChecks.valuesRangeFinder || $exportChecks.valuesHistogram || $exportChecks.valuesSimplified
  );

  const batchResult = $derived($multiAnalysisResult);
  const batchAnyChecked = $derived(
    $exportChecks.batchCompositeGrid || $exportChecks.batchPolarChart || $exportChecks.batchHistogram ||
    $exportChecks.batchHueLightness || $exportChecks.batchPaletteStrip
  );

  // --- Runners ---
  const colorsRunner = createColorsExportRunner({
    getFile: () => file,
    getResult: () => result,
    getParams: () => $params,
    getExportScale: () => $exportScale,
    getExportChecks: () => $exportChecks,
    getGraphExportFormat: () => $graphExportFormat,
    getVideoStrip: () => videoStrip,
    getVideoFrameLabel: () => $videoFrameLabel,
    getVideoFps: () => $videoState?.fps ?? null
  });

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
    performSave: colorsRunner.performSave,
    baseName: colorsRunner.baseName,
    setStatus: colorsRunner.setStatus
  });

  const batchRunner = createBatchExportRunner({
    getResult: () => batchResult,
    getCompositePath: () => $multiCompositePath,
    getParams: () => $batchParams,
    getExportScale: () => $exportScale,
    getExportChecks: () => $exportChecks,
    getGraphExportFormat: () => $graphExportFormat,
    getPinCount: () => $pinnedImageIds.size,
    performSave: colorsRunner.performSave,
    setStatus: colorsRunner.setStatus
  });

  $effect(() => {
    const _file = file;
    const _result = result;
    if (_file && !_result) {
      void colorsRunner.ensureColorAnalysis();
    }
  });

  onMount(() => {
    void logEvent('exports:view:mount');
    return () => {
      colorsRunner.destroy();
      void logEvent('exports:view:unmount');
    };
  });
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
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving || !file.previewUrl} onclick={colorsRunner.saveSourceImagePng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsPolarChart} />
          <span>Polar Chart</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => colorsRunner.saveIndividualChart(colorsRunner.polarGenerator, 'polar')}>↓</button>
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
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => colorsRunner.saveIndividualChart(colorsRunner.histogramGenerator, 'histogram')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsHueLightness} />
          <span>Hue × Lightness</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => colorsRunner.saveIndividualChart(colorsRunner.hueLightnessGenerator, 'hue-lightness')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.colorsPaletteStrip} />
          <span>Palette Strip (top 20)</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => colorsRunner.saveIndividualChart(colorsRunner.paletteGenerator, 'palette')}>↓</button>
        </label>
        <label class="builder-item" class:disabled={!videoStrip}>
          <input type="checkbox" bind:checked={$exportChecks.colorsVideoBarcode} disabled={!videoStrip} />
          <span>Video Barcode</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving || !videoStrip} onclick={colorsRunner.saveVideoBarcodeImage}>↓</button>
        </label>
        <div class="data-row">
          <span>Palette CSV</span>
          <span class="spacer"></span>
          <button disabled={colorsRunner.isSaving} onclick={colorsRunner.savePaletteCsv}>Save CSV</button>
        </div>
        <div class="data-row">
          <span>Palette .ase</span>
          <span class="spacer"></span>
          <button disabled={colorsRunner.isSaving} onclick={colorsRunner.savePaletteAse}>Save .ase</button>
        </div>
        <div class="data-row">
          <span>Palette JSON</span>
          <span class="spacer"></span>
          <button disabled={colorsRunner.isSaving} onclick={colorsRunner.savePaletteJson}>Save JSON</button>
        </div>
      </div>
      <button class="composite-btn" disabled={colorsRunner.isSaving || !colorsAnyChecked} onclick={colorsRunner.exportColorsComposite}>
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
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={valuesRunner.saveNeutralImage}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.valuesRangeFinder} />
          <span>Range Finder</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={valuesRunner.saveRangeFinderPng}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.valuesHistogram} />
          <span>Values Histogram</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={valuesRunner.saveValuesHistogramPng}>↓</button>
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
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={valuesRunner.saveNotanStudyPng}>↓</button>
        </label>
      </div>
      <button class="composite-btn" disabled={colorsRunner.isSaving || !valuesAnyChecked} onclick={valuesRunner.exportValuesComposite}>
        Export Values Composite
      </button>
    </div>
  {/if}

  {#if batchResult}
    <div class="builder-section">
      <h2>Batch</h2>
      <div class="builder-items">
        <label class="builder-item" class:disabled={!$multiCompositePath}>
          <input type="checkbox" bind:checked={$exportChecks.batchCompositeGrid} disabled={!$multiCompositePath} />
          <span>Composite Grid</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving || !$multiCompositePath} onclick={batchRunner.saveCompositeGridImage}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.batchPolarChart} />
          <span>Polar Chart</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => batchRunner.saveIndividualChart(batchRunner.polarGenerator, 'polar')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.batchHistogram} />
          <span>Cluster Histogram</span>
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <span class="sub-toggle" onclick={(e) => e.stopPropagation()}>
            <label class="sub-toggle-inner" title="Include frequency, hue, and lightness sort modes">
              <input type="checkbox" bind:checked={$exportChecks.batchHistogramAll} disabled={!$exportChecks.batchHistogram} />
              <span class="sub-toggle-label">All sorts</span>
            </label>
          </span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => batchRunner.saveIndividualChart(batchRunner.histogramGenerator, 'histogram')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.batchHueLightness} />
          <span>Hue × Lightness</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => batchRunner.saveIndividualChart(batchRunner.hueLightnessGenerator, 'hue-lightness')}>↓</button>
        </label>
        <label class="builder-item">
          <input type="checkbox" bind:checked={$exportChecks.batchPaletteStrip} />
          <span>Palette Strip (top 20)</span>
          <span class="spacer"></span>
          <button class="item-download" title="Save PNG" disabled={colorsRunner.isSaving} onclick={() => batchRunner.saveIndividualChart(batchRunner.paletteGenerator, 'palette')}>↓</button>
        </label>
        <div class="data-row">
          <span>Palette CSV</span>
          <span class="spacer"></span>
          <button disabled={colorsRunner.isSaving} onclick={batchRunner.savePaletteCsv}>Save CSV</button>
        </div>
        <div class="data-row">
          <span>Palette .ase</span>
          <span class="spacer"></span>
          <button disabled={colorsRunner.isSaving} onclick={batchRunner.savePaletteAse}>Save .ase</button>
        </div>
        <div class="data-row">
          <span>Palette JSON</span>
          <span class="spacer"></span>
          <button disabled={colorsRunner.isSaving} onclick={batchRunner.savePaletteJson}>Save JSON</button>
        </div>
      </div>
      <button class="composite-btn" disabled={colorsRunner.isSaving || !batchAnyChecked} onclick={batchRunner.exportBatchComposite}>
        Export Batch Composite
      </button>
    </div>
  {/if}

  {#if (file && result) || batchResult}
    <div class="builder-section">
      <div class="scale-control scale-control--standalone">
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
        Analyzing…
      {:else}
        Select an image and complete analysis, or run a batch analysis, to unlock exports.
      {/if}
    </div>
  {/if}

  {#if colorsRunner.isSaving}
    <div class="status status-saving">Saving…</div>
  {:else if colorsRunner.message}
    <div class:status-error={colorsRunner.messageVariant === 'error'} class="status">{colorsRunner.message}</div>
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

  .scale-control--standalone {
    margin-top: 0;
    border-top: none;
    padding-top: 0;
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
