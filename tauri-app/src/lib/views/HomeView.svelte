<script lang="ts" module>
  let lastRequestKey: string | null = null;
</script>

<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  // NOTE: Temporary inline overlays to bypass slot/runtime issue in container
  import type {
    AnalysisParams,
    ImageEntry,
    SelectedImage,
    AnalysisResult,
    AnalysisState
  } from '../stores/ui';
  import {
    selectedFile,
    params,
    setFile,
    clearFile,
    analysisState,
    analysisResult,
    analysisError,
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError,
    clearAnalysisError,
    openZoomOverlay
  } from '../stores/ui';
  import { analyzeImage } from '../compute/bridge';
  import { TauriComputeError } from '../bridges/compute';
  import { loadImageDataset } from '../compute/image-loader';
  import { getFsBridge, type FileSelection } from '../bridges/fs';
  import { isTauriEnv, getBridgeOverride, tauriDetectionInfo } from '../bridges/tauri';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';
  import { generateHistogramSvg } from '../exports/histogram';

  const ANALYZE_DEBOUNCE_MS = 400;
  const SPINNER_THRESHOLD_MS = 150;
  const isDev = import.meta.env.DEV ?? false;
  const devEnabled = isDev;

  let dragging = $state(false);
  let draggingWindow = $state(false);
  let bannerMessage = $state<string | null>(null);
  let spinnerVisible = $state(false);
  let devBannerVisible = $state(false);
  let devBannerData = $state<DevBannerDetails | null>(null);
  let devBannerFileLogged = false;
  let devBannerAnalysisLogged = false;
  let isScrubbing = $state(false);

  let dropRef = $state<HTMLElement | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToken = 0;
  let loadToken = 0;

  let file = $state<SelectedImage | null>(get(selectedFile));
  let currentParams = $state<AnalysisParams>(get(params));
  let status = $state<AnalysisState>(get(analysisState));
  let result = $state<AnalysisResult | null>(null);
  let analysisErr = $state<string | null>(null);

  interface DevBannerDetails {
    detection: ReturnType<typeof tauriDetectionInfo>;
    override: string | null;
    fsBridge?: string;
    computeVariant?: string;
  }

  function isNativeModeActive(): boolean {
    return isTauriEnv() || getBridgeOverride() === 'tauri';
  }

  function mapErrorToMessage(error: unknown): string {
    if (error instanceof TauriComputeError) {
      switch (error.code) {
        case 'missing-path':
          return 'Native analysis could not find the original file. Please reselect the image.';
        case 'invalid-response':
          return 'Native analysis returned unexpected data. Review the Tauri console for details.';
        case 'invoke-failed':
          return 'Native analysis failed to start. Restart the app or check the console output.';
        default:
          return 'Native analysis reported an unexpected error.';
      }
    }
    if (error instanceof Error) {
      return error.message || 'Unexpected error. Check console output for details.';
    }
    return 'Unexpected error. Check console output for details.';
  }

  function ensureDevBannerDetails(): DevBannerDetails {
    const base = devBannerData ?? {
      detection: tauriDetectionInfo(),
      override: getBridgeOverride()
    };
    return {
      ...base,
      detection: tauriDetectionInfo(),
      override: getBridgeOverride()
    };
  }

  function recordDevEvent(update: Partial<DevBannerDetails>, type: 'file' | 'analysis') {
    if (!devEnabled) return;
    const details = { ...ensureDevBannerDetails(), ...update };
    devBannerData = details;

    const shouldShow =
      (type === 'file' && !devBannerFileLogged) || (type === 'analysis' && !devBannerAnalysisLogged);
    if (shouldShow) {
      devBannerVisible = true;
      console.info('[dev] tauri detection', {
        detection: details.detection,
        override: details.override,
        fsBridge: details.fsBridge ?? 'pending',
        computeBridge: details.computeVariant ?? 'pending'
      });
    }

    if (type === 'file') {
      devBannerFileLogged = true;
    } else {
      devBannerAnalysisLogged = true;
    }
  }

  function dismissDevBanner() {
    devBannerVisible = false;
  }

  const polarChart = $derived.by(() => {
    if (!result) return null;
    return generateCircleGraphSvg(result.clusters, {
      symbolScale: currentParams.symbolScale,
      showAxisLabels: currentParams.showAxisLabels,
      showStroke: currentParams.showClusterOutline,
      showGamutBackground: currentParams.showGamutBackground,
      showPaletteMask: currentParams.showPaletteMask,
      useHsl: currentParams.useHslPolar,
      useGradient: currentParams.useGradientOverlay,
      size: 420
    });
  });

  const hueLightnessChart = $derived.by(() => {
    if (!result) return null;
    return generateHueLightnessSvg(result.clusters, {
      symbolScale: currentParams.symbolScale,
      showAxisLabels: currentParams.showAxisLabels,
      showStroke: currentParams.showClusterOutline,
      sizeMode: currentParams.hueLightnessSizeMode,
      useGradient: currentParams.useGradientOverlay,
      width: 420,
      height: 240
    });
  });

  const histogram = $derived.by(() => {
    if (!result) return null;
    return generateHistogramSvg(result.clusters, {
      width: 520,
      height: 180,
      maxBars: 120,
      sortBy: currentParams.histogramSort
    });
  });

  const histogramSortLabel = $derived.by(() =>
    formatHistogramSortLabel(currentParams.histogramSort)
  );

  function buildPreviewUrl(selection: FileSelection, nativeMode: boolean): string | null {
    if (nativeMode && selection.path) {
      return convertFileSrc(selection.path);
    }
    if (selection.blob && selection.blob.size > 0) {
      return URL.createObjectURL(selection.blob);
    }
    return null;
  }

  function openImageZoom() {
    if (!file?.previewUrl) return;
    openZoomOverlay({
      kind: 'image',
      src: file.previewUrl,
      alt: file?.name ?? 'Selected image'
    });
  }

  function openSvgZoom(svg: string | undefined, width: number | undefined, height: number | undefined) {
    if (!svg || !width || !height) return;
    openZoomOverlay({ kind: 'svg', svg, width, height });
  }

  function handleZoomKeydown(
    event: KeyboardEvent,
    svg: string | undefined,
    width: number | undefined,
    height: number | undefined
  ) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openSvgZoom(svg, width, height);
  }

  function handleScrubStart(_event: PointerEvent) {
    isScrubbing = true;
  }

  function handleScrubEnd() {
    if (!isScrubbing) return;
    isScrubbing = false;
    if (file) {
      scheduleAnalysisWith(file, currentParams);
    }
  }

  $effect(() => {
	    const unsubFile = selectedFile.subscribe((value) => {
	      file = value;
	    });
	    const unsubParams = params.subscribe((value) => {
	      currentParams = { ...value };
	    });
	    const unsubStatus = analysisState.subscribe((value) => {
	      status = value;
	    });
    const unsubResult = analysisResult.subscribe((value) => {
      result = value;
    });
    const unsubError = analysisError.subscribe((value) => {
      analysisErr = value;
    });
    return () => {
      unsubFile();
      unsubParams();
      unsubStatus();
      unsubResult();
      unsubError();
    };
  });

  async function chooseFile() {
    try {
      const bridge = await getFsBridge();
      const selection = await bridge.openImageFile();
      if (!selection) {
        return;
      }
      recordDevEvent({ fsBridge: bridge.id }, 'file');
      await ingestSelection(selection);
    } catch (error) {
      console.error('[home] Failed to open native dialog', error);
      bannerMessage = 'Could not open the native file dialog. Restart the app or verify Tauri is running.';
    }
  }

  function handleDropzoneKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void chooseFile();
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    dragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    if (!dropRef) return;
    if (!event.relatedTarget || !dropRef.contains(event.relatedTarget as Node)) {
      dragging = false;
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    dragging = false;
    draggingWindow = false;
    if (isTauriEnv() || getBridgeOverride() === 'tauri') {
      return;
    }
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const fileHandle = files[0];
    if (files.length > 1) {
      bannerMessage = 'Multiple files dropped — using the first file; others skipped.';
    }
    const selection: FileSelection = {
      name: fileHandle.name,
      blob: fileHandle,
      size: fileHandle.size,
      path: (fileHandle as unknown as { path?: string }).path ?? fileHandle.name,
      lastModified: fileHandle.lastModified,
      mimeType: fileHandle.type || undefined
    };
    void ingestSelection(selection);
  }

  function clearSelection() {
    clearFile();
    cancelPending();
  }

  async function ingestSelection(fileSelection: FileSelection) {
    loadToken += 1;
    const token = loadToken;
    cancelPending();
    try {
      let dataset;
      const nativeMode = (isTauriEnv() || getBridgeOverride() === 'tauri') && !!fileSelection.path;
      if (nativeMode) {
        // Defer decoding to native; use a placeholder dataset
        (globalThis as any).__ACTIVE_IMAGE_PATH__ = fileSelection.path;
        dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      } else {
        dataset = await loadImageDataset(fileSelection.blob);
      }
      if (token !== loadToken) return;
      const previewUrl = buildPreviewUrl(fileSelection, nativeMode);
      const source: ImageEntry['source'] = nativeMode && fileSelection.path
        ? { kind: 'path', path: fileSelection.path }
        : { kind: 'blob' };
      const selected: ImageEntry = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        name: fileSelection.name || fileSelection.path || 'image',
        path: fileSelection.path,
        size: fileSelection.size,
        source,
        previewUrl
      };
      bannerMessage = null;
      setFile(selected, dataset);
      const snapshot = get(params);
      scheduleAnalysisWith({ ...selected, dataset }, snapshot);
    } catch (error) {
      console.error('[home] Failed to decode image', error);
      if (token === loadToken) {
        setAnalysisError('Failed to decode the selected image. Please try another file.');
      }
    }
  }

  function cancelPending() {
    currentToken += 1;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (spinnerTimer) {
      clearTimeout(spinnerTimer);
      spinnerTimer = null;
    }
    spinnerVisible = false;
  }

  function scheduleAnalysisWith(fileHandle: SelectedImage, paramSnapshot: AnalysisParams) {
    const keyObj = {
      id: fileHandle.id,
      clusters: paramSnapshot.clusters,
      quality: paramSnapshot.quality,
      ignoreTopN: paramSnapshot.ignoreTopN,
      tol: 1e-3,
      maxIter: 40,
      seed: 1,
      maxSamples: 300_000
    };
    const key = JSON.stringify(keyObj);
    if (key === lastRequestKey && status !== 'error') {
      return;
    }
    lastRequestKey = key;
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const snapshot: AnalysisParams = { ...paramSnapshot };
    debounceTimer = setTimeout(() => runAnalysis(fileHandle, snapshot), ANALYZE_DEBOUNCE_MS);
  }

  async function runAnalysis(image: SelectedImage, paramSnapshot: AnalysisParams) {
    currentToken += 1;
    const token = currentToken;
    setAnalysisPending();
    spinnerVisible = false;
    if (spinnerTimer) {
      clearTimeout(spinnerTimer);
    }
    spinnerTimer = setTimeout(() => {
      if (token === currentToken && status === 'pending') {
        spinnerVisible = true;
      }
    }, SPINNER_THRESHOLD_MS);

    try {
      const response = await analyzeImage(image.dataset, {
        ...paramSnapshot,
        tol: 1e-3,
        maxIter: 40,
        seed: 1,
        maxSamples: 300_000
      });
      if (token !== currentToken) {
        return;
      }
      recordDevEvent({ computeVariant: response.variant }, 'analysis');
      setAnalysisSuccess(response, image.id);
    } catch (err) {
      if (token !== currentToken) {
        return;
      }
      recordDevEvent({ computeVariant: 'error' }, 'analysis');
      console.error('[home] analysis failed', err);
      const message = mapErrorToMessage(err);
      setAnalysisError(message);
    } finally {
      if (token === currentToken) {
        if (spinnerTimer) {
          clearTimeout(spinnerTimer);
          spinnerTimer = null;
        }
        spinnerVisible = false;
      }
    }
  }

  function retryAnalysis() {
    clearAnalysisError();
    const currentFile = file;
    if (currentFile) {
      scheduleAnalysisWith(currentFile, currentParams);
    }
  }

  function dismissBanner() {
    bannerMessage = null;
  }

  function formatHistogramSortLabel(sortBy: AnalysisParams['histogramSort']): string {
    if (sortBy === 'hue') return 'Top clusters by hue';
    if (sortBy === 'lightness') return 'Top clusters by lightness';
    return 'Top clusters by frequency';
  }

  onMount(() => {
    let dragDepth = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showOverlay = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      draggingWindow = true;
    };
    const hideOverlay = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      hideTimer = setTimeout(() => {
        if (dragDepth <= 0) {
          draggingWindow = false;
          dragging = false;
        }
        hideTimer = null;
      }, 60);
    };

    const onDragEnter = (event: DragEvent) => {
      event.preventDefault();
      dragDepth += 1;
      showOverlay();
    };
    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) hideOverlay();
    };
    const onDrop = (event: DragEvent) => {
      dragDepth = 0;
      if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
      }
      draggingWindow = false;
      dragging = false;
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('pointerup', handleScrubEnd);
    window.addEventListener('pointercancel', handleScrubEnd);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('pointerup', handleScrubEnd);
      window.removeEventListener('pointercancel', handleScrubEnd);
    };
  });

  onDestroy(() => {
    cancelPending();
  });

  $effect(() => {
    const activeFile = file;
    const paramSnapshot = currentParams;
    if (!activeFile) {
      cancelPending();
      return;
    }
    if (isScrubbing) {
      return;
    }
    scheduleAnalysisWith(activeFile, paramSnapshot);
  });
