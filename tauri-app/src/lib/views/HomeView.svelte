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
  import { analyzeImage } from '../compute/bridge';
  import { TauriComputeError } from '../bridges/compute';
  import { loadImageDataset } from '../compute/image-loader';
  import { getFsBridge, type FileSelection } from '../bridges/fs';
  import { isTauriEnv, getBridgeOverride, tauriDetectionInfo } from '../bridges/tauri';

  const ANALYZE_DEBOUNCE_MS = 200;
  const SPINNER_THRESHOLD_MS = 150;
  const isDev = import.meta.env.DEV ?? false;
  const devEnabled = isDev;

  const nativeDragCopy = 'Native mode uses file paths. Use Upload to pick files.';

  let dragging = $state(false);
  let draggingWindow = $state(false);
  let bannerMessage = $state<string | null>(null);
  let spinnerVisible = $state(false);
  let nativeMode = $state(isNativeModeActive());
  let devBannerVisible = $state(false);
  let devBannerData = $state<DevBannerDetails | null>(null);
  let devBannerFileLogged = false;
  let devBannerAnalysisLogged = false;

  let dropRef: HTMLElement;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToken = 0;
  let lastRequestKey: string | null = null;
  let loadToken = 0;

  let file = $state<SelectedImage | null>(null);
  let currentParams = $state<AnalysisParams>(get(params));
  let status = $state<AnalysisState>('idle');
  let result = $state<AnalysisResult | null>(null);
  let analysisErr = $state<string | null>(null);
  let clusters = $state<AnalysisCluster[]>([]);

  interface DevBannerDetails {
    detection: ReturnType<typeof tauriDetectionInfo>;
    override: string | null;
    fsBridge?: string;
    computeVariant?: string;
  }

  function isNativeModeActive(): boolean {
    return isTauriEnv() || getBridgeOverride() === 'tauri';
  }

  function updateNativeMode() {
    nativeMode = isNativeModeActive();
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

  async function chooseFile() {
    try {
      const bridge = await getFsBridge();
      updateNativeMode();
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
    updateNativeMode();
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
    updateNativeMode();
  }

  async function ingestSelection(fileSelection: FileSelection) {
    loadToken += 1;
    const token = loadToken;
    cancelPending();
    try {
      updateNativeMode();
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
      const selected: SelectedImage = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        name: fileSelection.name || fileSelection.path || 'image',
        path: fileSelection.path,
        size: fileSelection.size,
        dataset
      };
      bannerMessage = null;
      setFile(selected);
      const snapshot = get(params);
      scheduleAnalysisWith(selected, snapshot);
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
    lastRequestKey = null;
  }

  function scheduleAnalysisWith(fileHandle: SelectedImage, paramSnapshot: AnalysisParams) {
    const keyObj = {
      id: fileHandle.id,
      clusters: paramSnapshot.clusters,
      stride: paramSnapshot.stride,
      minLum: paramSnapshot.minLum,
      space: paramSnapshot.colorSpace,
      tol: 1e-3,
      maxIter: 40,
      seed: 1,
      maxSamples: 300_000
    };
    const key = JSON.stringify(keyObj);
    if (key === lastRequestKey && status === 'ready') {
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
      setAnalysisSuccess(response);
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

  onMount(() => {
    updateNativeMode();
    let dragDepth = 0;
    let hideTimer: ReturnType<typeof setTimeout> | null = null;

    const onStorage = (event: StorageEvent) => {
      if (event.key === 'bridge.force') {
        updateNativeMode();
      }
    };

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

    window.addEventListener('storage', onStorage);
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
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

  {#if nativeMode}
    <div class="native-chip" role="status">Native mode</div>
    <p class="native-copy">{nativeDragCopy}</p>
  {/if}

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

  {#if file}
    <div class="selection">
      <div>
        <strong>Selected file:</strong>
        <span>{file?.name}</span>
      </div>
      <button onclick={clearSelection}>Clear</button>
    </div>
  {:else}
    <div class="selection empty">
      <span>No file selected yet.</span>
    </div>
  {/if}

  {#if status === 'ready' && result}
    <section class="preview">
      <header class="preview-header">
        <h2>Cluster Preview</h2>
        <span class="metrics">
          {Math.round(result.durationMs)} ms · {result.iterations} iterations ·
          {result.totalSamples.toLocaleString()} samples
        </span>
      </header>
      <ul class="cluster-list">
        {#if clusters.length === 0}
          <li class="placeholder">No clusters returned</li>
        {:else}
          {#each clusters as cluster, idx}
            <li>
              <span class="rank">#{idx + 1}</span>
              <span
                class="swatch"
                style={`background: rgb(${cluster.rgb.r}, ${cluster.rgb.g}, ${cluster.rgb.b})`}
                aria-hidden="true"
              ></span>
              <span class="share">{(cluster.share * 100).toFixed(1)}%</span>
              <span class="count">{cluster.count.toLocaleString()} px</span>
            </li>
          {/each}
        {/if}
      </ul>
    </section>
  {/if}

  <section class="controls">
    <h2>Parameters</h2>
    <div class="grid">
      <label>
        <span>Clusters</span>
        <input type="number" min="1" max="400" bind:value={$params.clusters} />
      </label>
      <label>
        <span>Stride</span>
        <input type="number" min="1" max="16" bind:value={$params.stride} />
      </label>
      <label>
        <span>Min. luminosity</span>
        <input type="number" min="0" max="255" bind:value={$params.minLum} />
      </label>
      <label>
        <span>Color space</span>
        <select bind:value={$params.colorSpace}>
          <option value="RGB">RGB</option>
          <option value="HSL">HSL</option>
          <option value="YUV">YUV</option>
          <option value="CIELAB">CIELAB</option>
          <option value="CIELUV">CIELUV</option>
        </select>
      </label>
      <label>
        <span>Axis</span>
        <select bind:value={$params.axis}>
          <option value="HSL">HSL</option>
          <option value="HLS">HLS</option>
        </select>
      </label>
      <label>
        <span>Symbol scale</span>
        <input type="number" min="0.5" max="2" step="0.1" bind:value={$params.symbolScale} />
      </label>
    </div>
  </section>
</section>

<style>
  .home {
    max-width: 720px;
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

  input,
  select {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font: inherit;
    background: #fff;
  }

  .preview {
    margin-top: 28px;
    padding: 20px;
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: var(--elev-1);
  }

  .preview-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 16px;
  }

  .preview-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .preview-header .metrics {
    font-size: 13px;
    color: var(--color-ink-muted);
  }

  .cluster-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }

  .cluster-list li {
    display: grid;
    grid-template-columns: 32px 32px 80px 1fr;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid var(--color-border-muted);
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.02);
  }

  .cluster-list li.placeholder {
    text-align: center;
    color: var(--color-ink-muted);
  }

  .rank {
    font-weight: 600;
    color: var(--color-ink-strong);
  }

  .swatch {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  .share {
    font-weight: 600;
  }

  .count {
    justify-self: end;
    font-size: 13px;
    color: var(--color-ink-muted);
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
