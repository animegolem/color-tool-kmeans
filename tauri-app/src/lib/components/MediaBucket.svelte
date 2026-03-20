<script lang="ts">
  import { images, activeImageId, currentView, switchToFile, switchToVideo, removeFile, clearFile } from '../stores/ui';
  import { pinnedImageIds, togglePin, clearPins } from '../stores/multi-analysis';
  import type { ImageEntry } from '../stores/image';

  const imageIcon = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.33333 35H31.6667C33.5076 35 35 33.5076 35 31.6667V8.33333C35 6.49238 33.5076 5 31.6667 5H8.33333C6.49238 5 5 6.49238 5 8.33333V31.6667C5 33.5076 6.49238 35 8.33333 35ZM8.33333 35L26.6667 16.6667L35 25M16.6667 14.1667C16.6667 15.5474 15.5474 16.6667 14.1667 16.6667C12.786 16.6667 11.6667 15.5474 11.6667 14.1667C11.6667 12.786 12.786 11.6667 14.1667 11.6667C15.5474 11.6667 16.6667 12.786 16.6667 14.1667Z" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const videoIcon = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30.6667 9.33329L21.3334 16L30.6667 22.6666V9.33329Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.6667 6.66663H4.00004C2.52728 6.66663 1.33337 7.86053 1.33337 9.33329V22.6666C1.33337 24.1394 2.52728 25.3333 4.00004 25.3333H18.6667C20.1395 25.3333 21.3334 24.1394 21.3334 22.6666V9.33329C21.3334 7.86053 20.1395 6.66663 18.6667 6.66663Z" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  let pinnedCount = $derived([...$pinnedImageIds].length);
  let lastPinnedId = $state<string | null>(null);

  function handleClick(id: string) {
    const entry = $images.find((item) => item.id === id);
    if (!entry) return;
    if (entry.videoPath && $currentView === 'exports') return;
    if (entry.videoPath) {
      switchToVideo(id);
    } else {
      switchToFile(id);
    }
  }

  function handleRemove(event: MouseEvent, id: string) {
    event.stopPropagation();
    removeFile(id);
  }

  function handlePin(event: MouseEvent, id: string) {
    event.stopPropagation();
    if (event.shiftKey && lastPinnedId) {
      const items = $images;
      const lastIdx = items.findIndex((item) => item.id === lastPinnedId);
      const curIdx = items.findIndex((item) => item.id === id);
      if (lastIdx >= 0 && curIdx >= 0) {
        const lo = Math.min(lastIdx, curIdx);
        const hi = Math.max(lastIdx, curIdx);
        for (let i = lo; i <= hi; i++) {
          if (!isRawVideo(items[i]) && !$pinnedImageIds.has(items[i].id)) {
            togglePin(items[i].id);
          }
        }
        lastPinnedId = id;
        return;
      }
    }
    togglePin(id);
    lastPinnedId = id;
  }

  function isRawVideo(item: ImageEntry): boolean {
    return !!item.videoPath && !item.frameTimestamp;
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
        class:pinned={$pinnedImageIds.has(item.id)}
        class:dimmed={($currentView === 'settings' && item.id !== $activeImageId) || (($currentView === 'exports' || $currentView === 'batch') && !!item.videoPath)}
        class:inert={($currentView === 'exports' || $currentView === 'batch') && !!item.videoPath}
        onclick={() => handleClick(item.id)}
        onkeydown={(e) => handleKeydown(e, item.id)}
        role="button"
        tabindex="0"
        title={item.name}
      >
        {#if item.previewUrl}
          <img src={item.previewUrl} alt={item.name} />
          <span class="media-bucket__badge">
            {#if item.videoPath}
              {@html videoIcon}
            {:else}
              {@html imageIcon}
            {/if}
          </span>
        {:else}
          <div class="media-bucket__placeholder">{item.name.slice(0, 3)}</div>
        {/if}
        <button
          class="media-bucket__pin"
          class:pinned={$pinnedImageIds.has(item.id)}
          onclick={(e) => handlePin(e, item.id)}
          disabled={isRawVideo(item)}
          aria-label={$pinnedImageIds.has(item.id) ? `Unpin ${item.name}` : `Pin ${item.name}`}
        >{$pinnedImageIds.has(item.id) ? '\u{1F4CC}' : '\u25CB'}</button>
        <button
          class="media-bucket__remove"
          onclick={(e) => handleRemove(e, item.id)}
          aria-label="Remove {item.name}"
        >&times;</button>
      </div>
    {/each}
  </div>
  {#if pinnedCount > 0}
    <div class="media-bucket__pin-footer">
      <span>{pinnedCount} pinned</span>
      <button class="media-bucket__clear-pins" onclick={clearPins}>Clear pins</button>
    </div>
  {/if}
  {#if $images.length > 1}
    <button class="media-bucket__clear-all" onclick={clearFile}>
      Clear All
    </button>
  {/if}
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

  .media-bucket__item.dimmed {
    opacity: 0.5;
  }

  .media-bucket__item.inert {
    pointer-events: none;
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

  .media-bucket__badge {
    position: absolute;
    bottom: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    opacity: 0.5;
    color: #fff;
    pointer-events: none;
    filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.5));
  }

  .media-bucket__badge :global(svg) {
    width: 100%;
    height: 100%;
  }

  .media-bucket__item.pinned {
    border-left: 3px solid var(--accent);
  }

  .media-bucket__pin {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
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
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
  }

  .media-bucket__pin.pinned {
    opacity: 1;
    color: #fff;
    background: rgba(33, 33, 32, 0.85);
  }

  .media-bucket__item:hover .media-bucket__pin {
    opacity: 1;
  }

  .media-bucket__pin:disabled {
    opacity: 0.2;
    pointer-events: none;
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

  .media-bucket__clear-all {
    display: block;
    margin: 6px auto 0;
    padding: 4px 10px;
    border: 1px solid var(--accent);
    border-radius: 6px;
    background: transparent;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;
  }

  .media-bucket__clear-all:hover {
    background: var(--accent);
    color: #fff;
  }

  .media-bucket__pin-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
    padding: 0 2px;
    font-size: 12px;
    color: rgba(33, 33, 32, 0.6);
  }

  .media-bucket__clear-pins {
    border: none;
    background: none;
    color: var(--accent);
    font-size: 12px;
    cursor: pointer;
    padding: 0;
  }

  .media-bucket__clear-pins:hover {
    text-decoration: underline;
  }
</style>
