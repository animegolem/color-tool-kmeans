<script lang="ts">
  import FigureFrame from '../components/study/FigureFrame.svelte';

  interface Props {
    onExampleAction?: (key: 'inspect-palette') => void;
  }

  let { onExampleAction }: Props = $props();

  function inspectPalette() {
    onExampleAction?.('inspect-palette');
  }
</script>

<main data-study-surface>
  <div class="study-showcase">
    <header class="study-showcase__intro">
      <p class="study-showcase__kicker">
        Isolated development surface · no live analysis
      </p>
      <h1>Flat study figures with native controls.</h1>
      <p class="study-showcase__summary">
        This page proves the reusable figure frame, responsive stacking, and
        keyboard-operable native controls without mounting the shipping shell.
      </p>
    </header>

    <section class="study-showcase__grid" aria-label="Study figure examples">
      <FigureFrame title="Hue and chroma distribution">
        {#snippet controls()}
          <fieldset class="study-controls">
            <legend>Figure controls</legend>
            <label class="study-field">
              <span
                >Palette size with a deliberately long descriptive label</span
              >
              <select aria-label="Illustrative palette size">
                <option>8 colors</option>
                <option selected>12 colors</option>
                <option>16 colors</option>
              </select>
            </label>
            <label class="study-field">
              <span>Illustrative sample balance</span>
              <input
                type="range"
                min="0"
                max="10"
                value="6"
                aria-label="Illustrative sample balance"
              />
            </label>
            <label class="study-check">
              <input type="checkbox" checked />
              <span>Show reference palette markers</span>
            </label>
          </fieldset>
        {/snippet}

        {#snippet content()}
          <div
            class="study-plot"
            role="img"
            aria-label="Illustrative hue and chroma distribution"
          >
            <span
              class="study-plot__point"
              style="--study-point-x: 27%; --study-point-y: 38%; --study-point-size: 2.5rem; --study-point-color: #c66042"
            ></span>
            <span
              class="study-plot__point"
              style="--study-point-x: 67%; --study-point-y: 29%; --study-point-size: 1.75rem; --study-point-color: #e0a020"
            ></span>
            <span
              class="study-plot__point"
              style="--study-point-x: 61%; --study-point-y: 71%; --study-point-size: 3.25rem; --study-point-color: #365b68"
            ></span>
          </div>
        {/snippet}

        {#snippet caption()}
          Illustrative geometry only · no source identity or result authority
        {/snippet}
      </FigureFrame>

      <FigureFrame title="Palette proportions and study notes">
        {#snippet content()}
          <div
            class="study-proportions"
            role="img"
            aria-label="Illustrative palette proportions"
          >
            <span
              class="study-proportions__bar"
              style="--study-share: 92; --study-swatch: #9f4b36"
            ></span>
            <span
              class="study-proportions__bar"
              style="--study-share: 68; --study-swatch: #df9159"
            ></span>
            <span
              class="study-proportions__bar"
              style="--study-share: 47; --study-swatch: #e8c477"
            ></span>
            <span
              class="study-proportions__bar"
              style="--study-share: 31; --study-swatch: #2f5961"
            ></span>
          </div>

          <details>
            <summary
              >Analysis notes with a deliberately long disclosure label</summary
            >
            <p>
              These marks are fixed demonstration data. They do not claim a
              current source, active job, saved result, or available recovery
              action.
            </p>
            <button type="button" onclick={inspectPalette}>
              Inspect illustrative palette
            </button>
          </details>
        {/snippet}
      </FigureFrame>
    </section>

    <footer class="study-showcase__footer">
      Development proof carrier · excluded from the production entry graph
    </footer>
  </div>
</main>
