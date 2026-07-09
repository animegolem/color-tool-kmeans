<script lang="ts">
  import type { createVideoScrubber } from './video-scrubber.svelte';

  interface Props {
    scrubber: ReturnType<typeof createVideoScrubber>;
  }

  let { scrubber }: Props = $props();
</script>

<div class="video-scrubber">
  <div class="scrub-controls">
    <div class="step-group">
      <button
        type="button"
        class="step-btn"
        title="Back 10 frames"
        disabled={scrubber.duration <= 0 || scrubber.extracting}
        onclick={() => scrubber.stepFrames(-10)}>◀◀</button
      >
      <button
        type="button"
        class="step-btn"
        title="Back 1 frame"
        disabled={scrubber.duration <= 0 || scrubber.extracting}
        onclick={() => scrubber.stepFrames(-1)}>◀</button
      >
    </div>
    <input
      class="video-scrub"
      type="range"
      min="0"
      max={scrubber.duration > 0 ? scrubber.duration : 1}
      step="0.01"
      bind:value={scrubber.currentTime}
      onpointerdown={scrubber.handleScrubStart}
      onpointerup={scrubber.handleScrubEnd}
      onpointercancel={scrubber.handleScrubEnd}
      oninput={scrubber.handleScrubInput}
      disabled={scrubber.duration <= 0}
      aria-label="Video timeline"
      title="Scrub through video timeline"
    />
    <div class="step-group step-group--right">
      <button
        type="button"
        class="step-btn"
        title="Forward 1 frame"
        disabled={scrubber.duration <= 0 || scrubber.extracting}
        onclick={() => scrubber.stepFrames(1)}>▶</button
      >
      <button
        type="button"
        class="step-btn"
        title="Forward 10 frames"
        disabled={scrubber.duration <= 0 || scrubber.extracting}
        onclick={() => scrubber.stepFrames(10)}>▶▶</button
      >
    </div>
  </div>
</div>

<style>
  .scrub-controls {
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
</style>
