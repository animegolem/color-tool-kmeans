<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import {
    params,
    openZoomOverlay,
    appendFile,
    setFile,
    updateEntryPreview,
    libraryDrawerOpen
  } from '../stores/ui';
  import {
    pinnedImages,
    pinnedImageIds,
    clearPins,
    multiAnalysisState,
    multiAnalysisResult,
    multiAnalysisError,
    multiCompositePath
  } from '../stores/multi-analysis';
  import type { AnalysisResult } from '../stores/analysis';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHistogramSvg } from '../exports/histogram';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';
  import { openSvgZoom, openImageZoom, handleZoomKeydown } from '../utils/zoom';
  import { assetUrl } from '../utils/asset-url';
  import { getFsBridge } from '../bridges/fs';
  import { ingestFileAsEntry } from '../services/media-ingestion';
  import { setActivePath } from '../services/active-image';
  import { subscribeMediaLoadRequested } from '../services/view-subscriptions';
  import { createBatchRunner } from './batch/batch-runner.svelte';

  const runner = createBatchRunner();

  let pinned = $state(get(pinnedImages));
  let pinIds = $state(get(pinnedImageIds));
  let batchStatus = $state(get(multiAnalysisState));
  let result: AnalysisResult | null = $state(get(multiAnalysisResult));
  let error: string | null = $state(get(multiAnalysisError));
  let compositePath: string | null = $state(get(multiCompositePath));
  let currentParams = $state(get(params));

  const unsubs: (() => void)[] = [];
  unsubs.push(pinnedImages.subscribe((v) => { pinned = v; }));
  unsubs.push(pinnedImageIds.subscribe((v) => { pinIds = v; }));
  unsubs.push(multiAnalysisState.subscribe((v) => { batchStatus = v; }));
  unsubs.push(multiAnalysisResult.subscribe((v) => { result = v; }));
  unsubs.push(multiAnalysisError.subscribe((v) => { error = v; }));
  unsubs.push(multiCompositePath.subscribe((v) => { compositePath = v; }));
  unsubs.push(params.subscribe((v) => { currentParams = v; }));

  onMount(() => {
    unsubs.push(subscribeMediaLoadRequested(() => chooseMedia()));
  });

  onDestroy(() => {
    unsubs.forEach((fn) => fn());
    runner.cancel();
  });

  const pinCount = $derived(pinned.length);
  const MAX_PINS = 16;
  const overLimit = $derived(pinCount > MAX_PINS);

  type ViewState = 'empty' | 'selection' | 'results';
  const viewState = $derived.by((): ViewState => {
    if (pinCount < 2) return 'empty';
    if (batchStatus === 'ready' && result) return 'results';
    return 'selection';
  });

  const inFlight = $derived(batchStatus === 'compositing' || batchStatus === 'analyzing');
  const showSpinner = $derived(inFlight && runner.spinnerVisible);

  // Reset to selection when pins change and we had results
  let prevPinSnapshot = $state(serializePins(get(pinnedImageIds)));
  $effect(() => {
    const snap = serializePins(pinIds);
    if (snap !== prevPinSnapshot) {
      prevPinSnapshot = snap;
      if (batchStatus === 'ready' || inFlight) {
        runner.reset();
      }
    }
  });

  function serializePins(ids: Set<string>): string {
    return [...ids].sort().join(',');
  }

  async function chooseMedia() {
    try {
      const bridge = await getFsBridge();
      const selections = await bridge.openMediaFiles('images');
      if (!selections?.length) return;
      let firstActivated = false;
      for (const sel of selections) {
        const { entry, dataset } = ingestFileAsEntry(sel, updateEntryPreview);
        if (!firstActivated) {
          firstActivated = true;
          if (entry.path) setActivePath(entry.path);
          setFile(entry, dataset);
        } else {
          appendFile(entry, dataset);
        }
      }
      if (selections.length > 1) libraryDrawerOpen.set(true);
    } catch (err) {
      console.error('[batch] Failed to open native dialog', err);
    }
  }

  function handleAnalyze() {
    const paths = pinned
      .filter((img) => !!img.path)
      .map((img) => img.path!);
    if (paths.length < 2) return;
    void runner.analyze(paths, { ...currentParams });
  }

  function handleClearPins() {
    runner.reset();
    clearPins();
  }

  // Chart derivations
  const polarChart = $derived.by(() => {
    if (!result) return null;
    return generateCircleGraphSvg(result.clusters, {
      symbolScale: currentParams.symbolScale,
      showAxisLabels: currentParams.showAxisLabels,
      showStroke: currentParams.showClusterOutline,
      mode: currentParams.polarMode
    });
  });

  const histogram = $derived.by(() => {
    if (!result) return null;
    return generateHistogramSvg(result.clusters, {
      sortBy: currentParams.histogramSort
    });
  });

  const hueLightnessChart = $derived.by(() => {
    if (!result) return null;
    return generateHueLightnessSvg(result.clusters, {
      symbolScale: currentParams.symbolScale,
      showAxisLabels: currentParams.showAxisLabels,
      showStroke: currentParams.showClusterOutline,
      sizeMode: currentParams.hueLightnessSizeMode
    });
  });

  const compositeUrl = $derived(compositePath ? assetUrl(compositePath) : null);

  const previewCols = $derived(Math.min(pinCount, 4));
