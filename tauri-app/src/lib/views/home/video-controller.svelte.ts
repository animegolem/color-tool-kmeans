import { assetUrl } from '../../utils/asset-url';
import type {
  ImageEntry,
  SelectedImage,
  VideoState,
  VideoCacheEntry,
  SettledVideoFrame,
  SelectionAuthority,
} from '../../stores/ui';
import { matchesSettledVideoFrame } from '../../stores/video';
import type { FileSelection } from '../../bridges/fs';
import { inferMimeType } from '../../bridges/fs';
import {
  extractVideoFrame,
  extractVideoStrip,
  probeVideo,
} from '../../bridges/video';
import { logEvent } from '../../bridges/log';
import { devlog } from '../../utils/devlog';
import { formatTime } from '../../utils/time';
import { setActivePath } from '../../services/active-image';

export interface VideoControllerDeps {
  isNativeModeActive: () => boolean;
  buildPreviewUrl: (
    selection: FileSelection,
    nativeMode: boolean
  ) => string | null;
  maxDimensionForQuality: (quality: number) => number;
  setFile: (
    entry: ImageEntry,
    dataset: { width: number; height: number; pixels: Uint8Array },
    options?: { selection?: SelectionAuthority }
  ) => boolean;
  setVideoState: (state: VideoState | null) => void;
  clearFile: () => void;
  getQuality: () => number;
  setBannerMessage: (msg: string) => void;
  scheduleAnalysisWith: (
    file: ImageEntry & {
      dataset: { width: number; height: number; pixels: Uint8Array };
    },
    params: any
  ) => void;
  getCurrentParams: () => any;
  cancelPending: () => void;
  clearLastRequestKey: () => void;
  captureAnalysisScroll: () => void;
  getVideoStripMode: () => 'filmstrip' | 'barcode';
  getCachedVideoState: (videoPath: string) => VideoCacheEntry | null;
  cacheVideoState: (videoPath: string, entry: VideoCacheEntry) => void;
  getSelectedFile: () => SelectedImage | null;
  beginSelection: (mediaId?: string | null) => SelectionAuthority;
  isCurrentSelection: (selection: SelectionAuthority) => boolean;
}

