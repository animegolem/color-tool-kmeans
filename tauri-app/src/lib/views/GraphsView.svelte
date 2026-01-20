<script lang="ts">
  import type { AnalysisParams, AnalysisResult, AnalysisState, SelectedImage } from '../stores/ui';
  import { analysisError, analysisResult, analysisState, params, selectedFile } from '../stores/ui';
  import { generateCircleGraphSvg } from '../exports/polar-chart';
  import { generateHueLightnessSvg } from '../exports/hue-lightness';

  let file = $state<SelectedImage | null>(null);
  let analysisParams = $state<AnalysisParams | null>(null);
  let result = $state<AnalysisResult | null>(null);
  let status = $state<AnalysisState>('idle');
  let error = $state<string | null>(null);

  let viewMode = $state<'polar' | 'hue-lightness'>('polar');

  const chart = $derived.by(() => {
    if (!result || !analysisParams) return null;
    if (viewMode === 'hue-lightness') {
      return generateHueLightnessSvg(result.clusters, {
        symbolScale: analysisParams.symbolScale,
        showAxisLabels: analysisParams.showAxisLabels,
        showStroke: analysisParams.showClusterOutline,
        sizeMode: analysisParams.hueLightnessSizeMode,
        useGradient: analysisParams.useGradientOverlay,
        width: 520,
        height: 360
      });
    }
    return generateCircleGraphSvg(result.clusters, {
      symbolScale: analysisParams.symbolScale,
      showAxisLabels: analysisParams.showAxisLabels,
      showStroke: analysisParams.showClusterOutline,
      showGamutBackground: analysisParams.showGamutBackground,
      showPaletteMask: analysisParams.showPaletteMask,
      useHsl: analysisParams.useHslPolar,
      useGradient: analysisParams.useGradientOverlay,
      size: 520
    });
  });

  const palette = $derived.by(() => (result ? result.clusters.slice(0, 12) : []));

  $effect(() => {
    const unsubs = [
      selectedFile.subscribe((value) => {
        file = value;
	      }),
	      params.subscribe((value) => {
	        analysisParams = { ...value };
	      }),
	      analysisResult.subscribe((value) => {
	        result = value;
	      }),
      analysisState.subscribe((value) => {
        status = value;
      }),
      analysisError.subscribe((value) => {
        error = value;
      })
    ];
    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  });
</script>

<section class="graphs">
  <header>
    <h1>Graphs</h1>
    <p class="note">Polar chart and palette visualizations for the current analysis (experimental).</p>
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
          <div>
            <h2>{viewMode === 'polar' ? 'Polar Chart' : 'Hue × Lightness'}</h2>
            <span>{viewMode === 'polar' ? 'Hue · Chroma' : 'Hue · Lightness'}</span>
          </div>
          <div class="view-toggle">
            <button
              type="button"
              class:active={viewMode === 'polar'}
              onclick={() => (viewMode = 'polar')}
            >
              Polar
            </button>
            <button
              type="button"
              class:active={viewMode === 'hue-lightness'}
              onclick={() => (viewMode = 'hue-lightness')}
            >
              Hue × Lightness
            </button>
          </div>
        </header>
        {#if chart}
          <div class="graph" role="img" aria-label="OKLCH chart">
            {@html chart.svg}
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
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .card-header span {
    font-size: 12px;
    opacity: 0.7;
  }

  .view-toggle {
    display: inline-flex;
    gap: 6px;
    background: rgba(33, 33, 32, 0.08);
    border-radius: 999px;
    padding: 4px;
  }

  .view-toggle button {
    border: none;
    background: transparent;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    color: rgba(33, 33, 32, 0.7);
  }

  .view-toggle button.active {
    background: var(--accent);
    color: #fff;
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
