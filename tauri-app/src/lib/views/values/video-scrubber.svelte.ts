import { convertFileSrc } from '@tauri-apps/api/core';
import type {
  ImageEntry,
  SelectedImage,
  SettledVideoFrame,
  VideoState,
  SelectionAuthority,
} from '../../stores/ui';
import { matchesSettledVideoFrame } from '../../stores/video';
import { extractVideoFrame } from '../../bridges/video';
import { inferMimeType } from '../../bridges/fs';
import { logEvent } from '../../bridges/log';
import { formatTime } from '../../utils/time';

export interface VideoScrubberDeps {
  getMaxDimension: () => number;
  onFrameExtracted: (
    framePath: string,
    frameId: string,
    timestamp: number,
    videoPath: string,
    videoName: string,
    selection: SelectionAuthority
  ) => SelectedImage | null;
  getSelectedFile: () => SelectedImage | null;
  onFrameAccepted?: (file: SelectedImage) => void;
  onFrameReused?: (file: SelectedImage) => void;
  publishRequestedTime: (currentTime: number) => void;
  publishSettledFrame: (settledFrame: SettledVideoFrame) => void;
  captureScroll?: () => void;
  cacheVideoState?: (
    videoPath: string,
    currentTime: number,
    posterPath: string
  ) => void;
  isCurrentSelection: (selection: SelectionAuthority) => boolean;
}

export function settledFrameSnapshotRequest(
  state: VideoState | null,
  file: ImageEntry | null,
  maxDimension: number,
  decodePending: boolean,
  currentSelection: boolean
) {
  if (
    decodePending ||
    !currentSelection ||
    !matchesSettledVideoFrame(
      state,
      state?.selection ?? null,
      file,
      maxDimension
    )
  )
    return null;
  return {
    framePath: state.settledFrame.outputPath,
    name: file.name,
    timestamp: state.settledFrame.requestedTime,
  };
}

