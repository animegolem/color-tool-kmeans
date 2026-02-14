import { convertFileSrc } from '@tauri-apps/api/core';
import type { ImageEntry, VideoState } from '../../stores/ui';
import type { FileSelection } from '../../bridges/fs';
import { extractVideoFrame, extractVideoStrip, probeVideo } from '../../bridges/video';
import { logEvent } from '../../bridges/log';

export interface VideoControllerDeps {
  isNativeModeActive: () => boolean;
  buildPreviewUrl: (selection: FileSelection, nativeMode: boolean) => string | null;
  maxDimensionForQuality: (quality: number) => number;
  setFile: (entry: ImageEntry, dataset: { width: number; height: number; pixels: Uint8Array }) => void;
  setVideoState: (state: VideoState | null) => void;
  clearFile: () => void;
  getQuality: () => number;
  setBannerMessage: (msg: string) => void;
  scheduleAnalysisWith: (file: ImageEntry & { dataset: { width: number; height: number; pixels: Uint8Array } }, params: any) => void;
  getCurrentParams: () => any;
  clearLastRequestKey: () => void;
  captureAnalysisScroll: () => void;
}

export function createVideoController(deps: VideoControllerDeps) {
  let videoSelection: FileSelection | null = $state(null);
  let videoSrcUrl: string | null = $state(null);
  let videoPosterUrl: string | null = $state(null);
  let videoPosterPath: string | null = $state(null);
  let videoDuration = $state(0);
  let videoCurrentTime = $state(0);
  let videoScrubbing = $state(false);
  let videoFps: number | null = $state(null);
  let videoAspectRatio: number | null = $state(null);
  let videoFrameId: string | null = $state(null);
  let videoDecodeToken = 0;
  let videoDecodeTimer: ReturnType<typeof setTimeout> | null = null;
  let videoProbePending = $state(false);
  let videoStripUrl: string | null = $state(null);
  let videoStripPath: string | null = $state(null);
  let videoStripPending = $state(false);
  let videoStripId: string | null = $state(null);
  let videoElement: HTMLVideoElement | null = $state(null);
  let restoringVideoState = false;

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
      deps.setVideoState(null);
      return;
    }
    deps.setVideoState({
      path: videoSelection.path,
      name: videoSelection.name,
      duration: videoDuration,
      fps: videoFps,
      currentTime: videoCurrentTime,
      stripPath: videoStripPath,
      posterPath: videoPosterPath
    });
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

  function scheduleVideoStripGeneration() {
    if (!videoSelection?.path || videoStripPending || videoDuration <= 0 || videoStripPath) return;
    if (!deps.isNativeModeActive()) return;
    const stripId =
      videoStripId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
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

  function scheduleVideoFrameDecode() {
    if (!videoSelection?.path) return;
    if (!deps.isNativeModeActive()) {
      deps.setBannerMessage('Video analysis requires the desktop app.');
      return;
    }
    if (videoDecodeTimer) {
      clearTimeout(videoDecodeTimer);
    }
    const requestTime = videoCurrentTime;
    const frameId =
      videoFrameId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoFrameId = frameId;
    const quality = deps.getQuality();
    const maxDimension = deps.maxDimensionForQuality(quality);
    const token = ++videoDecodeToken;
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
        deps.setFile(entry, dataset);
        deps.clearLastRequestKey();
        deps.scheduleAnalysisWith({ ...entry, dataset }, deps.getCurrentParams());
        pushVideoState();
        void logEvent(`video:frame:done t=${requestTime.toFixed(2)}`);
      } catch (error) {
        if (token !== videoDecodeToken) return;
        console.error('[home] Video frame decode failed', error);
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`video:frame:error message=${message}`);
        deps.setBannerMessage('Failed to decode video frame. Please try another file.');
      }
    }, 250);
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

  function loadVideoSelection(selection: FileSelection) {
    const nativeMode =
      deps.isNativeModeActive() && !!selection.path;
    if (!nativeMode || !selection.path) {
      deps.setBannerMessage('Video analysis requires the desktop app.');
      return;
    }
    resetVideoState();
    videoSelection = selection;
    videoSrcUrl = deps.buildPreviewUrl(selection, nativeMode);
    videoDuration = 0;
    videoCurrentTime = 0;
    videoFps = null;
    videoFrameId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    videoStripId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    pushVideoState();
    void probeVideoDuration(selection.path);
  }

  function restoreVideoSelection(state: VideoState) {
    if (!state.path) return;
    restoringVideoState = true;
    resetVideoState();
    videoSelection = buildVideoSelectionFromState(state);
    videoSrcUrl = deps.buildPreviewUrl(videoSelection, true);
    videoDuration = state.duration ?? 0;
    videoFps = state.fps ?? null;
    videoCurrentTime = state.currentTime ?? 0;
    videoFrameId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    videoStripId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    if (state.stripPath) {
      videoStripPath = state.stripPath;
      videoStripUrl = `${convertFileSrc(state.stripPath)}?t=${Date.now()}`;
    }
    if (state.posterPath) {
      videoPosterPath = state.posterPath;
      videoPosterUrl = `${convertFileSrc(state.posterPath)}?t=${Date.now()}`;
      (globalThis as any).__ACTIVE_IMAGE_PATH__ = state.posterPath;
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
    deps.clearFile();
  }

  function stepVideoFrames(step: number) {
    if (videoDuration <= 0) return;
    deps.captureAnalysisScroll();
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
    deps.captureAnalysisScroll();
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
    if (
      videoCurrentTime > 0 &&
      Math.abs(videoElement.currentTime - videoCurrentTime) > 0.01
    ) {
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
    deps.captureAnalysisScroll();
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

  function formatTime(seconds: number): string {
    if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';
    const whole = Math.floor(seconds);
    const mins = Math.floor(whole / 60);
    const secs = whole % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function setVideoElementRef(el: HTMLVideoElement | null) {
    videoElement = el;
  }

  function handleVideoStateChange(state: VideoState | null) {
    if (restoringVideoState) return;
    if (!state) {
      if (videoSelection) {
        resetVideoState();
        deps.clearFile();
      }
      return;
    }
    if (videoSelection?.path === state.path) {
      return;
    }
    try {
      restoreVideoSelection(state);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      void logEvent(`video:restore:error message=${message}`);
      console.error('[video] restoreVideoSelection failed', err);
    }
  }

  function loadSrcEffect() {
    if (videoElement && videoSrcUrl) {
      videoElement.load();
    }
  }

  return {
    get videoSelection() { return videoSelection; },
    get videoSrcUrl() { return videoSrcUrl; },
    get videoPosterUrl() { return videoPosterUrl; },
    get videoDuration() { return videoDuration; },
    get videoCurrentTime() { return videoCurrentTime; },
    set videoCurrentTime(v: number) { videoCurrentTime = v; },
    get videoScrubbing() { return videoScrubbing; },
    get videoFps() { return videoFps; },
    get videoAspectRatio() { return videoAspectRatio; },
    get videoProbePending() { return videoProbePending; },
    get videoStripUrl() { return videoStripUrl; },
    get videoStripPending() { return videoStripPending; },
    get videoElement() { return videoElement; },
    get videoDisplayUrl() { return videoPosterUrl ?? null; },
    loadVideoSelection,
    clearVideoSelection,
    stepVideoFrames,
    handleVideoScrubStart,
    handleVideoScrubEnd,
    handleVideoScrubInput,
    handleVideoMetadata,
    handleVideoSeeked,
    handleVideoLoadedData,
    handleVideoError,
    handleStripSeek,
    handleVideoStateChange,
    setVideoElementRef,
    loadSrcEffect,
    formatTime,
    scheduleVideoFrameDecode
  };
}
