<script lang="ts">
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { listen } from '@tauri-apps/api/event';
  import type { ImageEntry } from '../stores/ui';
  import {
    openZoomOverlay, setFile, appendFile, videoState, params,
    pendingVideoSwitch, images, mediaLoadRequested, libraryDrawerOpen
  } from '../stores/ui';
  import { getFsBridge, isVideoFile, inferMimeType } from '../bridges/fs';
  import type { FileSelection } from '../bridges/fs';
  import { isTauriEnv } from '../bridges/tauri';
  import { logEvent } from '../bridges/log';
  import { probeVideo } from '../bridges/video';
  import { openImageZoom as zoomImage, openSvgZoom, handleZoomKeydown as svgZoomKeydown } from '../utils/zoom';
  import { generateValuesHistogramSvg } from '../exports/values-histogram';
  import { showSimplifiedTones, setVideoState, invalidateAnalysisForImage } from '../stores/ui';
  import { createValueAnalysisRunner } from './values/value-analysis-runner.svelte';
  import { createVideoScrubber } from './values/video-scrubber.svelte';
  import VideoScrubber from './values/VideoScrubber.svelte';

  let videoEl = $state<HTMLVideoElement | null>(null);

  const runner = createValueAnalysisRunner();

  function maxDimensionForQuality(quality: number): number {
    const step = Math.round(quality);
    if (step <= 0) return 1200;
    if (step === 1) return 1600;
    if (step === 2) return 2200;
    if (step === 3) return 2600;
    return 3200;
  }

  const scrubber = createVideoScrubber({
    getMaxDimension: () => maxDimensionForQuality($params.quality),
    captureScroll: () => runner.captureAnalysisScroll(),
    onFrameExtracted: (framePath, frameId, timestamp, videoPath, videoName) => {
      (globalThis as any).__ACTIVE_IMAGE_PATH__ = framePath;
      const previewUrl = `${convertFileSrc(framePath)}?t=${Date.now()}`;
      // Reuse existing frame entry ID for the same video to prevent duplicates
      const existing = get(images).find((item) => item.videoPath === videoPath);
      const entryId = existing?.id ?? frameId;
      invalidateAnalysisForImage(entryId);
      const entry: ImageEntry = {
        id: entryId,
        name: videoName,
        path: framePath,
        videoPath,
        size: 0,
        source: { kind: 'path', path: framePath },
        previewUrl
      };
      const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      setFile(entry, dataset);
      runner.ensureAnalysis({ ...entry, dataset }, runner.levels, runner.effectiveNotanMode);
    },
    updateVideoState: (currentTime, posterPath) => {
      const vs = $videoState;
      if (!vs) return;
      setVideoState({ ...vs, currentTime, posterPath });
    }
  });

  const renderAnalysis = $derived.by(() => runner.analysis);

  const neutralSrc = $derived.by(() => {
    if (!renderAnalysis?.neutral) return '';
    return `${convertFileSrc(renderAnalysis.neutral)}?t=${Date.now()}`;
  });

  const previewSrc = $derived.by(() => {
    if (!renderAnalysis?.preview) return '';
    return `${convertFileSrc(renderAnalysis.preview)}?t=${Date.now()}`;
  });

  const isRefreshing = $derived.by(
    () => runner.status === 'pending' && runner.analysis === null
  );

  const valuesHistogram = $derived.by(() => {
    const bins = renderAnalysis?.histogramBins ?? [];
    if (!bins.length) return null;
    return generateValuesHistogramSvg(bins);
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
    zoomImage(src, alt, openZoomOverlay);
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

  async function probeAndSetVideoState(videoPath: string, name: string) {
    try {
      const probe = await probeVideo(videoPath);
      setVideoState({
        path: videoPath,
        name,
        duration: probe.duration,
        fps: probe.fps ?? null,
        currentTime: 0,
        posterPath: null
      });
    } catch (err) {
      console.error('[values] Video probe failed', err);
    }
  }

  let pendingVideoPath: string | null = null;

  function handleVideoFile(videoPath: string, name: string) {
    const vs = get(videoState);
    if (vs?.path === videoPath) return;
    if (pendingVideoPath === videoPath) return;
    pendingVideoPath = videoPath;
    runner.cancelPending();
    void probeAndSetVideoState(videoPath, name).finally(() => {
      if (pendingVideoPath === videoPath) pendingVideoPath = null;
    });
  }

  function handleImageFile(sel: FileSelection) {
    setVideoState(null);
    const nativeMode = isTauriEnv() && !!sel.path;
    const dataset = nativeMode
      ? { width: 0, height: 0, pixels: new Uint8Array(0) }
      : { width: 0, height: 0, pixels: new Uint8Array(0) };

    // Path-based dedup: reuse existing entry ID if same path
    const existing = nativeMode && sel.path
      ? get(images).find((item) => item.path === sel.path && !item.videoPath)
      : null;
    const entryId = existing?.id ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

    const previewUrl = nativeMode && sel.path
      ? convertFileSrc(sel.path)
      : sel.blob && sel.blob.size > 0
        ? URL.createObjectURL(sel.blob)
        : null;

    const source: ImageEntry['source'] = nativeMode && sel.path
      ? { kind: 'path', path: sel.path }
      : { kind: 'blob' };

    if (nativeMode && sel.path) {
      (globalThis as any).__ACTIVE_IMAGE_PATH__ = sel.path;
    }

    const entry: ImageEntry = {
      id: entryId,
      name: sel.name || sel.path || 'image',
      path: sel.path,
      size: sel.size,
      source,
      previewUrl
    };

    setFile(entry, dataset);
  }

  async function processBatch(selections: FileSelection[]) {
    let videoProcessed = false;
    let firstActivated = false;

    for (const sel of selections) {
      if (isVideoFile(sel)) {
        if (!videoProcessed && sel.path) {
          videoProcessed = true;
          firstActivated = true;
          handleVideoFile(sel.path, sel.name);
        } else if (sel.path) {
          const entryId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
          const entry: ImageEntry = {
            id: entryId,
            name: sel.name,
            path: sel.path,
            videoPath: sel.path,
            size: sel.size,
            source: { kind: 'path', path: sel.path },
            previewUrl: null
          };
          appendFile(entry, { width: 0, height: 0, pixels: new Uint8Array(0) });
        }
      } else {
        if (!firstActivated) {
          firstActivated = true;
          handleImageFile(sel);
        } else {
          const nativeMode = isTauriEnv() && !!sel.path;
          const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
          const entryId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
          const previewUrl = nativeMode && sel.path ? convertFileSrc(sel.path) : null;
          const source: ImageEntry['source'] = nativeMode && sel.path
            ? { kind: 'path', path: sel.path }
            : { kind: 'blob' };
          const entry: ImageEntry = {
            id: entryId,
            name: sel.name || sel.path || 'file',
            path: sel.path,
            size: sel.size,
            source,
            previewUrl
          };
          appendFile(entry, dataset);
        }
      }
    }
    if (selections.length > 1) {
      libraryDrawerOpen.set(true);
    }
  }

  async function handleUpload() {
    try {
      const bridge = await getFsBridge();
      const selections = await bridge.openMediaFiles('all');
      if (!selections?.length) return;
      await processBatch(selections);
    } catch (e) {
      console.error('[values] Upload failed', e);
    }
  }

  onMount(() => {
    const cleanupRunner = runner.mount();
    scrubber.syncFromVideoState($videoState);
    // HomeView → ValuesView handoff: if we mount with an existing video frame
    // that hasn't been analyzed yet, trigger analysis immediately.
    // (During scrubbing, onFrameExtracted handles analysis directly.)
    if (runner.file?.videoPath && !runner.hasCurrentAnalysis) {
      void runner.ensureAnalysis(runner.file, runner.levels, runner.effectiveNotanMode);
    }
    let unlistenDragDrop: (() => void) | null = null;
    if (isTauriEnv()) {
      listen<{ paths?: string[] }>('tauri://drag-drop', (event) => {
        const paths = event.payload?.paths;
        if (!paths?.length) return;
        const selections = paths.map((p) => ({
          name: p.split(/[\\/]/).pop() ?? 'file',
          path: p,
          size: 0,
          blob: new Blob([], { type: inferMimeType(p.split(/[\\/]/).pop() ?? '') }),
          mimeType: inferMimeType(p.split(/[\\/]/).pop() ?? '')
        } satisfies FileSelection));
        void processBatch(selections);
      }).then((fn) => { unlistenDragDrop = fn; });
    }
    const unsubs = [
      videoState.subscribe((vs) => {
        scrubber.syncFromVideoState(vs);
        if (vs && (!runner.file || runner.file.videoPath !== vs.path)) {
          scrubber.scheduleFrameExtract();
        }
      }),
      pendingVideoSwitch.subscribe((pending) => {
        if (!pending) return;
        const { id } = pending;
        pendingVideoSwitch.set(null);
        const entry = get(images).find((item) => item.id === id);
        if (!entry?.path) return;
        const videoPath = entry.videoPath ?? entry.path;
        handleVideoFile(videoPath, entry.name);
      }),
      (() => {
        let first = true;
        return mediaLoadRequested.subscribe(() => {
          if (first) { first = false; return; }
          handleUpload();
        });
      })()
    ];
    return () => {
      cleanupRunner();
      unsubs.forEach((unsub) => unsub());
      if (unlistenDragDrop) unlistenDragDrop();
      scrubber.destroy();
    };
  });

  $effect(() => {
    if (!runner.file) return;
    if (runner.status !== 'idle') return;
    if (runner.hasCurrentAnalysis) return;
    // Raw video files need frame extraction, not direct analysis
    if (runner.file.path && /\.mp4$/i.test(runner.file.path) && !runner.file.videoPath) {
      handleVideoFile(runner.file.path, runner.file.name);
      return;
    }
    // Video frames are analyzed directly in onFrameExtracted
    if (runner.file.videoPath) return;
    void runner.ensureAnalysis(runner.file, runner.levels, runner.effectiveNotanMode);
  });

  $effect(() => {
    runner.trackMaskKey(renderAnalysis);
  });

  $effect(() => {
    scrubber.setVideoElementRef(videoEl);
  });

  $effect(() => {
    const src = scrubber.videoSrcUrl;
    if (!videoEl || !src) return;
    const timer = setTimeout(() => videoEl?.load(), 100);
    return () => clearTimeout(timer);
  });
</script>

<section class="values">
  {#if !runner.file}
    <div class="empty empty--upload">
      <p>No media loaded.</p>
      <button class="upload" onclick={handleUpload}>Add media</button>
      <p class="formats">PNG, JPEG, WebP, BMP, GIF, TIFF, MP4</p>
    </div>
  {:else if !renderAnalysis}
    {#if runner.status === 'pending'}
      <div class="empty">Generating values analysis...</div>
    {:else if runner.status === 'error'}
      <div class="empty">Values analysis failed. {runner.error ?? 'Unknown error.'}</div>
    {:else}
      <div class="empty">Select media to view the values analysis.</div>
    {/if}
  {:else}
    <div class="preview-frame">
      <div class="preview-pair">
        <div class="preview-card">
          <span>Original</span>
          {#if scrubber.isVideo}
            <video
              bind:this={videoEl}
              class="preview"
              poster={runner.file.previewUrl ?? undefined}
              muted
              playsinline
              preload="auto"
            >
              {#if scrubber.videoSrcUrl}
                <source src={scrubber.videoSrcUrl} type="video/mp4" />
              {/if}
            </video>
          {:else if runner.file.previewUrl}
            <div
              class="zoomable"
              role="button"
              tabindex="0"
              onclick={() => openImageZoom(runner.file.previewUrl ?? '', runner.file.name)}
              onkeydown={(event) => handleZoomKeydown(event, runner.file.previewUrl ?? '', runner.file.name)}
            >
              <img
                class="preview"
                src={runner.file.previewUrl}
                alt={runner.file.name}
                onload={() => void logEvent('values:image:original:load')}
                onerror={() => void logEvent('values:image:original:error')}
              />
            </div>
          {:else}
            <div class="empty">Preview unavailable.</div>
          {/if}
        </div>
        <div class="preview-card">
          <span>Neutral values</span>
          {#if neutralSrc}
            <div
              class="zoomable"
              role="button"
              tabindex="0"
              onclick={() => openImageZoom(neutralSrc, 'Neutral values')}
              onkeydown={(event) => handleZoomKeydown(event, neutralSrc, 'Neutral values')}
            >
              <img
                class="preview"
                src={neutralSrc}
                alt="Neutral values"
                onload={() => void logEvent('values:image:neutral:load')}
                onerror={() => void logEvent('values:image:neutral:error')}
              />
            </div>
          {:else}
            <div class="empty">Neutral values unavailable.</div>
          {/if}
        </div>
        {#if scrubber.isVideo}
          <VideoScrubber {scrubber} />
        {/if}
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

    {#if valuesHistogram}
    <div class="histogram-section">
      <div class="histogram-header">
        <div class="histogram-title">Values Histogram</div>
      </div>
      <div
        class="histogram-chart zoomable"
        role="button"
        tabindex="0"
        onclick={() => openSvgZoom(valuesHistogram?.svg, valuesHistogram?.width, valuesHistogram?.height, openZoomOverlay)}
        onkeydown={(event) => svgZoomKeydown(event, valuesHistogram?.svg, valuesHistogram?.width, valuesHistogram?.height, openZoomOverlay)}
      >
        {@html valuesHistogram.svg}
      </div>
    </div>
    {/if}

    {#if $showSimplifiedTones}
    <div class="analysis-section">
      <div class="analysis-header">
        <div class="analysis-title">Simplified tones</div>
        <div class="analysis-controls">
          <label class="levels">
            <span>Levels</span>
            <input type="range" min="2" max="5" step="1" bind:value={runner.levels} oninput={runner.updateLevels} />
            <strong>{runner.levels}</strong>
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
        <div class="preview-card">
          <div class="preview-shell">
            {#if previewSrc}
              <div
                class="zoomable"
                role="button"
                tabindex="0"
                onclick={() => openImageZoom(previewSrc, 'Simplified tones')}
                onkeydown={(event) => handleZoomKeydown(event, previewSrc, 'Simplified tones')}
              >
                <img
                  class="preview"
                  src={previewSrc}
                  alt="Simplified tones"
                  onload={() => void logEvent('values:image:preview:load')}
                  onerror={() => void logEvent('values:image:preview:error')}
                />
              </div>
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

  .preview-pair :global(.video-scrubber) {
    grid-column: 1;
    margin-top: 4px;
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
    display: block;
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

  .histogram-chart :global(svg) {
    width: 100%;
    height: auto;
    display: block;
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

  .empty--upload {
    text-align: center;
    padding: 56px 16px;
    border: 2px dashed var(--accent);
    background: rgba(130, 76, 50, 0.06);
  }

  .empty--upload p {
    margin: 0;
  }

  .upload {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
    margin-top: 12px;
  }

  .formats {
    margin-top: 12px;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.6);
  }

  @media (max-width: 860px) {
    .preview-pair {
      grid-template-columns: 1fr;
    }
  }
</style>
