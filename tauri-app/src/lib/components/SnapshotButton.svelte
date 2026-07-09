<script lang="ts">
  interface Props {
    onCapture: () => void;
    disabled?: boolean;
  }

  let { onCapture, disabled = false }: Props = $props();

  const cameraIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="13" r="4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function handleClick(event: MouseEvent) {
    event.stopPropagation();
    if (disabled) return;
    onCapture();
  }
</script>

<button
  type="button"
  class="snapshot-btn"
  {disabled}
  aria-label="Capture current frame to media bucket"
  title="Capture frame to library"
  onclick={handleClick}
>
  {@html cameraIcon}
</button>

<style>
  .snapshot-btn {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: rgba(33, 33, 32, 0.55);
    color: #fff;
    display: grid;
    place-items: center;
    padding: 0;
    cursor: pointer;
    opacity: 0.55;
    transition:
      opacity 0.15s ease,
      background 0.15s ease;
  }

  .snapshot-btn:hover:not(:disabled) {
    opacity: 1;
    background: var(--accent, #824c32);
  }

  .snapshot-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .snapshot-btn :global(svg) {
    display: block;
  }
</style>
