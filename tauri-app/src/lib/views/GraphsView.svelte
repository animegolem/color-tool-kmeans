<script lang="ts">
  import { get } from 'svelte/store';
  import {
    analysisResult,
    analysisState,
    params,
    selectedFile,
    topClusters,
    type AnalysisCluster
  } from '../stores/ui';
  import { generateCircleGraphSvg } from '../exports/polar-chart';

  const file = $derived.by(() => get(selectedFile));
  const result = $derived.by(() => get(analysisResult));
  const status = $derived.by(() => get(analysisState));
  const paramSnapshot = $derived.by(() => get(params));
  const palette = $derived.by(() => get(topClusters));
  const metrics = $derived.by(() => {
    if (!result) return null;
    return [
      { label: 'Duration', value: Number.isFinite(result.durationMs) ? `${result.durationMs.toFixed(0)} ms` : '—' },
      {
        label: 'Samples',
        value: typeof result.totalSamples === 'number' ? result.totalSamples.toLocaleString() : '—'
      },
      { label: 'Iterations', value: typeof result.iterations === 'number' ? result.iterations : '—' },
      { label: 'Variant', value: result.variant ?? 'native' }
    ];
  });

  let graphSvg = $state<string | null>(null);

  $effect(() => {
    if (!result) {
      graphSvg = null;
      return;
    }
    const { svg } = generateCircleGraphSvg(result.clusters, {
      axisType: paramSnapshot.axis,
      symbolScale: paramSnapshot.symbolScale,
      showAxisLabels: true
    });
    graphSvg = svg;
  });

  function rgbToHex(rgb: AnalysisCluster['rgb']): string {
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
  }

  function toHex(value: number): string {
    return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  }

  function percent(value: number): string {
    if (!Number.isFinite(value)) return '0%';
    return `${(value * 100).toFixed(2)}%`;
  }

  function rgbCss(rgb: AnalysisCluster['rgb']): string {
    return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  }
</script>

<section class="graphs">
  <header>
    <h1>Graphs</h1>
    <p class="note">Circle graph and palette preview update whenever analysis completes.</p>
  </header>

  {#if !file}
    <div class="empty-panel">
      <p>Select an image on the Home view to enable charts.</p>
    </div>
  {:else if status !== 'ready' || !result}
    <div class="empty-panel">
      <p>Run analysis on the Home view to populate the graphs.</p>
    </div>
  {:else}
    <div class="summary">
      <p><strong>File:</strong> {file?.name}</p>
      <p><strong>Clusters:</strong> {result.clusters.length}</p>
      <p><strong>Axis:</strong> {paramSnapshot.axis}</p>
      <p><strong>Symbol scale:</strong> {paramSnapshot.symbolScale.toFixed(1)}</p>
    </div>
    {#if metrics}
      <div class="metrics" role="list">
        {#each metrics as metric}
          <div role="listitem">
            <p class="metric-label">{metric.label}</p>
            <p class="metric-value">{metric.value}</p>
          </div>
        {/each}
      </div>
    {/if}

    <div class="graph-layout">
      <figure class="graph-card" aria-labelledby="circle-graph-title">
        <div class="graph-frame" role="img" aria-label="Circle graph showing hue distribution">
          {#if graphSvg}
            <div class="graph-svg" aria-hidden="true">{@html graphSvg}</div>
          {:else}
            <p class="note">Preparing preview…</p>
          {/if}
        </div>
        <figcaption id="circle-graph-title">
          Native clusters rendered in polar coordinates. Axis and symbol scale mirror the Parameters panel.
        </figcaption>
      </figure>

      <section class="palette-card" aria-label="Top palette colors" role="list">
        <header>
          <h2>Top Palette</h2>
          <p class="note">Up to 8 clusters ranked by share.</p>
        </header>
        {#if palette.length === 0}
          <p class="empty-state">Palette preview unavailable.</p>
        {:else}
          <div class="palette-grid">
            {#each palette as cluster, index (cluster.rgb.r + cluster.rgb.g + cluster.rgb.b + index)}
              <div class="palette-row" role="listitem">
                <span class="swatch" style={`--swatch-color:${rgbCss(cluster.rgb)}`}></span>
                <div class="swatch-meta">
                  <div class="row-header">
                    <p class="hex">{rgbToHex(cluster.rgb)}</p>
                    <p class="rank">#{index + 1}</p>
                  </div>
                  <p class="details">
                    {cluster.count.toLocaleString()} px · {percent(cluster.share)}
                  </p>
                  <div class="share-bar" aria-hidden="true">
                    <div class="share-fill" style={`--share:${Math.min(Math.max(cluster.share, 0), 1)}`}></div>
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</section>

<style>
  .graphs {
    max-width: 1100px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .summary {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    background: var(--panel);
    border-radius: 12px;
    padding: 16px 20px;
    box-shadow: var(--shadow);
  }

  .summary p {
    margin: 0;
    font-size: 14px;
  }

  .graph-layout {
    display: grid;
    grid-template-columns: minmax(320px, 620px) minmax(260px, 1fr);
    gap: 24px;
  }

  .metrics {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
    margin-bottom: 8px;
  }

  .metrics div {
    background: rgba(255, 255, 255, 0.7);
    border-radius: 10px;
    padding: 12px 14px;
    border: 1px solid rgba(33, 33, 32, 0.12);
  }

  .metric-label {
    margin: 0;
    font-size: 12px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: rgba(33, 33, 32, 0.6);
  }

  .metric-value {
    margin: 4px 0 0 0;
    font-size: 16px;
    font-weight: 600;
  }

  .graph-card {
    margin: 0;
    background: var(--panel);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .graph-frame {
    border: 1px solid var(--line);
    border-radius: 16px;
    padding: 12px;
    background: #fff;
    min-height: 360px;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .graph-svg :global(svg) {
    width: 100%;
    height: auto;
    max-width: 560px;
    display: block;
  }

  figcaption {
    margin: 0;
    font-size: 13px;
    color: rgba(33, 33, 32, 0.65);
  }

  .palette-card {
    background: var(--panel);
    border-radius: 16px;
    padding: 20px;
    box-shadow: var(--shadow);
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .palette-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .palette-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: 1px solid rgba(33, 33, 32, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.6);
  }

  .swatch {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    border: 1px solid rgba(33, 33, 32, 0.2);
    background: var(--swatch-color);
  }

  .swatch-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .row-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
  }

  .hex {
    margin: 0;
    font-weight: 600;
  }

  .rank {
    margin: 0;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 999px;
    border: 1px solid rgba(33, 33, 32, 0.16);
  }

  .details {
    margin: 0;
    font-size: 13px;
    color: rgba(33, 33, 32, 0.7);
  }

  .share-bar {
    width: 100%;
    height: 6px;
    border-radius: 999px;
    background: rgba(33, 33, 32, 0.08);
    overflow: hidden;
  }

  .share-fill {
    height: 100%;
    width: calc(var(--share, 0) * 100%);
    background: var(--accent, #866051);
  }

  .empty-panel,
  .empty-state {
    padding: 18px;
    border-radius: 12px;
    background: var(--panel);
    color: rgba(33, 33, 32, 0.65);
    border: 1px dashed var(--line);
  }

  @media (max-width: 980px) {
    .graph-layout {
      grid-template-columns: 1fr;
    }
  }
</style>
