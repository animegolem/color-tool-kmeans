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
    AnalysisState,
    VideoState
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
    openZoomOverlay,
    videoState,
    setVideoState,
  } from '../stores/ui';
  import { analyzeImage } from '../compute/bridge';
  import { TauriComputeError } from '../bridges/compute';
  import { loadImageDataset } from '../compute/image-loader';
  import { getFsBridge, type FileSelection } from '../bridges/fs';
  import { getBridgeOverride, isTauriEnv, tauriDetectionInfo } from '../bridges/tauri';
  import { convertFileSrc } from '@tauri-apps/api/core';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';
  import { generateHistogramSvg } from '../exports/histogram';
  import { getFfmpegVersion } from '../bridges/ffmpeg';
  import { extractVideoFrame, extractVideoStrip, probeVideo } from '../bridges/video';
  import { logEvent } from '../bridges/log';

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
  let videoSelection = $state<FileSelection | null>(null);
  let videoSrcUrl = $state<string | null>(null);
  let videoPosterUrl = $state<string | null>(null);
  let videoPosterPath = $state<string | null>(null);
  let videoDuration = $state(0);
  let videoCurrentTime = $state(0);
  let videoScrubbing = $state(false);
  let videoFps = $state<number | null>(null);
  let videoAspectRatio = $state<number | null>(null);
  let videoFrameId = $state<string | null>(null);
  let videoDecodeToken = 0;
  let videoDecodeTimer: ReturnType<typeof setTimeout> | null = null;
  let videoProbePending = $state(false);
  let videoStripUrl = $state<string | null>(null);
  let videoStripPath = $state<string | null>(null);
  let videoStripPending = $state(false);
  let videoStripId = $state<string | null>(null);
  let videoElement = $state<HTMLVideoElement | null>(null);
  let restoringVideoState = false;
  let videoScrollLock: { top: number; token: number | null } | null = null;
  let analysisScrollLock: { top: number; token: number | null } | null = null;

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
      mode: currentParams.polarMode,
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

  const videoDisplayUrl = $derived.by(() => videoPosterUrl ?? null);

  function buildPreviewUrl(selection: FileSelection, nativeMode: boolean): string | null {
    if (nativeMode && selection.path) {
      return convertFileSrc(selection.path);
    }
    if (selection.blob && selection.blob.size > 0) {
      return URL.createObjectURL(selection.blob);
    }
    return null;
  }

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const whole = Math.floor(seconds);
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function maxDimensionForQuality(quality: number): number {
    const step = Math.round(quality);
    if (step <= 0) return 1200;
    if (step === 1) return 1600;
    if (step === 2) return 2200;
    if (step === 3) return 2600;
    return 3200;
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
    captureAnalysisScroll();
  }

  function handleScrubEnd() {
    if (!isScrubbing) return;
    isScrubbing = false;
    if (file) {
      scheduleAnalysisWith(file, currentParams);
    }
  }

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

  async function chooseVideo() {
    try {
      const bridge = await getFsBridge();
      const selection = await bridge.openVideoFile();
      if (!selection) {
        return;
      }
      recordDevEvent({ fsBridge: bridge.id }, 'file');
      void logEvent(`video:file:loaded name=${selection.name}`);
      loadVideoSelection(selection);
    } catch (error) {
      console.error('[home] Failed to open video dialog', error);
      bannerMessage = 'Could not open the video file dialog. Restart the app or verify Tauri is running.';
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
    clearVideoSelection();
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

  function buildVideoSelectionFromState(state: VideoState): FileSelection {
    return {
      name: state.name,
      path: state.path,
      size: 0,
      blob: new Blob([], { type: 'video/mp4' }),
      mimeType: 'video/mp4'
    };
  }

  function resetVideoState() {
    videoSelection = null;
    if (videoSrcUrl && videoSrcUrl.startsWith('blob:')) {
      URL.revokeObjectURL(videoSrcUrl);
    }
    videoSrcUrl = null;
    videoPosterUrl = null;
    videoPosterPath = null;
    videoDuration = 0;
    videoCurrentTime = 0;
    videoFps = null;
    videoScrubbing = false;
    videoAspectRatio = null;
    videoFrameId = null;
    videoProbePending = false;
    videoStripUrl = null;
    videoStripPath = null;
    videoStripPending = false;
    videoStripId = null;
    videoScrollLock = null;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
    videoDecodeToken += 1;
    if (videoDecodeTimer) {
      clearTimeout(videoDecodeTimer);
      videoDecodeTimer = null;
    }
  }

  function pushVideoState() {
    if (restoringVideoState) return;
    if (!videoSelection?.path) {
      setVideoState(null);
      return;
    }
    setVideoState({
      path: videoSelection.path,
      name: videoSelection.name,
      duration: videoDuration,
      fps: videoFps,
      currentTime: videoCurrentTime,
      stripPath: videoStripPath,
      posterPath: videoPosterPath
    });
  }

  function loadVideoSelection(selection: FileSelection) {
    const nativeMode = (isTauriEnv() || getBridgeOverride() === 'tauri') && !!selection.path;
    if (!nativeMode || !selection.path) {
      bannerMessage = 'Video analysis requires the desktop app.';
      return;
    }
    clearSelection();
    resetVideoState();
    videoSelection = selection;
    videoSrcUrl = buildPreviewUrl(selection, nativeMode);
    videoDuration = 0;
    videoCurrentTime = 0;
    videoFps = null;
    videoFrameId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    videoStripId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    pushVideoState();
    void probeVideoDuration(selection.path);
  }

  function restoreVideoSelection(state: VideoState) {
    if (!state.path) return;
    restoringVideoState = true;
    resetVideoState();
    videoSelection = buildVideoSelectionFromState(state);
    videoSrcUrl = buildPreviewUrl(videoSelection, true);
    videoDuration = state.duration ?? 0;
    videoFps = state.fps ?? null;
    videoCurrentTime = state.currentTime ?? 0;
    videoFrameId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    videoStripId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    if (state.stripPath) {
      videoStripPath = state.stripPath;
      videoStripUrl = `${convertFileSrc(state.stripPath)}?t=${Date.now()}`;
    }
    if (state.posterPath) {
      videoPosterPath = state.posterPath;
      videoPosterUrl = `${convertFileSrc(state.posterPath)}?t=${Date.now()}`;
    }
    restoringVideoState = false;
    if (videoSelection?.path && (videoDuration <= 0 || !videoFps)) {
      void probeVideoDuration(videoSelection.path);
    } else {
      if (!videoStripPath && videoDuration > 0) {
        scheduleVideoStripGeneration();
      }
      if (!videoPosterPath && videoDuration > 0) {
        scheduleVideoFrameDecode();
      }
    }
  }

  function clearVideoSelection() {
    resetVideoState();
    pushVideoState();
    clearFile();
  }

  async function probeVideoDuration(path: string) {
    videoProbePending = true;
    try {
      const response = await probeVideo(path);
      if (Number.isFinite(response.duration) && response.duration > 0) {
        videoDuration = response.duration;
      }
      if (Number.isFinite(response.fps ?? NaN) && (response.fps ?? 0) > 0) {
        videoFps = response.fps ?? null;
      }
      void logEvent(
        `video:probe:done duration=${videoDuration.toFixed(2)} fps=${videoFps ?? 'unknown'}`
      );
      if (!videoStripPath) {
        scheduleVideoStripGeneration();
      }
      if (!videoPosterPath) {
        scheduleVideoFrameDecode();
      }
      pushVideoState();
      if (videoElement) {
        videoElement.currentTime = videoCurrentTime;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void logEvent(`video:probe:error message=${message}`);
    } finally {
      videoProbePending = false;
    }
  }

  function scheduleVideoStripGeneration() {
    if (!videoSelection?.path || videoStripPending || videoDuration <= 0 || videoStripPath) return;
    if (!isNativeModeActive()) return;
    const stripId = videoStripId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoStripId = stripId;
    videoStripPending = true;
    const thumbCount = 60;
    const thumbWidth = 64;
    const thumbHeight = 36;
    void logEvent(`video:strip:start count=${thumbCount}`);
    extractVideoStrip({
      path: videoSelection.path,
      stripId,
      duration: videoDuration,
      thumbCount,
      thumbWidth,
      thumbHeight
    })
      .then((response) => {
        videoStripPath = response.path;
        videoStripUrl = `${convertFileSrc(response.path)}?t=${Date.now()}`;
        pushVideoState();
        void logEvent('video:strip:done');
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`video:strip:error message=${message}`);
      })
      .finally(() => {
        videoStripPending = false;
      });
  }

  function stepVideoFrames(step: number) {
    if (videoDuration <= 0) return;
    captureVideoScroll();
    const fps = videoFps && videoFps > 0 ? videoFps : 24;
    const delta = step / fps;
    const next = Math.min(Math.max(videoCurrentTime + delta, 0), videoDuration);
    videoCurrentTime = next;
    if (videoElement) {
      videoElement.currentTime = next;
    }
    scheduleVideoFrameDecode();
    pushVideoState();
  }

  function handleVideoScrubStart() {
    videoScrubbing = true;
    captureVideoScroll();
  }

  function handleVideoMetadata() {
    if (!videoElement) return;
    const duration = videoElement.duration;
    if (Number.isFinite(duration) && duration > 0) {
      videoDuration = duration;
    } else if (videoElement.seekable.length > 0) {
      const seekEnd = videoElement.seekable.end(0);
      if (Number.isFinite(seekEnd) && seekEnd > 0) {
        videoDuration = seekEnd;
      }
    }
    if (videoCurrentTime > 0) {
      videoElement.currentTime = videoCurrentTime;
    }
    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    }
    void logEvent(`video:metadata duration=${videoDuration.toFixed(2)}`);
    if (!videoStripPath && videoDuration > 0) {
      scheduleVideoStripGeneration();
    }
    if (!videoPosterPath) {
      scheduleVideoFrameDecode();
    }
  }

  function handleVideoSeeked() {
    if (!videoElement || videoScrubbing) return;
    videoCurrentTime = videoElement.currentTime;
    pushVideoState();
  }

  function handleVideoLoadedData() {
    if (!videoElement) return;
    if (videoCurrentTime > 0 && Math.abs(videoElement.currentTime - videoCurrentTime) > 0.01) {
      videoElement.currentTime = videoCurrentTime;
    }
    const support = videoElement.canPlayType('video/mp4; codecs="avc1.64001f, mp4a.40.2"');
    void logEvent(
      `video:loadeddata ready=${videoElement.readyState} support=${support || 'unknown'}`
    );
  }

  function handleVideoError() {
    const error = videoElement?.error;
    const code = error?.code ?? 'unknown';
    const message = error?.message ?? 'unknown';
    void logEvent(
      `video:load:error code=${code} message=${message} src=${videoSrcUrl ?? 'none'}`
    );
  }

  function handleStripSeek(event: PointerEvent) {
    if (videoDuration <= 0) return;
    captureVideoScroll();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const nextTime = ratio * videoDuration;
    videoCurrentTime = nextTime;
    if (videoElement) {
      videoElement.currentTime = nextTime;
    }
    scheduleVideoFrameDecode();
    pushVideoState();
  }

  function handleVideoScrubInput(event: Event) {
    const nextTime = Number((event.target as HTMLInputElement).value);
    if (!videoScrollLock) {
      captureVideoScroll();
    }
    videoCurrentTime = nextTime;
    if (videoElement) {
      videoElement.currentTime = nextTime;
    }
    pushVideoState();
  }

  function handleVideoScrubEnd() {
    videoScrubbing = false;
    scheduleVideoFrameDecode();
    pushVideoState();
  }

  function scheduleVideoFrameDecode() {
    if (!videoSelection?.path) return;
    if (!isNativeModeActive()) {
      bannerMessage = 'Video analysis requires the desktop app.';
      return;
    }
    if (videoDecodeTimer) {
      clearTimeout(videoDecodeTimer);
    }
    const requestTime = videoCurrentTime;
    const frameId = videoFrameId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoFrameId = frameId;
    const quality = currentParams.quality ?? 2;
    const maxDimension = maxDimensionForQuality(quality);
    const token = ++videoDecodeToken;
    if (videoScrollLock) {
      videoScrollLock.token = token;
    }
    videoDecodeTimer = setTimeout(async () => {
      if (!videoSelection?.path || token !== videoDecodeToken) return;
      try {
        void logEvent(`video:frame:start t=${requestTime.toFixed(2)} max=${maxDimension}`);
        const response = await extractVideoFrame({
          path: videoSelection.path,
          frameId,
          timestamp: requestTime,
          maxDimension
        });
        if (token !== videoDecodeToken) return;
        const framePath = response.path;
        if (!framePath) return;
        (globalThis as any).__ACTIVE_IMAGE_PATH__ = framePath;
        const previewUrl = `${convertFileSrc(framePath)}?t=${Date.now()}`;
        videoPosterUrl = previewUrl;
        videoPosterPath = framePath;
        const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
        const entry: ImageEntry = {
          id: frameId,
          name: videoSelection.name,
          path: framePath,
          size: 0,
          source: { kind: 'path', path: framePath },
          previewUrl
        };
        setFile(entry, dataset);
        lastRequestKey = null;
        scheduleAnalysisWith({ ...entry, dataset }, currentParams);
        pushVideoState();
        restoreVideoScroll(token);
        void logEvent(`video:frame:done t=${requestTime.toFixed(2)}`);
      } catch (error) {
        if (token !== videoDecodeToken) return;
        console.error('[home] Video frame decode failed', error);
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`video:frame:error message=${message}`);
        bannerMessage = 'Failed to decode video frame. Please try another file.';
      }
    }, 250);
  }

  function captureVideoScroll() {
    if (typeof document === 'undefined') return;
    const scroller = document.scrollingElement ?? document.documentElement;
    videoScrollLock = { top: scroller.scrollTop, token: null };
  }

  function restoreVideoScroll(token: number) {
    if (!videoScrollLock || videoScrollLock.token !== token) return;
    if (typeof document === 'undefined') return;
    const targetTop = videoScrollLock.top;
    videoScrollLock = null;
    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const scroller = document.scrollingElement ?? document.documentElement;
        scroller.scrollTop = targetTop;
      });
    });
  }

  function captureAnalysisScroll() {
    if (typeof document === 'undefined') return;
    const scroller = document.scrollingElement ?? document.documentElement;
    analysisScrollLock = { top: scroller.scrollTop, token: null };
  }

  function restoreAnalysisScroll(token: number) {
    if (!analysisScrollLock || analysisScrollLock.token !== token) return;
    if (typeof document === 'undefined') return;
    const targetTop = analysisScrollLock.top;
    analysisScrollLock = null;
    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const scroller = document.scrollingElement ?? document.documentElement;
        scroller.scrollTop = targetTop;
      });
    });
  }

  function cancelPending() {
    currentToken += 1;
    analysisScrollLock = null;
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
      mergeThreshold: paramSnapshot.mergeThreshold,
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
    if (analysisScrollLock) {
      analysisScrollLock.token = token;
    }
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
      restoreAnalysisScroll(token);
    } catch (err) {
      if (token !== currentToken) {
        return;
      }
      recordDevEvent({ computeVariant: 'error' }, 'analysis');
      console.error('[home] analysis failed', err);
      const message = mapErrorToMessage(err);
      setAnalysisError(message);
      restoreAnalysisScroll(token);
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

  onMount(() => {
    void logEvent('home:view:mount');
    void checkFfmpegVersion();
    const unsubs = [
      selectedFile.subscribe((value) => {
        file = value;
      }),
      params.subscribe((value) => {
        currentParams = { ...value };
      }),
      analysisState.subscribe((value) => {
        status = value;
      }),
      analysisResult.subscribe((value) => {
        result = value;
      }),
      analysisError.subscribe((value) => {
        analysisErr = value;
      }),
      videoState.subscribe((state) => {
        if (restoringVideoState) return;
        if (!state) {
          if (videoSelection) {
            resetVideoState();
            clearFile();
          }
          return;
        }
        if (videoSelection?.path === state.path) {
          return;
        }
        restoreVideoSelection(state);
      })
    ];
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
      unsubs.forEach((unsub) => unsub());
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      window.removeEventListener('pointerup', handleScrubEnd);
      window.removeEventListener('pointercancel', handleScrubEnd);
      void logEvent('home:view:unmount');
    };
  });

  onDestroy(() => {
    cancelPending();
  });

  $effect(() => {
    if (videoElement && videoSrcUrl) {
      videoElement.load();
    }
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

  {#if file || videoSelection}
    <section class="analysis-layout">
      <div class="analysis-column">
        {#if videoSelection}
          <div class="media-panel">
            <div class="image-preview">
              {#if videoSrcUrl}
                <div
                  class="video-frame"
                  style={videoAspectRatio ? `aspect-ratio: ${videoAspectRatio}` : undefined}
                >
                  <video
                    bind:this={videoElement}
                    poster={videoDisplayUrl ?? undefined}
                    muted
                    playsinline
                    preload="auto"
                    onloadedmetadata={handleVideoMetadata}
                    onloadeddata={handleVideoLoadedData}
                    onseeked={handleVideoSeeked}
                    onerror={handleVideoError}
                  >
                    <source src={videoSrcUrl} type="video/mp4" />
                  </video>
                </div>
              {:else}
                <div class="preview-placeholder">Loading video frame…</div>
              {/if}
            </div>
            <div class="video-controls">
              <div class="step-group">
                <button type="button" class="step-btn" onclick={() => stepVideoFrames(-10)}>◀◀</button>
                <button type="button" class="step-btn" onclick={() => stepVideoFrames(-1)}>◀</button>
              </div>
              <input
                class="video-scrub"
                type="range"
                min="0"
                max={videoDuration > 0 ? videoDuration : 1}
                step="0.01"
                bind:value={videoCurrentTime}
                onpointerdown={handleVideoScrubStart}
                onpointerup={handleVideoScrubEnd}
                onpointercancel={handleVideoScrubEnd}
                oninput={handleVideoScrubInput}
                disabled={videoDuration <= 0}
                aria-label="Video timeline"
              />
              <div class="step-group step-group--right">
                <button type="button" class="step-btn" onclick={() => stepVideoFrames(1)}>▶</button>
                <button type="button" class="step-btn" onclick={() => stepVideoFrames(10)}>▶▶</button>
              </div>
              <div class="video-time">
                {#if videoProbePending && videoDuration <= 0}
                  Indexing…
                {:else}
                  {formatTime(videoCurrentTime)} / {formatTime(videoDuration)}
                {/if}
              </div>
            </div>
            <div class="video-strip">
              {#if videoStripUrl}
                <div
                  class="video-strip__image"
                  style={`background-image: url(${videoStripUrl})`}
                ></div>
              {:else if videoStripPending}
                <div class="video-strip__placeholder">Building strip…</div>
              {/if}
              <button
                type="button"
                class="video-strip__hit"
                onpointerdown={handleStripSeek}
                aria-label="Jump to video position"
              ></button>
              <div
                class="video-strip__indicator"
                style={`left: ${videoDuration > 0 ? (videoCurrentTime / videoDuration) * 100 : 0}%`}
              ></div>
            </div>
          </div>
        {:else}
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
        {/if}
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
                <span>{$params.polarMode === 'oklch' ? 'Hue · Chroma' : 'Hue · Saturation'}</span>
              </div>
              <div class="toggle-group">
                <button
                  type="button"
                  class:active={$params.polarMode === 'oklch'}
                  onclick={() => ($params.polarMode = 'oklch')}
                >
                  OKLCH
                </button>
                <button
                  type="button"
                  class:active={$params.polarMode === 'okhsv'}
                  onclick={() => ($params.polarMode = 'okhsv')}
                >
                  OKHSV
                </button>
                <button
                  type="button"
                  class:active={$params.polarMode === 'hsv'}
                  onclick={() => ($params.polarMode = 'hsv')}
                >
                  HSV
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
                <span>Rendered in OKLCH</span>
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
      {#if videoSelection}
        <div>
          <strong>Selected video:</strong>
          <span>{videoSelection?.name}</span>
        </div>
        <button onclick={clearVideoSelection}>Clear</button>
      {:else}
        <div>
          <strong>Selected file:</strong>
          <span>{file?.name}</span>
        </div>
        <button onclick={clearSelection}>Clear</button>
      {/if}
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
        <div class="upload-group">
          <button class="upload" onclick={chooseFile}>Upload image</button>
          <button class="upload upload--ghost" onclick={chooseVideo}>Upload video</button>
        </div>
        <p class="formats">Images: PNG, JPEG, WebP · Videos: MP4.</p>
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
          <div style="font-size:12px;opacity:.8">PNG · JPEG · WebP · MP4</div>
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
          max="2000"
          step="1"
          bind:value={$params.clusters}
          onpointerdown={handleScrubStart}
          onpointerup={handleScrubEnd}
          onpointercancel={handleScrubEnd}
          onblur={handleScrubEnd}
        />
        <input class="number-input" type="number" min="1" max="2000" step="1" bind:value={$params.clusters} />
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
        <span>Color merge threshold (ΔE OKLab): <strong>{$params.mergeThreshold.toFixed(2)}</strong></span>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.01"
          bind:value={$params.mergeThreshold}
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
    </div>
  </section>

</section>

<style>
  .home {
    max-width: 1120px;
    margin: 0 auto;
    container-type: inline-size;
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

  @container (max-width: 980px) {
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

  .upload-group {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .upload {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
  }

  .upload--ghost {
    background: transparent;
    color: var(--accent);
    border: 1px solid var(--accent);
  }

  .media-panel {
    display: grid;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--line);
  }

  .media-panel .image-preview {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }

  .media-panel .video-frame {
    width: 100%;
    display: grid;
    place-items: center;
    background: #fff;
    aspect-ratio: 16 / 9;
  }

  .media-panel video {
    width: 100%;
    height: auto;
    display: block;
  }

  .video-controls {
    display: grid;
    grid-template-columns: auto 1fr auto auto;
    gap: 12px;
    align-items: center;
  }

  .step-group {
    display: inline-flex;
    gap: 6px;
  }

  .step-group--right {
    justify-content: flex-end;
  }

  .step-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 6px 10px;
    min-width: 36px;
  }

  .video-scrub {
    width: 100%;
  }

  .video-time {
    font-size: 12px;
    color: rgba(33, 33, 32, 0.65);
    min-width: 90px;
    text-align: right;
  }

  .video-strip {
    position: relative;
    height: 52px;
    border-radius: 8px;
    border: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.7);
    overflow: hidden;
  }

  .video-strip__image {
    position: absolute;
    inset: 0;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-position: center;
    opacity: 0.9;
  }

  .video-strip__hit {
    position: absolute;
    inset: 0;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    z-index: 2;
  }

  .video-strip__placeholder {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.6);
  }

  .video-strip__indicator {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: var(--accent);
    transform: translateX(-1px);
    z-index: 3;
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

  .grid > label > span {
    min-height: 2.6em;
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