</script>

<section class="home">
  <header>
    <h1>Colors</h1>
  </header>

  {#if devEnabled && devBannerVisible && devBannerData}
    <aside class="dev-banner" role="status" aria-label="Tauri detection summary">
      <div class="dev-banner__header">
        <strong>Dev detection</strong>
        <button class="dev-banner__close" type="button" onclick={dismissDevBanner}>
          Dismiss
        </button>
      </div>
      <div class="dev-banner__grid">
        <div>
          <span class="dev-banner__label">Override</span>
          <span>{devBannerData.override ?? 'none'}</span>
        </div>
        <div>
          <span class="dev-banner__label">FS bridge</span>
          <span>{devBannerData.fsBridge ?? 'pending'}</span>
        </div>
        <div>
          <span class="dev-banner__label">Compute</span>
          <span>{devBannerData.computeVariant ?? 'pending'}</span>
        </div>
      </div>
      <details>
        <summary>Detection info</summary>
        <pre>{JSON.stringify(devBannerData.detection, null, 2)}</pre>
      </details>
    </aside>
  {/if}

  {#if file}
    <section class="analysis-layout">
      <div class="analysis-column">
        <div
          bind:this={dropRef}
          class:dragging={dragging}
          class="dropzone dropzone--image"
          tabindex="0"
          role="button"
          aria-label="Image dropzone"
          aria-busy={status === 'pending'}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          ondrop={handleDrop}
          onkeydown={handleDropzoneKeydown}
        >
          <div
            class="image-preview zoomable"
            role="button"
            tabindex="0"
            onclick={openImageZoom}
            onkeydown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              openImageZoom();
            }}
          >
            {#if file?.previewUrl}
              <img src={file.previewUrl} alt={file?.name ?? 'Selected image'} />
            {:else}
              <div class="preview-placeholder">Image preview unavailable.</div>
            {/if}
          </div>
        </div>
        {#if status === 'ready' && result}
          <article class="analysis-card">
            <header class="analysis-header">
              <div>
                <h2>Cluster Histogram</h2>
                <span>{histogramSortLabel}</span>
              </div>
              <div class="toggle-group">
                <button
                  type="button"
                  class:active={$params.histogramSort === 'frequency'}
                  onclick={() => ($params.histogramSort = 'frequency')}
                >
                  Frequency
                </button>
                <button
                  type="button"
                  class:active={$params.histogramSort === 'hue'}
                  onclick={() => ($params.histogramSort = 'hue')}
                >
                  Hue
                </button>
                <button
                  type="button"
                  class:active={$params.histogramSort === 'lightness'}
                  onclick={() => ($params.histogramSort = 'lightness')}
                >
                  Lightness
                </button>
              </div>
              <span class="metrics">
                {Math.round(result.durationMs)} ms · {result.iterations} iterations ·
                {result.totalSamples.toLocaleString()} samples
              </span>
            </header>
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openSvgZoom(histogram?.svg, histogram?.width, histogram?.height)}
              onkeydown={(event) =>
                handleZoomKeydown(event, histogram?.svg, histogram?.width, histogram?.height)}
            >
              {#if histogram}
                {@html histogram.svg}
              {:else}
                <div class="placeholder">Histogram unavailable.</div>
              {/if}
            </div>
          </article>
        {/if}
      </div>
      <div class="analysis-column">
        {#if status === 'ready' && result}
          <article class="analysis-card">
            <header class="analysis-header">
              <div>
                <h2>Polar Chart</h2>
                <span>Hue · Chroma</span>
              </div>
              <div class="toggle-group">
                <button
                  type="button"
                  class:active={!$params.useHslPolar}
                  onclick={() => ($params.useHslPolar = false)}
                >
                  OKLCH
                </button>
                <button
                  type="button"
                  class:active={$params.useHslPolar}
                  onclick={() => ($params.useHslPolar = true)}
                >
                  HSL
                </button>
              </div>
            </header>
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openSvgZoom(polarChart?.svg, polarChart?.width, polarChart?.height)}
              onkeydown={(event) => handleZoomKeydown(event, polarChart?.svg, polarChart?.width, polarChart?.height)}
            >
              {#if polarChart}
                {@html polarChart.svg}
              {:else}
                <div class="placeholder">Chart unavailable.</div>
              {/if}
            </div>
          </article>
          <article class="analysis-card">
            <header class="analysis-header">
              <div>
                <h2>Hue × Lightness</h2>
                <span>Hue · Lightness</span>
              </div>
              <div class="toggle-group">
                <button
                  type="button"
                  class:active={$params.hueLightnessSizeMode === 'chroma'}
                  onclick={() => ($params.hueLightnessSizeMode = 'chroma')}
                >
                  Chroma
                </button>
                <button
                  type="button"
                  class:active={$params.hueLightnessSizeMode === 'frequency'}
                  onclick={() => ($params.hueLightnessSizeMode = 'frequency')}
                >
                  Frequency
                </button>
              </div>
            </header>
            <div
              class="chart zoomable"
              role="button"
              tabindex="0"
              onclick={() => openSvgZoom(hueLightnessChart?.svg, hueLightnessChart?.width, hueLightnessChart?.height)}
              onkeydown={(event) =>
                handleZoomKeydown(event, hueLightnessChart?.svg, hueLightnessChart?.width, hueLightnessChart?.height)}
            >
              {#if hueLightnessChart}
                {@html hueLightnessChart.svg}
              {:else}
                <div class="placeholder">Chart unavailable.</div>
              {/if}
            </div>
          </article>
        {/if}
      </div>
    </section>
    <div class="selection selection--compact">
      <div>
        <strong>Selected file:</strong>
        <span>{file?.name}</span>
      </div>
      <button onclick={clearSelection}>Clear</button>
    </div>
  {:else}
    <div
      bind:this={dropRef}
      class:dragging={dragging}
      class="dropzone"
      tabindex="0"
      role="button"
      aria-label="Image dropzone"
      aria-busy={status === 'pending'}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      ondrop={handleDrop}
      onkeydown={handleDropzoneKeydown}
    >
      <div class="inner">
        <p class="title">Drop anywhere</p>
        <p class="note">or</p>
        <button class="upload" onclick={chooseFile}>Upload</button>
        <p class="formats">Supported formats: PNG, JPEG, WebP.</p>
      </div>
    </div>
    <div class="selection empty">
      <span>No file selected yet.</span>
    </div>
  {/if}

  <!-- Full-window drag overlay -->
  {#if draggingWindow}
    <div class="overlay-root visible" aria-hidden="true">
      <div class="overlay-panel">
        <div style="display:grid;place-items:center;gap:8px;min-width:280px">
          <div class="spinner" aria-hidden="true" style="display:none"></div>
          <div style="font-size:20px;font-weight:500">Drop Anywhere</div>
          <div style="font-size:12px;opacity:.8">PNG · JPEG · WebP</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading overlay -->
  {#if status === 'pending' && spinnerVisible}
    <div class="overlay-root visible" role="dialog" aria-label="Analyzing…">
      <div class="overlay-panel">
        <div style="display:grid;place-items:center;gap:12px">
          <div class="spinner" aria-label="loading"></div>
          <div style="font-size:12px;opacity:.8">This may take a moment</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Drag/drop notice overlay -->
  {#if bannerMessage}
    <div class="overlay-root visible" role="dialog" aria-label="Notice">
      <div class="overlay-panel">
        <p style="margin:0">{bannerMessage}</p>
        <div class="overlay-actions" style="margin-top:16px">
          <button class="close-btn" onclick={dismissBanner}>Close</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Analysis error overlay -->
  {#if status === 'error'}
    <div class="overlay-root visible" role="dialog" aria-label="Analysis failed">
      <div class="overlay-panel">
        <p style="margin:0 0 12px 0">{analysisErr ?? 'Unknown issue while analyzing the image.'}</p>
        <div class="overlay-actions" style="margin-top:16px">
          <button class="retry" onclick={retryAnalysis}>Retry</button>
          <button class="close-btn" onclick={clearAnalysisError}>Close</button>
        </div>
      </div>
    </div>
  {/if}


  <section class="controls">
    <h2>Parameters</h2>
    <div class="grid">
      <label>
        <span>Number of clusters: <strong>{$params.clusters}</strong></span>
        <input
          type="range"
          min="1"
          max="10000"
          step="1"
          bind:value={$params.clusters}
          onpointerdown={handleScrubStart}
          onpointerup={handleScrubEnd}
          onpointercancel={handleScrubEnd}
          onblur={handleScrubEnd}
        />
        <input class="number-input" type="number" min="1" max="10000" step="1" bind:value={$params.clusters} />
      </label>
      <label>
        <span>Speed ← → Quality: <strong>{$params.quality}</strong></span>
        <input
          type="range"
          min="0"
          max="4"
          step="1"
          bind:value={$params.quality}
          onpointerdown={handleScrubStart}
          onpointerup={handleScrubEnd}
          onpointercancel={handleScrubEnd}
          onblur={handleScrubEnd}
        />
      </label>
      <label>
        <span>Exclude top clusters: <strong>{$params.ignoreTopN}</strong></span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          bind:value={$params.ignoreTopN}
          onpointerdown={handleScrubStart}
          onpointerup={handleScrubEnd}
          onpointercancel={handleScrubEnd}
          onblur={handleScrubEnd}
        />
      </label>
      <label>
        <span>Symbol size: <strong>{$params.symbolScale.toFixed(1)}</strong></span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          bind:value={$params.symbolScale}
          onpointerdown={handleScrubStart}
          onpointerup={handleScrubEnd}
          onpointercancel={handleScrubEnd}
          onblur={handleScrubEnd}
        />
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showClusterOutline} />
        Cluster outline
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showAxisLabels} />
        Axis labels
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showGamutBackground} />
        Gamut background
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.showPaletteMask} />
        Palette mask
      </label>
      <label class="choice">
        <input type="checkbox" bind:checked={$params.useGradientOverlay} />
        Blend overlaps (gradient)
      </label>
    </div>
  </section>
</section>

<style>
  .home {
    max-width: 1120px;
    margin: 0 auto;
  }

  .dev-banner {
    margin: 12px 0 20px 0;
    padding: 12px 16px;
    border-radius: 10px;
    background: rgba(33, 33, 32, 0.08);
    border: 1px solid rgba(33, 33, 32, 0.12);
  }

  .dev-banner__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .dev-banner__close {
    border: none;
    background: transparent;
    color: var(--accent);
    font-size: 13px;
    cursor: pointer;
  }

  .dev-banner__grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 8px;
  }

  .dev-banner__label {
    display: block;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.6;
  }

  .dev-banner details {
    margin-top: 4px;
    font-size: 12px;
  }

  .dev-banner pre {
    margin: 6px 0 0 0;
    padding: 8px;
    border-radius: 6px;
    background: rgba(33, 33, 32, 0.08);
    max-height: 200px;
    overflow: auto;
  }

  .dropzone {
    width: 100%;
    border: 2px dashed var(--accent);
    border-radius: 12px;
    padding: 56px;
    text-align: center;
    background: rgba(130, 76, 50, 0.06);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .dropzone--image {
    padding: 16px;
    background: rgba(255, 255, 255, 0.7);
  }

  .dropzone:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 4px;
  }

  .dropzone.dragging {
    background: rgba(130, 76, 50, 0.12);
    border-color: var(--accent);
  }

  .image-preview {
    width: 100%;
    display: grid;
    place-items: center;
  }

  .image-preview img {
    max-width: 100%;
    max-height: 320px;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
  }

  .preview-placeholder {
    padding: 24px;
    color: rgba(33, 33, 32, 0.6);
  }

  .analysis-layout {
    margin-top: 20px;
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr);
    gap: 20px;
    align-items: center;
  }

  .analysis-column {
    display: grid;
    gap: 20px;
    align-content: start;
  }

  .analysis-card {
    background: var(--panel);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow);
  }

  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .analysis-header span {
    font-size: 12px;
    opacity: 0.7;
  }

  .metrics {
    font-size: 12px;
    opacity: 0.7;
  }

  .toggle-group {
    display: inline-flex;
    gap: 6px;
    background: rgba(33, 33, 32, 0.08);
    border-radius: 999px;
    padding: 4px;
  }

  .toggle-group button {
    border: none;
    background: transparent;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    color: rgba(33, 33, 32, 0.7);
  }

  .toggle-group button.active {
    background: var(--accent);
    color: #fff;
  }

  .chart :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .placeholder {
    padding: 16px;
    color: rgba(33, 33, 32, 0.6);
  }

  .selection--compact {
    margin-top: 16px;
  }

  @media (max-width: 980px) {
    .analysis-layout {
      grid-template-columns: 1fr;
      align-items: stretch;
    }
  }

  .number-input {
    margin-top: 8px;
    width: 120px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
    font: inherit;
  }

  .dropzone .title {
    font-size: 20px;
    margin-bottom: 8px;
  }

  .formats {
    margin-top: 12px;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.6);
  }

  .upload {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
  }

  .selection {
    margin-top: 24px;
    padding: 16px;
    border-radius: 8px;
    background: var(--panel);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .selection.empty {
    color: rgba(33, 33, 32, 0.6);
    font-style: italic;
  }

  .selection button {
    border: 1px solid var(--line);
    background: transparent;
    border-radius: 6px;
    padding: 8px 12px;
  }

  .controls {
    margin-top: 32px;
    background: var(--panel);
    border-radius: 12px;
    padding: 20px;
    box-shadow: var(--shadow);
  }

  .controls h2 {
    margin-top: 0;
    font-size: 18px;
  }

  .grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
  }

  input {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font: inherit;
    background: #fff;
  }

  input[type='range'] {
    width: 100%;
  }

  .choice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .retry {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid var(--color-border-strong);
    background: transparent;
    font: inherit;
    cursor: pointer;
  }
</style>