</script>

<div class="batch">
  {#if viewState === 'empty'}
    <section class="empty-state">
      <h2>Batch Analysis</h2>
      <p>Pin 2 or more images from the Media Bucket to analyze them together.</p>
      <p class="hint">Min 2, max {MAX_PINS} images. Use the pin icon on each thumbnail in the library.</p>
      <button type="button" class="action-btn" onclick={chooseMedia}>Upload media</button>
    </section>

  {:else if viewState === 'selection'}
    <header class="batch-header">
      <h2>{pinCount} image{pinCount !== 1 ? 's' : ''} pinned</h2>
      <div class="batch-actions">
        <button
          type="button"
          class="analyze-btn"
          disabled={overLimit || inFlight || pinCount < 2}
          onclick={handleAnalyze}
        >
          {inFlight ? 'Analyzing...' : 'Analyze'}
        </button>
        <button type="button" class="clear-btn" onclick={handleClearPins} disabled={inFlight}>
          Clear pins
        </button>
      </div>
    </header>

    {#if overLimit}
      <p class="error-text">Too many pins. Maximum is {MAX_PINS} images.</p>
    {/if}

    <div class="pin-grid" style:--cols={previewCols}>
      {#each pinned as img (img.id)}
        <div class="pin-thumb">
          {#if img.previewUrl}
            <img src={img.previewUrl} alt={img.name} />
          {:else}
            <div class="pin-thumb__placeholder">{img.name}</div>
          {/if}
        </div>
      {/each}
    </div>

    {#if error && batchStatus === 'error'}
      <div class="error-banner" role="alert">
        <p>{error}</p>
      </div>
    {/if}

    {#if showSpinner}
      <div class="spinner-overlay">
        <div class="spinner"></div>
        <span class="spinner-label">{batchStatus === 'compositing' ? 'Compositing grid...' : 'Analyzing...'}</span>
      </div>
    {/if}

  {:else}
    <header class="batch-header">
      <h2>{pinCount} image{pinCount !== 1 ? 's' : ''} analyzed</h2>
      <div class="batch-actions">
        <button type="button" class="clear-btn" onclick={handleClearPins}>Clear pins</button>
      </div>
    </header>

    {#if result}
      <p class="metrics">
        {Math.round(result.durationMs)} ms · {result.iterations} iterations ·
        {result.totalSamples.toLocaleString()} samples · {result.variant}
      </p>
    {/if}

    <section class="results-layout two-columns">
      <div class="results-column">
        <article class="analysis-card">
          <header class="card-header"><h3>Grid Composite</h3></header>
          {#if compositeUrl}
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openImageZoom(compositeUrl, 'Batch composite', openZoomOverlay)}
              onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openImageZoom(compositeUrl, 'Batch composite', openZoomOverlay); }}}
            >
              <img src={compositeUrl} alt="Batch composite grid" />
            </div>
          {/if}
        </article>

        <article class="analysis-card">
          <header class="card-header"><h3>Cluster Histogram</h3></header>
          {#if histogram}
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openSvgZoom(histogram?.svg, histogram?.width, histogram?.height, openZoomOverlay)}
              onkeydown={(e) => handleZoomKeydown(e, histogram?.svg, histogram?.width, histogram?.height, openZoomOverlay)}
            >
              {@html histogram.svg}
            </div>
          {/if}
        </article>
      </div>

      <div class="results-column">
        <article class="analysis-card">
          <header class="card-header"><h3>Polar Chart</h3></header>
          {#if polarChart}
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openSvgZoom(polarChart?.svg, polarChart?.width, polarChart?.height, openZoomOverlay)}
              onkeydown={(e) => handleZoomKeydown(e, polarChart?.svg, polarChart?.width, polarChart?.height, openZoomOverlay)}
            >
              {@html polarChart.svg}
            </div>
          {/if}
        </article>

        <article class="analysis-card">
          <header class="card-header"><h3>Hue x Lightness</h3></header>
          {#if hueLightnessChart}
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openSvgZoom(hueLightnessChart?.svg, hueLightnessChart?.width, hueLightnessChart?.height, openZoomOverlay)}
              onkeydown={(e) => handleZoomKeydown(e, hueLightnessChart?.svg, hueLightnessChart?.width, hueLightnessChart?.height, openZoomOverlay)}
            >
              {@html hueLightnessChart.svg}
            </div>
          {/if}
        </article>
      </div>
    </section>
  {/if}
</div>

<style>
  .batch {
    max-width: 1120px;
    margin: 0 auto;
    padding: 24px 16px;
    container-type: inline-size;
  }

  .empty-state {
    text-align: center;
    padding: 56px 24px;
    border: 2px dashed var(--control-track, #d7d0c4);
    border-radius: 12px;
    background: rgba(130, 76, 50, 0.04);
  }

  .empty-state h2 {
    margin: 0 0 12px;
    font-size: 20px;
  }

  .empty-state p {
    margin: 0 0 8px;
    color: rgba(33, 33, 32, 0.7);
    font-size: 14px;
  }

  .empty-state .hint {
    font-size: 12px;
    opacity: 0.6;
    margin-bottom: 20px;
  }

  .batch-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }

  .batch-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .batch-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .action-btn,
  .analyze-btn {
    background: var(--accent, #824c32);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 20px;
    font-size: 14px;
    cursor: pointer;
  }

  .action-btn:hover,
  .analyze-btn:hover {
    opacity: 0.9;
  }

  .analyze-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .clear-btn {
    background: transparent;
    border: 1px solid var(--color-border-muted, #928b8b);
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 14px;
    cursor: pointer;
  }

  .clear-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pin-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols, 4), 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .pin-thumb {
    aspect-ratio: 1;
    overflow: hidden;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.04);
  }

  .pin-thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pin-thumb__placeholder {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    font-size: 11px;
    color: rgba(33, 33, 32, 0.5);
    padding: 4px;
    text-align: center;
    word-break: break-all;
  }

  .error-text {
    color: #b91c1c;
    font-size: 13px;
    margin: 0 0 12px;
  }

  .error-banner {
    background: rgba(185, 28, 28, 0.08);
    border: 1px solid rgba(185, 28, 28, 0.3);
    border-radius: 8px;
    padding: 12px 16px;
    margin-bottom: 16px;
  }

  .error-banner p {
    margin: 0;
    color: #b91c1c;
    font-size: 13px;
  }

  .spinner-overlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 32px;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(130, 76, 50, 0.2);
    border-top-color: var(--accent, #824c32);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spinner-label {
    font-size: 13px;
    color: rgba(33, 33, 32, 0.6);
  }

  .metrics {
    font-size: 12px;
    opacity: 0.7;
    margin: 0 0 16px;
  }

  .results-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    align-content: start;
  }

  @container (min-width: 760px) {
    .results-layout.two-columns {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      align-items: start;
    }
  }

  .results-column {
    display: grid;
    gap: 20px;
    align-content: start;
  }

  .analysis-card {
    background: var(--panel, #fff);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow, 0 1px 1px rgba(0,0,0,.06));
  }

  .card-header {
    margin-bottom: 12px;
  }

  .card-header h3 {
    margin: 0;
    font-size: 14px;
  }

  .chart :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .chart img {
    width: 100%;
    height: auto;
    display: block;
    border-radius: 4px;
  }

  .zoomable {
    cursor: zoom-in;
  }
</style>
