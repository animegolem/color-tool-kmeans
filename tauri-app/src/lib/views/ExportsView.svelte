<script lang="ts">
  import { selectedFile } from '../stores/ui';

  const file = $derived.by(() => $store(selectedFile));
</script>

<section class="exports">
  <header>
    <h1>Exports</h1>
    <p class="note">Generate PNG/SVG graphs and palette CSV once analysis is available.</p>
  </header>

  {#if file()}
    <div class="cards">
      <article>
        <h2>Circle Graph</h2>
        <p>PNG / SVG with adjustable scale.</p>
        <button disabled>Coming soon</button>
      </article>
      <article>
        <h2>Palette CSV</h2>
        <p>Ranked palette with hue share.</p>
        <button disabled>Coming soon</button>
      </article>
    </div>
  {:else}
    <div class="empty">Select an image to unlock exports.</div>
  {/if}
</section>

<style>
  .cards {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  article {
    flex: 1 1 260px;
    border-radius: 12px;
    background: var(--panel);
    padding: 20px;
    box-shadow: var(--shadow);
  }

  article button {
    margin-top: 12px;
    border: 1px solid var(--line);
    background: transparent;
    padding: 8px 12px;
    border-radius: 6px;
  }

  .empty {
    padding: 16px;
    background: var(--panel);
    border-radius: 8px;
    color: rgba(33, 33, 32, 0.6);
  }
</style>
