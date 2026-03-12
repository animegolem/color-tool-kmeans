<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import type {
    AnalysisParams,
    SelectedImage,
    AnalysisResult,
    AnalysisState
  } from '../stores/ui';
  import {
    selectedFile,
    images,
    activeImageId,
    params,
    clearFile,
    appendFile,
    updateEntryPreview,
    analysisState,
    analysisResult,
    analysisError,
    resetAnalysis,
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError,
    clearAnalysisError,
    openZoomOverlay,
    videoState,
    setVideoState,
    setFile,
    getCachedVideoState,
    cacheVideoState,
    videoStripMode,
    libraryDrawerOpen,
    pendingVideoSwitch,
    mediaLoadRequested,
  } from '../stores/ui';
  import { isTauriEnv, tauriDetectionInfo } from '../bridges/tauri';
  import { getFfmpegVersion } from '../bridges/ffmpeg';
  import { logEvent } from '../bridges/log';
  import { devlog } from '../utils/devlog';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';
  import { generateHistogramSvg } from '../exports/histogram';
  import { openImageZoom as zoomImage } from '../utils/zoom';
  import { createVideoController } from './home/video-controller.svelte';
  import { createAnalysisRunner } from './home/analysis-runner.svelte';
  import { createFileIngestion } from './home/file-ingestion.svelte';
  import { clearActivePath } from '../services/active-image';
  import VideoPanel from './home/VideoPanel.svelte';
  import AnalysisCards from './home/AnalysisCards.svelte';
  import ParameterControls from './home/ParameterControls.svelte';
  import DevBanner from './home/DevBanner.svelte';

  const devEnabled = import.meta.env.DEV ?? false;

  let bannerMessage = $state<string | null>(null);
  let devBannerVisible = $state(false);
  let devBannerData = $state<DevBannerDetails | null>(null);
  let devBannerFileLogged = false;
  let devBannerAnalysisLogged = false;
  let isScrubbing = $state(false);

  let file = $state<SelectedImage | null>(get(selectedFile));
  let currentParams = $state<AnalysisParams>(get(params));
  let status = $state<AnalysisState>(get(analysisState));
  let result = $state<AnalysisResult | null>(null);
  let displayResult = $state<AnalysisResult | null>(null);
  let analysisErr = $state<string | null>(null);

  interface DevBannerDetails {
    detection: ReturnType<typeof tauriDetectionInfo>;
    fsBridge?: string;
    computeVariant?: string;
  }

  function isNativeModeActive(): boolean {
    return isTauriEnv();
  }

  function ensureDevBannerDetails(): DevBannerDetails {
    const base = devBannerData ?? {
      detection: tauriDetectionInfo()
    };
    return {
      ...base,
      detection: tauriDetectionInfo()
    };
  }

  function recordDevEvent(update: Partial<DevBannerDetails>, type: 'file' | 'analysis') {
    if (!devEnabled) return;
    const details = { ...ensureDevBannerDetails(), ...update };
    devBannerData = details;

    const shouldShow =
      (type === 'file' && !devBannerFileLogged) ||
      (type === 'analysis' && !devBannerAnalysisLogged);
    if (shouldShow) {
      devBannerVisible = true;
      console.info('[dev] tauri detection', {
        detection: details.detection,
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

  // --- Analysis runner ---
  const runner = createAnalysisRunner({
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError,
    recordDevEvent
  });

  // Seed dedup key so remount doesn't re-trigger cached analysis
  {
    const cachedResult = get(analysisResult);
    const cachedFile = get(selectedFile);
    if (cachedResult && cachedFile) {
      runner.seedLastRequestKey(cachedFile, get(params));
    }
  }

  // --- File ingestion ---
  const ingestion = createFileIngestion({
    setFile,
    appendFile,
    setAnalysisError,
    cancelPending: runner.cancelPending,
    scheduleAnalysisWith: (f, p, s) => runner.scheduleAnalysisWith(f, p, s),
    recordDevEvent,
    setBannerMessage: (msg) => { bannerMessage = msg; },
    getParams: () => currentParams,
    getStatus: () => status,
    clearVideoSelection: () => video.clearVideoSelection(),
    loadVideoSelection: (sel) => {
      clearActivePath();
      runner.cancelPending();
      video.loadVideoSelection(sel);
    },
    openLibraryDrawer: () => libraryDrawerOpen.set(true),
    updateEntryPreview
  });

  // --- Video controller ---
  const video = createVideoController({
    isNativeModeActive,
    buildPreviewUrl: ingestion.buildPreviewUrl,
    maxDimensionForQuality: ingestion.maxDimensionForQuality,
    setFile,
    setVideoState,
    clearFile,
    getQuality: () => currentParams.quality ?? 2,
    setBannerMessage: (msg) => { bannerMessage = msg; },
    scheduleAnalysisWith: (f, p) => runner.scheduleAnalysisWith(f, p, status),
    getCurrentParams: () => currentParams,
    clearLastRequestKey: () => runner.clearLastRequestKey(),
    captureAnalysisScroll: () => runner.captureAnalysisScroll(),
    getVideoStripMode: () => get(videoStripMode),
    getCachedVideoState,
    cacheVideoState,
    findExistingFrameId: (videoPath: string) => {
      const entry = get(images).find(item => item.videoPath === videoPath);
      return entry?.id ?? null;
    },
    seedAnalysisKey: (imageId: string, paramSnapshot: any) => {
      runner.seedLastRequestKey({ id: imageId } as SelectedImage, paramSnapshot);
    }
  });

  // --- Derived chart state ---
  const chartResult = $derived(displayResult ?? result);

  const polarChart = $derived.by(() => {
    if (!chartResult) return null;
    return generateCircleGraphSvg(chartResult.clusters, {
      symbolScale: currentParams.symbolScale,
      showAxisLabels: currentParams.showAxisLabels,
      showStroke: currentParams.showClusterOutline,
      mode: currentParams.polarMode,
      size: 420
    });
  });

  const hueLightnessChart = $derived.by(() => {
    if (!chartResult) return null;
    return generateHueLightnessSvg(chartResult.clusters, {
      symbolScale: currentParams.symbolScale,
      showAxisLabels: currentParams.showAxisLabels,
      showStroke: currentParams.showClusterOutline,
      sizeMode: currentParams.hueLightnessSizeMode,
      width: 420,
      height: 240
    });
  });

  const histogram = $derived.by(() => {
    if (!chartResult) return null;
    return generateHistogramSvg(chartResult.clusters, {
      width: 520,
      height: 180,
      maxBars: 120,
      sortBy: currentParams.histogramSort
    });
  });

  const histogramSortLabel = $derived.by(() => {
    if (currentParams.histogramSort === 'hue') return 'Top clusters by hue';
    if (currentParams.histogramSort === 'lightness') return 'Top clusters by lightness';
    return 'Top clusters by frequency';
  });

  // --- Scrub handlers ---
  function handleScrubStart(_event: PointerEvent) {
    isScrubbing = true;
    runner.captureAnalysisScroll();
  }

  function handleScrubEnd() {
    if (!isScrubbing) return;
    isScrubbing = false;
    if (file) {
      runner.scheduleAnalysisWith(file, currentParams, status);
    }
  }

  function retryAnalysis() {
    clearAnalysisError();
    runner.clearLastRequestKey();
    const currentFile = file;
    if (currentFile) {
      runner.scheduleAnalysisWith(currentFile, currentParams, status);
    }
  }

  function dismissBanner() {
    bannerMessage = null;
  }

  function handleImageZoom() {
    zoomImage(file?.previewUrl, file?.name ?? 'Selected image', openZoomOverlay);
  }

  // --- FFmpeg check ---
  let ffmpegChecked = false;
  async function checkFfmpegVersion() {
    if (ffmpegChecked || !isTauriEnv()) return;
    ffmpegChecked = true;
    try {
      const version = await getFfmpegVersion();
      void logEvent(`ffmpeg:version ${version}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void logEvent(`ffmpeg:version unavailable message=${message}`);
    }
  }

  // --- Lifecycle ---
  onMount(() => {
    devlog('home:mount', 'HomeView mounted');
    void logEvent('home:view:mount');
    void checkFfmpegVersion();
    let unlistenDragDrop: (() => void) | null = null;
    ingestion.setupTauriDragDrop().then((fn) => { unlistenDragDrop = fn ?? null; });
    const unsubs = [
      selectedFile.subscribe((value) => {
        file = value;
        if (!value && !video.videoSelection) {
          displayResult = null;
        }
      }),
      params.subscribe((value) => { currentParams = { ...value }; }),
      analysisState.subscribe((value) => { status = value; }),
      analysisResult.subscribe((value) => {
        result = value;
        if (value !== null) {
          displayResult = value;
        }
      }),
      analysisError.subscribe((value) => { analysisErr = value; }),
      videoState.subscribe((state) => {
        devlog('home:videoState', 'Video state changed', { hasState: state !== null, path: state?.path ?? null });
        video.handleVideoStateChange(state);
      }),
      (() => { let first = true; return videoStripMode.subscribe(() => { if (first) { first = false; return; } video.regenerateStrip(); }); })(),
      pendingVideoSwitch.subscribe((pending) => {
        if (!pending) return;
        const { id, cid } = pending;
        pendingVideoSwitch.set(null);
        const entry = get(images).find((item) => item.id === id);
        devlog('home:videoSwitch', 'Pending video switch', {
          id, cid, entryFound: !!entry, path: entry?.path ?? null
        });
        if (!entry?.path) return;
        const videoPath = entry.videoPath ?? entry.path;
        // Skip if this video is already active
        if (video.videoSelection?.path === videoPath) {
          devlog('home:videoSwitch:skip', 'Already active — skipping', { cid, videoPath });
          return;
        }
        clearActivePath();
        runner.cancelPending();
        devlog('home:videoSwitch:load', 'Loading video selection', { cid, existingId: entry.id, videoPath });
        video.loadVideoSelection({
          name: entry.name,
          path: videoPath,
          size: entry.size,
          blob: new Blob([], { type: 'video/mp4' }),
          mimeType: 'video/mp4'
        }, entry.id, cid);
      }),
      (() => { let first = true; return mediaLoadRequested.subscribe(() => { if (first) { first = false; return; } ingestion.chooseMedia(); }); })()
    ];
    let dragDepth = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const showOverlay = () => {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      ingestion.draggingWindow = true;
    };
    const hideOverlay = () => {
      if (hideTimer) { clearTimeout(hideTimer); }
      hideTimer = setTimeout(() => {
        if (dragDepth <= 0) {
          ingestion.draggingWindow = false;
          ingestion.dragging = false;
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
    const onDrop = () => {
      dragDepth = 0;
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      ingestion.draggingWindow = false;
      ingestion.dragging = false;
    };

    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    window.addEventListener('pointerup', handleScrubEnd);
    window.addEventListener('pointercancel', handleScrubEnd);
    return () => {
      unsubs.forEach((unsub) => unsub());
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('pointerup', handleScrubEnd);
      window.removeEventListener('pointercancel', handleScrubEnd);
      if (unlistenDragDrop) unlistenDragDrop();
      devlog('home:unmount', 'HomeView unmounting');
      devlog.resources('home:unmount');
      void logEvent('home:view:unmount');
    };
  });

  onDestroy(() => {
    runner.cancelPending();
  });

  $effect(() => {
    video.loadSrcEffect();
  });

  $effect(() => {
    const activeFile = file;
    const paramSnapshot = currentParams;
    if (!activeFile) {
      runner.cancelPending();
      return;
    }
    if (isScrubbing) {
      return;
    }
    if (status === 'error') {
      return;
    }
    devlog('home:analysis:effect', 'Analysis effect triggered', {
      imageId: activeFile.id,
      status,
      clusters: paramSnapshot.clusters
    });
    runner.scheduleAnalysisWith(activeFile, paramSnapshot, status);
  });
</script>

<section class="home">
  {#if devEnabled && devBannerVisible && devBannerData}
    <DevBanner data={devBannerData} onDismiss={dismissDevBanner} />
  {/if}

  {#if file || video.videoSelection}
    <section class="analysis-layout" class:two-columns={currentParams.showPolarChart || currentParams.showHueLightness}>
      <div class="analysis-column">
        {#if video.videoSelection}
          <VideoPanel {video} />
        {:else}
          <div
            bind:this={ingestion.dropRef}
            class:dragging={ingestion.dragging}
            class="dropzone dropzone--image"
            tabindex="0"
            role="button"
            aria-label="Image dropzone"
            aria-busy={status === 'pending'}
            ondragover={ingestion.handleDragOver}
            ondragleave={ingestion.handleDragLeave}
            ondrop={ingestion.handleDrop}
            onkeydown={ingestion.handleDropzoneKeydown}
          >
            <div
              class="image-preview zoomable"
              role="button"
              tabindex="0"
              onclick={handleImageZoom}
              onkeydown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                handleImageZoom();
              }}
            >
              {#if file?.previewUrl}
                <img src={file.previewUrl} alt={file?.name ?? 'Selected image'} />
              {:else}
                <div class="preview-placeholder">Image preview unavailable.</div>
              {/if}
            </div>
          </div>
        {/if}
        {#if currentParams.showHistogram}
          <AnalysisCards
            result={chartResult}
            {histogram}
            polarChart={null}
            hueLightnessChart={null}
            {histogramSortLabel}
            showHistogramFrame={currentParams.showHistogram}
          />
        {/if}
      </div>
      {#if currentParams.showPolarChart || currentParams.showHueLightness}
        <div class="analysis-column">
          <AnalysisCards
            result={chartResult}
            histogram={null}
            polarChart={currentParams.showPolarChart ? polarChart : null}
            hueLightnessChart={currentParams.showHueLightness ? hueLightnessChart : null}
            histogramSortLabel=""
            showPolarFrame={currentParams.showPolarChart}
            showHueLightnessFrame={currentParams.showHueLightness}
          />
        </div>
      {/if}
    </section>
  {:else}
    <div
      bind:this={ingestion.dropRef}
      class:dragging={ingestion.dragging}
      class="dropzone"
      tabindex="0"
      role="button"
      aria-label="Image dropzone"
      aria-busy={status === 'pending'}
      ondragover={ingestion.handleDragOver}
      ondragleave={ingestion.handleDragLeave}
      ondrop={ingestion.handleDrop}
      onkeydown={ingestion.handleDropzoneKeydown}
    >
      <div class="inner">
        <p class="title">Drop anywhere</p>
        <p>or</p>
        <button class="upload" onclick={ingestion.chooseMedia}>Add media</button>
        <p class="formats">PNG, JPEG, WebP, BMP, GIF, TIFF, MP4</p>
      </div>
    </div>
  {/if}

  <!-- Full-window drag overlay -->
  {#if ingestion.draggingWindow}
    <div class="overlay-root visible" aria-hidden="true">
      <div class="overlay-panel">
        <div style="display:grid;place-items:center;gap:8px;min-width:280px">
          <div class="spinner" aria-hidden="true" style="display:none"></div>
          <div style="font-size:20px;font-weight:500">Drop Anywhere</div>
          <div style="font-size:12px;opacity:.8">PNG · JPEG · WebP · BMP · GIF · TIFF · MP4</div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Loading overlay -->
  {#if status === 'pending' && runner.spinnerVisible}
    <div class="overlay-root overlay-root--content visible" role="dialog" aria-label="Analyzing…">
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
    <div class="overlay-root overlay-root--content visible" role="dialog" aria-label="Notice">
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

  <ParameterControls onScrubStart={handleScrubStart} onScrubEnd={handleScrubEnd} />
</section>

<style>
  .home {
    max-width: 1120px;
    margin: 0 auto;
    container-type: inline-size;
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
    grid-template-columns: 1fr;
    gap: 20px;
    align-content: start;
  }

  @container (min-width: 760px) {
    .analysis-layout.two-columns {
      grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
      align-items: center;
    }
  }

  .analysis-column {
    display: grid;
    gap: 20px;
    align-content: start;
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
