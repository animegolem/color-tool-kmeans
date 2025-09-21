<script lang="ts">
  import { selectedFile, params } from '../stores/ui';
</script>

<section class="graphs">
  <header>
    <h1>Graphs</h1>
    <p class="note">Polar chart and palette visualizations will appear here once analysis runs.</p>
  </header>

  {#if $selectedFile}
    <div class="summary">
      <p><strong>File:</strong> {$selectedFile.name}</p>
      <p><strong>Clusters:</strong> {$params.clusters}</p>
      <p><strong>Color space:</strong> {$params.colorSpace}</p>
    </div>
  {:else}
    <div class="empty">Select an image to enable charts.</div>
  {/if}

  <div class="placeholder">
    <p>Chart placeholder</p>
  </div>
</section>

<style>
  .graphs {
    max-width: 900px;
  }

  .summary {
    display: flex;
    gap: 32px;
    margin-bottom: 16px;
  }

  .empty {
    padding: 16px;
    border-radius: 8px;
    background: var(--panel);
    color: rgba(33, 33, 32, 0.6);
  }

  .placeholder {
    margin-top: 24px;
    min-height: 320px;
    border-radius: 12px;
    border: 1px dashed var(--line);
    display: grid;
    place-items: center;
    color: rgba(33, 33, 32, 0.6);
  }
</style>
