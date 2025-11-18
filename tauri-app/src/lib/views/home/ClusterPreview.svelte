<script lang="ts">
  import type { AnalysisResult, AnalysisCluster } from '../../stores/ui';

  export let result: AnalysisResult;
  export let clusters: AnalysisCluster[];
</script>

<section class="preview">
  <header class="preview-header">
    <h2>Cluster Preview</h2>
    <span class="metrics">
      {Math.round(result.durationMs)} ms · {result.iterations} iterations ·
      {result.totalSamples.toLocaleString()} samples
    </span>
  </header>
  <ul class="cluster-list">
    {#if clusters.length === 0}
      <li class="placeholder">No clusters returned</li>
    {:else}
      {#each clusters as cluster, idx}
        <li>
          <span class="rank">#{idx + 1}</span>
          <span
            class="swatch"
            style={`background: rgb(${cluster.rgb.r}, ${cluster.rgb.g}, ${cluster.rgb.b})`}
            aria-hidden="true"
          ></span>
          <span class="share">{(cluster.share * 100).toFixed(1)}%</span>
          <span class="count">{cluster.count.toLocaleString()} px</span>
        </li>
      {/each}
    {/if}
  </ul>
</section>

<style>
  .preview {
    margin-top: 28px;
    padding: 20px;
    border-radius: 12px;
    background: var(--color-surface);
    box-shadow: var(--elev-1);
  }

  .preview-header {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 16px;
  }

  .preview-header h2 {
    margin: 0;
    font-size: 18px;
  }

  .preview-header .metrics {
    font-size: 13px;
    color: var(--color-ink-muted);
  }

  .cluster-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 10px;
  }

  .cluster-list li {
    display: grid;
    grid-template-columns: 32px 32px 80px 1fr;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid var(--color-border-muted);
    border-radius: 10px;
    background: rgba(0, 0, 0, 0.02);
  }

  .cluster-list li.placeholder {
    text-align: center;
    color: var(--color-ink-muted);
  }

  .rank {
    font-weight: 600;
    color: var(--color-ink-strong);
  }

  .swatch {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  .share {
    font-weight: 600;
  }

  .count {
    justify-self: end;
    font-size: 13px;
    color: var(--color-ink-muted);
  }
</style>
