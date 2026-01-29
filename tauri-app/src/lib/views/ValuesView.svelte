<script lang="ts">
  import { onMount, tick } from 'svelte';
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
  import { logEvent } from '../bridges/log';

  let file = $state<SelectedImage | null>(null);
  let analysis = $state<ValueAnalysisResult | null>(null);
  let displayAnalysis = $state<ValueAnalysisResult | null>(null);
  let displayImageId = $state<string | null>(null);
  let status = $state<ValueAnalysisState>('idle');
  let error = $state<string | null>(null);
  let levels = $state(3);
  let lastMaskKey = '';

  const renderAnalysis = $derived.by(() => analysis ?? displayAnalysis);
  const effectiveNotanMode = $derived.by(() => levels === 2);

  const neutralSrc = $derived.by(() => {
    if (!renderAnalysis?.neutral) return '';
    return convertFileSrc(renderAnalysis.neutral);
  });

  const previewSrc = $derived.by(() => {
    if (!renderAnalysis?.preview) return '';
    return convertFileSrc(renderAnalysis.preview);
  });

  const isRefreshing = $derived.by(
    () => status === 'pending' && analysis === null && displayAnalysis !== null
  );

  const histogramBins = $derived.by(() => {
    const bins = renderAnalysis?.histogramBins ?? [];
    if (!bins.length) return [];
    const maxCount = Math.max(...bins, 1);
    return bins.map((count, idx) => {
      const value = bins.length > 1 ? idx / (bins.length - 1) : 0;
      const normalized = maxCount > 0 ? count / maxCount : 0;
      const heightPct = count === 0 ? 0 : Math.max(2, Math.round(normalized * 100));
      return {
        idx,
        count,
        value,
        heightPct,
        isEmpty: count === 0
      };
    });
  });

  const bucketData = $derived.by(() => {
    if (!renderAnalysis) return [];
    const counts = renderAnalysis.counts ?? [];
    const total = counts.reduce((sum, count) => sum + count, 0) || 1;
    return renderAnalysis.bucketValues.map((value, idx) => {
      const count = counts[idx] ?? 0;
      const share = count / total;
      const lower = idx === 0 ? 0 : renderAnalysis.boundaries[idx - 1] ?? 0;
      const upper =
        idx === renderAnalysis.bucketValues.length - 1
          ? 1
          : renderAnalysis.boundaries[idx] ?? 1;
      return {
        idx,
        value,
        count,
        share,
        lower,
        upper
      };
    });
  });




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

  function updateLevels() {
    valueAnalysisLevels.set(levels);
    void logEvent(`values:levels ${levels}`);
  }

  function bucketTone(value: number) {
    const shade = Math.round(Math.max(0, Math.min(1, value)) * 255);
    return `rgb(${shade}, ${shade}, ${shade})`;
  }

  function bucketTextColor(value: number) {
    return value <= 0.52 ? 'rgba(248, 242, 227, 0.9)' : 'rgba(33, 33, 32, 0.85)';
  }

  function bucketLabel(bucket: { lower: number; upper: number; share: number }) {
    return `${formatPercent(bucket.lower)}-${formatPercent(bucket.upper)} | ${formatPercent(
      bucket.share
    )}`;
  }

  async function ensureValueAnalysis(
    currentFile: SelectedImage,
    requestedLevels: number,
    requestedNotanMode: boolean
  ) {
    if (!currentFile.path) {
      setValueAnalysisError(
        currentFile.id,
        requestedLevels,
        requestedNotanMode,
        'Value analysis requires a native file path.'
      );
      return;
    }
    const startedAt = performance.now();
    void logEvent(`values:analysis:start levels=${requestedLevels} twoTone=${requestedNotanMode}`);
    setValueAnalysisPending(currentFile.id, requestedLevels, requestedNotanMode);
    try {
      const result = await requestValueAnalysis(
        currentFile.path,
        currentFile.id,
        requestedLevels,
        requestedNotanMode
      );
      const duration = Math.round(performance.now() - startedAt);
      void logEvent(`values:analysis:success ms=${duration}`);
      setValueAnalysisSuccess(currentFile.id, requestedLevels, requestedNotanMode, result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const duration = Math.round(performance.now() - startedAt);
      void logEvent(`values:analysis:error ms=${duration} message=${message}`);
      setValueAnalysisError(currentFile.id, requestedLevels, requestedNotanMode, message);
    }
  }

  onMount(() => {
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
        const startedAt = performance.now();
        void logEvent(
          `values:analysis:subscribe:start has=${value ? 'yes' : 'no'} map=${
            value?.bucketMapData?.length ?? 0
          }`
        );
        analysis = value;
        if (value && file) {
          displayAnalysis = value;
          displayImageId = file.id;
        }
        const duration = Math.round(performance.now() - startedAt);
        void logEvent(`values:analysis:subscribe:done ms=${duration}`);
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
    void logEvent('values:view:mount');
    queueMicrotask(() => {
      void logEvent('values:view:mount:tick');
    });
    void tick().then(() => {
      void logEvent('values:view:mount:afterDOM');
    });
    const rafHandle = window.requestAnimationFrame(() => {
      void logEvent('values:view:mount:raf');
    });
    const afterTick = window.setTimeout(() => {
      void logEvent('values:view:mount:after100ms');
    }, 100);
    return () => {
      unsubs.forEach((unsub) => unsub());
      window.cancelAnimationFrame(rafHandle);
      window.clearTimeout(afterTick);
      void logEvent('values:view:unmount');
    };
  });

  $effect(() => {
    if (!file) return;
    if (status !== 'idle') return;
    if (analysis) return;
    void ensureValueAnalysis(file, levels, effectiveNotanMode);
  });

  $effect(() => {
    const analysis = renderAnalysis;
    if (!analysis || !analysis.bucketValues.length) {
      lastMaskKey = '';
      return;
    }
    const mapData = analysis.bucketMapData ?? [];
    const maskKey = `${mapData.length}:${analysis.previewWidth}x${analysis.previewHeight}:${
      analysis.bucketValues.length
    }`;
    if (maskKey === lastMaskKey) return;
    lastMaskKey = maskKey;
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
              onload={() => void logEvent('values:image:original:load')}
              onerror={() => void logEvent('values:image:original:error')}
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
              onload={() => void logEvent('values:image:neutral:load')}
              onerror={() => void logEvent('values:image:neutral:error')}
            />
          {:else}
            <div class="empty">Neutral values unavailable.</div>
          {/if}
        </div>
      </div>
    </div>

    {@const safeP10 = Math.max(0, Math.min(1, renderAnalysis.p10))}
    {@const safeP90 = Math.max(0, Math.min(1, renderAnalysis.p90))}
    {@const safeP01 = Math.max(0, Math.min(1, renderAnalysis.p01))}
    {@const safeP99 = Math.max(0, Math.min(1, renderAnalysis.p99))}
    {@const rangeStart = safeP10 * 100}
    {@const rangeWidth = Math.max(0, safeP90 - safeP10) * 100}
    {@const extremeStart = safeP01 * 100}
    {@const extremeWidth = Math.max(0, safeP99 - safeP01) * 100}

    <div class="range-section">
      <div class="range-header">
        <div class="range-title">Range finder</div>
        <div class="range-tags">
          <span>{keyLabel(safeP10, safeP90)}</span>
          <span>{contrastLabel(safeP10, safeP90)}</span>
        </div>
      </div>
    <div class="range-track">
      <div class="range-extension" style={`left: ${extremeStart}%; width: ${extremeWidth}%;`}></div>
      <div class="range-core" style={`left: ${rangeStart}%; width: ${rangeWidth}%;`}></div>
      <div class="range-outline" style={`left: ${extremeStart}%; width: ${extremeWidth}%;`}></div>
    </div>
    <div class="range-scale">
      <span>0</span>
      <span>100</span>
      </div>
      <div class="range-meta">
        <span>Mass range {formatPercent(safeP10)}-{formatPercent(safeP90)}</span>
        <span>Extremes {formatPercent(safeP01)}-{formatPercent(safeP99)}</span>
      </div>
    </div>

    <div class="histogram-section">
      <div class="histogram-header">
        <div class="histogram-title">Values Histogram</div>
      </div>
      <div class="histogram-grid" role="list">
        {#each histogramBins as bin}
          <div class="histogram-column">
            <div
              class="histogram-bar"
              style={`height: ${bin.heightPct}%; background: ${
                bin.isEmpty ? 'transparent' : bucketTone(bin.value)
              };`}
              title={bin.count ? `${bin.count} samples` : '0'}
            ></div>
          </div>
        {/each}
      </div>
    </div>

    <div class="analysis-section">
      <div class="analysis-header">
        <div class="analysis-title">Simplified tones</div>
        <div class="analysis-controls">
          <label class="levels">
            <span>Levels</span>
            <input type="range" min="2" max="5" step="1" bind:value={levels} oninput={updateLevels} />
            <strong>{levels}</strong>
          </label>
        </div>
      </div>

      <div class="bucket-strip" role="list">
        {#each bucketData as bucket}
          <button
            class="bucket"
            type="button"
            style={`flex: ${Math.max(1, bucket.count)}; background: ${bucketTone(bucket.value)}; color: ${bucketTextColor(
              bucket.value
            )};`}
            title={bucketLabel(bucket)}
            aria-pressed="false"
          >
            <span class="bucket-percent">{formatPercent(bucket.share)}</span>
          </button>
        {/each}
      </div>

      <div class="preview-panel">
        <div class="preview-card preview-primary">
          <div class="preview-shell">
            {#if previewSrc}
              <img
                class="preview zoomable"
                src={previewSrc}
                alt="Simplified tones"
                role="button"
                tabindex="0"
                onclick={() => openImageZoom(previewSrc, 'Simplified tones')}
                onkeydown={(event) => handleZoomKeydown(event, previewSrc, 'Simplified tones')}
                onload={() => void logEvent('values:image:preview:load')}
                onerror={() => void logEvent('values:image:preview:error')}
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
    height: 44px;
    border-radius: 999px;
    border: 1px solid rgba(33, 33, 32, 0.18);
    background: linear-gradient(90deg, #2a2926 0%, #f8f2e3 100%);
    overflow: hidden;
  }

  .range-extension {
    position: absolute;
    top: 6px;
    bottom: 6px;
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.1);
  }

  .range-core {
    position: absolute;
    top: 10px;
    bottom: 10px;
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.22);
  }

  .range-outline {
    position: absolute;
    top: 4px;
    bottom: 4px;
    border-radius: 999px;
    border: 2px solid rgba(33, 33, 32, 0.75);
    pointer-events: none;
  }

  .range-scale {
    margin-top: 6px;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: rgba(33, 33, 32, 0.5);
  }

  .range-meta {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-top: 8px;
    color: rgba(33, 33, 32, 0.7);
  }

  .histogram-section {
    margin-bottom: 28px;
    background: rgba(33, 33, 32, 0.03);
    border: 1px solid rgba(33, 33, 32, 0.12);
    border-radius: 14px;
    padding: 16px 20px 18px;
  }

  .histogram-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .histogram-title {
    font-size: 14px;
    font-weight: 600;
  }

  .histogram-grid {
    height: 44px;
    display: grid;
    grid-template-columns: repeat(16, minmax(0, 1fr));
    gap: 4px;
    align-items: end;
  }

  .histogram-column {
    height: 100%;
    display: flex;
    align-items: flex-end;
    padding: 0;
  }

  .histogram-bar {
    width: 100%;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px rgba(33, 33, 32, 0.15);
  }

  .analysis-section {
    border-radius: 14px;
    background: rgba(33, 33, 32, 0.03);
    border: 1px solid rgba(33, 33, 32, 0.12);
    padding: 18px 20px 22px;
  }

  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    gap: 16px;
  }

  .analysis-title {
    font-size: 14px;
    font-weight: 600;
  }

  .analysis-controls {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: flex-end;
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

  .bucket-strip {
    display: flex;
    gap: 2px;
    border-radius: 12px;
    border: 1px solid rgba(33, 33, 32, 0.16);
    overflow: hidden;
    background: rgba(33, 33, 32, 0.08);
  }

  .bucket {
    border: none;
    padding: 8px 6px;
    min-width: 48px;
    min-height: 36px;
    cursor: pointer;
    display: grid;
    place-items: center;
    text-align: center;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .bucket:hover {
    transform: translateY(-1px);
    box-shadow: inset 0 0 0 2px rgba(33, 33, 32, 0.35);
  }

  .bucket[aria-pressed='true'] {
    box-shadow: inset 0 0 0 2px rgba(79, 95, 250, 0.7);
  }

  .bucket-percent {
    font-size: 13px;
    font-weight: 600;
  }

  .preview-panel {
    margin-top: 20px;
    display: grid;
    gap: 12px;
  }


  .empty {
    padding: 16px;
    background: var(--panel);
    border-radius: 8px;
    color: rgba(33, 33, 32, 0.6);
  }

  @media (max-width: 860px) {
    .preview-pair {
      grid-template-columns: 1fr;
    }
  }
</style>