export function createVideoScrubber(deps: VideoScrubberDeps) {
  let currentTime = $state(0);
  let duration = $state(0);
  let fps: number | null = $state(null);
  let videoPath: string | null = $state(null);
  let videoName: string | null = $state(null);
  let scrubbing = $state(false);
  let extracting = $state(false);
  let videoElement: HTMLVideoElement | null = $state(null);
  let frameId: string | null = null;
  let selection: SelectionAuthority | null = null;
  let state: VideoState | null = null;
  let decodeToken = 0;
  let decodeTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingRequestKey: string | null = null;
  let reusedSettlementKey: string | null = null;
  let disposed = false;

  const isVideo = $derived(videoPath !== null && duration > 0);
  const videoSrcUrl = $derived(videoPath ? convertFileSrc(videoPath) : null);
  const mimeType = $derived(videoName ? inferMimeType(videoName) : null);

  function syncFromVideoState(vs: VideoState | null) {
    if (disposed) return;
    const nextPath = vs?.path ?? null;
    const nextEpoch = vs?.selection.epoch ?? null;
    if (nextPath !== videoPath || nextEpoch !== selection?.epoch) {
      decodeToken += 1;
      extracting = false;
      frameId = null;
      pendingRequestKey = null;
      reusedSettlementKey = null;
      if (decodeTimer) {
        clearTimeout(decodeTimer);
        decodeTimer = null;
      }
    }
    if (!vs) {
      state = null;
      selection = null;
      videoPath = null;
      videoName = null;
      duration = 0;
      fps = null;
      currentTime = 0;
      frameId = null;
      return;
    }
    state = vs;
    selection = vs.selection;
    videoPath = vs.path;
    videoName = vs.name;
    duration = vs.duration;
    fps = vs.fps;
    currentTime = vs.currentTime;
    if (videoElement && currentTime > 0) {
      videoElement.currentTime = currentTime;
    }
  }

  function requestKey(
    requestSelection: SelectionAuthority,
    requestPath: string,
    requestTime: number,
    maxDimension: number
  ) {
    return `${requestSelection.epoch}\u0000${requestPath}\u0000${requestTime}\u0000${maxDimension}`;
  }

  function cancelLocalDecode() {
    decodeToken += 1;
    extracting = false;
    pendingRequestKey = null;
    if (decodeTimer) {
      clearTimeout(decodeTimer);
      decodeTimer = null;
    }
  }

  function reconcileSettledFrame() {
    if (disposed || !state || !selection || !deps.isCurrentSelection(selection))
      return;
    const maxDimension = deps.getMaxDimension();
    const file = deps.getSelectedFile();
    if (matchesSettledVideoFrame(state, selection, file, maxDimension)) {
      cancelLocalDecode();
      frameId = file.id;
      const key = `${selection.epoch}\u0000${file.id}\u0000${file.contentRevision}\u0000${maxDimension}`;
      if (reusedSettlementKey !== key) {
        reusedSettlementKey = key;
        deps.onFrameReused?.(file);
      }
      return;
    }
    reusedSettlementKey = null;
    if (!scrubbing) scheduleFrameExtract();
  }

  function scheduleFrameExtract() {
    if (
      disposed ||
      !videoPath ||
      !selection ||
      !deps.isCurrentSelection(selection)
    )
      return;
    const requestPath = videoPath;
    const requestName = videoName ?? requestPath;
    const requestTime = currentTime;
    const fid =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    frameId = fid;
    const maxDimension = deps.getMaxDimension();
    const requestSelection = selection;
    if (
      matchesSettledVideoFrame(
        state,
        requestSelection,
        deps.getSelectedFile(),
        maxDimension
      )
    ) {
      reconcileSettledFrame();
      return;
    }
    const nextRequestKey = requestKey(
      requestSelection,
      requestPath,
      requestTime,
      maxDimension
    );
    if (pendingRequestKey === nextRequestKey) return;
    if (decodeTimer) clearTimeout(decodeTimer);
    const token = ++decodeToken;
    pendingRequestKey = nextRequestKey;
    extracting = true;

    decodeTimer = setTimeout(async () => {
      decodeTimer = null;
      if (token !== decodeToken || !deps.isCurrentSelection(requestSelection))
        return;
      try {
        void logEvent(
          `values:video:frame:start t=${requestTime.toFixed(2)} max=${maxDimension}`
        );
        const response = await extractVideoFrame({
          path: requestPath,
          frameId: fid,
          timestamp: requestTime,
          maxDimension,
        });
        if (token !== decodeToken || !deps.isCurrentSelection(requestSelection))
          return;
        const framePath = response.path;
        if (!framePath) return;
        void logEvent(
          `values:video:frame:done t_req=${requestTime.toFixed(4)} t_ffmpeg=${response.timestampUsed}`
        );
        const acceptedFile = deps.onFrameExtracted(
          framePath,
          fid,
          requestTime,
          requestPath,
          requestName,
          requestSelection
        );
        if (
          disposed ||
          !acceptedFile ||
          !deps.isCurrentSelection(requestSelection) ||
          token !== decodeToken ||
          acceptedFile.path !== framePath ||
          acceptedFile.videoPath !== requestPath ||
          acceptedFile.frameTimestamp !== requestTime ||
          !Number.isSafeInteger(acceptedFile.contentRevision)
        )
          return;
        const settledFrame: SettledVideoFrame = {
          selectionEpoch: requestSelection.epoch,
          imageId: acceptedFile.id,
          contentRevision: acceptedFile.contentRevision!,
          outputPath: framePath,
          videoPath: requestPath,
          requestedTime: requestTime,
          maxDimension,
        };
        frameId = acceptedFile.id;
        reusedSettlementKey = `${requestSelection.epoch}\u0000${acceptedFile.id}\u0000${acceptedFile.contentRevision}\u0000${maxDimension}`;
        if (state?.selection.epoch === requestSelection.epoch) {
          state = {
            ...state,
            currentTime: requestTime,
            posterPath: framePath,
            settledFrame,
          };
        }
        deps.onFrameAccepted?.(acceptedFile);
        deps.publishSettledFrame(settledFrame);
        deps.cacheVideoState?.(requestPath, requestTime, framePath);
      } catch (error) {
        if (token !== decodeToken || !deps.isCurrentSelection(requestSelection))
          return;
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`values:video:frame:error message=${message}`);
        console.error('[values] Video frame decode failed', error);
      } finally {
        if (
          !disposed &&
          token === decodeToken &&
          deps.isCurrentSelection(requestSelection)
        ) {
          extracting = false;
          pendingRequestKey = null;
        }
      }
    }, 250);
  }

  function handleScrubStart() {
    if (disposed) return;
    scrubbing = true;
    deps.captureScroll?.();
  }

  function handleScrubEnd() {
    if (disposed) return;
    scrubbing = false;
    scheduleFrameExtract();
  }

  function handleScrubInput(event: Event) {
    if (disposed) return;
    currentTime = Number((event.target as HTMLInputElement).value);
    if (videoElement) videoElement.currentTime = currentTime;
    if (state) state = { ...state, currentTime };
    deps.publishRequestedTime(currentTime);
  }

  function stepFrames(count: number) {
    if (disposed || duration <= 0) return;
    deps.captureScroll?.();
    const effectiveFps = fps && fps > 0 ? fps : 24;
    const delta = count / effectiveFps;
    currentTime = Math.min(Math.max(currentTime + delta, 0), duration);
    if (videoElement) videoElement.currentTime = currentTime;
    if (state) state = { ...state, currentTime };
    deps.publishRequestedTime(currentTime);
    scheduleFrameExtract();
  }

  function setVideoElementRef(el: HTMLVideoElement | null) {
    if (disposed) return;
    videoElement = el;
  }

  function destroy() {
    if (disposed) return;
    disposed = true;
    cancelLocalDecode();
    scrubbing = false;
    videoElement = null;
    state = null;
    selection = null;
  }

  return {
    get isVideo() {
      return isVideo;
    },
    get currentTime() {
      return currentTime;
    },
    set currentTime(v: number) {
      currentTime = v;
    },
    get duration() {
      return duration;
    },
    get fps() {
      return fps;
    },
    get scrubbing() {
      return scrubbing;
    },
    get extracting() {
      return extracting;
    },
    get videoSrcUrl() {
      return videoSrcUrl;
    },
    get mimeType() {
      return mimeType;
    },
    setVideoElementRef,
    syncFromVideoState,
    scheduleFrameExtract,
    reconcileSettledFrame,
    handleScrubStart,
    handleScrubEnd,
    handleScrubInput,
    stepFrames,
    formatTime,
    destroy,
  };
}
