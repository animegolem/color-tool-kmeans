<script lang="ts">
  import type { createVideoController } from './video-controller.svelte';
  import SnapshotButton from '../../components/SnapshotButton.svelte';
  import { snapshotCurrentFrame } from '../../services/frame-snapshot';

  interface Props {
    video: ReturnType<typeof createVideoController>;
    onZoom?: () => void;
  }

  let { video, onZoom }: Props = $props();

  let videoEl = $state<HTMLVideoElement | null>(null);

  $effect(() => {
    video.setVideoElementRef(videoEl);
  });

  function captureFrame() {
    const framePath = video.videoPosterPath;
    if (!framePath) return;
    void snapshotCurrentFrame({
      framePath,
      name: video.videoSelection?.name ?? 'frame',
      timestamp: video.videoCurrentTime,
    });
  }
</script>

<div class="media-panel">
  <div class="image-preview">
    {#if video.videoSrcUrl}
      <div
        class="video-frame"
        class:zoomable={!!onZoom && !!video.videoDisplayUrl}
        class:decoding={video.frameDecoding}
        role={onZoom && video.videoDisplayUrl ? 'button' : undefined}
        tabindex={onZoom && video.videoDisplayUrl ? 0 : undefined}
        onclick={onZoom && video.videoDisplayUrl ? onZoom : undefined}
        onkeydown={onZoom && video.videoDisplayUrl
          ? (event: KeyboardEvent) => {
              if (event.key !== 'Enter' && event.key !== ' ') return;
              event.preventDefault();
              onZoom!();
            }
          : undefined}
        style={video.videoAspectRatio
          ? `aspect-ratio: ${video.videoAspectRatio}`
          : undefined}
      >
        <SnapshotButton
          onCapture={captureFrame}
          disabled={video.frameDecoding || !video.videoPosterPath}
        />
        <video
          bind:this={videoEl}
          poster={video.videoDisplayUrl ?? undefined}
          muted
          playsinline
          preload="auto"
          onloadedmetadata={video.handleVideoMetadata}
          onloadeddata={video.handleVideoLoadedData}
          onseeked={video.handleVideoSeeked}
          ontimeupdate={video.handleVideoTimeUpdate}
          onended={video.handleVideoEnded}
          onerror={video.handleVideoError}
        >
          <source
            src={video.videoSrcUrl}
            type={video.videoSelection?.mimeType ?? 'video/mp4'}
          />
        </video>
        {#if video.videoDisplayUrl}
          <!-- Settled-frame overlay: the exact ffmpeg-extracted frame analysis used.
               Reactive <img> (can't go dormant like the <video>), so the displayed
               frame and the analyzed frame stay in lockstep. Transparent during an
               active drag / pending decode so the live <video> shows through. -->
          <img
            class="settled-frame"
            src={video.videoDisplayUrl}
            alt=""
            style:opacity={video.videoPlaying ||
            video.videoScrubbing ||
            video.frameDecoding
              ? 0
              : 1}
          />
        {/if}
      </div>
    {:else}
      <div class="preview-placeholder">Loading video frame…</div>
    {/if}
  </div>
  <div class="video-controls">
    <div class="step-group">
      <button
        type="button"
        class="step-btn play-btn"
        title={video.videoPlaying
          ? 'Pause live analysis'
          : 'Play with live analysis'}
        aria-label={video.videoPlaying
          ? 'Pause live analysis'
          : 'Play with live analysis'}
        disabled={video.liveStarting || video.frameDecoding}
        onclick={video.toggleVideoPlayback}
        >{video.liveStarting
          ? 'Starting…'
          : video.videoPlaying
            ? 'Pause'
            : 'Play'}</button
      >
      <button
        type="button"
        class="step-btn"
        title="Back 10 frames"
        disabled={video.frameDecoding || video.videoPlaying}
        onclick={() => video.stepVideoFrames(-10)}>◀◀</button
      >
      <button
        type="button"
        class="step-btn"
        title="Back 1 frame"
        disabled={video.frameDecoding || video.videoPlaying}
        onclick={() => video.stepVideoFrames(-1)}>◀</button
      >
    </div>
    <input
      class="video-scrub"
      type="range"
      min="0"
      max={video.videoDuration > 0 ? video.videoDuration : 1}
      step="0.01"
      bind:value={video.videoCurrentTime}
      onpointerdown={video.handleVideoScrubStart}
      onpointerup={video.handleVideoScrubEnd}
      onpointercancel={video.handleVideoScrubEnd}
      oninput={video.handleVideoScrubInput}
      disabled={video.videoDuration <= 0}
      aria-label="Video timeline"
      title="Scrub through video timeline"
    />
    <div class="step-group step-group--right">
      <button
        type="button"
        class="step-btn"
        title="Forward 1 frame"
        disabled={video.frameDecoding || video.videoPlaying}
        onclick={() => video.stepVideoFrames(1)}>▶</button
      >
      <button
        type="button"
        class="step-btn"
        title="Forward 10 frames"
        disabled={video.frameDecoding || video.videoPlaying}
        onclick={() => video.stepVideoFrames(10)}>▶▶</button
      >
    </div>
  </div>
  {#if video.videoPlaying}
    <div class="live-metrics" aria-live="polite">
      Live analysis {video.liveEffectiveFps.toFixed(1)} fps
      {#if video.liveDroppedFrames > 0}
        · {video.liveDroppedFrames} dropped
      {/if}
    </div>
  {/if}
  <div class="video-strip">
    {#if video.videoStripUrl}
      <div
        class="video-strip__image"
        style={`background-image: url(${video.videoStripUrl})`}
      ></div>
    {:else if video.videoStripPending}
      <div class="video-strip__placeholder">Building strip…</div>
    {/if}
    <button
      type="button"
      class="video-strip__hit"
      onpointerdown={video.handleStripSeek}
      aria-label="Jump to video position"
    ></button>
    <div
      class="video-strip__indicator"
      style={`left: ${video.videoDuration > 0 ? (video.videoCurrentTime / video.videoDuration) * 100 : 0}%`}
    ></div>
  </div>
</div>

<style>
  .media-panel {
    display: grid;
    gap: 12px;
    padding: 16px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid var(--line);
  }

  .image-preview {
    width: 100%;
    display: grid;
    place-items: center;
  }

  .media-panel .image-preview {
    border-radius: 12px;
    overflow: hidden;
    background: #fff;
  }

  .video-frame {
    position: relative;
    width: 100%;
    display: grid;
    place-items: center;
    background: #fff;
    aspect-ratio: 16 / 9;
    transition: opacity 0.15s ease;
  }

  .video-frame.decoding {
    pointer-events: none;
    cursor: wait;
    opacity: 0.7;
  }

  .media-panel video {
    width: 100%;
    height: auto;
    display: block;
  }

  .settled-frame {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    pointer-events: none;
    transition: opacity 0.1s ease;
  }

  .preview-placeholder {
    padding: 24px;
    color: rgba(33, 33, 32, 0.6);
  }

  .video-controls {
    display: grid;
    grid-template-columns: auto 1fr auto;
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

  .play-btn {
    min-width: 62px;
  }

  .live-metrics {
    color: rgba(33, 33, 32, 0.62);
    font-size: 0.75rem;
    text-align: center;
  }

  .step-btn {
    background: var(--accent);
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 6px 10px;
    min-width: 36px;
    cursor: pointer;
  }

  .step-btn:disabled {
    opacity: 0.4;
    cursor: wait;
  }

  .video-scrub {
    width: 100%;
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
</style>
