<script lang="ts">
  import type { Writable } from 'svelte/store';
  import type { AnalysisParams } from '../../stores/analysis';
  import {
    params as globalParams,
    clusterMax,
    excludeTopMax,
  } from '../../stores/ui';

  interface Props {
    paramsStore?: Writable<AnalysisParams>;
    onScrubStart: (event: PointerEvent) => void;
    onScrubEnd: () => void;
  }

  let {
    paramsStore = globalParams,
    onScrubStart,
    onScrubEnd,
  }: Props = $props();

  const params = $derived(paramsStore);
</script>

<section class="controls">
  <h2>Parameters</h2>
  <div class="grid">
    <label title="Number of color clusters to extract">
      <span>Number of clusters: <strong>{$params.clusters}</strong></span>
      <input
        type="range"
        min="1"
        max={$clusterMax}
        step="1"
        bind:value={$params.clusters}
        onpointerdown={onScrubStart}
        onpointerup={onScrubEnd}
        onpointercancel={onScrubEnd}
        onblur={onScrubEnd}
      />
      <input
        class="number-input"
        type="number"
        min="1"
        max={$clusterMax}
        step="1"
        bind:value={$params.clusters}
      />
    </label>
    <label title="Trade speed for accuracy — higher values sample more pixels">
      <span>Speed ← → Quality: <strong>{$params.quality}</strong></span>
      <input
        type="range"
        min="0"
        max="4"
        step="1"
        bind:value={$params.quality}
        onpointerdown={onScrubStart}
        onpointerup={onScrubEnd}
        onpointercancel={onScrubEnd}
        onblur={onScrubEnd}
      />
    </label>
    <label title="Hide the N largest clusters from the results">
      <span>Exclude top clusters: <strong>{$params.ignoreTopN}</strong></span>
      <input
        type="range"
        min="0"
        max={$excludeTopMax}
        step="1"
        bind:value={$params.ignoreTopN}
        onpointerdown={onScrubStart}
        onpointerup={onScrubEnd}
        onpointercancel={onScrubEnd}
        onblur={onScrubEnd}
      />
    </label>
    <label
      title="Merge clusters closer than this perceptual distance (OKLab ΔE)"
    >
      <span
        >Color merge threshold (ΔE OKLab): <strong
          >{$params.mergeThreshold.toFixed(2)}</strong
        ></span
      >
      <input
        type="range"
        min="0"
        max="0.1"
        step="0.01"
        bind:value={$params.mergeThreshold}
        onpointerdown={onScrubStart}
        onpointerup={onScrubEnd}
        onpointercancel={onScrubEnd}
        onblur={onScrubEnd}
      />
    </label>
    <label title="Scale of chart marker symbols">
      <span>Symbol size: <strong>{$params.symbolScale.toFixed(1)}</strong></span
      >
      <input
        type="range"
        min="0.5"
        max="2"
        step="0.1"
        bind:value={$params.symbolScale}
        onpointerdown={onScrubStart}
        onpointerup={onScrubEnd}
        onpointercancel={onScrubEnd}
        onblur={onScrubEnd}
      />
    </label>
    <label class="choice" title="Draw an outline around each cluster marker">
      <input type="checkbox" bind:checked={$params.showClusterOutline} />
      Cluster outline
    </label>
    <label class="choice" title="Show axis labels on polar and scatter charts">
      <input type="checkbox" bind:checked={$params.showAxisLabels} />
      Axis labels
    </label>
    <label
      class="choice"
      title="Snap chart markers to actual sampled pixels rather than computed centroids"
    >
      <input type="checkbox" bind:checked={$params.snapToReal} />
      Snap to real pixels
    </label>
  </div>
</section>

<style>
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

  .number-input {
    margin-top: 8px;
    width: 120px;
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid var(--line);
    font: inherit;
  }

  .choice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
</style>
