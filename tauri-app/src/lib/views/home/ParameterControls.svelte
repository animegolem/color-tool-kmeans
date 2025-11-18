<script lang="ts">
  import { params } from '../../stores/ui';
</script>

<section class="controls">
  <h2>Parameters</h2>
  <div class="grid">
    <label>
      <span>Clusters</span>
      <input type="number" min="1" max="400" bind:value={$params.clusters} />
    </label>
    <label>
      <span>Stride</span>
      <input type="number" min="1" max="16" bind:value={$params.stride} />
    </label>
    <label>
      <span>Min. luminosity</span>
      <input type="number" min="0" max="255" bind:value={$params.minLum} />
    </label>
    <label>
      <span>Color space</span>
      <select bind:value={$params.colorSpace}>
        <option value="RGB">RGB</option>
        <option value="HSL">HSL</option>
        <option value="YUV">YUV</option>
        <option value="CIELAB">CIELAB</option>
        <option value="CIELUV">CIELUV</option>
      </select>
    </label>
    <label>
      <span>Axis</span>
      <select bind:value={$params.axis}>
        <option value="HSL">HSL</option>
        <option value="HLS">HLS</option>
      </select>
    </label>
    <label>
      <span>Symbol scale</span>
      <input type="number" min="0.5" max="2" step="0.1" bind:value={$params.symbolScale} />
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

  input,
  select {
    padding: 8px 10px;
    border: 1px solid var(--line);
    border-radius: 6px;
    font: inherit;
    background: #fff;
  }
</style>
