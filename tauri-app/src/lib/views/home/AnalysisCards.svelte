<script lang="ts">
  import type { AnalysisResult } from '../../stores/ui';
  import { params } from '../../stores/ui';
  import { openSvgZoom, handleZoomKeydown } from '../../utils/zoom';
  import { openZoomOverlay } from '../../stores/ui';

  interface ChartOutput {
    svg: string;
    width: number;
    height: number;
  }

  interface Props {
    result?: AnalysisResult | null;
    histogram?: ChartOutput | null;
    polarChart?: ChartOutput | null;
    hueLightnessChart?: ChartOutput | null;
    histogramSortLabel?: string;
    showPolarFrame?: boolean;
    showHueLightnessFrame?: boolean;
    showHistogramFrame?: boolean;
    onChartContext?: (
      event: MouseEvent,
      chart: ChartOutput,
      suffix: string
    ) => void;
  }

  let {
    result = null,
    histogram = null,
    polarChart = null,
    hueLightnessChart = null,
    histogramSortLabel = '',
    showPolarFrame = false,
    showHueLightnessFrame = false,
    showHistogramFrame = false,
    onChartContext,
  }: Props = $props();
</script>

{#if histogram || showHistogramFrame}
  <article class="analysis-card">
    <header class="analysis-header">
      <div>
        <h2>Cluster Histogram</h2>
        <span>{histogramSortLabel}</span>
      </div>
      <div class="toggle-group">
        <button
          type="button"
          class:active={$params.histogramSort === 'frequency'}
          onclick={() => ($params.histogramSort = 'frequency')}
        >
          Frequency
        </button>
        <button
          type="button"
          class:active={$params.histogramSort === 'hue'}
          onclick={() => ($params.histogramSort = 'hue')}
        >
          Hue
        </button>
        <button
          type="button"
          class:active={$params.histogramSort === 'lightness'}
          onclick={() => ($params.histogramSort = 'lightness')}
        >
          Lightness
        </button>
      </div>
      {#if result}
        <span class="metrics">
          {Math.round(result.durationMs)} ms · {result.iterations} iterations ·
          {result.totalSamples.toLocaleString()} samples
        </span>
      {/if}
    </header>
    {#if histogram}
      <div
        class="chart zoomable"
        role="button"
        tabindex="0"
        onclick={() =>
          openSvgZoom(
            histogram?.svg,
            histogram?.width,
            histogram?.height,
            openZoomOverlay
          )}
        onkeydown={(event) =>
          handleZoomKeydown(
            event,
            histogram?.svg,
            histogram?.width,
            histogram?.height,
            openZoomOverlay
          )}
        oncontextmenu={(event) =>
          onChartContext?.(event, histogram, 'histogram')}
      >
        {@html histogram.svg}
      </div>
    {:else}
      <div class="chart chart--empty"></div>
    {/if}
  </article>
{/if}

{#if polarChart || showPolarFrame}
  <article class="analysis-card">
    <header class="analysis-header">
      <div>
        <h2>Polar Chart</h2>
        <span
          >{$params.polarMode === 'oklch'
            ? 'Hue · Chroma'
            : 'Hue · Saturation'}</span
        >
      </div>
      <div class="toggle-group">
        <button
          type="button"
          class:active={$params.polarMode === 'oklch'}
          onclick={() => ($params.polarMode = 'oklch')}
        >
          OKLCH
        </button>
        <button
          type="button"
          class:active={$params.polarMode === 'okhsv'}
          onclick={() => ($params.polarMode = 'okhsv')}
        >
          OKHSV
        </button>
        <button
          type="button"
          class:active={$params.polarMode === 'hsv'}
          onclick={() => ($params.polarMode = 'hsv')}
        >
          HSV
        </button>
      </div>
    </header>
    {#if polarChart}
      <div
        class="chart zoomable"
        role="button"
        tabindex="0"
        onclick={() =>
          openSvgZoom(
            polarChart?.svg,
            polarChart?.width,
            polarChart?.height,
            openZoomOverlay
          )}
        onkeydown={(event) =>
          handleZoomKeydown(
            event,
            polarChart?.svg,
            polarChart?.width,
            polarChart?.height,
            openZoomOverlay
          )}
        oncontextmenu={(event) => onChartContext?.(event, polarChart, 'polar')}
      >
        {@html polarChart.svg}
      </div>
    {:else}
      <div class="chart chart--empty"></div>
    {/if}
  </article>
{/if}

{#if hueLightnessChart || showHueLightnessFrame}
  <article class="analysis-card">
    <header class="analysis-header">
      <div>
        <h2>Hue × Lightness</h2>
        <span>Rendered in OKLCH</span>
      </div>
      <div class="toggle-group">
        <button
          type="button"
          class:active={$params.hueLightnessSizeMode === 'chroma'}
          onclick={() => ($params.hueLightnessSizeMode = 'chroma')}
        >
          Chroma
        </button>
        <button
          type="button"
          class:active={$params.hueLightnessSizeMode === 'frequency'}
          onclick={() => ($params.hueLightnessSizeMode = 'frequency')}
        >
          Frequency
        </button>
      </div>
    </header>
    {#if hueLightnessChart}
      <div
        class="chart zoomable"
        role="button"
        tabindex="0"
        onclick={() =>
          openSvgZoom(
            hueLightnessChart?.svg,
            hueLightnessChart?.width,
            hueLightnessChart?.height,
            openZoomOverlay
          )}
        onkeydown={(event) =>
          handleZoomKeydown(
            event,
            hueLightnessChart?.svg,
            hueLightnessChart?.width,
            hueLightnessChart?.height,
            openZoomOverlay
          )}
        oncontextmenu={(event) =>
          onChartContext?.(event, hueLightnessChart, 'hue-lightness')}
      >
        {@html hueLightnessChart.svg}
      </div>
    {:else}
      <div class="chart chart--empty"></div>
    {/if}
  </article>
{/if}

<style>
  .analysis-card {
    background: var(--panel);
    border-radius: 12px;
    padding: 16px;
    box-shadow: var(--shadow);
  }

  .analysis-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 12px;
  }

  .analysis-header span {
    font-size: 12px;
    opacity: 0.7;
  }

  .metrics {
    font-size: 12px;
    opacity: 0.7;
  }

  .toggle-group {
    display: inline-flex;
    gap: 6px;
    background: rgba(33, 33, 32, 0.08);
    border-radius: 999px;
    padding: 4px;
  }

  .toggle-group button {
    border: none;
    background: transparent;
    padding: 6px 12px;
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    color: rgba(33, 33, 32, 0.7);
  }

  .toggle-group button.active {
    background: var(--accent);
    color: #fff;
  }

  .chart :global(svg) {
    width: 100%;
    height: auto;
    display: block;
  }

  .chart--empty {
    min-height: 200px;
  }
</style>
