<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  // NOTE: Temporary inline overlays to bypass slot/runtime issue in container
  import type {
    AnalysisParams,
    SelectedImage,
    AnalysisResult,
    AnalysisCluster,
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
    topClusters,
    setAnalysisPending,
    setAnalysisSuccess,
    setAnalysisError,
    clearAnalysisError
  } from '../stores/ui';
  import { isTauriEnv, getBridgeOverride } from '../bridges/tauri';
  import DevDetectionBanner from './home/DevDetectionBanner.svelte';
  import SelectionSummary from './home/SelectionSummary.svelte';
  import ClusterPreview from './home/ClusterPreview.svelte';
  import ParameterControls from './home/ParameterControls.svelte';
  import type { DevBannerDetails } from './home/dev-banner-types';
  import { createAnalysisRunner } from './home/analysis-runner';
  import { createFileIngestionHandlers } from './home/file-ingestion';
  import { createDevBannerController } from './home/dev-banner-controller';

  const devEnabled = import.meta.env.DEV ?? false;
  const isNativeModeActive = () => isTauriEnv() || getBridgeOverride() === 'tauri';
  const nativeDragCopy = 'Native mode uses file paths. Use Upload to pick files.';

  let dragging = $state(false);
  let draggingWindow = $state(false);
  let bannerMessage = $state<string | null>(null);
  let spinnerVisible = $state(false);
  let nativeMode = $state(isNativeModeActive());
  let devBannerVisible = $state(false);
  let devBannerData = $state<DevBannerDetails | null>(null);
  const { recordDevEvent, dismissDevBanner } = createDevBannerController({
    devEnabled,
    getCurrentData: () => devBannerData,
    setData: (details) => {
      devBannerData = details;
    },
    setVisible: (visible) => {
      devBannerVisible = visible;
    }
  });

  let file = $state<SelectedImage | null>(null);
  let currentParams = $state<AnalysisParams>(get(params));
  let status = $state<AnalysisState>('idle');
  let result = $state<AnalysisResult | null>(null);
  let analysisErr = $state<string | null>(null);
  let clusters = $state<AnalysisCluster[]>([]);

  const updateNativeMode = () => {
    nativeMode = isNativeModeActive();
  };

  const { scheduleAnalysisWith, cancelPending, retryAnalysis } = createAnalysisRunner({
    getStatus: () => status,
    getFile: () => file,
    getParams: () => currentParams,
    setSpinnerVisible: (visible) => (spinnerVisible = visible),
    onPending: () => setAnalysisPending(),
    onSuccess: (payload) => setAnalysisSuccess(payload),
    onError: (message) => setAnalysisError(message),
    clearError: () => clearAnalysisError(),
    recordDevEvent
  });

  const {
    chooseFile,
    handleDropzoneKeydown,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    dropTargetAction: dropTarget,
    createWindowDragHandlers
  } = createFileIngestionHandlers({
    updateNativeMode,
    setDragging: (value) => (dragging = value),
    setDraggingWindow: (value) => (draggingWindow = value),
    setBannerMessage: (value) => (bannerMessage = value),
    setFile,
    getParamsSnapshot: () => get(params),
    scheduleAnalysisWith,
    setAnalysisError: (message) => setAnalysisError(message),
    cancelPending,
    recordDevEvent
  });

  $effect(() => {
    const unsubFile = selectedFile.subscribe((value) => {
      file = value;
    });
    const unsubParams = params.subscribe((value) => {
      currentParams = value;
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
    const unsubClusters = topClusters.subscribe((value) => {
      clusters = value;
    });
    return () => {
      unsubFile();
      unsubParams();
      unsubStatus();
      unsubResult();
      unsubError();
      unsubClusters();
    };
  });

  const clearSelection = () => {
    clearFile();
    cancelPending();
    updateNativeMode();
  };

  const dismissBanner = () => {
    bannerMessage = null;
  };

  onMount(() => {
    updateNativeMode();

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'bridge.force') {
        updateNativeMode();
      }
    };

    window.addEventListener('storage', onStorage);
    const detachDragHandlers = createWindowDragHandlers();
    return () => {
      window.removeEventListener('storage', onStorage);
      detachDragHandlers();
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
    scheduleAnalysisWith(activeFile, paramSnapshot);
  });
</script>

<section class="home">
  <header>
    <h1>Load an image</h1>
    <p class="note">
      Drop a file anywhere or use the upload button. Supported formats: PNG, JPEG, WebP.
    </p>
  </header>

  {#if devEnabled && devBannerVisible && devBannerData}
    <DevDetectionBanner data={devBannerData} onDismiss={dismissDevBanner} />
  {/if}

  {#if nativeMode}
    <div class="native-chip" role="status">Native mode</div>
    <p class="native-copy">{nativeDragCopy}</p>
  {/if}

  <div
    use:dropTarget
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
    </div>
  </div>

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

  <SelectionSummary {file} onClear={clearSelection} />

  {#if status === 'ready' && result}
    <ClusterPreview {result} {clusters} />
  {/if}

  <ParameterControls />
</section>

<style>
  .home {
    max-width: 720px;
  }

  .native-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent);
    color: #fff;
    border-radius: 999px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 6px;
  }

  .native-copy {
    margin: 0 0 16px 0;
    font-size: 13px;
    color: rgba(33, 33, 32, 0.75);
  }

  .dropzone {
    border: 2px dashed var(--accent);
    border-radius: 12px;
    padding: 48px;
    text-align: center;
    background: rgba(130, 76, 50, 0.06);
    transition: background 0.2s ease, border-color 0.2s ease;
  }

  .dropzone:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 4px;
  }

  .dropzone.dragging {
    background: rgba(130, 76, 50, 0.12);
    border-color: var(--accent);
  }

  .dropzone .title {
    font-size: 20px;
    margin-bottom: 8px;
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
