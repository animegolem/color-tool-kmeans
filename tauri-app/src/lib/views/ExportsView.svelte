<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import {
    analysisResult,
    params,
    selectedFile,
    valueAnalysisLevels,
    valueAnalysisNotanMode,
    setValueAnalysisPending,
    setValueAnalysisSuccess,
    setValueAnalysisError
  } from '../stores/ui';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateValueAnalysisSvg } from '../exports/value-analysis';
  import { generatePaletteCsv } from '../exports/palette';
  import { getFsBridge } from '../bridges/fs';
  import { svgToPngBlob } from '../exports/png';
  import { requestValueAnalysis } from '../bridges/value-analysis';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { logEvent } from '../bridges/log';

  const file = $derived.by(() => get(selectedFile));
  const result = $derived.by(() => get(analysisResult));
  const paramSnapshot = $derived.by(() => get(params));
  let graphScale = $state(2);
  let isSaving = $state(false);
  let message = $state<string | null>(null);
  let messageVariant = $state<'info' | 'error'>('info');
  const valueScale = 2;

  onMount(() => {
    void logEvent('exports:view:mount');
    return () => {
      void logEvent('exports:view:unmount');
    };
  });

  function baseName(): string {
    if (!file) return 'export';
    const name = file.name || 'image';
    const withoutExt = name.replace(/\.[^.]+$/, '');
    return withoutExt.replace(/[^A-Za-z0-9-_]+/g, '-');
  }

  async function saveCircleGraphSvg() {
    if (!result) return;
    await performSave(async () => {
      const { svg } = generateCircleGraphSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        useHsl: paramSnapshot.useHslPolar
      });
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-circle.svg`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Circle graph SVG saved.', 'info');
      }
    });
  }

  async function saveCircleGraphPng() {
    if (!result) return;
    await performSave(async () => {
      const { svg, width, height } = generateCircleGraphSvg(result.clusters, {
        symbolScale: paramSnapshot.symbolScale,
        showAxisLabels: paramSnapshot.showAxisLabels,
        showStroke: paramSnapshot.showClusterOutline,
        useHsl: paramSnapshot.useHslPolar
      });
      const blob = await svgToPngBlob(svg, width, height, Math.max(1, Math.min(4, graphScale)));
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-circle.png`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Circle graph PNG saved.', 'info');
      }
    });
  }

  async function savePaletteCsv() {
    if (!result) return;
    await performSave(async () => {
      const csv = generatePaletteCsv(result.clusters);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveTextFile(csv, `${baseName()}-palette.csv`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Palette CSV saved.', 'info');
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
      const message = error instanceof Error ? error.message : 'Unknown error';
      setValueAnalysisError(file.id, levels, notanMode, message);
      throw error;
    }
  }

  async function saveValueAnalysisPng() {
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
      const { svg, width, height } = await generateValueAnalysisSvg({
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
        levels: currentStudy.levels
      });
      const blob = await svgToPngBlob(svg, width, height, valueScale);
      const bridge = await getFsBridge();
      const { canceled } = await bridge.saveBlob(blob, `${baseName()}-values.png`);
      if (canceled) {
        setStatus('Export canceled.', 'info');
      } else {
        setStatus('Values analysis PNG saved.', 'info');
      }
    });
  }

  async function performSave(action: () => Promise<void>) {
    if (isSaving) return;
    isSaving = true;
    setStatus(null, 'info');
    try {
      await action();
    } catch (error) {
      console.error('[exports] failed to save file', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`Failed to save file: ${message}`, 'error');
    } finally {
      isSaving = false;
    }
  }

  function setStatus(value: string | null, variant: 'info' | 'error') {
    message = value;
    messageVariant = variant;
  }
</script>

<section class="exports">
  <header>
    <h1>Exports</h1>
    <p class="note">Generate circle graph PNG/SVG and palette CSV after analysis.</p>
  </header>

  {#if file && result}
    <div class="cards">
      <article>
        <h2>Circle Graph</h2>
        <p>PNG or SVG render of hue + chroma distribution.</p>
        <label class="scale">
          <span>PNG scale</span>
          <input type="number" min="1" max="4" step="1" bind:value={graphScale} />
          <span class="suffix">×</span>
        </label>
        <div class="actions">
          <button class="primary" onclick={saveCircleGraphPng} disabled={isSaving}>Save PNG</button>
          <button onclick={saveCircleGraphSvg} disabled={isSaving}>Save SVG</button>
        </div>
      </article>
      <article>
        <h2>Values Analysis</h2>
        <p>Original + neutral values, range bar, and notan preview.</p>
        <div class="actions">
          <button class="primary" onclick={saveValueAnalysisPng} disabled={isSaving}>
            Save PNG
          </button>
        </div>
      </article>
      <article>
        <h2>Palette CSV</h2>
        <p>Ranked palette with RGB + OKLab/OKLCH metadata.</p>
        <div class="actions">
          <button onclick={savePaletteCsv} disabled={isSaving}>Save CSV</button>
        </div>
      </article>
    </div>
  {:else}
    <div class="empty">Select an image and complete analysis to unlock exports.</div>
  {/if}

  {#if message}
    <div class:status-error={messageVariant === 'error'} class="status">{message}</div>
  {/if}
</section>

<style>
  .cards {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  article {
    flex: 1 1 260px;
    border-radius: 12px;
    background: var(--panel);
    padding: 20px;
    box-shadow: var(--shadow);
  }

  .empty {
    padding: 16px;
    background: var(--panel);
    border-radius: 8px;
    color: rgba(33, 33, 32, 0.6);
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  button {
    border-radius: 6px;
    padding: 8px 16px;
    border: 1px solid var(--line);
    background: transparent;
  }

  button.primary {
    background: var(--accent, #4f5ffa);
    color: #fff;
    border-color: var(--accent, #4f5ffa);
  }

  .scale {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
  }

  .scale input {
    width: 56px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
    font: inherit;
  }

  .suffix {
    font-size: 12px;
    opacity: 0.7;
  }

  .status {
    margin-top: 18px;
    padding: 12px;
    border-radius: 8px;
    background: rgba(79, 95, 250, 0.12);
    color: #1b1d23;
  }

  .status-error {
    background: rgba(220, 53, 69, 0.1);
    color: #8a1f2b;
  }
</style>