export function subscribeToVideoStripMode(
  store: {
    subscribe: (run: (mode: 'filmstrip' | 'barcode') => void) => () => void;
  },
  regenerateStrip: () => void
) {
  return store.subscribe(regenerateStrip);
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
  let videoSelectionAuthority: SelectionAuthority | null = null;
  let videoDecodeToken = 0;
  let videoDecodeTimer: ReturnType<typeof setTimeout> | null = null;
  const videoDecodeQueues = new Map<string, Promise<void>>();
  let videoProbePending = $state(false);
  let frameDecoding = $state(false);
  let videoStripUrl: string | null = $state(null);
  let videoStripPath: string | null = $state(null);
  let videoStripPending = $state(false);
  let videoStripId: string | null = $state(null);
  let videoElement: HTMLVideoElement | null = $state(null);
  let restoringVideoState = false;
  let _currentLoadCid: string | null = null;
  let _loadSrcTimer: ReturnType<typeof setTimeout> | null = null;
  let _pendingSeekTime: number | null = null;
  let settledFrame: SettledVideoFrame | null = null;
  let pendingFrameRequestKey: string | null = null;
  let reusedFrameKey: string | null = null;
  let disposed = false;

  function ownsSelection(selection: SelectionAuthority | null): boolean {
    return (
      !disposed &&
      selection !== null &&
      videoSelectionAuthority?.epoch === selection.epoch &&
      deps.isCurrentSelection(selection)
    );
  }

  function currentVideoState(): VideoState | null {
    if (!videoSelection?.path || !videoSelectionAuthority) return null;
    return {
      selection: videoSelectionAuthority,
      path: videoSelection.path,
      name: videoSelection.name,
      duration: videoDuration,
      fps: videoFps,
      currentTime: videoCurrentTime,
      settledFrame,
      stripPath: videoStripPath,
      stripId: videoStripId,
      posterPath: videoPosterPath,
    };
  }

  function frameRequestKey(
    selection: SelectionAuthority,
    path: string,
    requestedTime: number,
    maxDimension: number
  ) {
    return `${selection.epoch}\u0000${path}\u0000${requestedTime}\u0000${maxDimension}`;
  }

  function cancelLocalFrameRequest() {
    videoDecodeToken += 1;
    pendingFrameRequestKey = null;
    frameDecoding = false;
    if (videoDecodeTimer) {
      clearTimeout(videoDecodeTimer);
      videoDecodeTimer = null;
    }
  }

  function reuseSettledFrame(maxDimension: number): boolean {
    const state = currentVideoState();
    const file = deps.getSelectedFile();
    if (
      !matchesSettledVideoFrame(
        state,
        videoSelectionAuthority,
        file,
        maxDimension
      )
    )
      return false;
    cancelLocalFrameRequest();
    videoFrameId = file.id;
    videoPosterPath = file.path;
    videoPosterUrl = assetUrl(file.path);
    setActivePath(file.path);
    const key = `${state!.selection.epoch}\u0000${file.id}\u0000${file.contentRevision}\u0000${maxDimension}`;
    if (reusedFrameKey !== key) {
      reusedFrameKey = key;
      deps.scheduleAnalysisWith(file, deps.getCurrentParams());
    }
    return true;
  }

  function videoResourceSnapshot() {
    return {
      hasSrcUrl: videoSrcUrl !== null,
      srcUrlKind: videoSrcUrl
        ? videoSrcUrl.startsWith('blob:')
          ? 'blob'
          : 'asset'
        : null,
      hasPosterUrl: videoPosterUrl !== null,
      hasStripUrl: videoStripUrl !== null,
      decodeToken: videoDecodeToken,
      probePending: videoProbePending,
      stripPending: videoStripPending,
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
      frameId: videoFrameId,
    };
  }

  function saveToCache(retiring = false) {
    if (disposed) return;
    if (
      !videoSelection?.path ||
      (!retiring && !ownsSelection(videoSelectionAuthority))
    )
      return;
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
      prevSrcUrl: prevSrcUrl
        ? prevSrcUrl.startsWith('blob:')
          ? 'blob'
          : 'asset'
        : null,
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
    videoSelectionAuthority = null;
    videoProbePending = false;
    frameDecoding = false;
    videoStripUrl = null;
    videoStripPath = null;
    videoStripPending = false;
    videoStripId = null;
    _currentLoadCid = null;
    _pendingSeekTime = null;
    settledFrame = null;
    pendingFrameRequestKey = null;
    reusedFrameKey = null;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0;
    }
    cancelLocalFrameRequest();
    if (_loadSrcTimer) {
      clearTimeout(_loadSrcTimer);
      _loadSrcTimer = null;
    }
  }

  function pushVideoState() {
    if (disposed) return;
    if (restoringVideoState) return;
    if (!videoSelection?.path) {
      deps.setVideoState(null);
      return;
    }
    if (!ownsSelection(videoSelectionAuthority)) return;
    devlog('video:pushState', 'Push video state', {
      duration: videoDuration,
      hasPoster: videoPosterPath !== null,
      hasStrip: videoStripPath !== null,
    });
    deps.setVideoState({
      selection: videoSelectionAuthority!,
      path: videoSelection.path,
      name: videoSelection.name,
      duration: videoDuration,
      fps: videoFps,
      currentTime: videoCurrentTime,
      settledFrame,
      stripPath: videoStripPath,
      stripId: videoStripId,
      posterPath: videoPosterPath,
    });
  }

  function buildVideoSelectionFromState(state: VideoState): FileSelection {
    const mime = inferMimeType(state.name);
    return {
      name: state.name,
      path: state.path,
      size: 0,
      blob: new Blob([], { type: mime }),
      mimeType: mime,
    };
  }

  const BARCODE_MAX_FRAMES = 30_000;
  const BARCODE_REJECT_FRAMES = 90_000;
  const BARCODE_HEIGHT = 120;

  function scheduleVideoStripGeneration() {
    if (
      !videoSelection?.path ||
      !ownsSelection(videoSelectionAuthority) ||
      videoStripPending ||
      videoDuration <= 0 ||
      videoStripPath
    )
      return;
    if (!deps.isNativeModeActive()) return;

    const mode = deps.getVideoStripMode();
    const stripId =
      videoStripId ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;
    videoStripId = stripId;
    videoStripPending = true;
    const selection = videoSelectionAuthority!;

    let thumbCount: number;
    let thumbWidth: number;
    let thumbHeight: number;

    if (mode === 'barcode') {
      const fps = videoFps && videoFps > 0 ? videoFps : 24;
      const totalFrames = Math.round(videoDuration * fps);
      if (totalFrames > BARCODE_REJECT_FRAMES) {
        videoStripPending = false;
        void logEvent(
          `video:strip:skip mode=barcode frames=${totalFrames} (exceeds limit)`
        );
        return;
      }
      thumbCount =
        totalFrames > BARCODE_MAX_FRAMES ? BARCODE_MAX_FRAMES : totalFrames;
      thumbWidth = 1;
      thumbHeight = BARCODE_HEIGHT;
    } else {
      thumbCount = 60;
      thumbWidth = 64;
      thumbHeight = 36;
    }

    void logEvent(`video:strip:start mode=${mode} count=${thumbCount}`);
    const requestPath = videoSelection.path;
    const isStale = () =>
      !ownsSelection(selection) ||
      videoStripId !== stripId ||
      videoSelection?.path !== requestPath;
    extractVideoStrip({
      path: requestPath,
      stripId,
      duration: videoDuration,
      thumbCount,
      thumbWidth,
      thumbHeight,
      stripMode: mode,
    })
      .then((response) => {
        if (isStale()) {
          void logEvent(`video:strip:stale mode=${mode} path=${requestPath}`);
          return;
        }
        videoStripPath = response.path;
        videoStripUrl = assetUrl(response.path);
        pushVideoState();
        saveToCache();
        void logEvent(`video:strip:done mode=${mode}`);
      })
      .catch((error) => {
        if (isStale()) return;
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`video:strip:error message=${message}`);
      })
      .finally(() => {
        if (!isStale()) videoStripPending = false;
      });
  }

  function regenerateStrip() {
    if (disposed || !videoSelection?.path || videoDuration <= 0) return;
    videoStripPath = null;
    videoStripUrl = null;
    videoStripId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    videoStripPending = false;
    scheduleVideoStripGeneration();
  }

  async function runVideoFrameDecode(
    requestPath: string,
    requestName: string,
    requestTime: number,
    frameId: string,
    maxDimension: number,
    token: number,
    decodeCid: string | null,
    selection: SelectionAuthority
  ) {
    if (
      !ownsSelection(selection) ||
      videoSelection?.path !== requestPath ||
      token !== videoDecodeToken
    ) {
      devlog('video:frameDecode:stale', 'Stale token — skipping', {
        expectedToken: token,
        currentToken: videoDecodeToken,
      });
      if (ownsSelection(selection) && token === videoDecodeToken)
        frameDecoding = false;
      return;
    }
    devlog('video:frameDecode:exec', 'Execute frame decode', {
      frameId,
      token,
      cid: decodeCid,
    });
    try {
      void logEvent(
        `video:frame:start t=${requestTime.toFixed(2)} max=${maxDimension}`
      );
      const response = await extractVideoFrame({
        path: requestPath,
        frameId,
        timestamp: requestTime,
        maxDimension,
      });
      if (!ownsSelection(selection) || token !== videoDecodeToken) {
        devlog('video:frameDecode:stale', 'Stale after extract', {
          expectedToken: token,
          currentToken: videoDecodeToken,
        });
        return;
      }
      const framePath = response.path;
      if (!framePath) return;
      deps.cancelPending();
      deps.clearLastRequestKey();
      const previewUrl = assetUrl(framePath);
      const dataset = { width: 0, height: 0, pixels: new Uint8Array(0) };
      const entry: ImageEntry = {
        id: frameId,
        name: requestName,
        path: framePath,
        videoPath: requestPath,
        frameTimestamp: requestTime,
        size: 0,
        source: { kind: 'path', path: framePath },
        previewUrl,
      };
      if (!deps.setFile(entry, dataset, { selection })) return;
      if (!ownsSelection(selection) || token !== videoDecodeToken) return;
      videoFrameId = entry.id;
      setActivePath(framePath);
      videoPosterUrl = previewUrl;
      videoPosterPath = framePath;
      settledFrame =
        Number.isSafeInteger(entry.contentRevision) &&
        (entry.contentRevision ?? 0) > 0
          ? {
              selectionEpoch: selection.epoch,
              imageId: entry.id,
              contentRevision: entry.contentRevision!,
              outputPath: framePath,
              videoPath: requestPath,
              requestedTime: requestTime,
              maxDimension,
            }
          : null;
      reusedFrameKey = settledFrame
        ? `${selection.epoch}\u0000${entry.id}\u0000${entry.contentRevision}\u0000${maxDimension}`
        : null;
      deps.scheduleAnalysisWith({ ...entry, dataset }, deps.getCurrentParams());
      pushVideoState();
      saveToCache(); // capture posterPath so cache restores show hasPoster=true
      devlog('video:frameDecode:done', 'Frame decode done', {
        frameId,
        framePath,
        cid: decodeCid,
        ...videoResourceSnapshot(),
      });
      void logEvent(
        `video:frame:done t_req=${requestTime.toFixed(4)} t_ffmpeg=${response.timestampUsed}`
      );
    } catch (error) {
      if (!ownsSelection(selection) || token !== videoDecodeToken) return;
      console.error('[home] Video frame decode failed', error);
      const message = error instanceof Error ? error.message : String(error);
      void logEvent(`video:frame:error message=${message}`);
      deps.setBannerMessage(
        'Failed to decode video frame. Please try another file.'
      );
    } finally {
      if (ownsSelection(selection) && token === videoDecodeToken) {
        frameDecoding = false;
        pendingFrameRequestKey = null;
      }
    }
  }

  function scheduleVideoFrameDecode() {
    if (
      disposed ||
      videoScrubbing ||
      !videoSelection?.path ||
      !ownsSelection(videoSelectionAuthority)
    )
      return;
    if (!deps.isNativeModeActive()) {
      deps.setBannerMessage('Video analysis requires the desktop app.');
      return;
    }
    const requestPath = videoSelection.path;
    const requestName = videoSelection.name;
    const requestTime = videoCurrentTime;
    const quality = deps.getQuality();
    const maxDimension = deps.maxDimensionForQuality(quality);
    if (reuseSettledFrame(maxDimension)) return;
    const selection = videoSelectionAuthority!;
    const requestKey = frameRequestKey(
      selection,
      requestPath,
      requestTime,
      maxDimension
    );
    if (pendingFrameRequestKey === requestKey) return;
    if (videoDecodeTimer) clearTimeout(videoDecodeTimer);
    const wasNull = videoFrameId === null;
    const frameId =
      videoFrameId ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;
    videoFrameId = frameId;
    const token = ++videoDecodeToken;
    const decodeCid = _currentLoadCid;
    pendingFrameRequestKey = requestKey;
    devlog('video:frameDecode:schedule', 'Schedule frame decode', {
      frameId,
      wasNull,
      cid: decodeCid,
      token,
    });
    frameDecoding = true;
    videoDecodeTimer = setTimeout(() => {
      videoDecodeTimer = null;
      const previous = videoDecodeQueues.get(frameId) ?? Promise.resolve();
      const queued = previous
        .catch(() => undefined)
        .then(() =>
          runVideoFrameDecode(
            requestPath,
            requestName,
            requestTime,
            frameId,
            maxDimension,
            token,
            decodeCid,
            selection
          )
        );
      videoDecodeQueues.set(frameId, queued);
      void queued.then(
        () => {
          if (videoDecodeQueues.get(frameId) === queued)
            videoDecodeQueues.delete(frameId);
        },
        () => {
          if (videoDecodeQueues.get(frameId) === queued)
            videoDecodeQueues.delete(frameId);
        }
      );
    }, 250);
  }

  async function probeVideoDuration(
    path: string,
    selection: SelectionAuthority
  ) {
    if (!ownsSelection(selection)) return;
    videoProbePending = true;
    try {
      const response = await probeVideo(path);
      if (!ownsSelection(selection) || videoSelection?.path !== path) {
        void logEvent(`video:probe:stale path=${path}`);
        return;
      }
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
      scheduleVideoFrameDecode();
      pushVideoState();
      saveToCache();
      if (videoElement) {
        videoElement.currentTime = videoCurrentTime;
      }
    } catch (error) {
      if (!ownsSelection(selection)) return;
      const message = error instanceof Error ? error.message : String(error);
      void logEvent(`video:probe:error message=${message}`);
    } finally {
      if (ownsSelection(selection) && videoSelection?.path === path)
        videoProbePending = false;
    }
  }

  function loadVideoSelection(
    selection: FileSelection,
    existingId?: string,
    cid?: string,
    capturedSelection?: SelectionAuthority
  ) {
    if (disposed) return;
    const selectionAuthority =
      capturedSelection ?? deps.beginSelection(existingId ?? null);
    if (!deps.isCurrentSelection(selectionAuthority)) return;
    const loadCid = cid ?? devlog.cid();
    const nativeMode = deps.isNativeModeActive() && !!selection.path;
    devlog('video:load', 'Starting video load', {
      path: selection.path ?? null,
      existingId: existingId ?? null,
      cid: loadCid,
      ...videoResourceSnapshot(),
    });
    if (!nativeMode || !selection.path) {
      deps.setBannerMessage('Video analysis requires the desktop app.');
      return;
    }

    // Check session cache before probing
    const cached = selection.path
      ? deps.getCachedVideoState(selection.path)
      : null;
    if (cached) {
      devlog('video:load:cacheHit', 'Restoring from session cache', {
        path: selection.path,
        cid: loadCid,
        duration: cached.duration,
        hasStrip: cached.stripPath !== null,
      });
      saveToCache(true); // accepted transition snapshots the outgoing video
      resetVideoState();
      videoSelectionAuthority = selectionAuthority;
      _currentLoadCid = loadCid;
      videoSelection = selection;
      videoSrcUrl = deps.buildPreviewUrl(selection, nativeMode);
      videoDuration = cached.duration;
      videoCurrentTime = cached.currentTime;
      _pendingSeekTime = cached.currentTime > 0 ? cached.currentTime : null;
      videoFps = cached.fps;
      videoFrameId = existingId ?? cached.frameId;
      videoStripId =
        cached.stripId ??
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random()}`;
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
      scheduleVideoFrameDecode();
      return;
    }

    saveToCache(true); // accepted transition snapshots the outgoing video
    resetVideoState();
    videoSelectionAuthority = selectionAuthority;
    _currentLoadCid = loadCid;
    videoSelection = selection;
    videoSrcUrl = deps.buildPreviewUrl(selection, nativeMode);
    videoDuration = 0;
    videoCurrentTime = 0;
    videoFps = null;
    const reusedFrameId = !!existingId;
    videoFrameId =
      existingId ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;
    videoStripId =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    devlog('video:load:ids', 'Assigned IDs', {
      frameId: videoFrameId,
      stripId: videoStripId,
      reusedFrameId,
      cid: loadCid,
    });
    pushVideoState();
    void probeVideoDuration(selection.path, selectionAuthority);
  }

  function restoreVideoSelection(state: VideoState) {
    if (disposed || !state.path || !deps.isCurrentSelection(state.selection))
      return;
    restoringVideoState = true;
    resetVideoState();
    videoSelectionAuthority = state.selection;
    videoSelection = buildVideoSelectionFromState(state);
    videoSrcUrl = deps.buildPreviewUrl(videoSelection, true);
    videoDuration = state.duration ?? 0;
    videoFps = state.fps ?? null;
    videoCurrentTime = state.currentTime ?? 0;
    settledFrame = state.settledFrame;
    _pendingSeekTime = videoCurrentTime > 0 ? videoCurrentTime : null;
    const selected = deps.getSelectedFile();
    videoFrameId =
      state.settledFrame?.imageId ??
      state.selection.mediaId ??
      (selected?.videoPath === state.path ? selected.id : null) ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;
    videoStripId =
      state.stripId ??
      globalThis.crypto?.randomUUID?.() ??
      `${Date.now()}-${Math.random()}`;
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
      void probeVideoDuration(videoSelection.path, state.selection);
    } else {
      if (!videoStripPath && videoDuration > 0) {
        scheduleVideoStripGeneration();
      }
      scheduleVideoFrameDecode();
    }
  }

  function clearVideoSelection() {
    if (disposed) return;
    saveToCache();
    resetVideoState();
    pushVideoState();
  }

  function stepVideoFrames(step: number) {
    if (disposed || videoDuration <= 0) return;
    deps.captureAnalysisScroll();
    const fps = videoFps && videoFps > 0 ? videoFps : 24;
    const delta = step / fps;
    const next = Math.min(Math.max(videoCurrentTime + delta, 0), videoDuration);
    videoCurrentTime = next;
    if (videoElement) {
      videoElement.currentTime = next;
    }
    pushVideoState();
    scheduleVideoFrameDecode();
  }

  function handleVideoScrubStart() {
    if (disposed) return;
    videoScrubbing = true;
    deps.captureAnalysisScroll();
  }

  function handleVideoMetadata() {
    if (disposed || !videoElement) return;
    const duration = videoElement.duration;
    if (Number.isFinite(duration) && duration > 0) {
      videoDuration = duration;
    } else if (videoElement.seekable.length > 0) {
      const seekEnd = videoElement.seekable.end(0);
      if (Number.isFinite(seekEnd) && seekEnd > 0) {
        videoDuration = seekEnd;
      }
    }
    const seekTarget =
      _pendingSeekTime ?? (videoCurrentTime > 0 ? videoCurrentTime : null);
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
      willStartFrame: !videoPosterPath,
    });
    void logEvent(`video:metadata duration=${videoDuration.toFixed(2)}`);
    if (!videoStripPath && videoDuration > 0) {
      scheduleVideoStripGeneration();
    }
    scheduleVideoFrameDecode();
  }

  function handleVideoSeeked() {
    if (disposed || !videoElement || videoScrubbing) return;
    if (_pendingSeekTime !== null) return;
    videoCurrentTime = videoElement.currentTime;
    pushVideoState();
  }

  function handleVideoLoadedData() {
    if (disposed || !videoElement) return;
    const seekTarget =
      _pendingSeekTime ?? (videoCurrentTime > 0 ? videoCurrentTime : null);
    if (
      seekTarget !== null &&
      Math.abs(videoElement.currentTime - seekTarget) > 0.01
    ) {
      videoElement.currentTime = seekTarget;
      videoCurrentTime = seekTarget;
    }
    _pendingSeekTime = null;
    const support = videoElement.canPlayType(
      'video/mp4; codecs="avc1.64001f, mp4a.40.2"'
    );
    devlog('video:loadedData', 'Video loaded data', {
      readyState: videoElement.readyState,
    });
    void logEvent(
      `video:loadeddata ready=${videoElement.readyState} support=${support || 'unknown'}`
    );
  }

  function handleVideoError() {
    if (disposed) return;
    const error = videoElement?.error;
    const code = error?.code ?? 'unknown';
    const message = error?.message ?? 'unknown';
    devlog.error('video:error', 'Video error', { code, message });
    void logEvent(
      `video:load:error code=${code} message=${message} src=${videoSrcUrl ?? 'none'}`
    );
  }

  function handleStripSeek(event: PointerEvent) {
    if (disposed || videoDuration <= 0) return;
    deps.captureAnalysisScroll();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const ratio = Math.min(
      Math.max((event.clientX - rect.left) / rect.width, 0),
      1
    );
    const nextTime = ratio * videoDuration;
    videoCurrentTime = nextTime;
    if (videoElement) {
      videoElement.currentTime = nextTime;
    }
    pushVideoState();
    scheduleVideoFrameDecode();
  }

  function handleVideoScrubInput(event: Event) {
    if (disposed) return;
    const nextTime = Number((event.target as HTMLInputElement).value);
    videoCurrentTime = nextTime;
    if (videoElement) {
      videoElement.currentTime = nextTime;
    }
    pushVideoState();
  }

  function handleVideoScrubEnd() {
    if (disposed) return;
    videoScrubbing = false;
    pushVideoState();
    scheduleVideoFrameDecode();
  }

  function setVideoElementRef(el: HTMLVideoElement | null) {
    if (disposed) return;
    videoElement = el;
  }

  function handleVideoStateChange(state: VideoState | null) {
    if (disposed || restoringVideoState) return;
    devlog('video:stateChange', 'Video state change', {
      hasState: state !== null,
      isRestoring: restoringVideoState,
      currentPath: videoSelection?.path ?? null,
    });
    if (!state) {
      if (videoSelection) {
        resetVideoState();
      }
      return;
    }
    if (!deps.isCurrentSelection(state.selection)) return;
    if (
      videoSelection?.path === state.path &&
      videoSelectionAuthority?.epoch === state.selection.epoch
    ) {
      const requestedChanged = videoCurrentTime !== state.currentTime;
      videoDuration = state.duration;
      videoFps = state.fps;
      videoCurrentTime = state.currentTime;
      settledFrame = state.settledFrame;
      if (state.stripPath && state.stripPath !== videoStripPath) {
        videoStripPath = state.stripPath;
        videoStripUrl = assetUrl(state.stripPath);
      }
      if (state.posterPath && state.posterPath !== videoPosterPath) {
        videoPosterPath = state.posterPath;
        videoPosterUrl = assetUrl(state.posterPath);
      }
      if (requestedChanged && !videoScrubbing) scheduleVideoFrameDecode();
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
    if (disposed) return;
    const el = videoElement;
    const src = videoSrcUrl;
    devlog('video:srcEffect', 'Src effect (debounced)', {
      hasElement: el !== null,
      hasSrc: src !== null,
    });
    if (_loadSrcTimer) {
      clearTimeout(_loadSrcTimer);
      _loadSrcTimer = null;
    }
    if (el && src) {
      const selection = videoSelectionAuthority;
      _loadSrcTimer = setTimeout(() => {
        _loadSrcTimer = null;
        // Re-read latest state inside callback to act on final URL
        const currentEl = videoElement;
        const currentSrc = videoSrcUrl;
        if (ownsSelection(selection) && currentEl && currentSrc) {
          devlog('video:srcEffect:load', 'Calling el.load()', {
            src: currentSrc.startsWith('blob:') ? 'blob' : 'asset',
          });
          currentEl.load();
        }
      }, 100);
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelLocalFrameRequest();
    videoProbePending = false;
    videoStripPending = false;
    videoStripId = null;
    videoDecodeQueues.clear();
    if (_loadSrcTimer) {
      clearTimeout(_loadSrcTimer);
      _loadSrcTimer = null;
    }
    if (videoElement) videoElement.pause();
    videoElement = null;
    if (videoSrcUrl?.startsWith('blob:')) URL.revokeObjectURL(videoSrcUrl);
    videoSrcUrl = null;
    videoPosterUrl = null;
    videoStripUrl = null;
    _pendingSeekTime = null;
  }

  return {
    get selection() {
      return videoSelectionAuthority;
    },
    get videoSelection() {
      return videoSelection;
    },
    get videoSrcUrl() {
      return videoSrcUrl;
    },
    get videoDuration() {
      return videoDuration;
    },
    get videoCurrentTime() {
      return videoCurrentTime;
    },
    set videoCurrentTime(v: number) {
      videoCurrentTime = v;
    },
    get videoAspectRatio() {
      return videoAspectRatio;
    },
    get videoFps() {
      return videoFps ?? 0;
    },
    get videoProbePending() {
      return videoProbePending;
    },
    get videoStripUrl() {
      return videoStripUrl;
    },
    get videoStripPending() {
      return videoStripPending;
    },
    get videoDisplayUrl() {
      return videoPosterUrl ?? null;
    },
    get videoPosterPath() {
      if (
        !ownsSelection(videoSelectionAuthority) ||
        frameDecoding ||
        videoScrubbing ||
        pendingFrameRequestKey !== null
      )
        return null;
      const maxDimension = deps.maxDimensionForQuality(deps.getQuality());
      const file = deps.getSelectedFile();
      return matchesSettledVideoFrame(
        currentVideoState(),
        videoSelectionAuthority,
        file,
        maxDimension
      )
        ? file.path
        : null;
    },
    get videoScrubbing() {
      return videoScrubbing;
    },
    get frameDecoding() {
      return frameDecoding;
    },
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
    ensureSettledFrame: scheduleVideoFrameDecode,
    dispose,
  };
}
