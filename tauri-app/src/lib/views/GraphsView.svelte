<script lang="ts">
  import { get } from 'svelte/store';
  import { analysisError, analysisResult, analysisState, params, selectedFile } from '../stores/ui';
  import { generateCircleGraphSvg } from '../exports/polar-chart';

  const file = $derived.by(() => get(selectedFile));
  const analysisParams = $derived.by(() => get(params));
  const result = $derived.by(() => get(analysisResult));
  const status = $derived.by(() => get(analysisState));
  const error = $derived.by(() => get(analysisError));

  const circleGraph = $derived.by(() => {
    if (!result) return null;
    return generateCircleGraphSvg(result.clusters, {
      symbolScale: analysisParams.symbolScale,
      showAxisLabels: analysisParams.showAxisLabels,
      showStroke: analysisParams.showClusterOutline,
      showGamutBackground: analysisParams.showGamutBackground,
      size: 520
    });
  });

  const palette = $derived.by(() => (result ? result.clusters.slice(0, 12) : []));
</script>

<section class="graphs">
  <header>
    <h1>Graphs</h1>
    <p class="note">Polar chart and palette visualizations for the current analysis.</p>
  </header>

  {#if file && result}
    <div class="summary">
      <p><strong>File:</strong> {file?.name}</p>
      <p><strong>Clusters:</strong> {analysisParams?.clusters}</p>
      <p><strong>Quality:</strong> {analysisParams?.quality}</p>
      <p><strong>Exclude top:</strong> {analysisParams?.ignoreTopN}</p>
      <p><strong>Samples:</strong> {result.totalSamples.toLocaleString()}</p>
    </div>

    <div class="grid">
      <article class="card">
        <header class="card-header">
          <h2>Polar Chart</h2>
          <span>Hue · Chroma</span>
        </header>
        {#if circleGraph}
          <div class="graph" role="img" aria-label="OKLCH polar chart">
            {@html circleGraph.svg}
          </div>
        {:else}
          <div class="empty">Chart unavailable.</div>
        {/if}
      </article>
      <article class="card">
        <header class="card-header">
          <h2>Palette</h2>
          <span>Top clusters</span>
        </header>
        {#if palette.length === 0}
          <div class="empty">No clusters available.</div>
        {:else}
          <ol class="palette">
            {#each palette as cluster, idx}
              <li>
                <span class="rank">#{idx + 1}</span>
                <span
                  class="swatch"
                  style={`background: rgb(${cluster.rgb.r}, ${cluster.rgb.g}, ${cluster.rgb.b})`}
                  aria-hidden="true"
                ></span>
                <span class="share">{(cluster.share * 100).toFixed(1)}%</span>
              </li>
            {/each}
          </ol>
        {/if}
      </article>
    </div>
  {:else if file && status === 'pending'}
    <div class="empty">Analysis in progress…</div>
  {:else if status === 'error'}
    <div class="empty">Analysis failed. {error ?? 'Unknown error.'}</div>
  {:else}
    <div class="empty">Select an image to enable charts.</div>
  {/if}
</section>

<style>
  .graphs {
    max-width: 900px;
  }

  .summary {
    display: flex;
    gap: 32px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }

  .grid {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.8fr);
    gap: 24px;
    align-items: start;
  }

  .card {
    background: var(--panel);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow);
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    margin-bottom: 12px;
  }

  .card-header span {
    font-size: 12px;
    opacity: 0.7;
  }

  .graph {
    width: 100%;
  }

  .graph :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .palette {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 8px;
  }

  .palette li {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 8px;
    border-radius: 8px;
    background: rgba(33, 33, 32, 0.06);
  }

  .rank {
    font-size: 12px;
    opacity: 0.6;
    width: 28px;
  }

  .swatch {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 1px solid rgba(0, 0, 0, 0.1);
  }

  .share {
    font-variant-numeric: tabular-nums;
    margin-left: auto;
  }

  .empty {
    padding: 16px;
    border-radius: 8px;
    background: var(--panel);
    color: rgba(33, 33, 32, 0.6);
  }

  @media (max-width: 900px) {
    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>
