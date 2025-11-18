<script lang="ts">
  import type { SelectedImage } from '../../stores/ui';

  export let file: SelectedImage | null;
  export let onClear: () => void;
</script>

{#if file}
  <div class="selection">
    <div>
      <strong>Selected file:</strong>
      <span>{file.name}</span>
    </div>
    <button type="button" onclick={onClear}>Clear</button>
  </div>
{:else}
  <div class="selection empty">
    <span>No file selected yet.</span>
  </div>
{/if}

<style>
  .selection {
    margin-top: 24px;
    padding: 16px;
    border-radius: 8px;
    background: var(--panel);
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }

  .selection.empty {
    color: rgba(33, 33, 32, 0.6);
    font-style: italic;
  }

  .selection button {
    border: 1px solid var(--line);
    background: transparent;
    border-radius: 6px;
    padding: 8px 12px;
  }
</style>
