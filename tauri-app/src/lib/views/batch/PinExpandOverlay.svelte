<script lang="ts">
  import { onMount } from 'svelte';
  import type { ImageEntry } from '../../stores/image';

  interface Props {
    image: ImageEntry;
    onUnpin: () => void;
    onClose: () => void;
  }

  let { image, onUnpin, onClose }: Props = $props();

  onMount(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

  function handleBackdropClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return;
    onClose();
  }

  function handleBackdropKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    onClose();
  }
</script>

<div
  class="pin-overlay"
  role="dialog"
  aria-modal="true"
  aria-label="Pin preview"
  tabindex="-1"
  onclick={handleBackdropClick}
  onkeydown={handleBackdropKeydown}
>
  <div class="pin-card">
    {#if image.previewUrl}
      <img src={image.previewUrl} alt={image.name} />
    {:else}
      <div class="pin-card__placeholder">{image.name}</div>
    {/if}
    <p class="pin-card__name">{image.name}</p>
    <div class="pin-card__actions">
      <button type="button" class="unpin-btn" onclick={onUnpin}>Unpin</button>
      <button type="button" class="close-btn" onclick={onClose}>Close</button>
    </div>
  </div>
</div>

<style>
  .pin-overlay {
    position: fixed;
    inset: 0;
    background: rgba(26, 24, 22, 0.6);
    display: grid;
    place-items: center;
    z-index: 30;
  }

  .pin-card {
    background: var(--panel, #fff);
    border-radius: 12px;
    padding: 16px;
    max-width: min(90vw, 480px);
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    gap: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  }

  .pin-card img {
    max-width: 100%;
    max-height: 60vh;
    object-fit: contain;
    display: block;
    border-radius: 6px;
    background: rgba(0, 0, 0, 0.04);
  }

  .pin-card__placeholder {
    width: 320px;
    height: 240px;
    display: grid;
    place-items: center;
    background: rgba(0, 0, 0, 0.04);
    border-radius: 6px;
    color: rgba(33, 33, 32, 0.5);
    font-size: 13px;
    text-align: center;
    padding: 8px;
    word-break: break-all;
  }

  .pin-card__name {
    margin: 0;
    font-size: 13px;
    color: rgba(33, 33, 32, 0.8);
    word-break: break-all;
  }

  .pin-card__actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  .unpin-btn {
    background: var(--accent, #824c32);
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 10px 18px;
    cursor: pointer;
  }

  .unpin-btn:hover {
    opacity: 0.9;
  }

  .close-btn {
    background: transparent;
    color: rgba(33, 33, 32, 0.7);
    border: 1px solid rgba(33, 33, 32, 0.2);
    border-radius: 6px;
    padding: 10px 18px;
    cursor: pointer;
  }

  .close-btn:hover {
    background: rgba(33, 33, 32, 0.05);
  }
</style>
