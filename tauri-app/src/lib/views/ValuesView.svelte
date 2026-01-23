<script lang="ts">
  import { convertFileSrc } from '@tauri-apps/api/core';
  import type { SelectedImage, ValueAnalysisResult, ValueAnalysisState } from '../stores/ui';
  import {
    selectedFile,
    valueAnalysisLevels,
    valueAnalysisResult,
    valueAnalysisState,
    valueAnalysisError,
    setValueAnalysisPending,
    setValueAnalysisSuccess,
    setValueAnalysisError,
    openZoomOverlay
  } from '../stores/ui';
  import { requestValueAnalysis } from '../bridges/value-analysis';

  let file = $state<SelectedImage | null>(null);
  let analysis = $state<ValueAnalysisResult | null>(null);
  let displayAnalysis = $state<ValueAnalysisResult | null>(null);
  let displayImageId = $state<string | null>(null);
  let status = $state<ValueAnalysisState>('idle');
  let error = $state<string | null>(null);
  let levels = $state(3);

  const renderAnalysis = $derived.by(() => analysis ?? displayAnalysis);

  const neutralSrc = $derived.by(() => {
    if (!renderAnalysis?.neutral) return '';
    return convertFileSrc(renderAnalysis.neutral);
  });

  const previewSrc = $derived.by(() => {
    if (!renderAnalysis?.preview) return '';
    return convertFileSrc(renderAnalysis.preview);
  });

  const maxCount = $derived.by(() => {
    if (!renderAnalysis?.counts?.length) return 1;
    return Math.max(...renderAnalysis.counts);
  });

  const isRefreshing = $derived.by(
    () => status === 'pending' && analysis === null && displayAnalysis !== null
  );


  function openImageZoom(src: string, alt: string) {
    openZoomOverlay({ kind: 'image', src, alt });
  }

  function handleZoomKeydown(event: KeyboardEvent, src: string, alt: string) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    openImageZoom(src, alt);
  }

  function formatPercent(value: number) {
    return `${Math.round(value * 100)}%`;
  }

  function keyLabel(p10: number, p90: number) {
    const mid = (p10 + p90) * 0.5;
    if (mid <= 0.38) return 'Low key';
    if (mid >= 0.62) return 'High key';
    return 'Mid key';
  }

  function contrastLabel(p10: number, p90: number) {
    const range = p90 - p10;
    if (range >= 0.75) return 'Full range';
    if (range >= 0.6) return 'High contrast';
    if (range >= 0.4) return 'Medium contrast';
    return 'Low contrast';
  }

  function markerSize(count: number, maxCount: number) {
    if (maxCount <= 0) return 8;
    const min = 6;
    const max = 14;
    const ratio = Math.min(1, count / maxCount);
    return Math.round(min + (max - min) * ratio);
  }

  function updateLevels() {
    valueAnalysisLevels.set(levels);
  }

  async function ensureValueAnalysis(currentFile: SelectedImage, requestedLevels: number) {
    if (!currentFile.path) {
      setValueAnalysisError(currentFile.id, requestedLevels, 'Value analysis requires a native file path.');
      return;
    }
    setValueAnalysisPending(currentFile.id, requestedLevels);
    try {
      const result = await requestValueAnalysis(currentFile.path, currentFile.id, requestedLevels);
      setValueAnalysisSuccess(currentFile.id, requestedLevels, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setValueAnalysisError(currentFile.id, requestedLevels, message);
    }
  }

  $effect(() => {
    const unsubs = [
      selectedFile.subscribe((value) => {
        file = value;
        const nextId = value?.id ?? null;
        if (displayImageId && nextId !== displayImageId) {
          displayAnalysis = null;
        }
        displayImageId = nextId;
      }),
      valueAnalysisResult.subscribe((value) => {
        analysis = value;
        if (value && file) {
          displayAnalysis = value;
          displayImageId = file.id;
        }
      }),
      valueAnalysisState.subscribe((value) => {
        status = value;
      }),
      valueAnalysisError.subscribe((value) => {
        error = value;
      }),
      valueAnalysisLevels.subscribe((value) => {
        levels = value;
      })
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  });

  $effect(() => {
    if (!file) return;
    if (status !== 'idle') return;
    if (analysis) return;
    void ensureValueAnalysis(file, levels);
  });
</script>

<section class="values">
  <header>
    <h1>Values</h1>
    <p class="note">Value analysis derived from OkLab lightness.</p>
  </header>

  {#if !file}
    <div class="empty">Select an image to view the values analysis.</div>
  {:else if !renderAnalysis}
    {#if status === 'pending'}
      <div class="empty">Generating values analysis...</div>
    {:else if status === 'error'}
      <div class="empty">Values analysis failed. {error ?? 'Unknown error.'}</div>
    {:else}
      <div class="empty">Select an image to view the values analysis.</div>
    {/if}
  {:else}
    <div class="preview-frame">
      <div class="preview-pair">
        <div class="preview-card">
          <span>Original</span>
          {#if file.previewUrl}
            <img
              class="preview zoomable"
              src={file.previewUrl}
              alt={file.name}
              role="button"
              tabindex="0"
              onclick={() => openImageZoom(file.previewUrl ?? '', file.name)}
              onkeydown={(event) => handleZoomKeydown(event, file.previewUrl ?? '', file.name)}
            />
          {:else}
            <div class="empty">Preview unavailable.</div>
          {/if}
        </div>
        <div class="preview-card">
          <span>Neutral values</span>
          {#if neutralSrc}
            <img
              class="preview zoomable"
              src={neutralSrc}
              alt="Neutral values"
              role="button"
              tabindex="0"
              onclick={() => openImageZoom(neutralSrc, 'Neutral values')}
              onkeydown={(event) => handleZoomKeydown(event, neutralSrc, 'Neutral values')}
            />
          {:else}
            <div class="empty">Neutral values unavailable.</div>
          {/if}
        </div>
      </div>
    </div>

    {@const safeP10 = Math.max(0, Math.min(1, renderAnalysis.p10))}
    {@const safeP90 = Math.max(0, Math.min(1, renderAnalysis.p90))}
    {@const rangeStart = safeP10 * 100}
    {@const rangeWidth = Math.max(0, safeP90 - safeP10) * 100}

    <div class="range-section">
      <div class="range-header">
        <div class="range-title">Value range</div>
        <div class="range-tags">
          <span>{keyLabel(safeP10, safeP90)}</span>
          <span>{contrastLabel(safeP10, safeP90)}</span>
        </div>
      </div>
      <div class="range-track">
        <div class="range-active" style={`left: ${rangeStart}%; width: ${rangeWidth}%;`}></div>
      </div>
      <div class="range-meta">
        <span>Shadows {formatPercent(safeP10)}</span>
        <span>Highlights {formatPercent(safeP90)}</span>
      </div>
    </div>

    <div class="analysis-section">
      <div class="analysis-header">
        <div class="analysis-title">Value masses</div>
        <label class="levels">
          <span>Levels</span>
          <input type="range" min="2" max="5" step="1" bind:value={levels} oninput={updateLevels} />
          <strong>{levels}</strong>
        </label>
      </div>
      <div class="analysis-body">
        <div class="ruler">
          <div class="ruler-track">
            {#each renderAnalysis.boundaries as boundary}
              {@const boundaryTop = (1 - boundary) * 100}
              <div class="ruler-boundary" style={`top: ${boundaryTop}%;`}></div>
            {/each}
            {#each renderAnalysis.centroids as centroid, idx}
              {@const count = renderAnalysis.counts[idx] ?? 0}
              {@const size = markerSize(count, maxCount)}
              {@const markerTop = (1 - centroid) * 100}
              <div
                class="ruler-centroid"
                style={`top: ${markerTop}%; width: ${size}px; height: ${size}px;`}
                title={`${formatPercent(centroid)}`}
              ></div>
            {/each}
          </div>
          <div class="ruler-scale">
            <span>100</span>
            <span>0</span>
          </div>
        </div>
        <div class="preview-card">
          <span>Rendered frame</span>
          <div class="preview-shell">
            {#if previewSrc}
              <img
                class="preview analysis-preview zoomable"
                src={previewSrc}
                alt="Rendered frame"
                role="button"
                tabindex="0"
                onclick={() => openImageZoom(previewSrc, 'Rendered frame')}
                onkeydown={(event) => handleZoomKeydown(event, previewSrc, 'Rendered frame')}
              />
            {:else}
              <div class="empty">Preview unavailable.</div>
            {/if}
            {#if isRefreshing}
              <div class="preview-overlay">Updating...</div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}
</section>

<style>
  .values {
    max-width: 980px;
    margin: 0 auto;
  }

  .preview-frame {
    display: flex;
    justify-content: center;
    margin-bottom: 28px;
  }

  .preview-pair {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 24px;
    width: 100%;
    max-width: 880px;
  }

  .preview-card {
    display: grid;
    gap: 8px;
    justify-items: center;
    font-size: 12px;
    font-weight: 600;
    color: rgba(33, 33, 32, 0.7);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .preview-shell {
    position: relative;
    width: 100%;
    display: grid;
    place-items: center;
  }

  .preview {
    width: 100%;
    border-radius: 12px;
    border: 1px solid rgba(33, 33, 32, 0.2);
    box-shadow: 0 12px 20px rgba(33, 33, 32, 0.12);
  }

  .preview-overlay {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(33, 33, 32, 0.8);
    background: rgba(248, 242, 227, 0.7);
    border-radius: 12px;
    border: 1px solid rgba(33, 33, 32, 0.15);
  }

  .range-section {
    background: rgba(33, 33, 32, 0.04);
    border: 1px solid rgba(33, 33, 32, 0.12);
    border-radius: 14px;
    padding: 16px 20px;
    margin-bottom: 28px;
  }

  .range-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .range-title {
    font-weight: 600;
    font-size: 14px;
  }

  .range-tags {
    display: flex;
    gap: 8px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .range-tags span {
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.08);
  }

  .range-track {
    position: relative;
    height: 12px;
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.12);
    overflow: hidden;
  }

  .range-active {
    position: absolute;
    top: 0;
    bottom: 0;
    border-radius: 999px;
    background: linear-gradient(
      90deg,
      #3a3936 0%,
      #3a3936 20%,
      #5a5953 20%,
      #5a5953 40%,
      #7a776f 40%,
      #7a776f 60%,
      #9a968d 60%,
      #9a968d 80%,
      #bab6ad 80%,
      #bab6ad 100%
    );
  }

  .range-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-top: 8px;
    color: rgba(33, 33, 32, 0.7);
  }

  .analysis-section {
    border-radius: 14px;
    background: rgba(33, 33, 32, 0.03);
    border: 1px solid rgba(33, 33, 32, 0.12);
    padding: 18px 20px 22px;
    --ruler-height: 220px;
  }

  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .analysis-title {
    font-size: 14px;
    font-weight: 600;
  }

  .levels {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .levels input {
    width: 140px;
  }

  .analysis-body {
    display: grid;
    grid-template-columns: 80px minmax(0, 1fr);
    gap: 24px;
    align-items: center;
  }

  .ruler {
    display: grid;
    justify-items: center;
    gap: 8px;
  }

  .ruler-track {
    position: relative;
    width: 12px;
    height: var(--ruler-height);
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.2);
  }

  .ruler-boundary {
    position: absolute;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 24px;
    height: 2px;
    background: rgba(33, 33, 32, 0.5);
    border-radius: 999px;
  }

  .ruler-centroid {
    position: absolute;
    left: 50%;
    transform: translate(-50%, -50%) rotate(45deg);
    background: rgba(33, 33, 32, 0.8);
    border-radius: 2px;
  }

  .ruler-scale {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: var(--ruler-height);
    font-size: 11px;
    color: rgba(33, 33, 32, 0.6);
  }

  .analysis-preview {
    height: var(--ruler-height);
    object-fit: contain;
  }

  .empty {
    padding: 16px;
    background: var(--panel);
    border-radius: 8px;
    color: rgba(33, 33, 32, 0.6);
  }

  @media (max-width: 860px) {
    .analysis-section {
      --ruler-height: 160px;
    }

    .preview-pair {
      grid-template-columns: 1fr;
    }

    .analysis-body {
      grid-template-columns: 1fr;
    }

    .ruler-track {
      height: var(--ruler-height);
    }

    .ruler-scale {
      height: var(--ruler-height);
    }
  }
</style>
