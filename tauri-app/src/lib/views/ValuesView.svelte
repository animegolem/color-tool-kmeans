<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import type { SelectedImage, ValueAnalysisResult, ValueAnalysisState } from '../stores/ui';
  import {
    selectedFile,
    valueAnalysisLevels,
    valueAnalysisNotanMode,
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
  let notanMode = $state(true);
  let previewMode = $state<'notan' | 'original'>('notan');
  let hoverBucket = $state<number | null>(null);
  let lockedBucket = $state<number | null>(null);
  let bucketMasks = $state<string[]>([]);
  let maskReady = $state(false);
  let maskVersion = 0;
  let lastMaskKey = '';

  const renderAnalysis = $derived.by(() => analysis ?? displayAnalysis);
  const effectiveNotanMode = $derived.by(() => notanMode && levels === 2);

  const neutralSrc = $derived.by(() => {
    if (!renderAnalysis?.neutral) return '';
    return convertFileSrc(renderAnalysis.neutral);
  });

  const previewSrc = $derived.by(() => {
    if (!renderAnalysis?.preview) return '';
    return convertFileSrc(renderAnalysis.preview);
  });

  const bucketMapSrc = $derived.by(() => {
    if (!renderAnalysis?.bucketMap) return '';
    return convertFileSrc(renderAnalysis.bucketMap);
  });

  const isRefreshing = $derived.by(
    () => status === 'pending' && analysis === null && displayAnalysis !== null
  );

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

  const activeBucket = $derived.by(() => (lockedBucket !== null ? lockedBucket : hoverBucket));
  const activePreviewSrc = $derived.by(() =>
    previewMode === 'original' ? file?.previewUrl ?? '' : previewSrc
  );
  const activePreviewLabel = $derived.by(() =>
    previewMode === 'original' ? 'Original + overlay' : 'Simplified tones'
  );
  const rangeSteps = $derived.by(() => Array.from({ length: 11 }, (_, idx) => idx / 10));
  const notanToggleDisabled = $derived.by(() => levels !== 2);


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

  function updateNotanMode(next: boolean) {
    valueAnalysisNotanMode.set(next);
    void logEvent(`values:two-tone ${next}`);
  }

  function updatePreviewMode(next: 'notan' | 'original') {
    previewMode = next;
    void logEvent(`values:preview ${next}`);
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

  function handleBucketEnter(idx: number) {
    hoverBucket = idx;
  }

  function handleBucketLeave() {
    hoverBucket = null;
  }

  function toggleBucket(idx: number) {
    lockedBucket = lockedBucket === idx ? null : idx;
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
      }),
      valueAnalysisNotanMode.subscribe((value) => {
        notanMode = value;
      })
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  });

  onMount(() => {
    void logEvent('values:view:mount');
    return () => {
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
    const src = bucketMapSrc;
    if (!analysis || !src || !analysis.bucketValues.length) {
      bucketMasks = [];
      maskReady = false;
      hoverBucket = null;
      lockedBucket = null;
      lastMaskKey = '';
      return;
    }
    const maskKey = `${analysis.bucketMap}:${analysis.previewWidth}x${analysis.previewHeight}:${
      analysis.bucketValues.length
    }`;
    if (maskKey === lastMaskKey) return;
    lastMaskKey = maskKey;
    maskVersion += 1;
    const requestId = maskVersion;
    maskReady = false;
    hoverBucket = null;
    lockedBucket = null;
    const bucketCount = analysis.bucketValues.length;
    const startedAt = performance.now();
    void logEvent(`values:mask:start buckets=${bucketCount}`);
    void (async () => {
      const img = new Image();
      img.src = src;
      try {
        await img.decode();
      } catch {
        void logEvent('values:mask:error decode');
        return;
      }
      if (requestId !== maskVersion) return;
      const width = img.width || analysis.previewWidth;
      const height = img.height || analysis.previewHeight;
      void logEvent(`values:mask:decoded ${width}x${height}`);
      const baseCanvas = document.createElement('canvas');
      const baseCtx = baseCanvas.getContext('2d');
      if (!baseCtx || width <= 0 || height <= 0) return;
      baseCtx.imageSmoothingEnabled = false;
      baseCanvas.width = width;
      baseCanvas.height = height;
      void logEvent('values:mask:draw:start');
      baseCtx.drawImage(img, 0, 0, width, height);
      void logEvent('values:mask:draw:done');
      void logEvent('values:mask:image-data:start');
      const baseData = baseCtx.getImageData(0, 0, width, height).data;
      void logEvent('values:mask:image-data:done');
      const maskColor = { r: 79, g: 95, b: 250, a: 0.38 };
      const masks: string[] = [];
      void logEvent(`values:mask:loop:start buckets=${bucketCount} pixels=${width * height}`);
      for (let bucket = 0; bucket < bucketCount; bucket += 1) {
        const maskCanvas = document.createElement('canvas');
        const maskCtx = maskCanvas.getContext('2d');
        if (!maskCtx) {
          masks.push('');
          continue;
        }
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskData = maskCtx.createImageData(width, height);
        const pixels = maskData.data;
        const bucketLoopStart = performance.now();
        for (let i = 0; i < baseData.length; i += 4) {
          if (baseData[i] === bucket) {
            pixels[i] = maskColor.r;
            pixels[i + 1] = maskColor.g;
            pixels[i + 2] = maskColor.b;
            pixels[i + 3] = Math.round(maskColor.a * 255);
          }
        }
        const bucketLoopDuration = Math.round(performance.now() - bucketLoopStart);
        void logEvent(`values:mask:bucket:${bucket} ms=${bucketLoopDuration}`);
        maskCtx.putImageData(maskData, 0, 0);
        masks.push(maskCanvas.toDataURL('image/png'));
      }
      if (requestId !== maskVersion) return;
      bucketMasks = masks;
      maskReady = true;
      const duration = Math.round(performance.now() - startedAt);
      void logEvent(`values:mask:done ms=${duration}`);
    })();
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
      <div class="range-steps">
        {#each rangeSteps as step}
          <div class="range-step" style={`background: ${bucketTone(step)};`}></div>
        {/each}
      </div>
      <div class="range-track">
        <div class="range-whisker" style={`left: ${extremeStart}%; width: ${extremeWidth}%;`}></div>
        <div class="range-core" style={`left: ${rangeStart}%; width: ${rangeWidth}%;`}></div>
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

    <div class="analysis-section">
      <div class="analysis-header">
        <div class="analysis-title">Simplified tones</div>
        <div class="analysis-controls">
          <label class="levels">
            <span>Levels</span>
            <input type="range" min="2" max="5" step="1" bind:value={levels} oninput={updateLevels} />
            <strong>{levels}</strong>
          </label>
          <label class="toggle" class:disabled={notanToggleDisabled}>
            <span>Two-tone threshold</span>
            <input
              type="checkbox"
              bind:checked={notanMode}
              disabled={notanToggleDisabled}
              oninput={() => updateNotanMode(notanMode)}
              title={notanToggleDisabled ? 'Requires 2 levels.' : ''}
            />
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
            aria-pressed={activeBucket === bucket.idx}
            onmouseenter={() => handleBucketEnter(bucket.idx)}
            onmouseleave={handleBucketLeave}
            onclick={() => toggleBucket(bucket.idx)}
          >
            <span class="bucket-percent">{formatPercent(bucket.share)}</span>
            <span class="bucket-range">
              {formatPercent(bucket.lower)}-{formatPercent(bucket.upper)}
            </span>
          </button>
        {/each}
      </div>

      <div class="bucket-meta">
        <span>Click a bucket to highlight its mass (optional).</span>
        {#if levels === 2}
          <span>Two-tone threshold uses Otsu when enabled.</span>
        {/if}
      </div>

      <div class="preview-panel">
        <div class="preview-panel-header">
          <div class="preview-title">Simplified preview</div>
          <div class="preview-toggle">
            <button
              class:active={previewMode === 'notan'}
              type="button"
              onclick={() => updatePreviewMode('notan')}
            >
              Simplified
            </button>
            <button
              class:active={previewMode === 'original'}
              type="button"
              onclick={() => updatePreviewMode('original')}
            >
              Original + overlay
            </button>
          </div>
        </div>
        <div class="preview-card preview-primary">
          <span>{activePreviewLabel}</span>
          <div class="preview-shell">
            {#if activePreviewSrc}
              <img
                class="preview zoomable"
                src={activePreviewSrc}
                alt={activePreviewLabel}
                role="button"
                tabindex="0"
                onclick={() => openImageZoom(activePreviewSrc, activePreviewLabel)}
                onkeydown={(event) => handleZoomKeydown(event, activePreviewSrc, activePreviewLabel)}
              />
            {:else}
              <div class="empty">Preview unavailable.</div>
            {/if}
            {#if activeBucket !== null && maskReady && bucketMasks[activeBucket]}
              <img class="preview-mask" src={bucketMasks[activeBucket]} alt="" aria-hidden="true" />
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
    background: linear-gradient(
      90deg,
      #2d2c2a 0%,
      #2d2c2a 9%,
      #474641 9%,
      #474641 18%,
      #61605a 18%,
      #61605a 27%,
      #7a776f 27%,
      #7a776f 36%,
      #949089 36%,
      #949089 45%,
      #aea99f 45%,
      #aea99f 54%,
      #c7c2b7 54%,
      #c7c2b7 63%,
      #dfd9cd 63%,
      #dfd9cd 72%,
      #f2ece0 72%,
      #f2ece0 81%,
      #f8f2e3 81%,
      #f8f2e3 100%
    );
    overflow: hidden;
  }

  .range-steps {
    display: grid;
    grid-template-columns: repeat(11, minmax(0, 1fr));
    gap: 4px;
    margin-bottom: 10px;
  }

  .range-step {
    height: 14px;
    border-radius: 6px;
    box-shadow: inset 0 0 0 1px rgba(33, 33, 32, 0.12);
  }

  .range-whisker {
    position: absolute;
    top: 8px;
    height: 3px;
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.55);
  }

  .range-core {
    position: absolute;
    top: 6px;
    bottom: 6px;
    border-radius: 999px;
    border: 2px solid rgba(33, 33, 32, 0.75);
    background: rgba(248, 242, 227, 0.16);
    box-shadow: inset 0 0 0 1px rgba(248, 242, 227, 0.5);
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

  .levels,
  .toggle {
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

  .toggle input {
    width: 18px;
    height: 18px;
  }

  .toggle.disabled {
    opacity: 0.5;
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
    padding: 10px 8px;
    min-width: 52px;
    min-height: 64px;
    cursor: pointer;
    display: grid;
    align-content: space-between;
    text-align: left;
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
    font-size: 14px;
    font-weight: 600;
  }

  .bucket-range {
    font-size: 11px;
    opacity: 0.75;
  }

  .bucket-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.6);
    margin-top: 10px;
    flex-wrap: wrap;
  }

  .preview-panel {
    margin-top: 20px;
    display: grid;
    gap: 12px;
  }

  .preview-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .preview-title {
    font-size: 14px;
    font-weight: 600;
  }

  .preview-toggle {
    display: inline-flex;
    gap: 6px;
    border-radius: 999px;
    padding: 4px;
    background: rgba(33, 33, 32, 0.08);
  }

  .preview-toggle button {
    border: none;
    background: transparent;
    font-size: 12px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 10px;
    border-radius: 999px;
    color: rgba(33, 33, 32, 0.6);
    cursor: pointer;
  }

  .preview-toggle button.active {
    background: rgba(33, 33, 32, 0.15);
    color: rgba(33, 33, 32, 0.9);
  }

  .preview-mask {
    position: absolute;
    inset: 0;
    border-radius: 12px;
    mix-blend-mode: multiply;
    pointer-events: none;
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
