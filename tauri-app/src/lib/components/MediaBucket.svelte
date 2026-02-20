<script lang="ts">
  import { images, activeImageId, switchToFile, switchToVideo, removeFile } from '../stores/ui';

  function isVideoName(name: string): boolean {
    return /\.mp4$/i.test(name);
  }

  function handleClick(id: string) {
    const entry = $images.find((item) => item.id === id);
    if (entry && isVideoName(entry.name)) {
      switchToVideo(id);
    } else {
      switchToFile(id);
    }
  }

  function handleRemove(event: MouseEvent, id: string) {
    event.stopPropagation();
    removeFile(id);
  }

  function handleKeydown(event: KeyboardEvent, id: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(id);
    }
  }
</script>

{#if $images.length === 0}
  <div class="media-bucket__empty">No items yet.</div>
{:else}
  <div class="media-bucket__grid">
    {#each $images as item (item.id)}
      <div
        class="media-bucket__item"
        class:active={item.id === $activeImageId}
        onclick={() => handleClick(item.id)}
        onkeydown={(e) => handleKeydown(e, item.id)}
        role="button"
        tabindex="0"
        title={item.name}
      >
        {#if item.previewUrl}
          <img src={item.previewUrl} alt={item.name} />
        {:else}
          <div class="media-bucket__placeholder">{item.name.slice(0, 3)}</div>
        {/if}
        <button
          class="media-bucket__remove"
          onclick={(e) => handleRemove(e, item.id)}
          aria-label="Remove {item.name}"
        >&times;</button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .media-bucket__empty {
    font-size: 13px;
    color: rgba(33, 33, 32, 0.5);
  }

  .media-bucket__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .media-bucket__item {
    position: relative;
    aspect-ratio: 1;
    border: 2px solid transparent;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    background: rgba(33, 33, 32, 0.06);
    display: grid;
    place-items: center;
    transition: border-color 0.15s ease;
  }

  .media-bucket__item:hover {
    border-color: rgba(33, 33, 32, 0.3);
  }

  .media-bucket__item.active {
    border-color: var(--accent);
  }

  .media-bucket__item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .media-bucket__placeholder {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: rgba(33, 33, 32, 0.5);
    user-select: none;
  }

  .media-bucket__remove {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: none;
    background: rgba(33, 33, 32, 0.7);
    color: #fff;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    display: grid;
    place-items: center;
    padding: 0;
    opacity: 0;
    transition: opacity 0.15s ease;
  }

  .media-bucket__item:hover .media-bucket__remove {
    opacity: 1;
  }

  .media-bucket__remove:hover {
    background: rgba(180, 40, 40, 0.85);
  }
</style>
