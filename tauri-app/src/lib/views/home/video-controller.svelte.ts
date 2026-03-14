import { assetUrl } from '../../utils/asset-url';
import type { ImageEntry, VideoState, VideoCacheEntry } from '../../stores/ui';
import type { FileSelection } from '../../bridges/fs';
import { inferMimeType } from '../../bridges/fs';
import { extractVideoFrame, extractVideoStrip, probeVideo } from '../../bridges/video';
import { logEvent } from '../../bridges/log';
import { devlog } from '../../utils/devlog';
import { formatTime } from '../../utils/time';
import { setActivePath } from '../../services/active-image';

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
  getVideoStripMode: () => 'filmstrip' | 'barcode';
  getCachedVideoState: (videoPath: string) => VideoCacheEntry | null;
  cacheVideoState: (videoPath: string, entry: VideoCacheEntry) => void;
  findExistingFrameId: (videoPath: string) => string | null;
  seedAnalysisKey: (imageId: string, params: any) => void;
  hasAnalysisForImage: (id: string) => boolean;
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
  let _restoringFromSessionCache = false;
  let _currentLoadCid: string | null = null;
  let _loadSrcTimer: ReturnType<typeof setTimeout> | null = null;
  let _pendingSeekTime: number | null = null;

  function videoResourceSnapshot() {
    return {
      hasSrcUrl: videoSrcUrl !== null,
      srcUrlKind: videoSrcUrl ? (videoSrcUrl.startsWith('blob:') ? 'blob' : 'asset') : null,
      hasPosterUrl: videoPosterUrl !== null,
      hasStripUrl: videoStripUrl !== null,
      decodeToken: videoDecodeToken,
      probePending: videoProbePending,
      stripPending: videoStripPending
    };
  }

  function buildCacheEntry(): VideoCacheEntry | null {
    if (!videoFrameId) return null;
    return {
      duration: videoDuration,
      fps: videoFps,
      currentTime: videoCurrentTime,
      stripPath: videoStripPath,
      stripId: videoStripId,
      posterPath: videoPosterPath,
      frameId: videoFrameId
    };
  }

  function saveToCache() {
    if (!videoSelection?.path) return;
    const entry = buildCacheEntry();
    if (entry) {
      deps.cacheVideoState(videoSelection.path, entry);
    }
  }

  function resetVideoState() {
    const prevFrameId = videoFrameId;
    const prevSrcUrl = videoSrcUrl;
    devlog('video:reset', 'Reset video state', {
      prevFrameId,
      prevSrcUrl: prevSrcUrl ? (prevSrcUrl.startsWith('blob:') ? 'blob' : 'asset') : null
    });
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
    _currentLoadCid = null;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
    videoDecodeToken += 1;
    if (videoDecodeTimer) {
      clearTimeout(videoDecodeTimer);
      videoDecodeTimer = null;
    }
    if (_loadSrcTimer) {
      clearTimeout(_loadSrcTimer);
      _loadSrcTimer = null;
    }
  }

  function pushVideoState() {
    if (restoringVideoState) return;
    if (!videoSelection?.path) {
      deps.setVideoState(null);
      return;
    }
    devlog('video:pushState', 'Push video state', {
      duration: videoDuration,
      hasPoster: videoPosterPath !== null,
      hasStrip: videoStripPath !== null
    });
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
    const mime = inferMimeType(state.name);
    return {
      name: state.name,
      path: state.path,
      size: 0,
      blob: new Blob([], { type: mime }),
      mimeType: mime
    };
  }

  const BARCODE_MAX_FRAMES = 30_000;
  const BARCODE_REJECT_FRAMES = 90_000;
  const BARCODE_HEIGHT = 120;

  function scheduleVideoStripGeneration() {
    if (!videoSelection?.path || videoStripPending || videoDuration <= 0 || videoStripPath) return;
    if (!deps.isNativeModeActive()) return;

    const mode = deps.getVideoStripMode();
    const stripId =
      videoStripId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoStripId = stripId;
    videoStripPending = true;

    let thumbCount: number;
    let thumbWidth: number;
    let thumbHeight: number;

    if (mode === 'barcode') {
      const fps = videoFps && videoFps > 0 ? videoFps : 24;
      const totalFrames = Math.round(videoDuration * fps);
      if (totalFrames > BARCODE_REJECT_FRAMES) {
        videoStripPending = false;
        void logEvent(`video:strip:skip mode=barcode frames=${totalFrames} (exceeds limit)`);
        return;
      }
      thumbCount = totalFrames > BARCODE_MAX_FRAMES ? BARCODE_MAX_FRAMES : totalFrames;
      thumbWidth = 1;
      thumbHeight = BARCODE_HEIGHT;
    } else {
      thumbCount = 60;
      thumbWidth = 64;
      thumbHeight = 36;
    }

    void logEvent(`video:strip:start mode=${mode} count=${thumbCount}`);
    extractVideoStrip({
      path: videoSelection.path,
      stripId,
      duration: videoDuration,
      thumbCount,
      thumbWidth,
      thumbHeight,
      stripMode: mode
    })
      .then((response) => {
        videoStripPath = response.path;
        videoStripUrl = assetUrl(response.path);
        pushVideoState();
        saveToCache();
        void logEvent(`video:strip:done mode=${mode}`);
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`video:strip:error message=${message}`);
      })
      .finally(() => {
        videoStripPending = false;
      });
  }

  function regenerateStrip() {
    if (!videoSelection?.path || videoDuration <= 0) return;
    videoStripPath = null;
    videoStripUrl = null;
    videoStripId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    scheduleVideoStripGeneration();
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
    const wasNull = videoFrameId === null;
    const frameId =
      videoFrameId ?? (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoFrameId = frameId;
    const quality = deps.getQuality();
    const maxDimension = deps.maxDimensionForQuality(quality);
    const token = ++videoDecodeToken;
    const decodeCid = _currentLoadCid;
    devlog('video:frameDecode:schedule', 'Schedule frame decode', {
      frameId, wasNull, cid: decodeCid, token
    });
    videoDecodeTimer = setTimeout(async () => {
      if (!videoSelection?.path || token !== videoDecodeToken) {
        devlog('video:frameDecode:stale', 'Stale token — skipping', {
          expectedToken: token, currentToken: videoDecodeToken
        });
        return;
      }
      devlog('video:frameDecode:exec', 'Execute frame decode', { frameId, token, cid: decodeCid });
      try {
        void logEvent(`video:frame:start t=${requestTime.toFixed(2)} max=${maxDimension}`);
        const response = await extractVideoFrame({
          path: videoSelection.path,
          frameId,
          timestamp: requestTime,
          maxDimension
        });
        if (token !== videoDecodeToken) {
          devlog('video:frameDecode:stale', 'Stale after extract', {
            expectedToken: token, currentToken: videoDecodeToken
          });
          return;
        }
        const framePath = response.path;
        if (!framePath) return;
        setActivePath(framePath);
        const previewUrl = assetUrl(framePath);
        videoPosterUrl = previewUrl;
        videoPosterPath = framePath;
        const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
        const entry: ImageEntry = {
          id: frameId,
          name: videoSelection.name,
          path: framePath,
          videoPath: videoSelection.path,
          frameTimestamp: requestTime,
          size: 0,
          source: { kind: 'path', path: framePath },
          previewUrl
        };
        const wasRestoring = _restoringFromSessionCache;
        _restoringFromSessionCache = false;
        deps.setFile(entry, dataset);
        if (wasRestoring && deps.hasAnalysisForImage(frameId)) {
          // setFile already restored analysisState='ready' from analysisById cache.
          // Seed the dedup key so the HomeView $effect won't re-trigger analysis.
          deps.seedAnalysisKey(frameId, deps.getCurrentParams());
        } else {
          deps.clearLastRequestKey();
          deps.scheduleAnalysisWith({ ...entry, dataset }, deps.getCurrentParams());
        }
        pushVideoState();
        saveToCache(); // capture posterPath so cache restores show hasPoster=true
        devlog('video:frameDecode:done', 'Frame decode done', {
          frameId, framePath, cid: decodeCid, ...videoResourceSnapshot()
        });
        void logEvent(`video:frame:done t_req=${requestTime.toFixed(4)} t_ffmpeg=${response.timestampUsed}`);
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
      saveToCache();
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

  function loadVideoSelection(selection: FileSelection, existingId?: string, cid?: string) {
    const loadCid = cid ?? devlog.cid();
    const nativeMode =
      deps.isNativeModeActive() && !!selection.path;
    devlog('video:load', 'Starting video load', {
      path: selection.path ?? null, existingId: existingId ?? null, cid: loadCid,
      ...videoResourceSnapshot()
    });
    if (!nativeMode || !selection.path) {
      deps.setBannerMessage('Video analysis requires the desktop app.');
      return;
    }

    // Check session cache before probing
    const cached = selection.path ? deps.getCachedVideoState(selection.path) : null;
    if (cached) {
      devlog('video:load:cacheHit', 'Restoring from session cache', {
        path: selection.path, cid: loadCid,
        duration: cached.duration, hasStrip: cached.stripPath !== null
      });
      saveToCache(); // snapshot outgoing video before reset
      resetVideoState();
      _currentLoadCid = loadCid;
      videoSelection = selection;
      videoSrcUrl = deps.buildPreviewUrl(selection, nativeMode);
      videoDuration = cached.duration;
      videoCurrentTime = cached.currentTime;
      _pendingSeekTime = cached.currentTime > 0 ? cached.currentTime : null;
      videoFps = cached.fps;
      videoFrameId = existingId ?? cached.frameId;
      videoStripId = cached.stripId ??
        (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
      if (cached.stripPath) {
        videoStripPath = cached.stripPath;
        videoStripUrl = assetUrl(cached.stripPath);
      }
      if (cached.posterPath) {
        videoPosterPath = cached.posterPath;
        videoPosterUrl = assetUrl(cached.posterPath);
        setActivePath(cached.posterPath);
      }
      pushVideoState();
      _restoringFromSessionCache = true;
      scheduleVideoFrameDecode();
      return;
    }

    saveToCache(); // snapshot outgoing video before reset
    resetVideoState();
    _currentLoadCid = loadCid;
    videoSelection = selection;
    videoSrcUrl = deps.buildPreviewUrl(selection, nativeMode);
    videoDuration = 0;
    videoCurrentTime = 0;
    videoFps = null;
    const reusedFrameId = !!existingId;
    videoFrameId = existingId ??
      (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoStripId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    devlog('video:load:ids', 'Assigned IDs', {
      frameId: videoFrameId, stripId: videoStripId, reusedFrameId, cid: loadCid
    });
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
    _pendingSeekTime = videoCurrentTime > 0 ? videoCurrentTime : null;
    videoFrameId = deps.findExistingFrameId(state.path) ??
      (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
    videoStripId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    if (state.stripPath) {
      videoStripPath = state.stripPath;
      videoStripUrl = assetUrl(state.stripPath);
    }
    if (state.posterPath) {
      videoPosterPath = state.posterPath;
      videoPosterUrl = assetUrl(state.posterPath);
      setActivePath(state.posterPath);
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
    saveToCache();
    resetVideoState();
    pushVideoState();
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
    const seekTarget = _pendingSeekTime ?? (videoCurrentTime > 0 ? videoCurrentTime : null);
    if (seekTarget !== null && seekTarget > 0) {
      videoElement.currentTime = seekTarget;
      videoCurrentTime = seekTarget;
    }
    _pendingSeekTime = null;
    if (videoElement.videoWidth > 0 && videoElement.videoHeight > 0) {
      videoAspectRatio = videoElement.videoWidth / videoElement.videoHeight;
    }
    devlog('video:metadata', 'Video metadata loaded', {
      duration: videoDuration,
      width: videoElement.videoWidth,
      height: videoElement.videoHeight,
      willStartStrip: !videoStripPath && videoDuration > 0,
      willStartFrame: !videoPosterPath
    });
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
    if (_pendingSeekTime !== null) return;
    videoCurrentTime = videoElement.currentTime;
    pushVideoState();
  }

  function handleVideoLoadedData() {
    if (!videoElement) return;
    const seekTarget = _pendingSeekTime ?? (videoCurrentTime > 0 ? videoCurrentTime : null);
    if (
      seekTarget !== null &&
      Math.abs(videoElement.currentTime - seekTarget) > 0.01
    ) {
      videoElement.currentTime = seekTarget;
      videoCurrentTime = seekTarget;
    }
    _pendingSeekTime = null;
    const support = videoElement.canPlayType('video/mp4; codecs="avc1.64001f, mp4a.40.2"');
    devlog('video:loadedData', 'Video loaded data', { readyState: videoElement.readyState });
    void logEvent(
      `video:loadeddata ready=${videoElement.readyState} support=${support || 'unknown'}`
    );
  }

  function handleVideoError() {
    const error = videoElement?.error;
    const code = error?.code ?? 'unknown';
    const message = error?.message ?? 'unknown';
    devlog.error('video:error', 'Video error', { code, message });
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

  function setVideoElementRef(el: HTMLVideoElement | null) {
    videoElement = el;
  }

  function handleVideoStateChange(state: VideoState | null) {
    if (restoringVideoState) return;
    devlog('video:stateChange', 'Video state change', {
      hasState: state !== null,
      isRestoring: restoringVideoState,
      currentPath: videoSelection?.path ?? null
    });
    if (!state) {
      if (videoSelection) {
        resetVideoState();
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
    const el = videoElement;
    const src = videoSrcUrl;
    devlog('video:srcEffect', 'Src effect (debounced)', { hasElement: el !== null, hasSrc: src !== null });
    if (_loadSrcTimer) {
      clearTimeout(_loadSrcTimer);
      _loadSrcTimer = null;
    }
    if (el && src) {
      _loadSrcTimer = setTimeout(() => {
        _loadSrcTimer = null;
        // Re-read latest state inside callback to act on final URL
        const currentEl = videoElement;
        const currentSrc = videoSrcUrl;
        if (currentEl && currentSrc) {
          devlog('video:srcEffect:load', 'Calling el.load()', { src: currentSrc.startsWith('blob:') ? 'blob' : 'asset' });
          currentEl.load();
        }
      }, 100);
    }
  }

  return {
    get videoSelection() { return videoSelection; },
    get videoSrcUrl() { return videoSrcUrl; },
    get videoDuration() { return videoDuration; },
    get videoCurrentTime() { return videoCurrentTime; },
    set videoCurrentTime(v: number) { videoCurrentTime = v; },
    get videoAspectRatio() { return videoAspectRatio; },
    get videoFps() { return videoFps ?? 0; },
    get videoProbePending() { return videoProbePending; },
    get videoStripUrl() { return videoStripUrl; },
    get videoStripPending() { return videoStripPending; },
    get videoDisplayUrl() { return videoPosterUrl ?? null; },
    loadVideoSelection,
    clearVideoSelection,
    regenerateStrip,
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
    formatTime
  };
}
