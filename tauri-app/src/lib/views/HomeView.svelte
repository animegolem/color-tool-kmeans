<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import FadeOverlay from '../components/FadeOverlay.svelte';
  import type { AnalysisParams } from '../stores/ui';
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
  import { openFileDialog, isTauri, invokeAnalyzeImage } from '../tauri';

  const ANALYZE_DEBOUNCE_MS = 200;
  const SPINNER_THRESHOLD_MS = 150;

  let dragging = $state(false);
  let draggingWindow = $state(false);
  let bannerMessage = $state<string | null>(null);
  let spinnerVisible = $state(false);

  let dropRef: HTMLElement;

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let spinnerTimer: ReturnType<typeof setTimeout> | null = null;
  let currentToken = 0;
  let lastRequestKey: string | null = null;

  const file = $derived.by(() => get(selectedFile));
  const currentParams = $derived.by(() => get(params));
  const status = $derived.by(() => get(analysisState));
  const result = $derived.by(() => get(analysisResult));
  const analysisErr = $derived.by(() => get(analysisError));
  const clusters = $derived.by(() => get(topClusters));

  async function chooseFile() {
    const path = await openFileDialog();
    if (path) {
      const name = path.split(/[\\/]/).pop() ?? path;
      bannerMessage = null;
      setFile(path, name);
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
    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;
    const fileHandle = files[0];
    if (files.length > 1) {
      bannerMessage = 'Multiple files dropped — using the first file; others skipped.';
    }
    const path = (fileHandle as unknown as { path?: string }).path ?? fileHandle.name;
    const name = fileHandle.name ?? path;
    setFile(path, name);
  }

  function clearSelection() {
    clearFile();
    cancelPending();
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

  function scheduleAnalysisWith(fileHandle: { path: string }, paramSnapshot: AnalysisParams) {
    const keyObj = {
      path: fileHandle.path,
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
    debounceTimer = setTimeout(() => runAnalysis(fileHandle.path, snapshot), ANALYZE_DEBOUNCE_MS);
  }

  async function runAnalysis(path: string, paramSnapshot: AnalysisParams) {
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
      const response = await invokeAnalyzeImage({
        path,
        clusters: paramSnapshot.clusters,
        stride: paramSnapshot.stride,
        minLum: paramSnapshot.minLum,
        colorSpace: paramSnapshot.colorSpace,
        tol: 1e-3,
        maxIter: 40,
        seed: 1,
        maxSamples: 300_000
      });
      if (token !== currentToken) {
        return;
      }
      setAnalysisSuccess(response);
    } catch (err) {
      if (token !== currentToken) {
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
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
    if (!isTauri()) {
      console.info('[home] Running without Tauri backend; using mock analyze_image responses.');
    }
    const onDragEnter = (event: DragEvent) => {
      event.preventDefault();
      draggingWindow = true;
    };
    const onDragEnd = () => {
      draggingWindow = false;
      dragging = false;
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragleave', onDragEnd);
    window.addEventListener('drop', onDragEnd);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragEnd);
      window.removeEventListener('drop', onDragEnd);
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

  <div
    bind:this={dropRef}
    class:dragging={dragging}
    class="dropzone"
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
  >
    <div class="inner">
      <p class="title">Drop anywhere</p>
      <p class="note">or</p>
      <button class="upload" onclick={chooseFile}>Upload</button>
    </div>
  </div>

  <!-- Full-window drag overlay -->
  <FadeOverlay visible={draggingWindow} title={null}>
    <div style="display:grid;place-items:center;gap:8px;min-width:280px">
      <div class="spinner" aria-hidden="true" style="display:none"></div>
      <div style="font-size:20px;font-weight:500">Drop Anywhere</div>
      <div style="font-size:12px;opacity:.8">PNG · JPEG · WebP</div>
    </div>
  </FadeOverlay>

  <!-- Loading overlay -->
  <FadeOverlay visible={status === 'pending' && spinnerVisible} title="Analyzing…">
    <div style="display:grid;place-items:center;gap:12px">
      <div class="spinner" aria-label="loading" />
      <div style="font-size:12px;opacity:.8">This may take a moment</div>
    </div>
  </FadeOverlay>

  <!-- Drag/drop notice overlay -->
  <FadeOverlay visible={!!bannerMessage} title="Notice" dismissable onDismiss={dismissBanner}>
    <p style="margin:0">{bannerMessage}</p>
  </FadeOverlay>

  <!-- Analysis error overlay -->
  <FadeOverlay
    visible={status === 'error'}
    title="Analysis failed"
    dismissable
    onDismiss={clearAnalysisError}
  >
    <p style="margin:0 0 12px 0">{analysisErr ?? 'Unknown issue while analyzing the image.'}</p>
    <button class="retry" onclick={retryAnalysis}>Retry</button>
  </FadeOverlay>

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
              />
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

  .dropzone {
    border: 2px dashed var(--accent);
    border-radius: 12px;
    padding: 48px;
    text-align: center;
    background: rgba(130, 76, 50, 0.06);
    transition: background 0.2s ease, border-color 0.2s ease;
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
