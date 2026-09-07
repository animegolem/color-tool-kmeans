import { convertFileSrc } from '@tauri-apps/api/core';
import type {
  ImageEntry,
  VideoState,
  SelectionAuthority,
} from '../../stores/ui';
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
  ) => boolean;
  updateVideoState: (currentTime: number, posterPath: string) => void;
  captureScroll?: () => void;
  cacheVideoState?: (
    videoPath: string,
    currentTime: number,
    posterPath: string
  ) => void;
  isCurrentSelection: (selection: SelectionAuthority) => boolean;
}

export function settledFrameSnapshotRequest(
  file: Pick<ImageEntry, 'path' | 'name' | 'frameTimestamp'> | null,
  decodePending: boolean
) {
  if (decodePending || !file?.path || file.frameTimestamp == null) return null;
  return {
    framePath: file.path,
    name: file.name,
    timestamp: file.frameTimestamp,
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
  let decodeToken = 0;
  let decodeTimer: ReturnType<typeof setTimeout> | null = null;

  const isVideo = $derived(videoPath !== null && duration > 0);
  const videoSrcUrl = $derived(videoPath ? convertFileSrc(videoPath) : null);
  const mimeType = $derived(videoName ? inferMimeType(videoName) : null);

  function syncFromVideoState(vs: VideoState | null) {
    const nextPath = vs?.path ?? null;
    const nextEpoch = vs?.selection.epoch ?? null;
    if (nextPath !== videoPath || nextEpoch !== selection?.epoch) {
      decodeToken += 1;
      extracting = false;
      frameId = null;
      if (decodeTimer) {
        clearTimeout(decodeTimer);
        decodeTimer = null;
      }
    }
    if (!vs) {
      selection = null;
      videoPath = null;
      videoName = null;
      duration = 0;
      fps = null;
      currentTime = 0;
      frameId = null;
      return;
    }
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

  function scheduleFrameExtract() {
    if (!videoPath || !selection || !deps.isCurrentSelection(selection)) return;
    if (decodeTimer) clearTimeout(decodeTimer);
    const requestPath = videoPath;
    const requestName = videoName ?? requestPath;
    const requestTime = currentTime;
    const fid =
      globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    frameId = fid;
    const maxDimension = deps.getMaxDimension();
    const token = ++decodeToken;
    const requestSelection = selection;
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
        const accepted = deps.onFrameExtracted(
          framePath,
          fid,
          requestTime,
          requestPath,
          requestName,
          requestSelection
        );
        if (!accepted || !deps.isCurrentSelection(requestSelection)) return;
        deps.updateVideoState(requestTime, framePath);
        deps.cacheVideoState?.(requestPath, requestTime, framePath);
      } catch (error) {
        if (token !== decodeToken || !deps.isCurrentSelection(requestSelection))
          return;
        const message = error instanceof Error ? error.message : String(error);
        void logEvent(`values:video:frame:error message=${message}`);
        console.error('[values] Video frame decode failed', error);
      } finally {
        if (
          token === decodeToken &&
          deps.isCurrentSelection(requestSelection)
        ) {
          extracting = false;
        }
      }
    }, 250);
  }

  function handleScrubStart() {
    scrubbing = true;
    deps.captureScroll?.();
  }

  function handleScrubEnd() {
    scrubbing = false;
    scheduleFrameExtract();
  }

  function handleScrubInput(event: Event) {
    currentTime = Number((event.target as HTMLInputElement).value);
    if (videoElement) videoElement.currentTime = currentTime;
  }

  function stepFrames(count: number) {
    if (duration <= 0) return;
    deps.captureScroll?.();
    const effectiveFps = fps && fps > 0 ? fps : 24;
    const delta = count / effectiveFps;
    currentTime = Math.min(Math.max(currentTime + delta, 0), duration);
    if (videoElement) videoElement.currentTime = currentTime;
    scheduleFrameExtract();
  }

  function setVideoElementRef(el: HTMLVideoElement | null) {
    videoElement = el;
  }

  function destroy() {
    decodeToken += 1;
    extracting = false;
    if (decodeTimer) {
      clearTimeout(decodeTimer);
      decodeTimer = null;
    }
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
    handleScrubStart,
    handleScrubEnd,
    handleScrubInput,
    stepFrames,
    formatTime,
    destroy,
  };
}
